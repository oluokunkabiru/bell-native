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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Eye, EyeOff, User, RefreshCw, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiService } from '@/services/api';

interface WalletTransferStep {
  step: 'wallet' | 'amount' | 'confirm' | 'pin' | 'result' | 'create-wallet';
}

interface TransferData {
  destinationWalletNumber: string;
  destinationWalletName: string;
  destinationWalletType: string;
  destinationCurrency: string;
  amount: string;
  description: string;
  transactionPin: string;
}

interface WalletType {
  id: string;
  name: string;
}

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
}

export default function WalletTransfer() {
  const { user, appSettings, walletBalance, updateWalletBalance } = useAuth();
  const [currentStep, setCurrentStep] = useState<WalletTransferStep['step']>('wallet');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [transferData, setTransferData] = useState<TransferData>({
    destinationWalletNumber: '',
    destinationWalletName: '',
    destinationWalletType: '',
    destinationCurrency: '',
    amount: '',
    description: '',
    transactionPin: '',
  });
  const [resultData, setResultData] = useState<any>(null);
  const [walletTypes, setWalletTypes] = useState<WalletType[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedWalletType, setSelectedWalletType] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [isLoadingWalletTypes, setIsLoadingWalletTypes] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Get colors from API settings
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';
  
  const wallet = user?.getPrimaryWallet || user?.get_primary_wallet;

  useEffect(() => {
    if (!wallet) {
      loadWalletTypes();
      loadCurrencies();
      setCurrentStep('create-wallet');
    }
  }, [wallet]);

  const loadWalletTypes = async () => {
    setIsLoadingWalletTypes(true);
    try {
      const response = await apiService.makeRequest('/wallet-types?items_per_page=15');
      if (response.status && response.data?.data) {
        setWalletTypes(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedWalletType(response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load wallet types:', error);
    } finally {
      setIsLoadingWalletTypes(false);
    }
  };

  const loadCurrencies = async () => {
    setIsLoadingCurrencies(true);
    try {
      const response = await apiService.makeRequest('/customers/currencies?page=1&items_per_page=15');
      if (response.status && response.data?.data) {
        setCurrencies(response.data.data);
        // Find NGN currency and set as default
        const ngnCurrency = response.data.data.find((c: Currency) => c.code === 'NGN');
        if (ngnCurrency) {
          setSelectedCurrency(ngnCurrency.id);
        } else if (response.data.data.length > 0) {
          setSelectedCurrency(response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load currencies:', error);
    } finally {
      setIsLoadingCurrencies(false);
    }
  };

  const createWallet = async () => {
    if (!selectedWalletType || !selectedCurrency) {
      Alert.alert('Error', 'Please select wallet type and currency');
      return;
    }

    setIsCreatingWallet(true);
    try {
      const response = await apiService.makeRequest('/customers/wallets', {
        method: 'POST',
        body: JSON.stringify({
          account_type: 'virtual-account',
          wallet_type_id: selectedWalletType,
          currency_id: selectedCurrency
        })
      });

      if (response.status) {
        Alert.alert('Success', 'Wallet created successfully!');
        // Refresh user profile to get the new wallet
        await apiService.getProfile();
        router.replace('/');
      } else {
        Alert.alert('Error', response.message || 'Failed to create wallet');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create wallet');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleWalletVerification = async () => {
    if (!transferData.destinationWalletNumber || transferData.destinationWalletNumber.length < 8) {
      Alert.alert('Error', 'Please enter a valid wallet number');
      return;
    }

    if (wallet && transferData.destinationWalletNumber === wallet.wallet_number) {
      Alert.alert('Error', 'You cannot transfer to your own wallet');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const response = await apiService.verifyWalletNumber(transferData.destinationWalletNumber);
      
      if (response.status && response.data) {
        setTransferData(prev => ({
          ...prev,
          destinationWalletName: response.data.wallet_name,
          destinationWalletType: response.data.wallet_type,
          destinationCurrency: response.data.currency_code,
        }));
        setCurrentStep('amount');
      } else {
        setVerificationError('Wallet verification failed. Please check the wallet number.');
      }
    } catch (error: any) {
      console.error('Wallet verification error:', error);
      setVerificationError(error.message || 'Failed to verify wallet. Please try again.');
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
      const response = await apiService.processWalletToWalletTransfer({
        source_wallet_number: wallet?.wallet_number || '',
        destination_wallet_number: transferData.destinationWalletNumber,
        amount: parseFloat(transferData.amount),
        description: transferData.description,
        transaction_pin: parseInt(transferData.transactionPin),
      });

      if (response.status && response.data) {
        // Update wallet balance in storage
        if (response.data?.data?.user_balance_after) {
          await updateWalletBalance(response.data.data.user_balance_after);
        }
        
        setResultData(response.data.data);
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
      case 'wallet':
      case 'create-wallet':
        router.back();
        break;
      case 'amount':
        setCurrentStep('wallet');
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

  const renderCreateWallet = () => (
    <View style={styles.stepContainer}>
      <View style={styles.createWalletHeader}>
        <AlertCircle size={64} color="#F59E0B" />
        <Text style={styles.createWalletTitle}>No Wallet Found</Text>
        <Text style={styles.createWalletSubtitle}>
          You need to create a wallet before you can make transfers
        </Text>
      </View>

      {isLoadingWalletTypes || isLoadingCurrencies ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Loading wallet options...</Text>
        </View>
      ) : (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Wallet Type</Text>
            <View style={styles.selectContainer}>
              {walletTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.selectOption,
                    selectedWalletType === type.id && { backgroundColor: primaryColor }
                  ]}
                  onPress={() => setSelectedWalletType(type.id)}
                >
                  <Text style={[
                    styles.selectOptionText,
                    selectedWalletType === type.id && styles.selectedOptionText
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Currency</Text>
            <View style={styles.selectContainer}>
              {currencies
                .filter(c => c.type === 'fiat')
                .map((currency) => (
                  <TouchableOpacity
                    key={currency.id}
                    style={[
                      styles.selectOption,
                      selectedCurrency === currency.id && { backgroundColor: primaryColor }
                    ]}
                    onPress={() => setSelectedCurrency(currency.id)}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      selectedCurrency === currency.id && styles.selectedOptionText
                    ]}>
                      {currency.symbol} {currency.code}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.createWalletButton,
              { backgroundColor: primaryColor },
              (!selectedWalletType || !selectedCurrency || isCreatingWallet) && styles.disabledButton
            ]}
            onPress={createWallet}
            disabled={!selectedWalletType || !selectedCurrency || isCreatingWallet}
          >
            <Text style={styles.createWalletButtonText}>
              {isCreatingWallet ? 'Creating Wallet...' : 'Create Wallet'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderWalletInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Wallet Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Destination Wallet Number</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter wallet number"
          value={transferData.destinationWalletNumber}
          onChangeText={(text) => {
            setTransferData(prev => ({ ...prev, destinationWalletNumber: text }));
            setVerificationError(null);
          }}
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />
        {verificationError && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={styles.errorText}>{verificationError}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.verifyButton, 
          { backgroundColor: primaryColor },
          (!transferData.destinationWalletNumber || isVerifying) && styles.disabledButton
        ]}
        onPress={handleWalletVerification}
        disabled={isVerifying || !transferData.destinationWalletNumber}
      >
        <Text style={styles.verifyButtonText}>
          {isVerifying ? 'Verifying...' : 'Verify Wallet'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAmountInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Transfer Amount</Text>
      
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{transferData.destinationWalletName}</Text>
        <Text style={styles.accountDetails}>
          Wallet: {transferData.destinationWalletNumber}
        </Text>
        <Text style={styles.accountType}>
          {transferData.destinationWalletType} • {transferData.destinationCurrency}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>₦</Text>
          <TextInput
            style={styles.amountInput}
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
        <TextInput
          style={styles.textInput}
          placeholder="Enter transfer description"
          value={transferData.description}
          onChangeText={(text) => setTransferData(prev => ({ ...prev, description: text }))}
          placeholderTextColor="#9CA3AF"
        />
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
      
      <View style={styles.confirmCard}>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Recipient:</Text>
          <Text style={styles.confirmValue}>{transferData.destinationWalletName}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Wallet Number:</Text>
          <Text style={styles.confirmValue}>{transferData.destinationWalletNumber}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Wallet Type:</Text>
          <Text style={styles.confirmValue}>{transferData.destinationWalletType}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Currency:</Text>
          <Text style={styles.confirmValue}>{transferData.destinationCurrency}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Amount:</Text>
          <Text style={styles.confirmValue}>
            ₦{parseFloat(transferData.amount).toLocaleString()}
          </Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Description:</Text>
          <Text style={styles.confirmValue}>{transferData.description}</Text>
        </View>
        <View style={[styles.confirmRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            ₦{parseFloat(transferData.amount).toLocaleString()}
          </Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Balance After:</Text>
          <Text style={styles.confirmValue}>
            ₦{(walletBalance - parseFloat(transferData.amount)).toLocaleString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: primaryColor }]}
        onPress={handleConfirmTransfer}
      >
        <Text style={styles.confirmButtonText}>Proceed to Transfer</Text>
      </TouchableOpacity>
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
              <Text style={styles.receiptValue}>{resultData.reference_number}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Instrument Code:</Text>
              <Text style={styles.receiptValue}>{resultData.instrument_code}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Description:</Text>
              <Text style={styles.receiptValue}>{resultData.description}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Amount:</Text>
              <Text style={styles.receiptValue}>₦{resultData.user_amount?.toLocaleString()}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Fee:</Text>
              <Text style={styles.receiptValue}>₦{resultData.user_charge_amount?.toLocaleString()}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>New Balance:</Text>
              <Text style={styles.receiptValue}>₦{resultData.user_balance_after?.toLocaleString()}</Text>
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
        <Text style={styles.headerTitle}>Wallet Transfer</Text>
        <View style={styles.headerRight}>
          {wallet && (
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Balance:</Text>
              <Text style={styles.balanceAmount}>₦{walletBalance.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {currentStep === 'create-wallet' && renderCreateWallet()}
        {currentStep === 'wallet' && renderWalletInput()}
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    flex: 1,
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
    marginBottom: 4,
  },
  accountType: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
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
  createWalletHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  createWalletTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  createWalletSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    marginTop: 16,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: '48%',
  },
  selectOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  createWalletButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  createWalletButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});