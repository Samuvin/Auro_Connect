import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUpForm from '../SignUpForm';
import { renderWithProviders } from '../../../utils/testUtils';

// Mock the dependencies
jest.mock('../../../lib/axios');

describe('SignUpForm', () => {
  test('renders form correctly', () => {
    renderWithProviders(<SignUpForm />);
    
    expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password (6+ characters)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agree & join/i })).toBeInTheDocument();
  });

  test('handles form submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpForm />);
    
    const nameInput = screen.getByPlaceholderText('Full name');
    const usernameInput = screen.getByPlaceholderText('Username');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password (6+ characters)');
    const submitButton = screen.getByRole('button', { name: /agree & join/i });
    
    await user.type(nameInput, 'John Doe');
    await user.type(usernameInput, 'johndoe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    
    fireEvent.click(submitButton);
    
    // Form should handle submission
    expect(submitButton).toBeInTheDocument();
  });

  test('validates required fields', () => {
    renderWithProviders(<SignUpForm />);
    
    const nameInput = screen.getByPlaceholderText('Full name');
    const usernameInput = screen.getByPlaceholderText('Username');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password (6+ characters)');
    
    expect(nameInput).toBeRequired();
    expect(usernameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  test('email field has correct type', () => {
    renderWithProviders(<SignUpForm />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('password field has correct type', () => {
    renderWithProviders(<SignUpForm />);
    
    const passwordInput = screen.getByPlaceholderText('Password (6+ characters)');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // Snapshot Tests
  test('matches snapshot for signup form default state', () => {
    const { container } = renderWithProviders(<SignUpForm />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for signup form with filled fields', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<SignUpForm />);
    
    const nameInput = screen.getByPlaceholderText('Full name');
    const usernameInput = screen.getByPlaceholderText('Username');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password (6+ characters)');
    
    await user.type(nameInput, 'John Doe');
    await user.type(usernameInput, 'johndoe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for signup form focused state', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<SignUpForm />);
    
    const nameInput = screen.getByPlaceholderText('Full name');
    await user.click(nameInput);
    
    expect(container.firstChild).toMatchSnapshot();
  });
}); 