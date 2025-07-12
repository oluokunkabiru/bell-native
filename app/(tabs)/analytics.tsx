import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
const { width: nativeWidth } = Dimensions.get('window'); // for native
const MAX_W = 1240; // centred column on large desktop

export default function AnalyticsScreen() {
  const { appSettings, walletBalance } = useAuth();
  const [selectedTab, setSelectedTab] =
    useState<'overview' | 'income' | 'expense'>('overview');

  /* ------------ responsive measurements ------------ */
  const { width: vw } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWebPhone = isWeb && vw < 600;

  /* right gutter only for wide web layouts */
  const rightGutter =
    isWeb && vw >= 961 ? (vw >= 1366 ? 240 : 160) : 0;

  /* summary‑card width */
  const summaryCardWidth = isWeb
    ? isWebPhone
      ? '100%' // one per row on narrow web
      : '30%'  // three per row on web tablet / desktop
    : (nativeWidth - 52) / 2; // two per row in native apps

  const primaryColor =
    appSettings?.['customized-app-primary-color'] || '#4361ee';

  /* ------------ dummy analytics data ------------ */
  const overviewData = {
    totalIncome: 175000,
    totalExpense: 98500,
    savingsRate: 43.7,
    categories: [
      { name: 'Airtime & Data', amount: 28500, percentage: 28.9, color: '#4361ee' },
      { name: 'Utilities',      amount: 25000, percentage: 25.4, color: '#3a0ca3' },
      { name: 'Subscriptions',  amount: 27000, percentage: 27.4, color: '#7209b7' },
      { name: 'Others',         amount: 18000, percentage: 18.3, color: '#f72585' },
    ],
    monthlyData: [
      { month: 'Jan', income: 150000, expense: 90000 },
      { month: 'Feb', income: 160000, expense: 85000 },
      { month: 'Mar', income: 140000, expense: 95000 },
      { month: 'Apr', income: 170000, expense: 100000 },
      { month: 'May', income: 165000, expense: 92000 },
      { month: 'Jun', income: 175000, expense: 98500 },
    ],
  };

  /* ------------------------------------------------------------------ */
  /*  Chart renderers (simple placeholders)                             */
  /* ------------------------------------------------------------------ */
  const renderBarChart = () => {
    const max = Math.max(...overviewData.monthlyData.map(m => Math.max(m.income, m.expense)));
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Income vs Expense</Text>
        <View style={styles.barChartContainer}>
          {overviewData.monthlyData.map((m, i) => (
            <View key={i} style={styles.barGroup}>
              <View style={styles.bars}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (m.income / max) * 150,
                        backgroundColor: '#4cc9f0',
                      },
                    ]}
                  />
                </View>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (m.expense / max) * 150,
                        backgroundColor: '#f72585',
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.barLabel}>{m.month}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4cc9f0' }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f72585' }]} />
            <Text style={styles.legendText}>Expense</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPieChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Expense Breakdown</Text>
      <View style={styles.pieChartContainer}>
        {/* placeholder ring */}
        <View style={styles.pieChartPlaceholder} />
        <View style={styles.pieChartLegend}>
          {overviewData.categories.map((c, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: c.color }]} />
              <Text style={styles.legendText}>{`${c.name} (${c.percentage}%)`}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  /* ------------------------------------------------------------------ */
  return (
    <SafeAreaView style={[styles.container, { paddingRight: rightGutter }]}>
      <ScrollView
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { maxWidth: MAX_W }]}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceAmount}>
              ₦{walletBalance.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabNavigation, { maxWidth: MAX_W }]}>
          {(['overview', 'income', 'expense'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && { color: primaryColor },
                ]}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary cards */}
        <View style={[styles.summaryContainer, { maxWidth: MAX_W }]}>
          {/* Income */}
          <View style={[styles.summaryCard, { width: summaryCardWidth }]}>
            <View style={styles.iconIncome}>
              <ArrowDownRight size={20} color="#10b981" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={[styles.summaryAmount, { color: '#10b981' }]}>
                ₦{overviewData.totalIncome.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Expense */}
          <View style={[styles.summaryCard, { width: summaryCardWidth }]}>
            <View style={styles.iconExpense}>
              <ArrowUpRight size={20} color="#ef4444" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Total Expense</Text>
              <Text style={[styles.summaryAmount, { color: '#ef4444' }]}>
                ₦{overviewData.totalExpense.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Savings */}
          <View style={[styles.summaryCard, { width: summaryCardWidth }]}>
            <View style={styles.iconSavings}>
              <TrendingUp size={20} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Savings Rate</Text>
              <Text style={[styles.summaryAmount, { color: '#3b82f6' }]}>
                {overviewData.savingsRate}%
              </Text>
            </View>
          </View>
        </View>

        {/* Charts */}
        {renderBarChart()}
        {renderPieChart()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */
const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  android: { elevation: 2 },
  web: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { minHeight: '100%', alignItems: 'stretch' },

  /* header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
  },
  balanceInfo: { alignItems: 'flex-end' },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  balanceAmount: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
  },

  /* tabs */
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    alignSelf: 'center',
  },
  tab: { paddingVertical: 16, marginRight: 24 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#4361ee' },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#94a3b8',
  },

  /* summary */
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
    alignSelf: 'center',
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...(cardShadow as object),
  },
  iconIncome: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconExpense: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSavings: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },

  /* chart containers */
  chartContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignSelf: 'center',
    maxWidth: MAX_W,
    ...(cardShadow as object),
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginBottom: 20,
  },

  /* bar chart */
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 180,
  },
  barGroup: { alignItems: 'center', flex: 1 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barWrapper: { width: 12, height: 150, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6 },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },

  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendColor: { width: 12, height: 12, borderRadius: 6 },
  legendText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },

  /* pie placeholder */
  pieChartContainer: { alignItems: 'center' },
  pieChartPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#334155',
    marginBottom: 20,
  },
  pieChartLegend: { width: '100%' },
});
