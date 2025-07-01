import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Smartphone, Check, X, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiService } from '@/services/api';

const { width } = Dimensions.get('window');

interface NetworkProvider {
  id: string;
  name: string;
  code: string;
  color: string;
  logo: string;
}

interface AirtimeResult {
  success: boolean;
  message: string;
  data?: {
    balance: number;
    requestId: string;
  };
}

export default function AirtimePurchase() {
  const { user, appSettings, walletBalance, updateWalletBalance } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<AirtimeResult | null>(null);

  // Get colors from API settings
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';

  const networkProviders: NetworkProvider[] = [
    { id: 'mtn', name: 'MTN', code: 'mtn', color: '#FFCC00', logo: '📱' },
    { id: 'airtel', name: 'Airtel', code: 'airtel', color: '#FF0000', logo: '📶' },
    { id: 'glo', name: 'Glo', code: 'glo', color: '#00B04F', logo: '🌐' },
    { id: '9mobile', name: '9Mobile', code: '9mobile', color: '#00A651', logo: '📡' },
  ];

  const quickAmounts = ['50', '100', '200', '500', '1000', '2000'];

  const handleNetworkSelect = (networkCode: string) => {
    setSelectedNetwork(networkCode);
  };

  const handleQuickAmount = (quickAmount: string) => {
    setAmount(quickAmount);
  };

  const handlePurchase = async () => {
    if (!selectedNetwork || !phoneNumber || !amount || !transactionPin) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (phoneNumber.length !== 11) {
      Alert.alert('Error', 'Please enter a valid 11-digit phone number');
      return;
    }

    const purchaseAmount = parseFloat(amount);
    if (purchaseAmount < 50) {
      Alert.alert('Error', 'Minimum airtime amount is ₦50');
      return;
    }

    if (purchaseAmount > walletBalance) {
      Alert.alert('Insufficient Funds', `You cannot purchase airtime worth more than your available balance of ₦${walletBalance.toLocaleString()}`);
      return;
    }

    if (transactionPin.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit PIN');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.buyAirtime({
        network_provider: selectedNetwork,
        final_amount: amount,
        phone_number: phoneNumber,
        transaction_pin: transactionPin,
      });

      if (response.status) {
        // Update wallet balance in storage
        if (response.data?.balance) {
          await updateWalletBalance(response.data.balance);
        }
        
        setResult({
          success: true,
          message: response.message,
          data: response.data,
        });
      } else {
        setResult({
          success: false,
          message: response.message || 'Airtime purchase failed',
        });
      }
      setShowResult(true);
    } catch (error: any) {
      console.error('Airtime purchase error:', error);
      setResult({
        success: false,
        message: error.message || 'Failed to purchase airtime. Please try again.',
      });
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackPress = () => {
    if (showResult) {
      // Reset form and go back to purchase screen
      setShowResult(false);
      setResult(null);
      setSelectedNetwork('');
      setPhoneNumber('');
      setAmount('');
      setTransactionPin('');
    } else {
      router.back();
    }
  };

  const handleDone = () => {
    router.back();
  };

  const selectedNetworkData = networkProviders.find(n => n.code === selectedNetwork);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner 
          message="Loading..." 
          color="#FFFFFF" 
        />
      </SafeAreaView>
    );
  }

  if (showResult && result) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Purchase Result</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.resultContainer}>
            {result.success ? (
              <>
                <View style={[styles.resultIcon, { backgroundColor: '#10B981' }]}>
                  <Check size={48} color="#FFFFFF" />
                </View>
                <Text style={styles.resultTitle}>Purchase Successful!</Text>
                <Text style={styles.resultMessage}>{result.message}</Text>
                
                {result.data && (
                  <View style={styles.receiptCard}>
                    <Text style={styles.receiptTitle}>Transaction Receipt</Text>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Network:</Text>
                      <Text style={styles.receiptValue}>{selectedNetworkData?.name}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Phone Number:</Text>
                      <Text style={styles.receiptValue}>{phoneNumber}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Amount:</Text>
                      <Text style={styles.receiptValue}>₦{parseFloat(amount).toLocaleString()}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Request ID:</Text>
                      <Text style={styles.receiptValue}>{result.data.requestId}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>New Balance:</Text>
                      <Text style={styles.receiptValue}>₦{result.data.balance.toLocaleString()}</Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={[styles.resultIcon, { backgroundColor: '#EF4444' }]}>
                  <X size={48} color="#FFFFFF" />
                </View>
                <Text style={styles.resultTitle}>Purchase Failed</Text>
                <Text style={styles.resultMessage}>{result.message}</Text>
              </>
            )}

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: primaryColor }]}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Airtime</Text>
        <View style={styles.headerRight}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceAmount}>₦{walletBalance.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Network Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Network</Text>
            <View style={styles.networkGrid}>
              {networkProviders.map((network) => (
                <TouchableOpacity
                  key={network.id}
                  style={[
                    styles.networkCard,
                    selectedNetwork === network.code && [
                      styles.selectedNetworkCard,
                      { borderColor: network.color }
                    ]
                  ]}
                  onPress={() => handleNetworkSelect(network.code)}
                >
                  <View style={[styles.networkIcon, { backgroundColor: network.color + '20' }]}>
                    <Text style={styles.networkEmoji}>{network.logo}</Text>
                  </View>
                  <Text style={[
                    styles.networkName,
                    selectedNetwork === network.code && { color: network.color }
                  ]}>
                    {network.name}
                  </Text>
                  {selectedNetwork === network.code && (
                    <View style={[styles.checkIcon, { backgroundColor: network.color }]}>
                      <Check size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Phone Number Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Smartphone size={20} color="#9CA3AF" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter phone number (e.g., 08012345678)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={11}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Amount Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            {amount && parseFloat(amount) > walletBalance && (
              <Text style={styles.errorText}>Amount exceeds available balance</Text>
            )}
            
            {/* Quick Amount Buttons */}
            <View style={styles.quickAmounts}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    amount === quickAmount && [
                      styles.selectedQuickAmount,
                      { backgroundColor: primaryColor }
                    ]
                  ]}
                  onPress={() => handleQuickAmount(quickAmount)}
                >
                  <Text style={[
                    styles.quickAmountText,
                    amount === quickAmount && styles.selectedQuickAmountText
                  ]}>
                    ₦{quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Transaction PIN */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction PIN</Text>
            <View style={styles.pinInputContainer}>
              <TextInput
                style={styles.pinInput}
                placeholder="Enter 4-digit PIN"
                value={transactionPin}
                onChangeText={setTransactionPin}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={!showPin}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.pinToggle}
                onPress={() => setShowPin(!showPin)}
              >
                {showPin ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Summary */}
          {selectedNetworkData && phoneNumber && amount && (
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Purchase Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Network:</Text>
                  <Text style={styles.summaryValue}>{selectedNetworkData.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Phone Number:</Text>
                  <Text style={styles.summaryValue}>{phoneNumber}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount:</Text>
                  <Text style={styles.summaryValue}>₦{parseFloat(amount).toLocaleString()}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Purchase Button */}
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              { backgroundColor: primaryColor },
              (!selectedNetwork || !phoneNumber || !amount || !transactionPin || isProcessing || parseFloat(amount || '0') > walletBalance) && styles.disabledButton
            ]}
            onPress={handlePurchase}
            disabled={!selectedNetwork || !phoneNumber || !amount || !transactionPin || isProcessing || parseFloat(amount || '0') > walletBalance}
          >
            <Text style={styles.purchaseButtonText}>
              {isProcessing ? 'Processing...' : 'Buy Airtime'}
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
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
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  networkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  networkCard: {
    width: '48%',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedNetworkCard: {
    borderWidth: 2,
  },
  networkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  networkEmoji: {
    fontSize: 24,
  },
  networkName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  currencySymbol: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    marginTop: 8,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedQuickAmount: {
    borderColor: 'transparent',
  },
  quickAmountText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  selectedQuickAmountText: {
    color: '#FFFFFF',
  },
  pinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pinInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 8,
  },
  pinToggle: {
    padding: 4,
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  purchaseButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 32,
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
  },
  receiptCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
  },
  receiptTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  receiptValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  doneButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});