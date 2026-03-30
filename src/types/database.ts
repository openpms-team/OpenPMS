// ============================================================
// Database types mirroring the PostgreSQL schema
// ============================================================

// Enums
export type UserRole = 'admin' | 'manager' | 'receptionist' | 'cleaner' | 'owner'
export type ReservationStatus = 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out' | 'no_show'
export type ReservationSource = 'direct' | 'airbnb' | 'booking' | 'expedia' | 'vrbo' | 'other'
export type TaskType = 'cleaning' | 'maintenance' | 'inspection' | 'laundry' | 'restock' | 'custom'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type MessageChannel = 'email' | 'sms' | 'whatsapp' | 'push'
export type MessageTriggerType = 'booking_confirmed' | 'pre_checkin' | 'checkin_day' | 'during_stay' | 'pre_checkout' | 'post_checkout' | 'review_request' | 'manual'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
export type SefBulletinStatus = 'pending' | 'submitted' | 'accepted' | 'rejected' | 'error'
export type SefMethod = 'web_service' | 'dat_file'
export type InvoiceProvider = 'moloni' | 'invoicexpress' | 'manual'
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'voided'
export type PricingSource = 'manual' | 'pricelabs' | 'beyond' | 'wheelhouse'
export type ExpenseCategory = 'cleaning' | 'maintenance' | 'supplies' | 'utilities' | 'insurance' | 'taxes' | 'marketing' | 'commission' | 'other'
export type CommissionType = 'percentage' | 'fixed'
export type StatementStatus = 'draft' | 'approved' | 'sent' | 'paid'
export type IntegrationType = 'sef' | 'moloni' | 'invoicexpress' | 'pricelabs' | 'beyond' | 'smtp' | 'twilio' | 'whatsapp'
export type AiProvider = 'openai' | 'anthropic' | 'google'
export type RateType = 'per_night_per_guest' | 'per_night_flat' | 'per_stay_flat' | 'percentage'
export type TaxExemptionType = 'age' | 'residency' | 'medical' | 'business' | 'government' | 'custom'
export type ReportingPeriod = 'monthly' | 'quarterly' | 'annually'

// Base type with common fields
interface BaseRow {
  id: string
  created_at: string
}

interface WithUpdatedAt {
  updated_at: string | null
}

// ============================================================
// Table row types
// ============================================================

export interface Setting {
  key: string
  value: Record<string, unknown>
  created_at: string
  updated_at: string | null
}

export interface UserProfile extends BaseRow, WithUpdatedAt {
  totp_enabled: boolean
  totp_secret: string | null
  recovery_codes: string[] | null
  trusted_devices: Array<{ hash: string; expires_at: string }> | null
  preferred_locale: string
  timezone: string
}

export interface Owner extends BaseRow, WithUpdatedAt {
  user_id: string | null
  name: string
  email: string | null
  phone: string | null
  nif: string | null
  iban: string | null
  notes: string | null
}

export interface TaxJurisdiction extends BaseRow, WithUpdatedAt {
  name: string
  country_code: string
  region: string | null
  currency: string
  reporting_period: ReportingPeriod
  reporting_deadline_day: number
}

export interface TaxRule extends BaseRow {
  jurisdiction_id: string
  rate_type: RateType
  rate_amount: number
  season_start: string | null
  season_end: string | null
  max_nights: number | null
  min_guest_age: number
  priority: number
}

export interface TaxExemption extends BaseRow {
  jurisdiction_id: string
  type: TaxExemptionType
  description: string | null
  condition_json: Record<string, unknown>
  requires_proof: boolean
}

export interface Property extends BaseRow, WithUpdatedAt {
  name: string
  address: string | null
  city: string | null
  postal_code: string | null
  country_code: string
  latitude: number | null
  longitude: number | null
  max_guests: number
  num_bedrooms: number
  num_bathrooms: number
  al_license: string | null
  check_in_time: string
  check_out_time: string
  ical_urls: Array<{ name: string; url: string }>
  sef_property_id: string | null
  sef_establishment_id: string | null
  guest_portal_config: Record<string, unknown>
  wifi_name: string | null
  wifi_password: string | null
  door_code: string | null
  house_rules: string | null
  description: string | null
  photos: string[]
  amenities: string[]
  owner_id: string | null
  tax_jurisdiction_id: string | null
  active: boolean
}

export interface Staff extends BaseRow, WithUpdatedAt {
  user_id: string
  name: string
  role: UserRole
  permissions: Record<string, unknown>
  phone: string | null
  active: boolean
}

export interface Reservation extends BaseRow, WithUpdatedAt {
  property_id: string
  source: ReservationSource
  external_id: string | null
  guest_name: string
  guest_email: string | null
  guest_phone: string | null
  num_guests: number
  check_in: string
  check_out: string
  num_nights: number
  nightly_rate: number | null
  total_amount: number | null
  paid_amount: number
  currency: string
  door_code: string | null
  extras: Record<string, unknown>
  notes: string | null
  status: ReservationStatus
  cancelled_at: string | null
}

export interface Guest extends BaseRow, WithUpdatedAt {
  reservation_id: string
  is_primary: boolean
  full_name: string
  date_of_birth: string | null
  nationality_icao: string | null
  document_type: string | null
  document_number: string | null
  document_country: string | null
  document_expiry: string | null
  email: string | null
  phone: string | null
  address: string | null
  is_portuguese: boolean | null
  sef_required: boolean | null
  checkin_completed_at: string | null
  signature: string | null
}

