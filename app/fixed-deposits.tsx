import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, TrendingUp, Calculator, DollarSign, Calendar, Percent, X, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiService } from '@/services/api';

interface FixedDepositProduct {
  id: string;
  name: string;
  code: string;
  description: string | null;
  min_amount: string;
  max_amount: string | null;
  tenure_type: string;
  tenure_min_period: number;
  tenure_max_period: number | null;
  interest_rate: string;
  is_reoccuring_interest: boolean;
  is_interest_compounded: boolean;
  interest_payout: string;
  allow_premature_withdrawal: boolean;
  auto_rollover_on_maturity: boolean;
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

interface CalculationResult {
  product_terms: {
    tenure_periods: number;
    tenure_unit: string;
    interest_rate: string;
    payout_frequency: string;
    compounding: boolean;
    reoccurring_interest: boolean;
  };
  amount_summary: {
    currency_code: string;
    currency_symbol: string;
    principal: number;
    total_interest: number;
    final_amount_on_maturity: number;
    early_withdrawal_penalty: {
      type: string;
      value: string;
      calculated_amount: number;
      description: string;
    };
  };
}

export default function FixedDepositsScreen() {
  const { user, appSettings, walletBalance, updateWalletBalance } = useAuth();
  const [products, setProducts] = useState<FixedDepositProduct[]>([]);
  const [contracts, setContracts] = useState<FixedDepositContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FixedDepositProduct | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isInvesting, setIsInvesting] = useState(false);

