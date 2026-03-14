rm -f install.sh && curl -sSL https://raw.githubusercontent.com/icarorandoli/randoli-engenharia-solar/main/install.sh -o install.sh && bash install.sh
dorm -f install.sh && curl -sSL "https://api.github.com/repos/icarorandoli/randoli-engenharia-solar/contents/install.sh" -H "Accept: application/vnd.github.raw" -o install.sh && bash install.sh
rm -f install.sh && curl -sSL "https://api.github.com/repos/icarorandoli/randoli-engenharia-solar/contents/install.sh" -H "Accept: application/vnd.github.raw" -o install.sh && bash install.sh
rm -f install.sh && curl -sSL "https://api.github.com/repos/icarorandoli/randoli-engenharia-solar/contents/install.sh" -H "Accept: application/vnd.github.raw" -o install.sh && bash install.shroot@srv1235745:~# rm -f install.sh && curl -sSL https://raw.githubusercontent.com/icarorandoli/randoli-engenharia-solar/main/install.sh -o install.sh && bash install.sh
================================================
Domínio (ex: projetos.randolisolar.com.br) ou deixe em branco para usar só o IP: projetos.randolisolar.com.br
read -p Senha
Unpacking postgresql-16 (16.13-0ubuntu0.24.04.1) ...
Selecting previously unselected package postgresql.
Preparing to unpack .../16-postgresql_16+257build1.1_all.deb ...
Unpacking postgresql (16+257build1.1) ...
Selecting previously unselected package postgresql-contrib.
Preparing to unpack .../17-postgresql-contrib_16+257build1.1_all.deb ...
Unpacking postgresql-contrib (16+257build1.1) ...
Setting up postgresql-client-common (257build1.1) ...
Setting up libcurl4t64:amd64 (8.5.0-2ubuntu10.7) ...
Setting up libpq5:amd64 (16.13-0ubuntu0.24.04.1) ...
Setting up libcurl3t64-gnutls:amd64 (8.5.0-2ubuntu10.7) ...
Setting up libcommon-sense-perl:amd64 (3.75-3build3) ...
Setting up nginx-common (1.24.0-2ubuntu7.6) ...
Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service → /usr/lib/systemd/system/nginx.service.
Setting up libllvm17t64:amd64 (1:17.0.6-9ubuntu1) ...
Setting up ssl-cert (1.1.2ubuntu1) ...
Created symlink /etc/systemd/system/multi-user.target.wants/ssl-cert.service → /usr/lib/systemd/system/ssl-cert.service.
Setting up libtypes-serialiser-perl (1.01-1) ...
Setting up libjson-perl (4.10000-1) ...
Setting up curl (8.5.0-2ubuntu10.7) ...
Setting up libjson-xs-perl (4.040-0ubuntu0.24.04.1) ...
Setting up nginx (1.24.0-2ubuntu7.6) ...
Setting up postgresql-client-16 (16.13-0ubuntu0.24.04.1) ...
update-alternatives: using /usr/share/postgresql/16/man/man1/psql.1.gz to provide /usr/share/man/man1/psql.1.gz (psql.1.gz) in auto mode
Setting up postgresql-common (257build1.1) ...
Creating config file /etc/postgresql-common/createcluster.conf with new version
Building PostgreSQL dictionaries from installed myspell/hunspell packages...
Removing obsolete dictionary files:
Created symlink /etc/systemd/system/multi-user.target.wants/postgresql.service → /usr/lib/systemd/system/postgresql.service.
Setting up postgresql-16 (16.13-0ubuntu0.24.04.1) ...
Creating new PostgreSQL cluster 16/main ...
/usr/lib/postgresql/16/bin/initdb -D /var/lib/postgresql/16/main --auth-local peer --auth-host scram-sha-256 --no-instructions
The files belonging to this database system will be owned by user "postgres".
This user must also own the server process.
The database cluster will be initialized with locale "C.UTF-8".
The default database encoding has accordingly been set to "UTF8".
The default text search configuration will be set to "english".
Data page checksums are disabled.
fixing permissions on existing directory /var/lib/postgresql/16/main ... ok
creating subdirectories ... ok
selecting dynamic shared memory implementation ... posix
selecting default max_connections ... 100
selecting default shared_buffers ... 128MB
selecting default time zone ... Etc/UTC
creating configuration files ... ok
running bootstrap script ... ok
performing post-bootstrap initialization ... ok
syncing data to disk ... ok
Setting up postgresql-contrib (16+257build1.1) ...
Setting up postgresql (16+257build1.1) ...
Processing triggers for ufw (0.36.2-6) ...
Processing triggers for man-db (2.12.0-4build2) ...
Processing triggers for libc-bin (2.39-0ubuntu8.7) ...
Running kernel seems to be up-to-date.
Restarting services...
[OK] Dependências instaladas
[..] Instalando Node.js 20...
2026-03-05 05:26:16 - Installing pre-requisites
Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
Hit:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease
Hit:3 http://security.ubuntu.com/ubuntu noble-security InRelease
Hit:4 http://archive.ubuntu.com/ubuntu noble-backports InRelease
rm -rf /root/randoli-engenharia-solar && rm -f install.sh && curl -sSL "https://raw.githubusercontent.com/icarorandoli/randoli-solar/main/install.sh" -o install.sh && bash install.sh
cd /root/randoli-engenharia-solar
curl -sSL "https://raw.githubusercontent.com/icarorandoli/randoli-solar/main/fix-build.sh" -o fix-build.sh && bash fix-build.sh
cd /root/randoli-solar && bash update.sh
cd /root/randoli-engenharia-solar
ls
cd randoli-engenharia-solar
cd randoli-solar
cd /root/randoli-engenharia-solar && curl -sSL "https://raw.githubusercontent.com/icarorandoli/randoli-solar/main/update.sh" -o update.sh && bash update.sh
cd
cd /root/randoli-engenharia-solar && curl -sSL "https://raw.githubusercontent.com/icarorandoli/randoli-solar/main/update.sh" -o update.sh && bash update.sh
cd /root/randoli-solar && curl -sSL "https://raw.githubusercontent.com/icarorandoli/randoli-solar/main/fix-build.sh" -o fix-build.sh && bash fix-build.sh
cd /root/randoli-solar && curl -sSL "https://raw.githubusercontent.com/icarorandoli/randoli-solar/main/update.sh" -o update.sh && bash update.sh
cd
cd /root/randoli-solar && git pull && npx tsx script/build.ts && pm2 restart randolicd /root/randoli-solar && git pull && npx tsx script/build.ts && pm2 restart randoli
cd
cd /root/randoli-solar && bash update.sh
cd
cd /root/randoli-solar && bash update.sh
cd
cd /root/randoli-solar && bash update.sh
psql -U randoli -d randoli_solar -c "CREATE TABLE IF NOT EXISTS password_reset_tokens (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), user_id VARCHAR NOT NULL REFERENCES users(id), token TEXT NOT NULL UNIQUE, expires_at TIMESTAMP NOT NULL, used BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP DEFAULT now());"
PGPASSWORD="Icba281287@" psql -U randoli -d randoli_solar -c "SELECT tablename FROM pg_tables WHERE tablename = 'password_reset_tokens';"
cd
psql -U randoli -d randoli_solar -c "CREATE TABLE IF NOT EXISTS password_reset_tokens (id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(), user_id VARCHAR NOT NULL REFERENCES users(id), token TEXT NOT NULL UNIQUE, expires_at TIMESTAMP NOT NULL, used BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP DEFAULT now());"
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "\dt password_reset_tokens"
cd /root/randoli-solar && node -e "const{Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL});p.query(\"SELECT tablename FROM pg_tables WHERE tablename='password_reset_tokens'\").then(r=>{console.log(r.rows);p.end()})"
cd /root/randoli-solar && bash update.sh
cd /root/randoli-solar && git pull && bash update.sh
cd
cd /root/randoli-solar
# Aponta para o novo repositório
git remote set-url origin https://github.com/icarorandoli/randoli-solar-v2.git
# Baixa o código novo sem alterar nada ainda
git fetch origin
# Substitui o código pelo do repositório (só arquivos de código, não o banco)
git reset --hard origin/main
# Instala dependências novas (se houver)
npm install
cd /root/randoli-solar
# Aponta para o novo repositório
git remote set-url origin https://github.com/icarorandoli/randoli-solar-v2.git
# Baixa o código novo sem alterar nada ainda
git fetch origin
# Substitui o código pelo do repositório (só arquivos de código, não o banco)
git reset --hard origin/main
# Instala dependências novas (se houver)
npm install
# Gera o build de produção
npm run build
# Reinicia a aplicação
pm2 restart randoli
cd /root/randoli-solar
npm run db:push
psql -U postgres -d randoli_solar
cd
psql -U postgres -d randoli_solar
# Veja a DATABASE_URL que o sistema usa
cat /root/randoli-solar/.env | grep DATABASE_URL
# Conectar como o usuário do sistema (peer auth)
sudo -u postgres psql -d randoli_solar
DO $$ BEGIN
END $$;
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_type client_type NOT NULL DEFAULT 'PF';
ALTER TABLE users ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estado text;
CREATE TABLE IF NOT EXISTS pricing_ranges (
);
CREATE TABLE IF NOT EXISTS client_pricing (
);
CREATE TABLE IF NOT EXISTS password_reset_tokens (
);cat > /tmp/fix_schema.sql << 'EOF'
DO $$ BEGIN
END $$;
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_type client_type NOT NULL DEFAULT 'PF';
ALTER TABLE users ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estado text;
CREATE TABLE IF NOT EXISTS pricing_ranges (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), label text NOT NULL, min_kwp numeric NOT NULL, max_kwp numeric NOT NULL, price numeric NOT NULL, active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0, created_at timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS client_pricing (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), client_id varchar NOT NULL REFERENCES clients(id), range_id varchar REFERENCES pricing_ranges(id), price numeric NOT NULL, description text, active boolean NOT NULL DEFAULT true, created_at timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS password_reset_tokens (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar NOT NULL REFERENCES users(id), token text NOT NULL UNIQUE, expires_at timestamp NOT NULL, used boolean NOT NULL DEFAULT false, created_at timestamp DEFAULT now());
cat > /tmp/fix_schema.sql << 'EOF'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_type') THEN
    CREATE TYPE client_type AS ENUM ('PF', 'PJ');
  END IF;
