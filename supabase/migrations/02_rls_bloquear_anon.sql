-- =============================================================================
-- 02 — Corrige o alerta "rls_disabled_in_public" do Supabase
--
-- QUANDO RODAR: SÓ DEPOIS que o código novo estiver em produção usando a
--   SUPABASE_SERVICE_ROLE_KEY (env var na Vercel) e você tiver conferido que o
--   site carrega o ranking normalmente.
--   Se rodar antes, o site para de ler/gravar dados até o deploy novo entrar.
--
-- O QUE FAZ:
--   1. Liga Row Level Security em TODAS as tabelas do schema public.
--   2. Remove todas as políticas existentes (as antigas liberavam escrita total
--      para qualquer um com a anon key: "FOR ALL USING (true)").
--   3. Revoga os privilégios de tabela dos papéis anon/authenticated.
--   Resultado: só o servidor do app (service_role) acessa o banco. Nenhum dado
--   é alterado ou apagado.
-- =============================================================================

BEGIN;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;

  FOR r IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Tabelas criadas no futuro também não ficam abertas para anon/authenticated.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

COMMIT;

-- Conferência: todas as linhas devem mostrar rowsecurity = true
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
-- E nenhuma política deve sobrar:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- -----------------------------------------------------------------------------
-- ROLLBACK DE EMERGÊNCIA (só se o site quebrar e você precisar voltar rápido;
-- volta ao estado inseguro anterior):
--
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
-- DO $$ DECLARE r record; BEGIN
--   FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
--     EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
--   END LOOP;
-- END $$;
-- -----------------------------------------------------------------------------
