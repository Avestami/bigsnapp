import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiService from '../../services/api';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  category: 'RIDE' | 'DELIVERY' | 'TOPUP' | 'REFUND' | 'CASHBACK';
}

interface WalletData {
  balance: number;
  totalEarnings: number;
  totalSpent: number;
  transactions: Transaction[];
}

const WalletScreen: React.FC = () => {
  const navigation = useNavigation();
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 1250.50,
    totalEarnings: 5420.00,
    totalSpent: 4169.50,
    transactions: [
      {
        id: '1',
        type: 'DEBIT',
        amount: 85.00,
        description: 'Delivery to Connaught Place',
        date: '2024-01-15T10:30:00Z',
        status: 'COMPLETED',
        category: 'DELIVERY',
      },
      {
        id: '2',
        type: 'CREDIT',
        amount: 500.00,
        description: 'Wallet Top-up via UPI',
        date: '2024-01-15T09:15:00Z',
        status: 'COMPLETED',
        category: 'TOPUP',
      },
      {
        id: '3',
        type: 'DEBIT',
        amount: 120.00,
        description: 'Ride to Airport',
        date: '2024-01-14T18:45:00Z',
        status: 'COMPLETED',
        category: 'RIDE',
      },
      {
        id: '4',
        type: 'CREDIT',
        amount: 25.00,
        description: 'Cashback on ride',
        date: '2024-01-14T18:50:00Z',
        status: 'COMPLETED',
        category: 'CASHBACK',
      },
      {
        id: '5',
        type: 'CREDIT',
        amount: 150.00,
        description: 'Refund for cancelled ride',
        date: '2024-01-13T16:20:00Z',
        status: 'COMPLETED',
        category: 'REFUND',
      },
    ],
  });
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const quickTopupAmounts = [100, 200, 500, 1000, 2000, 5000];

  console.log('💰 WalletScreen: Component loaded');
  console.log('💰 WalletScreen: Initial wallet data:', walletData);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    console.log('💰 WalletScreen: Fetching wallet data from API');
    setRefreshing(true);
    try {
      const walletResponse = await apiService.getWallet();
      console.log('💰 WalletScreen: Wallet API response:', walletResponse.data);
      
      const transactionsResponse = await apiService.getWalletTransactions();
      console.log('💰 WalletScreen: Transactions API response:', transactionsResponse.data);
      
      // Update wallet data with API response
      if (walletResponse.data) {
        setWalletData(prev => ({
          ...prev,
          balance: walletResponse.data.balance || 0,
          // Keep existing earnings and spending for now
        }));
      }
      
      if (transactionsResponse.data?.transactions) {
        setWalletData(prev => ({
          ...prev,
          transactions: transactionsResponse.data.transactions.map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            description: t.description,
            date: t.createdAt || t.date,
            status: t.status || 'COMPLETED',
            category: t.type === 'CREDIT' ? 'TOPUP' : 'PAYMENT',
          }))
        }));
      }
      
      console.log('✅ WalletScreen: Wallet data updated successfully');
    } catch (error) {
      console.error('❌ WalletScreen: Error fetching wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTransactions = walletData.transactions.filter(transaction => {
    if (selectedFilter === 'ALL') return true;
    return transaction.type === selectedFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (category: string) => {
    switch (category) {
      case 'RIDE': return '🚗';
      case 'DELIVERY': return '📦';
      case 'TOPUP': return '💳';
      case 'REFUND': return '↩️';
      case 'CASHBACK': return '🎁';
      default: return '💰';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#34C759';
      case 'PENDING': return '#FF9500';
      case 'FAILED': return '#FF3B30';
      default: return '#666';
    }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    console.log('💰 WalletScreen: Attempting topup with amount:', amount);
    
    if (!amount || amount <= 0) {
      console.log('❌ WalletScreen: Invalid amount entered:', topupAmount);
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount < 10) {
      console.log('❌ WalletScreen: Amount below minimum:', amount);
      Alert.alert('Error', 'Minimum top-up amount is 10000 تومان');
      return;
    }

    if (amount > 50000) {
      console.log('❌ WalletScreen: Amount above maximum:', amount);
      Alert.alert('Error', 'Maximum top-up amount is 50,000,000 تومان');
      return;
    }

    setLoading(true);
    try {
      console.log('💰 WalletScreen: Calling API to add money to wallet');
      const response = await apiService.addMoneyToWallet(amount, 'UPI');
      console.log('💰 WalletScreen: Topup API response:', response.data);

      // Refresh wallet data after successful topup
      await fetchWalletData();

      setShowTopupModal(false);
      setTopupAmount('');
      console.log('✅ WalletScreen: Topup completed successfully');
      Alert.alert('Success', `${amount} تومان added to your wallet successfully!`);
    } catch (error) {
      console.error('❌ WalletScreen: Topup failed:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={styles.transactionIcon}>
          <Text style={styles.transactionEmoji}>{getTransactionIcon(item.category)}</Text>
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
          <View style={styles.transactionStatus}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'CREDIT' ? '#34C759' : '#FF3B30' }
        ]}>
          {item.type === 'CREDIT' ? '+' : '-'}{item.amount.toFixed(0)} تومان
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>My Wallet</Text>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <TouchableOpacity
              style={styles.topupButton}
              onPress={() => setShowTopupModal(true)}
            >
              <Text style={styles.topupButtonText}>+ Add Money</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>{walletData.balance.toFixed(0)} تومان</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Earnings</Text>
              <Text style={styles.statValue}>{walletData.totalEarnings.toFixed(0)} تومان</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>{walletData.totalSpent.toFixed(0)} تومان</Text>
            </View>
          </View>
        </View>

        <View style={styles.transactionsContainer}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Recent Transactions</Text>
            <View style={styles.filterContainer}>
              {['ALL', 'CREDIT', 'DEBIT'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedFilter(filter as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedFilter === filter && styles.filterButtonTextActive
                  ]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <FlatList
            data={filteredTransactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchWalletData}
                colors={['#007AFF']}
                tintColor="#007AFF"
              />
            }
            ItemSeparatorComponent={() => <View style={styles.transactionSeparator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No transactions found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>

      <Modal
        visible={showTopupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTopupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Money to Wallet</Text>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>تومان</Text>
              <TextInput
                style={styles.amountInput}
                value={topupAmount}
                onChangeText={setTopupAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <View style={styles.quickAmountsContainer}>
              <Text style={styles.quickAmountsTitle}>Quick Add</Text>
              <View style={styles.quickAmountsGrid}>
                {quickTopupAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmountButton}
                    onPress={() => setTopupAmount(amount.toString())}
                  >
                    <Text style={styles.quickAmountText}>{amount} تومان</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTopupModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, loading && styles.buttonDisabled]}
                onPress={handleTopup}
                disabled={loading}
              >
                <Text style={styles.modalConfirmText}>
                  {loading ? 'Processing...' : 'Add Money'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.themeColors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: theme.themeColors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.themeColors.textPrimary,
  },
  balanceCard: {
    backgroundColor: theme.themeColors.brand,
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    color: theme.themeColors.textInverse,
    fontSize: 16,
    opacity: 0.9,
  },
  topupButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  topupButtonText: {
    color: theme.themeColors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    color: theme.themeColors.textInverse,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: theme.themeColors.textInverse,
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  statValue: {
    color: theme.themeColors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  transactionsContainer: {
    backgroundColor: theme.themeColors.surface,
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  transactionsHeader: {
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.themeColors.textPrimary,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.themeColors.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: theme.themeColors.brand,
  },
  filterButtonText: {
    fontSize: 12,
    color: theme.themeColors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.themeColors.textInverse,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.themeColors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: theme.themeColors.textPrimary,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: theme.themeColors.textSecondary,
    marginTop: 2,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionSeparator: {
    height: 1,
    backgroundColor: theme.themeColors.border,
    marginVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.themeColors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.themeColors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.themeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.themeColors.brand,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 24,
    color: theme.themeColors.brand,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    color: theme.themeColors.textPrimary,
    paddingVertical: 12,
  },
  quickAmountsContainer: {
    marginBottom: 24,
  },
  quickAmountsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.themeColors.textPrimary,
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: theme.themeColors.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    color: theme.themeColors.textPrimary,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: theme.themeColors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: theme.themeColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: theme.themeColors.brand,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: theme.themeColors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: theme.themeColors.disabled,
  },
});

export default WalletScreen;