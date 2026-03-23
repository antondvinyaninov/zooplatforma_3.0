-- Добавляем поддержку иерархии организаций (сети, филиалы)
-- Правило: все изменения только через ADD COLUMN IF NOT EXISTS, данные не затрагиваются

-- parent_organization_id: ссылка на головную организацию (сеть)
-- NULL = самостоятельная организация
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS parent_organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;

-- network_role: роль организации в иерархии
-- 'standalone' — самостоятельная (по умолчанию)
-- 'network'    — головная организация / сеть
-- 'branch'     — филиал / точка сети
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS network_role VARCHAR(20) NOT NULL DEFAULT 'standalone';

-- Индекс для быстрого поиска всех филиалов сети: WHERE parent_organization_id = $1
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id
    ON organizations(parent_organization_id)
    WHERE parent_organization_id IS NOT NULL;

-- Индекс для поиска всех головных организаций (сетей)
CREATE INDEX IF NOT EXISTS idx_organizations_network_role
    ON organizations(network_role)
    WHERE network_role != 'standalone';
