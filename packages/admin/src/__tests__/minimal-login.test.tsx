import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '../pages/LoginPage';

// Mock the API service
jest.mock('../services/api', () => ({
  adminApi: {
    login: jest.fn(),
    forgotPassword: jest.fn(),
  },
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

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => jest.fn()),
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
  })),
}));

describe('Minimal LoginPage Test', () => {
  it('should import LoginPage without crashing', () => {
    expect(LoginPage).toBeDefined();
  });

  it('should render LoginPage without crashing', () => {
    render(<LoginPage />);
    expect(screen.getByText(/snappclone admin/i)).toBeInTheDocument();
  });
});