  // Calculator form
  const [amount, setAmount] = useState('');
  const [tenure, setTenure] = useState('');

  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadProducts(),
        loadContracts(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiService.getFixedDepositProducts();
      if (response.status && response.data?.data) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await apiService.getFixedDepositContracts();
      if (response.status && response.data?.data) {
        setContracts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
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

  const handleCalculate = async () => {
    if (!selectedProduct || !amount || !tenure) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const depositAmount = parseFloat(amount);
    const minAmount = parseFloat(selectedProduct.min_amount);
    const maxAmount = selectedProduct.max_amount ? parseFloat(selectedProduct.max_amount) : null;

    if (depositAmount < minAmount) {
      Alert.alert('Error', `Minimum deposit amount is ${selectedProduct.min_amount}`);
      return;
    }

    if (maxAmount && depositAmount > maxAmount) {
      Alert.alert('Error', `Maximum deposit amount is ${selectedProduct.max_amount}`);
      return;
    }

    setIsCalculating(true);
    try {
      const response = await apiService.calculateFixedDepositInterest({
        deposit_amount: depositAmount,
        product_id: selectedProduct.id,
        desired_maturity_tenure: tenure,
      });

      if (response.status && response.data) {
        setCalculationResult(response.data);
      } else {
        Alert.alert('Error', 'Failed to calculate interest');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to calculate interest');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleInvest = async () => {
    if (!selectedProduct || !calculationResult) {
      Alert.alert('Error', 'Please calculate interest first');
      return;
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount > walletBalance) {
      Alert.alert('Insufficient Funds', `You cannot invest more than your available balance of ₦${walletBalance.toLocaleString()}`);
      return;
    }

    setIsInvesting(true);
    try {
      const response = await apiService.createFixedDepositContract({
        product_id: selectedProduct.id,
        deposit_amount: depositAmount,
        desired_maturity_tenure: tenure,
        preferred_interest_payout_duration: selectedProduct.interest_payout,
        auto_rollover_on_maturity: selectedProduct.auto_rollover_on_maturity,
      });

      if (response.status) {
        Alert.alert('Success', 'Fixed deposit investment created successfully!');
        
        // Update wallet balance in storage
        const newBalance = walletBalance - depositAmount;
        await updateWalletBalance(newBalance);
        
        setShowInvestModal(false);
        setShowCalculator(false);
        setAmount('');
        setTenure('');
        setCalculationResult(null);
        setSelectedProduct(null);
        await loadContracts();
      } else {
        Alert.alert('Error', response.message || 'Failed to create investment');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create investment');
    } finally {
      setIsInvesting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number, currencySymbol?: string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const symbol = currencySymbol || '₦';
    return `${symbol}${num.toLocaleString()}`;
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading..." color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fixed Deposits</Text>
        <View style={styles.headerRight}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceAmount}>₦{walletBalance.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
          />
        }
      >
        {isLoading ? (
          <LoadingSpinner message="Loading fixed deposits..." color="#FFFFFF" />
        ) : (
          <>
            {/* Active Investments */}
            {contracts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Investments</Text>
                {contracts.map((contract) => (
                  <View key={contract.id} style={styles.contractCard}>
                    <View style={styles.contractHeader}>
                      <Text style={styles.contractName}>{contract.ref_name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: contract.status.color }]}>
                        <Text style={styles.statusText}>{contract.status.label}</Text>
                      </View>
                    </View>
                    <View style={styles.contractDetails}>
                      <View style={styles.contractRow}>
                        <Text style={styles.contractLabel}>Principal:</Text>
                        <Text style={styles.contractValue}>{formatCurrency(contract.deposit_amount)}</Text>
                      </View>
                      <View style={styles.contractRow}>
                        <Text style={styles.contractLabel}>Expected Interest:</Text>
                        <Text style={styles.contractValue}>{formatCurrency(contract.expected_interest_amount)}</Text>
                      </View>
                      <View style={styles.contractRow}>
                        <Text style={styles.contractLabel}>Interest Rate:</Text>
                        <Text style={styles.contractValue}>{contract.ref_interest_rate}%</Text>
                      </View>
                      <View style={styles.contractRow}>
                        <Text style={styles.contractLabel}>Maturity Date:</Text>
                        <Text style={styles.contractValue}>{formatDate(contract.maturity_date)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Available Products */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Products</Text>
              {products.length > 0 ? (
                products.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    onPress={() => {
                      setSelectedProduct(product);
                      setShowCalculator(true);
                    }}
                  >
                    <View style={styles.productHeader}>
                      <View style={styles.productIcon}>
                        <TrendingUp size={24} color={primaryColor} />
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productCode}>{product.code}</Text>
                      </View>
                      <Text style={styles.interestRate}>{product.interest_rate}%</Text>
                    </View>
                    <View style={styles.productDetails}>
                      <View style={styles.productRow}>
                        <Text style={styles.productLabel}>Min Amount:</Text>
                        <Text style={styles.productValue}>{formatCurrency(product.min_amount)}</Text>
                      </View>
                      {product.max_amount && (
                        <View style={styles.productRow}>
                          <Text style={styles.productLabel}>Max Amount:</Text>
                          <Text style={styles.productValue}>{formatCurrency(product.max_amount)}</Text>
                        </View>
                      )}
                      <View style={styles.productRow}>
                        <Text style={styles.productLabel}>Tenure:</Text>
                        <Text style={styles.productValue}>
                          {product.tenure_min_period} {product.tenure_type}
                          {product.tenure_max_period && ` - ${product.tenure_max_period} ${product.tenure_type}`}
                        </Text>
                      </View>
                      <View style={styles.productRow}>
                        <Text style={styles.productLabel}>Payout:</Text>
                        <Text style={styles.productValue}>{product.interest_payout.replace('_', ' ')}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <TrendingUp size={64} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>No Products Available</Text>
                  <Text style={styles.emptyDescription}>
                    Fixed deposit products will appear here when available
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Calculator Modal */}
      <Modal
        visible={showCalculator}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalculator(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Investment Calculator</Text>
            <TouchableOpacity onPress={() => setShowCalculator(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedProduct && (
              <>
                <View style={styles.selectedProductCard}>
                  <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
                  <Text style={styles.selectedProductRate}>{selectedProduct.interest_rate}% per annum</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Investment Amount</Text>
                  <View style={styles.amountContainer}>
                    <Text style={styles.currencySymbol}>₦</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0.00"
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <Text style={styles.inputHint}>
                    Min: {formatCurrency(selectedProduct.min_amount)}
                    {selectedProduct.max_amount && ` | Max: ${formatCurrency(selectedProduct.max_amount)}`}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tenure ({selectedProduct.tenure_type})</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`Enter tenure in ${selectedProduct.tenure_type}`}
                    value={tenure}
                    onChangeText={setTenure}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.inputHint}>
                    Min: {selectedProduct.tenure_min_period} {selectedProduct.tenure_type}
                    {selectedProduct.tenure_max_period && ` | Max: ${selectedProduct.tenure_max_period} ${selectedProduct.tenure_type}`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.calculateButton,
                    { backgroundColor: primaryColor },
                    (!amount || !tenure || isCalculating) && styles.disabledButton
                  ]}
                  onPress={handleCalculate}
                  disabled={!amount || !tenure || isCalculating}
                >
                  <Calculator size={20} color="#FFFFFF" />
                  <Text style={styles.calculateButtonText}>
                    {isCalculating ? 'Calculating...' : 'Calculate Returns'}
                  </Text>
                </TouchableOpacity>

                {calculationResult && (
                  <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>Investment Summary</Text>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Principal Amount:</Text>
                      <Text style={styles.resultValue}>
                        {formatCurrency(calculationResult.amount_summary.principal, calculationResult.amount_summary.currency_symbol)}
                      </Text>
                    </View>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Total Interest:</Text>
                      <Text style={styles.resultValue}>
                        {formatCurrency(calculationResult.amount_summary.total_interest, calculationResult.amount_summary.currency_symbol)}
                      </Text>
                    </View>
                    <View style={[styles.resultRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Maturity Amount:</Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(calculationResult.amount_summary.final_amount_on_maturity, calculationResult.amount_summary.currency_symbol)}
                      </Text>
                    </View>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Interest Rate:</Text>
                      <Text style={styles.resultValue}>{calculationResult.product_terms.interest_rate}%</Text>
                    </View>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Tenure:</Text>
                      <Text style={styles.resultValue}>
                        {calculationResult.product_terms.tenure_periods} {calculationResult.product_terms.tenure_unit}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.investButton, { backgroundColor: primaryColor }]}
                      onPress={() => setShowInvestModal(true)}
                    >
                      <DollarSign size={20} color="#FFFFFF" />
                      <Text style={styles.investButtonText}>Invest Now</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Investment Confirmation Modal */}
      <Modal
        visible={showInvestModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowInvestModal(false)}
      >
        <View style={styles.overlayContainer}>
          <View style={styles.confirmationCard}>
            <Text style={styles.confirmationTitle}>Confirm Investment</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to invest {formatCurrency(amount)} in {selectedProduct?.name}?
            </Text>
            <Text style={styles.confirmationNote}>
              This amount will be deducted from your wallet balance.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowInvestModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={handleInvest}
                disabled={isInvesting}
              >
                <Text style={styles.confirmButtonText}>
                  {isInvesting ? 'Processing...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  contractCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contractName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  contractDetails: {
    gap: 8,
  },
  contractRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  contractValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  productCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  productCode: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  interestRate: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
  },
  productDetails: {
    gap: 8,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  productValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  selectedProductCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  selectedProductName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  selectedProductRate: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  currencySymbol: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  inputHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  calculateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  resultCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  resultValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
  },
  investButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
  },
  investButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmationCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmationMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  confirmationNote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});