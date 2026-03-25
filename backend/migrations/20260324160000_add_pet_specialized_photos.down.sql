ALTER TABLE pets
  DROP COLUMN IF EXISTS face_photo_url,
  DROP COLUMN IF EXISTS body_photo_url;
