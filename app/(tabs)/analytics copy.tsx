import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart3, ChartPie as PieChart, TrendingUp, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { appSettings, walletBalance } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [selectedTab, setSelectedTab] = useState('overview');

  const primaryColor = appSettings?.['customized-app-primary-color'] || '#4361ee';

  // Dummy data for analytics
  const overviewData = {
    totalIncome: 175000,
    totalExpense: 98500,
    savingsRate: 43.7,
    categories: [
      { name: 'Airtime & Data', amount: 28500, percentage: 28.9, color: '#4361ee' },
      { name: 'Utilities', amount: 25000, percentage: 25.4, color: '#3a0ca3' },
      { name: 'Subscriptions', amount: 27000, percentage: 27.4, color: '#7209b7' },
      { name: 'Others', amount: 18000, percentage: 18.3, color: '#f72585' },
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

  const renderBarChart = () => {
    const maxValue = Math.max(
      ...overviewData.monthlyData.map(item => Math.max(item.income, item.expense))
    );
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Income vs Expense</Text>
        <View style={styles.barChartContainer}>
          {overviewData.monthlyData.map((item, index) => (
            <View key={index} style={styles.barGroup}>
              <View style={styles.barLabels}>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
              <View style={styles.bars}>
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: (item.income / maxValue) * 150,
                        backgroundColor: '#4cc9f0',
                      }
                    ]} 
                  />
                </View>
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: (item.expense / maxValue) * 150,
                        backgroundColor: '#f72585',
                      }
                    ]} 
                  />
                </View>
              </View>
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

  const renderPieChart = () => {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Expense Breakdown</Text>
        <View style={styles.pieChartContainer}>
          <View style={styles.pieChart}>
            <View style={styles.pieChartCenter} />
            {overviewData.categories.map((category, index) => (
              <View 
                key={index} 
                style={[
                  styles.pieChartSegment, 
                  { 
                    backgroundColor: category.color,
                    transform: [
                      { rotate: `${index * 90}deg` },
                      { translateX: index % 2 === 0 ? 5 : 0 }
                    ],
                    width: `${category.percentage}%`,
                    height: `${category.percentage}%`,
                  }
                ]} 
              />
            ))}
          </View>
          <View style={styles.pieChartLegend}>
            {overviewData.categories.map((category, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: category.color }]} />
                <Text style={styles.legendText}>{category.name} ({category.percentage}%)</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.headerRight}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceAmount}>₦{walletBalance.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabNavigation}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && { color: primaryColor }]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'income' && styles.activeTab]}
          onPress={() => setSelectedTab('income')}
        >
          <Text style={[styles.tabText, selectedTab === 'income' && { color: primaryColor }]}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'expense' && styles.activeTab]}
          onPress={() => setSelectedTab('expense')}
        >
          <Text style={[styles.tabText, selectedTab === 'expense' && { color: primaryColor }]}>Expense</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <ArrowDownRight size={20} color="#10b981" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={[styles.summaryAmount, { color: '#10b981' }]}>
                ₦{overviewData.totalIncome.toLocaleString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#fee2e2' }]}>
              <ArrowUpRight size={20} color="#ef4444" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Total Expense</Text>
              <Text style={[styles.summaryAmount, { color: '#ef4444' }]}>
                ₦{overviewData.totalExpense.toLocaleString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#dbeafe' }]}>
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

        {renderBarChart()}
        {renderPieChart()}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
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
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  balanceAmount: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tab: {
    paddingVertical: 16,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4361ee',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#94a3b8',
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  summaryCard: {
    width: (width - 52) / 2,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
    }),
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
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
  chartContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
    }),
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barLabels: {
    marginTop: 8,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barWrapper: {
    width: 12,
    height: 150,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChart: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  pieChartCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    zIndex: 10,
  },
  pieChartSegment: {
    position: 'absolute',
    borderRadius: 100,
    top: 0,
    left: 0,
  },
  pieChartLegend: {
    width: '100%',
  },
  bottomSpacing: {
    height: 100,
  },
});