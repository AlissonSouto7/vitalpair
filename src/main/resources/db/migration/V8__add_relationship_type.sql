-- Tipo do vínculo entre os dois membros (casal, dupla, amigos, etc.)
ALTER TABLE pairs
    ADD COLUMN relationship_type VARCHAR(20) NOT NULL DEFAULT 'PAIR'
    CHECK (relationship_type IN ('PAIR', 'DUO', 'FRIENDS', 'CONFIDANTS', 'BROTHERS', 'OTHER'));
