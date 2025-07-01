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
import { ArrowLeft, Mail, Eye, EyeOff, Check, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface ForgotPasswordStep {
  step: 'email' | 'reset' | 'result';
}

export default function ForgotPasswordScreen() {
  const { appSettings } = useAuth();
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep['step']>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const passwordValidation = validatePassword(password);

  const handleRequestToken = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.makeRequest('/password/request-token', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.status) {
        Alert.alert('Success', 'Password reset token has been sent to your email');
        setCurrentStep('reset');
      } else {
        Alert.alert('Error', response.message || 'Failed to send reset token');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset token. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!passwordValidation.isValid) {
      Alert.alert('Error', 'Password does not meet the requirements');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.makeRequest('/password/reset', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          token: token.trim(),
          password,
          password_confirmation: confirmPassword,
        }),
      });

      if (response.status) {
        setResult({
          success: true,
          message: response.message,
        });
      } else {
        setResult({
          success: false,
          message: response.message || 'Password reset failed',
        });
      }
      setCurrentStep('result');
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Password reset failed. Please try again.',
      });
      setCurrentStep('result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    switch (currentStep) {
      case 'email':
        router.back();
        break;
      case 'reset':
        setCurrentStep('email');
        break;
      case 'result':
        router.replace('/login');
        break;
    }
  };

  const renderEmailStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Mail size={48} color={primaryColor} />
      </View>

      <Text style={styles.stepTitle}>Forgot Password?</Text>
      <Text style={styles.stepSubtitle}>
        Enter your email address and we'll send you a reset token
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: primaryColor },
          (!email.trim() || isLoading) && styles.disabledButton
        ]}
        onPress={handleRequestToken}
        disabled={!email.trim() || isLoading}
      >
        <Text style={styles.actionButtonText}>
          {isLoading ? 'Sending...' : 'Send Reset Token'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderResetStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Reset Password</Text>
      <Text style={styles.stepSubtitle}>
        Enter the token from your email and your new password
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Reset Token</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter reset token from email"
          value={token}
          onChangeText={setToken}
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>New Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter new password"
            value={password}
            onChangeText={setPassword}
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
      </View>

      {/* Password Requirements */}
      {password.length > 0 && (
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

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm New Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color="#9CA3AF" />
            ) : (
              <Eye size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: primaryColor },
          (!token || !password || !confirmPassword || !passwordValidation.isValid || password !== confirmPassword || isLoading) && styles.disabledButton
        ]}
        onPress={handleResetPassword}
        disabled={!token || !password || !confirmPassword || !passwordValidation.isValid || password !== confirmPassword || isLoading}
      >
        <Text style={styles.actionButtonText}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
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
          <Text style={styles.resultTitle}>Password Reset Successful!</Text>
          <Text style={styles.resultMessage}>{result.message}</Text>
          <Text style={styles.resultSubtext}>
            You can now login with your new password
          </Text>
        </>
      ) : (
        <>
          <View style={[styles.resultIcon, { backgroundColor: '#EF4444' }]}>
            <X size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.resultTitle}>Password Reset Failed</Text>
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
        <Text style={styles.headerTitle}>Reset Password</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {currentStep === 'email' && renderEmailStep()}
          {currentStep === 'reset' && renderResetStep()}
          {currentStep === 'result' && renderResult()}
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
  placeholder: {
    width: 40,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
    marginTop: -16,
    marginBottom: 24,
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
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
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