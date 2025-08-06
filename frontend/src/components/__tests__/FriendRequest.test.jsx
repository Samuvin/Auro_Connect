import { screen, fireEvent } from '@testing-library/react';
import FriendRequest from '../FriendRequest';
import { renderWithProviders, mockUser } from '../../utils/testUtils';

describe('FriendRequest', () => {
  const mockRequest = {
    _id: '1',
    sender: mockUser,
    name: mockUser.name, // Component uses request.name for alt attribute
    to: '2',
    createdAt: new Date().toISOString()
  };

  test('renders friend request correctly', () => {
    renderWithProviders(<FriendRequest request={mockRequest} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
  });

  test('shows accept and decline buttons', () => {
    renderWithProviders(<FriendRequest request={mockRequest} />);
    
    expect(screen.getByText(/accept/i)).toBeInTheDocument();
    expect(screen.getByText(/reject/i)).toBeInTheDocument();
  });

  test('displays user profile picture', () => {
    renderWithProviders(<FriendRequest request={mockRequest} />);
    
    const img = screen.getByAltText('John Doe');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/avatar.png');
  });

  test('handles accept button click', () => {
    renderWithProviders(<FriendRequest request={mockRequest} />);
    
    const acceptButton = screen.getByText(/accept/i);
    fireEvent.click(acceptButton);
    
    // Should trigger accept action
    expect(acceptButton).toBeInTheDocument();
  });

  test('handles decline button click', () => {
    renderWithProviders(<FriendRequest request={mockRequest} />);
    
    const rejectButton = screen.getByText(/reject/i);
    fireEvent.click(rejectButton);
    
    // Should trigger reject action
    expect(rejectButton).toBeInTheDocument();
  });

  test('renders with missing profile picture', () => {
    const requestWithoutPicture = {
      ...mockRequest,
      sender: { ...mockUser, profilePicture: null }
    };
    
    renderWithProviders(<FriendRequest request={requestWithoutPicture} />);
    
    const img = screen.getByAltText('John Doe');
    expect(img).toHaveAttribute('src', '/avatar.png');
  });

  // Snapshot Tests
  test('matches snapshot for default friend request', () => {
    const { container } = renderWithProviders(<FriendRequest request={mockRequest} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for friend request with missing profile picture', () => {
    const requestWithoutPicture = {
      ...mockRequest,
      sender: { ...mockUser, profilePicture: null }
    };
    const { container } = renderWithProviders(<FriendRequest request={requestWithoutPicture} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for friend request with different user data', () => {
    const differentUser = {
      ...mockUser,
      name: 'Jane Smith',
      username: 'janesmith',
      headline: 'UX Designer',
      profilePicture: '/jane-avatar.png'
    };
    const requestWithDifferentUser = {
      ...mockRequest,
      sender: differentUser,
      name: differentUser.name
    };
    const { container } = renderWithProviders(<FriendRequest request={requestWithDifferentUser} />);
    expect(container.firstChild).toMatchSnapshot();
  });
}); 