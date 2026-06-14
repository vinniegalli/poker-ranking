-- =============================================
-- POKER RANKING — Schema SQL para Supabase
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================

-- Jogadores
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessões de jogo
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  notes TEXT,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participação de cada jogador em cada sessão
CREATE TABLE IF NOT EXISTS session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  buyin_count INTEGER NOT NULL DEFAULT 1,
  soma_compra NUMERIC(10,2) NOT NULL,
  soma_ganho NUMERIC(10,2) NOT NULL DEFAULT 0,
  caixa_contribution NUMERIC(10,2) NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

-- Caixa acumulado (registros de contribuições)
CREATE TABLE IF NOT EXISTS caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Habilitar Row Level Security (RLS)
-- =============================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa ENABLE ROW LEVEL SECURITY;

-- Políticas: leitura pública (anon pode ler)
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Public read session_players" ON session_players FOR SELECT USING (true);
CREATE POLICY "Public read caixa" ON caixa FOR SELECT USING (true);

-- Políticas: escrita para anon (a autenticação de admin é feita no backend via ADMIN_PASSWORD)
CREATE POLICY "Anon write players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write session_players" ON session_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write caixa" ON caixa FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Dados de exemplo (opcional)
-- =============================================

-- INSERT INTO players (name) VALUES ('João'), ('Pedro'), ('Maria'), ('Carlos');
