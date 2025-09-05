import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { render } from '../../../test-utils';
import LoginScreen from '../LoginScreen';
import { LoginScreenNavigationProp } from '../../../navigation/types';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation: LoginScreenNavigationProp = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => false),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
} as LoginScreenNavigationProp;

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    
    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign in to your account')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText("Don't have an account? Sign Up")).toBeTruthy();
  });

  it('updates email input correctly', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Enter your email');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('updates password input correctly', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    const passwordInput = getByPlaceholderText('Enter your password');
    
    fireEvent.changeText(passwordInput, 'password123');
    
    expect(passwordInput.props.value).toBe('password123');
  });

  it('shows error alert when fields are empty', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    const loginButton = getByText('Sign In');
    
    fireEvent.press(loginButton);
    
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
  });

  it('shows error alert when email is empty', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    const passwordInput = getByPlaceholderText('Enter your password');
    const loginButton = getByText('Sign In');
    
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);
    
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
  });

  it('shows error alert when password is empty', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Enter your email');
    const loginButton = getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(loginButton);
    
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
  });

  it('shows loading state when login is in progress', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const loginButton = getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);
    
    expect(getByText('Signing In...')).toBeTruthy();
  });

  it('disables button during loading', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const loginButton = getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);
    
    const loadingButton = getByText('Signing In...');
    expect(loadingButton.parent?.props.disabled).toBe(true);
  });

  it('returns to normal state after loading completes', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const loginButton = getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(getByText('Sign In')).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('navigates to register screen when sign up link is pressed', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    const signUpLink = getByText("Don't have an account? Sign Up");
    
    fireEvent.press(signUpLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  it('has correct input properties', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    
    expect(emailInput.props.keyboardType).toBe('email-address');
    expect(emailInput.props.autoCapitalize).toBe('none');
    expect(emailInput.props.autoCorrect).toBe(false);
    
    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(passwordInput.props.autoCapitalize).toBe('none');
  });

  it('handles form state correctly', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    
    // Test initial state
    expect(emailInput.props.value).toBe('');
    expect(passwordInput.props.value).toBe('');
    
    // Test updating email
    fireEvent.changeText(emailInput, 'user@test.com');
    expect(emailInput.props.value).toBe('user@test.com');
    
    // Test updating password
    fireEvent.changeText(passwordInput, 'mypassword');
    expect(passwordInput.props.value).toBe('mypassword');
    
    // Test that both values are maintained
    expect(emailInput.props.value).toBe('user@test.com');
    expect(passwordInput.props.value).toBe('mypassword');
  });

  it('console logs form data on login attempt', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const loginButton = getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Login attempt:', {
      email: 'test@example.com',
      password: 'password123',
    });
    
    consoleSpy.mockRestore();
  });
});