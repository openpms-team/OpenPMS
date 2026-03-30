-- ============================================================
-- Default Message Templates (PT, EN, FR)
-- ============================================================

INSERT INTO message_templates (name, channel, trigger_type, subject, body, active) VALUES

-- 1. Booking Confirmation
('Booking Confirmation', 'email', 'booking_confirmed',
  '{"pt": "Confirmação de Reserva", "en": "Booking Confirmation", "fr": "Confirmation de Réservation"}'::jsonb,
  '{"pt": "Olá {{guest_name}},\n\nA sua reserva em {{property_name}} está confirmada.\nCheck-in: {{check_in_date}}\nCheck-out: {{check_out_date}}\nNoites: {{num_nights}}\n\nObrigado!", "en": "Hello {{guest_name}},\n\nYour booking at {{property_name}} is confirmed.\nCheck-in: {{check_in_date}}\nCheck-out: {{check_out_date}}\nNights: {{num_nights}}\n\nThank you!", "fr": "Bonjour {{guest_name}},\n\nVotre réservation à {{property_name}} est confirmée.\nArrivée: {{check_in_date}}\nDépart: {{check_out_date}}\nNuits: {{num_nights}}\n\nMerci!"}'::jsonb,
  true),

-- 2. Check-in Reminder
('Check-in Reminder', 'email', 'pre_checkin',
  '{"pt": "Lembrete de Check-in", "en": "Check-in Reminder", "fr": "Rappel d''Enregistrement"}'::jsonb,
  '{"pt": "Olá {{guest_name}},\n\nA sua estadia em {{property_name}} está a chegar! Complete o check-in online:\n{{checkin_link}}\n\nAté breve!", "en": "Hello {{guest_name}},\n\nYour stay at {{property_name}} is approaching! Complete your online check-in:\n{{checkin_link}}\n\nSee you soon!", "fr": "Bonjour {{guest_name}},\n\nVotre séjour à {{property_name}} approche! Complétez votre enregistrement en ligne:\n{{checkin_link}}\n\nÀ bientôt!"}'::jsonb,
  true),

-- 3. Welcome Message
('Welcome Message', 'email', 'checkin_day',
  '{"pt": "Bem-vindo!", "en": "Welcome!", "fr": "Bienvenue!"}'::jsonb,
  '{"pt": "Olá {{guest_name}},\n\nBem-vindo a {{property_name}}!\n\nWi-Fi: {{wifi_ssid}} / {{wifi_password}}\nCódigo da porta: {{door_code}}\n\nBoa estadia!", "en": "Hello {{guest_name}},\n\nWelcome to {{property_name}}!\n\nWi-Fi: {{wifi_ssid}} / {{wifi_password}}\nDoor code: {{door_code}}\n\nEnjoy your stay!", "fr": "Bonjour {{guest_name}},\n\nBienvenue à {{property_name}}!\n\nWi-Fi: {{wifi_ssid}} / {{wifi_password}}\nCode de porte: {{door_code}}\n\nBon séjour!"}'::jsonb,
  true),

-- 4. Checkout Reminder
('Checkout Reminder', 'email', 'pre_checkout',
  '{"pt": "Lembrete de Check-out", "en": "Checkout Reminder", "fr": "Rappel de Départ"}'::jsonb,
  '{"pt": "Olá {{guest_name}},\n\nLembramos que o check-out de {{property_name}} é amanhã.\nPor favor deixe as chaves no local indicado.\n\nObrigado pela estadia!", "en": "Hello {{guest_name}},\n\nThis is a reminder that checkout from {{property_name}} is tomorrow.\nPlease leave the keys in the designated spot.\n\nThank you for staying!", "fr": "Bonjour {{guest_name}},\n\nNous vous rappelons que le départ de {{property_name}} est demain.\nVeuillez laisser les clés à l''endroit indiqué.\n\nMerci pour votre séjour!"}'::jsonb,
  true),

-- 5. Thank You
('Thank You', 'email', 'post_checkout',
  '{"pt": "Obrigado pela Estadia", "en": "Thank You for Staying", "fr": "Merci pour Votre Séjour"}'::jsonb,
  '{"pt": "Olá {{guest_name}},\n\nObrigado por ter ficado em {{property_name}}!\nEsperamos que tenha tido uma excelente estadia.\n\nVolte sempre!", "en": "Hello {{guest_name}},\n\nThank you for staying at {{property_name}}!\nWe hope you had a wonderful time.\n\nWe look forward to welcoming you again!", "fr": "Bonjour {{guest_name}},\n\nMerci d''avoir séjourné à {{property_name}}!\nNous espérons que vous avez passé un excellent séjour.\n\nAu plaisir de vous revoir!"}'::jsonb,
  true),

-- 6. Check-in Link SMS
('Check-in Link SMS', 'sms', 'pre_checkin',
  '{}'::jsonb,
  '{"pt": "Olá {{guest_name}}! Complete o check-in para {{property_name}}: {{checkin_link}}", "en": "Hello {{guest_name}}! Complete your check-in for {{property_name}}: {{checkin_link}}", "fr": "Bonjour {{guest_name}}! Complétez votre enregistrement pour {{property_name}}: {{checkin_link}}"}'::jsonb,
  true);
