import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { User } from '../../services/adminApi';

// Debug logging utility
const debugLog = (component: string, action: string, data?: any) => {
  console.log(`🔧 [${component}::${action}]`, data ? JSON.stringify(data, null, 2) : '');
};

const errorLog = (component: string, action: string, error: any) => {
  console.error(`❌ [${component}::${action}] ERROR:`, error);
  if (error?.message) {
    console.error(`❌ [${component}::${action}] Error Message:`, error.message);
  }
  console.error(`❌ [${component}::${action}] Full Error:`, error);
};

const AdminUserManagement: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    users,
    usersLoading: loading,
    usersError: error,
    fetchUsers,
    updateUser,
    deleteUser
  } = useAdmin();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RIDER' | 'DRIVER' | 'ADMIN'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  debugLog('AdminUserManagement', 'Component initialized', {
    currentUser: user ? { id: user.id, email: user.email, userType: user.userType } : null,
    usersCount: users.length,
    loading,
    error: !!error,
    searchQuery,
    filterType,
    currentPage
  });

  // fetchUsers is now provided by AdminContext

  const onRefresh = async () => {
    debugLog('AdminUserManagement', 'onRefresh started', { currentPage, usersCount: users.length });
    setRefreshing(true);
    setCurrentPage(1);
    try {
      await fetchUsers();
      debugLog('AdminUserManagement', 'onRefresh completed successfully', { newUsersCount: users.length });
    } catch (error) {
      errorLog('AdminUserManagement', 'onRefresh failed', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    debugLog('AdminUserManagement', 'handleSearch triggered', { searchQuery, filterType, currentPage });
    setCurrentPage(1);
    try {
      fetchUsers();
      debugLog('AdminUserManagement', 'handleSearch completed');
    } catch (error) {
      errorLog('AdminUserManagement', 'handleSearch failed', error);
    }
  };

  const handleUserStatusChange = async (userId: number, action: 'activate' | 'suspend' | 'delete') => {
    debugLog('AdminUserManagement', 'handleUserStatusChange initiated', { userId, action });
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => debugLog('AdminUserManagement', 'User action cancelled', { userId, action }) },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            debugLog('AdminUserManagement', 'User action confirmed, executing', { userId, action });
            try {
              if (action === 'delete') {
                await deleteUser(userId);
                debugLog('AdminUserManagement', 'User deleted successfully', { userId });
                Alert.alert('Success', 'User deleted successfully');
              } else {
                const isActive = action === 'activate';
                await updateUser(userId, { isActive });
                debugLog('AdminUserManagement', 'User status updated successfully', { userId, action, isActive });
                Alert.alert('Success', `User ${action}d successfully`);
              }
            } catch (error) {
              errorLog('AdminUserManagement', `Error ${action}ing user`, { userId, error });
              Alert.alert('Error', 'Network error occurred');
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users;

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#4CAF50' : '#FF9800';
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'ADMIN': return '#9C27B0';
      case 'DRIVER': return '#2196F3';
      case 'USER': return '#4CAF50';
      default: return '#757575';
    }
  };

  useEffect(() => {
    debugLog('AdminUserManagement', 'useEffect triggered - fetching users', { usersCount: users.length, loading });
    try {
      fetchUsers();
    } catch (error) {
      errorLog('AdminUserManagement', 'useEffect fetchUsers failed', error);
    }
  }, [currentPage, filterType, fetchUsers]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {['ALL', 'RIDER', 'DRIVER', 'ADMIN'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              filterType === type && styles.filterButtonActive
            ]}
            onPress={() => setFilterType(type as any)}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === type && styles.filterButtonTextActive
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.usersList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userPhone}>{user.phoneNumber}</Text>
                  <View style={styles.userTags}>
                    <View style={[styles.tag, { backgroundColor: getUserTypeColor(user.userType) }]}>
                      <Text style={styles.tagText}>{user.userType}</Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: getStatusColor(user.isActive) }]}>
                      <Text style={styles.tagText}>{user.isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.activeButton]}
                    onPress={() => handleUserStatusChange(user.id, user.isActive ? 'suspend' : 'activate')}
                  >
                    <Text style={styles.actionButtonText}>{user.isActive ? 'Suspend' : 'Activate'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.suspendButton]}
                    onPress={() => handleUserStatusChange(user.id, 'delete')}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {filteredUsers.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            )}
          </ScrollView>
          
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
                onPress={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                disabled={currentPage === 1}
              >
                <Text style={styles.paginationButtonText}>Previous</Text>
              </TouchableOpacity>
              
              <Text style={styles.paginationText}>
                Page {currentPage} of {totalPages}
              </Text>
              
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
                onPress={() => {
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.paginationButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     padding: 50,
   },
   loadingText: {
     marginTop: 10,
     fontSize: 16,
     color: '#666',
   },
   errorContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     padding: 50,
   },
   errorText: {
     fontSize: 16,
     color: '#F44336',
     textAlign: 'center',
     marginBottom: 20,
   },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  usersList: {
    flex: 1,
    padding: 15,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfo: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  userTags: {
    flexDirection: 'row',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  suspendButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default AdminUserManagement;