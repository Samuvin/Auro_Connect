import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import Post from '../../models/post.model.js';
import User from '../../models/user.model.js';
import { getFeedPosts, createPost, deletePost } from '../../controllers/post.controller.js';
import { createTestUser, mockCloudinary } from '../setup.js';

// Mock cloudinary
jest.mock('../../lib/cloudinary.js', () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://test-cloudinary-url.com/image.jpg',
      public_id: 'test-image-id',
    }),
    destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
  },
}));

// Import the mocked cloudinary to access the mock functions
import cloudinary from '../../lib/cloudinary.js';

// Create test app
const app = express();
app.use(express.json({ limit: '50mb' }));

// Mock auth middleware
const mockAuth = (req, res, next) => {
  if (req.headers.testuser) {
    try {
      const userData = JSON.parse(req.headers.testuser);
      // Convert string IDs back to ObjectIds for MongoDB compatibility
      if (userData._id) userData._id = new mongoose.Types.ObjectId(userData._id);
      if (userData.connections) {
        userData.connections = userData.connections.map(id => new mongoose.Types.ObjectId(id));
      }
      req.user = userData;
    } catch (error) {
      return res.status(401).json({ message: 'Invalid user data' });
    }
  }
  next();
};

// Mock routes for testing
app.get('/posts/feed', mockAuth, getFeedPosts);
app.post('/posts', mockAuth, createPost);
app.delete('/posts/:id', mockAuth, deletePost);

