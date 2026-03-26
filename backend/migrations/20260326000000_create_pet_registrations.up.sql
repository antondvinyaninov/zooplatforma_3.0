CREATE TABLE IF NOT EXISTS pet_registrations (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    specialist_name VARCHAR(150),
    specialist_position VARCHAR(150),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pet_registrations_pet_id ON pet_registrations(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_registrations_org_id ON pet_registrations(org_id);
