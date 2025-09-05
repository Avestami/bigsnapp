import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosRequestHeaders } from 'axios';
import LoginPage from '../LoginPage';
import { adminApi } from '../../services/api';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

// Mock the API service
jest.mock('../../services/api', () => ({
  adminApi: {
    login: jest.fn(),
    forgotPassword: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Mock AuthContext
const mockLogin = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: jest.fn(),
    refreshUser: jest.fn(),
  })),
}));

// Mock antd message
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

const mockAdminApi = adminApi as jest.Mocked<typeof adminApi>;
const mockMessage = message as jest.Mocked<typeof message>;
const mockNavigate = jest.fn();

(useNavigate as jest.Mock).mockReturnValue(mockNavigate);

describe('LoginPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockClear();
    mockMessage.loading.mockReturnValue({
      then: jest.fn()
    } as any);
  });

  it('renders login form with correct elements', () => {
    render(<LoginPage />);

    expect(screen.getByText('SnappClone Admin')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your admin account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays SnappClone branding', () => {
    render(<LoginPage />);

    expect(screen.getByText('SnappClone Admin')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your admin account')).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@snappclone.com');
    await user.type(passwordInput, 'password123');
    await user.click(signInButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@snappclone.com', 'password123');
      expect(mockMessage.success).toHaveBeenCalledWith('Login successful!');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValue(new Error(errorMessage));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@snappclone.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(signInButton);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('validates required fields', async () => {
    render(<LoginPage />);

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Please input your email!')).toBeInTheDocument();
      expect(screen.getByText('Please input your password!')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email!')).toBeInTheDocument();
    });
  });

  it('validates password minimum length', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@snappclone.com');
    await user.type(passwordInput, '123');
    await user.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters!')).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    // Mock a delayed response
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@snappclone.com');
    await user.type(passwordInput, 'password123');
    await user.click(signInButton);

    // Check that button shows loading state
    expect(signInButton).toHaveClass('ant-btn-loading');
    expect(screen.getByText('Signing In...')).toBeInTheDocument();
  });

  // Forgot password functionality is not implemented in the current LoginPage

  it('handles successful login without remember me', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@snappclone.com');
    await user.type(passwordInput, 'password123');
    await user.click(signInButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@snappclone.com', 'password123');
    });
  });

  it('renders password input with correct type', async () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('handles keyboard navigation', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'admin@snappclone.com');
    await user.keyboard('{Tab}');
    
    expect(passwordInput).toHaveFocus();

    await user.type(passwordInput, 'password123');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  it('displays proper error messages for network errors', async () => {
    mockLogin.mockRejectedValue(new Error('Network Error'));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@snappclone.com');
    await user.type(passwordInput, 'password123');
    await user.click(signInButton);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('Network Error');
    });
  });

  it('clears form validation errors when user starts typing', async () => {
    render(<LoginPage />);

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Please input your email!')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'a');

    await waitFor(() => {
      expect(screen.queryByText('Please input your email!')).not.toBeInTheDocument();
    });
  });

  it('displays company logo and branding correctly', () => {
    render(<LoginPage />);

    // Check branding text
    expect(screen.getByText('SnappClone Admin')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your admin account')).toBeInTheDocument();
  });

  it('handles form submission with Enter key', async () => {
    const mockLoginResponse = {
      token: 'mock-jwt-token',
      user: { id: '1', email: 'admin@snappclone.com', name: 'Admin User', role: 'admin' }
    };

    mockLogin.mockResolvedValue(undefined);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'admin@snappclone.com');
    await user.type(passwordInput, 'password123{enter}');

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  it('shows loading state during form submission', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@snappclone.com');
    await user.type(passwordInput, 'password123');
    
    // Click the button
    await user.click(signInButton);

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    });

    // Wait for login to complete
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@snappclone.com', 'password123');
    });
  });
});

// Helper functions
const createMockApiResponse = <T,>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {
    headers: {} as AxiosRequestHeaders,
    method: 'get' as const,
    url: '',
  },
});

const createMockErrorResponse = (message: string) => ({
  response: {
    data: { message },
    status: 400,
    statusText: 'Bad Request',
  },
});