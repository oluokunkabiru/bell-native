import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Eye, EyeOff, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DropdownSelect } from '@/components/DropdownSelect';
import { apiService } from '@/services/api';
import Modal from 'react-native-modal';

const { width } = Dimensions.get('window');

interface Network {
  code: string;
  name: string;
}

interface CryptoTransferStep {
  step: 'wallet' | 'network' | 'address' | 'amount' | 'confirm' | 'pin' | 'result';
}

interface CryptoTransferData {
  networkCode: string;
  networkName: string;
  address: string;
  amount: string;
  description: string;
  transactionPin: string;
}

interface InitiateResponse {
  currency_code: string;
  currency_symbol: string;
  type: string;
  category: string;
  actual_balance_before: string;
  amount_processable: string;
  platform_charge_fee: string;
  expected_balance_after: string;
  total_amount_processable: string;
}

interface CryptoWallet {
  id: string;
  wallet_number: string;
  ownership_label	:string;
  balance: string;
  currency?: { name: string; symbol: string; code: string };
  wallet_type?: { name: string };
  provider_metadata:{ code: string; currency: string; network:string, id:string };
  
  status?: { label: string; color: string };
}

const WALLET_TYPE_OPTIONS = [
  { id: 'crypto-account', name: 'Crypto Wallet' },
//   { id: 'virtual-account', name: 'Virtual Account' },
//   { id: 'internal-account', name: 'Internal Account' },
];

