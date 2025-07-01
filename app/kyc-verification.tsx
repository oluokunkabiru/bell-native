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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Check, X, Shield, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

interface KycVerification {
  id: string;
  documentIDNo: string;
  documentType: string;
  image_url: string | null;
  imageEncoding: string;
  entityData: {
    first_name: string;
    last_name: string;
    middle_name: string;
    phone_number?: string;
    phone_number1?: string;
    date_of_birth: string;
    gender: string;
    nin?: string;
    bvn?: string;
  };
}

export default function KycVerificationScreen() {
  const { user, appSettings } = useAuth();
  const [kycVerifications, setKycVerifications] = useState<KycVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idType, setIdType] = useState<'bvn' | 'nin'>('bvn');
  const [idValue, setIdValue] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'complete' | 'incomplete'>('incomplete');

  const primaryColor = appSettings?.['customized-app-primary-color'] || '#4361ee';

  useEffect(() => {
    loadKycVerifications();
  }, []);

  const loadKycVerifications = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        // Mock data
        const mockResponse = {
          data: [
            {
              id: "a1c12b2a-1d1f-474d-bd43-409b40d1f201",
              documentIDNo: "22416882531",
              documentType: "BVN",
              image_url: null,
              imageEncoding: "",
              entityData: {
                first_name: "APOLLOS",
                last_name: "GEOFREY",
                middle_name: "DOGARA",
                gender: "Male",
                date_of_birth: "1998-09-11",
                phone_number1: "08095635395",
                bvn: "22416882531"
              }
            },
            {
              id: "50010d46-b9bb-4b67-8274-793ede524d3a",
              documentIDNo: "33332071173",
              documentType: "NIN",
              image_url: null,
              imageEncoding: "",
              entityData: {
                first_name: "APOLLOS",
                last_name: "GEOFREY",
                middle_name: "",
                phone_number: "08095635395",
                date_of_birth: "1998-09-11",
                gender: "Male",
                nin: "33332071173"
              }
            }
          ],
          first_page_url: "http://localhost:8000/api/v1/customers/kyc-verifications?page=1",
          from: 1,
          last_page: 1,
          last_page_url: "http://localhost:8000/api/v1/customers/kyc-verifications?page=1",
          links: [
            {
              url: null,
              label: "&laquo; Previous",
              active: false
            },
            {
              url: "http://localhost:8000/api/v1/customers/kyc-verifications?page=1",
              label: "1",
              active: true
            },
            {
              url: null,
              label: "Next &raquo;",
              active: false
            }
          ],
          next_page_url: null,
          path: "http://localhost:8000/api/v1/customers/kyc-verifications",
          per_page: 15,
          prev_page_url: null,
          to: 2,
          total: 2
        };

        setKycVerifications(mockResponse.data);

        // Determine verification status
        const hasBvn = mockResponse.data.some(kyc => kyc.documentType === 'BVN');
        const hasNin = mockResponse.data.some(kyc => kyc.documentType === 'NIN');
        
        if (hasBvn && hasNin) {
          setVerificationStatus('complete');
        } else if (hasBvn || hasNin) {
          setVerificationStatus('pending');
          // Set the ID type to the one that's missing
          setIdType(hasBvn ? 'nin' : 'bvn');
        } else {
          setVerificationStatus('incomplete');
        }

        setIsLoading(false);
      }, 1000);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load KYC verifications');
    }
  };

  const handleSubmitVerification = async () => {
    if (!idValue) {
      Alert.alert('Error', `Please enter your ${idType.toUpperCase()}`);
      return;
    }

    if (!transactionPin || transactionPin.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit transaction PIN');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      setTimeout(() => {
        Alert.alert(
          'Success', 
          `Your ${idType.toUpperCase()} has been successfully verified!`,
          [
            {
              text: 'OK',
              onPress: async () => {
                await loadKycVerifications();
                setShowVerificationForm(false);
                setIdValue('');
                setTransactionPin('');
              }
            }
          ]
        );
      }, 2000);
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to verify ${idType.toUpperCase()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVerificationStatus = () => {
    switch (verificationStatus) {
      case 'complete':
        return (
          <View style={[styles.statusCard, { backgroundColor: '#0F2A1A', borderLeftColor: '#10B981' }]}>
            <View style={styles.statusHeader}>
              <Shield size={24} color="#10B981" />
              <Text style={[styles.statusTitle, { color: '#10B981' }]}>KYC Verification Complete</Text>
            </View>
            <Text style={styles.statusDescription}>
              Your identity has been fully verified with both BVN and NIN.
            </Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.statusCard, { backgroundColor: '#3A2A0F', borderLeftColor: '#F59E0B' }]}>
            <View style={styles.statusHeader}>
              <AlertTriangle size={24} color="#F59E0B" />
              <Text style={[styles.statusTitle, { color: '#F59E0B' }]}>KYC Verification Pending</Text>
            </View>
            <Text style={styles.statusDescription}>
              You have verified {idType === 'bvn' ? 'NIN' : 'BVN'}. Please complete your verification by adding your {idType.toUpperCase()}.
            </Text>
            <TouchableOpacity 
              style={[styles.completeButton, { backgroundColor: '#F59E0B' }]}
              onPress={() => setShowVerificationForm(true)}
            >
              <Text style={styles.completeButtonText}>Complete Verification</Text>
            </TouchableOpacity>
          </View>
        );
      case 'incomplete':
        return (
          <View style={[styles.statusCard, { backgroundColor: '#2A0F0F', borderLeftColor: '#EF4444' }]}>
            <View style={styles.statusHeader}>
              <X size={24} color="#EF4444" />
              <Text style={[styles.statusTitle, { color: '#EF4444' }]}>KYC Verification Incomplete</Text>
            </View>
            <Text style={styles.statusDescription}>
              Your identity has not been verified. Please verify either your BVN or NIN to continue.
            </Text>
            <TouchableOpacity 
              style={[styles.completeButton, { backgroundColor: '#EF4444' }]}
              onPress={() => setShowVerificationForm(true)}
            >
              <Text style={styles.completeButtonText}>Start Verification</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  const renderVerificationForm = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Verify Your {idType.toUpperCase()}</Text>
        <Text style={styles.formDescription}>
          Please enter your {idType.toUpperCase()} to verify your identity. This information is securely stored and protected.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{idType.toUpperCase()}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Enter your ${idType.toUpperCase()}`}
            value={idValue}
            onChangeText={setIdValue}
            keyboardType="numeric"
            maxLength={idType === 'bvn' ? 11 : 11}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Transaction PIN</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your 4-digit PIN"
            value={transactionPin}
            onChangeText={setTransactionPin}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setShowVerificationForm(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              { backgroundColor: primaryColor },
              (isSubmitting || !idValue || !transactionPin) && styles.disabledButton
            ]}
            onPress={handleSubmitVerification}
            disabled={isSubmitting || !idValue || !transactionPin}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderVerificationDetails = () => {
    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Your Verification Details</Text>
        
        {kycVerifications.map((verification, index) => {
          // Mask the ID number for privacy
          const idNumber = verification.documentIDNo;
          const maskedIdNumber = idNumber.length > 8 
            ? `${idNumber.substring(0, 4)}****${idNumber.substring(idNumber.length - 4)}`
            : idNumber;
            
          return (
            <View key={index} style={styles.verificationCard}>
              <View style={styles.verificationHeader}>
                <View style={styles.verificationTypeContainer}>
                  <Shield size={16} color="#FFFFFF" />
                  <Text style={styles.verificationType}>{verification.documentType}</Text>
                </View>
                <View style={styles.verificationStatus}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Verified</Text>
                </View>
              </View>
              
              <View style={styles.verificationDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID Number:</Text>
                  <Text style={styles.detailValue}>{maskedIdNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {verification.entityData.first_name} {verification.entityData.middle_name} {verification.entityData.last_name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>
                    {verification.entityData.phone_number || verification.entityData.phone_number1}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gender:</Text>
                  <Text style={styles.detailValue}>{verification.entityData.gender}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date of Birth:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(verification.entityData.date_of_birth).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading verification data...</Text>
            </View>
          ) : (
            <>
              {/* Verification Status */}
              {renderVerificationStatus()}
              
              {/* Verification Form */}
              {showVerificationForm && renderVerificationForm()}
              
              {/* Verification Details */}
              {kycVerifications.length > 0 && renderVerificationDetails()}
              
              {/* Information Section */}
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Why Verify Your Identity?</Text>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Shield size={20} color={primaryColor} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoItemTitle}>Enhanced Security</Text>
                    <Text style={styles.infoItemDescription}>
                      Protect your account from unauthorized access and fraud
                    </Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Check size={20} color={primaryColor} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoItemTitle}>Higher Transaction Limits</Text>
                    <Text style={styles.infoItemDescription}>
                      Enjoy increased transaction limits for your financial needs
                    </Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <User size={20} color={primaryColor} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoItemTitle}>Regulatory Compliance</Text>
                    <Text style={styles.infoItemDescription}>
                      Meet regulatory requirements for financial services
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#94a3b8',
  },
  statusCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  statusDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#e2e8f0',
    marginBottom: 16,
    lineHeight: 20,
  },
  completeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completeButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  formContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#e2e8f0',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  detailsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  verificationCard: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  verificationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#475569',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verificationType: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#10B981',
  },
  verificationDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  infoSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  infoItemDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
    lineHeight: 20,
  },
});