-- Notificações passam a guardar dados estruturados (traduzíveis no front) em vez de texto pronto.
ALTER TABLE notifications DROP COLUMN title;
ALTER TABLE notifications DROP COLUMN body;
ALTER TABLE notifications ADD COLUMN actor_name VARCHAR(120);
ALTER TABLE notifications ADD COLUMN ref_text   VARCHAR(255);
ALTER TABLE notifications ADD COLUMN amount     INTEGER;
