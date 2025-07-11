import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Check, Eye, EyeOff, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DropdownSelect } from '@/components/DropdownSelect';
import { apiService } from '@/services/api';

const { width } = Dimensions.get('window');

interface Bank {
  id: string;
  name: string;
  code: string;
}

interface TransferStep {
  step: 'bank' | 'account' | 'amount' | 'confirm' | 'pin' | 'result';
}

interface TransferData {
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: string;
  description: string;
  transactionPin: string;
}

interface InitiateResponse {
  currency_code: string;
  currency_symbol: string;
  type: string;
  category: string;
  actual_balance_before: string;
  amount_processable: string;
  platform_charge_fee: string;
  expected_balance_after: string;
  total_amount_processable: string;
}

export default function BankTransfer() {
  const { user, appSettings, walletBalance, updateWalletBalance } = useAuth();
  const [currentStep, setCurrentStep] = useState<TransferStep['step']>('bank');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [transferData, setTransferData] = useState<TransferData>({
    bankId: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    amount: '',
    description: '',
    transactionPin: '',
  });
  const [initiateData, setInitiateData] = useState<InitiateResponse | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  // Get colors from API settings
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';

  useEffect(() => {
    if (currentStep === 'bank') {
      loadBanks();
    }
  }, [currentStep]);

  const loadBanks = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getBanks();
      if (response.status && response.data?.data) {
        setBanks(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load banks. Please try again.');
      }
    } catch (error) {
      console.error('Failed to load banks:', error);
      Alert.alert('Error', 'Failed to load banks. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankSelect = (bankId: string) => {
    const bank = banks.find(b => b.id === bankId);
    if (bank) {
      setTransferData(prev => ({
        ...prev,
        bankId: bank.id,
        bankName: bank.name,
      }));
      setCurrentStep('account');
    }
  };

  const handleAccountVerification = async () => {
    if (!transferData.accountNumber || transferData.accountNumber.length !== 10) {
      setVerificationError('Please enter a valid 10-digit account number');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const response = await apiService.verifyBankAccount(transferData.accountNumber, transferData.bankId);
      if (response.status && response.data?.account_name) {
        setTransferData(prev => ({
          ...prev,
          accountName: response.data.account_name,
        }));
        setCurrentStep('amount');
      } else {
        setVerificationError('Account verification failed. Please check the account number and try again.');
      }
    } catch (error: any) {
      console.error('Account verification error:', error);
      setVerificationError(error.message || 'Failed to verify account. Please check the account number and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAmountSubmit = () => {
    const amount = parseFloat(transferData.amount);
    
    if (!transferData.amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount > walletBalance) {
      Alert.alert('Insufficient Funds', `You cannot transfer more than your available balance of ₦${walletBalance.toLocaleString()}`);
      return;
    }

    if (!transferData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    setCurrentStep('confirm');
    initiateTransfer();
  };

  const initiateTransfer = async () => {
    setIsLoading(true);
    try {
      const wallet = user?.getPrimaryWallet || user?.get_primary_wallet;
      const response = await apiService.initiateWalletToBankTransfer({
        source_wallet_number: wallet?.wallet_number || '',
        destination_account_number: transferData.accountNumber,
        bank_id: transferData.bankId,
        amount: parseFloat(transferData.amount),
        description: transferData.description,
      });

      if (response.status && response.data) {
        setInitiateData(response.data);
      } else {
        Alert.alert('Error', 'Failed to initiate transfer. Please try again.');
        setCurrentStep('amount');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate transfer. Please try again.');
      setCurrentStep('amount');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransfer = () => {
    setCurrentStep('pin');
  };

  const handleProcessTransfer = async () => {
    if (!transferData.transactionPin || transferData.transactionPin.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit PIN');
      return;
    }

    setIsProcessing(true);
    try {
      const wallet = user?.getPrimaryWallet || user?.get_primary_wallet;
      const response = await apiService.processWalletToBankTransfer({
        source_wallet_number: wallet?.wallet_number || '',
        destination_account_number: transferData.accountNumber,
        bank_id: transferData.bankId,
        amount: parseFloat(transferData.amount),
        description: transferData.description,
        transaction_pin: parseInt(transferData.transactionPin),
      });

      if (response.status && response.data) {
        // Update wallet balance in storage
        if (response.data?.data?.user_balance_after) {
          await updateWalletBalance(response.data.data.user_balance_after);
        }
        
        setResultData(response.data);
        setCurrentStep('result');
      } else {
        Alert.alert('Error', response.message || 'Transfer failed. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Transfer failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackPress = () => {
    switch (currentStep) {
      case 'bank':
        router.back();
        break;
      case 'account':
        setCurrentStep('bank');
        break;
      case 'amount':
        setCurrentStep('account');
        break;
      case 'confirm':
        setCurrentStep('amount');
        break;
      case 'pin':
        setCurrentStep('confirm');
        break;
      case 'result':
        router.back();
        break;
    }
  };

  const renderBankSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Bank</Text>
      
      {isLoading ? (
        <LoadingSpinner message="Loading banks..." color="#FFFFFF" />
      ) : banks.length > 0 ? (
        <DropdownSelect
          options={banks}
          selectedValue={transferData.bankId}
          onSelect={handleBankSelect}
          placeholder="Choose a bank"
          searchable={true}
          label="Bank"
          style={styles.input}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No banks available. Please try again later.</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: primaryColor }]}
            onPress={loadBanks}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderAccountInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Account Details</Text>
      <Text style={styles.selectedBank}>Bank: {transferData.bankName}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Account Number</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit account number"
            value={transferData.accountNumber}
            onChangeText={(text) => {
              setTransferData(prev => ({ ...prev, accountNumber: text }));
              setVerificationError(null);
            }}
            keyboardType="numeric"
            maxLength={10}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {verificationError && (
          <View style={styles.errorMessageContainer}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={styles.errorMessageText}>{verificationError}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.verifyButton, 
          { backgroundColor: primaryColor },
          (!transferData.accountNumber || transferData.accountNumber.length !== 10 || isVerifying) && styles.disabledButton
        ]}
        onPress={handleAccountVerification}
        disabled={isVerifying || transferData.accountNumber.length !== 10}
      >
        <Text style={styles.verifyButtonText}>
          {isVerifying ? 'Verifying...' : 'Verify Account'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAmountInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Transfer Amount</Text>
      
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{transferData.accountName}</Text>
        <Text style={styles.accountDetails}>
          {transferData.accountNumber} <Text>•</Text> {transferData.bankName}
        </Text>
      </View>

      <View style={styles.balanceInfo}>
        <Text style={styles.balanceLabel}>Available Balance:</Text>
        <Text style={styles.balanceAmount}>
          ₦{walletBalance.toLocaleString()}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.currencySymbolContainer}>
            <Text style={styles.currencySymbol}>₦</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={transferData.amount}
            onChangeText={(text) => setTransferData(prev => ({ ...prev, amount: text }))}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {transferData.amount && parseFloat(transferData.amount) > walletBalance && (
          <Text style={styles.errorText}>Amount exceeds available balance</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter transfer description"
            value={transferData.description}
            onChangeText={(text) => setTransferData(prev => ({ ...prev, description: text }))}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton, 
          { backgroundColor: primaryColor },
          (!transferData.amount || !transferData.description.trim() || parseFloat(transferData.amount) > walletBalance) && styles.disabledButton
        ]}
        onPress={handleAmountSubmit}
        disabled={!transferData.amount || !transferData.description.trim() || parseFloat(transferData.amount) > walletBalance}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Transfer</Text>
      
      {isLoading ? (
        <LoadingSpinner message="Preparing transfer..." color="#FFFFFF" />
      ) : initiateData ? (
        <>
          <View style={styles.confirmCard}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Recipient:</Text>
              <Text style={styles.confirmValue}>{transferData.accountName}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Account:</Text>
              <Text style={styles.confirmValue}>{transferData.accountNumber}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Bank:</Text>
              <Text style={styles.confirmValue}>{transferData.bankName}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Amount:</Text>
              <Text style={styles.confirmValue}>
                {initiateData.currency_symbol}{initiateData.amount_processable}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Fee:</Text>
              <Text style={styles.confirmValue}>
                {initiateData.currency_symbol}{initiateData.platform_charge_fee}
              </Text>
            </View>
            <View style={[styles.confirmRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                {initiateData.currency_symbol}{initiateData.total_amount_processable}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Balance After:</Text>
              <Text style={styles.confirmValue}>
                {initiateData.currency_symbol}{initiateData.expected_balance_after}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: primaryColor }]}
            onPress={handleConfirmTransfer}
          >
            <Text style={styles.confirmButtonText}>Proceed to Transfer</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );

  const renderPinInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Transaction PIN</Text>
      
      <View style={styles.pinContainer}>
        <Text style={styles.pinLabel}>Enter your 4-digit transaction PIN to complete the transfer</Text>
        <View style={styles.pinInputContainer}>
          <TextInput
            style={styles.pinInput}
            placeholder="••••"
            value={transferData.transactionPin}
            onChangeText={(text) => setTransferData(prev => ({ ...prev, transactionPin: text }))}
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

      <TouchableOpacity
        style={[
          styles.transferButton,
          { backgroundColor: primaryColor },
          (!transferData.transactionPin || transferData.transactionPin.length !== 4 || isProcessing) && styles.disabledButton
        ]}
        onPress={handleProcessTransfer}
        disabled={!transferData.transactionPin || transferData.transactionPin.length !== 4 || isProcessing}
      >
        <Text style={styles.transferButtonText}>
          {isProcessing ? 'Processing...' : 'Complete Transfer'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderResult = () => (
    <View style={styles.stepContainer}>
      {resultData?.status ? (
        <>
          <View style={[styles.successIcon, { backgroundColor: '#10B981' }]}>
            <Check size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Transfer Successful!</Text>
          <Text style={styles.successMessage}>{resultData.message}</Text>
          
          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>Transaction Receipt</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Reference:</Text>
              <Text style={styles.receiptValue}>{resultData.data?.reference_number}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Instrument Code:</Text>
              <Text style={styles.receiptValue}>{resultData.data?.instrument_code}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Description:</Text>
              <Text style={styles.receiptValue}>{resultData.data?.description}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Amount:</Text>
              <Text style={styles.receiptValue}>₦{resultData.data?.user_amount?.toLocaleString()}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Fee:</Text>
              <Text style={styles.receiptValue}>₦{resultData.data?.user_charge_amount?.toLocaleString()}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>New Balance:</Text>
              <Text style={styles.receiptValue}>₦{resultData.data?.user_balance_after?.toLocaleString()}</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.errorIcon}>
            <Text style={styles.errorEmoji}>❌</Text>
          </View>
          <Text style={styles.errorTitle}>Transfer Failed</Text>
          <Text style={styles.errorMessage}>
            {resultData?.message || 'The transfer could not be completed. Please try again.'}
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
        <Text style={styles.headerTitle}>Bank Transfer</Text>
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
        {currentStep === 'bank' && renderBankSelection()}
        {currentStep === 'account' && renderAccountInput()}
        {currentStep === 'amount' && renderAmountInput()}
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
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  errorMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  errorMessageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    flex: 1,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  selectedBank: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#CCCCCC',
    marginBottom: 24,
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
  verifyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  accountInfo: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  accountName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
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
    color: '#FFFFFF',
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
  pinInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 8,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  currencySymbolContainer: {
    marginRight: 8,
  },
});