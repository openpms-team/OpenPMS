-- 005_seed_municipalities_pt.sql
-- Seed Portuguese municipalities tourist tax data (2024/2025 rates)
-- Uses CTEs for compact UUID referencing

BEGIN;

-- Helper: ensure uuid-ossp is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. Insert all tax jurisdictions
-- ============================================================
INSERT INTO tax_jurisdictions (id, name, country_code, region, currency, reporting_period, reporting_deadline_day)
VALUES
  -- Lisboa district
  (uuid_generate_v4(), 'Lisboa',              'PRT', 'Lisboa',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Cascais',             'PRT', 'Lisboa',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Sintra',              'PRT', 'Lisboa',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Oeiras',              'PRT', 'Lisboa',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Amadora',             'PRT', 'Lisboa',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Loures',              'PRT', 'Lisboa',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Mafra',               'PRT', 'Lisboa',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Almada',              'PRT', 'Lisboa',              'EUR', 'monthly', 15),
  -- Porto district
  (uuid_generate_v4(), 'Porto',               'PRT', 'Porto',               'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Vila Nova de Gaia',   'PRT', 'Porto',               'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Matosinhos',          'PRT', 'Porto',               'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Espinho',             'PRT', 'Porto',               'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Póvoa de Varzim',     'PRT', 'Porto',               'EUR', 'monthly', 15),
  -- Braga district
  (uuid_generate_v4(), 'Braga',               'PRT', 'Braga',               'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Guimarães',           'PRT', 'Braga',               'EUR', 'monthly', 15),
  -- Viana do Castelo district
  (uuid_generate_v4(), 'Viana do Castelo',    'PRT', 'Viana do Castelo',    'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Ponte de Lima',       'PRT', 'Viana do Castelo',    'EUR', 'monthly', 15),
  -- Aveiro district
  (uuid_generate_v4(), 'Aveiro',              'PRT', 'Aveiro',              'EUR', 'monthly', 15),
  -- Viseu district
  (uuid_generate_v4(), 'Viseu',               'PRT', 'Viseu',               'EUR', 'monthly', 15),
  -- Coimbra district
  (uuid_generate_v4(), 'Coimbra',             'PRT', 'Coimbra',             'EUR', 'monthly', 15),
  -- Leiria district
  (uuid_generate_v4(), 'Leiria',              'PRT', 'Leiria',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Peniche',             'PRT', 'Leiria',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Óbidos',              'PRT', 'Leiria',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Nazaré',              'PRT', 'Leiria',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Caldas da Rainha',    'PRT', 'Leiria',              'EUR', 'monthly', 15),
  -- Santarém district
  (uuid_generate_v4(), 'Santarém',            'PRT', 'Santarém',            'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Torres Vedras',       'PRT', 'Lisboa',              'EUR', 'monthly', 15),
  -- Setúbal district
  (uuid_generate_v4(), 'Setúbal',             'PRT', 'Setúbal',             'EUR', 'monthly', 15),
  -- Évora district
  (uuid_generate_v4(), 'Évora',               'PRT', 'Évora',               'EUR', 'monthly', 15),
  -- Faro district (Algarve)
  (uuid_generate_v4(), 'Faro',                'PRT', 'Faro',                'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Albufeira',           'PRT', 'Faro',                'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Portimão',            'PRT', 'Faro',                'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Loulé',               'PRT', 'Faro',                'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Lagos',               'PRT', 'Faro',                'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Tavira',              'PRT', 'Faro',                'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Vila Real de Santo António', 'PRT', 'Faro',         'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Olhão',               'PRT', 'Faro',               'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Silves',              'PRT', 'Faro',                'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Monchique',           'PRT', 'Faro',                'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Aljezur',             'PRT', 'Faro',                'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Vila do Bispo',       'PRT', 'Faro',                'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'São Brás de Alportel','PRT', 'Faro',                'EUR', 'monthly', 15),
  -- Madeira
  (uuid_generate_v4(), 'Funchal',             'PRT', 'Madeira',             'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Machico',             'PRT', 'Madeira',             'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Santa Cruz',          'PRT', 'Madeira',             'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Câmara de Lobos',     'PRT', 'Madeira',             'EUR', 'monthly', 15),
  -- Açores
  (uuid_generate_v4(), 'Ponta Delgada',       'PRT', 'Açores',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Angra do Heroísmo',   'PRT', 'Açores',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Ribeira Grande',      'PRT', 'Açores',              'EUR', 'monthly', 15),
  (uuid_generate_v4(), 'Vila Franca do Campo','PRT', 'Açores',              'EUR', 'monthly', 15);

-- ============================================================
-- 2. Insert tax rules using subselects for jurisdiction_id
-- ============================================================
-- Helper function-like approach: reference by name

-- €2/night/person municipalities (max 7 nights)
INSERT INTO tax_rules (id, jurisdiction_id, rate_type, rate_amount, max_nights, min_guest_age, priority)
SELECT uuid_generate_v4(), j.id, 'per_night_per_guest', 2.0000, 7, 13, 1
FROM tax_jurisdictions j
WHERE j.country_code = 'PRT'
  AND j.name IN ('Lisboa', 'Porto', 'Vila Nova de Gaia', 'Matosinhos', 'Funchal');

-- €2/night/person, max 7 nights, age ≥16 (Cascais)
INSERT INTO tax_rules (id, jurisdiction_id, rate_type, rate_amount, max_nights, min_guest_age, priority)
SELECT uuid_generate_v4(), j.id, 'per_night_per_guest', 2.0000, 7, 16, 1
FROM tax_jurisdictions j
WHERE j.country_code = 'PRT' AND j.name = 'Cascais';

-- €1.50/night/person municipalities (max 7 nights, age ≥13)
INSERT INTO tax_rules (id, jurisdiction_id, rate_type, rate_amount, max_nights, min_guest_age, priority)
SELECT uuid_generate_v4(), j.id, 'per_night_per_guest', 1.5000, 7, 13, 1
FROM tax_jurisdictions j
WHERE j.country_code = 'PRT'
  AND j.name IN (
    'Braga', 'Guimarães', 'Albufeira', 'Portimão', 'Loulé', 'Lagos', 'Tavira',
    'Vila Real de Santo António', 'Olhão', 'Silves',
    'Machico', 'Santa Cruz', 'Câmara de Lobos'
  );

-- Faro: €1.50/night/person, max 7 nights, seasonal Apr-Oct
INSERT INTO tax_rules (id, jurisdiction_id, rate_type, rate_amount, season_start, season_end, max_nights, min_guest_age, priority)
SELECT uuid_generate_v4(), j.id, 'per_night_per_guest', 1.5000, '2025-04-01', '2025-10-31', 7, 13, 1
FROM tax_jurisdictions j
WHERE j.country_code = 'PRT' AND j.name = 'Faro';

-- €1/night/person municipalities with max 7 nights
INSERT INTO tax_rules (id, jurisdiction_id, rate_type, rate_amount, max_nights, min_guest_age, priority)
SELECT uuid_generate_v4(), j.id, 'per_night_per_guest', 1.0000, 7, 13, 1
FROM tax_jurisdictions j
WHERE j.country_code = 'PRT'
  AND j.name IN (
    'Sintra', 'Oeiras', 'Coimbra', 'Évora', 'Aveiro', 'Setúbal',
    'Viana do Castelo', 'Almada'
  );

-- €1/night/person municipalities without explicit max nights cap (default no cap)
INSERT INTO tax_rules (id, jurisdiction_id, rate_type, rate_amount, min_guest_age, priority)
SELECT uuid_generate_v4(), j.id, 'per_night_per_guest', 1.0000, 13, 1
FROM tax_jurisdictions j
WHERE j.country_code = 'PRT'
  AND j.name IN (
    'Viseu', 'Leiria', 'Peniche', 'Óbidos', 'Nazaré',
    'Espinho', 'Póvoa de Varzim', 'Ponte de Lima',
    'Monchique', 'Aljezur', 'Vila do Bispo', 'São Brás de Alportel',
    'Ponta Delgada', 'Angra do Heroísmo', 'Ribeira Grande', 'Vila Franca do Campo',
    'Amadora', 'Loures', 'Mafra', 'Torres Vedras',
    'Caldas da Rainha', 'Santarém'
  );

-- ============================================================
-- 3. Insert common exemptions for ALL Portuguese municipalities
-- ============================================================

-- Age exemption: children under the minimum age are exempt
INSERT INTO tax_exemptions (id, jurisdiction_id, type, description, condition_json, requires_proof)
SELECT
  uuid_generate_v4(),
  j.id,
  'age',
  'Children under the minimum taxable age are exempt from tourist tax',
  '{"max_age": 12}'::jsonb,
  false
FROM tax_jurisdictions j
WHERE j.country_code = 'PRT'
  AND j.name != 'Cascais';

-- Cascais has age ≥16, so exemption is under 16
INSERT INTO tax_exemptions (id, jurisdiction_id, type, description, condition_json, requires_proof)
SELECT
  uuid_generate_v4(),
  j.id,
  'age',
  'Children under 16 are exempt from tourist tax',
  '{"max_age": 15}'::jsonb,
  false
FROM tax_jurisdictions j
WHERE j.country_code = 'PRT' AND j.name = 'Cascais';

-- Medical exemption: hospital/medical stays
INSERT INTO tax_exemptions (id, jurisdiction_id, type, description, condition_json, requires_proof)
SELECT
  uuid_generate_v4(),
  j.id,
  'medical',
  'Guests staying for medical treatment or hospital accompaniment are exempt',
  '{"reason": "medical_treatment"}'::jsonb,
  true
FROM tax_jurisdictions j
WHERE j.country_code = 'PRT';

-- Residency exemption: residents of the municipality
INSERT INTO tax_exemptions (id, jurisdiction_id, type, description, condition_json, requires_proof)
SELECT
  uuid_generate_v4(),
  j.id,
  'residency',
  'Residents of the municipality are exempt from tourist tax',
  '{"resident_of_jurisdiction": true}'::jsonb,
  true
FROM tax_jurisdictions j
WHERE j.country_code = 'PRT';

COMMIT;
