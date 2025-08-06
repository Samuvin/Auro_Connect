import { screen, fireEvent } from '@testing-library/react';
import PostAction from '../PostAction';
import { renderWithProviders } from '../../utils/testUtils';

describe('PostAction', () => {
  const mockOnClick = jest.fn();
  const mockIcon = <span data-testid="mock-icon">👍</span>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with icon and text', () => {
    renderWithProviders(
      <PostAction 
        icon={mockIcon} 
        text="Like" 
        onClick={mockOnClick} 
      />
    );
    
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    expect(screen.getByText('Like')).toBeInTheDocument();
  });

  test('calls onClick when button is clicked', () => {
    renderWithProviders(
      <PostAction 
        icon={mockIcon} 
        text="Like" 
        onClick={mockOnClick} 
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('renders only icon when text is not provided', () => {
    renderWithProviders(
      <PostAction 
        icon={mockIcon} 
        onClick={mockOnClick} 
      />
    );
    
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    expect(screen.queryByText('Like')).not.toBeInTheDocument();
  });

  test('renders with different icons and texts', () => {
    const commentIcon = <span data-testid="comment-icon">💬</span>;
    
    renderWithProviders(
      <PostAction 
        icon={commentIcon} 
        text="Comment" 
        onClick={mockOnClick} 
      />
    );
    
    expect(screen.getByTestId('comment-icon')).toBeInTheDocument();
    expect(screen.getByText('Comment')).toBeInTheDocument();
  });

  test('has correct CSS classes for responsive design', () => {
    renderWithProviders(
      <PostAction 
        icon={mockIcon} 
        text="Share" 
        onClick={mockOnClick} 
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('flex', 'items-center');
    
    const textSpan = screen.getByText('Share');
    expect(textSpan).toHaveClass('hidden', 'sm:inline');
  });

  test('renders without onClick handler', () => {
    renderWithProviders(
      <PostAction icon={mockIcon} text="Like" />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should not throw error when onClick is undefined
    expect(button).toBeInTheDocument();
  });

  // Snapshot Tests
  test('matches snapshot for post action with icon and text', () => {
    const { container } = renderWithProviders(
      <PostAction 
        icon={mockIcon} 
        text="Like" 
        onClick={mockOnClick} 
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for post action with icon only', () => {
    const { container } = renderWithProviders(
      <PostAction 
        icon={mockIcon} 
        onClick={mockOnClick} 
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for post action with comment icon', () => {
    const commentIcon = <span data-testid="comment-icon">💬</span>;
    const { container } = renderWithProviders(
      <PostAction 
        icon={commentIcon} 
        text="Comment" 
        onClick={mockOnClick} 
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for post action without onClick handler', () => {
    const { container } = renderWithProviders(
      <PostAction icon={mockIcon} text="Like" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
}); 