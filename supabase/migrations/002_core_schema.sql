-- ============================================================
-- OpenPMS Core Schema
-- ============================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'receptionist', 'cleaner', 'owner');
CREATE TYPE reservation_status AS ENUM ('confirmed', 'cancelled', 'checked_in', 'checked_out', 'no_show');
CREATE TYPE reservation_source AS ENUM ('direct', 'airbnb', 'booking', 'expedia', 'vrbo', 'other');
CREATE TYPE task_type AS ENUM ('cleaning', 'maintenance', 'inspection', 'laundry', 'restock', 'custom');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE message_channel AS ENUM ('email', 'sms', 'whatsapp', 'push');
CREATE TYPE message_trigger_type AS ENUM ('booking_confirmed', 'pre_checkin', 'checkin_day', 'during_stay', 'pre_checkout', 'post_checkout', 'review_request', 'manual');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');
CREATE TYPE sef_bulletin_status AS ENUM ('pending', 'submitted', 'accepted', 'rejected', 'error');
CREATE TYPE sef_method AS ENUM ('web_service', 'dat_file');
CREATE TYPE invoice_provider AS ENUM ('moloni', 'invoicexpress', 'manual');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'cancelled', 'voided');
CREATE TYPE pricing_source AS ENUM ('manual', 'pricelabs', 'beyond', 'wheelhouse');
CREATE TYPE expense_category AS ENUM ('cleaning', 'maintenance', 'supplies', 'utilities', 'insurance', 'taxes', 'marketing', 'commission', 'other');
CREATE TYPE commission_type AS ENUM ('percentage', 'fixed');
CREATE TYPE statement_status AS ENUM ('draft', 'approved', 'sent', 'paid');
CREATE TYPE integration_type AS ENUM ('sef', 'moloni', 'invoicexpress', 'pricelabs', 'beyond', 'smtp', 'twilio', 'whatsapp');
CREATE TYPE ai_provider AS ENUM ('openai', 'anthropic', 'google');
CREATE TYPE rate_type AS ENUM ('per_night_per_guest', 'per_night_flat', 'per_stay_flat', 'percentage');
CREATE TYPE tax_exemption_type AS ENUM ('age', 'residency', 'medical', 'business', 'government', 'custom');
CREATE TYPE reporting_period AS ENUM ('monthly', 'quarterly', 'annually');

-- ============================================================
-- 1. settings (key/value store)
-- ============================================================
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. user_profiles (extends auth.users)
-- ============================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  totp_secret BYTEA, -- encrypted with pgcrypto
  recovery_codes JSONB, -- array of bcrypt hashes
  trusted_devices JSONB DEFAULT '[]', -- [{hash, expires_at}]
  preferred_locale TEXT NOT NULL DEFAULT 'pt',
  timezone TEXT NOT NULL DEFAULT 'Europe/Lisbon',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. owners
-- ============================================================
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  nif TEXT,
  iban TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER owners_updated_at BEFORE UPDATE ON owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. tax_jurisdictions
-- ============================================================
CREATE TABLE tax_jurisdictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country_code CHAR(3) NOT NULL DEFAULT 'PRT',
  region TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  reporting_period reporting_period NOT NULL DEFAULT 'monthly',
  reporting_deadline_day INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER tax_jurisdictions_updated_at BEFORE UPDATE ON tax_jurisdictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 5. tax_rules
-- ============================================================
CREATE TABLE tax_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jurisdiction_id UUID NOT NULL REFERENCES tax_jurisdictions(id) ON DELETE CASCADE,
  rate_type rate_type NOT NULL DEFAULT 'per_night_per_guest',
  rate_amount NUMERIC(10,4) NOT NULL,
  season_start DATE,
  season_end DATE,
  max_nights INTEGER,
  min_guest_age INTEGER DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. tax_exemptions
-- ============================================================
CREATE TABLE tax_exemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jurisdiction_id UUID NOT NULL REFERENCES tax_jurisdictions(id) ON DELETE CASCADE,
  type tax_exemption_type NOT NULL,
  description TEXT,
  condition_json JSONB DEFAULT '{}',
  requires_proof BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. properties