END $$;
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_type client_type NOT NULL DEFAULT 'PF';
ALTER TABLE users ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estado text;
CREATE TABLE IF NOT EXISTS pricing_ranges (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), label text NOT NULL, min_kwp numeric NOT NULL, max_kwp numeric NOT NULL, price numeric NOT NULL, active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0, created_at timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS client_pricing (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), client_id varchar NOT NULL REFERENCES clients(id), range_id varchar REFERENCES pricing_ranges(id), price numeric NOT NULL, description text, active boolean NOT NULL DEFAULT true, created_at timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS password_reset_tokens (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar NOT NULL REFERENCES users(id), token text NOT NULL UNIQUE, expires_at timestamp NOT NULL, used boolean NOT NULL DEFAULT false, created_at timestamp DEFAULT now());
EOF

sudo -u postgres psql -d randoli_solar -f /tmp/fix_schema.sql
pm2 restart randoli
cd /root/randoli-solar && bash update.sh
psql -U randoli -d randoli_solar -f /root/randoli-solar/migrate_vps.sql
cd /root/randoli-solar && bash update.sh
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -f /root/randoli-solar/migrate_vps.sql
sudo -u postgres psql -d randoli_solar -c "ALTER TABLE client_pricing ADD COLUMN IF NOT EXISTS range_id varchar REFERENCES pricing_ranges(id);"
cd /root/randoli-solar && bash update.sh
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "CREATE TABLE IF NOT EXISTS \"session\" (\"sid\" varchar NOT NULL COLLATE \"default\", \"sess\" json NOT NULL, \"expire\" timestamp(6) NOT NULL, CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\") NOT DEFERRABLE INITIALLY IMMEDIATE); CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");" && pm2 restart randoli
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS \"session\" (
  \"sid\" varchar NOT NULL COLLATE \"default\",
  \"sess\" json NOT NULL,
  \"expire\" timestamp(6) NOT NULL,
  CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\") NOT DEFERRABLE INITIALLY IMMEDIATE
);
CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");

PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS \"session\" (
  \"sid\" varchar NOT NULL COLLATE \"default\",
  \"sess\" json NOT NULL,
  \"expire\" timestamp(6) NOT NULL,
  CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\") NOT DEFERRABLE INITIALLY IMMEDIATE
);
CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");
"
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install --silent
cd /root/randoli-solar && npx tsx script/build.ts && pm2 restart randoli
pm2 status && pm2 logs randoli --lines 10 --nostream
# PASSO 1 — Criar a tabela de sessão (que sumiu)
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "
CREATE TABLE IF NOT EXISTS \"session\" (
  \"sid\" varchar NOT NULL COLLATE \"default\",
  \"sess\" json NOT NULL,
  \"expire\" timestamp(6) NOT NULL,
  CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\") NOT DEFERRABLE INITIALLY IMMEDIATE
);
CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");
"
# PASSO 2 — Adicionar colunas novas do Google OAuth
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean NOT NULL DEFAULT false;
"
# PASSO 3 — Puxar o código novo do GitHub
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main
# PASSO 4 — Instalar pacotes
cd /root/randoli-solar && npm install --silent
cd
# PASSO 4 — Instalar pacotes
cd /root/randoli-solar && npm install --silent
# PASSO 5 — Fazer o build
cd /root/randoli-solar && npm run build
# PASSO 6 — Reiniciar o PM2
pm2 restart randoli
# PASSO 7 — Verificar se subiu corretamente
pm2 logs randoli --lines 15 --nostream
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install --silent && npm run build && PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "
  ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean NOT NULL DEFAULT false;
  CREATE TABLE IF NOT EXISTS \"session\" (
    \"sid\" varchar NOT NULL COLLATE \"default\",
    \"sess\" json NOT NULL,
    \"expire\" timestamp(6) NOT NULL,
    CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\") NOT DEFERRABLE INITIALLY IMMEDIATE
  );
  CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");
" && pm2 restart randoli && echo "✅ TUDO PRONTO!" && pm2 logs randoli --lines 5 --nostreamcd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install --silent && npm run build && PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "
  ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean NOT NULL DEFAULT false;
  CREATE TABLE IF NOT EXISTS \"session\" (
    \"sid\" varchar NOT NULL COLLATE \"default\",
    \"sess\" json NOT NULL,
    \"expire\" timestamp(6) NOT NULL,
    CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\") NOT DEFERRABLE INITIALLY IMMEDIATE
  );
  CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");
" && pm2 restart randoli && echo "✅ TUDO PRONTO!" && pm2 logs randoli --lines 5 --nostream
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install --silent && npm run build && PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "
  ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean NOT NULL DEFAULT false;
  CREATE TABLE IF NOT EXISTS \"session\" (
    \"sid\" varchar NOT NULL COLLATE \"default\",
    \"sess\" json NOT NULL,
    \"expire\" timestamp(6) NOT NULL,
    CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\") NOT DEFERRABLE INITIALLY IMMEDIATE
  );
  CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");
" && pm2 restart randoli && echo "✅ TUDO PRONTO!" && pm2 logs randoli --lines 5 --nostream
}
root@srv1235745:~/randoli-solar# cd
root@srv1235745:~# cd /root/randoli-solar && > git fetch origin && git reset --hard origin/main && > npm install --silent && > npm run build && > PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "
>   ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
>   ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean NOT NULL DEFAULT false;
>   CREATE TABLE IF NOT EXISTS \"session\" (
>     \"sid\" varchar NOT NULL COLLATE \"default\",
>     \"sess\" json NOT NULL,
>     \"expire\" timestamp(6) NOT NULL,
>     CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\") NOT DEFERRABLE INITIALLY IMMEDIATE
>   );
>   CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");
> " && > pm2 restart randoli && > echo "✅ TUDO PRONTO!" && pm2 logs randoli --lines 5 --nostream
HEAD is now at d266bba feat: disable Google login button (coming soon)
> rest-express@1.0.0 build
> tsx script/build.ts
building client...
vite v7.3.0 building client environment for production...
✓ 7 modules transformed.
✗ Build failed in 1.19s
[vite:load-fallback] Could not load /root/randoli-solar/client/src/components/mobile-bottom-nav (imported by client/src/App.tsx): ENOENT: no such file or directory, open '/root/randoli-solar/client/src/components/mobile-bottom-nav'
cd
# Para a aplicação e faz backup do .env
pm2 stop randoli
cp /root/randoli-solar/.env /root/.env.backup 2>/dev/null || true
# Remove o diretório antigo e clona o novo repositório
cd /root && rm -rf randoli-solar && git clone https://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@github.com/icarorandoli/randoli-solar-v3.git randoli-solar
# Restaura o .env com as variáveis de ambiente
cp /root/.env.backup /root/randoli-solar/.env 2>/dev/null || true
# Instala dependências e faz o build
cd /root/randoli-solar && npm install --silent && npm run build
# Atualiza o banco (apenas adiciona colunas novas, não apaga nada)
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "
  ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean NOT NULL DEFAULT false;
  CREATE TABLE IF NOT EXISTS \"session\" (
    \"sid\" varchar NOT NULL COLLATE \"default\",
    \"sess\" json NOT NULL,
    \"expire\" timestamp(6) NOT NULL,
    CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\") NOT DEFERRABLE INITIALLY IMMEDIATE
  );
  CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");
"
# Reinicia com PM2
pm2 start /root/randoli-solar/dist/index.cjs --name randoli && pm2 save
# Verifica
echo "✅ TUDO PRONTO!" && pm2 logs randoli --lines 10 --nostream
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "
  ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_profile_completion boolean NOT NULL DEFAULT false;
  CREATE TABLE IF NOT EXISTS \"session\" (
    \"sid\" varchar NOT NULL COLLATE \"default\",
    \"sess\" json NOT NULL,
    \"expire\" timestamp(6) NOT NULL,
    CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\") NOT DEFERRABLE INITIALLY IMMEDIATE
  );
  CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");
