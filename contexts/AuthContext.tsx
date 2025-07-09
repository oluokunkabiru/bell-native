import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/api';
import { storageService } from '@/services/storage';
import { UserProfile, Organization, AppSettings } from '@/types/api';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { router } from 'expo-router';
import { Alert } from 'react-native';

interface AuthContextType {
  user: UserProfile | null;
  organization: Organization | null;
  appSettings: AppSettings | null;
  walletBalance: number;
  isLoading: boolean;
  isAuthenticated: boolean;
  initError: string | null;
  isAppReady: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  initializeApp: () => Promise<void>;
  updateWalletBalance: (balance: number) => Promise<void>;
  hasStoredCredentials: boolean;
  pinLoginAvailable: boolean;
  shouldShowPinSetup: boolean;
  setShouldShowPinSetup: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface StoredCredentials {
  username: string;
  encryptedPassword: string;
  timestamp: number;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [pinLoginAvailable, setPinLoginAvailable] = useState(false);
  const [shouldShowPinSetup, setShouldShowPinSetup] = useState(false);

  const isAuthenticated = !!user;

  // Auto-logout after 5 minutes of inactivity
  const { resetTimer } = useIdleTimer({
    timeout: 5 * 60 * 1000, // 5 minutes
    onIdle: () => {
      if (isAuthenticated) {
        logout();
      }
    },
    enabled: isAuthenticated,
  });

  const loadStoredData = async (): Promise<{ org: Organization | null; settings: AppSettings | null; balance: number }> => {
    try {
      const [storedOrg, storedSettings, storedBalance] = await Promise.all([
        storageService.getOrganization(),
        storageService.getAppSettings(),
        storageService.getWalletBalance(),
      ]);

      if (storedOrg) {
        setOrganization(storedOrg);
        apiService.setAppId(storedOrg.id);
      }

      if (storedSettings) {
        setAppSettings(storedSettings);
      }

      if (storedBalance !== null) {
        setWalletBalance(storedBalance);
      }

      return { org: storedOrg, settings: storedSettings, balance: storedBalance || 0 };
    } catch (error) {
      console.error('Error loading stored data:', error);
      return { org: null, settings: null, balance: 0 };
    }
  };

  const checkStoredCredentials = async () => {
    try {
      const credentials = await storageService.getItem<StoredCredentials>('stored_credentials');
      const pinEnabled = await storageService.getItem<boolean>('pin_enabled');
      
      setHasStoredCredentials(!!credentials);
      setPinLoginAvailable(!!credentials && pinEnabled === true);
    } catch (error) {
      console.error('Error checking stored credentials:', error);
      setHasStoredCredentials(false);
      setPinLoginAvailable(false);
    }
  };

  // const fetchFreshData = async (): Promise<void> => {
  //   try {
  //     // Try to get organization data
  //     const orgResponse = await apiService.getOrganization('MyBeller');
  //     if (orgResponse.status && orgResponse.data) {
  //       setOrganization(orgResponse.data);
  //       await storageService.setOrganization(orgResponse.data);
  //       await apiService.setAppId(orgResponse.data.id);
        
  //       // Then get app settings using the App ID
  //       try {
  //         const settingsResponse = await apiService.getAppSettings();
  //         if (settingsResponse.status && settingsResponse.data) {
  //           setAppSettings(settingsResponse.data);
  //           await storageService.setAppSettings(settingsResponse.data);
  //         }
  //       } catch (error) {
  //         console.warn('Failed to load fresh app settings:', error);
  //       }
  //     }
  //   } catch (error: any) {
  //     console.warn('Failed to load fresh organization data:', error);
  //     throw error;
  //   }
  // };





    const fetchFreshData = async (): Promise<void> => {
  try {
    // Get parts of the current hostname
    const hostParts = window.location.hostname.split(".");

    // Reserved subdomains to ignore
    const reservedSubdomains = ["www", "api", "mail", "ftp", "webmail", "smtp", "pop", "imap", "app"];

    // Extract subdomain (if applicable)
    let subdomain = hostParts.length > 2 ? hostParts[0].toLowerCase() : null;
    if (reservedSubdomains.includes(subdomain)) {
      subdomain = null;
    }

    // Extract base domain (last two segments)
    const domain = hostParts.slice(-2).join(".");

    // Check for ?company= query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const companyName = urlParams.get("company");

    // Decide which identifier to use: query param > valid subdomain > domain
    const currentIdentifier = (companyName || subdomain || domain)?.toLowerCase().trim();

    // console.log(currentIdentifier);

    

    // Fetch organization using identifier (currently hardcoded to 'signature')
    const orgResponse = await apiService.getOrganization(currentIdentifier);

    if (orgResponse.status && orgResponse.data) {
      setOrganization(orgResponse.data);
      await storageService.setOrganization(orgResponse.data);
      await apiService.setAppId(orgResponse.data.id);

      // Fetch app settings using the App ID
      try {
        const settingsResponse = await apiService.getAppSettings();
        if (settingsResponse.status && settingsResponse.data) {
          setAppSettings(settingsResponse.data);
          await storageService.setAppSettings(settingsResponse.data);
        }
      } catch (settingsError) {
        console.warn("Failed to load app settings:", settingsError);
      }
    }
  } catch (orgError) {
    console.warn("Failed to load organization data:", orgError);
    throw orgError;
  }
};


  const updateWalletBalance = async (balance: number): Promise<void> => {
    setWalletBalance(balance);
    await storageService.setWalletBalance(balance);
    resetTimer(); // Reset idle timer on balance update
  };

  const initializeApp = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setInitError(null);
      
      // Initialize API service
      await apiService.initialize();
      
      // Check for stored credentials
      await checkStoredCredentials();
      
      // Load stored balance first
      const storedBalance = await storageService.getWalletBalance();
      if (storedBalance !== null) {
        setWalletBalance(storedBalance);
      }
      
      // First, try to load stored data
      const { org, settings, balance } = await loadStoredData();
      
      // If we have stored data, mark app as ready immediately
      if (org && settings) {
        setIsAppReady(true);
        setIsLoading(false);
        
        // Fetch fresh data in background
        fetchFreshData().catch(error => {
          console.warn('Background data refresh failed:', error);
          // Don't show error to user since we have cached data
        });
        
        return;
      }
      
      // If no stored data, fetch fresh data
      await fetchFreshData();
      setIsAppReady(true);
      
    } catch (error: any) {
      console.error('Failed to initialize app:', error);
      setInitError('Unable to load application data. Please check your internet connection and try again.');
      setIsAppReady(true); // Allow app to continue with limited functionality
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.login({ username, password });
      
      if (response.status && response.data.profile) {
        setUser(response.data.profile);
        
        // Load wallet balance from user profile
        const wallet = response.data.profile.getPrimaryWallet || response.data.profile.get_primary_wallet;
        if (wallet) {
          const balance = parseFloat(wallet.balance);
          await updateWalletBalance(balance);
        }
        
        // Check if user should be prompted for PIN setup
        const credentials = await storageService.getItem<StoredCredentials>('stored_credentials');
        if (!credentials) {
          setShouldShowPinSetup(true);
        }
        
        resetTimer(); // Start idle timer
        return true;
      }
      return false;
    } catch (error: any) {
      // Handle specific error cases and determine user-friendly message
      let userFriendlyMessage: string;
      
      if (error.message?.includes('422')) {
        userFriendlyMessage = 'Invalid username or password. Please check your credentials.';
      } else if (error.message?.includes('404')) {
        userFriendlyMessage = 'Login service not found. Please contact support.';
      } else if (error.message?.includes('500')) {
        userFriendlyMessage = 'Server error. Please try again later.';
      } else if (error.message?.includes('Session expired')) {
        userFriendlyMessage = error.message;
      } else {
        userFriendlyMessage = 'Login failed. Please check your connection and try again.';
      }
      
      // Log the user-friendly error message instead of the raw error
      console.error('Login error:', userFriendlyMessage);
      
      throw new Error(userFriendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear user state immediately for better UX
      setUser(null);
      setWalletBalance(0);
      setShouldShowPinSetup(false);
      
      // Try to call logout API
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, we've already cleared local state
    } finally {
      // Always clear all local data including auth data
      await storageService.clearAllData();
      await clearAllPinData();
      setHasStoredCredentials(false);
      setPinLoginAvailable(false);
      
      // Navigate to login
      router.replace('/login');
    }
  };

