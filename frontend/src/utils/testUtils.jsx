import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes providers
export const renderWithProviders = (ui, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const AllTheProviders = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Mock user data for testing
export const mockUser = {
  _id: '1',
  name: 'John Doe',
  username: 'johndoe',
  email: 'john@example.com',
  profilePicture: '/avatar.png',
  headline: 'Software Developer',
  connections: ['2', '3'],
  location: 'New York, NY'
};

// Mock post data for testing
export const mockPost = {
  _id: '1',
  content: 'This is a test post',
  author: mockUser,
  likes: ['2', '3'],
  comments: [
    {
      _id: '1',
      content: 'Great post!',
      user: mockUser,
      createdAt: new Date().toISOString()
    }
  ],
  image: 'https://example.com/image.jpg',
  createdAt: new Date().toISOString()
}; 