/* -------------------------------------------------------------------------- */
/*  TransactionsScreen – fully responsive (mobile, tablet, web, desktop)      */
/* -------------------------------------------------------------------------- */

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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  ChevronDown,
  CircleAlert as AlertCircle,
  Copy,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { apiService } from '@/services/api';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
interface Transaction {
  id: string;
  transaction_type: 'credit' | 'debit';
  user_amount: string;
  description: string;
  reference_number: string;
  status: { label: string; color: string };
  created_at: string;
  transaction_category?: { category: string };
  instrument_code?: string;
  user_charge_amount?: string;
}

/* -------------------------------------------------------------------------- */
/*  Screen Component                                                          */
/* -------------------------------------------------------------------------- */
export default function TransactionsScreen() {
  /* -------- responsive helpers -------- */
  const { width } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && width < 768;
  const gutter =
    Platform.OS === 'web'
      ? width < 961
        ? 0
        : width >= 1366
        ? 240
        : 160
      : 0;
  const MAX_W = 1240; // max inner width for desktop

  /* -------- state -------- */
  const { user, appSettings, walletBalance } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const primaryColor = appSettings?.['customized-app-primary-color'] || '#4361ee';

  /* ------------------------------------------------------------------ */
  /*  Data loading                                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (user) loadTransactions();
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
        const newTx = response.data.transactions.data as Transaction[];
        setTransactions(page === 1 || refresh ? newTx : prev => [...prev, ...newTx]);

        setHasMorePages(
          response.data.transactions.current_page <
            response.data.transactions.last_page
        );
        setCurrentPage(response.data.transactions.current_page);
      }
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => loadTransactions(1, true);

  const handleLoadMore = () =>
    hasMorePages && !isLoadingMore && loadTransactions(currentPage + 1);

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                           */
  /* ------------------------------------------------------------------ */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.ceil(Math.abs(now.getTime() - date.getTime()) / 86400000);
    if (diff === 1) return 'Today';
    if (diff === 2) return 'Yesterday';
    if (diff <= 7) return `${diff - 1} days ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePress = (tx: Transaction) =>
    router.push({ pathname: '/transaction-details', params: { transactionData: JSON.stringify(tx) } });

  /* filter + totals */
  const filtered = transactions.filter(tx => {
    const okSearch = tx.description?.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === 'all') return okSearch;
    return okSearch && tx.transaction_type === selectedFilter;
  });

  const totalIn = transactions
    .filter(t => t.transaction_type === 'credit')
    .reduce((s, t) => s + parseFloat(t.user_amount), 0);
  const totalOut = transactions
    .filter(t => t.transaction_type === 'debit')
    .reduce((s, t) => s + parseFloat(t.user_amount), 0);

  /* ------------------------------------------------------------------ */
  /*  JSX                                                               */
  /* ------------------------------------------------------------------ */
  return (
    <SafeAreaView style={[styles.container, { paddingRight: gutter }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.screenInner} 
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
          if (
            layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 20 &&
            hasMorePages &&
            !isLoadingMore
          ) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* ---------------- HEADER ---------------- */}
        <View style={[styles.header, { maxWidth: MAX_W }]}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <View style={styles.headerRight}>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Balance:</Text>
              <Text style={styles.balanceAmount}>₦{walletBalance.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFilterVisible(p => !p)}
            >
              <Filter size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------------- FILTER BAR ---------------- */}
        {filterVisible && (
          <View style={[styles.filterOptions, { maxWidth: MAX_W }]}>
            {(['all', 'credit', 'debit'] as const).map(opt => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.filterOption,
                  selectedFilter === opt && {
                    backgroundColor:
                      opt === 'all'
                        ? `${primaryColor}20`
                        : opt === 'credit'
                        ? '#10b98120'
                        : '#ef444420',
                  },
                ]}
                onPress={() => setSelectedFilter(opt)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === opt && {
                      color:
                        opt === 'all'
                          ? primaryColor
                          : opt === 'credit'
                          ? '#10b981'
                          : '#ef4444',
                    },
                  ]}
                >
                  {opt === 'all' ? 'All' : opt === 'credit' ? 'Income' : 'Expense'}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.dateFilter}>
              <Calendar size={16} color="#94a3b8" />
              <Text style={styles.dateFilterText}>Date</Text>
              <ChevronDown size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}

        {/* ---------------- SEARCH ---------------- */}
        <View style={[styles.searchContainer, { maxWidth: MAX_W }]}>
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

        {/* ---------------- SUMMARY ---------------- */}
        {/* <View style={[styles.summaryContainer, { maxWidth: MAX_W }]}>
          <View style={[
            styles.summaryCard, 
            { 
              backgroundColor: '#10b98120',
              flex: isMobileWeb ? 1 : undefined,
              marginBottom: isMobileWeb ? 12 : 0
            }
          ]}>
            <Text style={styles.summaryLabel}>Total In</Text>
            <Text style={[styles.summaryAmount, { color: '#10b981' }]}>
              ₦{totalIn.toLocaleString()}
            </Text>
          </View>
          <View style={[
            styles.summaryCard, 
            { 
              backgroundColor: '#ef444420',
              flex: isMobileWeb ? 1 : undefined
            }
          ]}>
            <Text style={styles.summaryLabel}>Total Out</Text>
            <Text style={[styles.summaryAmount, { color: '#ef4444' }]}>
              ₦{totalOut.toLocaleString()}
            </Text>
          </View>
        </View> */}

        {/* ---------------- LIST OR LOADER ---------------- */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : (
          <View style={[styles.transactionsList, { maxWidth: MAX_W }]}>
            {filtered.length ? (
              <>
                {filtered.map(tx => (
                  <TouchableOpacity
                    key={tx.id}
                    style={styles.transactionItem}
                    onPress={() => handlePress(tx)}
                  >
                    {/* left */}
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIconContainer,
                          {
                            backgroundColor:
                              tx.transaction_type === 'credit'
                                ? '#10b98120'
                                : '#ef444420',
                          },
                        ]}
                      >
                        {tx.transaction_type === 'credit' ? (
                          <ArrowDownRight size={18} color="#10b981" />
                        ) : (
                          <ArrowUpRight size={18} color="#ef4444" />
                        )}
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDescription}>
                          {tx.description}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(tx.created_at)}
                        </Text>
                      </View>
                    </View>
                    {/* right */}
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color:
                              tx.transaction_type === 'credit'
                                ? '#10b981'
                                : '#ef4444',
                          },
                        ]}
                      >
                        {tx.transaction_type === 'credit' ? '+' : '-'}₦
                        {parseFloat(tx.user_amount).toLocaleString()}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: tx.status?.color || '#6B7280' },
                        ]}
                      >
                        <Text style={styles.statusText}>{tx.status?.label}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}

                {isLoadingMore && (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={primaryColor} />
                    <Text style={styles.loadingMoreText}>Loading more…</Text>
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
                    : 'Your transaction history will appear here'}
                </Text>
              </View>
            )}

            {/* extra space so bottom card isn't hidden under nav bars etc. */}
            <View style={{ height: 100 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles (mostly original, plus maxWidth / centred rows)                    */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  screenInner: {
    minHeight: '100%',
    alignItems: 'stretch',
  },
  /* ---------- header & right ---------- */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignSelf: 'center',
  },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins-SemiBold', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  balanceInfo: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#94a3b8' },
  balanceAmount: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---------- filter bar ---------- */
  filterOptions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
    alignSelf: 'center',
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  filterText: { fontSize: 12, fontFamily: 'Poppins-Medium', color: '#fff' },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#334155',
    gap: 4,
  },
  dateFilterText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#94a3b8',
  },

  /* ---------- search ---------- */
  searchContainer: { paddingHorizontal: 20, paddingVertical: 12, alignSelf: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins-Regular', color: '#fff' },

  /* ---------- summary ---------- */
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        flexWrap: 'wrap',
      },
    }),
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    }),
  },
  summaryLabel: { fontSize: 14, fontFamily: 'Poppins-Medium', color: '#fff', marginBottom: 4 },
  summaryAmount: { fontSize: 18, fontFamily: 'Poppins-Bold' },

  /* ---------- list ---------- */
  transactionsList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignSelf: 'center',
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
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    }),
  },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: { flex: 1 },
  transactionDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#fff',
    marginBottom: 4,
  },
  transactionDate: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#94a3b8' },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontFamily: 'Poppins-SemiBold', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { fontSize: 10, fontFamily: 'Poppins-SemiBold', color: '#fff' },

  /* loaders & empty */
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 16, fontFamily: 'Poppins-Medium', color: '#94a3b8', marginTop: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
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
  loadingMoreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  loadingMoreText: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#94a3b8' },
});
