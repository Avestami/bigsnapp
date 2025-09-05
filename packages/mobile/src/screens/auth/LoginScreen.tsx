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
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';

interface LoginForm {
  email: string;
  password: string;
}

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { login } = useAuth();
  const themeColors = useThemeColors();

  const fillAdminCredentials = () => {
    setForm({
      email: 'admin@snappclone.com',
      password: 'admin123'
    });
    setIsAdminMode(true);
  };

  const handleLogin = async () => {
    console.log('🚀 LoginScreen: handleLogin called');
    
    if (!form.email || !form.password) {
      console.log('❌ LoginScreen: Missing email or password');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('📝 LoginScreen: Form data:', { email: form.email, password: '***' });
    setLoading(true);
    
    try {
      console.log('🔄 LoginScreen: Calling login function...');
      const success = await login(form.email, form.password);
      
      if (success) {
        console.log('✅ LoginScreen: Login successful, navigation should happen automatically');
      } else {
        console.log('❌ LoginScreen: Login failed, showing error alert');
        Alert.alert('Error', 'Invalid email or password');
      }
    } catch (error) {
      console.error('❌ LoginScreen: Login error caught:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      console.log('🏁 LoginScreen: Setting loading to false');
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register' as never);
  };

  const styles = useThemedStyles(createStyles);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
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
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={themeColors.textDisabled}
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={navigateToRegister}
          >
            <Text style={styles.linkText}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adminButton, isAdminMode && styles.adminButtonActive]}
            onPress={fillAdminCredentials}
          >
            <Text style={[styles.adminButtonText, isAdminMode && styles.adminButtonTextActive]}>
              {isAdminMode ? '✓ Admin Mode' : '🔧 Login as Admin'}
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
    marginBottom: 40,
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
  inputContainer: {
    marginBottom: 20,
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
  adminButton: {
    alignItems: 'center',
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: 'transparent',
  },
  adminButtonActive: {
    backgroundColor: colors.warning,
  },
  adminButtonText: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  adminButtonTextActive: {
    color: colors.buttonText,
  },
});

export default LoginScreen;