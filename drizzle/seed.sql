
-- Insert sample sheet
INSERT INTO sheets (slug, nanoid, name, description, currency, settlement_currency)
VALUES (
  'trip-to-italy-2025',
  SUBSTR(hex(randomblob(8)), 1, 8),
  'Trip to Italy 2025',
  'Expenses for our amazing trip to Italy',
  'USD',
  'USD'
);

-- Get the sheet ID
WITH sheet_id AS (
  SELECT id FROM sheets WHERE slug = 'trip-to-italy-2025' LIMIT 1
)
-- Insert participants
INSERT INTO participants (sheet_id, name, is_creator)
SELECT
  id,
  'Alice',
  1
FROM sheet_id
UNION ALL
SELECT
  id,
  'Bob',
  0
FROM sheet_id
UNION ALL
SELECT
  id,
  'Charlie',
  0
FROM sheet_id;

-- Get participant IDs
WITH participant_ids AS (
  SELECT p.id, p.name, p.sheet_id
  FROM participants p
  JOIN sheets s ON p.sheet_id = s.id
  WHERE s.slug = 'trip-to-italy-2025'
)
-- Insert expenses
INSERT INTO expenses (sheet_id, paid_by, description, amount, currency, split_type)
SELECT
  pi.sheet_id,
  pi.id,
  'Hotel in Rome',
  50000,
  'USD',
  'equal'
FROM participant_ids pi
WHERE pi.name = 'Alice'
UNION ALL
SELECT
  pi.sheet_id,
  pi.id,
  'Train tickets',
  12000,
  'USD',
  'equal'
FROM participant_ids pi
WHERE pi.name = 'Bob'
UNION ALL
SELECT
  pi.sheet_id,
  pi.id,
  'Dinner at restaurant',
  8500,
  'USD',
  'equal'
FROM participant_ids pi
WHERE pi.name = 'Charlie';

-- Insert exchange rates
INSERT INTO exchange_rates (base_currency, target_currency, rate, lastUpdated)
VALUES
  ('USD', 'EUR', 0.92, strftime('%s', 'now')),
  ('EUR', 'USD', 1.09, strftime('%s', 'now')),
  ('USD', 'GBP', 0.79, strftime('%s', 'now')),
  ('GBP', 'USD', 1.27, strftime('%s', 'now'));

-- Verify data
SELECT 'Seeded ' || COUNT(*) || ' sheets' as result FROM sheets
UNION ALL
SELECT 'Seeded ' || COUNT(*) || ' participants' FROM participants
UNION ALL
SELECT 'Seeded ' || COUNT(*) || ' expenses' FROM expenses
UNION ALL
SELECT 'Seeded ' || COUNT(*) || ' exchange rates' FROM exchange_rates;
