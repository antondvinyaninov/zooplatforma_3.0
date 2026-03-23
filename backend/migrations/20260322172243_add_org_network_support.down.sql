-- Откат поддержки иерархии организаций

DROP INDEX IF EXISTS idx_organizations_network_role;
DROP INDEX IF EXISTS idx_organizations_parent_id;

ALTER TABLE organizations
    DROP COLUMN IF EXISTS network_role,
    DROP COLUMN IF EXISTS parent_organization_id;
