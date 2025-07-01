import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Plus, Eye, EyeOff, Copy, Lock, Clock as Unlock, RefreshCw, X, Shield, Calendar, MapPin, DollarSign, TrendingUp, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiService } from '@/services/api';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface VirtualCard {
  id: string;
  card_number: string;
  masked_card_number: string;
  cvv: string;
  expiration_date: string;
  embossed_name: string;
  card_network_type: string;
  status?: {
    label: string;
    color: string;
  };
  card_response_metadata?: string;
}

interface CardBalance {
  balance: number;
  currency: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

interface ExchangeRate {
  base_currency: string;
  base_amount: number;
  exchange_rate: number;
  quote_currency: string;
  quote_amount: number;
}

export default function CardsScreen() {
  const { user, appSettings, walletBalance, updateWalletBalance } = useAuth();
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [transactionPin, setTransactionPin] = useState('');
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
  const [cardBalance, setCardBalance] = useState<CardBalance | null>(null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Get colors from API settings
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#2563EB';

  useEffect(() => {
    if (user) {
      loadCards();
      loadExchangeRate();
    }
  }, [user]);

  const loadCards = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await apiService.getVirtualCards(1, 20);
      if (response.status && response.data?.data) {
        setCards(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
      Alert.alert('Error', 'Failed to load virtual cards. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExchangeRate = async () => {
    setIsLoadingExchangeRate(true);
    try {
      const response = await apiService.getExchangeRate({
        base_currency: 'USD',
        exchange_amount: 2,
        quote_currency: 'NGN'
      });
      
      if (response.status && response.data) {
        setExchangeRate(response.data);
      }
    } catch (error) {
      console.error('Failed to load exchange rate:', error);
    } finally {
      setIsLoadingExchangeRate(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadCards();
      await loadExchangeRate();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateCard = async () => {
    // Enhanced validation: check if PIN is exactly 4 digits and contains only numbers
    if (!transactionPin || transactionPin.length !== 4 || !/^\d{4}$/.test(transactionPin)) {
      Alert.alert('Error', 'Please enter a valid 4-digit numeric transaction PIN');
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiService.createVirtualCard({ transaction_pin: transactionPin });
      
      if (response.status && response.data) {
        Alert.alert('Success', 'Virtual card created successfully!');
        setShowCreateModal(false);
        setTransactionPin('');
        await loadCards();
      } else {
        Alert.alert('Error', response.message || 'Failed to create virtual card');
      }
    } catch (error: any) {
      console.error('Create card error:', error);
      
      // Check if the error is "Access Denied" and handle session expiry
      if (error.message === 'Access Denied' || error.message?.includes('Access Denied')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/login');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to create virtual card. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCardPress = async (card: VirtualCard) => {
    setSelectedCard(card);
    setIsLoadingBalance(true);
    setShowCardDetails(true);
    
    try {
      const response = await apiService.getVirtualCardBalance(card.id);
      if (response.status && response.data) {
        setCardBalance(response.data);
      }
    } catch (error) {
      console.error('Failed to load card balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleBlockCard = async (cardId: string) => {
    Alert.alert(
      'Block Card',
      'Are you sure you want to block this card? This will prevent all transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.blockVirtualCard(cardId);
              if (response.status) {
                Alert.alert('Success', 'Card has been blocked successfully');
                await loadCards();
                setShowCardDetails(false);
              } else {
                Alert.alert('Error', response.message || 'Failed to block card');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to block card');
            }
          },
        },
      ]
    );
  };

  const handleUnblockCard = async (cardId: string) => {
    Alert.alert(
      'Unblock Card',
      'Are you sure you want to unblock this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              const response = await apiService.unblockVirtualCard(cardId);
              if (response.status) {
                Alert.alert('Success', 'Card has been unblocked successfully');
                await loadCards();
                setShowCardDetails(false);
              } else {
                Alert.alert('Error', response.message || 'Failed to unblock card');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unblock card');
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      Alert.alert('Copied', `${label} copied to clipboard`);
    }
  };

  const parseCardMetadata = (metadata: string) => {
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  };

  // Handle PIN input to ensure only numeric characters
  const handlePinChange = (text: string) => {
    // Only allow numeric characters and limit to 4 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
    setTransactionPin(numericText);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading..." color="#FFFFFF" />
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
        <Text style={styles.headerTitle}>Virtual Cards</Text>
        <View style={styles.headerRight}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceAmount}>₦{walletBalance.toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: primaryColor }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Exchange Rate Info */}
      {exchangeRate && (
        <View style={styles.exchangeRateContainer}>
          <View style={styles.exchangeRateContent}>
            <TrendingUp size={16} color="#FFFFFF" />
            <Text style={styles.exchangeRateText}>
              1 USD = {(exchangeRate.quote_amount / exchangeRate.base_amount).toFixed(2)} NGN
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
          />
        }
      >
        {isLoading ? (
          <LoadingSpinner message="Loading cards..." color="#FFFFFF" />
        ) : cards.length > 0 ? (
          <View style={styles.cardsContainer}>
            {cards.map((card) => {
              const metadata = card.card_response_metadata ? parseCardMetadata(card.card_response_metadata) : null;
              const isBlocked = card.status?.label?.toLowerCase().includes('block') || 
                              card.status?.label?.toLowerCase().includes('freeze');
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={styles.cardWrapper}
                  onPress={() => handleCardPress(card)}
                >
                  <LinearGradient
                    colors={isBlocked ? ['#6B7280', '#4B5563'] : [primaryColor, primaryColor]}
                    style={styles.virtualCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardType}>VIRTUAL CARD</Text>
                      <Text style={styles.cardNetwork}>{card.card_network_type}</Text>
                    </View>

                    {/* Card Number */}
                    <View style={styles.cardNumberSection}>
                      <Text style={styles.cardNumber}>{card.masked_card_number}</Text>
                    </View>

                    {/* Card Footer */}
                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.cardLabel}>CARDHOLDER</Text>
                        <Text style={styles.cardValue}>{card.embossed_name}</Text>
                      </View>
                      <View>
                        <Text style={styles.cardLabel}>EXPIRES</Text>
                        <Text style={styles.cardValue}>{card.expiration_date}</Text>
                      </View>
                    </View>

                    {/* Status Indicator */}
                    {card.status && (
                      <View style={[styles.statusBadge, { backgroundColor: card.status.color }]}>
                        <Text style={styles.statusText}>{card.status.label}</Text>
                      </View>
                    )}

                    {/* Block Overlay */}
                    {isBlocked && (
                      <View style={styles.blockedOverlay}>
                        <Lock size={24} color="#FFFFFF" />
                        <Text style={styles.blockedText}>BLOCKED</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <CreditCard size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Virtual Cards</Text>
            <Text style={styles.emptyDescription}>
              Create your first virtual card to start making secure online payments
            </Text>
            <TouchableOpacity
              style={[styles.createFirstButton, { backgroundColor: primaryColor }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createFirstButtonText}>Create Virtual Card</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Card Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Virtual Card</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.createCardIcon}>
              <CreditCard size={48} color={primaryColor} />
            </View>

            <Text style={styles.createTitle}>Create Your Virtual Card</Text>
            <Text style={styles.createDescription}>
              Enter your 4-digit transaction PIN to create a new virtual card. This PIN will be used to authorize the card creation.
            </Text>

            {exchangeRate && (
              <View style={styles.exchangeRateBox}>
                <View style={styles.exchangeRateHeader}>
                  <TrendingUp size={20} color="#10B981" />
                  <Text style={styles.exchangeRateTitle}>Exchange Rate</Text>
                </View>
                <Text style={styles.exchangeRateValue}>
                  1 USD = {(exchangeRate.quote_amount / exchangeRate.base_amount).toFixed(2)} NGN
                </Text>
                <Text style={styles.exchangeRateNote}>
                  Your card will be created in USD currency
                </Text>
              </View>
            )}

            <View style={styles.pinInputContainer}>
              <Text style={styles.pinLabel}>Transaction PIN</Text>
              <View style={styles.pinInputWrapper}>
                <TextInput
                  style={styles.pinInput}
                  placeholder="Enter 4-digit PIN"
                  value={transactionPin}
                  onChangeText={handlePinChange}
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
                styles.createButton,
                { backgroundColor: primaryColor },
                (!transactionPin || transactionPin.length !== 4 || !/^\d{4}$/.test(transactionPin) || isCreating) && styles.disabledButton
              ]}
              onPress={handleCreateCard}
              disabled={!transactionPin || transactionPin.length !== 4 || !/^\d{4}$/.test(transactionPin) || isCreating}
            >
              <Text style={styles.createButtonText}>
                {isCreating ? 'Creating...' : 'Create Card'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Card Details Modal */}
      <Modal
        visible={showCardDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCardDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Card Details</Text>
            <TouchableOpacity onPress={() => setShowCardDetails(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {selectedCard && (
            <ScrollView style={styles.modalContent}>
              {/* Card Preview */}
              <LinearGradient
                colors={[primaryColor, primaryColor]}
                style={styles.detailCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardType}>VIRTUAL CARD</Text>
                  <Text style={styles.cardNetwork}>{selectedCard.card_network_type}</Text>
                </View>

                <View style={styles.cardNumberSection}>
                  <Text style={styles.cardNumber}>
                    {showSensitiveData ? selectedCard.card_number : selectedCard.masked_card_number}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.cardLabel}>CARDHOLDER</Text>
                    <Text style={styles.cardValue}>{selectedCard.embossed_name}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardLabel}>EXPIRES</Text>
                    <Text style={styles.cardValue}>{selectedCard.expiration_date}</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Toggle Sensitive Data */}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowSensitiveData(!showSensitiveData)}
              >
                {showSensitiveData ? (
                  <EyeOff size={20} color={primaryColor} />
                ) : (
                  <Eye size={20} color={primaryColor} />
                )}
                <Text style={[styles.toggleText, { color: primaryColor }]}>
                  {showSensitiveData ? 'Hide' : 'Show'} Card Details
                </Text>
              </TouchableOpacity>

              {/* Card Information */}
              <View style={styles.cardInfoSection}>
                <Text style={styles.sectionTitle}>Card Information</Text>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Card Number:</Text>
                  <View style={styles.infoValueContainer}>
                    <Text style={styles.infoValue}>
                      {showSensitiveData ? selectedCard.card_number : selectedCard.masked_card_number}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(selectedCard.card_number, 'Card number')}
                    >
                      <Copy size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {showSensitiveData && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>CVV:</Text>
                    <View style={styles.infoValueContainer}>
                      <Text style={styles.infoValue}>{selectedCard.cvv}</Text>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(selectedCard.cvv, 'CVV')}
                      >
                        <Copy size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Expiry Date:</Text>
                  <Text style={styles.infoValue}>{selectedCard.expiration_date}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Cardholder:</Text>
                  <Text style={styles.infoValue}>{selectedCard.embossed_name}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Network:</Text>
                  <Text style={styles.infoValue}>{selectedCard.card_network_type}</Text>
                </View>

                {selectedCard.status && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: selectedCard.status.color }]} />
                      <Text style={[styles.statusLabel, { color: selectedCard.status.color }]}>
                        {selectedCard.status.label}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Balance Information */}
              {isLoadingBalance ? (
                <View style={styles.balanceLoading}>
                  <LoadingSpinner message="Loading balance..." color="#FFFFFF" />
                </View>
              ) : cardBalance && (
                <View style={styles.balanceSection}>
                  <Text style={styles.sectionTitle}>Balance & Address</Text>
                  
                  <View style={styles.balanceCard}>
                    <View style={styles.balanceHeader}>
                      <DollarSign size={24} color={primaryColor} />
                      <Text style={styles.balanceAmountCard}>
                        ${cardBalance.balance.toLocaleString()} {cardBalance.currency}
                      </Text>
                    </View>
                    
                    {exchangeRate && (
                      <View style={styles.exchangeRateInfo}>
                        <Text style={styles.exchangeRateInfoText}>
                          ≈ ₦{(cardBalance.balance * (exchangeRate.quote_amount / exchangeRate.base_amount)).toLocaleString()} NGN
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                      <MapPin size={20} color="#6B7280" />
                      <Text style={styles.addressTitle}>Billing Address</Text>
                    </View>
                    <Text style={styles.addressText}>
                      {cardBalance.address.street}{'\n'}
                      {cardBalance.address.city}, {cardBalance.address.state} {cardBalance.address.postal_code}{'\n'}
                      {cardBalance.address.country}
                    </Text>
                  </View>
                </View>
              )}

              {/* Card Actions */}
              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>Card Actions</Text>
                
                <View style={styles.actionButtons}>
                  {selectedCard.status?.label?.toLowerCase().includes('active') ? (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.blockButton]}
                      onPress={() => handleBlockCard(selectedCard.id)}
                    >
                      <Lock size={20} color="#EF4444" />
                      <Text style={styles.blockButtonText}>Block Card</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.unblockButton]}
                      onPress={() => handleUnblockCard(selectedCard.id)}
                    >
                      <Unlock size={20} color="#10B981" />
                      <Text style={styles.unblockButtonText}>Unblock Card</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.refreshButton]}
                    onPress={() => handleCardPress(selectedCard)}
                  >
                    <RefreshCw size={20} color={primaryColor} />
                    <Text style={[styles.refreshButtonText, { color: primaryColor }]}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exchangeRateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
  },
  exchangeRateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exchangeRateText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  cardsContainer: {
    padding: 20,
    gap: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  virtualCard: {
    borderRadius: 16,
    padding: 20,
    height: 200,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardType: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  cardNetwork: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  cardNumberSection: {
    flex: 1,
    justifyContent: 'center',
  },
  cardNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  blockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  blockedText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  createCardIcon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  createTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  createDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exchangeRateBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  exchangeRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  exchangeRateTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  exchangeRateValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exchangeRateNote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  pinInputContainer: {
    marginBottom: 32,
  },
  pinLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  pinInputWrapper: {
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
    textAlign: 'center',
    letterSpacing: 8,
    color: '#FFFFFF',
  },
  pinToggle: {
    padding: 4,
  },
  createButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  detailCard: {
    borderRadius: 16,
    padding: 20,
    height: 200,
    marginBottom: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginBottom: 24,
  },
  toggleText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  cardInfoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  balanceLoading: {
    paddingVertical: 40,
  },
  balanceSection: {
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceAmountCard: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  exchangeRateInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  exchangeRateInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#CCCCCC',
  },
  addressCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    lineHeight: 20,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  blockButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  blockButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
  unblockButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  unblockButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  refreshButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});