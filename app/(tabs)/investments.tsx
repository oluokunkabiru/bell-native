import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, ArrowRight, Calendar, Percent, DollarSign, Clock, CircleAlert as AlertCircle, Target, PiggyBank, ChartBar as BarChart3 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiService } from '@/services/api';

const { width } = Dimensions.get('window');

interface InvestmentContract {
  id: string;
  investment_reference: string;
  invested_amount: string;
  start_date: string;
  end_date: string;
  maturity_date: string;
  ref_name: string;
  ref_interest_rate: string;
  product_metadata: string;
  status: {
    label: string;
    color: string;
  };
}

interface FixedDepositContract {
  id: string;
  fixed_deposit_reference: string;
  deposit_amount: string;
  deposit_date: string;
  maturity_date: string;
  expected_interest_amount: string;
  ref_name: string;
  ref_interest_rate: string;
  status: {
    label: string;
    color: string;
  };
}

type TabType = 'my-investments' | 'active-investments';

export default function InvestmentsScreen() {
  const { user, appSettings, walletBalance } = useAuth();
  const [investments, setInvestments] = useState<InvestmentContract[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDepositContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('my-investments');

  const primaryColor = appSettings?.['customized-app-primary-color'] || '#2563EB';

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadInvestments(),
        loadFixedDeposits(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvestments = async () => {
    try {
      // This is a placeholder - replace with actual API call when available
      const response = await apiService.makeRequest('/investment-mgt/investment-contracts?page=1&items_per_page=20');
      if (response.status && response.data?.data) {
        setInvestments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load investments:', error);
    }
  };

  const loadFixedDeposits = async () => {
    try {
      const response = await apiService.getFixedDepositContracts();
      if (response.status && response.data?.data) {
        setFixedDeposits(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load fixed deposits:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₦${num.toLocaleString()}`;
  };

  const parseMetadata = (metadata: string) => {
    try {
      return JSON.parse(metadata);
    } catch (error) {
      return null;
    }
  };

  const getDaysUntilMaturity = (maturityDate: string) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { color: '#10B981', icon: '🟢', description: 'Currently earning returns' };
      case 'matured':
        return { color: '#3B82F6', icon: '✅', description: 'Investment has matured' };
      case 'pending':
        return { color: '#F59E0B', icon: '⏳', description: 'Awaiting processing' };
      case 'cancelled':
        return { color: '#EF4444', icon: '❌', description: 'Investment cancelled' };
      default:
        return { color: '#6B7280', icon: '⚪', description: 'Status unknown' };
    }
  };

  const allInvestments = [...investments, ...fixedDeposits];
  const activeInvestments = allInvestments.filter(item => 
    item.status?.label?.toLowerCase() === 'active'
  );

  const totalInvested = allInvestments.reduce((sum, item) => {
    const amount = item.hasOwnProperty('invested_amount') 
      ? (item as InvestmentContract).invested_amount 
      : (item as FixedDepositContract).deposit_amount;
    return sum + parseFloat(amount);
  }, 0);

  const totalExpectedReturns = fixedDeposits.reduce((sum, deposit) => {
    return sum + parseFloat(deposit.expected_interest_amount);
  }, 0);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading investments..." color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  const renderTabButton = (tab: TabType, title: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && { backgroundColor: primaryColor }
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabButtonText,
        activeTab === tab && styles.activeTabText
      ]}>
        {title}
      </Text>
      <View style={[
        styles.tabBadge,
        activeTab === tab ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: primaryColor }
      ]}>
        <Text style={styles.tabBadgeText}>{count}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderInvestmentCard = (item: InvestmentContract | FixedDepositContract, index: number) => {
    const isFixedDeposit = item.hasOwnProperty('deposit_amount');
    const amount = isFixedDeposit 
      ? (item as FixedDepositContract).deposit_amount 
      : (item as InvestmentContract).invested_amount;
    const maturityDate = isFixedDeposit 
      ? (item as FixedDepositContract).maturity_date 
      : (item as InvestmentContract).maturity_date;
    const expectedReturns = isFixedDeposit 
      ? (item as FixedDepositContract).expected_interest_amount 
      : '0';
    
    const statusInfo = getStatusInfo(item.status?.label || '');
    const daysUntilMaturity = getDaysUntilMaturity(maturityDate);
    const isMatured = daysUntilMaturity <= 0;

    return (
      <TouchableOpacity 
        key={item.id} 
        style={styles.investmentCard}
        onPress={() => router.push('/fixed-deposits')}
      >
        <View style={styles.investmentHeader}>
          <View style={styles.investmentTitleRow}>
            <View style={styles.investmentIcon}>
              {isFixedDeposit ? (
                <PiggyBank size={20} color={primaryColor} />
              ) : (
                <BarChart3 size={20} color={primaryColor} />
              )}
            </View>
            <View style={styles.investmentTitleInfo}>
              <Text style={styles.investmentName}>{item.ref_name}</Text>
              <Text style={styles.investmentType}>
                {isFixedDeposit ? 'Fixed Deposit' : 'Investment'}
              </Text>
            </View>
          </View>
          <ArrowRight size={20} color="#9CA3AF" />
        </View>

        <View style={styles.investmentAmountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Principal Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
          </View>
          {isFixedDeposit && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Expected Returns</Text>
              <Text style={[styles.amountValue, { color: '#10B981' }]}>
                {formatCurrency(expectedReturns)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.investmentDetails}>
          <View style={styles.detailItem}>
            <Percent size={16} color="#CCCCCC" />
            <Text style={styles.detailText}>
              {item.ref_interest_rate}% p.a.
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Calendar size={16} color="#CCCCCC" />
            <Text style={styles.detailText}>
              {isMatured ? 'Matured' : `${daysUntilMaturity} days left`}
            </Text>
          </View>
        </View>

        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
                {item.status?.label || 'Unknown'}
              </Text>
              <Text style={styles.statusDescription}>
                {statusInfo.description}
              </Text>
            </View>
          </View>
          <Text style={styles.maturityDate}>
            Matures: {formatDate(maturityDate)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMyInvestments = () => (
    <ScrollView 
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#FFFFFF"
        />
      }
    >
      {/* Investment Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <DollarSign size={20} color={primaryColor} />
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(totalInvested)}</Text>
            <Text style={styles.summaryLabel}>Total Invested</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <TrendingUp size={20} color="#10B981" />
            </View>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              {formatCurrency(totalExpectedReturns)}
            </Text>
            <Text style={styles.summaryLabel}>Expected Returns</Text>
          </View>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Target size={20} color="#F59E0B" />
          </View>
          <Text style={styles.summaryValue}>{allInvestments.length}</Text>
          <Text style={styles.summaryLabel}>Total Investments</Text>
        </View>
      </View>

      {/* All Investments */}
      {allInvestments.length > 0 ? (
        <View style={styles.investmentsList}>
          {allInvestments.map((item, index) => renderInvestmentCard(item, index))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <AlertCircle size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Investments Yet</Text>
          <Text style={styles.emptyDescription}>
            Start your investment journey today and watch your money grow.
          </Text>
          <TouchableOpacity 
            style={[styles.startButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push('/fixed-deposits')}
          >
            <Text style={styles.startButtonText}>Start Investing</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderActiveInvestments = () => (
    <ScrollView 
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#FFFFFF"
        />
      }
    >
      {/* Active Summary */}
      <View style={styles.activeSummarySection}>
        <View style={styles.activeSummaryCard}>
          <View style={styles.activeSummaryHeader}>
            <Clock size={24} color="#10B981" />
            <Text style={styles.activeSummaryTitle}>Active Investments</Text>
          </View>
          <Text style={styles.activeSummaryCount}>{activeInvestments.length}</Text>
          <Text style={styles.activeSummarySubtitle}>Currently earning returns</Text>
        </View>
      </View>

      {/* Active Investments List */}
      {activeInvestments.length > 0 ? (
        <View style={styles.investmentsList}>
          {activeInvestments.map((item, index) => renderInvestmentCard(item, index))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Clock size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Active Investments</Text>
          <Text style={styles.emptyDescription}>
            You don't have any active investments at the moment. Start investing to see them here.
          </Text>
          <TouchableOpacity 
            style={[styles.startButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push('/fixed-deposits')}
          >
            <Text style={styles.startButtonText}>Start Investing</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Investments</Text>
        <View style={styles.headerRight}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceAmount}>₦{walletBalance.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {renderTabButton('my-investments', 'My Investments', allInvestments.length)}
        {renderTabButton('active-investments', 'Active', activeInvestments.length)}
      </View>

      {/* Tab Content */}
      {isLoading ? (
        <LoadingSpinner message="Loading investments..." color="#FFFFFF" />
      ) : (
        <>
          {activeTab === 'my-investments' && renderMyInvestments()}
          {activeTab === 'active-investments' && renderActiveInvestments()}
        </>
      )}

      {/* Investment Options */}
      <View style={styles.optionsSection}>
        <Text style={styles.optionsTitle}>Investment Options</Text>
        <View style={styles.optionsGrid}>
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => router.push('/fixed-deposits')}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#10B981' }]}>
              <PiggyBank size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.optionTitle}>Fixed Deposits</Text>
            <Text style={styles.optionDescription}>Guaranteed returns</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.optionCard, styles.comingSoonCard]}>
            <View style={[styles.optionIcon, { backgroundColor: '#8B5CF6' }]}>
              <TrendingUp size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.optionTitle}>Mutual Funds</Text>
            <Text style={styles.optionDescription}>Diversified portfolio</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  balanceInfo: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  balanceAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    gap: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#CCCCCC',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
  },
  activeSummarySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  activeSummaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  activeSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  activeSummaryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  activeSummaryCount: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 4,
  },
  activeSummarySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  investmentsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  investmentCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  investmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  investmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  investmentTitleInfo: {
    flex: 1,
  },
  investmentName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  investmentType: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  investmentAmountSection: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  amountValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  investmentDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  statusSection: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  maturityDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  startButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  optionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  optionsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  comingSoonCard: {
    opacity: 0.7,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});