# Randoli Engenharia Solar — Portal SaaS

Sistema SaaS para gerenciamento de projetos de homologação fotovoltaica. Inclui painel administrativo completo (Randoli) e portal do integrador solar (cliente).

## Credenciais de Teste

| Usuário | Senha | Papel |
|---------|-------|-------|
| admin | admin123 | Admin (Randoli) |
| joao.integrador | senha123 | Integrador (PF) |
| solartech | senha123 | Integrador (PJ) |

## Arquitetura

### Stack
- **Backend**: Express.js (TypeScript), Drizzle ORM + PostgreSQL, express-session
- **Frontend**: React + Vite, TanStack Query, shadcn/ui, wouter (routing)
- **Armazenamento de Arquivos**: Replit Object Storage (logos, documentos)
- **Auth**: Sessão com cookie + scrypt para hashing de senha + Google OAuth (passport-google-oauth20, Passport.js)
- **Pagamentos**: Mercado Pago (checkout preferences + webhook)

### Banco de Dados (schema.ts)
- `users` — roles: `admin`, `engenharia`, `financeiro`, `integrador`; campos de endereço separados (rua/numero/bairro/cep/cidade/estado)
- `clients` — registros de clientes/integradores; campos de endereço estruturado (rua/numero/bairro/cep/cidade/estado); CNPJ lookup via BrasilAPI
- `projects` — projetos fotovoltaicos com status de homologação (12 status), campos paymentLink/paymentId/paymentStatus, archived, valor
- `documents` — arquivos enviados por projeto
- `timeline` — log de eventos por projeto
- `chat_messages` — mensagens de chat por projeto (admin ↔ integrador); campos readByAdmin, readByIntegrador
- `partners` — parceiros para carousel do site
- `site_settings` — configurações: logo, nome, SMTP, Mercado Pago (mp_access_token, mp_webhook_secret, mp_enabled)
- `statusConfigs` — configuração dinâmica dos 12 status: label, color (key para preset), showInKanban, sortOrder
- `pricing_ranges` — faixas de potência com preços (seed: 5 faixas padrão 1-10, 10-15, 15-25, 25-50, 50-75 kWp)
- `client_pricing` — preços promocionais individuais por cliente
- `password_reset_tokens` — tokens de redefinição de senha

### Fluxo de Status dos Projetos
`orcamento` → `aprovado_pagamento_pendente` → `projeto_tecnico` → `aguardando_art` → `protocolado` → `parecer_acesso` → `instalacao` → `vistoria` → `projeto_aprovado` → `homologado` → `finalizado` / `cancelado`

### Fluxo de Pagamento (Mercado Pago)
1. Admin muda status do projeto para `aprovado_pagamento_pendente`
2. Sistema cria preferência de pagamento via API do Mercado Pago
3. Link de pagamento é salvo no projeto e enviado por e-mail ao integrador
4. Integrador vê botão "Pagar com Mercado Pago" no portal
5. Após pagamento aprovado, webhook do MP notifica o sistema
6. Sistema verifica assinatura do webhook, valida pagamento, e avança status para `projeto_tecnico`
7. Integrador recebe notificação de que o projeto avançou

### Arquivamento de Projetos
- Projetos com status `finalizado` são automaticamente arquivados (`archived: true`)
- Admin pode restaurar projetos arquivados via botão "Restaurar"
- Aba "Arquivados" na página de projetos exibe projetos finalizados

## Rotas

### Backend API
- `POST /api/auth/login` / `logout` / `register`
- `GET /api/auth/me` / `PATCH /api/auth/me`
- `PATCH /api/auth/complete-profile` — completa perfil após login Google (limpa needsProfileCompletion)
- `GET /auth/google` — inicia fluxo OAuth Google (redirect para accounts.google.com)
- `GET /auth/google/callback` — callback OAuth Google (cria/vincula usuário, redireciona)
- `GET/POST/PATCH/DELETE /api/clients`
- `GET/POST/PATCH/DELETE /api/projects` (query `?archived=true` para arquivados)
- `GET/POST/DELETE /api/projects/:id/documents`
- `GET/POST /api/projects/:id/timeline`
- `GET/POST/PATCH/DELETE /api/partners`
- `GET/POST /api/settings`
- `POST /api/mercadopago/webhook` — recebe notificações do Mercado Pago (sem auth, validação por assinatura)
- `POST /api/email/test`
- `GET /api/stats`
- `GET /api/stats/financial` — totais financeiros (admin + financeiro)
- `GET/POST/PATCH/DELETE /api/pricing-ranges` — faixas de preço por kWp
- `GET /api/pricing-ranges/calculate?kwp=X` — calcula preço para determinado kWp
- `GET/POST/DELETE /api/client-pricing` — preços promocionais por cliente
- `GET/POST /api/projects/:id/chat` — mensagens de chat por projeto
- `GET /api/chat/unread` — contagem de mensagens não lidas para o usuário logado
- `GET /api/status-configs` — lista configurações dos 12 status (faz seed automático se vazio)
- `PATCH /api/status-configs/:key` — atualiza configuração de um status (somente admin)
- `GET /api/notifications` — lista notificações (admin/engenharia/financeiro)
- `GET /api/notifications/count` — contagem de notificações não lidas
- `PATCH /api/notifications/:id/read` — marca uma notificação como lida
- `PATCH /api/notifications/read-all` — marca todas como lidas
- `GET /api/search?q=` — busca global em projetos e clientes (admin)
- `GET /api/audit-logs` — histórico de auditoria (admin apenas)
- `GET /api/analytics` — métricas mensais: projetos/mês, receita/mês, projetos por status
- WebSocket em `/ws` — autenticação por mensagem `{type:"auth",userId,role}`, eventos: `chat_message`, `project_updated`, `status_changed`, `document_added`, `timeline_added`

