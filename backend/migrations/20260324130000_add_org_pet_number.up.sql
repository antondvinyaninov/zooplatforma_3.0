ALTER TABLE pets ADD COLUMN IF NOT EXISTS org_pet_number INTEGER;

-- Заполняем существующих питомцев организаций порядковыми номерами
UPDATE pets p
SET org_pet_number = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY id) AS rn
  FROM pets
  WHERE org_id IS NOT NULL
) sub
WHERE p.id = sub.id;
