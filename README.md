# Poker Ranking

Sistema de ranking para cash game de poker doméstico.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Shadcn/ui
- **Banco de dados**: Supabase (PostgreSQL)
- **Deploy**: Vercel

---

## Setup Local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto.
2. No SQL Editor, execute o arquivo `supabase-schema.sql`.
3. Copie a URL e a chave `anon` (Settings → API).

### 3. Variáveis de ambiente

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
ADMIN_PASSWORD=suasenhasecreta
```

### 4. Rodar

```bash
npm run dev
```

---

## Deploy na Vercel

1. Push para GitHub.
2. Importe o repositório na Vercel.
3. Adicione as 3 variáveis de ambiente no painel.
4. Deploy.

---

## Regras de Negócio

| Tipo | Valor | Destino |
|------|-------|---------|
| Primeiro buy-in | R$ 25,00 | R$ 20 pote + R$ 5 caixa |
| Recompra (add-on) | R$ 20,00 | 100% pote |

- **Soma de Compra** = R$ 25 + (recompras × R$ 20)
- **Soma de Saldo** = Soma de Ganho − Soma de Compra
- **Caixa** = R$ 5 por participação (1 por jogador por noite)

---

## Modo Admin

Clique no cadeado na navbar, digite a senha configurada em `ADMIN_PASSWORD`.

Com acesso admin: criar sessões, adicionar jogadores, registrar buy-ins, salvar resultados, encerrar sessões.
