import { Tabs } from 'expo-router';
import { Chrome as Home, ChartBar as BarChart3, CreditCard, User, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { appSettings } = useAuth();

  // Get colors from API settings with fallbacks
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#4361ee';
  const secondaryColor = appSettings?.['customized-app-secondary-color'] || '#3f37c9';

  // Only show tabs on mobile platforms
  const showTabs = Platform.OS !== 'web';

  return (
    <View style={styles.container}>
      {showTabs ? (
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: primaryColor,
            tabBarInactiveTintColor: '#94a3b8',
            tabBarStyle: {
              backgroundColor: '#0f172a',
              borderTopWidth: 0,
              paddingBottom: Platform.OS === 'ios' ? 24 : 8,
              paddingTop: 8,
              height: Platform.OS === 'ios' ? 80 : 60,
              ...styles.shadow,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontFamily: 'Poppins-Medium',
              marginTop: 4,
            },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ size, color }) => (
                <Home size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="transactions"
            options={{
              title: 'Transactions',
              tabBarIcon: ({ size, color }) => (
                <CreditCard size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="analytics"
            options={{
              title: 'Analytics',
              tabBarIcon: ({ size, color }) => (
                <BarChart3 size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ size, color }) => (
                <User size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ size, color }) => (
                <Settings size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      ) : (
        // For web, we'll use the WebSidebar component instead of tabs
        <View style={styles.webContainer}>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="transactions" />
          <Tabs.Screen name="analytics" />
          <Tabs.Screen name="profile" />
          <Tabs.Screen name="settings" />
          <Tabs.Screen name="investments" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  webContainer: {
    flex: 1,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});