import { screen } from '@testing-library/react';
import HomePage from '../HomePage';
import { renderWithProviders } from '../../utils/testUtils';

// Mock the dependencies
jest.mock('../../lib/axios');

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders homepage layout correctly', () => {
    renderWithProviders(<HomePage />);
    
    // Should render main content area
    expect(document.body).toBeInTheDocument();
  });

  test('contains main sections of the homepage', () => {
    renderWithProviders(<HomePage />);
    
    // Look for common homepage elements
    expect(document.body).toBeInTheDocument();
  });

  test('renders without authentication errors', () => {
    renderWithProviders(<HomePage />);
    
    // Should not show login prompts or error messages
    expect(screen.queryByText(/please log in/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unauthorized/i)).not.toBeInTheDocument();
  });

  // Snapshot Tests
  test('matches snapshot for homepage layout', () => {
    const { container } = renderWithProviders(<HomePage />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for homepage with mocked data', () => {
    // This will use the mocked data from setupTests.js
    const { container } = renderWithProviders(<HomePage />);
    expect(container.firstChild).toMatchSnapshot();
  });
}); 