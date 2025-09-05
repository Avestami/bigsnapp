import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import { render } from '../../../test-utils';
import RegisterScreen from '../RegisterScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);
    
    expect(getByText('Create Account')).toBeTruthy();
    expect(getByText('Sign up to get started')).toBeTruthy();
    expect(getByPlaceholderText('First name')).toBeTruthy();
    expect(getByPlaceholderText('Last name')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your phone number')).toBeTruthy();
    expect(getByPlaceholderText('Create a password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm your password')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
    expect(getByText('Already have an account? Sign In')).toBeTruthy();
  });

  it('updates form fields when user types', () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    
    const firstNameInput = getByPlaceholderText('First name');
    const lastNameInput = getByPlaceholderText('Last name');
    const emailInput = getByPlaceholderText('Enter your email');
    const phoneInput = getByPlaceholderText('Enter your phone number');
    const passwordInput = getByPlaceholderText('Create a password');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');

    fireEvent.changeText(firstNameInput, 'John');
    fireEvent.changeText(lastNameInput, 'Doe');
    fireEvent.changeText(emailInput, 'john@example.com');
    fireEvent.changeText(phoneInput, '1234567890');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');

    expect(firstNameInput.props.value).toBe('John');
    expect(lastNameInput.props.value).toBe('Doe');
    expect(emailInput.props.value).toBe('john@example.com');
    expect(phoneInput.props.value).toBe('1234567890');
    expect(passwordInput.props.value).toBe('password123');
    expect(confirmPasswordInput.props.value).toBe('password123');
  });

  it('shows error when required fields are empty', () => {
    const { getByText } = render(<RegisterScreen />);
    
    const createAccountButton = getByText('Create Account');
    fireEvent.press(createAccountButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
  });

  it('shows error when passwords do not match', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    
    fireEvent.changeText(getByPlaceholderText('First name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Last name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your phone number'), '1234567890');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'differentpassword');

    const createAccountButton = getByText('Create Account');
    fireEvent.press(createAccountButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
  });

  it('shows error when password is too short', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    
    fireEvent.changeText(getByPlaceholderText('First name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Last name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your phone number'), '1234567890');
    fireEvent.changeText(getByPlaceholderText('Create a password'), '123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), '123');

    const createAccountButton = getByText('Create Account');
    fireEvent.press(createAccountButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Password must be at least 6 characters');
  });

  it('shows loading state during registration', async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    
    // Fill in valid form data
    fireEvent.changeText(getByPlaceholderText('First name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Last name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your phone number'), '1234567890');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

    const createAccountButton = getByText('Create Account');
    fireEvent.press(createAccountButton);

    // Check loading state
    expect(getByText('Creating Account...')).toBeTruthy();
  });

  it('disables button during loading', async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    
    // Fill in valid form data
    fireEvent.changeText(getByPlaceholderText('First name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Last name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your phone number'), '1234567890');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

    const createAccountButton = getByText('Create Account');
    fireEvent.press(createAccountButton);

    // Button should be disabled during loading
    expect(createAccountButton.parent?.props.disabled).toBe(true);
  });

  it('navigates to login screen on successful registration', async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    
    // Fill in valid form data
    fireEvent.changeText(getByPlaceholderText('First name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Last name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your phone number'), '1234567890');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

    const createAccountButton = getByText('Create Account');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Account created successfully!',
        [{ text: 'OK', onPress: expect.any(Function) }]
      );
    });
  });

  it('navigates to login screen when sign in link is pressed', () => {
    const { getByText } = render(<RegisterScreen />);
    
    const signInLink = getByText('Already have an account? Sign In');
    fireEvent.press(signInLink);

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('has correct input properties', () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    
    const firstNameInput = getByPlaceholderText('First name');
    const lastNameInput = getByPlaceholderText('Last name');
    const emailInput = getByPlaceholderText('Enter your email');
    const phoneInput = getByPlaceholderText('Enter your phone number');
    const passwordInput = getByPlaceholderText('Create a password');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');

    expect(firstNameInput.props.autoCapitalize).toBe('words');
    expect(lastNameInput.props.autoCapitalize).toBe('words');
    expect(emailInput.props.keyboardType).toBe('email-address');
    expect(emailInput.props.autoCapitalize).toBe('none');
    expect(emailInput.props.autoCorrect).toBe(false);
    expect(phoneInput.props.keyboardType).toBe('phone-pad');
    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(passwordInput.props.autoCapitalize).toBe('none');
    expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
    expect(confirmPasswordInput.props.autoCapitalize).toBe('none');
  });

  it('logs form data on registration attempt', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    
    const formData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      password: 'password123',
      confirmPassword: 'password123'
    };

    // Fill in form data
    fireEvent.changeText(getByPlaceholderText('First name'), formData.firstName);
    fireEvent.changeText(getByPlaceholderText('Last name'), formData.lastName);
    fireEvent.changeText(getByPlaceholderText('Enter your email'), formData.email);
    fireEvent.changeText(getByPlaceholderText('Enter your phone number'), formData.phone);
    fireEvent.changeText(getByPlaceholderText('Create a password'), formData.password);
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), formData.confirmPassword);

    const createAccountButton = getByText('Create Account');
    fireEvent.press(createAccountButton);

    expect(consoleSpy).toHaveBeenCalledWith('Register attempt:', formData);
    
    consoleSpy.mockRestore();
  });
});