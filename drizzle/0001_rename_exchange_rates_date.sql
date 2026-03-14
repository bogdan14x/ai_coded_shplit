-- Migration to rename 'date' to 'lastUpdated' in exchange_rates table
-- SQLite doesn't support RENAME COLUMN, so we need to recreate the table

-- 1. Create new table with correct schema
CREATE TABLE exchange_rates_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  base_currency TEXT(3) NOT NULL DEFAULT 'EUR',
  target_currency TEXT(3) NOT NULL,
  rate REAL NOT NULL,
  lastUpdated INTEGER NOT NULL
);

-- 2. Create index on new table
CREATE UNIQUE INDEX IF NOT EXISTS exchange_rates_base_target_idx 
ON exchange_rates_new (base_currency, target_currency);

-- 3. Copy data from old table to new table
INSERT INTO exchange_rates_new (id, base_currency, target_currency, rate, lastUpdated)
SELECT id, base_currency, target_currency, rate, date FROM exchange_rates;

-- 4. Drop old table
DROP TABLE exchange_rates;

-- 5. Rename new table to original name
ALTER TABLE exchange_rates_new RENAME TO exchange_rates;
