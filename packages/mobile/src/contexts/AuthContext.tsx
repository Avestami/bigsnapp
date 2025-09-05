import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserType } from '../types/user';
import apiService from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  userType: UserType;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        const userData = await AsyncStorage.getItem(USER_KEY);
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔐 Starting login process for:', email);
      
      const response = await apiService.login(email, password);
      console.log('✅ Login Response Status:', response.status);
      console.log('✅ Login Response Data:', JSON.stringify(response.data, null, 2));
      
      // Fix: The response structure is response.data, which contains user and tokens directly
      if (!response.data || !response.data.user || !response.data.tokens) {
        console.error('❌ Invalid response structure:', response.data);
        console.error('❌ Validation failed at:');
        console.error('- response.data:', !!response.data);
        console.error('- response.data.user:', !!response.data?.user);
        console.error('- response.data.tokens:', !!response.data?.tokens);
        throw new Error('Invalid response structure from server');
      }
      
      const { user: userData, tokens } = response.data;
      console.log('👤 User Data:', JSON.stringify(userData, null, 2));
      console.log('🔑 Tokens received:', tokens ? 'Yes' : 'No');
      
      if (!userData || !tokens) {
        console.error('❌ Missing user data or tokens in response');
        throw new Error('Missing user data or tokens in response');
      }
      
      // Store tokens and user data
      await AsyncStorage.setItem(TOKEN_KEY, tokens.accessToken);
      await AsyncStorage.setItem('refresh_token', tokens.refreshToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      console.log('💾 Stored user data and tokens successfully');
      
      setUser(userData);
      console.log('🎉 Login completed successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Login failed:', error.message || error);
      console.error('❌ Full error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, 'refresh_token', USER_KEY]);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshUser = async () => {
    try {
      // In a real app, you might want to fetch fresh user data from the server
      const userData = await AsyncStorage.getItem(USER_KEY);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};