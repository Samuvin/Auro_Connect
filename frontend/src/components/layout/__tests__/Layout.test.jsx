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
  test('Should match the snapshot for the component Layout with single child @snapshot', () => {
    const view = renderWithProviders(
      <Layout>
        <div>Test content</div>
      </Layout>
    );
    expect(view).toMatchSnapshot();
  });

  test('Should match the snapshot for the component Layout without children @snapshot', () => {
    const view = renderWithProviders(<Layout />);
    expect(view).toMatchSnapshot();
  });

  test('Should match the snapshot for the component Layout with multiple children @snapshot', () => {
    const view = renderWithProviders(
      <Layout>
        <div>First child</div>
        <div>Second child</div>
        <span>Third child</span>
      </Layout>
    );
    expect(view).toMatchSnapshot();
  });

  test('Should match the snapshot for the component Layout with nested components @snapshot', () => {
    const view = renderWithProviders(
      <Layout>
        <div className="main-content">
          <header>Header Content</header>
          <main>
            <section>Section 1</section>
            <section>Section 2</section>
          </main>
          <footer>Footer Content</footer>
        </div>
      </Layout>
    );
    expect(view).toMatchSnapshot();
  });

  test('Should match the snapshot for the component Layout with custom className @snapshot', () => {
    const view = renderWithProviders(
      <Layout className="custom-layout-class">
        <div>Custom styled content</div>
      </Layout>
    );
    expect(view).toMatchSnapshot();
  });
}); 