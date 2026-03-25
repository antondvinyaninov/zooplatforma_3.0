-- Добавляем специализированные фото питомца
ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS face_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS body_photo_url TEXT;
