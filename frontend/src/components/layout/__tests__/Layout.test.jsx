import { screen } from '@testing-library/react';
import Layout from '../Layout';
import { renderWithProviders } from '../../../utils/testUtils';

describe('Layout', () => {
  test('renders children correctly', () => {
    renderWithProviders(
      <Layout>
        <div>Test content</div>
      </Layout>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('renders without children', () => {
    renderWithProviders(<Layout />);
    
    // Layout should still render without errors
    expect(document.body).toBeInTheDocument();
  });

  test('renders multiple children', () => {
    renderWithProviders(
      <Layout>
        <div>First child</div>
        <div>Second child</div>
        <span>Third child</span>
      </Layout>
    );
    
    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
    expect(screen.getByText('Third child')).toBeInTheDocument();
  });

  // Snapshot Tests
  test('matches snapshot for layout with single child', () => {
    const { container } = renderWithProviders(
      <Layout>
        <div>Test content</div>
      </Layout>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for layout without children', () => {
    const { container } = renderWithProviders(<Layout />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for layout with multiple children', () => {
    const { container } = renderWithProviders(
      <Layout>
        <div>First child</div>
        <div>Second child</div>
        <span>Third child</span>
      </Layout>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot for layout with nested components', () => {
    const { container } = renderWithProviders(
      <Layout>
        <header>Header content</header>
        <main>
          <div>Main content</div>
          <aside>Sidebar content</aside>
        </main>
        <footer>Footer content</footer>
      </Layout>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
}); 