export default function CryptoTransfer() {
  const { user, appSettings, updateWalletBalance } = useAuth();
  const [currentStep, setCurrentStep] = useState<CryptoTransferStep['step']>('wallet');
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [networks, setNetworks] = useState<Network[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [transferData, setTransferData] = useState<CryptoTransferData>({
    networkCode: '',
    networkName: '',
    address: '',
    amount: '',
    description: '',
    transactionPin: '',
  });
  const [initiateData, setInitiateData] = useState<InitiateResponse | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [showPin, setShowPin] = useState(false);
  const [walletCategory, setWalletCategory] = useState<'crypto' | 'fiat' | 'all'>('crypto');
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [createWalletType, setCreateWalletType] = useState('crypto-account');
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [walletProducts, setWalletProducts] = useState<any[]>([]);
  const [selectedWalletProduct, setSelectedWalletProduct] = useState('');
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [createWalletNetwork, setCreateWalletNetwork] = useState('');

  // Get colors from API settings
  const primaryColor = appSettings?.['customized-app-primary-color'] || '#0066CC';

  // Fetch crypto wallets on mount or when step is 'wallet'
  useEffect(() => {
    if (currentStep === 'wallet') {
      fetchWallets(walletCategory);
    }
  }, [currentStep, walletCategory]);

  // Fetch currencies when create wallet modal is opened
  useEffect(() => {
    if (showCreateWallet) {
      setCurrenciesLoading(true);
      apiService.getCurrencies(1, 15, 'crypto')
        .then((response) => {
          if (response.status && response.data?.data) {
            setCurrencies(response.data.data);
          } else {
            setCurrencies([]);
          }
        })
        .catch(() => setCurrencies([]))
        .finally(() => setCurrenciesLoading(false));
    }
  }, [showCreateWallet]);

  // Set selectedCurrency and update networks when wallet changes
  useEffect(() => {
    if (selectedWallet) {
      const walletCurrencyCode = selectedWallet.currency?.code;
      setSelectedCurrency(walletCurrencyCode || '');
      // Update networks based on wallet currency
      if (walletCurrencyCode === 'USDT') {
        setNetworks([
          { code: 'TRC20', name: 'TRON (TRC20)' },
          { code: 'ERC20', name: 'Ethereum (ERC20)' },
        ]);
      } else if (walletCurrencyCode === 'USDC') {
        setNetworks([
          { code: 'POL', name: 'Polygon (POL)' },
        ]);
      } else if (walletCurrencyCode) {
        setNetworks([
          { code: 'POL', name: 'Polygon' },
          { code: 'ETH', name: 'Ethereum' },
          { code: 'BSC', name: 'Binance Smart Chain' },
        ]);
      } else {
        setNetworks([]);
      }
      // Reset transferData network selection
      setTransferData(prev => ({ ...prev, networkCode: '', networkName: '' }));
    }
  }, [selectedWalletId, cryptoWallets]);

  const fetchWallets = async (category: 'crypto' | 'fiat' | 'all') => {
    setIsLoading(true);
    try {
      let url = '/customers/wallets?items_per_page=15';
      if (category !== 'all') {
        url += `&category=${category}`;
      }
      const response = await apiService.makeRequest<any>(url);
      if (response.status && response.data?.data) {
        setCryptoWallets(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedWalletId(response.data.data[0].id);
        } else {
          setSelectedWalletId('');
        }
      } else {
        Alert.alert('Error', 'No wallets found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load wallets.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedWallet = cryptoWallets.find(w => w.id === selectedWalletId);
  const walletBalance = selectedWallet ? parseFloat(selectedWallet.balance) : 0;

  const handleWalletSelect = (walletId: string) => {
    setSelectedWalletId(walletId);
  };

  const handleNetworkSelect = (networkCode: string) => {
    const network = networks.find(n => n.code === networkCode);
    if (network) {
      setTransferData(prev => ({
        ...prev,
        networkCode: network.code,
        networkName: network.name,
      }));
      setCurrentStep('address');
    }
  };

  const handleAddressVerification = () => {
    // if (!transferData.address || !/^0x[a-fA-F0-9]{40}$/.test(transferData.address)) {
    //   setVerificationError('Please enter a valid wallet address');
    //   return;
    // }
    setVerificationError(null);
    setCurrentStep('amount');
  };

  const handleAmountSubmit = () => {
    const amount = parseFloat(transferData.amount);
    if (!transferData.amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (amount > walletBalance) {
        // console.log(walletBalance);
        
      Alert.alert('Insufficient Funds', `You cannot transfer more than your available balance of ⟠${walletBalance.toLocaleString()}`);
      return;
    }
    if (!transferData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    setCurrentStep('confirm');
    initiateTransfer();
  };

  const initiateTransfer = async () => {
    setIsLoading(true);
    try {
      const wallet = user?.getPrimaryWallet || user?.get_primary_wallet;
      console.log(wallet);
      
      const response = await apiService.initiateCryptoWalletTransfer({
        source_wallet_id: wallet?.id || '',
        destination_address_code: transferData.address,
        destination_address_network: transferData.networkCode,
        amount: parseFloat(transferData.amount),
        description: transferData.description,
      });
      if (response.status && response.data) {
        setInitiateData(response.data);
      } else {
        Alert.alert('Error', 'Failed to initiate transfer. Please try again.');
        setCurrentStep('amount');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate transfer. Please try again.');
      setCurrentStep('amount');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransfer = () => {
    setCurrentStep('pin');
  };

  const handleProcessTransfer = async () => {
    if (!transferData.transactionPin || transferData.transactionPin.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit PIN');
      return;
    }
    setIsProcessing(true);
    try {
      const wallet = user?.getPrimaryWallet || user?.get_primary_wallet;
      const response = await apiService.processCryptoWalletTransfer({
        source_wallet_id: wallet?.id || '',
        destination_address_code: transferData.address,
        destination_address_network: transferData.networkCode,
        amount: parseFloat(transferData.amount),
        description: transferData.description,
        transaction_pin: transferData.transactionPin,
      });
      if (response.status && response.data) {
        if (response.data?.user_balance_after) {
          await updateWalletBalance(response.data.user_balance_after);
        }
        setResultData(response.data);
        setCurrentStep('result');
      } else {
        Alert.alert('Error', response.message || 'Transfer failed. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Transfer failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackPress = () => {
    switch (currentStep) {
      case 'network':
        router.back();
        break;
      case 'address':
        setCurrentStep('network');
        break;
      case 'amount':
        setCurrentStep('address');
        break;
      case 'confirm':
        setCurrentStep('amount');
        break;
      case 'pin':
        setCurrentStep('confirm');
        break;
      case 'result':
        router.back();
        break;
    }
  };

  // Handle wallet creation
  const handleCreateWallet = async () => {
    if (!selectedCurrency || !createWalletType || (createWalletNetwork === '' && currencies.find(c => (c.id === selectedCurrency || c.code === selectedCurrency) && (c.code === 'USDT' || c.code === 'USDC')))) return;
    setCreatingWallet(true);
    try {
      const payload: any = {
        account_type: createWalletType,
        currency_id: selectedCurrency,
      };
      if (createWalletType === 'virtual-account' && selectedBank) {
        payload.bank_id = selectedBank;
      }
      if (selectedWalletProduct) {
        payload.wallet_type_id = selectedWalletProduct;
      }
      // Add network to payload if needed
      const currencyObj = currencies.find(c => c.id === selectedCurrency || c.code === selectedCurrency);
      if (currencyObj && (currencyObj.code === 'USDT' || currencyObj.code === 'USDC' || currencyObj.code === 'POL' || currencyObj.code === 'ETH' || currencyObj.code === 'BSC')) {
        payload.currency_network = createWalletNetwork;
      }
      const response = await apiService.makeRequest<any>('/customers/wallets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (response.status) {
        setShowCreateWallet(false);
        await fetchWallets(walletCategory);
        if (response.data?.id) {
          setSelectedWalletId(response.data.id);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to create wallet');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create wallet');
    } finally {
      setCreatingWallet(false);
    }
  };

  const renderWalletSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Wallet</Text>
      {/* Wallet Category Dropdown */}
      <DropdownSelect
        options={[
            { id: 'all', name: 'All Wallets', code: 'all' },
            { id: 'fiat', name: 'Fiat Wallets', code: 'fiat' },
            { id: 'crypto', name: 'Crypto Wallets', code: 'crypto' },
         
        ]}
        selectedValue={walletCategory}
        onSelect={(val) => setWalletCategory(val as 'crypto' | 'fiat' | 'all')}
        placeholder="Select wallet type"
        searchable={false}
        label="Wallet Type"
      />
      {isLoading ? (
        <LoadingSpinner message="Loading wallets..." color="#FFFFFF" />
      ) : cryptoWallets.length > 0 ? (
        <DropdownSelect
          options={cryptoWallets.map(w => ({
            id: w.id,
            name: `${w.provider_metadata?.id || 'Wallet'} (${w.currency?.code || ''}) - ${w.wallet_number}`,
            code: w.ownership_label,
          }))}

          selectedValue={selectedWalletId}
          onSelect={handleWalletSelect}
          placeholder="Choose a wallet"
          searchable={false}
          label="Wallet"
        />
      ) : (
        <Text style={styles.errorText}>No wallets available.</Text>
      )}
      {selectedWallet && (
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{selectedWallet.wallet_type?.name || 'Wallet'}</Text>
          <Text style={styles.accountDetails}>{selectedWallet.wallet_number}</Text>
          <Text style={styles.balanceLabel}>Balance:</Text>
          <Text style={styles.balanceAmount}>{selectedWallet.currency?.symbol || ''}{parseFloat(selectedWallet.balance).toLocaleString()}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: primaryColor },
          (!selectedWalletId) && styles.disabledButton
        ]}
        onPress={() => setCurrentStep('network')}
        disabled={!selectedWalletId}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
      {/* Create Wallet Button */}
      <TouchableOpacity
        style={[styles.continueButton, { backgroundColor: '#222', marginTop: 16 }]}
        onPress={() => setShowCreateWallet(true)}
      >
        <Text style={styles.continueButtonText}>+ Create New Wallet</Text>
      </TouchableOpacity>
      {/* Create Wallet Modal */}
      <Modal isVisible={showCreateWallet} onBackdropPress={() => setShowCreateWallet(false)}>
        <View style={[styles.stepContainer, { backgroundColor: '#18181b', borderRadius: 16 }]}> 
          <Text style={styles.stepTitle}>Create Wallet</Text>
          <DropdownSelect
            options={WALLET_TYPE_OPTIONS}
            selectedValue={createWalletType}
            onSelect={setCreateWalletType}
            placeholder="Select wallet type"
            searchable={false}
            label="Wallet Type"
          />
          {currenciesLoading ? (
            <LoadingSpinner message="Loading currencies..." color="#FFFFFF" />
          ) : (
            <DropdownSelect
              options={currencies.map(c => ({ id: c.id, name: `${c.name} (${c.code})`, code: c.id }))}
              selectedValue={selectedCurrency}
              onSelect={setSelectedCurrency}
              placeholder="Select currency"
              searchable={true}
              label="Currency"
            />
          )}
          {(() => {
            const currencyObj = currencies.find(c => c.id === selectedCurrency || c.code === selectedCurrency);
            let networkOptions: { id: string; name: string; code: string }[] = [];
            if (currencyObj?.code === 'USDT') {
              networkOptions = [
                { id: 'TRC20', name: 'TRON (TRC20)', code: 'TRC20' },
                { id: 'ERC20', name: 'Ethereum (ERC20)', code: 'ERC20' },
              ];
            } else if (currencyObj?.code === 'USDC') {
              networkOptions = [
                { id: 'POL', name: 'Polygon (POL)', code: 'POL' },
              ];
            } else if (currencyObj) {
              networkOptions = [
                { id: 'POL', name: 'Polygon', code: 'POL' },
                { id: 'ETH', name: 'Ethereum', code: 'ETH' },
                { id: 'BSC', name: 'Binance Smart Chain', code: 'BSC' },
              ];
            }
            if (networkOptions.length > 0) {
              return (
                <DropdownSelect
                  options={networkOptions}
                  selectedValue={createWalletNetwork}
                  onSelect={setCreateWalletNetwork}
                  placeholder="Select network"
                  searchable={false}
                  label="Network"
                />
              );
            }
            return null;
          })()}
          {createWalletType === 'virtual-account' && (
            <DropdownSelect
              options={banks.map(b => ({ id: b.id, name: b.name, code: b.id }))}
              selectedValue={selectedBank}
              onSelect={setSelectedBank}
              placeholder="Select bank"
              searchable={true}
              label="Bank"
            />
          )}
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: primaryColor, marginTop: 16 },
              (creatingWallet || !selectedCurrency || !createWalletType || (currencies.find(c => (c.id === selectedCurrency || c.code === selectedCurrency) && (c.code === 'USDT' || c.code === 'USDC')) && !createWalletNetwork) || (createWalletType === 'virtual-account' && !selectedBank)) && styles.disabledButton
            ]}
            onPress={handleCreateWallet}
            disabled={creatingWallet || !selectedCurrency || !createWalletType || (currencies.find(c => (c.id === selectedCurrency || c.code === selectedCurrency) && (c.code === 'USDT' || c.code === 'USDC')) && !createWalletNetwork) || (createWalletType === 'virtual-account' && !selectedBank)}
          >
            <Text style={styles.continueButtonText}>{creatingWallet ? 'Creating...' : 'Create Wallet'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: '#222', marginTop: 8 }]}
            onPress={() => setShowCreateWallet(false)}
          >
            <Text style={styles.continueButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );

  const renderNetworkSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Network</Text>
      <DropdownSelect
        options={networks.map(n => ({ id: n.code, name: n.name, code: n.code }))}
        selectedValue={transferData.networkCode}
        onSelect={handleNetworkSelect}
        placeholder="Choose a network"
        searchable={false}
        label="Network"
      />
    </View>
  );

  const renderAddressInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Recipient Address</Text>
      <Text style={styles.selectedBank}>Network: {transferData.networkName}</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Wallet Address</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter wallet address (0x...)"
          value={transferData.address}
          onChangeText={(text) => {
            setTransferData(prev => ({ ...prev, address: text }));
            setVerificationError(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#9CA3AF"
        />
        {verificationError && (
          <View style={styles.errorMessageContainer}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={styles.errorMessageText}>{verificationError}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.verifyButton,
          { backgroundColor: primaryColor },
          (!transferData.address || isVerifying) && styles.disabledButton
        ]}
        onPress={handleAddressVerification}
        disabled={isVerifying || !transferData.address}
      >
        <Text style={styles.verifyButtonText}>
          {isVerifying ? 'Verifying...' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAmountInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Transfer Amount</Text>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{transferData.address}</Text>
        <Text style={styles.accountDetails}>
          {transferData.networkName} ({transferData.networkCode})
        </Text>
      </View>
      <View style={styles.balanceInfo}>
        <Text style={styles.balanceLabel}>Available Balance:</Text>
        <Text style={styles.balanceAmount}>
          ⟠{walletBalance.toLocaleString()}
        </Text>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>⟠</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            value={transferData.amount}
            onChangeText={(text) => setTransferData(prev => ({ ...prev, amount: text }))}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {transferData.amount && parseFloat(transferData.amount) > walletBalance && (
          <Text style={styles.errorText}>Amount exceeds available balance</Text>
        )}
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter transfer description"
          value={transferData.description}
          onChangeText={(text) => setTransferData(prev => ({ ...prev, description: text }))}
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: primaryColor },
          (!transferData.amount || !transferData.description.trim() || parseFloat(transferData.amount) > walletBalance) && styles.disabledButton
        ]}
        onPress={handleAmountSubmit}
        disabled={!transferData.amount || !transferData.description.trim() || parseFloat(transferData.amount) > walletBalance}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Transfer</Text>
      {isLoading ? (
        <LoadingSpinner message="Preparing transfer..." color="#FFFFFF" />
      ) : initiateData ? (
        <>
          <View style={styles.confirmCard}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Recipient:</Text>
              <Text style={styles.confirmValue}>{transferData.address}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Network:</Text>
              <Text style={styles.confirmValue}>{transferData.networkName}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Amount:</Text>
              <Text style={styles.confirmValue}>
                {initiateData.currency_symbol}{initiateData.amount_processable}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Fee:</Text>
              <Text style={styles.confirmValue}>
                {initiateData.currency_symbol}{initiateData.platform_charge_fee}
              </Text>
            </View>
            <View style={[styles.confirmRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                {initiateData.currency_symbol}{initiateData.total_amount_processable}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Balance After:</Text>
              <Text style={styles.confirmValue}>
                {initiateData.currency_symbol}{initiateData.expected_balance_after}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: primaryColor }]}
            onPress={handleConfirmTransfer}
          >
            <Text style={styles.confirmButtonText}>Proceed to Transfer</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );

  const renderPinInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Transaction PIN</Text>
      <View style={styles.pinContainer}>
        <Text style={styles.pinLabel}>Enter your 4-digit transaction PIN to complete the transfer</Text>
        <View style={styles.pinInputContainer}>
          <TextInput
            style={styles.pinInput}
            placeholder="••••"
            value={transferData.transactionPin}
            onChangeText={(text) => setTransferData(prev => ({ ...prev, transactionPin: text }))}
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
          styles.transferButton,
          { backgroundColor: primaryColor },
          (!transferData.transactionPin || transferData.transactionPin.length !== 4 || isProcessing) && styles.disabledButton
        ]}
        onPress={handleProcessTransfer}
        disabled={!transferData.transactionPin || transferData.transactionPin.length !== 4 || isProcessing}
      >
        <Text style={styles.transferButtonText}>
          {isProcessing ? 'Processing...' : 'Complete Transfer'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderResult = () => (
    <View style={styles.stepContainer}>
      {resultData?.user_balance_after !== undefined ? (
        <>
          <View style={[styles.successIcon, { backgroundColor: '#10B981' }]}> <Check size={48} color="#FFFFFF" /> </View>
          <Text style={styles.successTitle}>Transfer Successful!</Text>
          <Text style={styles.successMessage}>{resultData.description || 'Your crypto transfer was successful.'}</Text>
          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>Transaction Receipt</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Reference:</Text>
              <Text style={styles.receiptValue}>{resultData.reference_number}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Description:</Text>
              <Text style={styles.receiptValue}>{resultData.description}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Amount:</Text>
              <Text style={styles.receiptValue}>⟠{resultData.user_amount?.toLocaleString()}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Fee:</Text>
              <Text style={styles.receiptValue}>⟠{resultData.user_charge_amount?.toLocaleString()}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>New Balance:</Text>
              <Text style={styles.receiptValue}>⟠{resultData.user_balance_after?.toLocaleString()}</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.errorIcon}>
            <Text style={styles.errorEmoji}>❌</Text>
          </View>
          <Text style={styles.errorTitle}>Transfer Failed</Text>
          <Text style={styles.errorMessage}>
            {'The transfer could not be completed. Please try again.'}
          </Text>
        </>
      )}
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: primaryColor }]}
        onPress={() => router.back()}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

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
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crypto Transfer</Text>
        <View style={styles.headerRight}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text style={styles.balanceAmount}>{selectedWallet ? `${selectedWallet.currency?.symbol || ''}${parseFloat(selectedWallet.balance).toLocaleString()}` : '--'}</Text>
          </View>
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {currentStep === 'wallet' && renderWalletSelection()}
        {currentStep === 'network' && renderNetworkSelection()}
        {currentStep === 'address' && renderAddressInput()}
        {currentStep === 'amount' && renderAmountInput()}
        {currentStep === 'confirm' && renderConfirmation()}
        {currentStep === 'pin' && renderPinInput()}
        {currentStep === 'result' && renderResult()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
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
    fontSize: 20,
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
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  errorMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  errorMessageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    flex: 1,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  selectedBank: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#CCCCCC',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  verifyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  accountInfo: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  accountName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  currencySymbol: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  confirmCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  confirmValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pinLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  pinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pinInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 8,
  },
  pinToggle: {
    padding: 4,
  },
  transferButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  transferButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
  },
  receiptCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  receiptTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  receiptValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  errorIcon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  errorEmoji: {
    fontSize: 64,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
}); 