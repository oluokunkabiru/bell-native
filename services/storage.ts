import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ORGANIZATION: 'organization_data',
  APP_SETTINGS: 'app_settings',
  AUTH_TOKEN: 'auth_token',
  APP_ID: 'app_id',
  WALLET_BALANCE: 'wallet_balance',
} as const;

class StorageService {
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // Organization methods
  async setOrganization(organization: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.ORGANIZATION, organization);
  }

  async getOrganization(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.ORGANIZATION);
  }

  // App Settings methods
  async setAppSettings(settings: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.APP_SETTINGS, settings);
  }

  async getAppSettings(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.APP_SETTINGS);
  }

  // Auth Token methods
  async setAuthToken(token: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async removeAuthToken(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // App ID methods
  async setAppId(appId: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.APP_ID, appId);
  }

  async getAppId(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.APP_ID);
  }

  async removeAppId(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.APP_ID);
  }

  // Wallet Balance methods
  async setWalletBalance(balance: number): Promise<void> {
    await this.setItem(STORAGE_KEYS.WALLET_BALANCE, balance);
  }

  async getWalletBalance(): Promise<number | null> {
    return this.getItem(STORAGE_KEYS.WALLET_BALANCE);
  }

  async removeWalletBalance(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.WALLET_BALANCE);
  }

  // Clear all app data on logout
  async clearAppData(): Promise<void> {
    await Promise.all([
      this.removeAuthToken(),
      this.removeAppId(),
      this.removeWalletBalance(),
      // Keep organization and settings for next login
    ]);
  }

  // Clear ALL data including cached organization and settings
  async clearAllData(): Promise<void> {
    await this.clear();
  }
}

export const storageService = new StorageService();