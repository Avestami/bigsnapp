import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import adminApiService, { User, Order, Analytics, Settings } from '../services/adminApi';

// Debug logging utility
const debugLog = (component: string, action: string, data?: any) => {
  console.log(`🔍 [AdminContext::${component}] ${action}`, data ? JSON.stringify(data, null, 2) : '');
};

const errorLog = (component: string, action: string, error: any) => {
  console.error(`❌ [AdminContext::${component}] ${action} ERROR:`, error);
  if (error?.response) {
    console.error(`❌ [AdminContext::${component}] Response Status:`, error.response.status);
    console.error(`❌ [AdminContext::${component}] Response Data:`, error.response.data);
  }
  if (error?.message) {
    console.error(`❌ [AdminContext::${component}] Error Message:`, error.message);
  }
  console.error(`❌ [AdminContext::${component}] Full Error:`, error);
};

interface AdminContextType {
  // Users
  users: User[];
  usersLoading: boolean;
  usersError: string | null;
  fetchUsers: () => Promise<void>;
  updateUser: (userId: number, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  promoteToDriver: (userId: number, licenseNumber: string) => Promise<void>;
  
  // Orders
  orders: Order[];
  ordersLoading: boolean;
  ordersError: string | null;
  fetchOrders: (page?: number, limit?: number, status?: string, search?: string) => Promise<void>;
  updateOrderStatus: (orderId: number, status: Order['status']) => Promise<void>;
  
  // Analytics
  analytics: Analytics | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
  fetchAnalytics: () => Promise<void>;
  
  // Settings
  settings: Settings[] | null;
  settingsLoading: boolean;
  settingsError: string | null;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  
  // General
  refreshAll: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  debugLog('Provider', 'AdminProvider - Component initializing');
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState<Settings[] | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  
  debugLog('Provider', 'AdminProvider - State initialized', {
    usersCount: users.length,
    ordersCount: orders.length,
    hasAnalytics: !!analytics,
    settingsCount: settings?.length || 0
  });
  
  // Users functions
  const fetchUsers = useCallback(async () => {
    debugLog('Users', 'fetchUsers - Starting');
    setUsersLoading(true);
    setUsersError(null);
    try {
      debugLog('Users', 'fetchUsers - Calling adminApiService.getUsers()');
      const response = await adminApiService.getUsers();
      debugLog('Users', 'fetchUsers - API Response received', {
        usersCount: response.users?.length || 0,
        total: response.total,
        page: response.page,
        totalPages: response.totalPages
      });
      setUsers(response.users);
      debugLog('Users', 'fetchUsers - State updated successfully');
    } catch (error) {
      errorLog('Users', 'fetchUsers', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      setUsersError(errorMessage);
      debugLog('Users', 'fetchUsers - Error state set', { errorMessage });
    } finally {
      setUsersLoading(false);
      debugLog('Users', 'fetchUsers - Loading state set to false');
    }
  }, []);
  
  const updateUser = useCallback(async (userId: number, updates: Partial<User>) => {
    debugLog('Users', 'updateUser - Starting', { userId, updates });
    try {
      // Use updateUserStatus for now - this may need to be expanded based on what updates are needed
      if ('isActive' in updates && typeof updates.isActive === 'boolean') {
        debugLog('Users', 'updateUser - Calling adminApiService.updateUserStatus()');
        await adminApiService.updateUserStatus(userId, updates.isActive);
      }
      debugLog('Users', 'updateUser - API call successful, updating local state');
      setUsers(prev => {
        const updatedUsers = prev.map(user => 
          user.id === userId ? { ...user, ...updates } : user
        );
        debugLog('Users', 'updateUser - Local state updated', { 
          userId, 
          updatedUser: updatedUsers.find(u => u.id === userId) 
        });
        return updatedUsers;
      });
    } catch (error) {
      errorLog('Users', 'updateUser', error);
      throw error;
    }
  }, []);
  
  const deleteUser = useCallback(async (userId: number) => {
    debugLog('Users', 'deleteUser - Starting', { userId });
    try {
      debugLog('Users', 'deleteUser - Calling adminApiService.deleteUser()');
      await adminApiService.deleteUser(userId);
      debugLog('Users', 'deleteUser - API call successful, updating local state');
      setUsers(prev => {
        const filteredUsers = prev.filter(user => user.id !== userId);
        debugLog('Users', 'deleteUser - Local state updated', { 
          deletedUserId: userId, 
          remainingUsersCount: filteredUsers.length 
        });
        return filteredUsers;
      });
    } catch (error) {
      errorLog('Users', 'deleteUser', error);
      throw error;
    }
  }, []);
  
  const promoteToDriver = useCallback(async (userId: number, licenseNumber: string) => {
     debugLog('Users', 'promoteToDriver - Starting', { userId, licenseNumber });
     try {
       debugLog('Users', 'promoteToDriver - Calling adminApiService.promoteToDriver()');
       const updatedUser = await adminApiService.promoteToDriver(userId, licenseNumber);
       debugLog('Users', 'promoteToDriver - API call successful, updating local state');
       setUsers(prev => {
         const updatedUsers = prev.map(user => 
           user.id === userId ? updatedUser : user
         );
         debugLog('Users', 'promoteToDriver - Local state updated', { 
           userId, 
           updatedUser: updatedUsers.find(u => u.id === userId) 
         });
         return updatedUsers;
       });
     } catch (error) {
       errorLog('Users', 'promoteToDriver', error);
       throw error;
     }
   }, []);
  
  // Orders functions
  const fetchOrders = useCallback(async (page = 1, limit = 20, status?: string, search?: string) => {
    debugLog('Orders', 'fetchOrders - Starting', { page, limit, status, search });
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      debugLog('Orders', 'fetchOrders - Calling adminApiService.getOrders()');
      const response = await adminApiService.getOrders(page, limit, status, search);
      debugLog('Orders', 'fetchOrders - API Response received', {
        ordersCount: response.orders?.length || 0,
        total: response.total,
        page: response.page,
        totalPages: response.totalPages
      });
      setOrders(response.orders);
      debugLog('Orders', 'fetchOrders - State updated successfully');
    } catch (error) {
      errorLog('Orders', 'fetchOrders', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
      setOrdersError(errorMessage);
      debugLog('Orders', 'fetchOrders - Error state set', { errorMessage });
    } finally {
      setOrdersLoading(false);
      debugLog('Orders', 'fetchOrders - Loading state set to false');
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: number, status: Order['status']) => {
    debugLog('Orders', 'updateOrderStatus - Starting', { orderId, status });
    try {
      debugLog('Orders', 'updateOrderStatus - Calling adminApiService.updateOrderStatus()');
      await adminApiService.updateOrderStatus(orderId, status);
      debugLog('Orders', 'updateOrderStatus - API call successful, updating local state');
      setOrders(prev => {
        const updatedOrders = prev.map(order => 
          order.id === orderId ? { ...order, status } : order
        );
        debugLog('Orders', 'updateOrderStatus - Local state updated', { 
          orderId, 
          newStatus: status,
          updatedOrder: updatedOrders.find(o => o.id === orderId)
        });
        return updatedOrders;
      });
    } catch (error) {
      errorLog('Orders', 'updateOrderStatus', error);
      throw error;
    }
  }, []);
  
  // Analytics functions
  const fetchAnalytics = useCallback(async () => {
    debugLog('Analytics', 'fetchAnalytics - Starting');
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      debugLog('Analytics', 'fetchAnalytics - Calling adminApiService.getAnalytics()');
      const response = await adminApiService.getAnalytics();
      debugLog('Analytics', 'fetchAnalytics - API Response received', {
        totalUsers: response.totalUsers,
        totalOrders: response.totalOrders,
        totalRevenue: response.totalRevenue,
        activeDrivers: response.activeDrivers
      });
      setAnalytics(response);
      debugLog('Analytics', 'fetchAnalytics - State updated successfully');
    } catch (error) {
      errorLog('Analytics', 'fetchAnalytics', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics';
      setAnalyticsError(errorMessage);
      debugLog('Analytics', 'fetchAnalytics - Error state set', { errorMessage });
    } finally {
      setAnalyticsLoading(false);
      debugLog('Analytics', 'fetchAnalytics - Loading state set to false');
    }
  }, []);
  
  // Settings functions
  const fetchSettings = useCallback(async () => {
    debugLog('Settings', 'fetchSettings - Starting');
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      debugLog('Settings', 'fetchSettings - Calling adminApiService.getSettings()');
      const response = await adminApiService.getSettings();
      debugLog('Settings', 'fetchSettings - API Response received', {
        settingsCount: response?.length || 0,
        settings: response?.map(s => ({ key: s.key, category: s.category })) || []
      });
      setSettings(response);
      debugLog('Settings', 'fetchSettings - State updated successfully');
    } catch (error) {
      errorLog('Settings', 'fetchSettings', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch settings';
      setSettingsError(errorMessage);
      debugLog('Settings', 'fetchSettings - Error state set', { errorMessage });
    } finally {
      setSettingsLoading(false);
      debugLog('Settings', 'fetchSettings - Loading state set to false');
    }
  }, []);

  const updateSetting = useCallback(async (key: string, value: string) => {
    debugLog('Settings', 'updateSetting - Starting', { key, value });
    try {
      debugLog('Settings', 'updateSetting - Calling adminApiService.updateSetting()');
      await adminApiService.updateSetting(key, value);
      debugLog('Settings', 'updateSetting - API call successful, updating local state');
      setSettings(prev => {
        const updatedSettings = prev ? prev.map(setting => 
          setting.key === key ? { ...setting, value } : setting
        ) : null;
        debugLog('Settings', 'updateSetting - Local state updated', { 
          key, 
          newValue: value,
          updatedSetting: updatedSettings?.find(s => s.key === key)
        });
        return updatedSettings;
      });
    } catch (error) {
      errorLog('Settings', 'updateSetting', error);
      throw error;
    }
  }, []);
  
  // General functions
  const refreshAll = useCallback(async () => {
    debugLog('General', 'refreshAll - Starting refresh of all admin data');
    try {
      await Promise.all([
        fetchUsers(),
        fetchOrders(),
        fetchAnalytics(),
        fetchSettings()
      ]);
      debugLog('General', 'refreshAll - All data refreshed successfully');
    } catch (error) {
      errorLog('General', 'refreshAll', error);
      throw error;
    }
  }, [fetchUsers, fetchOrders, fetchAnalytics, fetchSettings]);
  
  const value: AdminContextType = {
    // Users
    users,
    usersLoading,
    usersError,
    fetchUsers,
    updateUser,
    deleteUser,
    promoteToDriver,
    
    // Orders
    orders,
    ordersLoading,
    ordersError,
    fetchOrders,
    updateOrderStatus,
    
    // Analytics
    analytics,
    analyticsLoading,
    analyticsError,
    fetchAnalytics,
    
    // Settings
    settings,
    settingsLoading,
    settingsError,
    fetchSettings,
    updateSetting,
    
    // General
    refreshAll
  };

  debugLog('Provider', 'AdminProvider - Context value created', {
    usersCount: users.length,
    usersLoading,
    usersError: !!usersError,
    ordersCount: orders.length,
    ordersLoading,
    ordersError: !!ordersError,
    hasAnalytics: !!analytics,
    analyticsLoading,
    analyticsError: !!analyticsError,
    settingsCount: settings?.length || 0,
    settingsLoading,
    settingsError: !!settingsError
  });

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};