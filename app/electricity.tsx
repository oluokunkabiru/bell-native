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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Zap, Check, X, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DropdownSelect } from '@/components/DropdownSelect';
import { apiService } from '@/services/api';

interface ElectricityDisco {
  id: string;
  name: string;
}

interface MeterType {
  id: string;
  name: string;
}

interface MeterVerificationData {
  meter_name: string;
  address: string;
  meter_type: string;
  meter_number: string;
}

interface ElectricityResult {
  success: boolean;
  message: string;
  data?: {
    balance: string;
    token: string;
    purchased_units: string;
  };
}

interface ElectricityStep {
  step: 'disco' | 'meter' | 'amount' | 'confirm' | 'pin' | 'result';
}

export default function ElectricityBillPayment() {
  const { user, appSettings, walletBalance, updateWalletBalance } = useAuth();
  const [currentStep, setCurrentStep] = useState<ElectricityStep['step']>('disco');
  const [discos, setDiscos] = useState<ElectricityDisco[]>([]);
  const [meterTypes, setMeterTypes] = useState<MeterType[]>([]);
  const [selectedDisco, setSelectedDisco] = useState('');
  const [selectedMeterType, setSelectedMeterType] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationData, setVerificationData] = useState<MeterVerificationData | null>(null);
  const [result, setResult] = useState<ElectricityResult | null>(null);

  // Get colors from API settings
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';

  useEffect(() => {
    if (currentStep === 'disco') {
      loadMeterServices();
    }
  }, [currentStep]);

  const loadMeterServices = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getMeterServices();
      if (response.status && response.data) {
        setDiscos(response.data.electricity_discos || []);
        setMeterTypes(response.data.meter_types || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load electricity services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueFromDisco = () => {
    if (!selectedDisco || !selectedMeterType) {
      Alert.alert('Error', 'Please select both electricity provider and meter type');
      return;
    }
    setCurrentStep('meter');
  };

  const handleMeterVerification = async () => {
    if (!meterNumber || meterNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid meter number');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiService.verifyMeterNumber({
        electricity_disco: selectedDisco,
        meter_type: selectedMeterType,
        meter_number: meterNumber,
      });

      if (response.status && response.data) {
        setVerificationData(response.data);
        setCurrentStep('amount');
      } else {
        Alert.alert('Error', 'Meter verification failed. Please check the meter number.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify meter. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAmountSubmit = () => {
    const purchaseAmount = parseFloat(amount);
    
    if (!amount || purchaseAmount < 100) {
      Alert.alert('Error', 'Minimum amount is ₦100');
      return;
    }

    if (purchaseAmount > walletBalance) {
      Alert.alert('Insufficient Funds', `You cannot purchase electricity worth more than your available balance of ₦${walletBalance.toLocaleString()}`);
      return;
    }

    setCurrentStep('confirm');
  };

  const handleConfirmPurchase = () => {
    setCurrentStep('pin');
  };

  const handleProcessPurchase = async () => {
    if (!transactionPin || transactionPin.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit PIN');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.buyElectricity({
        meter_number: meterNumber,
        electricity_disco: selectedDisco,
        meter_type: selectedMeterType,
        final_amount: amount,
        transaction_pin: transactionPin,
      });

      if (response.status) {
        // Update wallet balance in storage
        if (response.data?.balance) {
          await updateWalletBalance(parseFloat(response.data.balance));
        }
        
        setResult({
          success: true,
          message: response.message,
          data: response.data,
        });
      } else {
        setResult({
          success: false,
          message: response.message || 'Electricity purchase failed',
        });
      }
      setCurrentStep('result');
    } catch (error: any) {
      console.error('Electricity purchase error:', error);
      setResult({
        success: false,
        message: error.message || 'Failed to purchase electricity. Please try again.',
      });
      setCurrentStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackPress = () => {
    switch (currentStep) {
      case 'disco':
        router.back();
        break;
      case 'meter':
        setCurrentStep('disco');
        break;
      case 'amount':
        setCurrentStep('meter');
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

  const handleDone = () => {
    router.back();
  };

  const quickAmounts = ['1000', '2000', '5000', '10000'];

  const selectedDiscoData = discos.find(d => d.id === selectedDisco);
  const selectedMeterTypeData = meterTypes.find(m => m.id === selectedMeterType);

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

  const renderDiscoSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Electricity Provider</Text>
      
      {isLoading ? (
        <LoadingSpinner message="Loading providers..." color="#FFFFFF" />
      ) : (
        <>
          <DropdownSelect
            options={discos}
            selectedValue={selectedDisco}
            onSelect={setSelectedDisco}
            placeholder="Choose electricity provider"
            searchable={true}
            label="Electricity Distribution Company"
          />

          <DropdownSelect
            options={meterTypes}
            selectedValue={selectedMeterType}
            onSelect={setSelectedMeterType}
            placeholder="Choose meter type"
            label="Meter Type"
          />

          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: primaryColor },
              (!selectedDisco || !selectedMeterType) && styles.disabledButton
            ]}
            onPress={handleContinueFromDisco}
            disabled={!selectedDisco || !selectedMeterType}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderMeterInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Meter Details</Text>
      
      <View style={styles.selectedInfo}>
        <Text style={styles.selectedText}>
          {selectedDiscoData?.name} - {selectedMeterTypeData?.name}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Meter Number</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter meter number"
          value={meterNumber}
          onChangeText={setMeterNumber}
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.verifyButton,
          { backgroundColor: primaryColor },
          (!meterNumber || isVerifying) && styles.disabledButton
        ]}
        onPress={handleMeterVerification}
        disabled={!meterNumber || isVerifying}
      >
        <Text style={styles.verifyButtonText}>
          {isVerifying ? 'Verifying...' : 'Verify Meter'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAmountInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Amount</Text>
      
      {verificationData && (
        <View style={styles.verificationCard}>
          <Text style={styles.verificationTitle}>Meter Verified ✓</Text>
          <View style={styles.verificationRow}>
            <Text style={styles.verificationLabel}>Name:</Text>
            <Text style={styles.verificationValue}>{verificationData.meter_name}</Text>
          </View>
          <View style={styles.verificationRow}>
            <Text style={styles.verificationLabel}>Address:</Text>
            <Text style={styles.verificationValue}>{verificationData.address}</Text>
          </View>
          <View style={styles.verificationRow}>
            <Text style={styles.verificationLabel}>Meter Number:</Text>
            <Text style={styles.verificationValue}>{verificationData.meter_number}</Text>
          </View>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount</Text>
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
        {amount && parseFloat(amount) > walletBalance && (
          <Text style={styles.errorText}>Amount exceeds available balance</Text>
        )}
      </View>

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
            onPress={() => setAmount(quickAmount)}
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

      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: primaryColor },
          (!amount || parseFloat(amount) > walletBalance) && styles.disabledButton
        ]}
        onPress={handleAmountSubmit}
        disabled={!amount || parseFloat(amount) > walletBalance}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Purchase</Text>
      
      <View style={styles.confirmCard}>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Provider:</Text>
          <Text style={styles.confirmValue}>{selectedDiscoData?.name}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Meter Type:</Text>
          <Text style={styles.confirmValue}>{selectedMeterTypeData?.name}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Meter Number:</Text>
          <Text style={styles.confirmValue}>{meterNumber}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Customer Name:</Text>
          <Text style={styles.confirmValue}>{verificationData?.meter_name}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Amount:</Text>
          <Text style={styles.confirmValue}>₦{parseFloat(amount).toLocaleString()}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Balance After:</Text>
          <Text style={styles.confirmValue}>₦{(walletBalance - parseFloat(amount)).toLocaleString()}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: primaryColor }]}
        onPress={handleConfirmPurchase}
      >
        <Text style={styles.confirmButtonText}>Proceed to Payment</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPinInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Transaction PIN</Text>
      
      <View style={styles.pinContainer}>
        <Text style={styles.pinLabel}>Enter your 4-digit transaction PIN to complete the purchase</Text>
        <View style={styles.pinInputContainer}>
          <TextInput
            style={styles.pinInput}
            placeholder="Enter PIN"
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

      <TouchableOpacity
        style={[
          styles.purchaseButton,
          { backgroundColor: primaryColor },
          (!transactionPin || transactionPin.length !== 4 || isProcessing) && styles.disabledButton
        ]}
        onPress={handleProcessPurchase}
        disabled={!transactionPin || transactionPin.length !== 4 || isProcessing}
      >
        <Text style={styles.purchaseButtonText}>
          {isProcessing ? 'Processing...' : 'Complete Purchase'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderResult = () => (
    <View style={styles.stepContainer}>
      {result?.success ? (
        <>
          <View style={[styles.resultIcon, { backgroundColor: '#10B981' }]}>
            <Check size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.resultTitle}>Purchase Successful!</Text>
          <Text style={styles.resultMessage}>{result.message}</Text>
          
          {result.data && (
            <View style={styles.receiptCard}>
              <Text style={styles.receiptTitle}>Electricity Token</Text>
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenLabel}>Token:</Text>
                <Text style={styles.tokenValue}>{result.data.token}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Units Purchased:</Text>
                <Text style={styles.receiptValue}>{result.data.purchased_units} kWh</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Amount:</Text>
                <Text style={styles.receiptValue}>₦{parseFloat(amount).toLocaleString()}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>New Balance:</Text>
                <Text style={styles.receiptValue}>₦{parseFloat(result.data.balance).toLocaleString()}</Text>
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
          <Text style={styles.resultMessage}>{result?.message}</Text>
        </>
      )}

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: primaryColor }]}
        onPress={handleDone}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Electricity Bill</Text>
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
        {currentStep === 'disco' && renderDiscoSelection()}
        {currentStep === 'meter' && renderMeterInput()}
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
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  selectedInfo: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  selectedText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
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
  verificationCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  verificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 12,
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  verificationLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  verificationValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
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
    marginBottom: 24,
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
  confirmCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
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
    flex: 1,
    textAlign: 'right',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pinInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
  },
  pinToggle: {
    padding: 8,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
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
  tokenContainer: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    marginBottom: 8,
  },
  tokenValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
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
    alignSelf: 'center',
    minWidth: 120,
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});