import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { View, StyleSheet, Platform } from 'react-native';
import { WebSidebar } from '@/components/WebSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isAuthenticated, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      {isAuthenticated && Platform.OS === 'web' && (
        <WebSidebar 
          onLogout={handleLogout} 
          onToggleCollapse={(collapsed) => setSidebarCollapsed(collapsed)}
        />
      )}
      <View style={[
        styles.content, 
        isAuthenticated && Platform.OS === 'web' && styles.contentWithSidebar,
        isAuthenticated && Platform.OS === 'web' && sidebarCollapsed && styles.contentWithCollapsedSidebar
      ]}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="transaction-details" options={{ headerShown: false }} />
          <Stack.Screen name="profile-settings" options={{ headerShown: false }} />
          <Stack.Screen name="kyc-verification" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </View>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  contentWithSidebar: {
    marginLeft: Platform.OS === 'web' ? 200 : 0,
    transition: 'margin-left 0.3s ease',
  },
  contentWithCollapsedSidebar: {
    marginLeft: Platform.OS === 'web' ? 60 : 0,
  },
});