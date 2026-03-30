-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Helper: check if current user is admin or manager
CREATE OR REPLACE FUNCTION is_admin_or_manager() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: check if current user is any active staff
CREATE OR REPLACE FUNCTION is_active_staff() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff WHERE user_id = auth.uid() AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: get current staff id
CREATE OR REPLACE FUNCTION current_staff_id() RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM staff WHERE user_id = auth.uid() AND active = true LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- settings
-- ============================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_settings" ON settings FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "staff_read_settings" ON settings FOR SELECT
  USING (is_active_staff());

-- ============================================================
-- user_profiles
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON user_profiles FOR ALL
  USING (id = auth.uid());
CREATE POLICY "admin_read_profiles" ON user_profiles FOR SELECT
  USING (is_admin_or_manager());

-- ============================================================
-- owners
-- ============================================================
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_owners" ON owners FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "owner_read_self" ON owners FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- tax_jurisdictions
-- ============================================================
ALTER TABLE tax_jurisdictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_read_jurisdictions" ON tax_jurisdictions FOR SELECT
  USING (is_active_staff());
CREATE POLICY "admin_manager_jurisdictions" ON tax_jurisdictions FOR ALL
  USING (is_admin_or_manager());

-- ============================================================
-- tax_rules
-- ============================================================
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_read_tax_rules" ON tax_rules FOR SELECT
  USING (is_active_staff());
CREATE POLICY "admin_manager_tax_rules" ON tax_rules FOR ALL
  USING (is_admin_or_manager());

-- ============================================================
-- tax_exemptions
-- ============================================================
ALTER TABLE tax_exemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_read_tax_exemptions" ON tax_exemptions FOR SELECT
  USING (is_active_staff());
CREATE POLICY "admin_manager_tax_exemptions" ON tax_exemptions FOR ALL
  USING (is_admin_or_manager());

-- ============================================================
-- properties
-- ============================================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_properties" ON properties FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "staff_read_properties" ON properties FOR SELECT
  USING (is_active_staff());
CREATE POLICY "owner_read_own_properties" ON properties FOR SELECT
  USING (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()));

-- ============================================================
-- staff
-- ============================================================
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_staff" ON staff FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "staff_read_self" ON staff FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- reservations
-- ============================================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_reservations" ON reservations FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "receptionist_reservations" ON reservations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM staff WHERE user_id = auth.uid() AND role = 'receptionist' AND active = true
  ));
CREATE POLICY "cleaner_read_reservations" ON reservations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tasks t
    JOIN staff s ON t.assigned_to = s.id
    WHERE s.user_id = auth.uid() AND t.reservation_id = reservations.id
  ));
CREATE POLICY "owner_read_own_reservations" ON reservations FOR SELECT
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN owners o ON p.owner_id = o.id
    WHERE o.user_id = auth.uid()
  ));

-- ============================================================
-- guests
-- ============================================================
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_guests" ON guests FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "receptionist_guests" ON guests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM staff WHERE user_id = auth.uid() AND role = 'receptionist' AND active = true
  ));
-- Guest portal access is via checkin_links token, validated at app level

-- ============================================================
-- checkin_links
-- ============================================================
ALTER TABLE checkin_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_checkin_links" ON checkin_links FOR ALL
  USING (is_active_staff());
-- Public read by token is handled via service role in guest portal API
CREATE POLICY "public_read_checkin_links" ON checkin_links FOR SELECT
  USING (true);

-- ============================================================
-- message_templates
-- ============================================================
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_message_templates" ON message_templates FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "staff_read_message_templates" ON message_templates FOR SELECT
  USING (is_active_staff());

-- ============================================================
-- message_log
-- ============================================================
ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_message_log" ON message_log FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "receptionist_message_log" ON message_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM staff WHERE user_id = auth.uid() AND role = 'receptionist' AND active = true
  ));

-- ============================================================
-- tasks
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_tasks" ON tasks FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "receptionist_tasks" ON tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM staff WHERE user_id = auth.uid() AND role = 'receptionist' AND active = true
  ));
CREATE POLICY "cleaner_own_tasks" ON tasks FOR SELECT
  USING (assigned_to = current_staff_id());
CREATE POLICY "cleaner_update_own_tasks" ON tasks FOR UPDATE
  USING (assigned_to = current_staff_id());

-- ============================================================
-- tax_calculations
-- ============================================================
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_tax_calculations" ON tax_calculations FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "staff_read_tax_calculations" ON tax_calculations FOR SELECT
  USING (is_active_staff());

-- ============================================================
-- sef_bulletins
-- ============================================================
ALTER TABLE sef_bulletins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_sef_bulletins" ON sef_bulletins FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "receptionist_sef_bulletins" ON sef_bulletins FOR ALL
  USING (EXISTS (
    SELECT 1 FROM staff WHERE user_id = auth.uid() AND role = 'receptionist' AND active = true
  ));

-- ============================================================
-- icao_countries (public read)
-- ============================================================
ALTER TABLE icao_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_icao" ON icao_countries FOR SELECT
  USING (true);
CREATE POLICY "admin_manage_icao" ON icao_countries FOR ALL
  USING (is_admin_or_manager());

-- ============================================================
-- invoices
-- ============================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_invoices" ON invoices FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "staff_read_invoices" ON invoices FOR SELECT
  USING (is_active_staff());
CREATE POLICY "owner_read_own_invoices" ON invoices FOR SELECT
  USING (reservation_id IN (
    SELECT r.id FROM reservations r
    JOIN properties p ON r.property_id = p.id
    JOIN owners o ON p.owner_id = o.id
    WHERE o.user_id = auth.uid()
  ));

-- ============================================================
-- pricing_calendar
-- ============================================================
ALTER TABLE pricing_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_pricing_calendar" ON pricing_calendar FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "staff_read_pricing_calendar" ON pricing_calendar FOR SELECT
  USING (is_active_staff());

-- ============================================================
-- pricing_config
-- ============================================================
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_pricing_config" ON pricing_config FOR ALL
  USING (is_admin_or_manager());

-- ============================================================
-- expenses
-- ============================================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_expenses" ON expenses FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "staff_read_expenses" ON expenses FOR SELECT
  USING (is_active_staff());
CREATE POLICY "owner_read_own_expenses" ON expenses FOR SELECT
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN owners o ON p.owner_id = o.id
    WHERE o.user_id = auth.uid()
  ));

-- ============================================================
-- owner_properties
-- ============================================================
ALTER TABLE owner_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_owner_properties" ON owner_properties FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "owner_read_own" ON owner_properties FOR SELECT
  USING (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()));

-- ============================================================
-- owner_statements
-- ============================================================
ALTER TABLE owner_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_owner_statements" ON owner_statements FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "owner_read_own_statements" ON owner_statements FOR SELECT
  USING (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()));

-- ============================================================
-- integration_config
-- ============================================================
ALTER TABLE integration_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_integration_config" ON integration_config FOR ALL
  USING (is_admin_or_manager());

-- ============================================================
-- ai_config
-- ============================================================
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_ai_config" ON ai_config FOR ALL
  USING (is_admin_or_manager());

-- ============================================================
-- ai_usage_log
-- ============================================================
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manager_ai_usage_log" ON ai_usage_log FOR ALL
  USING (is_admin_or_manager());
CREATE POLICY "staff_read_ai_usage_log" ON ai_usage_log FOR SELECT
  USING (is_active_staff());