export interface CheckinLink extends BaseRow {
  reservation_id: string
  token: string
  expires_at: string
}

export interface MessageTemplate extends BaseRow, WithUpdatedAt {
  name: string
  channel: MessageChannel
  subject: Record<string, string>
  body: Record<string, string>
  trigger_type: MessageTriggerType
  conditions: Record<string, unknown>
  active: boolean
}

export interface MessageLog extends BaseRow {
  reservation_id: string | null
  template_id: string | null
  channel: MessageChannel
  recipient: string
  subject: string | null
  body: string | null
  status: MessageStatus
  sent_at: string | null
  error_message: string | null
}

export interface Task extends BaseRow, WithUpdatedAt {
  property_id: string | null
  reservation_id: string | null
  type: TaskType
  title: string
  description: string | null
  assigned_to: string | null
  status: TaskStatus
  priority: number
  due_date: string | null
  completed_at: string | null
  checklist: Array<{ item: string; done: boolean }>
  photos: string[]
  notes: string | null
}

export interface TaxCalculation extends BaseRow {
  reservation_id: string
  jurisdiction_id: string
  rule_id: string | null
  taxable_nights: number
  taxable_guests: number
  tax_amount: number
  breakdown: Record<string, unknown>
}

export interface SefBulletin extends BaseRow, WithUpdatedAt {
  reservation_id: string
  guest_id: string
  status: SefBulletinStatus
  method: SefMethod
  xml_content: string | null
  response_xml: string | null
  deadline: string | null
  submitted_at: string | null
  error_message: string | null
}

export interface IcaoCountry {
  code: string
  name_pt: string
  name_en: string
  name_fr: string
  nationality_pt: string
  nationality_en: string
  nationality_fr: string
}

export interface Invoice extends BaseRow, WithUpdatedAt {
  reservation_id: string | null
  provider: InvoiceProvider
  external_id: string | null
  invoice_number: string | null
  customer_name: string
  customer_nif: string | null
  net_amount: number
  tax_amount: number
  total_amount: number
  currency: string
  status: InvoiceStatus
  issued_at: string | null
  pdf_url: string | null
}

export interface PricingCalendar extends BaseRow, WithUpdatedAt {
  property_id: string
  date: string
  base_price: number | null
  recommended_price: number | null
  final_price: number | null
  min_nights: number
  source: PricingSource
}

export interface PricingConfig extends BaseRow, WithUpdatedAt {
  property_id: string
  provider: PricingSource
  api_config: string | null
  min_price: number | null
  max_price: number | null
  auto_sync: boolean
}

export interface Expense extends BaseRow, WithUpdatedAt {
  property_id: string | null
  reservation_id: string | null
  category: ExpenseCategory
  description: string | null
  amount: number
  currency: string
  date: string
  receipt_path: string | null
  notes: string | null
}

export interface OwnerProperty extends BaseRow {
  owner_id: string
  property_id: string
  commission_type: CommissionType
  commission_value: number
}

export interface OwnerStatement extends BaseRow, WithUpdatedAt {
  owner_id: string
  period_start: string
  period_end: string
  total_revenue: number
  total_expenses: number
  commission_amount: number
  net_amount: number
  pdf_path: string | null
  status: StatementStatus
}

export interface IntegrationConfig extends BaseRow, WithUpdatedAt {
  type: IntegrationType
  config: string | null
  enabled: boolean
  last_test_at: string | null
  last_test_success: boolean | null
  last_test_error: string | null
}

export interface AiConfig extends BaseRow, WithUpdatedAt {
  provider: AiProvider
  api_key: string | null
  model: string
  features_enabled: Record<string, boolean>
  monthly_budget_limit: number
  active: boolean
}

export interface AiUsageLog extends BaseRow {
  feature: string
  input_tokens: number
  output_tokens: number
  estimated_cost: number
  reservation_id: string | null
  property_id: string | null
}

// ============================================================
// Insert types (omit generated fields)
// ============================================================

export type PropertyInsert = Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>> & {
  name: string
  max_guests: number
  num_bedrooms: number
  num_bathrooms: number
  check_in_time: string
  check_out_time: string
  active: boolean
  country_code: string
}
export type PropertyUpdate = Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>

export type ReservationInsert = Partial<Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'num_nights'>> & {
  property_id: string
  guest_name: string
  num_guests: number
  check_in: string
  check_out: string
  status: ReservationStatus
  currency: string
}
export type ReservationUpdate = Partial<Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'num_nights'>>

export type GuestInsert = Partial<Omit<Guest, 'id' | 'created_at' | 'updated_at' | 'is_portuguese' | 'sef_required'>> & {
  reservation_id: string
  full_name: string
}
export type GuestUpdate = Partial<Omit<Guest, 'id' | 'created_at' | 'updated_at' | 'is_portuguese' | 'sef_required'>>

export type StaffInsert = Omit<Staff, 'id' | 'created_at' | 'updated_at'>
export type StaffUpdate = Partial<StaffInsert>

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>
export type TaskUpdate = Partial<TaskInsert>

export type OwnerInsert = Omit<Owner, 'id' | 'created_at' | 'updated_at'>
export type OwnerUpdate = Partial<OwnerInsert>

export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at'>
export type ExpenseUpdate = Partial<ExpenseInsert>

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>
export type InvoiceUpdate = Partial<InvoiceInsert>
