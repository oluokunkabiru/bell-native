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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Mail, Phone, Eye, EyeOff, Check, X, MapPin, Lock, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface VerificationData {
  first_name: string;
  last_name: string;
  middle_name: string;
  phone_number1: string;
  phone_number2: string;
  date_of_birth: string;
  gender: string;
  nin?: string;
  bvn?: string;
  photo: string;
}

interface RegistrationStep {
  step: 'method' | 'verify' | 'details' | 'result';
}

export default function RegisterScreen() {
  const { appSettings } = useAuth();
  const [currentStep, setCurrentStep] = useState<RegistrationStep['step']>('method');
  const [selectedMethod, setSelectedMethod] = useState<'nin' | 'bvn' | ''>('');
  const [idValue, setIdValue] = useState('');
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    username: '',
    telephone: '',
    gender: 'male' as 'male' | 'female',
    physical_address: '',
    password: '',
    transaction_pin: '',
  });

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showTransactionPin, setShowTransactionPin] = useState(false);

  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    };
  };

  const validateTransactionPin = (pin: string) => {
    const isNumeric = /^\d+$/.test(pin);
    const isCorrectLength = pin.length === 4;
    const isNotSequential = !/(0123|1234|2345|3456|4567|5678|6789)/.test(pin);
    const isNotRepeating = !/^(\d)\1{3}$/.test(pin);

    return {
      isNumeric,
      isCorrectLength,
      isNotSequential,
      isNotRepeating,
      isValid: isNumeric && isCorrectLength && isNotSequential && isNotRepeating,
    };
  };

  const passwordValidation = validatePassword(formData.password);
  const pinValidation = validateTransactionPin(formData.transaction_pin);

  const handleMethodSelect = (method: 'nin' | 'bvn') => {
    setSelectedMethod(method);
    setCurrentStep('verify');
  };

  const handleVerification = async () => {
    if (!idValue || idValue.length < 10) {
      Alert.alert('Error', `Please enter a valid ${selectedMethod.toUpperCase()}`);
      return;
    }

    setIsVerifying(true);
    try {
      const endpoint = selectedMethod === 'nin' ? `/verify/nin/${idValue}` : `/verify/bvn/${idValue}`;
      const response = await apiService.makeRequest(endpoint);

      if (response.status && response.data) {
        const data = response.data;
        setVerificationData(data);
        
        // Pre-fill form with verified data
        setFormData(prev => ({
          ...prev,
          first_name: data.first_name || '',
          middle_name: data.middle_name || '',
          last_name: data.last_name || '',
          telephone: data.phone_number1 || '',
          gender: data.gender?.toLowerCase() === 'female' ? 'female' : 'male',
        }));
        
        setCurrentStep('details');
      } else {
        Alert.alert('Error', 'Verification failed. Please check your details and try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegistration = async () => {
    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.username || !formData.telephone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!formData.physical_address.trim()) {
      Alert.alert('Error', 'Please enter your physical address');
      return;
    }

    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (!passwordValidation.isValid) {
      Alert.alert('Error', 'Password does not meet the requirements');
      return;
    }

    if (!formData.transaction_pin.trim()) {
      Alert.alert('Error', 'Please enter a transaction PIN');
      return;
    }

    if (!pinValidation.isValid) {
      Alert.alert('Error', 'Transaction PIN does not meet the requirements');
      return;
    }

    if (formData.telephone.length !== 11) {
      Alert.alert('Error', 'Please enter a valid 11-digit phone number');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsRegistering(true);
    try {
      const registrationData = {
        id_type: selectedMethod,
        id_value: idValue,
        first_name: formData.first_name,
        middle_name: formData.middle_name || '',
        last_name: formData.last_name,
        email: formData.email,
        username: formData.username,
        telephone: formData.telephone,
        gender: formData.gender,
        physical_address: formData.physical_address,
        password: formData.password,
        transaction_pin: parseInt(formData.transaction_pin),
      };

      const response = await apiService.makeRequest('/customers-api/registrations/with-kyc', {
        method: 'POST',
        body: JSON.stringify(registrationData),
      });

      if (response.status) {
        setResult({
          success: true,
          message: response.message,
        });
      } else {
        setResult({
          success: false,
          message: response.message || 'Registration failed',
        });
      }
      setShowResult(true);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Registration failed. Please try again.',
      });
      setShowResult(true);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleBackPress = () => {
    switch (currentStep) {
      case 'method':
        router.back();
        break;
      case 'verify':
        setCurrentStep('method');
        break;
      case 'details':
        setCurrentStep('verify');
        break;
      case 'result':
        router.replace('/login');
        break;
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose Verification Method</Text>
      <Text style={styles.stepSubtitle}>
        Select how you'd like to verify your identity
      </Text>

      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === 'nin' && { borderColor: primaryColor }]}
        onPress={() => handleMethodSelect('nin')}
      >
        <View style={styles.methodIcon}>
          <User size={24} color={primaryColor} />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodTitle}>National ID Number (NIN)</Text>
          <Text style={styles.methodDescription}>
            Verify using your 11-digit National Identification Number
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === 'bvn' && { borderColor: primaryColor }]}
        onPress={() => handleMethodSelect('bvn')}
      >
        <View style={styles.methodIcon}>
          <User size={24} color={primaryColor} />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodTitle}>Bank Verification Number (BVN)</Text>
          <Text style={styles.methodDescription}>
            Verify using your 11-digit Bank Verification Number
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderVerification = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Your {selectedMethod.toUpperCase()}</Text>
      <Text style={styles.stepSubtitle}>
        Enter your {selectedMethod === 'nin' ? 'National ID Number' : 'Bank Verification Number'}
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{selectedMethod.toUpperCase()}</Text>
        <TextInput
          style={styles.textInput}
          placeholder={`Enter your ${selectedMethod.toUpperCase()}`}
          value={idValue}
          onChangeText={setIdValue}
          keyboardType="numeric"
          maxLength={11}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.verifyButton,
          { backgroundColor: primaryColor },
          (!idValue || isVerifying) && styles.disabledButton
        ]}
        onPress={handleVerification}
        disabled={!idValue || isVerifying}
      >
        <Text style={styles.verifyButtonText}>
          {isVerifying ? 'Verifying...' : 'Verify Identity'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetails = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Complete Your Registration</Text>
      <Text style={styles.stepSubtitle}>
        Fill in the remaining details to create your account
      </Text>

      {verificationData && (
        <View style={styles.verifiedCard}>
          <Text style={styles.verifiedTitle}>✓ Identity Verified</Text>
          <Text style={styles.verifiedText}>
            {verificationData.first_name} {verificationData.last_name}
          </Text>
          <Text style={styles.verifiedSubtext}>
            {verificationData.phone_number1?.substring(0, 3)}****{verificationData.phone_number1?.substring(7)}
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>First Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter first name"
            value={formData.first_name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Middle Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter middle name (optional)"
            value={formData.middle_name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, middle_name: text }))}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Last Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter last name"
            value={formData.last_name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter email address"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Username *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Choose a username"
            value={formData.username}
            onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter phone number"
            value={formData.telephone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, telephone: text }))}
            keyboardType="phone-pad"
            maxLength={11}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Physical Address *</Text>
          <TextInput
            style={[styles.textInput, styles.addressInput]}
            placeholder="Enter your physical address"
            value={formData.physical_address}
            onChangeText={(text) => setFormData(prev => ({ ...prev, physical_address: text }))}
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              secureTextEntry={!showPassword}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#9CA3AF" />
              ) : (
                <Eye size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Password Requirements */}
          {formData.password.length > 0 && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: passwordValidation.minLength ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: passwordValidation.minLength ? '#10B981' : '#EF4444' }
                  ]}>
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: passwordValidation.hasUpperCase ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: passwordValidation.hasUpperCase ? '#10B981' : '#EF4444' }
                  ]}>
                    One uppercase letter
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: passwordValidation.hasLowerCase ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: passwordValidation.hasLowerCase ? '#10B981' : '#EF4444' }
                  ]}>
                    One lowercase letter
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: passwordValidation.hasNumbers ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: passwordValidation.hasNumbers ? '#10B981' : '#EF4444' }
                  ]}>
                    One number
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: passwordValidation.hasSpecialChar ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: passwordValidation.hasSpecialChar ? '#10B981' : '#EF4444' }
                  ]}>
                    One special character
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Transaction PIN *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter 4-digit PIN"
              value={formData.transaction_pin}
              onChangeText={(text) => setFormData(prev => ({ ...prev, transaction_pin: text.replace(/[^0-9]/g, '').slice(0, 4) }))}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={!showTransactionPin}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowTransactionPin(!showTransactionPin)}
            >
              {showTransactionPin ? (
                <EyeOff size={20} color="#9CA3AF" />
              ) : (
                <Eye size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>
          
          {/* PIN Requirements */}
          {formData.transaction_pin.length > 0 && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>PIN Requirements:</Text>
              <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: pinValidation.isCorrectLength ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: pinValidation.isCorrectLength ? '#10B981' : '#EF4444' }
                  ]}>
                    Exactly 4 digits
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: pinValidation.isNumeric ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: pinValidation.isNumeric ? '#10B981' : '#EF4444' }
                  ]}>
                    Numbers only
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: pinValidation.isNotSequential ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: pinValidation.isNotSequential ? '#10B981' : '#EF4444' }
                  ]}>
                    Not sequential (e.g., 1234)
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: pinValidation.isNotRepeating ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: pinValidation.isNotRepeating ? '#10B981' : '#EF4444' }
                  ]}>
                    Not repeating (e.g., 1111)
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Gender *</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'male' && { backgroundColor: primaryColor }
              ]}
              onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
            >
              <Text style={[
                styles.genderText,
                formData.gender === 'male' && styles.selectedGenderText
              ]}>
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'female' && { backgroundColor: primaryColor }
              ]}
              onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
            >
              <Text style={[
                styles.genderText,
                formData.gender === 'female' && styles.selectedGenderText
              ]}>
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            { backgroundColor: primaryColor },
            (!passwordValidation.isValid || !pinValidation.isValid || isRegistering) && styles.disabledButton
          ]}
          onPress={handleRegistration}
          disabled={!passwordValidation.isValid || !pinValidation.isValid || isRegistering}
        >
          <Text style={styles.registerButtonText}>
            {isRegistering ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderResult = () => (
    <View style={styles.stepContainer}>
      {result?.success ? (
        <>
          <View style={[styles.resultIcon, { backgroundColor: '#10B981' }]}>
            <Check size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.resultTitle}>Registration Successful!</Text>
          <Text style={styles.resultMessage}>{result.message}</Text>
          <Text style={styles.resultSubtext}>
            You can now login with your credentials.
          </Text>
        </>
      ) : (
        <>
          <View style={[styles.resultIcon, { backgroundColor: '#EF4444' }]}>
            <X size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.resultTitle}>Registration Failed</Text>
          <Text style={styles.resultMessage}>{result?.message}</Text>
        </>
      )}

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: primaryColor }]}
        onPress={() => router.replace('/login')}
      >
        <Text style={styles.doneButtonText}>
          {result?.success ? 'Go to Login' : 'Try Again'}
        </Text>
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
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {currentStep === 'method' && renderMethodSelection()}
        {currentStep === 'verify' && renderVerification()}
        {currentStep === 'details' && renderDetails()}
        {showResult && renderResult()}
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
  placeholder: {
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
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  methodCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    lineHeight: 20,
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
  addressInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  eyeButton: {
    padding: 4,
  },
  requirementsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  requirementText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  verifyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  verifyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  verifiedCard: {
    backgroundColor: '#0F2A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  verifiedTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  verifiedSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  genderText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  selectedGenderText: {
    color: '#FFFFFF',
  },
  registerButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  registerButtonText: {
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
    marginBottom: 16,
  },
  resultSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
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