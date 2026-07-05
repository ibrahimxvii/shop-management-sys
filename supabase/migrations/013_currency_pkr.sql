-- ============================================================
-- Migration 013: Switch default currency to Pakistani Rupees
--
-- Changes the settings table's column defaults (for future installs)
-- and updates the existing seeded settings row so the Settings > Shop
-- page reflects PKR immediately, matching the app-wide switch to PKR
-- currency formatting (lib/utils.ts formatCurrency).
-- ============================================================

ALTER TABLE settings ALTER COLUMN currency SET DEFAULT 'PKR';
ALTER TABLE settings ALTER COLUMN currency_symbol SET DEFAULT 'Rs';

UPDATE settings
SET currency = 'PKR', currency_symbol = 'Rs'
WHERE currency = 'USD' AND currency_symbol = '$';
