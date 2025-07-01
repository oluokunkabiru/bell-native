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
import { Shield, Eye, EyeOff } from 'lucide-react-native';
import { storageService } from '@/services/storage';

interface PinLoginProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (credentials: { username: string; password: string }) => void;
  primaryColor: string;
}

interface StoredCredentials {
  username: string;
  encryptedPassword: string;
  timestamp: number;
}

export function PinLogin({ visible, onClose, onSuccess, primaryColor }: PinLoginProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Simple encryption for demo purposes
  const decryptPassword = (encryptedPassword: string): string => {
    return Buffer.from(encryptedPassword, 'base64').toString();
  };

  const verifyLoginPin = async (inputPin: string): Promise<boolean> => {
    try {
      const storedPin = await storageService.getItem<string>('login_pin');
      if (!storedPin) return false;
      
      const decryptedPin = decryptPassword(storedPin);
      return inputPin === decryptedPin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  };

  const getStoredCredentials = async (): Promise<StoredCredentials | null> => {
    try {
      const credentials = await storageService.getItem<StoredCredentials>('stored_credentials');
      if (!credentials) return null;

      // Check if credentials are older than 30 days
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - credentials.timestamp > thirtyDaysInMs) {
        await storageService.removeItem('stored_credentials');
        return null;
      }

      return credentials;
    } catch (error) {
      console.error('Error getting stored credentials:', error);
      return null;
    }
  };

  const handlePinAuth = async () => {
    if (pin.length !== 6) {
      Alert.alert('Invalid PIN', 'Please enter a 6-digit PIN');
      return;
    }

    setIsAuthenticating(true);
    
    try {
      const isValid = await verifyLoginPin(pin);
      
      if (isValid) {
        const credentials = await getStoredCredentials();
        if (credentials) {
          onSuccess({
            username: credentials.username,
            password: decryptPassword(credentials.encryptedPassword),
          });
        } else {
          Alert.alert('Error', 'No stored credentials found');
        }
      } else {
        Alert.alert('Invalid PIN', 'Please check your PIN and try again');
        setPin('');
      }
    } catch (error) {
      Alert.alert('Error', 'PIN verification failed');
    } finally {
      setIsAuthenticating(false);
    }
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
          <Text style={styles.title}>Quick Sign In</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Shield size={64} color={primaryColor} />
          </View>

          <Text style={styles.subtitle}>
            Enter your 6-digit PIN to sign in
          </Text>

          <View style={styles.pinInputContainer}>
            <TextInput
              style={styles.pinInput}
              placeholder="Enter 6-digit PIN"
              value={pin}
              onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry={!showPin}
              placeholderTextColor="#9CA3AF"
              autoFocus
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

          <TouchableOpacity
            style={[
              styles.authButton,
              { backgroundColor: primaryColor },
              (pin.length !== 6 || isAuthenticating) && styles.disabledButton
            ]}
            onPress={handlePinAuth}
            disabled={pin.length !== 6 || isAuthenticating}
          >
            <Text style={styles.authButtonText}>
              {isAuthenticating ? 'Verifying...' : 'Sign In'}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#CCCCCC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  pinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 32,
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
  eyeButton: {
    padding: 4,
  },
  authButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
});