import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Eye, EyeOff, CircleAlert as AlertCircle, ArrowRightLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DropdownSelect } from '@/components/DropdownSelect';
import { apiService } from '@/services/api';

const { width } = Dimensions.get('window');

interface SwapStep {
  step: 'currencies' | 'amount' | 'destination' | 'confirm' | 'pin' | 'result';
}

interface SwapData {
  baseCurrency: string;
  quoteCurrency: string;
  exchangeAmount: string;
  destinationType: string;
  destinationBankUuid: string;
  destinationAccountNumber: string;
  description: string;
  transactionPin: string;
}

interface ExchangeRateData {
  exchange_rate: number;
  quote_amount: number;
}

interface SwapResult {
  destination_amount_expected: number;
  exchange_rate: number;
  destination_bank: string;
  destination_account_number: string;
  payment_url?: string;
  reference_number?: string;
  description?: string;
  user_balance_after?: number;
}

const CURRENCY_OPTIONS = [
  { id: 'USD', name: 'US Dollar (USD)', code: 'USD' },
  { id: 'NGN', name: 'Nigerian Naira (NGN)', code: 'NGN' },
  { id: 'EUR', name: 'Euro (EUR)', code: 'EUR' },
  { id: 'GBP', name: 'British Pound (GBP)', code: 'GBP' },
];

const DESTINATION_TYPES = [
  { id: 'nip', name: 'Bank Transfer (NIP)', code: 'nip' },
  { id: 'mobilemoney', name: 'Mobile Money', code: 'mobilemoney' },
  { id: 'crypto', name: 'Crypto Wallet', code: 'crypto' },
];

