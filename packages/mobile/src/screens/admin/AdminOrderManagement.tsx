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
import { Order } from '../../services/adminApi';

// Debug logging utility
const debugLog = (component: string, action: string, data?: any) => {
  console.log(`🚚 [${component}::${action}]`, data ? JSON.stringify(data, null, 2) : '');
};

const errorLog = (component: string, action: string, error: any) => {
  console.error(`❌ [${component}::${action}] ERROR:`, error);
  if (error?.message) {
    console.error(`❌ [${component}::${action}] Error Message:`, error.message);
  }
  console.error(`❌ [${component}::${action}] Full Error:`, error);
};

const AdminOrderManagement: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    orders,
    ordersLoading: loading,
    ordersError: error,
    fetchOrders,
    updateOrderStatus
  } = useAdmin();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  debugLog('AdminOrderManagement', 'Component initialized', {
    currentUser: user ? { id: user.id, email: user.email, userType: user.userType } : null,
    ordersCount: orders.length,
    loading,
    error: !!error,
    searchQuery,
    filterStatus,
    currentPage
  });

  // fetchOrders is now provided by AdminContext

  const onRefresh = async () => {
    debugLog('AdminOrderManagement', 'onRefresh started', { currentPage, ordersCount: orders.length });
    setRefreshing(true);
    try {
      await fetchOrders();
      debugLog('AdminOrderManagement', 'onRefresh completed successfully', { newOrdersCount: orders.length });
    } catch (error) {
      errorLog('AdminOrderManagement', 'onRefresh failed', error);
    } finally {
      setRefreshing(false);
    }
  };



  const handleOrderStatusChange = (orderId: number, newStatus: Order['status']) => {
    debugLog('AdminOrderManagement', 'handleOrderStatusChange initiated', { orderId, newStatus });
    Alert.alert(
      'Change Order Status',
      `Are you sure you want to change this order's status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => debugLog('AdminOrderManagement', 'Order status change cancelled', { orderId, newStatus }) },
        {
          text: 'Confirm',
          onPress: async () => {
            debugLog('AdminOrderManagement', 'Order status change confirmed, executing', { orderId, newStatus });
            try {
              await updateOrderStatus(orderId, newStatus);
              debugLog('AdminOrderManagement', 'Order status updated successfully', { orderId, newStatus });
              Alert.alert('Success', 'Order status updated successfully');
            } catch (error) {
              errorLog('AdminOrderManagement', 'Error updating order status', { orderId, newStatus, error });
              Alert.alert('Error', 'Failed to update order status');
            }
          }
        }
      ]
    );
  };

  const handleAssignDriver = async (orderId: number, driverId: number) => {
    debugLog('AdminOrderManagement', 'handleAssignDriver initiated', { orderId, driverId });
    try {
      await updateOrderStatus(orderId, 'ASSIGNED');
      debugLog('AdminOrderManagement', 'Driver assigned successfully', { orderId, driverId });
      Alert.alert('Success', 'Driver assigned successfully');
    } catch (error) {
      errorLog('AdminOrderManagement', 'Failed to assign driver', { orderId, driverId, error });
      Alert.alert('Error', 'Failed to assign driver');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toString().includes(searchQuery.toLowerCase()) ||
                         order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (order.driver && order.driver.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesFilter = true;
    if (filterStatus !== 'ALL') {
      matchesFilter = order.status === filterStatus;
    }
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'ASSIGNED': return '#2196F3';
      case 'IN_PROGRESS': return '#9C27B0';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      default: return '#757575';
    }
  };



  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filterStatus, fetchOrders]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading orders...</Text>
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
        <Text style={styles.title}>Order Management</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders by number, customer, or driver..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {['ALL', 'PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus(status as any)}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === status && styles.filterButtonTextActive
            ]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrders()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.ordersList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filteredOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>Order #{order.id}</Text>
                  <Text style={styles.orderAmount}>{formatCurrency(order.actualFare || order.estimatedFare)}</Text>
                </View>
                
                <View style={styles.orderInfo}>
                  <Text style={styles.customerName}>Customer: {order.user?.name || 'Unknown'}</Text>
                  <Text style={styles.customerPhone}>{order.user?.phoneNumber || 'N/A'}</Text>
                  {order.driver && (
                    <Text style={styles.driverName}>Driver: {order.driver.name}</Text>
                  )}
                  <Text style={styles.orderTime}>Created: {formatDateTime(order.createdAt)}</Text>
                </View>

                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>Pickup:</Text>
                  <Text style={styles.addressText}>{order.pickupAddress}</Text>
                  <Text style={styles.addressLabel}>Destination:</Text>
                  <Text style={styles.addressText}>{order.destinationAddress}</Text>
                </View>

                <View style={styles.orderTags}>
                  <View style={[styles.tag, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.tagText}>{order.status}</Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  {order.status === 'PENDING' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleOrderStatusChange(order.id, 'ASSIGNED')}
                    >
                      <Text style={styles.actionButtonText}>Assign</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'ASSIGNED' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deliverButton]}
                      onPress={() => handleOrderStatusChange(order.id, 'PICKED_UP')}
                    >
                      <Text style={styles.actionButtonText}>Pick Up</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'PICKED_UP' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deliverButton]}
                      onPress={() => handleOrderStatusChange(order.id, 'IN_TRANSIT')}
                    >
                      <Text style={styles.actionButtonText}>In Transit</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'IN_TRANSIT' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deliverButton]}
                      onPress={() => handleOrderStatusChange(order.id, 'DELIVERED')}
                    >
                      <Text style={styles.actionButtonText}>Deliver</Text>
                    </TouchableOpacity>
                  )}
                  {['PENDING', 'ASSIGNED'].includes(order.status) && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleOrderStatusChange(order.id, 'CANCELLED')}
                    >
                      <Text style={styles.actionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            
            {filteredOrders.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No orders found</Text>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  ordersList: {
    flex: 1,
    padding: 15,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  orderInfo: {
    marginBottom: 10,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  driverName: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 3,
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
  },
  addressContainer: {
    marginBottom: 10,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 5,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  orderTags: {
    flexDirection: 'row',
    marginBottom: 15,
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
  orderActions: {
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
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  deliverButton: {
    backgroundColor: '#2196F3',
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
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AdminOrderManagement;