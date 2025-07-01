import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Eye, EyeOff, X } from 'lucide-react-native';
import { storageService } from '@/services/storage';

interface PinSetupProps {
  visible: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
  primaryColor: string;
  username: string;
  password: string;
}

interface StoredCredentials {
  username: string;
  encryptedPassword: string;
  timestamp: number;
}

export function PinSetup({ 
  visible, 
  onClose, 
  onSetupComplete, 
  primaryColor, 
  username, 
  password 
}: PinSetupProps) {
  const [loginPin, setLoginPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Simple encryption for demo purposes
  const encryptPassword = (password: string): string => {
    return Buffer.from(password).toString('base64');
  };

  const validatePin = () => {
    if (loginPin.length !== 6) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 6 digits');
      return false;
    }
    
    if (!/^\d{6}$/.test(loginPin)) {
      Alert.alert('Invalid PIN', 'PIN must contain only numbers');
      return false;
    }
    
    if (loginPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match');
      return false;
    }
    
    return true;
  };

  const handleSetupComplete = async () => {
    if (!validatePin()) return;

    setIsSettingUp(true);
    
    try {
      // Store the PIN
      const encryptedPin = encryptPassword(loginPin);
      await storageService.setItem('login_pin', encryptedPin);
      await storageService.setItem('pin_enabled', true);
      
      // Store credentials only if we have a password
      if (password) {
        const credentials: StoredCredentials = {
          username,
          encryptedPassword: encryptPassword(password),
          timestamp: Date.now(),
        };
        await storageService.setItem('stored_credentials', credentials);
      }
      
      // Clear form
      setLoginPin('');
      setConfirmPin('');
      
      // Show success message
      Alert.alert('Success', 'PIN setup completed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Call completion handler after user acknowledges
            onSetupComplete();
          }
        }
      ]);
      
    } catch (error) {
      Alert.alert('Setup Failed', 'Could not complete setup. Please try again.');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleSkip = () => {
    // Clear form
    setLoginPin('');
    setConfirmPin('');
    
    // Call completion handler
    onSetupComplete();
  };

  const canComplete = () => {
    return loginPin.length === 6 && loginPin === confirmPin && !isSettingUp;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Security Setup</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Shield size={48} color={primaryColor} />
          </View>

          <Text style={styles.subtitle}>
            Set up a 6-digit PIN for quick and secure access to your account
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Create 6-Digit PIN</Text>
            <View style={styles.pinInputContainer}>
              <TextInput
                style={styles.pinInput}
                placeholder="Enter 6-digit PIN"
                value={loginPin}
                onChangeText={(text) => setLoginPin(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry={!showPin}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.eyeButton}
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm PIN</Text>
            <View style={styles.pinInputContainer}>
              <TextInput
                style={styles.pinInput}
                placeholder="Confirm 6-digit PIN"
                value={confirmPin}
                onChangeText={(text) => setConfirmPin(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="numeric"
                maxLength={6}
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
          </View>

          {loginPin.length > 0 && confirmPin.length > 0 && loginPin !== confirmPin && (
            <Text style={styles.errorText}>PINs do not match</Text>
          )}

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Text style={styles.securityNoteTitle}>Security Note</Text>
            <Text style={styles.securityNoteText}>
              • Your credentials are stored securely on this device only{'\n'}
              • You can disable this feature anytime in settings{'\n'}
              • Your account will auto-logout after 5 minutes of inactivity
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.completeButton,
              { backgroundColor: primaryColor },
              !canComplete() && styles.disabledButton
            ]}
            onPress={handleSetupComplete}
            disabled={!canComplete()}
          >
            <Text style={styles.completeButtonText}>
              {isSettingUp ? 'Setting Up...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  pinInputContainer: {
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
    letterSpacing: 4,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    marginTop: 8,
    textAlign: 'center',
  },
  securityNote: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  securityNoteTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
    marginBottom: 8,
  },
  securityNoteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  completeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
});