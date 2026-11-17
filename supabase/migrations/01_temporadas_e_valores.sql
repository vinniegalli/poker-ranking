-- =============================================================================
-- 01 — Temporadas + valores por sessão (buy-in, rebuy, taxa, limite de mesa)
--
-- QUANDO RODAR: ANTES do deploy do código novo.
-- SEGURANÇA: só ADICIONA tabela/colunas com valores padrão iguais aos de hoje
--   (buy-in 20, rebuy 20, caixa 5, 10 jogadores). Não apaga nem altera nenhum
--   dado existente — o código atual em produção continua funcionando igual.
-- Pode rodar mais de uma vez sem problema (IF NOT EXISTS).
-- =============================================================================

BEGIN;

-- Valores congelados em cada sessão: mudar o valor da temporada no futuro não
-- reescreve o histórico das sessões já jogadas.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS buyin_amount NUMERIC(10,2) NOT NULL DEFAULT 20;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS rebuy_amount NUMERIC(10,2) NOT NULL DEFAULT 20;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS caixa_fee    NUMERIC(10,2) NOT NULL DEFAULT 5;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS max_players  INTEGER       NOT NULL DEFAULT 10;

-- Temporadas: um período de datas + valores padrão para as sessões criadas nele.
-- O ranking/caixa/estatísticas de uma temporada são só um filtro por data —
-- encerrar uma temporada NÃO apaga nada.
CREATE TABLE IF NOT EXISTS seasons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE,                       -- NULL = temporada em andamento
  buyin_amount NUMERIC(10,2) NOT NULL DEFAULT 20,
  rebuy_amount NUMERIC(10,2) NOT NULL DEFAULT 20,
  caixa_fee    NUMERIC(10,2) NOT NULL DEFAULT 5,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT seasons_dates_ok CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Tabela nova já nasce protegida (sem políticas = anon não lê nem escreve;
-- o servidor acessa com a service_role key, que ignora RLS).
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Temporada inicial cobrindo o ano atual, só se ainda não existir nenhuma.
INSERT INTO seasons (name, start_date, end_date)
SELECT 'Temporada 2026', DATE '2026-01-01', NULL
WHERE NOT EXISTS (SELECT 1 FROM seasons);

COMMIT;

-- Conferência (opcional):
-- SELECT id, date, buyin_amount, rebuy_amount, caixa_fee, max_players FROM sessions ORDER BY date DESC LIMIT 5;
-- SELECT * FROM seasons;
