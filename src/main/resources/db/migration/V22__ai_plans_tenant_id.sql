-- Adds the tenant column the AI plan tables were missing.
--
-- Every other table that holds user data carries tenant_id, which is what makes a
-- cross-tenant leak a broken foreign key rather than a silent data disclosure. meal_plans
-- and workout_plans were scoped by user_id alone, so the only thing standing between one
-- pair and another's plans was every query remembering to filter correctly.
--
-- Expand/contract: the column is added nullable, backfilled from the owning user, then
-- constrained. A single ALTER with NOT NULL would fail on any existing row.

ALTER TABLE meal_plans ADD COLUMN tenant_id UUID;
ALTER TABLE workout_plans ADD COLUMN tenant_id UUID;

-- The tenant of a plan is the tenant of the user who owns it. There is no ambiguity to
-- resolve: a user belongs to exactly one pair.
UPDATE meal_plans p SET tenant_id = u.tenant_id FROM users u WHERE u.id = p.user_id;
UPDATE workout_plans p SET tenant_id = u.tenant_id FROM users u WHERE u.id = p.user_id;

ALTER TABLE meal_plans ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE workout_plans ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE meal_plans
    ADD CONSTRAINT fk_meal_plans_tenant FOREIGN KEY (tenant_id) REFERENCES pairs (id);
ALTER TABLE workout_plans
    ADD CONSTRAINT fk_workout_plans_tenant FOREIGN KEY (tenant_id) REFERENCES pairs (id);

-- Every read filters by tenant, so the index carries it first.
CREATE INDEX idx_meal_plans_tenant_user ON meal_plans (tenant_id, user_id, week_start);
CREATE INDEX idx_workout_plans_tenant_user ON workout_plans (tenant_id, user_id, week_start);
