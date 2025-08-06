import { screen, fireEvent } from '@testing-library/react';
import UserCard from '../UserCard';
import { renderWithProviders, mockUser } from '../../utils/testUtils';

describe('UserCard', () => {
  const defaultProps = {
    user: mockUser,
    isConnection: false
  };

  test('renders user information correctly', () => {
    renderWithProviders(<UserCard {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
    expect(screen.getByText('2 connections')).toBeInTheDocument();
    expect(screen.getByAltText('John Doe')).toBeInTheDocument();
  });

  test('displays profile picture with fallback', () => {
    renderWithProviders(<UserCard {...defaultProps} />);
    
    const img = screen.getByAltText('John Doe');
    expect(img).toHaveAttribute('src', '/avatar.png');
  });

  test('displays fallback avatar when no profile picture', () => {
    const userWithoutPicture = { ...mockUser, profilePicture: null };
    renderWithProviders(
      <UserCard user={userWithoutPicture} isConnection={false} />
    );
    
    const img = screen.getByAltText('John Doe');
    expect(img).toHaveAttribute('src', '/avatar.png');
  });

  test('renders Connect button when not connected', () => {
    renderWithProviders(<UserCard {...defaultProps} />);
    
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  test('renders Connected button when already connected', () => {
    renderWithProviders(
      <UserCard user={mockUser} isConnection={true} />
    );
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  test('links to user profile', () => {
    renderWithProviders(<UserCard {...defaultProps} />);
    
    const profileLink = screen.getByRole('link');
    expect(profileLink).toHaveAttribute('href', '/profile/johndoe');
  });

  test('handles click on connect button', () => {
    renderWithProviders(<UserCard {...defaultProps} />);
    
    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);
    // In a real implementation, this would trigger a connection request
  });

  test('displays zero connections when user has no connections', () => {
    const userWithNoConnections = { ...mockUser, connections: [] };
    renderWithProviders(
      <UserCard user={userWithNoConnections} isConnection={false} />
    );
    
    expect(screen.getByText('0 connections')).toBeInTheDocument();
  });

  test('handles undefined connections array', () => {
    const userWithUndefinedConnections = { ...mockUser, connections: undefined };
    renderWithProviders(
      <UserCard user={userWithUndefinedConnections} isConnection={false} />
    );
    
    // The component shows " connections" when connections is undefined
    // Use a custom matcher since testing library normalizes whitespace
    expect(screen.getByText((content, element) => {
      return element?.textContent === ' connections';
    })).toBeInTheDocument();
  });

  // Snapshot Tests
  test('matches snapshot for default user card', () => {
    const { container } = renderWithProviders(<UserCard {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for connected user card', () => {
    const { container } = renderWithProviders(
      <UserCard user={mockUser} isConnection={true} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for user with no connections', () => {
    const userWithNoConnections = { ...mockUser, connections: [] };
    const { container } = renderWithProviders(
      <UserCard user={userWithNoConnections} isConnection={false} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for user with undefined connections', () => {
    const userWithUndefinedConnections = { ...mockUser, connections: undefined };
    const { container } = renderWithProviders(
      <UserCard user={userWithUndefinedConnections} isConnection={false} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
}); 