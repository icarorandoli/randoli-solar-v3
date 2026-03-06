-- ============================================================
-- MIGRAÇÃO RANDOLI SOLAR — Rodar no VPS para sincronizar BD
-- psql -U randoli -d randoli_solar -f migrate_vps.sql
-- ============================================================

-- ── USERS: novas colunas de endereço + Google OAuth ──────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS estado text;
-- ── PROJECTS: novos campos de endereço, equipamentos, etc ─────

-- Enum tipo_conexao (cria apenas se não existir)
DO $$ BEGIN
  CREATE TYPE tipo_conexao AS ENUM ('monofasico', 'bifasico', 'trifasico');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Campos de localização
ALTER TABLE projects ADD COLUMN IF NOT EXISTS endereco text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estado text;

-- Dados da concessionária
ALTER TABLE projects ADD COLUMN IF NOT EXISTS concessionaria text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero_protocolo text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero_instalacao text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tipo_conexao tipo_conexao;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS amperagem_disjuntor text;

-- Dados do titular da instalação
ALTER TABLE projects ADD COLUMN IF NOT EXISTS nome_cliente text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cpf_cnpj_cliente text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS telefone_cliente text;

-- Equipamentos — Inversor
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marca_inversor text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS modelo_inversor text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS potencia_inversor text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quantidade_inversor text;

-- Equipamentos — Painel Solar
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marca_painel text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS modelo_painel text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS potencia_painel text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quantidade_paineis text;

-- Totais e financeiro
ALTER TABLE projects ADD COLUMN IF NOT EXISTS potencia text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS valor text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ticket_number varchar;

-- Pagamento Mercado Pago / PIX
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_link text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_status text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pix_qr_code text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pix_qr_code_base64 text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pix_payment_id text;

-- Timestamp de atualização
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW();

-- ── CLIENT_PRICING: coluna rangeId ───────────────────────────
ALTER TABLE client_pricing ADD COLUMN IF NOT EXISTS range_id varchar REFERENCES pricing_ranges(id);

-- ── PASSWORD RESET TOKENS (cria tabela se não existir) ───────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id),
  token text NOT NULL UNIQUE,
  expires_at timestamp NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp DEFAULT NOW()
);

-- ── USERS: colunas Google OAuth ──────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean NOT NULL DEFAULT false;

-- ── TABELA DE SESSÕES (connect-pg-simple) ────────────────────
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- ============================================================
-- Concluído! Verifique os erros acima (se houver).
-- ============================================================
