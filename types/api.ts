export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: boolean;
  message: string;
  data: {
    token: string;
    profile: UserProfile;
    role: any[];
  };
}

export interface UserProfile {
  id: string;
  organization_id: string;
  title: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string;
  date_of_birth?: string;
  job_title: string | null;
  email: string;
  username: string;
  email_verified_at: string;
  telephone: string;
  telephone_verified_at: string | null;
  physical_address: string | null;
  unique_code: string | null;
  status_id: string;
  user_type_id?: string;
  status_reason: string | null;
  has_ever_loggedin: boolean;
  last_loggedin_at: string | null;
  created_at: string;
  updated_at: string;
  full_name: string;
  profile_image_id: string | null;
  roles?: any[];
  getPrimaryWallet?: Wallet;
  get_primary_wallet?: Wallet;
  profile_image_url?: string | null;
  ads?: Record<string, Advertisement>;
  first_kyc_verification?: KYCVerification;
  status?: Status;
  user_type?: UserType;
}

export interface Wallet {
  id: string;
  organization_id: string;
  walletable_item: string;
  walletable_id: string;
  currency_id: string;
  wallet_type_id: string;
  account_officer_id: string;
  bank_id: string | null;
  wallet_number: string;
  balance: string;
  is_balance_visible: boolean;
  status_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  bank?: Bank;
  status?: Status;
  currency?: Currency;
  wallet_type?: WalletType;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  short_code: string;
  swift_code: string;
  branch_code: string | null;
  address: string | null;
  currency_id: string;
  country_id: string;
  status_id: string;
  contact_email: string;
  contact_number: string;
  website: string;
  is_verified: boolean;
  can_create_virtual_accounts: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Currency {
  id: string;
  name: string;
  type: string;
  symbol: string;
  code: string;
  svg_icon: string | null;
  status_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WalletType {
  id: string;
  organization_id: string;
  name: string;
  currency_id: string | null;
  status_id: string;
  produce_code: string | null;
  can_be_used_for_transactions: boolean;
  minimum_balance: string;
  registration_fee: string;
  monthly_maintenance_charge_fee: string;
  card_withdrawal_fee: string;
  withdrawal_fee: string;
  interest_rate_pct: string;
  maximum_credit_limit: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Status {
  id: string;
  category: string;
  slug: string;
  label: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserType {
  id: string;
  type: string;
  slug: string;
  description: string;
  status_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Advertisement {
  subject: string;
  content: string;
  banner_url: string;
  content_redirect_url: string;
  additional_parameters: {
    type: string;
    start_date: string;
    end_date: string;
    priority: number;
    status: string;
    cta_text: string;
    views_count: number;
    clicks_count: number;
    target_audience: string;
    language: string;
  };
}

export interface KYCVerification {
  documentIDNo: string;
  documentType: string;
  image_url: string | null;
  imageEncoding: string;
  entityData: {
    first_name: string;
    last_name: string;
    middle_name: string;
    phone_number: string;
    date_of_birth: string;
    gender: string;
    nin: string;
  };
}

export interface ProfileResponse {
  status: boolean;
  message: string;
  data: UserProfile;
}

export interface Organization {
  id: string;
  full_name: string;
  short_name: string;
  description: string;
  physical_address: string;
  existing_website: string;
  access_subdomain: string;
  org_identity_code: string;
  is_access_subdomain_active: boolean;
  ussd_substring: string;
  is_ussd_substring_active: boolean;
  official_email: string;
  official_contact_phone: string;
  is_local_default_organization: boolean;
  primary_currency_id: string;
  secondary_currency_ids: string | null;
  status_id: string;
  country_id: string;
  org_category_id: string;
  secondary_org_category_ids: string | null;
  status_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  access_subdomain_alt: string | null;
  is_access_subdomain_active_alt: boolean;
  whatsapp_telephone: string | null;
  whatsapp_username: string | null;
  whatsapp_secret_key: string | null;
  is_whatsapp_active: boolean;
  is_org_api_based: boolean;
  logo_id: string | null;
  logo_url: string | null;
  public_logo_url: string | null;
  customized_app_displayable_menu_items: {
    [key: string]: boolean;
  };
  
   customized_app_settings: {
    [key: string]: boolean;
  };

  organization_subscribed_features: {
    [key: string]: boolean;
  };

}

export interface OrganizationResponse {
  status: boolean;
  message: string;
  data: Organization;
}

export interface AppSettings {
  'customized-app-name': string;
  'customized-app-primary-color': string;
  'customized-app-secondary-color': string;
  'customized-app-tertiary-color': string;
  'customized-app-logo': string;
  'customized-app-icon': string;
  'customized-app-logo-id': string;
  'customized-app-logo-url': string;
  'customized-app-icon-id': string;
  'customized-app-icon-url': string;
}

export interface AppSettingsResponse {
  status: boolean;
  message: string;
  data: AppSettings;
}