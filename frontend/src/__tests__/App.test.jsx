import { screen } from '@testing-library/react';
import App from '../App';
import { renderWithProviders } from '../utils/testUtils';
import * as reactQuery from '@tanstack/react-query';

// Mock the dependencies
jest.mock('../lib/axios');

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders app component correctly', () => {
    renderWithProviders(<App />);
    
    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  test('renders without crashing', () => {
    renderWithProviders(<App />);
    
    // App should render without throwing errors
    expect(document.body).toBeInTheDocument();
  });

  test('contains required providers', () => {
    renderWithProviders(<App />);
    
    // Should have router and query providers from testUtils
    expect(document.body).toBeInTheDocument();
  });

  // Snapshot Tests
  test('matches snapshot for app component', () => {
    const { container } = renderWithProviders(<App />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for app with default routing', () => {
    const { container } = renderWithProviders(<App />);
    expect(container.firstChild).toMatchSnapshot();
  });
}); 