### Frontend
- `/login` — Página de login
- `/cadastro` — Registro de novo integrador
- `/planos` — Tabela de preços pública (sem autenticação)
- `/` — Dashboard admin (KPIs + gráficos + fluxo + stats financeiras para admin/financeiro)
- `/projetos` — Gerenciamento de projetos (admin) com abas Ativos/Arquivados
- `/kanban` — Kanban de projetos com drag-and-drop por etapa (admin); colunas dinâmicas via status configs
- `/status-config` — Configuração de status: nome, cor (13 presets), visibilidade no Kanban, ordem (somente admin)
- `/analytics` — Analytics: gráficos de projetos/mês, receita/mês, cards por status (admin/financeiro/engenharia)
- `/audit-log` — Log de auditoria: histórico de ações (project.create, status_change, document.upload, payment.approved) com filtro e detalhes (admin)
- `/clientes` — Gerenciamento de clientes (admin)
- `/precos` — Gestão de tabela de preços e preços promocionais (admin)
- `/parceiros` — Carousel de parceiros (admin)
- `/usuarios` — Gestão de usuários com suporte aos roles: admin, engenharia, financeiro, integrador
- `/configuracoes` — Configurações do sistema: identidade, e-mail SMTP, Mercado Pago
- `/portal` — Home do integrador (lista de projetos próprios)
- `/portal/novo-projeto` — Formulário para solicitar novo projeto (com auto-preenchimento do valor baseado no kWp)
- `/portal/projetos/:id` — Detalhe do projeto: timeline + upload de documentos + pagamento
- `/portal/conta` — Perfil do integrador + alterar senha
- `/completar-perfil` — Página para completar dados após primeiro login com Google (CEP auto-fill, CNPJ auto-fill)

## Estrutura de Arquivos Importantes

```
client/src/
  App.tsx                    — Roteamento com auth guard (suporte roles engenharia/financeiro)
  contexts/AuthContext.tsx   — Contexto de autenticação
  components/
    admin-sidebar.tsx        — Sidebar do painel admin (inclui Kanban, Preços, badge chat não lido)
    portal-sidebar.tsx       — Sidebar do portal integrador (badge chat não lido)
    ObjectUploader.tsx       — Upload de arquivos para Object Storage
    password-strength.tsx    — Indicador visual de força de senha (barra colorida)
    chat-panel.tsx           — Chat interno por projeto (admin ↔ integrador) com auto-scroll
  hooks/
    use-upload.ts            — Hook para presigned URL upload
    use-websocket.ts         — Hook WebSocket global (auth, reconexão, broadcast para queries)
  pages/
    login.tsx / register.tsx / forgot-password.tsx / reset-password.tsx
    dashboard.tsx / projects.tsx / clients.tsx / partners.tsx / settings.tsx
    kanban.tsx               — Kanban board com drag-and-drop (@hello-pangea/dnd)
    precos.tsx               — Gestão de faixas de preço e preços promocionais
    planos.tsx               — Página pública de tabela de preços
    users.tsx                — Gestão de usuários (todos os roles)
    portal/
      home.tsx / projeto.tsx / novo-projeto.tsx / conta.tsx

server/
  index.ts       — Entry point, seed
  routes.ts      — Todas as rotas API + setup de sessão + rotas de chat
  auth.ts        — hashPassword, comparePasswords, requireAuth
  storage.ts     — DatabaseStorage (interface + implementação Drizzle, incluindo chat_messages)
  websocket.ts   — WebSocket server (auth, mapa de conexões, broadcast por userId/admin)
  mercadopago.ts — Integração Mercado Pago (criar preferência, verificar pagamento, validar webhook)
  email.ts       — Envio de e-mails SMTP (notificações de status + link de pagamento)
  seed.ts        — Dados de exemplo (inclui seed de pricing_ranges)
  db.ts          — Conexão PostgreSQL

shared/
  schema.ts   — Schema Drizzle + tipos Zod (todos os modelos)
```

## Configurações

- Porta: 5000 (configurada pelo ambiente)
- Session secret: variável `SESSION_SECRET`
- Banco de dados: `DATABASE_URL` (PostgreSQL via Replit)
- Object Storage: `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`
- Mercado Pago: `MP_ACCESS_TOKEN` (env var ou site_settings)
- GitHub: repo `icarorandoli/randoli-solar`, VPS: `cd /root/randoli-solar && bash update.sh`
