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
import { ArrowLeft, Wifi, Check, X, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DropdownSelect } from '@/components/DropdownSelect';
import { apiService } from '@/services/api';

interface NetworkProvider {
  id: string;
  name: string;
  code: string;
  color: string;
  logo: string;
}

interface DataBundle {
  variation_code: string;
  name: string;
  variation_amount: string;
  fixedPrice: string;
}

interface DataBundleResult {
  success: boolean;
  message: string;
  data?: {
    balance: number;
    requestId: string;
  };
}

interface DataBundleStep {
  step: 'network' | 'plan' | 'phone' | 'confirm' | 'pin' | 'result';
}

export default function DataBundlePurchase() {
  const { user, appSettings, walletBalance, updateWalletBalance } = useAuth();
  const [currentStep, setCurrentStep] = useState<DataBundleStep['step']>('network');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [dataBundles, setDataBundles] = useState<DataBundle[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DataBundleResult | null>(null);

  // Get colors from API settings
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';

  const networkProviders: NetworkProvider[] = [
    { id: 'mtn-data', name: 'MTN Data', code: 'mtn-data', color: '#FFCC00', logo: '📱' },
    { id: 'airtel-data', name: 'Airtel Data', code: 'airtel-data', color: '#FF0000', logo: '📶' },
    { id: 'glo-data', name: 'Glo Data', code: 'glo-data', color: '#00B04F', logo: '🌐' },
    { id: '9mobile-data', name: '9Mobile Data', code: '9mobile-data', color: '#00A651', logo: '📡' },
  ];

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetwork(networkId);
    setCurrentStep('plan');
    loadDataBundles(networkId);
  };

  const loadDataBundles = async (networkProvider: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.getDataBundles(networkProvider);
      if (response.status && response.data) {
        setDataBundles(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data bundles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (planCode: string) => {
    setSelectedPlan(planCode);
    setCurrentStep('phone');
  };

  const handlePhoneSubmit = () => {
    if (!phoneNumber || phoneNumber.length !== 11) {
      Alert.alert('Error', 'Please enter a valid 11-digit phone number');
      return;
    }
    setCurrentStep('confirm');
  };

  const handleConfirmPurchase = () => {
    const selectedPlanData = dataBundles.find(p => p.variation_code === selectedPlan);
    const planAmount = selectedPlanData ? parseFloat(selectedPlanData.variation_amount) : 0;
    
    if (planAmount > walletBalance) {
      Alert.alert('Insufficient Funds', `You cannot purchase this data bundle. Your available balance is ₦${walletBalance.toLocaleString()}`);
      return;
    }
    
    setCurrentStep('pin');
  };

  const handleProcessPurchase = async () => {
    if (!transactionPin || transactionPin.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit PIN');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.buyDataBundle({
        network_provider: selectedNetwork,
        data_plan: selectedPlan,
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
          message: response.message || 'Data bundle purchase failed',
        });
      }
      setCurrentStep('result');
    } catch (error: any) {
      console.error('Data bundle purchase error:', error);
      setResult({
        success: false,
        message: error.message || 'Failed to purchase data bundle. Please try again.',
      });
      setCurrentStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackPress = () => {
    switch (currentStep) {
      case 'network':
        router.back();
        break;
      case 'plan':
        setCurrentStep('network');
        break;
      case 'phone':
        setCurrentStep('plan');
        break;
      case 'confirm':
        setCurrentStep('phone');
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

  const selectedNetworkData = networkProviders.find(n => n.code === selectedNetwork);
  const selectedPlanData = dataBundles.find(p => p.variation_code === selectedPlan);

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

  const renderNetworkSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Network Provider</Text>
      
      <DropdownSelect
        options={networkProviders}
        selectedValue={selectedNetwork}
        onSelect={handleNetworkSelect}
        placeholder="Choose network provider"
        label="Network Provider"
      />
    </View>
  );

  const renderPlanSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Data Plan</Text>
      
      <View style={styles.selectedInfo}>
        <Text style={styles.selectedText}>{selectedNetworkData?.name}</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading data plans..." color="#FFFFFF" />
      ) : (
        <ScrollView style={styles.plansList} showsVerticalScrollIndicator={false}>
          {dataBundles.map((plan) => {
            const planAmount = parseFloat(plan.variation_amount);
            const canAfford = planAmount <= walletBalance;
            
            return (
              <TouchableOpacity
                key={plan.variation_code}
                style={[
                  styles.planCard,
                  !canAfford && styles.disabledPlanCard,
                  selectedPlan === plan.variation_code && [
                    styles.selectedPlanCard,
                    { borderColor: primaryColor }
                  ]
                ]}
                onPress={() => canAfford && handlePlanSelect(plan.variation_code)}
                disabled={!canAfford}
              >
                <View style={styles.planInfo}>
                  <Text style={[styles.planName, !canAfford && styles.disabledText]}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.planAmount, !canAfford && styles.disabledText]}>
                    ₦{planAmount.toLocaleString()}
                  </Text>
                  {!canAfford && (
                    <Text style={styles.insufficientText}>Insufficient balance</Text>
                  )}
                </View>
                {selectedPlan === plan.variation_code && canAfford && (
                  <Check size={20} color={primaryColor} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderPhoneInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Phone Number</Text>
      
      <View style={styles.selectedInfo}>
        <Text style={styles.selectedText}>
          {selectedNetworkData?.name} - {selectedPlanData?.name}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={styles.inputContainer}>
          <Wifi size={20} color="#9CA3AF" />
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

      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: primaryColor },
          !phoneNumber && styles.disabledButton
        ]}
        onPress={handlePhoneSubmit}
        disabled={!phoneNumber}
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
          <Text style={styles.confirmLabel}>Network:</Text>
          <Text style={styles.confirmValue}>{selectedNetworkData?.name}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Data Plan:</Text>
          <Text style={styles.confirmValue}>{selectedPlanData?.name}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Phone Number:</Text>
          <Text style={styles.confirmValue}>{phoneNumber}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Amount:</Text>
          <Text style={styles.confirmValue}>
            ₦{selectedPlanData ? parseFloat(selectedPlanData.variation_amount).toLocaleString() : '0'}
          </Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Balance After:</Text>
          <Text style={styles.confirmValue}>
            ₦{selectedPlanData ? (walletBalance - parseFloat(selectedPlanData.variation_amount)).toLocaleString() : walletBalance.toLocaleString()}
          </Text>
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
              <Text style={styles.receiptTitle}>Data Bundle Receipt</Text>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Network:</Text>
                <Text style={styles.receiptValue}>{selectedNetworkData?.name}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Data Plan:</Text>
                <Text style={styles.receiptValue}>{selectedPlanData?.name}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Phone Number:</Text>
                <Text style={styles.receiptValue}>{phoneNumber}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Amount:</Text>
                <Text style={styles.receiptValue}>
                  ₦{selectedPlanData ? parseFloat(selectedPlanData.variation_amount).toLocaleString() : '0'}
                </Text>
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
        <Text style={styles.headerTitle}>Buy Data</Text>
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
        {currentStep === 'network' && renderNetworkSelection()}
        {currentStep === 'plan' && renderPlanSelection()}
        {currentStep === 'phone' && renderPhoneInput()}
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
  plansList: {
    flex: 1,
    maxHeight: 500,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  disabledPlanCard: {
    opacity: 0.5,
    backgroundColor: '#0F0F0F',
  },
  selectedPlanCard: {
    borderWidth: 2,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#666666',
  },
  insufficientText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    marginTop: 4,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  textInput: {
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
  disabledButton: {
    opacity: 0.5,
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