" && pm2 restart randoli
sudo -u postgres psql -d randoli_solar -c "
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO randoli;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO randoli;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO randoli;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO randoli;
"
cd
cd /root/randoli-solar && git pull origin main && npm install --silent && npm run build && pm2 restart randoli && echo "✅ Atualizado!"
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart randoli
cd /root/randoli-solar && pm2 start ecosystem.config.cjs && pm2 save && pm2 list
cd
cd /root/randoli-solar && pm2 start ecosystem.config.cjs && pm2 save && pm2 list
pm2 list
ss -tlnp | grep node
cd
bash <(curl -fsSL https://raw.githubusercontent.com/icarorandoli/randoli-solar-crm/main/install.sh)
cd /home/randoli-crm && git log --oneline -5
cd
cd /home/randoli-crm && git pull origin main && bash update.sh
cd
cd /home/randoli-crm && git fetch origin && git reset --hard origin/main && bash update.sh
cd
ls
cd randoli-solar/
git pull origin main
npm install
npm run db:push
psql $DATABASE_URL
cd
psql $DATABASE_URL
cd ~/randoli-solar
export $(cat .env | xargs)
psql "postgresql://randoli:Icba281287%40@localhost:5432/randoli_solar" -f migrate.sql
cd
psql "postgresql://randoli:Icba281287%40@localhost:5432/randoli_solar" -f migrate.sql
cd ~/randoli-solar
export $(cat .env | xargs)
psql "postgresql://randoli:Icba281287%40@localhost:5432/randoli_solar" -f migrate.sql
psql "postgresql://randoli:Icba281287%40@localhost:5432/randoli_solar" << 'EOF'
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estado TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS estado TEXT;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero_protocolo TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero_instalacao TEXT;

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
EOF

psql "postgresql://randoli:Icba281287%40@localhost:5432/randoli_solar" << 'EOF'
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estado TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS estado TEXT;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero_protocolo TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS numero_instalacao TEXT;

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
EOF

# Se usa PM2:
pm2 restart randoli-solar
# Se usa systemd:
sudo systemctl restart randoli-solar
cd
# Se usa PM2:
pm2 restart randoli-solar
# Se usa systemd:
sudo systemctl restart randoli-solar
pm2 restart randoli
cd randoli-solar/
cd ~/randoli-solar
npm run build
cd
cd ~/randoli-solar
nano server/routes.ts
cd ~/randoli-solar && node -e "
const fs = require('fs');
const path = 'server/routes.ts';
let c = fs.readFileSync(path, 'utf8');

if (c.includes('projectIntegradorId')) {
  console.log('Arquivo ja esta correto!');
} else if (c.includes('project.userId !== user.id')) {
  c = c.replace(
    'if (!isAdmin && project.userId !== user.id)',
    'const projectIntegradorId = project.client?.userId;\n    if (!isAdmin && projectIntegradorId !== user.id)'
  );
  c = c.replace('if (project.userId) {', 'if (projectIntegradorId) {');
  c = c.replace('broadcastToProjectParticipants(project.userId,', 'broadcastToProjectParticipants(projectIntegradorId,');
  fs.writeFileSync(path, c);
  console.log('Corrigido com sucesso!');
} else {
  console.log('AVISO: texto nao encontrado - pode ja ter sido alterado');
}
" && npm run build && pm2 restart randoli-solar
pm2 restart randoli
cd
cd ~/randoli-solar && node -e "
const fs = require('fs');

// === PATCH 1: routes.ts ===
let routes = fs.readFileSync('server/routes.ts', 'utf8');

// Fix import
routes = routes.replace(
  'import { sendStatusEmail, sendTestEmail, sendPasswordResetEmail, type EmailConfig }',
  'import { sendStatusEmail, sendTestEmail, sendPasswordResetEmail, sendDocumentEmail, sendTimelineEmail, type EmailConfig }'
);

// Add document email notification
  routes = routes.replace(
    \"      res.status(201).json(doc);\n    } catch (err: any) { res.status(400).json({ error: err.message }); }\n  });\n\n  app.delete\",
    \`      // Email notification to integrador when admin uploads a document
      const isAdminUpload = user && ['admin', 'engenharia', 'financeiro'].includes(user.role);
      if (isAdminUpload) {
        const project = await storage.getProject(req.params.id);
        if (project) {
          const integradorEmail = project.integrador?.email || project.client?.email;
          const integradorName = project.integrador?.name || project.client?.name || 'Integrador';
          if (integradorEmail) {
            getEmailConfig().then(emailConfig => sendDocumentEmail({
              to: integradorEmail,
              integradorName,
              projectTitle: project.title,
              ticketNumber: project.ticketNumber,
              documentName: doc.name,
              uploadedBy: 'Randoli Engenharia Solar',
              config: emailConfig,
            })).catch(err => console.error('[email] Falha ao enviar notificacao de documento:', err));
          }
        }
      }

      res.status(201).json(doc);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.delete\`
  );
}

// Add timeline email notification
  routes = routes.replace(
    \"      res.status(201).json(entry);\n    } catch (err: any) { res.status(400).json({ error: err.message }); }\n  });\n\n  // ── PARTNERS\",
    \`      // Email notification to integrador when admin adds a timeline note
      const isAdminAction = user && ['admin', 'engenharia', 'financeiro'].includes(user.role);
      if (isAdminAction) {
        const project = await storage.getProject(req.params.id);
        if (project) {
          const integradorEmail = project.integrador?.email || project.client?.email;
          const integradorName = project.integrador?.name || project.client?.name || 'Integrador';
          if (integradorEmail) {
            getEmailConfig().then(emailConfig => sendTimelineEmail({
              to: integradorEmail,
              integradorName,
              projectTitle: project.title,
              ticketNumber: project.ticketNumber,
              event: req.body.event,
              details: req.body.details,
              config: emailConfig,
            })).catch(err => console.error('[email] Falha ao enviar notificacao de historico:', err));
          }
        }
      }

      res.status(201).json(entry);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  // ── PARTNERS\`
  );
}

fs.writeFileSync('server/routes.ts', routes);
console.log('routes.ts atualizado!');
"
root@srv1235745:~# cd ~/randoli-solar && node -e "
> const fs = require('fs');
>
> // === PATCH 1: routes.ts ===
> let routes = fs.readFileSync('server/routes.ts', 'utf8');
>
> // Fix import
> routes = routes.replace(
>   'import { sendStatusEmail, sendTestEmail, sendPasswordResetEmail, type EmailConfig }',
>   'import { sendStatusEmail, sendTestEmail, sendPasswordResetEmail, sendDocumentEmail, sendTimelineEmail, type EmailConfig }'
> );
>
> // Add document email notification
>   routes = routes.replace(
>     \"      res.status(201).json(doc);\n    } catch (err: any) { res.status(400).json({ error: err.message }); }\n  });\n\n  app.delete\",
>     \`      // Email notification to integrador when admin uploads a document
>       const isAdminUpload = user && ['admin', 'engenharia', 'financeiro'].includes(user.role);
>       if (isAdminUpload) {
>         const project = await storage.getProject(req.params.id);
>         if (project) {
>           const integradorEmail = project.integrador?.email || project.client?.email;
>           const integradorName = project.integrador?.name || project.client?.name || 'Integrador';
>           if (integradorEmail) {
>             getEmailConfig().then(emailConfig => sendDocumentEmail({
>               to: integradorEmail,
>               integradorName,
>               projectTitle: project.title,
>               ticketNumber: project.ticketNumber,
>               documentName: doc.name,
>               uploadedBy: 'Randoli Engenharia Solar',
>               config: emailConfig,
>             })).catch(err => console.error('[email] Falha ao enviar notificacao de documento:', err));
>           }
>         }
>       }
>
>       res.status(201).json(doc);
>     } catch (err: any) { res.status(400).json({ error: err.message }); }
>   });
>
>   app.delete\`
>   );
> }
>
> // Add timeline email notification
>   routes = routes.replace(
>     \"      res.status(201).json(entry);\n    } catch (err: any) { res.status(400).json({ error: err.message }); }\n  });\n\n  // ── PARTNERS\",
>     \`      // Email notification to integrador when admin adds a timeline note
>       const isAdminAction = user && ['admin', 'engenharia', 'financeiro'].includes(user.role);
>       if (isAdminAction) {
>         const project = await storage.getProject(req.params.id);
>         if (project) {
>           const integradorEmail = project.integrador?.email || project.client?.email;
>           const integradorName = project.integrador?.name || project.client?.name || 'Integrador';
>           if (integradorEmail) {
>             getEmailConfig().then(emailConfig => sendTimelineEmail({
>               to: integradorEmail,
>               integradorName,
>               projectTitle: project.title,
>               ticketNumber: project.ticketNumber,
>               event: req.body.event,
>               details: req.body.details,
>               config: emailConfig,
>             })).catch(err => console.error('[email] Falha ao enviar notificacao de historico:', err));
>           }
>         }
>       }
>
>       res.status(201).json(entry);
>     } catch (err: any) { res.status(400).json({ error: err.message }); }
>   });
>
>   // ── PARTNERS\`
>   );
> }
>
> fs.writeFileSync('server/routes.ts', routes);
> console.log('routes.ts atualizado!');
> "
[eval]:43
}
SyntaxError: Unexpected token '}'
Node.js v20.20.0cdd
cd
cd ~/randoli-solar
git pull origin main
npm run build
pm2 restart $(pm2 list | grep -o '[0-9]\+' | head -1)
cd
cd ~/randoli-solar && git pull origin main && npm run build && pm2 restart $(pm2 list | awk '/online/{print $4}' | head -1)
pm2 restart randoli
pm2 logs --lines 50
ce
cd
cd ~/randoli-solar
git fetch origin
git reset --hard origin/main
npm run build
pm2 restart randoli
cd
cd ~/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart randoli
cd randoli
ld
ls
cd randoli-rolar
ls
cd randoli-solar
ls
git pull origin main
npm install
npm run build
pm2 restart all
ls
cd randoli-solar/
git pull origin main
npm install
npm run build
pm2 restart randoli
cd /home/randoli-crm && git pull origin main && npm install && npm run build && pm2 restart randoli-crm
cd
cd /home/randoli-crm && git pull origin main && npm install && npm run build && pm2 restart randoli-crm
cd randoli-solar/
git pull origin main
npm install
npm run build
pm2 restart randoli
git pull origin main
npm install
npm run build
pm2 restart randoli
git pull origin main
npm install
npm run build
pm2 restart randoli
CD
cd
cd /home/
ls
cd
cd /home/randoli-crm && git pull origin main && npm install && npm run build && pm2 restart randoli-crm
ls
cd randoli-solar/
git pull origin main
npm install
npm run  db:push
npm run build
pm2 restart randoli
git pull origin main
npm install
npm run db:push
npm run build
pm2 restart randoli
cd /root/randoli-solar
npm run db:push
cd
cd /root/randoli-solar
sudo -u postgres npx drizzle-kit push
# 1. Transferir a propriedade das tabelas para o usuário correto
sudo -u postgres psql -d randoli_solar -c "
ALTER TABLE client_pricing OWNER TO randoli;
"
sudo -u postgres psql -d randoli_solar << 'EOF'

-- Corrigir permissões de todas as tabelas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO randoli;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO randoli;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO randoli;

-- Adicionar colunas que podem estar faltando no chat_messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_by_admin boolean NOT NULL DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_by_integrador boolean NOT NULL DEFAULT false;

-- Criar as 3 tabelas novas do módulo solar
CREATE TABLE IF NOT EXISTS solar_irradiation (
  id SERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  irradiation_kwh_m2_day NUMERIC NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC
);

CREATE TABLE IF NOT EXISTS solar_panels (
  id SERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  power_wp INTEGER NOT NULL,
  efficiency NUMERIC,
  voc NUMERIC,
  isc NUMERIC,
  dimensions TEXT,
  weight NUMERIC,
  warranty_years INTEGER,
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS solar_inverters (
  id SERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  power_kw NUMERIC NOT NULL,
  mppt_min NUMERIC,
  mppt_max NUMERIC,
  max_input_voltage NUMERIC,
  phases INTEGER DEFAULT 1,
  efficiency NUMERIC,
  warranty_years INTEGER,
  active BOOLEAN DEFAULT true
);

-- Garantir permissões nas novas tabelas também
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO randoli;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO randoli;

EOF

pm2 restart randoli
cd /root/randoli-solar
# 1. Pegar o arquivo de migração atualizado
git pull origin main
# 2. Rodar a migração (como superusuário para não ter problema de permissão)
sudo -u postgres psql -d randoli_solar -f migrate_vps.sql
cd
cd /root/randoli-solar
git pull origin main
npm install
npm run build
pm2 restart all
la
ls
cs randoli-solar
git pull origin main
cd randol-solar
ls
cd /randoli-solar
cd randoli-solar
git pull origin main
npm install
npm run db:push
npm run build
pm2 restart randoli
git remote set-url origin https://github.com/icarorandoli/Novo-crm-projetos.git
git pull origin maingit remote set-url origin https://github.com/icarorandoli/Novo-crm-projetos.git
git pull origin main
git remote set-url origin https://github.com/icarorandoli/Novo-crm-projetos.git
git pull origin main
git remote set-url origin https://github.com/icarorandoli/Novo-crm-projetos.git
# Buscar o conteúdo do novo repositório
git fetch origin
# Forçar o código local a ficar igual ao novo repositório
git reset --hard origin/main
# Depois continuar normalmente
npm install
npm run db:push
npm run build
pm2 restart randoli
npm run db:push
pm2 restart randoli
# Ver se o servidor está rodando
pm2 list
# Ver os logs de erro
pm2 logs --lines 50
cd /root
cd root 
cd /root
ls
cd randoli-solar
git pull origin main
nom run build
npm run build
pm2 restart randoli
cd /root/randoli-solar
git pull origin main
# Adicionar colunas do Inter ao banco (seguro — usa IF NOT EXISTS)
sudo -u postgres psql -d randoli_solar -c "
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inter_pix_txid text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inter_pix_copia_cola text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inter_pix_qr_code_base64 text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inter_pix_status text;"
npm install
npm run build
pm2 restart randoli
ls
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart allcd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm install && npm run build && pm2 restart all
db:push
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart allcd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart allcd /root/randoli-solar && git pull origin main && npm run build && pm2 restart allcd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
pm2 logs --lines 20 | grep -i "POST response\|linhaDigitavel\|nossoNumero\|BolePIX criado"
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
pm2 logs --lines 20 | grep -i "POST response\|linhaDigitavel\|nossoNumero\|BolePIX criado"
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
pm2 logs --lines 30 | grep -i "POST response\|linhaDigitavel\|BolePIX criado\|migration"
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm run build && npm run db:push && pm2 restart all
cd
export $(cat /root/randoli-solar/.env | grep DATABASE_URL) && psql $DATABASE_URL -c "ALTER TABLE projects ADD COLUMN IF NOT EXISTS inter_boleto_linha_digitavel TEXT;"
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd
export $(grep DATABASE_URL /root/randoli-solar/.env | xargs) && psql $DATABASE_URL -c "ALTER TABLE projects ADD COLUMN IF NOT EXISTS inter_boleto_linha_digitavel TEXT;"
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull origin main && npm run build && pm2 restart all
pm2 logs --lines 30
cd randoli-solar/
pm2 restart randoli
ls
npm run build
docker stack rm traefik 2>/dev/null; docker rm -f $(docker ps -aq --filter name=traefik) 2>/dev/null
bash <(curl -sSL setup.oriondesign.art.br)
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
pm2 logs --lines 100 | grep -i whatsapp
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git log --oneline -3
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
git log --oneline -1
docker stack rm traefik 2>/dev/null; docker rm -f $(docker ps -aq --filter name=traefik) 2>/dev/null
apt install -y docker.io && systemctl start docker && systemctl enable docker
dpkg --configure -a && apt install -y docker.io && systemctl start docker && systemctl enable docker
docker run -d   --name evolution-api   --restart always   -p 8080:8080   -e SERVER_URL=https://api.randolisolar.com.br   -e AUTHENTICATION_TYPE=apikey   -e AUTHENTICATION_API_KEY=Icba281287@   -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true   atendai/evolution-api:latest
server {
}
ln -s /etc/nginx/sites-available/evolution /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
ln -s /etc/nginx/sites-available/evolution /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.randolisolar.com.br
rm /etc/nginx/sites-enabled/evolution
cat > /etc/nginx/sites-available/api-evolution << 'EOF'
server {
    listen 80;
    server_name api.randolisolar.com.br;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/api-evolution /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx
certbot --nginx -d api.randolisolar.com.br
dpkg --configure -a && apt install -y docker.io && systemctl start docker && systemctl enable docker
docker run -d   --name evolution-api   --restart always   -p 8080:8080   -e SERVER_URL=https://api.randolisolar.com.br   -e AUTHENTICATION_TYPE=apikey   -e AUTHENTICATION_API_KEY=RandoliSolar2026!   -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true   atendai/evolution-api:latest
docker rm -f evolution-api && docker run -d   --name evolution-api   --restart always   -p 8080:8080   -e SERVER_URL=https://api.randolisolar.com.br   -e AUTHENTICATION_TYPE=apikey   -e AUTHENTICATION_API_KEY=RandoliSolar2026!   -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true   atendai/evolution-api:latest
docker ps | grep evolution
docker logs evolution-api
docker rm -f evolution-api && docker run -d   --name evolution-api   --restart always   -p 8080:8080   -e SERVER_URL=https://api.randolisolar.com.br   -e AUTHENTICATION_TYPE=apikey   -e AUTHENTICATION_API_KEY=RandoliSolar2026!   -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true   -e DATABASE_PROVIDER=sqlite   -v evolution_data:/evolution/instances   atendai/evolution-api:latest
docker logs evolution-api
docker rm -f evolution-api && docker run -d   --name evolution-api   --restart always   -p 8080:8080   -e SERVER_URL=https://api.randolisolar.com.br   -e AUTHENTICATION_TYPE=apikey   -e AUTHENTICATION_API_KEY=RandoliSolar2026!   -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true   -v evolution_data:/evolution/instances   atendai/evolution-api:v1.8.2
pm2 logs --lines 50 | grep whatsapp
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git log --oneline -3
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git log --oneline -1
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
git log --oneline -1
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host randoli_solar randoli 0.0.0.0/0 md5" >> /etc/postgresql/*/main/pg_hba.conf
ufw allow 5432/tcp
systemctl restart postgresql
ss -tlnp | grep 5432
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run db:push && npm run build && pm2 restart all
npm run db:push
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run db:push && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run db:push && npm run build && pm2 restart all
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
ls
cd randoli-solar/
ls
cd ..
From https://github.com/icarorandoli/randoli-solar-v3
HEAD is now at b001a9a fix: routing, null-safety, homologado count, archived management
> rest-express@1.0.0 build
> tsx script/build.ts
building client...
vite v7.3.0 building client environment for production...
✓ 24 modules transformed.
✗ Build failed in 1.89s
[vite:load-fallback] Could not load /root/randoli-solar/client/src/components/cliente-sidebar (imported by client/src/App.tsx): ENOENT: no such file or directory, open '/root/randoli-solar/client/src/components/cliente-sidebar'
}
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.11.1
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.11.1
npm notice To update run: npm install -g npm@11.11.1
npm notice
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
git fetch && git reset --hard origin/main && npm run build && pm2 restart all
cd randoli-solar/
git fetch && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm run build && pm2 restart all
CD
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
ls -la /root/randoli-solar/dist/public/ | head -5
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
git log --oneline -1
cd randoli-solar/
git log --oneline -1
cd
git log --oneline -1
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git pull && npm run build && pm2 restart all
git log --oneline -1
cd
cd /root/randoli-solar && npm run db:push
psql postgresql://randoli:Icba281287%40@localhost:5432/randoli_solar
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
cd
cd /root/randoli-solar && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://randoli:Icba281287%40@localhost:5432/randoli_solar' });
async function fix() {
  await pool.query(\"UPDATE site_settings SET value='140601' WHERE key='nfse_ctrib_nac'\");
  await pool.query(\"UPDATE site_settings SET value='101061900' WHERE key='nfse_cnbs'\");
  await pool.query(\"UPDATE site_settings SET value='' WHERE key='nfse_ctrib_mun'\");
  await pool.query(\"UPDATE site_settings SET value='' WHERE key='nfse_webservice_url'\");
  const r = await pool.query(\"SELECT key,value FROM site_settings WHERE key LIKE 'nfse_%' AND key IN ('nfse_ctrib_nac','nfse_cnbs','nfse_ctrib_mun','nfse_webservice_url')\");
  console.log('Verificado:', r.rows);
  await pool.end();
}
fix().catch(console.error);
"
cd
# 1. Deploy do código
cd /root/randoli-solar && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart all
# 2. Corrigir banco do VPS (após pm2 reiniciar)
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://randoli:Icba281287%40@localhost:5432/randoli_solar' });
async function fix() {
  await pool.query(\"UPDATE site_settings SET value='140601' WHERE key='nfse_ctrib_nac'\");
  await pool.query(\"UPDATE site_settings SET value='101061900' WHERE key='nfse_cnbs'\");
  await pool.query(\"UPDATE site_settings SET value='' WHERE key='nfse_ctrib_mun'\");
  await pool.query(\"UPDATE site_settings SET value='' WHERE key='nfse_webservice_url'\");
  const r = await pool.query(\"SELECT key,value FROM site_settings WHERE key IN ('nfse_ctrib_nac','nfse_cnbs','nfse_ctrib_mun','nfse_webservice_url')\");
  console.log('OK:', r.rows);
  await pool.end();
}
fix();
"
cd
cd /root/randoli-solar   && git fetch origin   && git reset --hard origin/main   && npm install   && npm run build   && pm2 restart all
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://randoli:Icba281287%40@localhost:5432/randoli_solar' });
pool.query(\"UPDATE site_settings SET value='140601' WHERE key='nfse_ctrib_nac'\")
  .then(() => pool.query(\"UPDATE site_settings SET value='101061900' WHERE key='nfse_cnbs'\"))
  .then(() => pool.query(\"UPDATE site_settings SET value='' WHERE key='nfse_ctrib_mun'\"))
  .then(() => pool.query(\"UPDATE site_settings SET value='' WHERE key='nfse_webservice_url'\"))
  .then(() => { console.log('Banco OK'); pool.end(); });
"
cd
cd /root/randoli-solar   && git fetch origin   && git reset --hard origin/main   && npm run build   && pm2 restart all
npm run build
pm2 restart randoli
pm2 list
cd
cd /root/randoli-solar
npm run build
pm2 restart randoli
cd
grep "tpRetISSQN" /root/randoli-solar/server/nfse.ts
nano /root/randoli-solar/server/nfse.ts
npm run build && pm2 restart randoli
cd /root/randoli-solar && npm run build && pm2 restart randoli
sed -i '10s/tpRetISSQN>2import https from "https";/import https from "https";/' /root/randoli-solar/server/nfse.ts
cd
sed -i '10s/tpRetISSQN>2import https from "https";/import https from "https";/' /root/randoli-solar/server/nfse.ts
head -12 /root/randoli-solar/server/nfse.ts
cd /root/randoli-solar && npm run build && pm2 restart randoli
pm2 restart
pm2 restart randoli
pm2 logs randoli --lines 20
cd /root/randoli-solar
git checkout server/nfse.ts
sed -i 's/<tpRetISSQN>1<\/tpRetISSQN>/<tpRetISSQN>2<\/tpRetISSQN>/g' server/nfse.ts
grep "tpRetISSQN" server/nfse.ts
npm run build && pm2 restart randoli
cd
cd /root/randoli-solar && git checkout server/nfse.ts && sed -i 's/<regTrib><opSimpNac>0<\/opSimpNac><regEspTrib>0<\/regEspTrib><\/regTrib>/<regTrib><opSimpNac>3<\/opSimpNac><regApTribSN>1<\/regApTribSN><regEspTrib>0<\/regEspTrib><\/regTrib>/g' server/nfse.ts && sed -i 's/<tpRetISSQN>1<\/tpRetISSQN>/<tpRetISSQN>2<\/tpRetISSQN>/g' server/nfse.ts && npm run build && pm2 restart randoli
cd
grep -E "regTrib|tpRetISSQN" /root/randoli-solar/server/nfse.ts
cd /root/randoli-solar && npm run build && pm2 restart randoli
cd
ls /root/randoli-solar/server/
grep -n "descricaoServico\|emitirNfse\|nfse" /root/randoli-solar/server/routes.ts | head -40
sed -n '2558,2630p' /root/randoli-solar/server/routes.ts
grep -n "descricaoServico" /root/randoli-solar/server/nfse.ts
grep -n "descricaoServico" /root/randoli-solar/dist/index.cjs | head -5
grep -n "descricaoServico" /root/randoli-solar/server/nfse.ts
grep -n "descricaoServico" /root/randoli-solar/dist/index.cjs | head -5
pm2 restart randoli && pm2 logs randoli --lines 20
curl -I https://coplan.inf.br/tributario/sinop/anfse_ws
grep -o "tpRetISSQN>[0-9]" /root/randoli-solar/dist/index.cjs
cd /root/randoli-solar   && git fetch origin   && git reset --hard origin/main   && npm run build   && pm2 restart all
cd /root/randoli-solar   && git fetch origin   && git reset --hard origin/main   && npm run build   && pm2 restart all
cd /root/randoli-solar   && git fetch origin   && git reset --hard origin/main   && npm run build   && pm2 restart all
cd /root/randoli-solar   && git fetch origin   && git reset --hard origin/main   && npm run build   && pm2 restart all
cd /root/randoli-solar   && git fetch origin   && git reset --hard origin/main   && npm run build   && pm2 restart all
cd /root/randoli-solar
grep -o "tpRetISSQN>[0-9].*pAliq" /root/randoli-solar/server/nfse.ts
sed -i 's|<tpRetISSQN>2<\/tpRetISSQN><pAliq>\${[^}]*}<\/pAliq>|<tpRetISSQN>2<\/tpRetISSQN>|g' /root/randoli-solar/server/nfse.ts
grep -o "tpRetISSQN>[0-9].*pAliq" /root/randoli-solar/server/nfse.ts
sed -i 's|<tpRetISSQN>2<\/tpRetISSQN><pAliq>\${[^}]*}<\/pAliq>|<tpRetISSQN>2<\/tpRetISSQN>|g' /root/randoli-solar/server/nfse.ts
grep -n "tpRetISSQN\|pAliq" /root/randoli-solar/server/nfse.ts
npm run build && pm2 restart randoli
grep -n "isSimplesNacional" /root/randoli-solar/server/nfse.ts
grep -n "tpRetISSQN\|pAliq" server/nfse.ts
nano server/nfse.ts
npm run build
grep -n "tpRetISSQN\|pAliq" server/nfse.ts
# Ver se o build terminou
pm2 status
# Confirmar que o dist novo não tem pAliq para Simples
grep -o "isSimplesNacional?.*pAliq" /root/randoli-solar/dist/index.cjs | head -3
cd /root/randoli-solar && npm run build 2>&1 | tail -20
pm2 restart randoli
grep -o "pAliqTag" /root/randoli-solar/dist/index.cjs | head -3
grep -c "pAliqTag" /root/randoli-solar/dist/index.cjs
grep -o "tpRetISSQN>[0-9]</tpRetISSQN>[^<]*" /root/randoli-solar/dist/index.cjs | head -3
grep -o "pAliq" /root/randoli-solar/dist/index.cjs | head -5
find /root/randoli-solar -name "nfse.ts" 2>/dev/null
grep -o ".\{30\}pAliq.\{30\}" /root/randoli-solar/dist/index.cjs
cd /root/randoli-solar && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\"SELECT key, value FROM site_settings WHERE key LIKE 'nfse_%' ORDER BY key\").then(r => {
  r.rows.forEach(row => console.log(row.key, '=', row.value));
  pool.end();
});
"
cat /root/randoli-solar/.env | grep -E "DATABASE_URL|nfse"
pm2 env 0 | grep -E "DATABASE|nfse"
PGPASSWORD='Icba281287@' psql -U randoli -d randoli_solar -c "SELECT key, value FROM site_settings WHERE key LIKE 'nfse_%' ORDER BY key;"
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "SELECT key, value FROM site_settings WHERE key LIKE 'nfse_%' ORDER BY key;"
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "SELECT key, value FROM site_settings WHERE key LIKE 'nfse_%' AND key != 'nfse_certificado_pfx' ORDER BY key;"
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "SELECT name, cpf_cnpj, rua, cep, cidade, estado FROM clients WHERE name ILIKE '%thales%';"
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "SELECT key, value FROM site_settings WHERE key LIKE 'nfse_%' AND key != 'nfse_certificado_pfx' ORDER BY key;"
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "\d clients" | grep -i "mun\|cep\|cid\|cod"
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "ALTER TABLE clients ADD COLUMN IF NOT EXISTS codigo_municipio TEXT;"
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "UPDATE clients SET codigo_municipio = '5103254' WHERE name ILIKE '%thales%';"
grep -n "tomadorCodigoMunicipio" /root/randoli-solar/server/routes.ts | head -10
grep -n "tomadorCodigoMunicipio\|5107909" /root/randoli-solar/server/nfse.ts | head -10
grep -rn "tomadorCodigoMunicipio" /root/randoli-solar/server/ | head -10
grep -n "emitirNfse\|tomadorCodigo\|tomadorCep\|client\.cep\|client\.cidade" /root/randoli-solar/server/routes.ts | head -20
grep -n "we({" /root/randoli-solar/server/routes.ts | head -5
sed -n '960,980p' /root/randoli-solar/server/routes.ts
sed -n '1546,1566p' /root/randoli-solar/server/routes.ts
sed -n '2577,2597p' /root/randoli-solar/server/routes.ts
# Adicionar tomadorCodigoMunicipio em todas as chamadas (após tomadorCep)
sed -i 's/tomadorCep: client?.cep || proj\.cep || undefined,/tomadorCep: client?.cep || proj.cep || undefined,\n                tomadorCodigoMunicipio: (client as any)?.codigoMunicipio || undefined,/g' /root/randoli-solar/server/routes.ts
sed -i 's/tomadorCep: client?.cep || project\.cep || undefined,/tomadorCep: client?.cep || project.cep || undefined,\n            tomadorCodigoMunicipio: (client as any)?.codigoMunicipio || undefined,/g' /root/randoli-solar/server/routes.ts
grep -n "codigo_municipio\|codigoMunicipio" /root/randoli-solar/server/storage.ts | head -10
grep -n "codigo_municipio\|codigoMunicipio" /root/randoli-solar/shared/schema.ts | head -10
grep -n "cep\|cidade\|estado" /root/randoli-solar/shared/schema.ts | head -15
grep -n "cep\|cidade\|estado" /root/randoli-solar/server/storage.ts | head -15
sed -n '45,70p' /root/randoli-solar/shared/schema.ts
grep -n "cep\|cidade\|estado\|bairro" /root/randoli-solar/server/storage.ts | grep -v "user\|User\|227\|228\|229\|239\|240\|241" | head -20
sed -i 's/  estado: text("estado"),\n  userId: varchar/  estado: text("estado"),\n  codigoMunicipio: text("codigo_municipio"),\n  userId: varchar/' /root/randoli-solar/shared/schema.ts
cler
clear
root@srv1235745:~# sed -i 's/  estado: text("estado"),\n  userId: varchar/  estado: text("estado"),\n  codigoMunicipio: text("codigo_municipio"),\n  userId: varchar/' /root/randoli-solar/shared/schema.ts
root@srv1235745:~#python3 -c "
content = open('/root/randoli-solar/shared/schema.ts').read()
old = '  estado: text(\"estado\"),\n  userId: varchar'
new = '  estado: text(\"estado\"),\n  codigoMunicipio: text(\"codigo_municipio\"),\n  userId: varchar'
content = content.replace(old, new, 1)
open('/root/randoli-solar/shared/schema.ts', 'w').write(content)
print('OK:', 'codigoMunicipio' in content)
"
python3 -c "content = open('/root/randoli-solar/shared/schema.ts').read(); new_content = content.replace('  estado: text(\"estado\"),\n  userId: varchar', '  estado: text(\"estado\"),\n  codigoMunicipio: text(\"codigo_municipio\"),\n  userId: varchar', 1); open('/root/randoli-solar/shared/schema.ts', 'w').write(new_content); print('OK:', 'codigoMunicipio' in new_content)"
python3 -c "content = open('/root/randoli-solar/server/storage.ts').read(); new_content = content.replace('  estado: string | null;\n  userId', '  estado: string | null;\n  codigoMunicipio: string | null;\n  userId', 1); open('/root/randoli-solar/server/storage.ts', 'w').write(new_content); print('OK:', 'codigoMunicipio' in new_content)"
grep -n "estado\|cep\|cidade\|userId" /root/randoli-solar/server/storage.ts | head -20
sed -n '33,45p' /root/randoli-solar/server/storage.ts
clear
sed -n '33,45p' /root/randoli-solar/server/storage.ts
python3 -c "content = open('/root/randoli-solar/server/storage.ts').read(); new_content = content.replace('  estado: string | null;\n};', '  estado: string | null;\n  codigoMunicipio: string | null;\n};', 1); open('/root/randoli-solar/server/storage.ts', 'w').write(new_content); print('OK:', 'codigoMunicipio' in new_content)"
clear
grep -n "createClient\|updateClient" /root/randoli-solar/server/routes.ts | head -10
grep -n "async createClient\|async updateClient" /root/randoli-solar/server/storage.ts
sed -n '555,575p' /root/randoli-solar/server/routes.ts
clear
python3 -c "
content = open('/root/randoli-solar/server/routes.ts').read()

# Adicionar função helper após os imports (no início do arquivo)
helper = '''
async function buscarCodigoMunicipioPorCep(cep: string): Promise<string | null> {
  try {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return null;
    const res = await fetch(\`https://viacep.com.br/ws/\${cepLimpo}/json/\`);
    const data = await res.json();
    return data.ibge || null;
  } catch { return null; }
}

'''

# Inserir antes da primeira rota de createClient
target = '      const data = insertClientSchema.parse(req.body);\n      res.status(201).json(await storage.createClient(data));'
replacement = '''      const data = insertClientSchema.parse(req.body);
        const ibge = await buscarCodigoMunicipioPorCep(data.cep);
        if (ibge) (data as any).codigoMunicipio = ibge;
      }
      res.status(201).json(await storage.createClient(data));'''

new_content = content.replace(target, replacement, 1)

# Inserir na rota de updateClient
target2 = '      const data = insertClientSchema.partial().parse(req.body);\n      const c = await storage.updateClient((req.params.id as string), data);'
replacement2 = '''      const data = insertClientSchema.partial().parse(req.body);
      if (data.cep && !(data as any).codigoMunicipio) {
        const ibge = await buscarCodigoMunicipioPorCep(data.cep);
        if (ibge) (data as any).codigoMunicipio = ibge;
      }
      const c = await storage.updateClient((req.params.id as string), data);'''

new_content = new_content.replace(target2, replacement2, 1)

# Adicionar helper no início (após primeira linha de import)
first_import_end = new_content.find('\n', new_content.find('import ')) + 1
new_content = new_content[:first_import_end] + helper + new_content[first_import_end:]

open('/root/randoli-solar/server/routes.ts', 'w').write(new_content)
print('OK: buscarCodigoMunicipioPorCep' in new_content)
"
clear
cat > /tmp/fix_viacep.py << 'PYEOF'
content = open('/root/randoli-solar/server/routes.ts').read()

helper = '''
async function buscarCodigoMunicipioPorCep(cep: string): Promise<string | null> {
  try {
    const cepLimpo = cep.replace(/\\D/g, "");
    if (cepLimpo.length !== 8) return null;
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.ibge || null;
  } catch { return null; }
}

'''

# Inserir helper após primeira linha de import
first_import_end = content.find('\n', content.find('import ')) + 1
content = content[:first_import_end] + helper + content[first_import_end:]

# Corrigir createClient
content = content.replace(
    '      const data = insertClientSchema.parse(req.body);\n      res.status(201).json(await storage.createClient(data));',
    '      const data = insertClientSchema.parse(req.body);\n      if (data.cep && !(data as any).codigoMunicipio) {\n        const ibge = await buscarCodigoMunicipioPorCep(data.cep);\n        if (ibge) (data as any).codigoMunicipio = ibge;\n      }\n      res.status(201).json(await storage.createClient(data));',
    1
)

# Corrigir updateClient
content = content.replace(
    '      const data = insertClientSchema.partial().parse(req.body);\n      const c = await storage.updateClient((req.params.id as string), data);',
    '      const data = insertClientSchema.partial().parse(req.body);\n      if (data.cep && !(data as any).codigoMunicipio) {\n        const ibge = await buscarCodigoMunicipioPorCep(data.cep);\n        if (ibge) (data as any).codigoMunicipio = ibge;\n      }\n      const c = await storage.updateClient((req.params.id as string), data);',
    1
)

open('/root/randoli-solar/server/routes.ts', 'w').write(content)
print('OK:', 'buscarCodigoMunicipioPorCep' in content)
PYEOF

python3 /tmp/fix_viacep.py
clear
cat > /tmp/fix_viacep.py << 'PYEOF'
content = open('/root/randoli-solar/server/routes.ts').read()

helper = '''
async function buscarCodigoMunicipioPorCep(cep: string): Promise<string | null> {
  try {
    const cepLimpo = cep.replace(/\\D/g, "");
    if (cepLimpo.length !== 8) return null;
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.ibge || null;
  } catch { return null; }
}

'''

# Inserir helper após primeira linha de import
first_import_end = content.find('\n', content.find('import ')) + 1
content = content[:first_import_end] + helper + content[first_import_end:]

# Corrigir createClient
content = content.replace(
    '      const data = insertClientSchema.parse(req.body);\n      res.status(201).json(await storage.createClient(data));',
    '      const data = insertClientSchema.parse(req.body);\n      if (data.cep && !(data as any).codigoMunicipio) {\n        const ibge = await buscarCodigoMunicipioPorCep(data.cep);\n        if (ibge) (data as any).codigoMunicipio = ibge;\n      }\n      res.status(201).json(await storage.createClient(data));',
    1
)

# Corrigir updateClient
content = content.replace(
    '      const data = insertClientSchema.partial().parse(req.body);\n      const c = await storage.updateClient((req.params.id as string), data);',
    '      const data = insertClientSchema.partial().parse(req.body);\n      if (data.cep && !(data as any).codigoMunicipio) {\n        const ibge = await buscarCodigoMunicipioPorCep(data.cep);\n        if (ibge) (data as any).codigoMunicipio = ibge;\n      }\n      const c = await storage.updateClient((req.params.id as string), data);',
    1
)

open('/root/randoli-solar/server/routes.ts', 'w').write(content)
print('OK:', 'buscarCodigoMunicipioPorCep' in content)
PYEOF

python3 /tmp/fix_viacep.py
clear
sed -n '960,980p' /root/randoli-solar/server/routes.ts
sed -n '1546,1566p' /root/randoli-solar/server/routes.ts
grep -n "tomadorCodigoMunicipio\|emitirNfse" /root/randoli-solar/server/routes.ts | head -20
sed -n '202,215p' /root/randoli-solar/server/storage.ts
cd /root/randoli-solar && npm run build 2>&1 | tail -15 && pm2 restart randoli
sed -n '588,605p' /root/randoli-solar/server/routes.ts
python3 -c "
content = open('/root/randoli-solar/server/routes.ts').read()
old = '      const data = insertClientSchema.parse(req.body);\n        const ibge = await buscarCodigoMunicipioPorCep(data.cep);\n        if (ibge) (data as any).codigoMunicipio = ibge;\n      }'
new = '      const data = insertClientSchema.parse(req.body);\n      if (data.cep) {\n        const ibge = await buscarCodigoMunicipioPorCep(data.cep);\n        if (ibge) (data as any).codigoMunicipio = ibge;\n      }'
content = content.replace(old, new, 1)
open('/root/randoli-solar/server/routes.ts', 'w').write(content)
print('OK')
"
> "
npm run build 2>&1 | tail -15 && pm2 restart randoli
grep -n "buscarCodigoMunicipioPorCep" /root/randoli-solar/server/routes.ts | head -10
pm2 restart randoli
sed -n '1,40p' /root/randoli-solar/server/routes.ts
python3 -c "
content = open('/root/randoli-solar/server/routes.ts').read()

func1 = '''async function buscarCodigoMunicipioPorCep(cep: string): Promise<string | null> {
  try {
    const cepLimpo = cep.replace(/\D/g, \"\");
    if (cepLimpo.length !== 8) return null;
    const response = await fetch(\`https://viacep.com.br/ws/\${cepLimpo}/json/\`);
    const data = await response.json();
    return data.ibge || null;
  } catch { return null; }
}
async function buscarCodigoMunicipioPorCep(cep: string): Promise<string | null> {
  try {
    const cepLimpo = cep.replace(/\D/g, \"\");
    if (cepLimpo.length !== 8) return null;
    const response = await fetch(\`https://viacep.com.br/ws/\${cepLimpo}/json/\`);
    const data = await response.json();
    return data.ibge || null;
  } catch { return null; }
}
async function buscarCodigoMunicipioPorCep(cep: string): Promise<string | null> {
  try {
    const cepLimpo = cep.replace(/\D/g, \"\");
    if (cepLimpo.length !== 8) return null;
    const res = await fetch(\`https://viacep.com.br/ws/\${cepLimpo}/json/\`);
    const data = await res.json();
    return data.ibge || null;
  } catch { return null; }
}'''

func_single = '''async function buscarCodigoMunicipioPorCep(cep: string): Promise<string | null> {
  try {
    const cepLimpo = cep.replace(/\\D/g, \"\");
    if (cepLimpo.length !== 8) return null;
    const response = await fetch(\`https://viacep.com.br/ws/\${cepLimpo}/json/\`);
    const data = await response.json();
    return data.ibge || null;
  } catch { return null; }
}'''

content = content.replace(func1, func_single, 1)
open('/root/randoli-solar/server/routes.ts', 'w').write(content)
print('Funcs remaining:', content.count('buscarCodigoMunicipioPorCep(cep:'))
"
cat > /tmp/fix_dup.py << 'PYEOF'
content = open('/root/randoli-solar/server/routes.ts').read()

# Remover as duas primeiras ocorrências da função deixando só a terceira
# Contar quantas vezes aparece
count = content.count('async function buscarCodigoMunicipioPorCep')
print('Antes:', count)

# Pegar o início do arquivo até o import real
idx_import = content.find('import { createServer')
header = content[:idx_import]
rest = content[idx_import:]

# Manter só uma cópia da função no header
func = '''async function buscarCodigoMunicipioPorCep(cep: string): Promise<string | null> {
  try {
    const cepLimpo = cep.replace(/\\D/g, "");
    if (cepLimpo.length !== 8) return null;
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.ibge || null;
  } catch { return null; }
}
'''

new_content = 'import type { Express } from "express";\n' + func + rest
open('/root/randoli-solar/server/routes.ts', 'w').write(new_content)
print('Depois:', new_content.count('async function buscarCodigoMunicipioPorCep'))
PYEOF

python3 /tmp/fix_dup.py
npm run build 2>&1 | tail -10 && pm2 restart randoli
pm2 logs randoli --lines 0
sed -n '135,145p' /root/randoli-solar/server/nfse.ts
python3 -c "
content = open('/root/randoli-solar/server/nfse.ts').read()
old = '<tpRetISSQN>2</tpRetISSQN>\$</tribMun>'
new = '<tpRetISSQN>2</tpRetISSQN>\${pAliqTag}</tribMun>'
new_content = content.replace(old, new, 1)
open('/root/randoli-solar/server/nfse.ts', 'w').write(new_content)
print('OK:', '\${pAliqTag}' in new_content)
"
cd /root/randoli-solar && npm run build 2>&1 | tail -5 && pm2 restart randoli
sed -n '135,145p' /root/randoli-solar/server/nfse.ts
cd
clear
pm2 logs randoli --lines 0
grep -n "cTribMun\|cTribMunTag" /root/randoli-solar/server/nfse.ts | head -10
grep -n "cTribMunTag" /root/randoli-solar/server/nfse.ts
PGPASSWORD='Icba281287@' psql -h localhost -U randoli -d randoli_solar -c "UPDATE site_settings SET value = '' WHERE key = 'nfse_ctrib_mun';"
pm2 restart randoli
clear
pm2 logs randoli --lines 0
python3 -c "
content = open('/root/randoli-solar/server/nfse.ts').read()
old = '  if (params.tomadorCodigoMunicipio && params.tomadorCep) {'
new = '  if (false && params.tomadorCodigoMunicipio && params.tomadorCep) { // temporariamente desabilitado'
content = content.replace(old, new, 1)
open('/root/randoli-solar/server/nfse.ts', 'w').write(content)
print('OK')
"
cd /root/randoli-solar && npm run build 2>&1 | tail -5 && pm2 restart randoli
pm2 logs randoli --lines 0
pm2 restart randoli
cd /root/randoli-solar && npm run build 2>&1 | tail -5 && pm2 restart randoli
python3 -c "
content = open('/root/randoli-solar/server/nfse.ts').read()
old = '<tribISSQN>1</tribISSQN><tpRetISSQN>2</tpRetISSQN>'
new = '<tribISSQN>\${isForaMunicipio ? \"2\" : \"1\"}</tribISSQN><tpRetISSQN>2</tpRetISSQN>'
content = content.replace(old, new, 1)
open('/root/randoli-solar/server/nfse.ts', 'w').write(content)
print('OK')
"
python3 -c "
content = open('/root/randoli-solar/server/nfse.ts').read()
old = '<tribISSQN>1</tribISSQN><tpRetISSQN>2</tpRetISSQN>'
new = '<tribISSQN>2</tribISSQN><tpRetISSQN>2</tpRetISSQN>'
content = content.replace(old, new, 1)
open('/root/randoli-solar/server/nfse.ts', 'w').write(content)
print('OK')
"
cd /root/randoli-solar && npm run build 2>&1 | tail -5 && pm2 restart randoli
python3 -c "
content = open('/root/randoli-solar/server/nfse.ts').read()
old = '<tribISSQN>\${isForaMunicipio ? \"2\" : \"1\"}</tribISSQN><tpRetISSQN>2</tpRetISSQN>'
new = '<tribISSQN>2</tribISSQN><tpRetISSQN>2</tpRetISSQN>'
content = content.replace(old, new, 1)
open('/root/randoli-solar/server/nfse.ts', 'w').write(content)
print('OK:', '<tribISSQN>2</tribISSQN>' in content)
"
cd /root/randoli-solar && npm run build 2>&1 | tail -5 && pm2 restart randoli
grep -n "if (false" /root/randoli-solar/server/nfse.ts
python3 -c "
content = open('/root/randoli-solar/server/nfse.ts').read()
content = content.replace('<tribISSQN>2</tribISSQN>', '<tribISSQN>1</tribISSQN>', 1)
open('/root/randoli-solar/server/nfse.ts', 'w').write(content)
print('OK')
"
cd /root/randoli-solar && npm run build 2>&1 | tail -5 && pm2 restart randoli
grep -rn "Foto do Local\|Procuração\|upload.*document\|document.*upload" /root/randoli-solar/client/src --include="*.tsx" | head -10
grep -rn "scroll\|scrollTo\|scrollIntoView" /root/randoli-solar/client/src --include="*.tsx" | grep -i "document\|upload\|modal" | head -10
grep -n "if (false" /root/randoli-solar/server/nfse.ts
python3 -c "
content = open('/root/randoli-solar/server/nfse.ts').read()
content = content.replace('if (false && params.tomadorCodigoMunicipio && params.tomadorCep)', 'if (params.tomadorCodigoMunicipio && params.tomadorCep)')
open('/root/randoli-solar/server/nfse.ts', 'w').write(content)
print('OK')
"
cd /root/randoli-solar && npm run build 2>&1 | tail -5 && pm2 restart randoli
cat > /tmp/fix_retencao.py << 'PYEOF'
content = open('/root/randoli-solar/server/nfse.ts').read()

# Adicionar lógica de retenção baseada no município
old = '  const isSimplesNacional = opSimpNac === "2" || opSimpNac === "3";\n  const pAliqTag = isSimplesNacional ? "" : `<pAliq>${aliquotaIss}</pAliq>`;\n  const regApTribSN = cfg.regApTribSN || "1";'

new = '  const isSimplesNacional = opSimpNac === "2" || opSimpNac === "3";\n  const tomadorMunicipio = params.tomadorCodigoMunicipio || cLocEmi;\n  const isTomaLocalSinop = tomadorMunicipio === cLocEmi;\n  const tpRetISSQN = isTomaLocalSinop ? "1" : "2";\n  const pAliqTag = (isTomaLocalSinop && isSimplesNacional) ? `<pAliq>${aliquotaIss}</pAliq>` : "";\n  const regApTribSN = cfg.regApTribSN || "1";'

content = content.replace(old, new, 1)

# Atualizar tpRetISSQN no XML (era hardcoded como 2)
content = content.replace('<tpRetISSQN>2</tpRetISSQN>', '<tpRetISSQN>${tpRetISSQN}</tpRetISSQN>', 1)

open('/root/randoli-solar/server/nfse.ts', 'w').write(content)
print('OK:', 'isTomaLocalSinop' in content)
PYEOF

python3 /tmp/fix_retencao.py
cd /root/randoli-solar && npm run build 2>&1 | tail -5 && pm2 restart randoli
}
function TimelineItem({ entry, isLast }: { entry: Timeline; isLast: boolean }) {
root@srv1235745:~# sed -n '297,395p' /root/randoli-solar/client/src/pages/portal/projeto.tsx
function DocumentUploadCard({ projectId }: { projectId: string }) {
}
function TimelineItem({ entry, isLast }: { entry: Timeline; isLast: boolean }) {
sed -n '297,395p' /root/randoli-solar/client/src/pages/portal/projeto.tsx
grep -n "DocumentUploadCard\|fileInputRef\|position" /root/randoli-solar/client/src/pages/portal/projeto.tsx | head -20
cd /caminho/que-apareceu-no-pm2
git pull origin main
npm install
pm2 restart randoli
cd /caminho/do/app
git init
git remote add origin https://github.com/icarorandoli/randoli-solar-v3.git
git fetch origin main
git reset --hard origin/main
npm install
pm2 restart randoli
cd ~/randoli-solar
git pull origin main
pm2 restart randoli
cd ~/randoli-solar
git pull origin main
npm run db:push
git pull origin main
npm install
npm run db:push
pm2 restart randoli  # ou o comando que usa para reiniciar
cd randoli-solar/
git pull origin main
pm2 restart randoli
cd ~/randoli-solar
git stash
git pull origin main
pm2 restart randoli
cd ~/randoli-solar
git pull origin main
pm2 restart randoli
cd ~/randoli-solar
git pull origin main
pm2 restart randoli
grep -rn "Foto do Local\|Procuração Assinada\|docType\|document.*modal\|modal.*document" /root/randoli-solar/client/src --include="*.tsx" | grep -v "node_modules" | head -10
sed -n '200,250p' /root/randoli-solar/client/src/pages/cliente/projeto.tsx
grep -rn "scrollTop\|scroll-top\|href.*#\|window.scroll" /root/randoli-solar/client/src/pages/portal/projeto.tsx 2>/dev/null | head -10
find /root/randoli-solar/client/src -name "projeto.tsx" | grep portal
grep -n "upload\|Upload\|documento\|Documento\|modal\|Modal\|dialog\|Dialog" /root/randoli-solar/client/src/pages/portal/projeto.tsx | head -20
sed -n '297,395p' /root/randoli-solar/client/src/pages/portal/projeto.tsx
grep -n "DocumentUploadCard\|fileInputRef\|position" /root/randoli-solar/client/src/pages/portal/projeto.tsx | head -20
cd /root/randoli-solar && npm run build 2>&1 | tail -5 && pm2 restart randoli
npm run build
pm2 logs randoli --lines 0
grep -n "isSimplesNacional\|pAliqTag\|regApTribSN" /root/randoli-solar/server/nfse.ts | head -10
sed -n '130,145p' /root/randoli-solar/server/nfse.ts
cat > /tmp/fix_nfse.py << 'PYEOF'
content = open('/root/randoli-solar/server/nfse.ts').read()

# Corrigir pAliq - adicionar lógica isSimplesNacional
old = '  const aliquotaIss = cfg.aliquotaIss || "2.00";\n  const dpsXml'
new = '  const aliquotaIss = cfg.aliquotaIss || "2.00";\n  const opSimpNac = cfg.opSimpNac || "1";\n  const isSimplesNacional = opSimpNac === "2" || opSimpNac === "3";\n  const pAliqTag = isSimplesNacional ? "" : `<pAliq>${aliquotaIss}</pAliq>`;\n  const regApTribSN = cfg.regApTribSN || "1";\n  const dpsXml'
content = content.replace(old, new, 1)

# Corrigir regTrib - adicionar regApTribSN
old = '<regTrib><opSimpNac>${cfg.opSimpNac}</opSimpNac><regEspTrib>${cfg.regEspTrib}</regEspTrib></regTrib>'
new = '<regTrib><opSimpNac>${opSimpNac}</opSimpNac><regApTribSN>${regApTribSN}</regApTribSN><regEspTrib>${cfg.regEspTrib}</regEspTrib></regTrib>'
content = content.replace(old, new, 1)

# Corrigir pAliq no tribMun
old = '<tpRetISSQN>2</tpRetISSQN><pAliq>${aliquotaIss}</pAliq></tribMun>'
new = '<tpRetISSQN>2</tpRetISSQN>${pAliqTag}</tribMun>'
content = content.replace(old, new, 1)

open('/root/randoli-solar/server/nfse.ts', 'w').write(content)
print('isSimplesNacional OK:', 'isSimplesNacional' in content)
print('regApTribSN OK:', 'regApTribSN>${regApTribSN}' in content)
print('pAliqTag OK:', 'pAliqTag}' in content)
PYEOF

python3 /tmp/fix_nfse.py
cd /root/randoli-solar && npm run build 2>&1 | tail -5 && pm2 restart randoli
grep -o ".\{20\}pAliq.\{20\}" /root/randoli-solar/dist/index.cjs
sed -n '130,136p' /root/randoli-solar/server/nfse.ts
pm2 delete randoli && pm2 start /root/randoli-solar/dist/index.cjs --name randoli && pm2 save
pm2 logs randoli --lines 50 | grep -A 5 "GerarNfseEnvio XML"
