import { screen } from '@testing-library/react';
import SignUpPage from '../SignUpPage';
import { renderWithProviders } from '../../../utils/testUtils';

describe('SignUpPage', () => {
  test('renders signup page correctly', () => {
    renderWithProviders(<SignUpPage />);
    
    expect(screen.getByText('Make the most of your professional life')).toBeInTheDocument();
  });

  test('contains signup form', () => {
    renderWithProviders(<SignUpPage />);
    
    expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password (6+ characters)')).toBeInTheDocument();
  });

  test('has link to login page', () => {
    renderWithProviders(<SignUpPage />);
    
    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
  });

  // Snapshot Tests
  test('matches snapshot for signup page layout', () => {
    const { container } = renderWithProviders(<SignUpPage />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for signup page form elements', () => {
    const { container } = renderWithProviders(<SignUpPage />);
    expect(container.firstChild).toMatchSnapshot();
  });
}); 