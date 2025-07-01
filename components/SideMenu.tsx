import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogOut, Settings, CreditCard, Shield, Bell, CircleHelp as HelpCircle, ChevronRight, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { UserProfile } from '@/types/api';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  kycStatus: 'complete' | 'pending' | 'incomplete';
}

export function SideMenu({ visible, onClose, user, kycStatus }: SideMenuProps) {
  if (!user) return null;

  const handleLogout = async () => {
    try {
      // Close menu first
      onClose();
      // Navigate to login
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
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

  const kycStatusInfo = getKycStatusInfo();

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

  const menuItems = [
    {
      title: 'Profile Settings',
      icon: User,
      color: '#4361ee',
      onPress: () => {
        onClose();
        router.push('/profile-settings');
      },
    },
    {
      title: 'KYC Verification',
      icon: Shield,
      color: kycStatusInfo.color,
      onPress: () => {
        onClose();
        router.push('/kyc-verification');
      },
      badge: kycStatusInfo.text,
      badgeColor: kycStatusInfo.color
    },
    {
      title: 'Cards',
      icon: CreditCard,
      color: '#f72585',
      onPress: () => {
        onClose();
        router.push('/cards');
      },
    },
    {
      title: 'Notifications',
      icon: Bell,
      color: '#7209b7',
      onPress: () => {
        onClose();
      },
    },
    {
      title: 'Help & Support',
      icon: HelpCircle,
      color: '#4cc9f0',
      onPress: () => {
        onClose();
      },
    },
    {
      title: 'Settings',
      icon: Settings,
      color: '#3a0ca3',
      onPress: () => {
        onClose();
        router.push('/(tabs)/settings');
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.menuContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              {/* Profile Section */}
              <View style={styles.profileSection}>
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
                <Text style={styles.profileName}>{user.full_name}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
                <Text style={styles.memberSince}>
                  Member since {formatDate(user.created_at)}
                </Text>
                
                {/* KYC Status Badge */}
                <TouchableOpacity 
                  style={[styles.kycStatusBadge, { backgroundColor: kycStatusInfo.color + '20', borderColor: kycStatusInfo.color }]}
                  onPress={() => {
                    onClose();
                    router.push('/kyc-verification');
                  }}
                >
                  {kycStatusInfo.icon}
                  <Text style={[styles.kycStatusText, { color: kycStatusInfo.color }]}>
                    {kycStatusInfo.text}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Menu Items */}
              <View style={styles.menuItems}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.menuItem}
                    onPress={item.onPress}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.menuItemIcon, { backgroundColor: item.color + '20' }]}>
                        <item.icon size={20} color={item.color} />
                      </View>
                      <Text style={styles.menuItemText}>{item.title}</Text>
                    </View>
                    {item.badge ? (
                      <View style={[styles.menuItemBadge, { backgroundColor: item.badgeColor + '20', borderColor: item.badgeColor }]}>
                        <Text style={[styles.menuItemBadgeText, { color: item.badgeColor }]}>{item.badge}</Text>
                      </View>
                    ) : (
                      <ChevronRight size={20} color="#CCCCCC" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: Platform.OS === 'web' ? 350 : '80%',
    height: '100%',
    backgroundColor: '#000000',
    position: 'absolute',
    right: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#1A1A1A',
  },
  safeArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
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
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999999',
    marginBottom: 16,
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
    fontFamily: 'Inter-SemiBold',
  },
  menuItems: {
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  menuItemBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  menuItemBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
});