-- Migração segura — adiciona apenas o que está faltando, sem apagar nada
-- Execute com: psql $DATABASE_URL -f migrate.sql
-- Ou: psql -U seu_usuario -d seu_banco -f migrate.sql

-- Colunas de endereço na tabela clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estado TEXT;

-- Colunas de endereço na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS estado TEXT;

-- Colunas de endereço e protocolo na tabela projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero_protocolo TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero_instalacao TEXT;

-- Nova tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  sender_id VARCHAR NOT NULL REFERENCES users(id),
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  content TEXT NOT NULL,
  read_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  read_by_integrador BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
