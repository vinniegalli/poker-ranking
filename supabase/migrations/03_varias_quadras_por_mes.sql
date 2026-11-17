-- =============================================================================
-- 03 — Várias quadras por mês
--
-- QUANDO RODAR: ANTES do deploy do código que traz o "Plano anual de quadras".
-- SEGURANÇA: não apaga nem altera nenhuma quadra existente. Só troca a regra
--   "1 quadra por mês" (se existir) por "1 quadra de cada carta por mês".
--   O código atual em produção continua funcionando igual.
-- Pode rodar mais de uma vez.
-- =============================================================================

BEGIN;

-- Remove restrição/índice único que limite a tabela a 1 linha por mês
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.quadra_mes'::regclass
      AND c.contype = 'u'
      AND array_length(c.conkey, 1) = 1
      AND (SELECT a.attname FROM pg_attribute a
           WHERE a.attrelid = c.conrelid AND a.attnum = c.conkey[1]) = 'month'
  LOOP
    EXECUTE format('ALTER TABLE public.quadra_mes DROP CONSTRAINT %I', r.conname);
  END LOOP;

  FOR r IN
    SELECT i.indexrelid::regclass::text AS idx
    FROM pg_index i
    WHERE i.indrelid = 'public.quadra_mes'::regclass
      AND i.indisunique AND NOT i.indisprimary
      AND i.indnkeyatts = 1
      AND (SELECT a.attname FROM pg_attribute a
           WHERE a.attrelid = i.indrelid AND a.attnum = i.indkey[0]) = 'month'
      AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid)
  LOOP
    EXECUTE format('DROP INDEX %s', r.idx);
  END LOOP;
END $$;

-- Nova regra: no mesmo mês, cada carta aparece uma vez só.
-- (Também é o que permite criar as quadras do plano sem duplicar.)
CREATE UNIQUE INDEX IF NOT EXISTS quadra_mes_month_rank_key ON public.quadra_mes (month, rank);

COMMIT;

-- Conferência (opcional):
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'quadra_mes';
