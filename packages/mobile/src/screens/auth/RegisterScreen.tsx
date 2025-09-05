import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';
import { AuthStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const themeColors = useThemeColors();
  const [form, setForm] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const navigateToLogin = () => {
    console.log('📱 RegisterScreen: Navigating to Login screen');
    navigation.navigate('Login');
  };

  const handleRegister = async () => {
    console.log('📝 RegisterScreen: handleRegister called');
    console.log('📝 Form data:', {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      passwordLength: form.password.length,
      confirmPasswordLength: form.confirmPassword.length
    });

    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
      console.log('❌ RegisterScreen: Validation failed - missing fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (form.password !== form.confirmPassword) {
      console.log('❌ RegisterScreen: Validation failed - passwords do not match');
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      console.log('❌ RegisterScreen: Validation failed - password too short');
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    console.log('✅ RegisterScreen: All validations passed, starting registration');
    setLoading(true);
    try {
      const registrationData = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      };
      console.log('📤 RegisterScreen: Sending registration request:', {
        ...registrationData,
        password: '[HIDDEN]'
      });
      
      // Call API service to register user
      const api = require('../../services/api').default;
      const response = await api.register(registrationData);
      
      console.log('✅ RegisterScreen: Registration successful:', response);
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => {
          console.log('📱 RegisterScreen: Navigating to Login screen');
          navigation.navigate('Login' as never);
        }}
      ]);
    } catch (error: any) {
      console.error('❌ RegisterScreen: Registration failed:', error);
      console.error('❌ RegisterScreen: Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      console.log('🏁 RegisterScreen: Registration process completed');
      setLoading(false);
    }
  };



  const styles = useThemedStyles(createStyles);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="First name"
                placeholderTextColor={themeColors.textDisabled}
                value={form.firstName}
                onChangeText={(text) => setForm({ ...form, firstName: text })}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Last name"
                placeholderTextColor={themeColors.textDisabled}
                value={form.lastName}
                onChangeText={(text) => setForm({ ...form, lastName: text })}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={themeColors.textDisabled}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor={themeColors.textDisabled}
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor={themeColors.textDisabled}
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor={themeColors.textDisabled}
              value={form.confirmPassword}
              onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={navigateToLogin}
          >
            <Text style={styles.linkText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: colors.primary,
    fontSize: 16,
  },
});

export default RegisterScreen;