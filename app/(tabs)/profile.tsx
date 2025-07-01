import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Settings, 
  CreditCard, 
  Shield, 
  Bell, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar 
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout, appSettings, walletBalance } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [kycStatus, setKycStatus] = useState<'complete' | 'pending' | 'incomplete'>('incomplete');

  useEffect(() => {
    if (user) {
      checkKycStatus();
    }
  }, [user]);

  const checkKycStatus = () => {
    // Simulate checking KYC status
    // In a real app, this would come from the API
    const hasBvn = user?.first_kyc_verification?.documentType === 'BVN';
    const hasNin = user?.first_kyc_verification?.documentType === 'NIN';
    
    if (hasBvn && hasNin) {
      setKycStatus('complete');
    } else if (hasBvn || hasNin) {
      setKycStatus('pending');
    } else {
      setKycStatus('incomplete');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      router.replace('/login');
    }
  };

  const getKycStatusInfo = () => {
    switch (kycStatus) {
      case 'complete':
        return {
          color: '#10B981',
          text: 'KYC Verified',
          icon: <Shield size={16} color="#10B981" />
        };
      case 'pending':
        return {
          color: '#F59E0B',
          text: 'KYC Pending',
          icon: <Shield size={16} color="#F59E0B" />
        };
      case 'incomplete':
        return {
          color: '#EF4444',
          text: 'KYC Incomplete',
          icon: <Shield size={16} color="#EF4444" />
        };
      default:
        return {
          color: '#6B7280',
          text: 'KYC Status Unknown',
          icon: <Shield size={16} color="#6B7280" />
        };
    }
  };

  const primaryColor = appSettings?.['customized-app-primary-color'] || '#4361ee';
  const kycStatusInfo = getKycStatusInfo();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get profile image from KYC verification base64 data
  const profileImageBase64 = user.first_kyc_verification?.imageEncoding;
  const profileImageUri = profileImageBase64 
    ? `data:image/jpeg;base64,${profileImageBase64}` 
    : 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const settingsOptions = [
    {
      title: 'Account Settings',
      subtitle: 'Manage your account details',
      icon: User,
      color: '#4361ee',
      onPress: () => router.push('/profile-settings'),
    },
    {
      title: 'KYC Verification',
      subtitle: kycStatusInfo.text,
      icon: Shield,
      color: kycStatusInfo.color,
      onPress: () => router.push('/kyc-verification'),
      badge: kycStatusInfo.text,
      badgeColor: kycStatusInfo.color
    },
    {
      title: 'Cards',
      subtitle: 'Manage your cards',
      icon: CreditCard,
      color: '#f72585',
      onPress: () => router.push('/cards'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceAmount}>₦{walletBalance.toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/profile-settings')}
          >
            <Settings size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profileImageUri }}
              style={styles.profileImage}
              resizeMode="cover"
            />
            <View style={[styles.accountBadge, { backgroundColor: user.status?.color || '#10B981' }]}>
              <Text style={styles.accountBadgeText}>{user.status?.label || 'Active'}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{user.full_name}</Text>
          <Text style={styles.accountType}>{user.user_type?.description || 'Customer Account'}</Text>
          <Text style={styles.memberSince}>
            Member since {formatDate(user.created_at)}
          </Text>
          
          {/* KYC Status Badge */}
          <TouchableOpacity 
            style={[styles.kycStatusBadge, { backgroundColor: kycStatusInfo.color + '20', borderColor: kycStatusInfo.color }]}
            onPress={() => router.push('/kyc-verification')}
          >
            {kycStatusInfo.icon}
            <Text style={[styles.kycStatusText, { color: kycStatusInfo.color }]}>
              {kycStatusInfo.text}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactItem}>
            <Mail size={20} color="#94a3b8" />
            <Text style={styles.contactText}>{user.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <Phone size={20} color="#94a3b8" />
            <Text style={styles.contactText}>{user.telephone}</Text>
          </View>
          {user.physical_address && (
            <View style={styles.contactItem}>
              <MapPin size={20} color="#94a3b8" />
              <Text style={styles.contactText}>{user.physical_address}</Text>
            </View>
          )}
          {user.date_of_birth && (
            <View style={styles.contactItem}>
              <Calendar size={20} color="#94a3b8" />
              <Text style={styles.contactText}>
                Born {formatDate(user.date_of_birth)}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Settings */}
        <View style={styles.quickSettingsSection}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          <View style={styles.quickSettingItem}>
            <View style={styles.quickSettingLeft}>
              <Bell size={20} color="#94a3b8" />
              <Text style={styles.quickSettingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#334155', true: primaryColor }}
              thumbColor="#ffffff"
            />
          </View>
          <View style={styles.quickSettingItem}>
            <View style={styles.quickSettingLeft}>
              <Shield size={20} color="#94a3b8" />
              <Text style={styles.quickSettingText}>Biometric Login</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#334155', true: primaryColor }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsList}>
            {settingsOptions.map((option, index) => (
              <TouchableOpacity key={index} style={styles.settingItem} onPress={option.onPress}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: option.color + '20' }]}>
                    <option.icon size={20} color={option.color} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{option.title}</Text>
                    <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                  </View>
                </View>
                {option.badge ? (
                  <View style={[styles.settingBadge, { backgroundColor: option.badgeColor + '20', borderColor: option.badgeColor }]}>
                    <Text style={[styles.settingBadgeText, { color: option.badgeColor }]}>{option.badge}</Text>
                  </View>
                ) : (
                  <ChevronRight size={20} color="#94a3b8" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Help & Support */}
        <TouchableOpacity style={styles.supportButton}>
          <HelpCircle size={20} color="#94a3b8" />
          <Text style={styles.supportText}>Help & Support</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingRight: Platform.OS === 'web' ? 200 : 0, // Add padding for web sidebar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#94a3b8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
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
    fontFamily: 'Poppins-Regular',
    color: '#94a3b8',
  },
  balanceAmount: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#1e293b',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
    }),
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  accountBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accountBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  accountType: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Poppins-Regular',
    marginBottom: 12,
  },
  kycStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  kycStatusText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  contactSection: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    flex: 1,
  },
  quickSettingsSection: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
    }),
  },
  quickSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickSettingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  settingsSection: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
    }),
  },
  settingsList: {
    gap: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Poppins-Regular',
  },
  settingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
    }),
  },
  supportText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
    }),
  },
  logoutText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#ef4444',
  },
  versionText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 32,
  },
});