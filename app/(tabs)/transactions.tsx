import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArrowUpRight, ArrowDownRight, Filter, Calendar, ChevronDown, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { apiService } from '@/services/api';

interface Transaction {
  id: string;
  transaction_type: 'credit' | 'debit';
  user_amount: string;
  description: string;
  reference_number: string;
  status: {
    label: string;
    color: string;
  };
  created_at: string;
  transaction_category?: {
    category: string;
  };
  instrument_code?: string;
  user_charge_amount?: string;
}

export default function TransactionsScreen() {
  const { user, appSettings, walletBalance } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const primaryColor = appSettings?.['customized-app-primary-color'] || '#4361ee';

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async (page = 1, refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
      setCurrentPage(1);
    } else if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await apiService.getTransactions(page, 10);
      
      if (response.status && response.data?.transactions?.data) {
        const newTransactions = response.data.transactions.data;
        
        if (page === 1 || refresh) {
          setTransactions(newTransactions);
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
        }
        
        // Check if there are more pages
        setHasMorePages(response.data.transactions.current_page < response.data.transactions.last_page);
        setCurrentPage(response.data.transactions.current_page);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    await loadTransactions(1, true);
  };

  const handleLoadMore = async () => {
    if (hasMorePages && !isLoadingMore) {
      await loadTransactions(currentPage + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTransactionPress = (transaction: Transaction) => {
    router.push({
      pathname: '/transaction-details',
      params: {
        transactionData: JSON.stringify(transaction)
      }
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'credit') return matchesSearch && transaction.transaction_type === 'credit';
    if (selectedFilter === 'debit') return matchesSearch && transaction.transaction_type === 'debit';
    
    return matchesSearch;
  });

  // Calculate totals
  const totalIn = transactions
    .filter(t => t.transaction_type === 'credit')
    .reduce((sum, t) => sum + parseFloat(t.user_amount), 0);
  
  const totalOut = transactions
    .filter(t => t.transaction_type === 'debit')
    .reduce((sum, t) => sum + parseFloat(t.user_amount), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.headerRight}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceAmount}>₦{walletBalance.toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterVisible(!filterVisible)}
          >
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Options */}
      {filterVisible && (
        <View style={styles.filterOptions}>
          <TouchableOpacity 
            style={[styles.filterOption, selectedFilter === 'all' && { backgroundColor: `${primaryColor}20` }]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && { color: primaryColor }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterOption, selectedFilter === 'credit' && { backgroundColor: '#10b98120' }]}
            onPress={() => setSelectedFilter('credit')}
          >
            <Text style={[styles.filterText, selectedFilter === 'credit' && { color: '#10b981' }]}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterOption, selectedFilter === 'debit' && { backgroundColor: '#ef444420' }]}
            onPress={() => setSelectedFilter('debit')}
          >
            <Text style={[styles.filterText, selectedFilter === 'debit' && { color: '#ef4444' }]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateFilter}>
            <Calendar size={16} color="#94a3b8" />
            <Text style={styles.dateFilterText}>Date</Text>
            <ChevronDown size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#10b98120' }]}>
          <Text style={styles.summaryLabel}>Total In</Text>
          <Text style={[styles.summaryAmount, { color: '#10b981' }]}>₦{totalIn.toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#ef444420' }]}>
          <Text style={styles.summaryLabel}>Total Out</Text>
          <Text style={[styles.summaryAmount, { color: '#ef4444' }]}>₦{totalOut.toLocaleString()}</Text>
        </View>
      </View>

      {/* Transactions List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.transactionsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = (layoutMeasurement.height + contentOffset.y) >= (contentSize.height - 20);
            
            if (isCloseToBottom && hasMorePages && !isLoadingMore) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {filteredTransactions.length > 0 ? (
            <>
              {filteredTransactions.map((transaction) => (
                <TouchableOpacity 
                  key={transaction.id} 
                  style={styles.transactionItem}
                  onPress={() => handleTransactionPress(transaction)}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIconContainer,
                      { backgroundColor: transaction.transaction_type === 'credit' ? '#10b98120' : '#ef444420' }
                    ]}>
                      {transaction.transaction_type === 'credit' ? (
                        <ArrowDownRight size={18} color="#10b981" />
                      ) : (
                        <ArrowUpRight size={18} color="#ef4444" />
                      )}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={styles.transactionDate}>{formatDate(transaction.created_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transaction.transaction_type === 'credit' ? '#10b981' : '#ef4444' }
                    ]}>
                      {transaction.transaction_type === 'credit' ? '+' : '-'}₦{parseFloat(transaction.user_amount).toLocaleString()}
                    </Text>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: transaction.status?.color || '#6B7280' }
                    ]}>
                      <Text style={styles.statusText}>{transaction.status?.label || 'Unknown'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              
              {isLoadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={primaryColor} />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <AlertCircle size={64} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery 
                  ? 'Try adjusting your search criteria'
                  : 'Your transaction history will appear here'
                }
              </Text>
            </View>
          )}
          
          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingRight: Platform.OS === 'web' ? 200 : 0, // Add padding for web sidebar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0f172a',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceInfo: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  balanceAmount: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterOptions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#334155',
    marginLeft: 'auto',
    gap: 4,
  },
  dateFilterText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#94a3b8',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#94a3b8',
    marginTop: 12,
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingMoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  bottomSpacing: {
    height: 100,
  },
});