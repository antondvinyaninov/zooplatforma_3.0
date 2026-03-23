-- Добавляем колонки для примерного возраста и явного статуса стерилизации
ALTER TABLE pets
ADD COLUMN IF NOT EXISTS age_type VARCHAR(20) DEFAULT 'exact',
ADD COLUMN IF NOT EXISTS approximate_years INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS approximate_months INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_sterilized BOOLEAN DEFAULT false;
