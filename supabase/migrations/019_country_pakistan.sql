-- ============================================================
-- Migration 019: Switch default country to Pakistan (PK)
--
-- Mirrors migration 013's pattern for the PKR currency switch —
-- updates column defaults (for future installs) and fixes existing
-- rows still holding the old "US" default.
-- ============================================================

ALTER TABLE settings ALTER COLUMN shop_country SET DEFAULT 'PK';
ALTER TABLE customers ALTER COLUMN country SET DEFAULT 'PK';

UPDATE settings SET shop_country = 'PK' WHERE shop_country = 'US';
UPDATE customers SET country = 'PK' WHERE country = 'US';
