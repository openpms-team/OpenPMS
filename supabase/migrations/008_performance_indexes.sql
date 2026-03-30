-- Performance indexes (many already exist from schema, these are additions)
CREATE INDEX IF NOT EXISTS idx_reservations_property_dates ON reservations(property_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_guests_reservation ON guests(reservation_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_property_due ON tasks(property_id, due_date);
CREATE INDEX IF NOT EXISTS idx_message_log_reservation ON message_log(reservation_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_reservation ON tax_calculations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_sef_bulletins_status ON sef_bulletins(status, deadline);
CREATE INDEX IF NOT EXISTS idx_pricing_calendar_property_date ON pricing_calendar(property_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_property_date ON expenses(property_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_date ON ai_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
