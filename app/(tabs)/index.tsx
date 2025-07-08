import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  LogOut, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  Smartphone, 
  Wifi, 
  Zap, 
  CreditCard, 
  Send, 
  Eye, 
  EyeOff,
  Shield,
  TrendingUp,
  DollarSign,
  Calendar,
  Star,
  Tv,
  Wallet,
  PiggyBank,
  Copy,
  X,
  Info,
  Share2,
  Menu,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { SideMenu } from '@/components/SideMenu';
import { apiService } from '@/services/api';

const { width } = Dimensions.get('window');

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

export default function DashboardScreen() {
  const { user, appSettings, walletBalance, refreshProfile, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kycStatus, setKycStatus] = useState<'complete' | 'pending' | 'incomplete'>('incomplete');
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [transactionStats, setTransactionStats] = useState({
    todayCount: 0,
    todayAmount: 0,
    weeklyCount: 0,
    weeklyAmount: 0
  });

  // Get colors from API settings with fallbacks
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#4361ee';
  const secondaryColor = appSettings?.['customized-app-secondary-color'] || '#3f37c9';

  // Get wallet details
  const wallet = user?.getPrimaryWallet || user?.get_primary_wallet;

  // Get menu display settings
  const displayMenuItems = appSettings?.['customized-app-displayable-menu-items'] || {};

  useEffect(() => {
    if (user) {
      loadData();
      checkKycStatus();
    }
  }, [user]);

  const loadData = async () => {
    await Promise.all([
      loadTransactions(),
    ]);
  };

  const loadTransactions = async () => {
    if (!user) return;
    
    setIsLoadingTransactions(true);
    try {
      const response = await apiService.getTransactions(1, 5); // Get latest 5 transactions
      if (response.status && response.data?.transactions?.data) {
        setTransactions(response.data.transactions.data);
        
        // Calculate transaction stats
        calculateTransactionStats(response.data.transactions.data);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const calculateTransactionStats = (transactions: Transaction[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    let todayCount = 0;
    let todayAmount = 0;
    let weeklyCount = 0;
    let weeklyAmount = 0;
    
    transactions.forEach(transaction => {
      const txDate = new Date(transaction.created_at);
      const amount = parseFloat(transaction.user_amount);
      
      // Check if transaction is from today
      if (txDate >= today) {
        todayCount++;
        todayAmount += amount;
      }
      
      // Check if transaction is from this week
      if (txDate >= weekStart) {
        weeklyCount++;
        weeklyAmount += amount;
      }
    });
    
    setTransactionStats({
      todayCount,
      todayAmount,
      weeklyCount,
      weeklyAmount
    });
  };

  const checkKycStatus = () => {
    // Simulate checking KYC status
    const hasBvn = user?.first_kyc_verification?.documentType === 'BVN';
    const hasNin = user?.first_kyc_verification?.documentType === 'NIN';
    
    if (hasBvn && hasNin) {
      setKycStatus('complete');
    } else if (hasBvn || hasNin) {
      setKycStatus('pending');
    } else {
      setKycStatus('incomplete');
    }


  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      await loadData();
      checkKycStatus();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    router.push({
      pathname: '/transaction-details',
      params: {
        transactionData: JSON.stringify(transaction)
      }
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      router.replace('/login');
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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getKycStatusInfo = () => {
    switch (kycStatus) {
      case 'complete':
        return { color: '#10B981', text: 'Verified' };
      case 'pending':
        return { color: '#F59E0B', text: 'Pending' };
      case 'incomplete':
        return { color: '#EF4444', text: 'Incomplete' };
      default:
        return { color: '#6B7280', text: 'Unknown' };
    }
  };

  const kycStatusInfo = getKycStatusInfo();

  // console.log(kycStatusInfo);

  

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      Alert.alert('Copied', `${label} copied to clipboard`);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Filter quick actions based on API settings
  const allQuickActions = [
    { 
      title: 'Send Money', 
      icon: Send, 
      color: '#4361ee',
      route: '/bank-transfer',
      gradient: [secondaryColor, secondaryColor],
      key: 'display-bank-transfer-menu'
    },
    { 
      title: 'Wallet Transfer', 
      icon: Wallet, 
      color: '#f72585',
      route: '/wallet-transfer',
      gradient: [secondaryColor, secondaryColor],
      key: 'display-wallet-transfer-menu'
    },
    { 
      title: 'Buy Airtime', 
      icon: Smartphone, 
      color: '#7209b7',
      route: '/airtime',
      gradient: [secondaryColor, secondaryColor],
      key: 'display-airtime-menu'
    },
    { 
      title: 'Buy Data', 
      icon: Wifi, 
      color: '#4cc9f0',
      route: '/data-bundle',
      gradient: [secondaryColor, secondaryColor],
      key: 'display-data-menu'
    },
    { 
      title: 'Electricity', 
      icon: Zap, 
      color: '#f59e0b',
      route: '/electricity',
      gradient: [secondaryColor, secondaryColor],
      key: 'display-electricity-menu'
    },
    { 
      title: 'Cable TV', 
      icon: Tv, 
      color: '#8b5cf6',
      route: '/cable-tv',
      gradient: [secondaryColor, secondaryColor],
      key: 'display-cable-tv-menu'
    },
    { 
      title: 'Fixed Deposit', 
      icon: PiggyBank, 
      color: '#10b981',
      route: '/fixed-deposits',
      gradient: [secondaryColor, secondaryColor],
      key: 'display-fixed-deposit-menu'
    },
    { 
      title: 'Investments', 
      icon: TrendingUp, 
      color: '#6366f1',
      route: '/(tabs)/investments',
      gradient: [secondaryColor, secondaryColor],
      key: 'display-investment-menu'
    },
    { 
      title: 'Cards', 
      icon: CreditCard, 
      color: '#ef4444',
      route: '/cards',
      gradient: [secondaryColor, secondaryColor],
      key: 'display-virtual-card-menu'
    },
  ];

  // Filter quick actions based on API settings
  const quickActions = allQuickActions.filter(action => 
    displayMenuItems[action.key] === undefined || displayMenuItems[action.key] === true
  );

  const insightCards = [
    {
      title: 'Today\'s Transactions',
      value: transactionStats.todayCount.toString(),
      amount: `₦${transactionStats.todayAmount.toLocaleString()}`,
      icon: Calendar,
      color: '#4361ee',
      gradient: ['#4361ee', '#3a0ca3']
    },
    {
      title: 'Weekly Activity',
      value: transactionStats.weeklyCount.toString(),
      amount: `₦${transactionStats.weeklyAmount.toLocaleString()}`,
      icon: TrendingUp,
      color: '#10b981',
      gradient: ['#10b981', '#059669']
    },
    {
      title: 'Available Balance',
      value: `₦${walletBalance.toLocaleString()}`,
      description: 'Current wallet balance',
      icon: DollarSign,
      color: '#f59e0b',
      gradient: ['#f59e0b', '#d97706']
    }
  ];

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* <SideMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        user={user}
        kycStatus={kycStatus}
      /> */}
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {Platform.OS === 'web' ? (
            <></>
            // <TouchableOpacity 
            //   style={styles.menuButton}
            //   onPress={() => setMenuVisible(true)}
            // >
            //   <Menu size={24} color="#FFFFFF" />
            // </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              {user.profile_image_url ? (
                <Image 
                  source={{ uri: user.profile_image_url }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatarInitials, { backgroundColor: primaryColor }]}>
                 <Text style={styles.initialsText}>{getInitials(user.full_name)}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.greeting}>Hi, {user.first_name} 👋</Text>
            <Text style={styles.subGreeting}>Welcome back</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {/* KYC Status Button */}
          <TouchableOpacity 
            style={[styles.kycButton, { backgroundColor: kycStatusInfo.color + '20', borderColor: kycStatusInfo.color }]}
            onPress={() => router.push('/kyc-verification')}
          >
            <Shield size={14} color={kycStatusInfo.color} />
            <Text style={[styles.kycButtonText, { color: kycStatusInfo.color }]}>
              {kycStatusInfo.text}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCardContainer}>
          <LinearGradient
            colors={[primaryColor, secondaryColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceTitle}>Wallet Balance</Text>
              <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                {showBalance ? (
                  <Eye size={20} color="#ffffff" />
                ) : (
                  <EyeOff size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>
              {showBalance ? `₦${walletBalance.toLocaleString()}` : '₦•••••••'}
            </Text>
            <View style={styles.accountInfo}>
              <Text style={styles.accountNumber}>
                {wallet ? `Account: ${wallet.wallet_number}` : 'No wallet found'}
              </Text>
              <View style={styles.accountActions}>
                <TouchableOpacity 
                  style={styles.accountActionButton}
                  onPress={() => setShowAccountDetails(true)}
                >
                  <Info size={16} color="#ffffff" />
                  <Text style={styles.accountActionText}>Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.quickActionItem}
                onPress={() => router.push(action.route)}
              >
                <LinearGradient
                  colors={[secondaryColor, secondaryColor]}
                  style={styles.quickActionIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <action.icon size={20} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Insights Cards */}
        <View style={styles.insightsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Financial Insights</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(tabs)/analytics')}
            >
              <Text style={[styles.viewAllText, { color: primaryColor }]}>View All</Text>
              <ChevronRight size={16} color={primaryColor} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.insightsScroll}
          >
            {insightCards.map((card, index) => (
              <TouchableOpacity key={index} style={styles.insightCard}>
                <LinearGradient
                  colors={card.gradient}
                  style={styles.insightCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.insightCardContent}>
                    <View style={styles.insightCardHeader}>
                      <card.icon size={24} color="#FFFFFF" />
                      <Text style={styles.insightCardTitle}>{card.title}</Text>
                    </View>
                    <Text style={styles.insightCardValue}>{card.value}</Text>
                    {card.amount && (
                      <View style={styles.insightCardChange}>
                        <Text style={styles.insightCardChangeText}>{card.amount}</Text>
                      </View>
                    )}
                    {card.description && (
                      <Text style={styles.insightCardDescription}>{card.description}</Text>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <Text style={[styles.viewAllText, { color: primaryColor }]}>View All</Text>
              <ChevronRight size={16} color={primaryColor} />
            </TouchableOpacity>
          </View>

          {isLoadingTransactions ? (
            <View style={styles.loadingTransactions}>
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : transactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
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
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.transaction_type === 'credit' ? '#10b981' : '#ef4444' }
                  ]}>
                    {transaction.transaction_type === 'credit' ? '+' : '-'}₦{parseFloat(transaction.user_amount).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyText}>No recent transactions</Text>
              <Text style={styles.emptySubtext}>Your transactions will appear here</Text>
            </View>
          )}
        </View>

        {/* Promotions */}
        {displayMenuItems['display-banner'] !== false && (
          <View style={styles.promotionsContainer}>
            <Text style={styles.sectionTitle}>Promotions</Text>
            <View style={styles.promotionCard}>
              <LinearGradient
                colors={['#4cc9f0', '#4895ef']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.promotionCardGradient}
              >
                <View style={styles.promotionContent}>
                  <View style={styles.promotionStarContainer}>
                    <Star size={20} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                  <Text style={styles.promotionTitle}>Get 5% Cashback</Text>
                  <Text style={styles.promotionDescription}>
                    On all bill payments made this weekend
                  </Text>
                  <TouchableOpacity style={styles.promotionButton}>
                    <Text style={styles.promotionButtonText}>Learn More</Text>
                  </TouchableOpacity>
                </View>
                <Image 
                  source={{ uri: 'https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=300' }}
                  style={styles.promotionImage}
                  resizeMode="cover"
                />
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Account Details Modal */}
      <Modal
        visible={showAccountDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Account Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAccountDetails(false)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {wallet ? (
                <>
                  <View style={styles.accountDetailCard}>
                    <LinearGradient
                      colors={[primaryColor, secondaryColor]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.accountDetailCardGradient}
                    >
                      <View style={styles.accountDetailCardHeader}>
                        <Text style={styles.accountDetailCardTitle}>Wallet Information</Text>
                        <Wallet size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.accountDetailCardNumber}>{wallet.wallet_number}</Text>
                      <View style={styles.accountDetailCardFooter}>
                        <Text style={styles.accountDetailCardName}>{user.full_name}</Text>
                        <TouchableOpacity 
                          style={styles.copyAccountButton}
                          onPress={() => copyToClipboard(wallet.wallet_number, 'Account number')}
                        >
                          <Copy size={16} color="#FFFFFF" />
                          <Text style={styles.copyAccountText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </View>

                  <View style={styles.accountDetailsSection}>
                    <View style={styles.accountDetailRow}>
                      <Text style={styles.accountDetailLabel}>Account Type</Text>
                      <Text style={styles.accountDetailValue}>
                        {wallet.wallet_type?.name || 'Standard Wallet'}
                      </Text>
                    </View>
                    <View style={styles.accountDetailRow}>
                      <Text style={styles.accountDetailLabel}>Currency</Text>
                      <Text style={styles.accountDetailValue}>
                        {wallet.currency?.name || 'Nigerian Naira'} ({wallet.currency?.code || 'NGN'})
                      </Text>
                    </View>
                    <View style={styles.accountDetailRow}>
                      <Text style={styles.accountDetailLabel}>Status</Text>
                      <View style={[
                        styles.accountStatusBadge,
                        { backgroundColor: wallet.status?.color || '#10B981' }
                      ]}>
                        <Text style={styles.accountStatusText}>
                          {wallet.status?.label || 'Active'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.accountDetailRow}>
                      <Text style={styles.accountDetailLabel}>Balance</Text>
                      <Text style={styles.accountDetailValue}>
                        ₦{parseFloat(wallet.balance).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.accountDetailRow}>
                      <Text style={styles.accountDetailLabel}>Created Date</Text>
                      <Text style={styles.accountDetailValue}>
                        {new Date(wallet.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {wallet.bank && (
                      <View style={styles.accountDetailRow}>
                        <Text style={styles.accountDetailLabel}>Bank</Text>
                        <Text style={styles.accountDetailValue}>
                          {wallet.bank.name}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity 
                    style={[styles.shareAccountButton, { backgroundColor: primaryColor }]}
                    onPress={() => {
                      const shareText = `My ${appSettings?.['customized-app-name'] || 'App'} Account Details:\nAccount Number: ${wallet.wallet_number}\nAccount Name: ${user.full_name}`;
                      
                      if (Platform.OS === 'web') {
                        if (navigator.share) {
                          navigator.share({
                            title: 'My Account Details',
                            text: shareText,
                          }).catch(err => {
                            console.error('Share failed:', err);
                            copyToClipboard(shareText, 'Account details');
                          });
                        } else {
                          copyToClipboard(shareText, 'Account details');
                        }
                      } else {
                        // For non-web platforms
                        copyToClipboard(shareText, 'Account details');
                      }
                    }}
                  >
                    <Share2 size={20} color="#FFFFFF" />
                    <Text style={styles.shareAccountText}>Share Account Details</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.noWalletContainer}>
                  <Wallet size={64} color="#94a3b8" />
                  <Text style={styles.noWalletTitle}>No Wallet Found</Text>
                  <Text style={styles.noWalletDescription}>
                    You don't have an active wallet. Please contact support for assistance.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#94a3b8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0f172a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#4361ee',
  },
  avatarInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
  },
  subGreeting: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kycButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  kycButtonText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  balanceCardContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
    }),
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#ffffff',
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountNumber: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#ffffff',
    opacity: 0.9,
  },
  accountActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  accountActionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#ffffff',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  quickActionItem: {
    width: (width - 56) / 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  insightsContainer: {
    paddingTop: 24,
    paddingLeft: 20,
  },
  insightsScroll: {
    paddingRight: 20,
  },
  insightCard: {
    width: 200,
    height: 140,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  insightCardGradient: {
    flex: 1,
    padding: 16,
  },
  insightCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  insightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightCardTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#ffffff',
    opacity: 0.9,
  },
  insightCardValue: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    marginTop: 8,
  },
  insightCardChange: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  insightCardChangeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#ffffff',
  },
  insightCardDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#ffffff',
    opacity: 0.9,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#ffffff',
  },
  transactionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
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
    color: '#ffffff',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  loadingTransactions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  promotionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  promotionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 180,
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
  promotionCardGradient: {
    flex: 1,
    flexDirection: 'row',
  },
  promotionContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  promotionStarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  promotionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  promotionDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 16,
    lineHeight: 20,
  },
  promotionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
  },
  promotionButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#ffffff',
  },
  promotionImage: {
    width: 140,
    height: '100%',
  },
  bottomSpacing: {
    height: 100,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  accountDetailCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
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
  accountDetailCardGradient: {
    padding: 20,
  },
  accountDetailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountDetailCardTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  accountDetailCardNumber: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 2,
  },
  accountDetailCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountDetailCardName: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  copyAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  copyAccountText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  accountDetailsSection: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  accountDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  accountDetailLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  accountDetailValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  accountStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accountStatusText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  shareAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  shareAccountText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  noWalletContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noWalletTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  noWalletDescription: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
});