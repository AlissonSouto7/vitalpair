-- Rebrand: VitaPair -> VitalPair. Atualiza o texto do badge já semeado (não editar a V6, que já foi aplicada).
UPDATE badges
SET description = 'Formou um par no VitalPair'
WHERE code = 'PAIR_FORMED';
