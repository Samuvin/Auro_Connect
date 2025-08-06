import '@testing-library/jest-dom';

// Mock global window objects
global.window.dynatrace = {
  sendBizEvent: jest.fn()
};

// Mock CSS imports
jest.mock('react-big-calendar/lib/css/react-big-calendar.css', () => ({}));

// Mock react-big-calendar completely
jest.mock('react-big-calendar', () => ({
  Calendar: () => <div data-testid="mock-calendar">Calendar</div>,
  momentLocalizer: () => ({})
}));

// Mock moment
jest.mock('moment', () => {
  const moment = jest.requireActual('moment');
  return moment;
});

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' })
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn()
  },
  Toaster: () => null
}));

// Mock user data for useQuery
const mockAuthUser = {
  _id: '1',
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  profilePicture: '/avatar.png',
  bannerImg: '/banner.png',
  headline: 'Test Developer',
  connections: ['2', '3'],
  location: 'Test City'
};

// Mock posts data
const mockPosts = [
  {
    _id: '1',
    content: 'Test post content',
    author: mockAuthUser,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  }
];

// Mock recommended users data
const mockRecommendedUsers = [
  {
    _id: '2',
    name: 'Jane Smith',
    username: 'janesmith',
    email: 'jane@example.com',
    profilePicture: '/avatar2.png',
    headline: 'Designer',
    connections: ['1'],
    location: 'Another City'
  }
];

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: (options) => {
    // Handle different query keys
    if (typeof options === 'object' && options.queryKey) {
      const queryKey = options.queryKey[0];
      
      switch (queryKey) {
        case 'authUser':
          return {
            data: mockAuthUser,
            isLoading: false,
            error: null
          };
        case 'posts':
          return {
            data: mockPosts,
            isLoading: false,
            error: null
          };
        case 'recommendedUsers':
          return {
            data: mockRecommendedUsers,
            isLoading: false,
            error: null
          };
        default:
          return {
            data: undefined,
            isLoading: false,
            error: null
          };
      }
    }
    
    // Fallback for legacy usage
    return {
      data: mockAuthUser,
      isLoading: false,
      error: null
    };
  },
  useMutation: () => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null
  }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn()
  }),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
  ReactQueryDevtools: () => null
}));

// Mock axios instance
jest.mock('./lib/axios', () => ({
  axiosInstance: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
})); 