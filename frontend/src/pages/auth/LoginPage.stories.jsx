import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import Navbar from "../../components/layout/Navbar";
import { Toaster } from "react-hot-toast";

const meta = {
  title: 'Pages/LoginPage',
  component: LoginPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The complete Auto_Connect login page as users see it, including navbar and all UI elements.'
      }
    }
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      });

      return (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <div className='min-h-screen bg-base-100'>
              <Navbar />
              <Story />
            </div>
            <Toaster />
          </MemoryRouter>
        </QueryClientProvider>
      );
    }
  ],
  argTypes: {
    // No args for this page component
  }
};

export default meta;

// Complete login page with all elements
export const CompleteLoginPage = {
  name: 'Complete Login Page',
  parameters: {
    docs: {
      description: {
        story: 'The complete Auto_Connect login page exactly as users see it with navbar, header, notifications, and all UI elements.'
      }
    }
  }
};

// Mobile view of complete page
export const MobileView = {
  name: 'Mobile View',
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'The complete login page optimized for mobile devices with responsive navbar.'
      }
    }
  }
};

// Tablet view of complete page
export const TabletView = {
  name: 'Tablet View',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'The complete login page optimized for tablet devices.'
      }
    }
  }
};

// Dark theme variant
export const DarkTheme = {
  name: 'Dark Theme',
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'The complete login page with dark background theme.'
      }
    }
  }
}; 