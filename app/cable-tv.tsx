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
import { ArrowLeft, Tv, Check, X, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DropdownSelect } from '@/components/DropdownSelect';
import { apiService } from '@/services/api';

interface CableTvProvider {
  id: string;
  name: string;
}

interface SubscriptionPlan {
  variation_code: string;
  name: string;
  variation_amount: string;
  fixedPrice: string;
}

interface SmartCardVerificationData {
  customer_name: string;
  status: string;
  due_date: string;
  cable_tv: string;
  customer_number: string;
  current_bouquet: string;
  current_bouquet_code: string;
  renewal_amount: string;
}

interface CableTvResult {
  success: boolean;
  message: string;
  data?: {
    balance: number;
    requestId: string;
  };
}

interface CableTvStep {
  step: 'provider' | 'card' | 'plan' | 'confirm' | 'pin' | 'result';
}

export default function CableTvSubscription() {
  const { user, appSettings, walletBalance, updateWalletBalance } = useAuth();
  const [currentStep, setCurrentStep] = useState<CableTvStep['step']>('provider');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [smartCardNumber, setSmartCardNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [verificationData, setVerificationData] = useState<SmartCardVerificationData | null>(null);
  const [result, setResult] = useState<CableTvResult | null>(null);

  // Get colors from API settings
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';

  const cableTvProviders: CableTvProvider[] = [
    { id: 'dstv', name: 'DSTV' },
    { id: 'gotv', name: 'GOtv' },
    { id: 'startimes', name: 'StarTimes' },
    { id: 'showmax', name: 'Showmax' },
  ];

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    setCurrentStep('card');
  };

  const handleSmartCardVerification = async () => {
    if (!smartCardNumber || smartCardNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid smart card number');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiService.verifySmartCard({
        cable_tv_type: selectedProvider,
        smart_card_number: smartCardNumber,
      });

      if (response.status && response.data) {
        setVerificationData(response.data);
        await loadSubscriptionPlans();
        setCurrentStep('plan');
      } else {
        Alert.alert('Error', 'Smart card verification failed. Please check the card number.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify smart card. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const loadSubscriptionPlans = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getCableTvSubscriptions(selectedProvider);
      if (response.status && response.data) {
        setSubscriptionPlans(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load subscription plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (planCode: string) => {
    setSelectedPlan(planCode);
    setCurrentStep('confirm');
  };

  const handleConfirmSubscription = () => {
    if (!phoneNumber || phoneNumber.length !== 11) {
      Alert.alert('Error', 'Please enter a valid 11-digit phone number');
      return;
    }

    const selectedPlanData = subscriptionPlans.find(p => p.variation_code === selectedPlan);
    const planAmount = selectedPlanData ? parseFloat(selectedPlanData.variation_amount) : 0;
    
    if (planAmount > walletBalance) {
      Alert.alert('Insufficient Funds', `You cannot subscribe to this plan. Your available balance is ₦${walletBalance.toLocaleString()}`);
      return;
    }

    setCurrentStep('pin');
  };

  const handleProcessSubscription = async () => {
    if (!transactionPin || transactionPin.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit PIN');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.subscribeCableTv({
        cable_tv_type: selectedProvider,
        smart_card_number: smartCardNumber,
        subscription_plan: selectedPlan,
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
          message: response.message || 'Cable TV subscription failed',
        });
      }
      setCurrentStep('result');
    } catch (error: any) {
      console.error('Cable TV subscription error:', error);
      setResult({
        success: false,
        message: error.message || 'Failed to subscribe to cable TV. Please try again.',
      });
      setCurrentStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackPress = () => {
    switch (currentStep) {
      case 'provider':
        router.back();
        break;
      case 'card':
        setCurrentStep('provider');
        break;
      case 'plan':
        setCurrentStep('card');
        break;
      case 'confirm':
        setCurrentStep('plan');
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

  const selectedProviderData = cableTvProviders.find(p => p.id === selectedProvider);
  const selectedPlanData = subscriptionPlans.find(p => p.variation_code === selectedPlan);

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

  const renderProviderSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Cable TV Provider</Text>
      
      <DropdownSelect
        options={cableTvProviders}
        selectedValue={selectedProvider}
        onSelect={handleProviderSelect}
        placeholder="Choose cable TV provider"
        label="Cable TV Provider"
      />
    </View>
  );

  const renderSmartCardInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Smart Card Details</Text>
      
      <View style={styles.selectedInfo}>
        <Text style={styles.selectedText}>{selectedProviderData?.name}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Smart Card Number</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter smart card number"
          value={smartCardNumber}
          onChangeText={setSmartCardNumber}
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.verifyButton,
          { backgroundColor: primaryColor },
          (!smartCardNumber || isVerifying) && styles.disabledButton
        ]}
        onPress={handleSmartCardVerification}
        disabled={!smartCardNumber || isVerifying}
      >
        <Text style={styles.verifyButtonText}>
          {isVerifying ? 'Verifying...' : 'Verify Smart Card'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlanSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Subscription Plan</Text>
      
      {verificationData && (
        <View style={styles.verificationCard}>
          <Text style={styles.verificationTitle}>Smart Card Verified ✓</Text>
          <View style={styles.verificationRow}>
            <Text style={styles.verificationLabel}>Customer Name:</Text>
            <Text style={styles.verificationValue}>{verificationData.customer_name}</Text>
          </View>
          <View style={styles.verificationRow}>
            <Text style={styles.verificationLabel}>Status:</Text>
            <Text style={styles.verificationValue}>{verificationData.status}</Text>
          </View>
          <View style={styles.verificationRow}>
            <Text style={styles.verificationLabel}>Due Date:</Text>
            <Text style={styles.verificationValue}>{verificationData.due_date}</Text>
          </View>
          {verificationData.current_bouquet && (
            <View style={styles.verificationRow}>
              <Text style={styles.verificationLabel}>Current Bouquet:</Text>
              <Text style={styles.verificationValue}>{verificationData.current_bouquet}</Text>
            </View>
          )}
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading plans..." color="#FFFFFF" />
      ) : (
        <ScrollView style={styles.plansList} showsVerticalScrollIndicator={false}>
          {subscriptionPlans.map((plan) => {
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

  const renderConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Subscription</Text>
      
      <View style={styles.confirmCard}>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Provider:</Text>
          <Text style={styles.confirmValue}>{selectedProviderData?.name}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Smart Card:</Text>
          <Text style={styles.confirmValue}>{smartCardNumber}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Customer Name:</Text>
          <Text style={styles.confirmValue}>{verificationData?.customer_name}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Plan:</Text>
          <Text style={styles.confirmValue}>{selectedPlanData?.name}</Text>
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

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
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

      <TouchableOpacity
        style={[
          styles.confirmButton,
          { backgroundColor: primaryColor },
          !phoneNumber && styles.disabledButton
        ]}
        onPress={handleConfirmSubscription}
        disabled={!phoneNumber}
      >
        <Text style={styles.confirmButtonText}>Proceed to Payment</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPinInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Transaction PIN</Text>
      
      <View style={styles.pinContainer}>
        <Text style={styles.pinLabel}>Enter your 4-digit transaction PIN to complete the subscription</Text>
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
          styles.subscribeButton,
          { backgroundColor: primaryColor },
          (!transactionPin || transactionPin.length !== 4 || isProcessing) && styles.disabledButton
        ]}
        onPress={handleProcessSubscription}
        disabled={!transactionPin || transactionPin.length !== 4 || isProcessing}
      >
        <Text style={styles.subscribeButtonText}>
          {isProcessing ? 'Processing...' : 'Complete Subscription'}
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
          <Text style={styles.resultTitle}>Subscription Successful!</Text>
          <Text style={styles.resultMessage}>{result.message}</Text>
          
          {result.data && (
            <View style={styles.receiptCard}>
              <Text style={styles.receiptTitle}>Subscription Receipt</Text>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Provider:</Text>
                <Text style={styles.receiptValue}>{selectedProviderData?.name}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Smart Card:</Text>
                <Text style={styles.receiptValue}>{smartCardNumber}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Plan:</Text>
                <Text style={styles.receiptValue}>{selectedPlanData?.name}</Text>
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
          <Text style={styles.resultTitle}>Subscription Failed</Text>
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
        <Text style={styles.headerTitle}>Cable TV</Text>
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
        {currentStep === 'provider' && renderProviderSelection()}
        {currentStep === 'card' && renderSmartCardInput()}
        {currentStep === 'plan' && renderPlanSelection()}
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
  plansList: {
    flex: 1,
    maxHeight: 400,
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
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planAmount: {
    fontSize: 18,
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
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
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