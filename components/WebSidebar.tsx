import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Chrome as Dashboard, 
  CreditCard, 
  User, 
  Settings, 
  ChartBar as Analytics, 
  Shield, 
  ChevronRight,
  LogOut,
  Wallet,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  PiggyBank,
  ChevronLeft,
  Send,
  Bitcoin
} from 'lucide-react-native';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface WebSidebarProps {
  onLogout: () => void;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export function WebSidebar({ onLogout, onToggleCollapse }: WebSidebarProps) {
  const { appSettings, user } = useAuth();
  const pathname = usePathname();
  const { width: windowWidth } = useWindowDimensions();
  // Sidebar toggle suppose to go here
  const [collapsed, setCollapsed] = useState(true); // Default to collapsed suppose to set to false

  // Determine if we're on mobile web (width < 768px)
  const isMobileWeb = Platform.OS === 'web' && windowWidth < 768;
  
  // Only show on web platform
  if (Platform.OS !== 'web') {
    return null;
  }

  const toggleCollapse = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsedState);
    }
  };


  //  Automatically expand after page is ready
  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     console.log(collapsed);
      
  //     setCollapsed(true);
  //           console.log(collapsed);

  //     setCollapsed(false);
  //           console.log(collapsed);

  //   }, 300); // Delay in ms (adjust as needed)

  //   return () => clearTimeout(timeout); // Cleanup on unmount
  // }, []);


  // useEffect(() => {
  //   // First toggle (collapse)
  //   const firstTimeout = setTimeout(() => {
  //     console.log('First toggle: collapsed → true');
  //     setCollapsed(!collapsed);

  //     // Second toggle (expand) after delay
  //     const secondTimeout = setTimeout(() => {
  //       console.log('Second toggle: collapsed → false');
  //       setCollapsed(!collapsed);
  //     }, 500); // 300ms after first toggle

  //     return () => clearTimeout(secondTimeout);
  //   }, 500); // Initial delay after load

  //   return () => clearTimeout(firstTimeout);
  // }, []);




  // Get menu display settings - properly typed
  const displayMenuItems = (appSettings as any)?.['customized-app-displayable-menu-items'] as Record<string, boolean | undefined> || {};
  
  // Get colors from API settings with fallbacks
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#4361ee';

  // Get profile image from KYC verification base64 data
  const profileImageBase64 = user?.first_kyc_verification?.imageEncoding;
  const profileImageUri = profileImageBase64 
    ? `data:image/jpeg;base64,${profileImageBase64}` 
    : 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300';

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Dashboard,
      route: '/(tabs)' as const,
      active: pathname === '/(tabs)' || pathname === '/(tabs)/index',
      key: 'display-dashboard-menu',
    },
    {
      title: 'Send Money',
      icon: Send,
      route: '/bank-transfer' as const,
      active: pathname === '/bank-transfer',
      key: 'display-bank-transfer-menu',
    },
    {
      title: 'Crypto Transfer',
      icon: Bitcoin, // You can replace with a crypto icon if available
      route: '/crypto-transfer' as const,
      active: pathname === '/crypto-transfer',
      key: 'display-crypto-exchange-menu',
    },
    {
      title: 'Wallet Transfer',
      icon: Wallet,
      route: '/wallet-transfer' as const,
      active: pathname === '/wallet-transfer',
      key: 'display-wallet-transfer-menu',
    },
    {
      title: 'Buy Airtime',
      icon: Smartphone,
      route: '/airtime' as const,
      active: pathname === '/airtime',
      key: 'display-airtime-menu',
    },
    {
      title: 'Buy Data',
      icon: Wifi,
      route: '/data-bundle' as const,
      active: pathname === '/data-bundle',
      key: 'display-data-menu',
    },
    {
      title: 'Electricity',
      icon: Zap,
      route: '/electricity' as const,
      active: pathname === '/electricity',
      key: 'display-electricity-menu',
    },
    {
      title: 'Cable TV',
      icon: Tv,
      route: '/cable-tv' as const,
      active: pathname === '/cable-tv',
      key: 'display-cable-tv-menu',
    },
    {
      title: 'Fixed Deposit',
      icon: PiggyBank,
      route: '/fixed-deposits' as const,
      active: pathname === '/fixed-deposits',
      key: 'display-fixed-deposit-menu',
    },
    {
      title: 'Cards',
      icon: CreditCard,
      route: '/cards' as const,
      active: pathname === '/cards',
      key: 'display-virtual-card-menu',
    },
    {
      title: 'Transactions',
      icon: CreditCard,
      route: '/(tabs)/transactions' as const,
      active: pathname === '/(tabs)/transactions',
      key: 'display-transactions-menu',
    },
    {
      title: 'Swap Currency',
      icon: Bitcoin,
      route: '/swap-currency' as const,
      active: pathname === '/swap-currency',
      key: 'display-swap-currency-menu',
    },
    // {
    //   title: 'Analytics',
    //   icon: Analytics,
    //   route: '/(tabs)/analytics' as const,
    //   active: pathname === '/(tabs)/analytics',
    //   key: 'display-analytics-menu',
    // },
    {
      title: 'Profile',
      icon: User,
      route: '/(tabs)/profile' as const,
      active: pathname === '/(tabs)/profile',
      key: 'display-profile-menu',
    },
    {
      title: 'KYC',
      icon: Shield,
      route: '/kyc-verification' as const,
      active: pathname === '/kyc-verification',
      key: 'display-kyc-menu',
    },
    // {
    //   title: 'Settings',
    //   icon: Settings,
    //   route: '/(tabs)/settings' as const,
    //   active: pathname === '/(tabs)/settings',
    //   key: 'display-settings-menu',
    // },
  ];

  // Filter menu items based on API settings
  const filteredMenuItems = menuItems.filter(item => {
    // For transaction histories, check display-transaction-histories
    if (item.key === 'display-transactions-menu') {
      return displayMenuItems[item.key] !== false && displayMenuItems['display-transaction-histories'] !== false;
    }
    return displayMenuItems[item.key] === undefined || displayMenuItems[item.key] === true;
  });

  const handleNavigation = (route: string) => {
    if (route === '#') return;
    router.push(route as any);
  };

  return (
    <View style={[
      styles.container, 
      collapsed && styles.collapsedContainer,
      isMobileWeb && styles.mobileContainer,
      isMobileWeb && collapsed && styles.mobileCollapsedContainer
    ]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {/* Only show menu title when not collapsed */}
          {!collapsed && <Text style={styles.menuTitle}>MENU</Text>}
          
          <TouchableOpacity 
            style={styles.collapseButton}
            onPress={toggleCollapse}
          >
            {collapsed ? (
              <ChevronRight size={20} color="#FFFFFF" />
            ) : (
              <ChevronLeft size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        
        {/* User Profile Section - only show when not collapsed */}
        {!collapsed && (
          <View style={styles.profileSection}>
            {user?.profile_image_url || profileImageBase64 ? (
              <Image 
                source={{ uri: profileImageUri }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={[styles.profileInitials, { backgroundColor: primaryColor }]}> 
                <Text style={styles.initialsText}>{getInitials(user?.full_name || '')}</Text>
              </View>
            )}
            <Text style={styles.profileName}>{user?.first_name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          </View>
        )}
        
        <ScrollView 
          style={styles.menuItemsContainer}
          con
          e={styles.menuItemsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.menuItems}>
            {filteredMenuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  item.active && styles.activeMenuItem,
                  collapsed && styles.collapsedMenuItem,
                ]}
                onPress={() => handleNavigation(item.route)}
              >
                <View style={[
                  styles.menuItemContent,
                  collapsed && styles.collapsedMenuItemContent
                ]}>
                  <item.icon 
                    size={20} 
                    color={item.active ? '#FFFFFF' : '#94a3b8'} 
                  />
                  {/* Only show text when not collapsed */}
                  {!collapsed && (
                    <Text 
                      style={[
                        styles.menuItemText,
                        item.active && styles.activeMenuItemText,
                      ]}
                    >
                      {item.title}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        
        <TouchableOpacity 
          style={[
            styles.logoutButton,
            collapsed && styles.collapsedLogoutButton
          ]}
          onPress={onLogout}
        >
          <LogOut size={20} color="#ef4444" />
          {/* Only show text when not collapsed */}
          {!collapsed && <Text style={styles.logoutText}>Sign Out</Text>}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: '100%',
    backgroundColor: '#000000',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    // Removed transition property (not supported)
  },
  collapsedContainer: {
    width: 60,
  },
  mobileContainer: {
    width: '100%',
    maxWidth: 300,
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
  },
  mobileCollapsedContainer: {
    width: 0,
  },
  safeArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
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
  menuTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  // Removed hidden style, now using conditional rendering
  collapseButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  profileInitials: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  initialsText: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#CCCCCC',
  },
  menuItemsContainer: {
    flex: 1,
  },
  menuItemsContent: {
    flexGrow: 1,
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collapsedMenuItem: {
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedMenuItemContent: {
    justifyContent: 'center',
    gap: 0,
  },
  activeMenuItem: {
    backgroundColor: '#1A1A1A',
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  activeMenuItemText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  collapsedLogoutButton: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#ef4444',
  },
});