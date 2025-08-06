import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import { createTestUser } from '../setup.js';

describe('User Model', () => {
  describe('Schema Validation', () => {
    test('should create a user with valid data', async () => {
      const userData = createTestUser();
      const user = new User(userData);
      
      await user.save();
      
      expect(user._id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(userData.password);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test('should apply default values correctly', async () => {
      const userData = {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      
      const user = new User(userData);
      await user.save();
      
      expect(user.profilePicture).toBe('');
      expect(user.bannerImg).toBe('');
      expect(user.headline).toBe('Linkedin User');
      expect(user.location).toBe('Earth');
      expect(user.about).toBe('');
      expect(user.skills).toEqual([]);
      expect(user.experience).toEqual([]);
      expect(user.education).toEqual([]);
      expect(user.connections).toEqual([]);
      expect(user.contests).toEqual([]);
    });

    test('should require name field', async () => {
      const userData = createTestUser();
      delete userData.name;
      
      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/name.*required/i);
    });

    test('should require username field', async () => {
      const userData = createTestUser();
      delete userData.username;
      
      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/username.*required/i);
    });

    test('should require email field', async () => {
      const userData = createTestUser();
      delete userData.email;
      
      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/email.*required/i);
    });

    test('should require password field', async () => {
      const userData = createTestUser();
      delete userData.password;
      
      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/password.*required/i);
    });

    test('should enforce unique email constraint', async () => {
      const userData1 = createTestUser();
      const userData2 = createTestUser({
        username: 'different',
        email: userData1.email, // Same email
      });
      
      const user1 = new User(userData1);
      await user1.save();
      
      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    test('should enforce unique username constraint', async () => {
      const userData1 = createTestUser();
      const userData2 = createTestUser({
        email: 'different@example.com',
        username: userData1.username, // Same username
      });
      
      const user1 = new User(userData1);
      await user1.save();
      
      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('Experience and Education Arrays', () => {
    test('should save user with experience data', async () => {
      const userData = createTestUser();
      const experience = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2022-01-01'),
        description: 'Developed web applications',
      };
      
      userData.experience = [experience];
      
      const user = new User(userData);
      await user.save();
      
      expect(user.experience).toHaveLength(1);
      expect(user.experience[0].title).toBe(experience.title);
      expect(user.experience[0].company).toBe(experience.company);
      expect(user.experience[0].startDate).toEqual(experience.startDate);
      expect(user.experience[0].endDate).toEqual(experience.endDate);
      expect(user.experience[0].description).toBe(experience.description);
    });

    test('should save user with education data', async () => {
      const userData = createTestUser();
      const education = {
        school: 'University of Tech',
        fieldOfStudy: 'Computer Science',
        startYear: 2016,
        endYear: 2020,
      };
      
      userData.education = [education];
      
      const user = new User(userData);
      await user.save();
      
      expect(user.education).toHaveLength(1);
      expect(user.education[0].school).toBe(education.school);
      expect(user.education[0].fieldOfStudy).toBe(education.fieldOfStudy);
      expect(user.education[0].startYear).toBe(education.startYear);
      expect(user.education[0].endYear).toBe(education.endYear);
    });

    test('should save user with multiple experiences and educations', async () => {
      const userData = createTestUser();
      
      userData.experience = [
        {
          title: 'Junior Developer',
          company: 'Startup Inc',
          startDate: new Date('2018-01-01'),
          endDate: new Date('2020-01-01'),
          description: 'Built mobile apps',
        },
        {
          title: 'Senior Developer',
          company: 'Big Tech',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-01-01'),
          description: 'Led development team',
        },
      ];
      
      userData.education = [
        {
          school: 'Community College',
          fieldOfStudy: 'Programming',
          startYear: 2014,
          endYear: 2016,
        },
        {
          school: 'University',
          fieldOfStudy: 'Computer Science',
          startYear: 2016,
          endYear: 2020,
        },
      ];
      
      const user = new User(userData);
      await user.save();
      
      expect(user.experience).toHaveLength(2);
      expect(user.education).toHaveLength(2);
    });
  });

  describe('Skills and Connections', () => {
    test('should save user with skills array', async () => {
      const userData = createTestUser();
      userData.skills = ['JavaScript', 'React', 'Node.js', 'MongoDB'];
      
      const user = new User(userData);
      await user.save();
      
      expect(user.skills).toEqual(['JavaScript', 'React', 'Node.js', 'MongoDB']);
    });

    test('should save user with connections array', async () => {
      // Create some connected users first
      const user1 = await new User(createTestUser({
        username: 'user1',
        email: 'user1@example.com',
      })).save();
      
      const user2 = await new User(createTestUser({
        username: 'user2',
        email: 'user2@example.com',
      })).save();
      
      // Create main user with connections
      const userData = createTestUser();
      userData.connections = [user1._id, user2._id];
      
      const user = new User(userData);
      await user.save();
      
      expect(user.connections).toHaveLength(2);
      expect(user.connections[0]).toEqual(user1._id);
      expect(user.connections[1]).toEqual(user2._id);
    });

    test('should populate connections correctly', async () => {
      // Create connected users
      const connectedUser = await new User(createTestUser({
        username: 'connected',
        email: 'connected@example.com',
      })).save();
      
      // Create main user with connection
      const userData = createTestUser();
      userData.connections = [connectedUser._id];
      
      const user = await new User(userData).save();
      
      // Populate and verify
      const populatedUser = await User.findById(user._id).populate('connections');
      
      expect(populatedUser.connections).toHaveLength(1);
      expect(populatedUser.connections[0].username).toBe('connected');
      expect(populatedUser.connections[0].email).toBe('connected@example.com');
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    test('should handle empty strings for optional fields', async () => {
      const userData = createTestUser();
      userData.profilePicture = '';
      userData.bannerImg = '';
      userData.headline = '';
      userData.location = '';
      userData.about = '';
      
      const user = new User(userData);
      await user.save();
      
      expect(user.profilePicture).toBe('');
      expect(user.bannerImg).toBe('');
      expect(user.headline).toBe('');
      expect(user.location).toBe('');
      expect(user.about).toBe('');
    });

    test('should handle very long text values', async () => {
      const longText = 'a'.repeat(1000);
      const userData = createTestUser();
      userData.about = longText;
      userData.headline = longText;
      
      const user = new User(userData);
      await user.save();
      
      expect(user.about).toBe(longText);
      expect(user.headline).toBe(longText);
    });

    test('should handle special characters in text fields', async () => {
      const specialText = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~';
      const userData = createTestUser();
      userData.name = specialText;
      userData.headline = specialText;
      userData.about = specialText;
      userData.location = specialText;
      
      const user = new User(userData);
      await user.save();
      
      expect(user.name).toBe(specialText);
      expect(user.headline).toBe(specialText);
      expect(user.about).toBe(specialText);
      expect(user.location).toBe(specialText);
    });

    test('should handle invalid ObjectId references gracefully', async () => {
      const userData = createTestUser();
      userData.connections = ['invalid-object-id'];
      
      const user = new User(userData);
      // This should throw a validation error
      await expect(user.save()).rejects.toThrow();
    });

    test('should validate experience date fields', async () => {
      const userData = createTestUser();
      userData.experience = [{
        title: 'Developer',
        company: 'Tech Corp',
        startDate: 'invalid-date',
        endDate: 'invalid-date',
        description: 'Development work',
      }];
      
      const user = new User(userData);
      // Invalid dates should be handled by Mongoose
      await expect(user.save()).rejects.toThrow();
    });

    test('should validate education year fields', async () => {
      const userData = createTestUser();
      userData.education = [{
        school: 'University',
        fieldOfStudy: 'CS',
        startYear: 'invalid-year',
        endYear: 'invalid-year',
      }];
      
      const user = new User(userData);
      // Invalid years should be handled by Mongoose
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const userData = createTestUser();
      const user = new User(userData);
      
      const beforeSave = new Date();
      await user.save();
      const afterSave = new Date();
      
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(user.updatedAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });

    test('should update updatedAt on document modification', async () => {
      const userData = createTestUser();
      const user = new User(userData);
      await user.save();
      
      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      user.name = 'Updated Name';
      await user.save();
      
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
}); 