export default function SwapCurrencyScreen() {
  const { user, appSettings, updateWalletBalance } = useAuth();
  const [currentStep, setCurrentStep] = useState<SwapStep['step']>('currencies');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [exchangeRateData, setExchangeRateData] = useState<ExchangeRateData | null>(null);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const [showPin, setShowPin] = useState(false);
  
  const [swapData, setSwapData] = useState<SwapData>({
    baseCurrency: 'USD',
    quoteCurrency: 'NGN',
    exchangeAmount: '',
    destinationType: 'nip',
    destinationBankUuid: '',
    destinationAccountNumber: '',
    description: '',
    transactionPin: '',
  });

  // Get colors from API settings
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';

  // Fetch banks when destination type is NIP
  useEffect(() => {
    if (swapData.destinationType === 'nip' && currentStep === 'destination') {
      fetchBanks();
    }
  }, [swapData.destinationType, currentStep]);

  const fetchBanks = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getBanks();
      if (response.status && response.data?.data) {
        setBanks(response.data.data);
      } else {
        setBanks([]);
      }
    } catch (error) {
      setBanks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencySelection = () => {
    if (!swapData.baseCurrency || !swapData.quoteCurrency) {
      Alert.alert('Error', 'Please select both currencies');
      return;
    }
    if (swapData.baseCurrency === swapData.quoteCurrency) {
      Alert.alert('Error', 'Base and quote currencies must be different');
      return;
    }
    setCurrentStep('amount');
  };

  const handleSwapCurrencies = () => {
    setSwapData(prev => ({
      ...prev,
      baseCurrency: prev.quoteCurrency,
      quoteCurrency: prev.baseCurrency,
    }));
    setExchangeRateData(null);
  };

  const handleAmountSubmit = async () => {
    const amount = parseFloat(swapData.exchangeAmount);
    if (!swapData.exchangeAmount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiService.getExchangeRate({
        base_currency: swapData.baseCurrency,
        quote_currency: swapData.quoteCurrency,
        exchange_amount: amount,
      });
      
      if (response.status && response.data?.data) {
        setExchangeRateData(response.data.data);
        setCurrentStep('destination');
      } else {
        Alert.alert('Error', response.message || 'Failed to get exchange rate');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get exchange rate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestinationSubmit = () => {
    if (swapData.destinationType === 'nip') {
      if (!swapData.destinationBankUuid || !swapData.destinationAccountNumber) {
        Alert.alert('Error', 'Please select a bank and enter account number');
        return;
      }
    }
    if (!swapData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    setCurrentStep('confirm');
    initiateSwap();
  };

  const initiateSwap = async () => {
    setIsLoading(true);
    try {
      const payload: any = {
        source_currency_code: swapData.baseCurrency,
        source_swap_amount: parseFloat(swapData.exchangeAmount),
        destination_type: swapData.destinationType,
        destination_currency_code: swapData.quoteCurrency,
        success_redirect_url: 'https://successful-payment-url.com',
        cancelled_redirect_url: null,
        failed_redirect_url: null,
        description: swapData.description,
      };
      
      if (swapData.destinationType === 'nip') {
        payload.destination_bank_uuid = swapData.destinationBankUuid;
        payload.destination_account_number = swapData.destinationAccountNumber;
      }
      
      const response = await apiService.initiateCurrencySwap(payload);
      if (response.status && response.data) {
        setSwapResult(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to initiate swap');
        setCurrentStep('destination');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate swap');
      setCurrentStep('destination');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSwap = () => {
    setCurrentStep('pin');
  };

  const handleProcessSwap = async () => {
    if (!swapData.transactionPin || swapData.transactionPin.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit PIN');
      return;
    }
    
    setIsProcessing(true);
    try {
      const payload: any = {
        source_currency_code: swapData.baseCurrency,
        source_swap_amount: parseFloat(swapData.exchangeAmount),
        destination_type: swapData.destinationType,
        destination_currency_code: swapData.quoteCurrency,
        success_redirect_url: 'https://successful-payment-url.com',
        cancelled_redirect_url: null,
        failed_redirect_url: null,
        description: swapData.description,
        transaction_pin: swapData.transactionPin,
      };
      
      if (swapData.destinationType === 'nip') {
        payload.destination_bank_uuid = swapData.destinationBankUuid;
        payload.destination_account_number = swapData.destinationAccountNumber;
      }
      
      const response = await apiService.processCurrencySwap(payload);
      if (response.status && response.data) {
        if (response.data?.user_balance_after) {
          await updateWalletBalance(response.data.user_balance_after);
        }
        setSwapResult(response.data);
        setCurrentStep('result');
        
        if (response.data.payment_url) {
          Alert.alert('Payment', 'External payment required', [
            {
              text: 'Open Payment',
              onPress: () => {
                if (Platform.OS === 'web') {
                  window.open(response.data.payment_url, '_blank');
                }
              },
            },
            { text: 'Later', style: 'cancel' },
          ]);
        }
      } else {
        Alert.alert('Error', response.message || 'Swap failed. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Swap failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackPress = () => {
    switch (currentStep) {
      case 'currencies':
        router.back();
        break;
      case 'amount':
        setCurrentStep('currencies');
        break;
      case 'destination':
        setCurrentStep('amount');
        break;
      case 'confirm':
        setCurrentStep('destination');
        break;
      case 'pin':
        setCurrentStep('confirm');
        break;
      case 'result':
        router.back();
        break;
    }
  };

  const renderCurrencySelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Currencies</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>From Currency</Text>
        <DropdownSelect
          options={CURRENCY_OPTIONS}
          selectedValue={swapData.baseCurrency}
          onSelect={(value) => setSwapData(prev => ({ ...prev, baseCurrency: value }))}
          placeholder="Select base currency"
          searchable={false}
          label="Base Currency"
        />
      </View>

      <TouchableOpacity style={styles.swapButton} onPress={handleSwapCurrencies}>
        <ArrowRightLeft size={24} color={primaryColor} />
      </TouchableOpacity>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>To Currency</Text>
        <DropdownSelect
          options={CURRENCY_OPTIONS}
          selectedValue={swapData.quoteCurrency}
          onSelect={(value) => setSwapData(prev => ({ ...prev, quoteCurrency: value }))}
          placeholder="Select quote currency"
          searchable={false}
          label="Quote Currency"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: primaryColor },
          (!swapData.baseCurrency || !swapData.quoteCurrency || swapData.baseCurrency === swapData.quoteCurrency) && styles.disabledButton
        ]}
        onPress={handleCurrencySelection}
        disabled={!swapData.baseCurrency || !swapData.quoteCurrency || swapData.baseCurrency === swapData.quoteCurrency}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAmountInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Amount</Text>
      
      <View style={styles.currencyPairInfo}>
        <Text style={styles.currencyPairText}>
          {swapData.baseCurrency} → {swapData.quoteCurrency}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount to Swap</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>{swapData.baseCurrency}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={swapData.exchangeAmount}
              onChangeText={(text) => setSwapData(prev => ({ ...prev, exchangeAmount: text }))}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: primaryColor },
          (!swapData.exchangeAmount || parseFloat(swapData.exchangeAmount) <= 0 || isLoading) && styles.disabledButton
        ]}
        onPress={handleAmountSubmit}
        disabled={!swapData.exchangeAmount || parseFloat(swapData.exchangeAmount) <= 0 || isLoading}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Getting Rate...' : 'Get Exchange Rate'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDestinationSetup = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Destination Details</Text>
      
      {exchangeRateData && (
        <View style={styles.rateInfo}>
          <Text style={styles.rateLabel}>Exchange Rate:</Text>
          <Text style={styles.rateValue}>{exchangeRateData.exchange_rate}</Text>
          <Text style={styles.receiveLabel}>You will receive:</Text>
          <Text style={styles.receiveAmount}>
            {exchangeRateData.quote_amount} {swapData.quoteCurrency}
          </Text>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Destination Type</Text>
        <DropdownSelect
          options={DESTINATION_TYPES}
          selectedValue={swapData.destinationType}
          onSelect={(value) => setSwapData(prev => ({ ...prev, destinationType: value }))}
          placeholder="Select destination type"
          searchable={false}
          label="Destination Type"
        />
      </View>

      {swapData.destinationType === 'nip' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank</Text>
            {isLoading ? (
              <LoadingSpinner message="Loading banks..." color="#FFFFFF" />
            ) : (
              <DropdownSelect
                options={banks.map(b => ({ id: b.uuid, name: b.name, code: b.uuid }))}
                selectedValue={swapData.destinationBankUuid}
                onSelect={(value) => setSwapData(prev => ({ ...prev, destinationBankUuid: value }))}
                placeholder="Select bank"
                searchable={true}
                label="Bank"
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter account number"
                value={swapData.destinationAccountNumber}
                onChangeText={(text) => setSwapData(prev => ({ ...prev, destinationAccountNumber: text }))}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter swap description"
            value={swapData.description}
            onChangeText={(text) => setSwapData(prev => ({ ...prev, description: text }))}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: primaryColor },
          (!swapData.description.trim() || (swapData.destinationType === 'nip' && (!swapData.destinationBankUuid || !swapData.destinationAccountNumber))) && styles.disabledButton
        ]}
        onPress={handleDestinationSubmit}
        disabled={!swapData.description.trim() || (swapData.destinationType === 'nip' && (!swapData.destinationBankUuid || !swapData.destinationAccountNumber))}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Swap</Text>
      
      {isLoading ? (
        <LoadingSpinner message="Preparing swap..." color="#FFFFFF" />
      ) : swapResult ? (
        <>
          <View style={styles.confirmCard}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>From:</Text>
              <Text style={styles.confirmValue}>{swapData.exchangeAmount} {swapData.baseCurrency}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>To:</Text>
              <Text style={styles.confirmValue}>
                {swapResult.destination_amount_expected} {swapData.quoteCurrency}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Exchange Rate:</Text>
              <Text style={styles.confirmValue}>{swapResult.exchange_rate}</Text>
            </View>
            {swapData.destinationType === 'nip' && (
              <>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Bank:</Text>
                  <Text style={styles.confirmValue}>{swapResult.destination_bank}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Account:</Text>
                  <Text style={styles.confirmValue}>{swapResult.destination_account_number}</Text>
                </View>
              </>
            )}
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Description:</Text>
              <Text style={styles.confirmValue}>{swapData.description}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: primaryColor }]}
            onPress={handleConfirmSwap}
          >
            <Text style={styles.confirmButtonText}>Proceed to Swap</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );

  const renderPinInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Transaction PIN</Text>
      
      <View style={styles.pinContainer}>
        <Text style={styles.pinLabel}>Enter your 4-digit transaction PIN to complete the swap</Text>
        <View style={styles.pinInputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="••••"
              value={swapData.transactionPin}
              onChangeText={(text) => setSwapData(prev => ({ ...prev, transactionPin: text }))}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={!showPin}
              placeholderTextColor="#9CA3AF"
            />
          </View>
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

      <TouchableOpacity
        style={[
          styles.transferButton,
          { backgroundColor: primaryColor },
          (!swapData.transactionPin || swapData.transactionPin.length !== 4 || isProcessing) && styles.disabledButton
        ]}
        onPress={handleProcessSwap}
        disabled={!swapData.transactionPin || swapData.transactionPin.length !== 4 || isProcessing}
      >
        <Text style={styles.transferButtonText}>
          {isProcessing ? 'Processing...' : 'Complete Swap'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderResult = () => (
    <View style={styles.stepContainer}>
      {swapResult?.destination_amount_expected !== undefined ? (
        <>
          <View style={[styles.successIcon, { backgroundColor: '#10B981' }]}>
            <Check size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Swap Successful!</Text>
          <Text style={styles.successMessage}>Your currency swap has been completed successfully.</Text>
          
          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>Swap Receipt</Text>
            {swapResult.reference_number && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Reference:</Text>
                <Text style={styles.receiptValue}>{swapResult.reference_number}</Text>
              </View>
            )}
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>From:</Text>
              <Text style={styles.receiptValue}>{swapData.exchangeAmount} {swapData.baseCurrency}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>To:</Text>
              <Text style={styles.receiptValue}>{swapResult.destination_amount_expected} {swapData.quoteCurrency}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Rate:</Text>
              <Text style={styles.receiptValue}>{swapResult.exchange_rate}</Text>
            </View>
            {swapData.destinationType === 'nip' && (
              <>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Bank:</Text>
                  <Text style={styles.receiptValue}>{swapResult.destination_bank}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Account:</Text>
                  <Text style={styles.receiptValue}>{swapResult.destination_account_number}</Text>
                </View>
              </>
            )}
          </View>

          {swapResult.payment_url && (
            <TouchableOpacity
              style={[styles.paymentButton, { backgroundColor: '#4361ee' }]}
              onPress={() => {
                if (Platform.OS === 'web') {
                  window.open(swapResult.payment_url, '_blank');
                }
              }}
            >
              <Text style={styles.paymentButtonText}>Complete Payment</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <View style={styles.errorIcon}>
            <Text style={styles.errorEmoji}>❌</Text>
          </View>
          <Text style={styles.errorTitle}>Swap Failed</Text>
          <Text style={styles.errorMessage}>
            The swap could not be completed. Please try again.
          </Text>
        </>
      )}
      
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: primaryColor }]}
        onPress={() => router.back()}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

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
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Currency Swap</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {currentStep === 'currencies' && renderCurrencySelection()}
        {currentStep === 'amount' && renderAmountInput()}
        {currentStep === 'destination' && renderDestinationSetup()}
        {currentStep === 'confirm' && renderConfirmation()}
        {currentStep === 'pin' && renderPinInput()}
        {currentStep === 'result' && renderResult()}
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
    width: 40,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  swapButton: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  currencyPairInfo: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  currencyPairText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  currencySymbol: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  rateInfo: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  rateLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  rateValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  receiveLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  receiveAmount: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  confirmValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pinLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  pinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pinToggle: {
    padding: 4,
  },
  transferButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  transferButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
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
  errorIcon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  errorEmoji: {
    fontSize: 64,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
  },
  paymentButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});