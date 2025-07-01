import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building, Smartphone, Zap, Send, ArrowRight, Tv, Wallet, Terminal, Coins } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiService } from '@/services/api';

export default function ServicesPage() {
  const { appSettings, user, walletBalance, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';

  useEffect(() => {
    // Check if token is valid on component mount
    const validateToken = async () => {
      setIsLoading(true);
      try {
        await refreshProfile();
      } catch (error) {
        console.error('Token validation error:', error);
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const serviceOptions = [
    {
      id: 'wallet-transfer',
      title: 'Naira to Naira',
      subtitle: 'Internal Transfer',
      description: 'Transfer Nigerian Naira to any wallet within the platform',
      icon: Wallet,
      route: '/wallet-transfer',
      color: '#4A90E2',
      image: 'https://images.pexels.com/photos/4386366/pexels-photo-4386366.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 'bank-transfer',
      title: 'Send to Nigeria',
      subtitle: 'Bank Transfer',
      description: 'Transfer Nigerian Naira to any Nigerian bank account instantly',
      icon: Building,
      route: '/bank-transfer',
      color: primaryColor,
      image: 'https://images.pexels.com/photos/7821487/pexels-photo-7821487.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 'airtime',
      title: 'Buy Airtime',
      subtitle: 'Mobile Top-up',
      description: 'Recharge mobile phones for all Nigerian networks',
      icon: Smartphone,
      route: '/airtime',
      color: '#10B981',
      image: 'https://images.pexels.com/photos/5053740/pexels-photo-5053740.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 'electricity',
      title: 'Pay Bills',
      subtitle: 'Electricity & Utilities',
      description: 'Pay electricity bills and utility services in Nigeria',
      icon: Zap,
      route: '/electricity',
      color: '#F59E0B',
      image: 'https://images.pexels.com/photos/1036936/pexels-photo-1036936.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 'cable-tv',
      title: 'Cable TV',
      subtitle: 'TV Subscriptions',
      description: 'Subscribe to DSTV, GOtv, StarTimes and more Nigerian TV services',
      icon: Tv,
      route: '/cable-tv',
      color: '#8B5CF6',
      image: 'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 'crypto-stable',
      title: 'Crypto Stable Coin',
      subtitle: 'Send & Receive Crypto',
      description: 'Send and receive stable cryptocurrencies with Nigerian Naira',
      icon: Coins,
      route: '#',
      color: '#F7931A',
      image: 'https://images.pexels.com/photos/6801874/pexels-photo-6801874.jpeg?auto=compress&cs=tinysrgb&w=400',
      comingSoon: true
    },
    {
      id: 'pos-management',
      title: 'Manage POS',
      subtitle: 'Terminal Management',
      description: 'Manage your POS terminals and transactions in Nigeria',
      icon: Terminal,
      route: '#',
      color: '#EF4444',
      image: 'https://images.pexels.com/photos/6214476/pexels-photo-6214476.jpeg?auto=compress&cs=tinysrgb&w=400',
      comingSoon: true
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading services..." color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
        <View style={styles.headerRight}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceAmount}>₦{walletBalance.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Send size={48} color={primaryColor} />
            <Text style={styles.heroTitle}>Send Money & Pay Bills</Text>
            <Text style={styles.heroSubtitle}>
              Fast, secure, and convenient way to transfer Nigerian Naira and pay for services
            </Text>
          </View>
        </View>

        {/* Service Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Choose Service</Text>
          
          {serviceOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => option.comingSoon ? null : router.push(option.route)}
              disabled={option.comingSoon}
            >
              <Image
                source={{ uri: option.image }}
                style={styles.optionImage}
                resizeMode="cover"
              />
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                    <option.icon size={24} color={option.color} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </View>
                  {option.comingSoon ? (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Coming Soon</Text>
                    </View>
                  ) : (
                    <ArrowRight size={20} color="#9CA3AF" />
                  )}
                </View>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Choose Our Service?</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>⚡</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Instant Transfer</Text>
                <Text style={styles.featureDescription}>
                  Nigerian Naira reaches recipients instantly across all Nigerian banks
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🔒</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Secure & Safe</Text>
                <Text style={styles.featureDescription}>
                  Bank-level security with end-to-end encryption for all Naira transactions
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>💰</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Low Fees</Text>
                <Text style={styles.featureDescription}>
                  Competitive rates with transparent pricing for Nigerian Naira transfers
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>📱</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>24/7 Available</Text>
                <Text style={styles.featureDescription}>
                  Send Nigerian Naira and pay bills anytime, anywhere
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 24,
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
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  optionsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  optionImage: {
    width: '100%',
    height: 120,
  },
  optionContent: {
    padding: 20,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#CCCCCC',
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999999',
    lineHeight: 20,
  },
  comingSoonBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  featuresList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});