import { screen } from '@testing-library/react';
import LoginPage from '../LoginPage';
import { renderWithProviders } from '../../../utils/testUtils';

describe('LoginPage', () => {
  test('renders login page correctly', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  test('contains login form', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  test('has link to signup page', () => {
    renderWithProviders(<LoginPage />);
    
    const signupLink = screen.getByRole('link', { name: /join now/i });
    expect(signupLink).toBeInTheDocument();
  });

  // Snapshot Tests
  test('matches snapshot for login page layout', () => {
    const { container } = renderWithProviders(<LoginPage />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for login page form elements', () => {
    const { container } = renderWithProviders(<LoginPage />);
    expect(container.firstChild).toMatchSnapshot();
  });
}); 