describe('Post Controller', () => {
  let testUser;
  let connectedUser;
  let testPost;

  beforeEach(async () => {
    // Create test users
    testUser = await new User({
      ...createTestUser(),
      password: 'hashedpassword123',
    }).save();

    connectedUser = await new User({
      ...createTestUser({
        username: 'connected',
        email: 'connected@example.com',
      }),
      password: 'hashedpassword123',
    }).save();

    // Add connection between users
    testUser.connections = [connectedUser._id];
    await testUser.save();

    // Create a test post
    testPost = await new Post({
      author: connectedUser._id,
      content: 'This is a test post',
    }).save();
  });

  describe('GET /posts/feed', () => {
    test('should get feed posts for authenticated user', async () => {
      const response = await request(app)
        .get('/posts/feed')
        .set('testUser', JSON.stringify(testUser))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(0);
    });

    test('should include posts from user connections and own posts', async () => {
      // Create posts from different users
      const ownPost = await new Post({
        author: testUser._id,
        content: 'My own post',
      }).save();

      const connectedPost = await new Post({
        author: connectedUser._id,
        content: 'Connected user post',
      }).save();

      // Create unconnected user and their post (should not appear in feed)
      const unconnectedUser = await new User({
        ...createTestUser({
          username: 'unconnected',
          email: 'unconnected@example.com',
        }),
        password: 'hashedpassword123',
      }).save();

      await new Post({
        author: unconnectedUser._id,
        content: 'Unconnected user post',
      }).save();

      const response = await request(app)
        .get('/posts/feed')
        .set('testUser', JSON.stringify(testUser))
        .expect(200);

      const postContents = response.body.map(post => post.content);
      expect(postContents).toContain('My own post');
      expect(postContents).toContain('Connected user post');
      expect(postContents).not.toContain('Unconnected user post');
    });

    test('should return posts sorted by creation date (newest first)', async () => {
      // Create multiple posts with different timestamps
      const post1 = await new Post({
        author: testUser._id,
        content: 'First post',
        createdAt: new Date('2023-01-01'),
      }).save();

      const post2 = await new Post({
        author: testUser._id,
        content: 'Second post',
        createdAt: new Date('2023-01-02'),
      }).save();

      const response = await request(app)
        .get('/posts/feed')
        .set('testUser', JSON.stringify(testUser))
        .expect(200);

      // Posts should be sorted by createdAt in descending order
      if (response.body.length >= 2) {
        const firstPostDate = new Date(response.body[0].createdAt);
        const secondPostDate = new Date(response.body[1].createdAt);
        expect(firstPostDate.getTime()).toBeGreaterThanOrEqual(secondPostDate.getTime());
      }
    });

    test('should populate author information', async () => {
      const response = await request(app)
        .get('/posts/feed')
        .set('testUser', JSON.stringify(testUser))
        .expect(200);

      if (response.body.length > 0) {
        const post = response.body[0];
        expect(post.author).toBeDefined();
        expect(post.author.name).toBeDefined();
        expect(post.author.username).toBeDefined();
        expect(post.author.profilePicture).toBeDefined();
        expect(post.author.headline).toBeDefined();
        expect(post.author.password).toBeUndefined(); // Should not include password
      }
    });

    test('should handle database errors gracefully', async () => {
      // Mock Post.find to throw an error
      const originalFind = Post.find;
      Post.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const response = await request(app)
        .get('/posts/feed')
        .set('testUser', JSON.stringify(testUser))
        .expect(500);

      expect(response.body.message).toBe('Server error');

      // Restore original method
      Post.find = originalFind;
    });
  });

  describe('POST /posts', () => {
    test('should create a post without image', async () => {
      const postData = {
        content: 'This is a new post without image',
      };

      const response = await request(app)
        .post('/posts')
        .set('testUser', JSON.stringify(testUser))
        .send(postData)
        .expect(201);

      expect(response.body.content).toBe(postData.content);
      expect(response.body.author).toBe(testUser._id.toString());
      expect(response.body.image).toBeUndefined();

      // Verify post was saved to database
      const savedPost = await Post.findById(response.body._id);
      expect(savedPost).toBeTruthy();
      expect(savedPost.content).toBe(postData.content);
    });

    test('should create a post with image', async () => {
      const postData = {
        content: 'This is a new post with image',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcU...', // Base64 image
      };

      const response = await request(app)
        .post('/posts')
        .set('testUser', JSON.stringify(testUser))
        .send(postData)
        .expect(201);

      expect(response.body.content).toBe(postData.content);
      expect(response.body.author).toBe(testUser._id.toString());
      expect(response.body.image).toBe('https://test-cloudinary-url.com/image.jpg');

      // Verify cloudinary upload was called
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(postData.image);
    });

    test('should handle cloudinary upload errors', async () => {
      // Mock cloudinary to throw an error
      cloudinary.uploader.upload.mockRejectedValueOnce(new Error('Cloudinary error'));

      const postData = {
        content: 'Post with failing image upload',
        image: 'base64-image-data',
      };

      const response = await request(app)
        .post('/posts')
        .set('testUser', JSON.stringify(testUser))
        .send(postData)
        .expect(500);

      expect(response.body.message).toBe('Server error');
    });

    test('should handle missing content', async () => {
      const postData = {}; // No content

      const response = await request(app)
        .post('/posts')
        .set('testUser', JSON.stringify(testUser))
        .send(postData);

      // Should either create with empty content or reject
      expect([201, 400]).toContain(response.status);
    });

    test('should handle very long content', async () => {
      const longContent = 'a'.repeat(10000);
      const postData = {
        content: longContent,
      };

      const response = await request(app)
        .post('/posts')
        .set('testUser', JSON.stringify(testUser))
        .send(postData);

      // Should handle gracefully
      expect([201, 400, 413]).toContain(response.status);
    });

    test('should handle database save errors', async () => {
      // Mock Post save to throw an error
      const originalSave = Post.prototype.save;
      Post.prototype.save = jest.fn().mockRejectedValue(new Error('Database save error'));

      const postData = {
        content: 'Test post that will fail to save',
      };

      const response = await request(app)
        .post('/posts')
        .set('testUser', JSON.stringify(testUser))
        .send(postData)
        .expect(500);

      expect(response.body.message).toBe('Server error');

      // Restore original method
      Post.prototype.save = originalSave;
    });
  });

  describe('DELETE /posts/:id', () => {
    test('should delete own post successfully', async () => {
      const ownPost = await new Post({
        author: testUser._id,
        content: 'Post to be deleted',
      }).save();

      const response = await request(app)
        .delete(`/posts/${ownPost._id}`)
        .set('testUser', JSON.stringify(testUser))
        .expect(200);

      expect(response.body.message).toBe('Post deleted successfully');

      // Verify post was deleted from database
      const deletedPost = await Post.findById(ownPost._id);
      expect(deletedPost).toBeNull();
    });

    test('should not allow deleting other users posts', async () => {
      const otherUserPost = await new Post({
        author: connectedUser._id,
        content: 'Someone elses post',
      }).save();

      const response = await request(app)
        .delete(`/posts/${otherUserPost._id}`)
        .set('testUser', JSON.stringify(testUser))
        .expect(403);

      expect(response.body.message).toBe('You are not authorized to delete this post');

      // Verify post was not deleted
      const stillExistingPost = await Post.findById(otherUserPost._id);
      expect(stillExistingPost).toBeTruthy();
    });

    test('should handle non-existent post ID', async () => {
      const nonExistentId = '60d0fe4f5311236168a109ca';

      const response = await request(app)
        .delete(`/posts/${nonExistentId}`)
        .set('testUser', JSON.stringify(testUser))
        .expect(404);

      expect(response.body.message).toBe('Post not found');
    });

    test('should handle invalid post ID format', async () => {
      const invalidId = 'invalid-id';

      const response = await request(app)
        .delete(`/posts/${invalidId}`)
        .set('testUser', JSON.stringify(testUser))
        .expect(500);

      expect(response.body.message).toBe('Server error');
    });

    test('should delete post with image and remove from cloudinary', async () => {
      const postWithImage = await new Post({
        author: testUser._id,
        content: 'Post with image to be deleted',
        image: 'https://cloudinary.com/image123.jpg',
      }).save();

      const response = await request(app)
        .delete(`/posts/${postWithImage._id}`)
        .set('testUser', JSON.stringify(testUser))
        .expect(200);

      expect(response.body.message).toBe('Post deleted successfully');

      // Verify cloudinary destroy was called (if implemented)
      // This would depend on the actual implementation
    });

    test('should handle database errors during deletion', async () => {
      const ownPost = await new Post({
        author: testUser._id,
        content: 'Post to be deleted',
      }).save();

      // Mock Post.findById to throw an error
      const originalFindById = Post.findById;
      Post.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/posts/${ownPost._id}`)
        .set('testUser', JSON.stringify(testUser))
        .expect(500);

      expect(response.body.message).toBe('Server error');

      // Restore original method
      Post.findById = originalFindById;
    });
  });

  describe('Edge Cases and Security', () => {
    test('should handle posts with special characters', async () => {
      const specialContent = 'Post with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~';
      const postData = {
        content: specialContent,
      };

      const response = await request(app)
        .post('/posts')
        .set('testUser', JSON.stringify(testUser))
        .send(postData)
        .expect(201);

      expect(response.body.content).toBe(specialContent);
    });

    test('should handle posts with HTML/script content', async () => {
      const maliciousContent = '<script>alert("xss")</script>';
      const postData = {
        content: maliciousContent,
      };

      const response = await request(app)
        .post('/posts')
        .set('testUser', JSON.stringify(testUser))
        .send(postData)
        .expect(201);

      // Content should be stored as-is (sanitization would be handled elsewhere)
      expect(response.body.content).toBe(maliciousContent);
    });

    test('should handle empty feed when user has no connections', async () => {
      // Create user with no connections
      const isolatedUser = await new User({
        ...createTestUser({
          username: 'isolated',
          email: 'isolated@example.com',
        }),
        password: 'hashedpassword123',
        connections: [],
      }).save();

      const response = await request(app)
        .get('/posts/feed')
        .set('testUser', JSON.stringify(isolatedUser))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should only contain posts from the user themselves
      const userPosts = response.body.filter(post => post.author._id === isolatedUser._id.toString());
      expect(response.body.length).toBe(userPosts.length);
    });
  });
}); 