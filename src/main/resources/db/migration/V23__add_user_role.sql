-- Adds roles.
--
-- Until now the only authorisation question the system could answer was "is this request
-- authenticated". Every authenticated user could reach every authenticated endpoint, so
-- there was no way to build anything operational without exposing it to all users.
--
-- Two roles are enough for now, and adding a third later is a migration, not a redesign.
-- Existing users become USER, which is what they already effectively were.

ALTER TABLE users
    ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- The database refuses an unknown role rather than trusting the application to validate.
ALTER TABLE users
    ADD CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN'));

-- Promotion is deliberately manual, with no endpoint behind it: an API that grants admin
-- is an escalation path, and this is a two-person product.
--   UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
