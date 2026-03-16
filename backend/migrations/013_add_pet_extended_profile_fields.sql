-- Миграция базы данных: Добавление расширенных полей профиля питомца (Внешний вид, Идентификация, Место содержания и Здоровье)
-- Накат миграции
-- +goose Up
-- +goose StatementBegin

ALTER TABLE pets
    ADD COLUMN IF NOT EXISTS fur VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ears VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tail VARCHAR(100),
    ADD COLUMN IF NOT EXISTS special_marks TEXT,
    
    ADD COLUMN IF NOT EXISTS marking_date DATE,
    ADD COLUMN IF NOT EXISTS tag_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS brand_number VARCHAR(100),
    
    ADD COLUMN IF NOT EXISTS location_address TEXT,
    ADD COLUMN IF NOT EXISTS location_cage VARCHAR(100),
    ADD COLUMN IF NOT EXISTS location_contact VARCHAR(150),
    ADD COLUMN IF NOT EXISTS location_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS location_notes TEXT,
    
    ADD COLUMN IF NOT EXISTS weight VARCHAR(50),
    ADD COLUMN IF NOT EXISTS health_notes TEXT;

-- +goose StatementEnd

-- Откат миграции
-- +goose Down
-- +goose StatementBegin

ALTER TABLE pets
    DROP COLUMN IF NOT EXISTS health_notes,
    DROP COLUMN IF NOT EXISTS weight,
    DROP COLUMN IF NOT EXISTS location_notes,
    DROP COLUMN IF NOT EXISTS location_phone,
    DROP COLUMN IF NOT EXISTS location_contact,
    DROP COLUMN IF NOT EXISTS location_cage,
    DROP COLUMN IF NOT EXISTS location_address,
    DROP COLUMN IF NOT EXISTS brand_number,
    DROP COLUMN IF NOT EXISTS tag_number,
    DROP COLUMN IF NOT EXISTS marking_date,
    DROP COLUMN IF NOT EXISTS special_marks,
    DROP COLUMN IF NOT EXISTS tail,
    DROP COLUMN IF NOT EXISTS ears,
    DROP COLUMN IF NOT EXISTS fur;

-- +goose StatementEnd
