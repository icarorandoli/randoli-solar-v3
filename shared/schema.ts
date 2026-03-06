import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── USERS ───────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["admin", "integrador", "engenharia", "financeiro"]);
export const clientTypeEnum = pgEnum("client_type", ["PF", "PJ"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("integrador"),
  name: text("name").notNull().default(""),
  email: text("email"),
  phone: text("phone"),
  cpfCnpj: text("cpf_cnpj"),
  clientType: clientTypeEnum("client_type").notNull().default("PF"),
  company: text("company"),
  address: text("address"),
  rua: text("rua"),
  numero: text("numero"),
  bairro: text("bairro"),
  cep: text("cep"),
  cidade: text("cidade"),
  estado: text("estado"),
  googleId: text("google_id"),
  needsProfileCompletion: boolean("needs_profile_completion").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── CLIENTS (integradores ficam aqui também como referência de projeto)
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  cpfCnpj: text("cpf_cnpj"),
  type: clientTypeEnum("type").notNull().default("PF"),
  address: text("address"),
  company: text("company"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// ─── PROJECTS ────────────────────────────────────────────────────────
export const projectStatusEnum = pgEnum("project_status", [
  "orcamento",
  "aprovado_pagamento_pendente",
  "projeto_tecnico",
  "aguardando_art",
  "protocolado",
  "parecer_acesso",
  "instalacao",
  "vistoria",
  "projeto_aprovado",
  "homologado",
  "finalizado",
  "cancelado",
]);

export const tipoConexaoEnum = pgEnum("tipo_conexao", [
  "monofasico",
  "bifasico",
  "trifasico",
]);

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  ticketNumber: varchar("ticket_number"),
  title: text("title").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("orcamento"),
  archived: boolean("archived").notNull().default(false),

  // Localização
  endereco: text("endereco"),
  localizacao: text("localizacao"),
  rua: text("rua"),
  numero: text("numero"),
  bairro: text("bairro"),
  cep: text("cep"),
  cidade: text("cidade"),
  estado: text("estado"),

  // Dados da concessionária
  concessionaria: text("concessionaria"),
  numeroProtocolo: text("numero_protocolo"),
  numeroInstalacao: text("numero_instalacao"),
  tipoConexao: tipoConexaoEnum("tipo_conexao"),
  amperagemDisjuntor: text("amperagem_disjuntor"),

  // Dados do cliente da instalação
  nomeCliente: text("nome_cliente"),
  cpfCnpjCliente: text("cpf_cnpj_cliente"),
  telefoneCliente: text("telefone_cliente"),

  // Equipamentos — Inversor
  marcaInversor: text("marca_inversor"),
  modeloInversor: text("modelo_inversor"),
  potenciaInversor: text("potencia_inversor"),
  quantidadeInversor: text("quantidade_inversor"),

  // Equipamentos — Painel Solar
  marcaPainel: text("marca_painel"),
  modeloPainel: text("modelo_painel"),
  potenciaPainel: text("potencia_painel"),
  quantidadePaineis: text("quantidade_paineis"),

  // Totais e financeiro
  potencia: text("potencia"),
  valor: text("valor"),

  // Pagamento (Mercado Pago)
  paymentLink: text("payment_link"),
  paymentId: text("payment_id"),
  paymentStatus: text("payment_status"),

  // PIX
  pixQrCode: text("pix_qr_code"),
  pixQrCodeBase64: text("pix_qr_code_base64"),
  pixPaymentId: text("pix_payment_id"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, ticketNumber: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// ─── DOCUMENTS ────────────────────────────────────────────────────────
export const documentTypeEnum = pgEnum("document_type", [
  "rg_cnh",
  "cpf_cnpj_doc",
  "conta_energia",
  "procuracao",
  "foto_local",
  "diagrama_unifilar",
  "memorial_descritivo",
  "art",
  "contrato",
  "projeto_aprovado",
  "parecer_concessionaria",
  "comprovante_pagamento",
  "outro",
]);

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  docType: documentTypeEnum("doc_type").notNull().default("outro"),
  uploadedByRole: text("uploaded_by_role").notNull().default("integrador"),
  uploadedById: varchar("uploaded_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// ─── TIMELINE ─────────────────────────────────────────────────────────
export const timeline = pgTable("timeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  event: text("event").notNull(),
  details: text("details"),
  createdByRole: text("created_by_role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTimelineSchema = createInsertSchema(timeline).omit({ id: true, createdAt: true });
export type InsertTimeline = z.infer<typeof insertTimelineSchema>;
export type Timeline = typeof timeline.$inferSelect;

// ─── PARTNERS ─────────────────────────────────────────────────────────
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  website: text("website"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({ id: true, createdAt: true });
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

// ─── SITE SETTINGS ────────────────────────────────────────────────────
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings);
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;

// ─── PRICING RANGES ────────────────────────────────────────────────────
export const pricingRanges = pgTable("pricing_ranges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: text("label").notNull(),
  minKwp: numeric("min_kwp").notNull(),
  maxKwp: numeric("max_kwp").notNull(),
  price: numeric("price").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPricingRangeSchema = createInsertSchema(pricingRanges).omit({ id: true, createdAt: true });
export type InsertPricingRange = z.infer<typeof insertPricingRangeSchema>;
export type PricingRange = typeof pricingRanges.$inferSelect;

// ─── CLIENT PRICING (Preço Promocional) ───────────────────────────────
export const clientPricing = pgTable("client_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  rangeId: varchar("range_id").references(() => pricingRanges.id),
  price: numeric("price").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientPricingSchema = createInsertSchema(clientPricing).omit({ id: true, createdAt: true });
export type InsertClientPricing = z.infer<typeof insertClientPricingSchema>;
export type ClientPricing = typeof clientPricing.$inferSelect;

// ─── PASSWORD RESET TOKENS ─────────────────────────────────────────────
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── RELATIONS ────────────────────────────────────────────────────────
export const projectRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  documents: many(documents),
  timeline: many(timeline),
}));

export const clientRelations = relations(clients, ({ many, one }) => ({
  projects: many(projects),
  user: one(users, { fields: [clients.userId], references: [users.id] }),
}));

export const documentRelations = relations(documents, ({ one }) => ({
  project: one(projects, { fields: [documents.projectId], references: [projects.id] }),
}));

export const timelineRelations = relations(timeline, ({ one }) => ({
  project: one(projects, { fields: [timeline.projectId], references: [projects.id] }),
}));
