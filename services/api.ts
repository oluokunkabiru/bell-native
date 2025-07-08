import { LoginRequest, LoginResponse, ProfileResponse, OrganizationResponse, AppSettingsResponse } from '@/types/api';
import { storageService } from './storage';

const API_BASE_URL = 'https://app.gobeller.com/api/v1';

interface TransactionResponse {
  status: boolean;
  message: string;
  data: {
    meta_data: {
      total_pending: number;
      total_successful: number;
      total_failed: number;
      total_reversed: number;
    };
    transactions: {
      current_page: number;
      data: any[];
      first_page_url: string;
      from: number;
      last_page: number;
      last_page_url: string;
      links: any[];
      next_page_url: string | null;
      path: string;
      per_page: number;
      prev_page_url: string | null;
      to: number;
      total: number;
    };
  };
}

interface WalletsResponse {
  status: boolean;
  message: string;
  data: {
    current_page: number;
    data: any[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: any[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

interface BanksResponse {
  status: boolean;
  message: string;
  data: {
    current_page: number;
    data: any[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: any[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

interface DataBundlesResponse {
  status: boolean;
  message: string;
  data: Array<{
    variation_code: string;
    name: string;
    variation_amount: string;
    fixedPrice: string;
  }>;
}

interface DataBundleRequest {
  network_provider: string;
  data_plan: string;
  phone_number: string;
  transaction_pin: string;
}

interface DataBundleResponse {
  status: boolean;
  message: string;
  data: {
    balance: number;
    requestId: string;
  };
}

interface AirtimeRequest {
  network_provider: string;
  final_amount: string;
  phone_number: string;
  transaction_pin: string;
}

interface AirtimeResponse {
  status: boolean;
  message: string;
  data: {
    balance: number;
    requestId: string;
  };
}

interface BankAccountVerificationResponse {
  status: boolean;
  message: string;
  data: {
    account_name: string;
    bank_code: string;
    request_reference: string;
    session_id: string;
  };
}

interface WalletToBankTransferRequest {
  source_wallet_number: string;
  destination_account_number: string;
  bank_id: string;
  amount: number;
  description: string;
}

interface WalletToBankTransferProcessRequest extends WalletToBankTransferRequest {
  transaction_pin: number;
}

interface WalletToBankTransferResponse {
  status: boolean;
  message: string;
  data: any;
}

interface CryptoWalletTransferInitiateRequest {
  source_wallet_id: string;
  destination_address_code: string;
  destination_address_network: string;
  amount: number;
  description: string;
}

interface CryptoWalletTransferInitiateResponse {
  status: boolean;
  message: string;
  data: {
    currency_code: string;
    currency_symbol: string;
    type: string;
    category: string;
    actual_balance_before: string;
    amount_processable: string;
    platform_charge_fee: string;
    expected_balance_after: string;
    total_amount_processable: string;
  };
}

interface CryptoWalletTransferProcessRequest extends CryptoWalletTransferInitiateRequest {
  transaction_pin: string;
}

interface CryptoWalletTransferProcessResponse {
  status: boolean;
  message: string;
  data: any;
}

interface MeterServicesResponse {
  status: boolean;
  message: string;
  data: {
    electricity_discos: Array<{
      id: string;
      name: string;
    }>;
    meter_types: Array<{
      id: string;
      name: string;
    }>;
  };
}

interface MeterVerificationRequest {
  electricity_disco: string;
  meter_type: string;
  meter_number: string;
}

interface MeterVerificationResponse {
  status: boolean;
  message: string;
  data: {
    meter_name: string;
    address: string;
    meter_type: string;
    meter_number: string;
  };
}

interface ElectricityPurchaseRequest {
  meter_number: string;
  electricity_disco: string;
  meter_type: string;
  final_amount: string;
  transaction_pin: string;
}

interface ElectricityPurchaseResponse {
  status: boolean;
  message: string;
  data: {
    balance: string;
    token: string;
    purchased_units: string;
  };
}

interface CableTvSubscriptionsResponse {
  status: boolean;
  message: string;
  data: Array<{
    variation_code: string;
    name: string;
    variation_amount: string;
    fixedPrice: string;
  }>;
}

interface SmartCardVerificationRequest {
  cable_tv_type: string;
  smart_card_number: string;
}

interface SmartCardVerificationResponse {
  status: boolean;
  message: string;
  data: {
    customer_name: string;
    status: string;
    due_date: string;
    cable_tv: string;
    customer_number: string;
    current_bouquet: string;
    current_bouquet_code: string;
    renewal_amount: string;
  };
}

interface CableTvSubscriptionRequest {
  cable_tv_type: string;
  smart_card_number: string;
  subscription_plan: string;
  phone_number: string;
  transaction_pin: string;
}

interface CableTvSubscriptionResponse {
  status: boolean;
  message: string;
  data: {
    balance: number;
    requestId: string;
  };
}

interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

interface ChangePasswordResponse {
  status: boolean;
  message: string;
}

interface ChangePinRequest {
  current_pin: string;
  new_pin: string;
  new_pin_confirmation: string;
}

interface ChangePinResponse {
  status: boolean;
  message: string;
}

interface VirtualCard {
  id: string;
  organization_id: string;
  card_number: string;
  masked_card_number: string;
  card_type: string;
  status_id: string;
  card_network_type: string;
  card_tier_id: string | null;
  currency_id: string;
  user_id: string;
  wallet_id: string | null;
  cvv: string;
  pin_hash: string | null;
  token_id: string | null;
  expiration_date: string;
  daily_limit: string;
  monthly_limit: string;
  per_transaction_limit: string;
  embossed_name: string;
  shipping_address: string | null;
  shipping_status: string | null;
  shipping_date: string | null;
  tracking_number: string;
  is_single_use: boolean;
  is_merchant_locked: boolean;
  merchant_lock_id: string | null;
  is_amount_locked: boolean;
  locked_amount: string;
  transaction_count: number;
  lifetime_spend: string;
  last_used_at: string | null;
  issuer_reference: string;
  card_request_metadata: string;
  card_response_metadata: string;
  created_by: string;
  activated_at: string;
  blocked_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status?: {
    id: string;
    category: string;
    slug: string;
    label: string;
    description: string;
    color: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

interface VirtualCardsResponse {
  status: boolean;
  message: string;
  data: {
    current_page: number;
    data: VirtualCard[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: any[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

interface CreateVirtualCardRequest {
  transaction_pin: string;
}

interface CreateVirtualCardResponse {
  status: boolean;
  message: string;
  data: VirtualCard;
}

interface VirtualCardBalanceResponse {
  status: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    card_number: string;
    masked_pan: string;
    expiry: string;
    cvv: string;
    status: string;
    type: string;
    issuer: string;
    currency: string;
    balance: number;
    balance_updated_at: string;
    auto_approve: boolean;
    address: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    created_at: string;
    updated_at: string;
    is_amount_locked: boolean;
  };
}

interface CardActionResponse {
  status: boolean;
  message: string;
}

interface ExchangeRateRequest {
  base_currency: string;
  exchange_amount: number;
  quote_currency: string;
}

interface ExchangeRateResponse {
  status: boolean;
  message: string;
  data: {
    base_currency: string;
    base_amount: number;
    exchange_rate: number;
    quote_currency: string;
    quote_amount: number;
  };
}

interface WalletVerificationResponse {
  status: boolean;
  message: string;
  data: {
    wallet_org: string;
    wallet_name: string;
    wallet_number: string;
    wallet_type: string;
    currency_code: string;
    currency_name: string;
  };
}

interface WalletToWalletTransferRequest {
  source_wallet_number: string;
  destination_wallet_number: string;
  amount: number;
  description: string;
  transaction_pin: number;
}

interface WalletToWalletTransferResponse {
  status: boolean;
  message: string;
  data: {
    status: boolean;
    message: string;
    data: any;
  };
}

interface FixedDepositProduct {
  id: string;
  organization_id: string;
  currency_id: string;
  status_id: string;
  name: string;
  code: string;
  description: string | null;
  min_amount: string;
  max_amount: string | null;
  tenure_type: string;
  tenure_min_period: number;
  tenure_max_period: number | null;
  interest_rate: string;
  is_reoccuring_interest: boolean;
  is_interest_compounded: boolean;
  interest_payout: string;
  allow_premature_withdrawal: boolean;
  premature_withdrawal_penalty_type: string;
  premature_withdrawal_penalty_value: string | null;
  premature_withdrawal_penalty_min_amount: string | null;
  premature_withdrawal_penalty_max_amount: string | null;
  auto_rollover_on_maturity: boolean;
  send_maturity_notification: boolean;
  management_fee_type: string;
  management_fee_amount: string;
  management_fee_min_amount: string;
  management_fee_max_amount: string;
  processing_fee_type: string;
  processing_fee_amount: string;
  processing_fee_min_amount: string;
  processing_fee_max_amount: string;
  is_kyc_required: boolean;
  is_minimum_balance_required: boolean;
  minimum_balance_amount: string | null;
  additional_field: string | null;
  meta_data: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: {
    id: string;
    category: string;
    slug: string;
    label: string;
    description: string;
    color: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

interface FixedDepositProductsResponse {
  status: boolean;
  message: string;
  data: {
    current_page: number;
    data: FixedDepositProduct[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: any[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

interface FixedDepositCalculatorRequest {
  deposit_amount: number;
  product_id: string;
  desired_maturity_tenure: string;
}

interface FixedDepositCalculatorResponse {
  status: boolean;
  message: string;
  data: {
    product_terms: {
      tenure_periods: number;
      tenure_unit: string;
      interest_rate: string;
      payout_frequency: string;
      compounding: boolean;
      reoccurring_interest: boolean;
    };
    amount_summary: {
      currency_code: string;
      currency_symbol: string;
      principal: number;
      total_interest: number;
      final_amount_on_maturity: number;
      early_withdrawal_penalty: {
        type: string;
        value: string;
        min_amount: number | null;
        max_amount: number | null;
        calculated_amount: number;
        description: string;
      };
    };
    interest_schedule: Array<{
      period: number;
      tenure_unit: string;
      start_date: string;
      end_date: string;
      days: number;
      principal: number;
      interest: number;
      is_compounded: boolean;
      is_reoccuring: boolean;
      type: string;
    }>;
  };
}

interface FixedDepositContractRequest {
  product_id: string;
  deposit_amount: number;
  desired_maturity_tenure: string;
  preferred_interest_payout_duration: string;
  auto_rollover_on_maturity: boolean;
}

interface FixedDepositContractResponse {
  status: boolean;
  message: string;
  data: any;
}

interface FixedDepositContract {
  id: string;
  organization_id: string;
  currency_id: string;
  status_id: string;
  depositor_id: string;
  product_id: string;
  created_by: string;
  fixed_deposit_reference: string;
  deposit_amount: string;
  deposit_date: string;
  maturity_date: string;
  notes: string | null;
  expected_interest_amount: string;
  total_interest_amount_earned: string;
  last_payout_amount: string | null;
  last_payout_date: string | null;
  is_principal_returned: boolean;
  principal_returned_ref: string | null;
  ref_name: string;
  ref_code: string;
  ref_min_amount: string;
  ref_max_amount: string;
  ref_tenure_type: string;
  ref_tenure_min_period: string;
  ref_tenure_max_period: string;
  ref_interest_rate: string;
  ref_is_reoccuring_interest: boolean;
  ref_is_interest_compounded: boolean;
  ref_allow_premature_withdrawal: boolean;
  ref_premature_withdrawal_penalty_type: string;
  ref_premature_withdrawal_penalty_value: string;
  ref_premature_withdrawal_penalty_min_amount: string | null;
  ref_premature_withdrawal_penalty_max_amount: string | null;
  ref_auto_rollover_on_maturity: boolean;
  ref_send_maturity_notification: boolean;
  ref_management_fee_type: string;
  ref_management_fee_amount: string;
  ref_management_fee_min_amount: string;
  ref_management_fee_max_amount: string;
  ref_processing_fee_type: string;
  ref_processing_fee_amount: string;
  ref_processing_fee_min_amount: string;
  ref_processing_fee_max_amount: string;
  additional_field: string | null;
  meta_data: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: {
    id: string;
    category: string;
    slug: string;
    label: string;
    description: string;
    color: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

interface FixedDepositContractsResponse {
  status: boolean;
  message: string;
  data: {
    current_page: number;
    data: FixedDepositContract[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: any[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

interface KycVerificationLinkRequest {
  id_type: string;
  id_value: string;
  customer_wallet_number_or_uuid: string;
  transaction_pin: string;
}

interface KycVerificationLinkResponse {
  status: boolean;
  message: string;
  data?: any;
}

class ApiService {
  private token: string | null = null;
  private appId: string | null = null;

  async initialize(): Promise<void> {
    // Load stored token and app ID on initialization
    this.token = await storageService.getAuthToken();
    this.appId = await storageService.getAppId();
  }

  async setToken(token: string): Promise<void> {
    this.token = token;
    await storageService.setAuthToken(token);
  }

  getToken(): string | null {
    return this.token;
  }

  async setAppId(appId: string): Promise<void> {
    this.appId = appId;
    await storageService.setAppId(appId);
  }

  getAppId(): string | null {
    return this.appId;
  }

  async clearToken(): Promise<void> {
    this.token = null;
    await storageService.removeAuthToken();
  }

  private parseErrorMessage(errorText: string): string {
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        return errorData.message;
      }
      return errorText;
    } catch {
      return errorText;
    }
  }

  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.appId) {
      headers['AppID'] = this.appId;
    }

    console.log('Making API request:', {
      url,
      method: options.method || 'GET',
      headers: {
        ...headers,
        'Authorization': this.token ? 'Bearer [REDACTED]' : undefined,
      },
      body: options.body,
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseText = await response.text();
    console.log('API response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        await this.clearToken();
        throw new Error('Session expired. Please login again.');
      }
      
      // Parse and return user-friendly error message
      const errorMessage = this.parseErrorMessage(responseText);
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseText);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${responseText}`);
    }
  }

  async getOrganization(orgSlug: string = 'MyBeller'): Promise<OrganizationResponse> {
    return this.makeRequest<OrganizationResponse>(`/organizations/${orgSlug}`);
  }

  async getAppSettings(): Promise<AppSettingsResponse> {
    if (!this.appId) {
      throw new Error('App ID is required for app settings');
    }
    return this.makeRequest<AppSettingsResponse>('/customized-app-api/public-app/settings');
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.status && response.data.token) {
      await this.setToken(response.data.token);
    }

    return response;
  }

  async getProfile(): Promise<ProfileResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<ProfileResponse>('/profile');
  }

  async getWallets(page: number = 1, itemsPerPage: number = 15): Promise<WalletsResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<WalletsResponse>(
      `/customers/wallets?page=${page}&items_per_page=${itemsPerPage}`
    );
  }

  async getTransactions(page: number = 1, itemsPerPage: number = 15): Promise<TransactionResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<TransactionResponse>(
      `/customers/wallet-transactions?page=${page}&items_per_page=${itemsPerPage}`
    );
  }

  async getBanks(): Promise<BanksResponse> {
    return this.makeRequest<BanksResponse>('/banks?items_per_page=300');
  }

  async verifyBankAccount(accountNumber: string, bankId: string): Promise<BankAccountVerificationResponse> {
    return this.makeRequest<BankAccountVerificationResponse>(
      `/verify/bank-account/${accountNumber}/${bankId}`
    );
  }

  async getDataBundles(networkProvider: string): Promise<DataBundlesResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<DataBundlesResponse>(`/transactions/get-data-bundles/${networkProvider}`);
  }

  async buyDataBundle(request: DataBundleRequest): Promise<DataBundleResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<DataBundleResponse>('/transactions/buy-data-bundle', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async buyAirtime(request: AirtimeRequest): Promise<AirtimeResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<AirtimeResponse>('/transactions/buy-airtime', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async initiateWalletToBankTransfer(request: WalletToBankTransferRequest): Promise<WalletToBankTransferResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<WalletToBankTransferResponse>('/customers/wallet-to-bank-transaction/initiate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async processWalletToBankTransfer(request: WalletToBankTransferProcessRequest): Promise<WalletToBankTransferResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<WalletToBankTransferResponse>('/customers/wallet-to-bank-transaction/process', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async initiateCryptoWalletTransfer(request: CryptoWalletTransferInitiateRequest): Promise<CryptoWalletTransferInitiateResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }
    return this.makeRequest<CryptoWalletTransferInitiateResponse>('/customers/crypto-wallet-transaction/initiate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async processCryptoWalletTransfer(request: CryptoWalletTransferProcessRequest): Promise<CryptoWalletTransferProcessResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }
    return this.makeRequest<CryptoWalletTransferProcessResponse>('/customers/crypto-wallet-transaction/process', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getMeterServices(): Promise<MeterServicesResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<MeterServicesResponse>('/transactions/get-meter-services');
  }

  async verifyMeterNumber(request: MeterVerificationRequest): Promise<MeterVerificationResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<MeterVerificationResponse>('/transactions/verify-meter-number', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async buyElectricity(request: ElectricityPurchaseRequest): Promise<ElectricityPurchaseResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<ElectricityPurchaseResponse>('/transactions/buy-electricity', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getCableTvSubscriptions(cableTvType: string): Promise<CableTvSubscriptionsResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<CableTvSubscriptionsResponse>(`/transactions/get-subscriptions?cableTvType=${cableTvType}`);
  }

  async verifySmartCard(request: SmartCardVerificationRequest): Promise<SmartCardVerificationResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<SmartCardVerificationResponse>('/transactions/verify-smart-card', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async subscribeCableTv(request: CableTvSubscriptionRequest): Promise<CableTvSubscriptionResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<CableTvSubscriptionResponse>('/transactions/subscribe-cable-tv', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<ChangePasswordResponse>('/change-password', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async changeTransactionPin(request: ChangePinRequest): Promise<ChangePinResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<ChangePinResponse>('/change-transaction-pin', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Virtual Card Management APIs
  async getVirtualCards(page: number = 1, itemsPerPage: number = 20): Promise<VirtualCardsResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<VirtualCardsResponse>(
      `/card-mgt/cards/virtual/list?page=${page}&items_per_page=${itemsPerPage}`
    );
  }

  async createVirtualCard(request: CreateVirtualCardRequest): Promise<CreateVirtualCardResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<CreateVirtualCardResponse>('/card-mgt/cards/virtual/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getVirtualCardBalance(cardId: string): Promise<VirtualCardBalanceResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<VirtualCardBalanceResponse>(`/card-mgt/cards/virtual/${cardId}/balance`);
  }

  async blockVirtualCard(cardId: string): Promise<CardActionResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<CardActionResponse>(`/card-mgt/cards/${cardId}/block`, {
      method: 'PATCH',
    });
  }

  async unblockVirtualCard(cardId: string): Promise<CardActionResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<CardActionResponse>(`/card-mgt/cards/${cardId}/unblock`, {
      method: 'PATCH',
    });
  }

  // Exchange Rate API
  async getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<ExchangeRateResponse>('/currencies/exchange/rate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Wallet to Wallet Transfer APIs
  async verifyWalletNumber(walletNumber: string): Promise<WalletVerificationResponse> {
    return this.makeRequest<WalletVerificationResponse>(`/verify/wallet-number/${walletNumber}`);
  }

  async processWalletToWalletTransfer(request: WalletToWalletTransferRequest): Promise<WalletToWalletTransferResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<WalletToWalletTransferResponse>('/customers/wallet-to-wallet-transaction/process', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Fixed Deposit APIs
  async getFixedDepositProducts(page: number = 1, itemsPerPage: number = 20): Promise<FixedDepositProductsResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<FixedDepositProductsResponse>(
      `/fixed-deposit-mgt/fixed-deposit-products?page=${page}&items_per_page=${itemsPerPage}`
    );
  }

  async calculateFixedDepositInterest(request: FixedDepositCalculatorRequest): Promise<FixedDepositCalculatorResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<FixedDepositCalculatorResponse>('/fixed-deposit-mgt/fixed-deposit-products/interest/calculator', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async createFixedDepositContract(request: FixedDepositContractRequest): Promise<FixedDepositContractResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<FixedDepositContractResponse>('/fixed-deposit-mgt/fixed-deposit-contracts', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getFixedDepositContracts(page: number = 1, itemsPerPage: number = 20): Promise<FixedDepositContractsResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<FixedDepositContractsResponse>(
      `/fixed-deposit-mgt/fixed-deposit-contracts?page=${page}&items_per_page=${itemsPerPage}`
    );
  }

  // KYC Verification APIs
  async linkKycVerification(request: KycVerificationLinkRequest): Promise<KycVerificationLinkResponse> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    return this.makeRequest<KycVerificationLinkResponse>('/customers/kyc-verifications/link/verified', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async logout(): Promise<void> {
    try {
      // Try to call logout API if token exists
      if (this.token) {
        await this.makeRequest('/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with cleanup even if API call fails
    } finally {
      // Always clear local data
      await this.clearToken();
      await storageService.clearAppData();
    }
  }
}

export const apiService = new ApiService();