  const clearAllPinData = async (): Promise<void> => {
    await Promise.all([
      storageService.removeItem('stored_credentials'),
      storageService.removeItem('pin_enabled'),
      storageService.removeItem('login_pin'),
    ]);
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      if (!apiService.getToken()) {
        throw new Error('No authentication token available');
      }
      
      const response = await apiService.getProfile();
      if (response.status && response.data) {
        setUser(response.data);
        
        // Update wallet balance from refreshed profile
        const wallet = response.data.getPrimaryWallet || response.data.get_primary_wallet;
        if (wallet) {
          const balance = parseFloat(wallet.balance);
          await updateWalletBalance(balance);
        }
        
        resetTimer(); // Reset idle timer on profile refresh
      }
    } catch (error: any) {
      console.error('Profile refresh error:', error);
      // If profile fetch fails due to token issues, user might need to login again
      if (error.message?.includes('Session expired') || error.message?.includes('401')) {
        // Call logout to properly clear state and redirect to login
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
              }
            }
          ]
        );
      }
      throw error; // Re-throw to allow caller to handle
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  // Auto-refresh profile when token is available
  useEffect(() => {
    const checkAndRefreshProfile = async () => {
      const token = apiService.getToken();
      if (token && !user) {
        try {
          await refreshProfile();
        } catch (error) {
          console.warn('Auto profile refresh failed:', error);
        }
      }
    };

    checkAndRefreshProfile();
  }, []);

  // Check stored credentials when app becomes ready
  useEffect(() => {
    if (isAppReady) {
      checkStoredCredentials();
    }
  }, [isAppReady]);

  // Handle route refresh - check authentication state on app focus
  useEffect(() => {
    const checkAuthOnFocus = async () => {
      if (isAppReady && !isLoading) {
        const token = apiService.getToken();
        if (token && !user) {
          // Token exists but no user - try to refresh profile
          try {
            await refreshProfile();
          } catch (error) {
            console.warn('Auth check on focus failed:', error);
            // If refresh fails, redirect to login
            router.replace('/login');
          }
        } else if (!token && !user) {
          // No token and no user - redirect to login
          router.replace('/login');
        }
      }
    };

    // Check auth state when app becomes ready
    if (isAppReady) {
      checkAuthOnFocus();
    }
  }, [isAppReady, isLoading]);

  const value: AuthContextType = {
    user,
    organization,
    appSettings,
    walletBalance,
    isLoading,
    isAuthenticated,
    initError,
    isAppReady,
    login,
    logout,
    refreshProfile,
    initializeApp,
    updateWalletBalance,
    hasStoredCredentials,
    pinLoginAvailable,
    shouldShowPinSetup,
    setShouldShowPinSetup,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}