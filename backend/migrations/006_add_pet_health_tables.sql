-- Миграция базы данных: Создание таблиц здоровья питомца (Прививки, Обработки, Медкарты)
-- Накат миграции
-- +goose Up
-- +goose StatementBegin

-- 1. Таблица прививок (pet_vaccinations)
CREATE TABLE IF NOT EXISTS pet_vaccinations (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    vaccine_name VARCHAR(100) NOT NULL,
    vaccine_type VARCHAR(50) NOT NULL, -- rabies, distemper, complex и т.д.
    next_date DATE,
    veterinarian VARCHAR(150),
    clinic VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pet_vaccinations_pet_id ON pet_vaccinations(pet_id);


-- 2. Таблица обработок (pet_treatments)
CREATE TABLE IF NOT EXISTS pet_treatments (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    treatment_type VARCHAR(50) NOT NULL, -- deworming, flea_tick и т.д.
    product_name VARCHAR(100) NOT NULL,
    next_date DATE,
    dosage VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pet_treatments_pet_id ON pet_treatments(pet_id);


-- 3. Таблица медицинских записей (pet_medical_records)
CREATE TABLE IF NOT EXISTS pet_medical_records (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    record_type VARCHAR(50) NOT NULL, -- examination, surgery, analysis и т.д.
    title VARCHAR(150) NOT NULL,
    description TEXT,
    veterinarian VARCHAR(150),
    clinic VARCHAR(150),
    diagnosis TEXT,
    treatment TEXT,
    medications TEXT,
    cost DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pet_medical_records_pet_id ON pet_medical_records(pet_id);

-- +goose StatementEnd

-- Откат миграции
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS pet_medical_records;
DROP TABLE IF EXISTS pet_treatments;
DROP TABLE IF EXISTS pet_vaccinations;
-- +goose StatementEnd
