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
import { ArrowLeft, Eye, EyeOff, Shield, Check, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiService } from '@/services/api';

export default function ChangePin() {
  const { user, appSettings } = useAuth();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';

  const validatePin = (pin: string) => {
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

  const pinValidation = validatePin(newPin);

  const handleChangePin = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!pinValidation.isValid) {
      Alert.alert('Error', 'New PIN does not meet the requirements');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'New PINs do not match');
      return;
    }

    if (currentPin === newPin) {
      Alert.alert('Error', 'New PIN must be different from current PIN');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.changeTransactionPin({
        current_pin: currentPin,
        new_pin: newPin,
        new_pin_confirmation: confirmPin,
      });

      if (response.status) {
        setResult({
          success: true,
          message: response.message,
        });
      } else {
        setResult({
          success: false,
          message: response.message || 'PIN change failed',
        });
      }
      setShowResult(true);
    } catch (error: any) {
      console.error('PIN change error:', error);
      // Extract just the message from error response
      let errorMessage = 'Failed to change PIN. Please try again.';
      if (error.message) {
        // If the error message contains JSON, try to parse it
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If not JSON, use the message as is
          errorMessage = error.message;
        }
      }
      
      setResult({
        success: false,
        message: errorMessage,
      });
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDone = () => {
    if (result?.success) {
      // Reset form
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setShowResult(false);
      setResult(null);
      router.back();
    } else {
      setShowResult(false);
      setResult(null);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner 
          message="Loading..." 
          color={primaryColor} 
        />
      </SafeAreaView>
    );
  }

  if (showResult && result) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleDone} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PIN Change Result</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.resultContainer}>
          {result.success ? (
            <>
              <View style={[styles.resultIcon, { backgroundColor: '#10B981' }]}>
                <Check size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.resultTitle}>PIN Changed Successfully!</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
            </>
          ) : (
            <>
              <View style={[styles.resultIcon, { backgroundColor: '#EF4444' }]}>
                <X size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.resultTitle}>PIN Change Failed</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
            </>
          )}

          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: primaryColor }]}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>
              {result.success ? 'Done' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>Change Transaction PIN</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Shield size={48} color={primaryColor} />
            </View>

            <Text style={styles.title}>Change Your Transaction PIN</Text>
            <Text style={styles.subtitle}>
              Enter your current PIN and choose a new secure 4-digit PIN
            </Text>

            {/* Current PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current PIN</Text>
              <View style={styles.pinContainer}>
                <TextInput
                  style={styles.pinInput}
                  placeholder="Enter current PIN"
                  value={currentPin}
                  onChangeText={setCurrentPin}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={!showCurrentPin}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPin(!showCurrentPin)}
                >
                  {showCurrentPin ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* New PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New PIN</Text>
              <View style={styles.pinContainer}>
                <TextInput
                  style={styles.pinInput}
                  placeholder="Enter new PIN"
                  value={newPin}
                  onChangeText={setNewPin}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={!showNewPin}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPin(!showNewPin)}
                >
                  {showNewPin ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* PIN Requirements */}
            {newPin.length > 0 && (
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

            {/* Confirm PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New PIN</Text>
              <View style={styles.pinContainer}>
                <TextInput
                  style={styles.pinInput}
                  placeholder="Confirm new PIN"
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={!showConfirmPin}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPin(!showConfirmPin)}
                >
                  {showConfirmPin ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
              {confirmPin.length > 0 && newPin !== confirmPin && (
                <Text style={styles.errorText}>PINs do not match</Text>
              )}
            </View>

            {/* Change PIN Button */}
            <TouchableOpacity
              style={[
                styles.changeButton,
                { backgroundColor: primaryColor },
                (!currentPin || !newPin || !confirmPin || !pinValidation.isValid || newPin !== confirmPin || isProcessing) && styles.disabledButton
              ]}
              onPress={handleChangePin}
              disabled={!currentPin || !newPin || !confirmPin || !pinValidation.isValid || newPin !== confirmPin || isProcessing}
            >
              <Text style={styles.changeButtonText}>
                {isProcessing ? 'Changing PIN...' : 'Change PIN'}
              </Text>
            </TouchableOpacity>

            {/* Security Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Security Tips:</Text>
              <Text style={styles.tipText}>• Choose a PIN that's easy for you to remember but hard for others to guess</Text>
              <Text style={styles.tipText}>• Don't use your birth date or phone number</Text>
              <Text style={styles.tipText}>• Don't share your PIN with anyone</Text>
              <Text style={styles.tipText}>• Change your PIN regularly for better security</Text>
            </View>
          </View>
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
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
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
  pinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pinInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 8,
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
  changeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  disabledButton: {
    opacity: 0.5,
  },
  changeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  tipsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    marginBottom: 4,
    lineHeight: 20,
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
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