-- ============================================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country_code CHAR(3) NOT NULL DEFAULT 'PRT',
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  max_guests INTEGER NOT NULL DEFAULT 1,
  num_bedrooms INTEGER NOT NULL DEFAULT 1,
  num_bathrooms INTEGER NOT NULL DEFAULT 1,
  al_license TEXT,
  check_in_time TIME NOT NULL DEFAULT '15:00',
  check_out_time TIME NOT NULL DEFAULT '11:00',
  ical_urls JSONB DEFAULT '[]', -- [{name, url}]
  sef_property_id TEXT,
  sef_establishment_id TEXT,
  guest_portal_config JSONB DEFAULT '{}',
  wifi_name TEXT,
  wifi_password TEXT,
  door_code TEXT,
  house_rules TEXT,
  description TEXT,
  photos JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  owner_id UUID REFERENCES owners(id) ON DELETE SET NULL,
  tax_jurisdiction_id UUID REFERENCES tax_jurisdictions(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 8. staff
-- ============================================================
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'receptionist',
  permissions JSONB DEFAULT '{}',
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE UNIQUE INDEX staff_user_id_idx ON staff(user_id);

-- ============================================================
-- 9. reservations
-- ============================================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source reservation_source NOT NULL DEFAULT 'direct',
  external_id TEXT,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  num_guests INTEGER NOT NULL DEFAULT 1,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  num_nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
  nightly_rate NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  paid_amount NUMERIC(10,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  door_code TEXT,
  extras JSONB DEFAULT '{}',
  notes TEXT,
  status reservation_status NOT NULL DEFAULT 'confirmed',
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT check_dates CHECK (check_out > check_in)
);
CREATE TRIGGER reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX reservations_property_dates_idx ON reservations(property_id, check_in, check_out);
CREATE INDEX reservations_status_idx ON reservations(status);

-- ============================================================
-- 10. guests
-- ============================================================
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  nationality_icao CHAR(3),
  document_type TEXT,
  document_number TEXT,
  document_country CHAR(3),
  document_expiry DATE,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_portuguese BOOLEAN GENERATED ALWAYS AS (nationality_icao = 'PRT') STORED,
  sef_required BOOLEAN GENERATED ALWAYS AS (nationality_icao != 'PRT' AND nationality_icao IS NOT NULL) STORED,
  checkin_completed_at TIMESTAMPTZ,
  signature TEXT, -- base64 signature image
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX guests_reservation_idx ON guests(reservation_id);

-- ============================================================
-- 11. checkin_links
-- ============================================================
CREATE TABLE checkin_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX checkin_links_token_idx ON checkin_links(token);

-- ============================================================
-- 12. message_templates
-- ============================================================
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  channel message_channel NOT NULL DEFAULT 'email',
  subject JSONB DEFAULT '{}', -- {pt, en, fr}
  body JSONB NOT NULL DEFAULT '{}', -- {pt, en, fr}
  trigger_type message_trigger_type NOT NULL DEFAULT 'manual',
  conditions JSONB DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER message_templates_updated_at BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 13. message_log
-- ============================================================
CREATE TABLE message_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  channel message_channel NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status message_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX message_log_reservation_idx ON message_log(reservation_id);

-- ============================================================
-- 14. tasks
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  type task_type NOT NULL DEFAULT 'cleaning',
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  checklist JSONB DEFAULT '[]', -- [{item, done}]
  photos JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX tasks_assigned_idx ON tasks(assigned_to);
CREATE INDEX tasks_status_idx ON tasks(status);

-- ============================================================
-- 15. tax_calculations
-- ============================================================
CREATE TABLE tax_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  jurisdiction_id UUID NOT NULL REFERENCES tax_jurisdictions(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES tax_rules(id) ON DELETE SET NULL,
  taxable_nights INTEGER NOT NULL DEFAULT 0,
  taxable_guests INTEGER NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tax_calculations_reservation_idx ON tax_calculations(reservation_id);

-- ============================================================
-- 16. sef_bulletins
-- ============================================================
CREATE TABLE sef_bulletins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  status sef_bulletin_status NOT NULL DEFAULT 'pending',
  method sef_method NOT NULL DEFAULT 'web_service',
  xml_content TEXT,
  response_xml TEXT,
  deadline TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER sef_bulletins_updated_at BEFORE UPDATE ON sef_bulletins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 17. icao_countries
-- ============================================================
CREATE TABLE icao_countries (
  code CHAR(3) PRIMARY KEY,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  nationality_pt TEXT NOT NULL,
  nationality_en TEXT NOT NULL,
  nationality_fr TEXT NOT NULL
);

-- ============================================================
-- 18. invoices
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  provider invoice_provider NOT NULL DEFAULT 'manual',
  external_id TEXT,
  invoice_number TEXT,
  customer_name TEXT NOT NULL,
  customer_nif TEXT,
  net_amount NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status invoice_status NOT NULL DEFAULT 'draft',
  issued_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 19. pricing_calendar
-- ============================================================
CREATE TABLE pricing_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  base_price NUMERIC(10,2),
  recommended_price NUMERIC(10,2),
  final_price NUMERIC(10,2),
  min_nights INTEGER DEFAULT 1,
  source pricing_source NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER pricing_calendar_updated_at BEFORE UPDATE ON pricing_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE UNIQUE INDEX pricing_calendar_property_date_idx ON pricing_calendar(property_id, date);

-- ============================================================
-- 20. pricing_config
-- ============================================================
CREATE TABLE pricing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  provider pricing_source NOT NULL DEFAULT 'manual',
  api_config BYTEA, -- encrypted
  min_price NUMERIC(10,2),
  max_price NUMERIC(10,2),
  auto_sync BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER pricing_config_updated_at BEFORE UPDATE ON pricing_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 21. expenses
-- ============================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  category expense_category NOT NULL DEFAULT 'other',
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 22. owner_properties
-- ============================================================
CREATE TABLE owner_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  commission_type commission_type NOT NULL DEFAULT 'percentage',
  commission_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, property_id)
);

-- ============================================================
-- 23. owner_statements
-- ============================================================
CREATE TABLE owner_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  pdf_path TEXT,
  status statement_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER owner_statements_updated_at BEFORE UPDATE ON owner_statements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 24. integration_config
-- ============================================================
CREATE TABLE integration_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type integration_type NOT NULL UNIQUE,
  config BYTEA, -- encrypted with pgcrypto
  enabled BOOLEAN NOT NULL DEFAULT false,
  last_test_at TIMESTAMPTZ,
  last_test_success BOOLEAN,
  last_test_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER integration_config_updated_at BEFORE UPDATE ON integration_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 25. ai_config
-- ============================================================
CREATE TABLE ai_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider ai_provider NOT NULL,
  api_key BYTEA, -- encrypted with pgcrypto
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  features_enabled JSONB DEFAULT '{}',
  monthly_budget_limit NUMERIC(10,2) DEFAULT 50.00,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER ai_config_updated_at BEFORE UPDATE ON ai_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 26. ai_usage_log
-- ============================================================
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(10,6) NOT NULL DEFAULT 0,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_log_feature_idx ON ai_usage_log(feature);
CREATE INDEX ai_usage_log_created_idx ON ai_usage_log(created_at);
