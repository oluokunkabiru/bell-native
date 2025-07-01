import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Printer, Share2, ArrowUpRight, ArrowDownRight, Copy, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface Transaction {
  id: string;
  transaction_type: 'credit' | 'debit';
  user_amount: string;
  description: string;
  reference_number: string;
  status: {
    label: string;
    color: string;
  };
  created_at: string;
  transaction_category?: {
    category: string;
  };
  instrument_code?: string;
  user_charge_amount?: string;
  user_balance_after?: string;
}

export default function TransactionDetailsScreen() {
  const { appSettings } = useAuth();
  const params = useLocalSearchParams();
  
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#2563EB';
  const secondaryColor = appSettings?.['customized-app-secondary-color'] || '#1E40AF';

  // Parse transaction data from params
  let transaction: Transaction | null = null;
  try {
    if (params.transactionData && typeof params.transactionData === 'string') {
      transaction = JSON.parse(params.transactionData);
    }
  } catch (error) {
    console.error('Failed to parse transaction data:', error);
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Transaction Not Found</Text>
          <Text style={styles.errorText}>The transaction details could not be loaded.</Text>
          <TouchableOpacity 
            style={[styles.backToHomeButton, { backgroundColor: primaryColor }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backToHomeText}>Back to Transactions</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getTransactionIcon = (transaction: Transaction) => {
    const type = transaction.transaction_category?.category?.toLowerCase() || transaction.description?.toLowerCase() || '';
    
    if (type.includes('airtime')) return '📱';
    if (type.includes('data')) return '📊';
    if (type.includes('electricity') || type.includes('power')) return '⚡';
    if (type.includes('transfer')) return '💸';
    if (type.includes('deposit') || type.includes('funding') || type.includes('cash deposit')) return '💰';
    if (type.includes('withdrawal')) return '🏧';
    
    return transaction.transaction_type === 'credit' ? '💰' : '💸';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('success')) {
      return <CheckCircle size={24} color="#10B981" />;
    } else if (statusLower.includes('pending')) {
      return <Clock size={24} color="#F59E0B" />;
    } else if (statusLower.includes('fail')) {
      return <XCircle size={24} color="#EF4444" />;
    }
    return <AlertCircle size={24} color="#6B7280" />;
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('success')) {
      return '#10B981';
    } else if (statusLower.includes('pending')) {
      return '#F59E0B';
    } else if (statusLower.includes('fail')) {
      return '#EF4444';
    }
    return '#6B7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      Alert.alert('Copied', `${label} copied to clipboard`);
    }
  };

  const handlePrint = () => {
    // For web, we can use window.print()
    if (typeof window !== 'undefined') {
      const printContent = `
        <html>
          <head>
            <title>Transaction Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .detail { margin: 10px 0; display: flex; justify-content: space-between; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Transaction Receipt</h2>
            </div>
            <div class="detail">
              <span class="label">Reference Number:</span>
              <span>${transaction.reference_number}</span>
            </div>
            <div class="detail">
              <span class="label">Date & Time:</span>
              <span>${formatDate(transaction.created_at)}</span>
            </div>
            <div class="detail">
              <span class="label">Description:</span>
              <span>${transaction.description}</span>
            </div>
            <div class="detail">
              <span class="label">Amount:</span>
              <span>${transaction.transaction_type === 'credit' ? '+' : '-'}₦${parseFloat(transaction.user_amount).toLocaleString()}</span>
            </div>
            ${transaction.instrument_code ? `
            <div class="detail">
              <span class="label">Instrument Code:</span>
              <span>${transaction.instrument_code}</span>
            </div>
            ` : ''}
            <div class="detail">
              <span class="label">Status:</span>
              <span>${transaction.status?.label || 'Unknown'}</span>
            </div>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    } else {
      Alert.alert('Print', 'Print functionality is available on web platform');
    }
  };

  const handleShare = async () => {
    const shareContent = `Transaction Receipt\n\nReference: ${transaction.reference_number}\nDate: ${formatDate(transaction.created_at)}\nDescription: ${transaction.description}\nAmount: ${transaction.transaction_type === 'credit' ? '+' : '-'}₦${parseFloat(transaction.user_amount).toLocaleString()}\nStatus: ${transaction.status?.label || 'Unknown'}`;
    
    try {
      if (Platform.OS === 'web') {
        // For web platform, check if navigator.share is available and handle errors
        if (navigator.share && window.location.protocol === 'https:') {
          await navigator.share({
            title: 'Transaction Receipt',
            text: shareContent,
          });
        } else {
          // Fallback for web: copy to clipboard or show alert
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareContent);
            Alert.alert('Copied to Clipboard', 'Transaction details have been copied to your clipboard.');
          } else {
            Alert.alert(
              'Share Not Available',
              'Sharing requires a secure connection (HTTPS). The transaction details are:\n\n' + shareContent,
              [{ text: 'OK' }]
            );
          }
        }
      } else {
        // For mobile platforms, use React Native's Share API
        await Share.share({
          message: shareContent,
          title: 'Transaction Receipt',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Provide user-friendly error message
      if (Platform.OS === 'web') {
        Alert.alert(
          'Share Failed',
          'Unable to share transaction details. This may be due to browser restrictions or the need for a secure connection (HTTPS).',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Share Failed', 'Unable to share transaction details. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Receipt</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handlePrint} style={styles.actionButton}>
            <Printer size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Share2 size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Transaction Status Card */}
        <LinearGradient
          colors={[primaryColor, secondaryColor]}
          style={styles.statusCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statusIconContainer}>
            {getStatusIcon(transaction.status?.label || '')}
          </View>
          <Text style={styles.statusText}>{transaction.status?.label || 'Unknown'}</Text>
          <Text style={styles.transactionTitle}>
            {transaction.transaction_category?.category || transaction.description}
          </Text>
          <Text style={styles.transactionAmount}>
            {transaction.transaction_type === 'credit' ? '+' : '-'}₦{parseFloat(transaction.user_amount).toLocaleString()}
          </Text>
          <View style={styles.transactionDirection}>
            {transaction.transaction_type === 'credit' ? (
              <ArrowDownRight size={20} color="#FFFFFF" />
            ) : (
              <ArrowUpRight size={20} color="#FFFFFF" />
            )}
          </View>
        </LinearGradient>

        {/* Transaction Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Transaction Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference Number:</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>{transaction.reference_number}</Text>
              <TouchableOpacity 
                onPress={() => handleCopyToClipboard(transaction.reference_number, 'Reference number')}
                style={styles.copyButton}
              >
                <Copy size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time:</Text>
            <Text style={styles.detailValue}>
              {formatDate(transaction.created_at)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailValue}>{transaction.description}</Text>
          </View>
          
          {transaction.instrument_code && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Instrument Code:</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{transaction.instrument_code}</Text>
                <TouchableOpacity 
                  onPress={() => handleCopyToClipboard(transaction.instrument_code, 'Instrument code')}
                  style={styles.copyButton}
                >
                  <Copy size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>
              {transaction.transaction_type === 'credit' ? 'Credit' : 'Debit'}
            </Text>
          </View>
          
          {transaction.user_charge_amount && parseFloat(transaction.user_charge_amount) > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Charge Amount:</Text>
              <Text style={styles.detailValue}>₦{parseFloat(transaction.user_charge_amount).toLocaleString()}</Text>
            </View>
          )}

          {transaction.user_balance_after && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Balance After:</Text>
              <Text style={styles.detailValue}>₦{parseFloat(transaction.user_balance_after).toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primaryColor }]}
            onPress={handleShare}
          >
            <Share2 size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Share Receipt</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handlePrint}
          >
            <Printer size={20} color="#FFFFFF" />
            <Text style={styles.secondaryButtonText}>Print Receipt</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  statusCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
    }),
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  transactionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  transactionAmount: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  transactionDirection: {
    alignSelf: 'center',
  },
  detailsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  detailsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    marginLeft: 16,
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  actionButtonsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#334155',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  backToHomeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backToHomeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});