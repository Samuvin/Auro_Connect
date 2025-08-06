import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';
import { renderWithProviders } from '../../../utils/testUtils';
import * as reactQuery from '@tanstack/react-query';

// Mock the dependencies
jest.mock('../../../lib/axios');

describe('LoginForm', () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.spyOn(reactQuery, 'useMutation').mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null
    });
  });

  test('renders form correctly', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('form fields are required', () => {
    renderWithProviders(<LoginForm />);
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  test('password field has correct type', () => {
    renderWithProviders(<LoginForm />);
    
    const passwordInput = screen.getByPlaceholderText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('form accepts user input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  // Snapshot Tests
  test('matches snapshot for login form default state', () => {
    const { container } = renderWithProviders(<LoginForm />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for login form loading state', () => {
    jest.spyOn(reactQuery, 'useMutation').mockReturnValue({
      mutate: mockMutate,
      isLoading: true,
      error: null
    });

    const { container } = renderWithProviders(<LoginForm />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for login form with error state', () => {
    jest.spyOn(reactQuery, 'useMutation').mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: { message: 'Invalid credentials' }
    });

    const { container } = renderWithProviders(<LoginForm />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for login form with filled inputs', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<LoginForm />);
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    
    expect(container.firstChild).toMatchSnapshot();
  });
}); 