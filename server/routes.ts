import type { Express } from "express";
import { createServer, type Server } from "http";
import { broadcastToProjectParticipants, broadcastToAdmins, broadcastToUser } from "./websocket";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { pool } from "./db";
import { storage } from "./storage";
import { hashPassword, comparePasswords, requireAuth, getCurrentUser, mobileTokens, generateMobileToken } from "./auth";
import {
  insertClientSchema, insertProjectSchema, insertPartnerSchema,
  insertDocumentSchema, insertTimelineSchema,
} from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { sendStatusEmail, sendTestEmail, sendPasswordResetEmail, sendDocumentEmail, sendTimelineEmail, type EmailConfig } from "./email";
import { createPaymentPreference, createPixPayment, getPaymentInfo, getMerchantOrder, verifyWebhookSignature } from "./mercadopago";
import { createPagSeguroPixCharge, getPagSeguroOrderInfo, verifyPagSeguroWebhookSignature, extractPagSeguroPaymentStatus } from "./pagseguro";
import { testWhatsAppConnection, type WhatsAppConfig, sendWhatsAppNewProjectNotification, sendWhatsAppAdminCreatedProjectNotification, sendWhatsAppStatusNotification, sendWhatsAppTimelineNotification, sendWhatsAppDocumentNotification, sendWhatsAppPaymentNotification } from "./whatsapp";
import { emitirNfse, getNfseConfig } from "./nfse";
import { registerUploadRoutes } from "./upload";
import { calculateSystemSize, phaseFromConsumption } from "./ai/solar-calculator";
import { dimensionSystem } from "./ai/solar-dimensioning";
import { analyzeEnergyBill } from "./ai/energy-analysis";
import { simulateProduction } from "./ai/production-simulation";
import { generateMemorial } from "./ai/memorial-generator";
import { generateUnifilarSvg } from "./ai/unifilar-generator";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";
import multer from "multer";
import unzipper from "unzipper";

// Memory-storage multer for certificate uploads (max 5MB)
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;

function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_LOGIN_ATTEMPTS) {
      return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
    }
    entry.count++;
    return { allowed: true };
  }
  loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  return { allowed: true };
}

function resetLoginRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

setInterval(() => {
  const now = Date.now();
  const keys = Array.from(loginAttempts.keys());
  for (const key of keys) {
    const val = loginAttempts.get(key);
    if (val && now >= val.resetAt) loginAttempts.delete(key);
  }
}, 60_000);

async function extractZipEntries(buf: Buffer): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const directory = await unzipper.Open.buffer(buf);
  for (const file of directory.files) {
    if (file.type === "Directory") continue;
    try {
      const content = await file.buffer();
      files[file.path] = content.toString("utf8");
    } catch { /* skip unreadable */ }
  }
  return files;
}

const PgSession = connectPgSimple(session);

async function getSettingsMap(): Promise<Record<string, string>> {
  const settings = await storage.getSiteSettings();
  const map: Record<string, string> = {};
  for (const s of settings) { if (s.value) map[s.key] = s.value; }
  return map;
}

async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const map = await getSettingsMap();
  return {
    enabled: map["whatsapp_enabled"] === "true",
    apiUrl: map["whatsapp_api_url"] || "",
    apiKey: map["whatsapp_api_key"] || "",
    instanceName: map["whatsapp_instance_name"] || "",
  };
}

async function getWhatsAppAdminPhone(): Promise<string> {
  const map = await getSettingsMap();
  return map["whatsapp_admin_phone"] || "";
}

async function getEmailConfig(): Promise<EmailConfig> {
  const map = await getSettingsMap();
  return {
    smtpUser: map["email_smtp_user"] || undefined,
    smtpPass: map["email_smtp_pass"] || undefined,
    smtpFrom: map["email_smtp_from"] || undefined,
    smtpHost: map["email_smtp_host"] || undefined,
    smtpPort: map["email_smtp_port"] ? parseInt(map["email_smtp_port"]) : undefined,
    portalUrl: map["email_portal_url"] || undefined,
  };
}

function getMpAccessToken(settingsMap?: Record<string, string>): string | null {
  if (settingsMap?.["mp_enabled"] === "false") return null;
  return settingsMap?.["mp_access_token"] || process.env.MP_ACCESS_TOKEN || null;
}


export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ── Session setup ──────────────────────────────────────────────────
  app.use(session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "randoli-solar-secret-2026",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
  }));

  // ── Passport ───────────────────────────────────────────────────────
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try { done(null, await storage.getUser(id) ?? false); }
    catch (e) { done(e); }
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const callbackURL = process.env.NODE_ENV === "production"
      ? "https://projetos.randolisolar.com.br/auth/google/callback"
      : `http://localhost:${process.env.PORT || 5000}/auth/google/callback`;

    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL,
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        let user = await storage.getUserByGoogleId(profile.id);
        if (!user) {
          const email = profile.emails?.[0]?.value;
          if (email) user = await storage.getUserByEmail(email);
          if (user) {
            await storage.updateUser(user.id, { googleId: profile.id });
          } else {
            const base = (profile.displayName || email || "google").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
            let username = base;
            let i = 1;
            while (await storage.getUserByUsername(username)) username = `${base}${i++}`;
            user = await storage.createUser({
              username,
              password: randomBytes(32).toString("hex"),
              name: profile.displayName || email || "Novo Usuário",
              email: email || null,
              googleId: profile.id,
              role: "integrador",
              clientType: "PF",
              needsProfileCompletion: true,
            });
          }
        }
        return done(null, user);
      } catch (e) { return done(e as Error); }
    }));

    app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    app.get("/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login?error=google" }),
      async (req, res) => {
        const user = req.user as any;
        if (user) {
          req.session.userId = user.id;
          await new Promise<void>((resolve, reject) => req.session.save(e => e ? reject(e) : resolve()));
        }
        if (user?.needsProfileCompletion) {
          res.redirect("/completar-perfil");
        } else {
          const isAdmin = ["admin", "engenharia", "financeiro"].includes(user?.role);
          res.redirect(isAdmin ? "/" : "/portal");
        }
      }
    );
  }

  // ── Object storage ─────────────────────────────────────────────────
  registerObjectStorageRoutes(app);

  // ── Local file uploads ─────────────────────────────────────────────
  registerUploadRoutes(app);
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use("/uploads", (await import("express")).default.static(uploadsDir));

  // ── AUTH ───────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name, email, phone, cpfCnpj, clientType, company, address, rua, numero, bairro, cep, cidade, estado, role: reqRole } = req.body;
      if (!username || !password || !name || !email) {
        return res.status(400).json({ error: "Campos obrigatórios: username, password, name, email" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(400).json({ error: "Usuário já existe" });

      // Only admins can create users with non-integrador roles
      const callerUser = await getCurrentUser(req);
      const allowedRole = callerUser?.role === "admin" && reqRole ? reqRole : "integrador";

      const hashed = await hashPassword(password);
      const composedAddress = rua ? [rua, numero].filter(Boolean).join(", ") + (bairro ? ` - ${bairro}` : "") + (cidade || estado ? ` · ${[cidade, estado].filter(Boolean).join("/")}` : "") : address;
      const user = await storage.createUser({
        username,
        password: hashed,
        role: allowedRole,
        name,
        email,
        phone,
        cpfCnpj,
        clientType: clientType || "PF",
        company,
        address: composedAddress,
        rua,
        numero,
        bairro,
        cep,
        cidade,
        estado,
      });

      await storage.createClient({
        name,
        email,
        phone,
        cpfCnpj,
        type: clientType || "PF",
        company,
        address: composedAddress,
        userId: user.id,
      });

      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err: any) {
      console.error("Register error:", err);
      res.status(500).json({ error: "Erro ao criar conta" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const rateCheck = checkLoginRateLimit(ip);
      if (!rateCheck.allowed) {
        return res.status(429).json({ error: `Muitas tentativas de login. Tente novamente em ${rateCheck.retryAfterSec} segundos.` });
      }

      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: "Usuário e senha obrigatórios" });

      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

      const valid = await comparePasswords(password, user.password);
      if (!valid) return res.status(401).json({ error: "Credenciais inválidas" });

      resetLoginRateLimit(ip);
      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => req.session.save(e => e ? reject(e) : resolve()));
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get("/api/auth/me", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Não autenticado" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });


  app.patch("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: "Não autenticado" });
      const { name, email, phone, address, company, currentPassword, newPassword,
              rua, numero, bairro, cep, cidade, estado, cpfCnpj } = req.body;

      let updateData: any = { name, email, phone, address, company,
                              rua, numero, bairro, cep, cidade, estado, cpfCnpj };

      if (newPassword) {
        if (!currentPassword) return res.status(400).json({ error: "Senha atual obrigatória" });
        const valid = await comparePasswords(currentPassword, user.password);
        if (!valid) return res.status(400).json({ error: "Senha atual incorreta" });
        updateData.password = await hashPassword(newPassword);
      }

      const updated = await storage.updateUser(user.id, updateData);
      if (!updated) return res.status(404).json({ error: "Usuário não encontrado" });

      // Update linked client record too
      const client = await storage.getClientByUserId(user.id);
      if (client) {
        await storage.updateClient(client.id, {
          name: name || client.name,
          email: email || client.email,
          phone, address, company,
          rua, numero, bairro, cep, cidade, estado, cpfCnpj,
        });
      }

      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── COMPLETE GOOGLE PROFILE ──────────────────────────────────────────
  app.post("/api/auth/complete-profile", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: "Não autenticado" });
      const { name, phone, cpfCnpj, clientType, company, rua, numero, bairro, cep, cidade, estado } = req.body;
      if (!name || !phone || !cpfCnpj) return res.status(400).json({ error: "Nome, telefone e CPF/CNPJ são obrigatórios" });
      const updated = await storage.updateUser(user.id, {
        name, phone, cpfCnpj, clientType, company, rua, numero, bairro, cep, cidade, estado,
        needsProfileCompletion: false,
      });
      if (!updated) return res.status(404).json({ error: "Usuário não encontrado" });
      if (!await storage.getClientByUserId(user.id)) {
        await storage.createClient({
          name, email: user.email || `${user.username}@google.user`,
          phone, cpfCnpj, type: clientType || "PF",
          company: company || null, address: `${rua}, ${numero} - ${cidade}/${estado}`,
          userId: user.id,
        });
      }
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── MOBILE APP AUTH ───────────────────────────────────────────────────
  app.post("/api/mobile/login", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const rateCheck = checkLoginRateLimit(ip);
      if (!rateCheck.allowed) {
        return res.status(429).json({ error: `Muitas tentativas de login. Tente novamente em ${rateCheck.retryAfterSec} segundos.` });
      }
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: "Usuário e senha obrigatórios" });
      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(401).json({ error: "Credenciais inválidas" });
      const valid = await comparePasswords(password, user.password);
      if (!valid) return res.status(401).json({ error: "Credenciais inválidas" });
      resetLoginRateLimit(ip);
      const token = generateMobileToken();
      mobileTokens.set(token, user.id);
      const { password: _, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  app.post("/api/mobile/logout", (req, res) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      mobileTokens.delete(auth.slice(7));
    }
    res.json({ ok: true });
  });

  // ── FORGOT / RESET PASSWORD ──────────────────────────────────────────
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "E-mail obrigatório" });

      const allUsers = await storage.getUsers();
      const user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (!user) {
        return res.json({ ok: true });
      }

      const crypto = await import("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      const { db } = await import("./db");
      const { passwordResetTokens } = await import("@shared/schema");
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      const settingsMap = await getSettingsMap();
      const portalUrl = settingsMap["email_portal_url"] || "https://projetos.randolisolar.com.br";
      const resetLink = `${portalUrl}/redefinir-senha?token=${token}`;

      const emailConfig = await getEmailConfig();
      await sendPasswordResetEmail({
        to: user.email!,
        userName: user.name || user.username,
        resetLink,
        config: emailConfig,
      });

      res.json({ ok: true });
    } catch (err: any) {
      console.error("[auth] Erro ao processar forgot-password:", err);
      res.status(500).json({ error: "Erro ao enviar e-mail de recuperação. Verifique se o SMTP está configurado." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) return res.status(400).json({ error: "Token e nova senha obrigatórios" });
      if (password.length < 6) return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres" });

      const { db } = await import("./db");
      const { passwordResetTokens } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      const [resetToken] = await db.select().from(passwordResetTokens)
        .where(and(eq(passwordResetTokens.token, token), eq(passwordResetTokens.used, false)));

      if (!resetToken) {
        return res.status(400).json({ error: "Link inválido ou já utilizado" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "Link expirado. Solicite uma nova recuperação." });
      }

      const hashed = await hashPassword(password);
      await storage.updateUser(resetToken.userId, { password: hashed });

      await db.update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetToken.id));

      res.json({ ok: true });
    } catch (err: any) {
      console.error("[auth] Erro ao resetar senha:", err);
      res.status(500).json({ error: "Erro ao redefinir senha" });
    }
  });

  // ── ADMIN USER MANAGEMENT ──────────────────────────────────────────
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      const allUsers = await storage.getUsers();
      res.json(allUsers.map(({ password: _, ...u }) => u));
    } catch { res.status(500).json({ error: "Erro ao buscar usuários" }); }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!["admin", "engenharia", "financeiro"].includes(user?.role ?? "")) return res.status(403).json({ error: "Sem permissão" });
      const { name, email, phone, username, cpfCnpj, clientType, company, rua, numero, bairro, cep, cidade, estado, role } = req.body;
      const updateData: any = { name, email, phone, username, cpfCnpj, clientType, company, rua, numero, bairro, cep, cidade, estado };
      if (user?.role === "admin" && role) updateData.role = role;
      const updated = await storage.updateUser((req.params.id as string), updateData);
      if (!updated) return res.status(404).json({ error: "Usuário não encontrado" });
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/users/:id/reset-password", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
      const hashed = await hashPassword(newPassword);
      const updated = await storage.updateUser((req.params.id as string), { password: hashed });
      if (!updated) return res.status(404).json({ error: "Usuário não encontrado" });
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      if ((req.params.id as string) === user.id) return res.status(400).json({ error: "Não é possível excluir sua própria conta" });
      await storage.deleteUser((req.params.id as string));
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── CLIENTS ────────────────────────────────────────────────────────
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user || !["admin", "engenharia", "financeiro", "tecnico"].includes(user.role)) {
        return res.status(403).json({ error: "Sem permissão" });
      }
      res.json(await storage.getClients());
    } catch { res.status(500).json({ error: "Erro ao buscar clientes" }); }
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user || !["admin", "engenharia", "financeiro", "tecnico"].includes(user.role)) {
        return res.status(403).json({ error: "Sem permissão" });
      }
      const c = await storage.getClient((req.params.id as string));
      if (!c) return res.status(404).json({ error: "Não encontrado" });
      res.json(c);
    } catch { res.status(500).json({ error: "Erro ao buscar cliente" }); }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user || !["admin", "engenharia", "financeiro"].includes(user.role)) {
        return res.status(403).json({ error: "Sem permissão" });
      }
      const data = insertClientSchema.parse(req.body);
      res.status(201).json(await storage.createClient(data));
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.patch("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user || !["admin", "engenharia", "financeiro"].includes(user.role)) {
        return res.status(403).json({ error: "Sem permissão" });
      }
      const data = insertClientSchema.partial().parse(req.body);
      const c = await storage.updateClient((req.params.id as string), data);
      if (!c) return res.status(404).json({ error: "Não encontrado" });
      res.json(c);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      await storage.deleteClient((req.params.id as string));
      res.status(204).send();
    } catch { res.status(500).json({ error: "Erro ao deletar" }); }
  });

  app.post("/api/clients/:id/set-password", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      const { password } = req.body;
      if (!password || password.length < 6) return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
      const client = await storage.getClient(req.params.id as string);
      if (!client) return res.status(404).json({ error: "Cliente não encontrado" });
      const hashedPw = await hashPassword(password);
      if (client.userId) {
        await storage.updateUser(client.userId, { password: hashedPw });
        res.json({ message: "Senha atualizada com sucesso" });
      } else {
        const loginName = (client.email || client.cpfCnpj || client.name).toLowerCase().replace(/[^a-z0-9._@-]/g, "").slice(0, 50);
        const existingUser = await storage.getUserByUsername(loginName);
        if (existingUser) return res.status(400).json({ error: `Usuário '${loginName}' já existe. Use outro e-mail/CPF.` });
        const newUser = await storage.createUser({
          username: loginName,
          password: hashedPw,
          role: "cliente",
          name: client.name,
          email: client.email,
          phone: client.phone || undefined,
          cpfCnpj: client.cpfCnpj || undefined,
          clientType: client.type || "PF",
        });
        await storage.updateClient(client.id, { userId: newUser.id });
        res.json({ message: "Acesso criado com sucesso", username: loginName });
      }
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── PROJECTS ───────────────────────────────────────────────────────
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: "Não autenticado" });
      const archived = req.query.archived === "true";

      const isInternal = ["admin", "engenharia", "financeiro", "tecnico"].includes(user.role);
      if (isInternal) {
        res.json(archived ? await storage.getArchivedProjects() : await storage.getProjects());
      } else {
        const client = await storage.getClientByUserId(user.id);
        if (!client) return res.json([]);
        res.json(await storage.getProjectsByClient(client.id));
      }
    } catch { res.status(500).json({ error: "Erro ao buscar projetos" }); }
  });

  app.get("/api/archived-projects", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      res.json(await storage.getArchivedProjects());
    } catch { res.status(500).json({ error: "Erro ao buscar arquivados" }); }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const p = await storage.getProject((req.params.id as string));
      if (!p) return res.status(404).json({ error: "Não encontrado" });

      // Internal roles can see all projects; integrators only see their own
      const isInternal = ["admin", "engenharia", "financeiro", "tecnico"].includes(user?.role || "");
      if (!isInternal) {
        const client = await storage.getClientByUserId(user!.id);
        if (!client || p.clientId !== client.id) return res.status(403).json({ error: "Acesso negado" });
      }

      res.json(p);
    } catch { res.status(500).json({ error: "Erro ao buscar projeto" }); }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      let body = req.body;

      // If integrador, force their clientId
      if (user?.role !== "admin") {
        const client = await storage.getClientByUserId(user!.id);
        if (!client) return res.status(400).json({ error: "Cliente não encontrado para este usuário" });
        body = { ...body, clientId: client.id };
      }

      const data = insertProjectSchema.parse(body);
      const project = await storage.createProject(data);

      // Auto timeline entry
      await storage.addTimelineEntry({
        projectId: project.id,
        event: "Projeto solicitado",
        details: `Projeto "${project.title}" foi cadastrado e enviado para análise.`,
        createdByRole: user?.role || "integrador",
      });

      storage.createAuditLog({
        userId: user?.id,
        userName: user?.name || user?.username,
        userRole: user?.role,
        action: "project.create",
        entityType: "project",
        entityId: project.id,
        entityLabel: `${project.ticketNumber || ""} ${project.title}`.trim(),
        payload: JSON.stringify({ title: project.title, clientId: project.clientId }),
      }).catch(() => {});

      // WhatsApp: notify admin about new project (integrador created) OR notify client (admin created)
      (async () => {
        try {
          const waConfig = await getWhatsAppConfig();
          if (!waConfig.enabled) return;
          const client = project.clientId ? await storage.getClient(project.clientId) : null;

          if (user?.role === "admin") {
            // Admin created the project: notify the client/integrador
            const clientPhone = client?.phone;
            const clientName = client?.name || "Cliente";
            if (clientPhone) {
              await sendWhatsAppAdminCreatedProjectNotification({
                config: waConfig,
                phone: clientPhone,
                clientName,
                projectTitle: project.title,
                ticketNumber: project.ticketNumber || "",
              });
            }
          } else {
            // Integrador created the project: notify admin
            const adminPhone = await getWhatsAppAdminPhone();
            if (!adminPhone) return;
            const integradorName = client?.name || user?.name || "Integrador";
            await sendWhatsAppNewProjectNotification({
              config: waConfig,
              phone: adminPhone,
              adminName: "Admin",
              integradorName,
              projectTitle: project.title,
              ticketNumber: project.ticketNumber || "",
              potencia: project.potpicoKwp || undefined,
            });
          }
        } catch (err) { console.error("[whatsapp] Erro ao notificar novo projeto:", err); }
      })();

      res.status(201).json(project);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.patch("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const current = await storage.getProject((req.params.id as string));
      if (!current) return res.status(404).json({ error: "Não encontrado" });

      // Integrador can only edit their own projects (limited fields)
      const isInternal = user && ["admin", "engenharia", "financeiro", "tecnico"].includes(user.role);
      if (!isInternal) {
        const client = await storage.getClientByUserId(user!.id);
        if (!client || current.clientId !== client.id) return res.status(403).json({ error: "Sem permissão" });
        // Integradores cannot change status or financial fields
        delete req.body.status;
        delete req.body.valor;
        delete req.body.archived;
      }

      // engenharia and tecnico cannot modify financial fields
      if (user && ["engenharia", "tecnico"].includes(user.role)) {
        delete req.body.valor;
      }

      // Auto-archive when finalizado
      if (req.body.status === "finalizado") {
        req.body.archived = true;
      }

      const data = insertProjectSchema.partial().parse(req.body);
      const updated = await storage.updateProject((req.params.id as string), data);

      // If status changed, add timeline entry + send email notification
      if (data.status && data.status !== current.status && user) {
        const allStatusConfigs = await storage.getStatusConfigs();
        const statusLabels: Record<string, string> = Object.fromEntries(
          allStatusConfigs.map(c => [c.key, c.label])
        );
        await storage.addTimelineEntry({
          projectId: (req.params.id as string),
          event: `Status atualizado: ${statusLabels[data.status] || data.status}`,
          details: `Status alterado de "${statusLabels[current.status]}" para "${statusLabels[data.status]}"`,
          createdByRole: user.role,
        });

        storage.createAuditLog({
          userId: user.id,
          userName: user.name || user.username,
          userRole: user.role,
          action: "project.status_change",
          entityType: "project",
          entityId: (req.params.id as string),
          entityLabel: `${current.ticketNumber || ""} ${current.title}`.trim(),
          payload: JSON.stringify({ from: current.status, to: data.status }),
        }).catch(() => {});

        // Auto-create payments when status changes to aprovado_pagamento_pendente
        let paymentLink: string | undefined;
        if (data.status === "aprovado_pagamento_pendente" && (updated?.valor || current.valor)) {
          const settingsMap = await getSettingsMap();
          const intEmail = current.integrador?.email || current.client?.email;
          const intName = current.integrador?.name || current.client?.name;
          const intCpfCnpjAuto = current.integrador?.cpfCnpj || current.client?.cpfCnpj || (current as any).cpfCnpjCliente || undefined;
          const valorStr = updated?.valor || current.valor || "0";

          // ── Mercado Pago ──────────────────────────────────────────
          const mpToken = getMpAccessToken(settingsMap);
          if (mpToken) {
            try {
              const portalUrl = settingsMap["email_portal_url"] || "https://projetos.randolisolar.com.br";
              const webhookUrl = `${portalUrl}/api/mercadopago/webhook`;
              const paymentArgs = {
                accessToken: mpToken,
                projectId: (req.params.id as string),
                projectTitle: current.title,
                ticketNumber: current.ticketNumber,
                valor: valorStr,
                integradorEmail: intEmail || undefined,
                integradorName: intName || undefined,
                integradorCpfCnpj: intCpfCnpjAuto || undefined,
                webhookUrl,
              };
              const pref = await createPaymentPreference(paymentArgs);
              paymentLink = pref.initPoint;
              const updatePayment: any = {
                paymentLink: pref.initPoint,
                paymentId: pref.id,
                paymentStatus: "pending",
                paymentGateway: "mp",
              };
              try {
                const pix = await createPixPayment(paymentArgs);
                updatePayment.pixQrCode = pix.qrCode;
                updatePayment.pixQrCodeBase64 = pix.qrCodeBase64;
                updatePayment.pixPaymentId = pix.paymentId;
                console.log(`[mercadopago] PIX criado para projeto ${(req.params.id as string)}`);
              } catch (pixErr) {
                console.error("[mercadopago] Erro ao criar PIX (continuando sem):", pixErr);
              }
              await storage.updateProject((req.params.id as string), updatePayment);
              console.log(`[mercadopago] Preferência criada para projeto ${(req.params.id as string)}`);
            } catch (err) {
              console.error("[mercadopago] Erro ao criar pagamento:", err);
            }
          }

          // Timeline entry for payment
          if (mpToken) {
            await storage.addTimelineEntry({
              projectId: (req.params.id as string),
              event: "Pagamento disponível",
              details: "Mercado Pago (PIX e Cartão) disponível para pagamento.",
              createdByRole: "admin",
            });
          }
        }

        // Send email to integrador
        const integradorEmail = current.integrador?.email || current.client?.email;
        const integradorName = current.integrador?.name || current.client?.name || "Integrador";
        if (integradorEmail) {
          getEmailConfig().then(emailConfig => sendStatusEmail({
            to: integradorEmail as string,
            integradorName,
            projectTitle: current.title,
            ticketNumber: current.ticketNumber,
            newStatus: data.status as string,
            paymentLink,
            config: emailConfig,
          })).catch(err => console.error("[email] Falha ao enviar:", err));
        }

        // WhatsApp: notify integrador about status change
        const statusLabelsWa = statusLabels;
        (async () => {
          try {
            const waConfig = await getWhatsAppConfig();
            if (!waConfig.enabled) return;
            const intPhone = current.integrador?.phone || current.client?.phone;
            if (!intPhone) return;
            await sendWhatsAppStatusNotification({
              config: waConfig,
              phone: intPhone,
              integradorName: integradorName || "Integrador",
              projectTitle: current.title,
              ticketNumber: current.ticketNumber || "",
              newStatus: statusLabelsWa[data.status as string] || (data.status as string),
              changedBy: user.name || user.username,
            });
          } catch (err) { console.error("[whatsapp] Erro ao notificar status:", err); }
        })();
      }

      // Regenerate payment if valor changed on a project with existing payment
      if (data.valor && data.valor !== current.valor && updated?.status === "aprovado_pagamento_pendente") {
        try {
          const settingsMap2 = await getSettingsMap();
          const mpToken2 = getMpAccessToken(settingsMap2);
          const intEmail2 = current.integrador?.email || current.client?.email;
          const intName2 = current.integrador?.name || current.client?.name;
          const intCpfCnpj2 = current.integrador?.cpfCnpj || current.client?.cpfCnpj || (current as any).cpfCnpjCliente || undefined;
          const regenUpdate: any = {};

          if (mpToken2) {
            try {
              const portalUrl = settingsMap2["email_portal_url"] || "https://projetos.randolisolar.com.br";
              const webhookUrl = `${portalUrl}/api/mercadopago/webhook`;
              const paymentArgs = {
                accessToken: mpToken2,
                projectId: (req.params.id as string),
                projectTitle: current.title,
                ticketNumber: current.ticketNumber,
                valor: data.valor,
                integradorEmail: intEmail2 || undefined,
                integradorName: intName2 || undefined,
                integradorCpfCnpj: intCpfCnpj2 || undefined,
                webhookUrl,
              };
              const pref = await createPaymentPreference(paymentArgs);
              regenUpdate.paymentLink = pref.initPoint;
              regenUpdate.paymentId = pref.id;
              regenUpdate.paymentStatus = "pending";
              try {
                const pix = await createPixPayment(paymentArgs);
                regenUpdate.pixQrCode = pix.qrCode;
                regenUpdate.pixQrCodeBase64 = pix.qrCodeBase64;
                regenUpdate.pixPaymentId = pix.paymentId;
              } catch (pixErr) {
                console.error("[mercadopago] Erro ao criar PIX na atualização de valor:", pixErr);
              }
            } catch (mpErr) {
              console.error("[mercadopago] Erro ao regenerar pagamento MP:", mpErr);
            }
          }


          if (Object.keys(regenUpdate).length > 0) {
            await storage.updateProject((req.params.id as string), regenUpdate);
            await storage.addTimelineEntry({
              projectId: (req.params.id as string),
              event: "Pagamento atualizado",
              details: `Valor alterado para R$ ${data.valor}. Cobranças regeneradas.`,
              createdByRole: "admin",
            });
          }
        } catch (err) {
          console.error("[payment] Erro ao regenerar pagamento:", err);
        }
      }

      // Auto-emit NFS-e when status changes to "finalizado"
      if (data.status === "finalizado" && current.status !== "finalizado") {
        const sMapNfse = await getSettingsMap();
        if (sMapNfse["nfse_auto_emit"] === "true") {
          (async () => {
            try {
              const nfseConfig = getNfseConfig(sMapNfse);
              if (!nfseConfig) return;
              const proj = await storage.getProject((req.params.id as string));
              if (!proj) return;
              const client = proj.client;
              const proximoDps = nfseConfig.proximoDps;
              const nota = await storage.createNfseNota({
                projectId: (req.params.id as string),
                numeroRps: String(proximoDps),
                serieRps: nfseConfig.serie,
                status: "pendente",
                valor: proj.valor || "0",
                tomadorNome: client?.name || "",
                tomadorCpfCnpj: client?.cpfCnpj || "",
              });
              const result = await emitirNfse({
                config: nfseConfig,
                numeroDps: String(proximoDps),
                valor: proj.valor || "0",
                tomadorNome: client?.name || "",
                tomadorCpfCnpj: client?.cpfCnpj || "",
                tomadorEmail: client?.email || undefined,
                tomadorLogradouro: client?.rua || undefined,
                tomadorNumero: client?.numero || undefined,
                tomadorBairro: client?.bairro || undefined,
                tomadorCep: client?.cep || undefined,
                tomadorCidade: client?.cidade || undefined,
                tomadorUf: client?.estado || undefined,
                descricaoServico: nfseConfig.descricaoServico,
              });
              if (result.success) {
                await storage.updateNfseNota(nota.id, {
                  status: "emitida",
                  numeroNota: result.numeroNota,
                  codigoVerificacao: result.codigoVerificacao,
                  linkNota: result.linkNota,
                  xmlContent: result.xmlContent,
                  emitidoEm: new Date(),
                });
                await storage.setSiteSetting("nfse_proximo_dps", String(proximoDps + 1));
                await storage.addTimelineEntry({
                  projectId: (req.params.id as string),
                  event: "NFS-e emitida automaticamente",
                  details: `NFS-e nº ${result.numeroNota || "–"} emitida automaticamente ao finalizar o projeto.`,
                  createdByRole: "admin",
                });
                console.log(`[nfse] NFS-e emitida automaticamente ao finalizar projeto ${req.params.id}`);
              } else {
                await storage.updateNfseNota(nota.id, { status: "erro", errorMessage: result.error });
                console.error(`[nfse] Erro na emissão automática (finalização): ${result.error}`);
              }
            } catch (nfseErr) {
              console.error("[nfse] Erro ao emitir NFS-e na finalização:", nfseErr);
            }
          })();
        }
      }

      // Re-fetch project with updated payment info
      const finalProject = await storage.getProject((req.params.id as string));
      res.json(finalProject || updated);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  // ── CANCEL PAYMENT ──────────────────────────────────────────────
  app.post("/api/projects/:id/cancel-payment", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      const project = await storage.getProject((req.params.id as string));
      if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
      if (project.paymentStatus === "approved") {
        return res.status(400).json({ error: "Pagamento já aprovado não pode ser cancelado" });
      }
      await storage.updateProject((req.params.id as string), {
        paymentLink: null, paymentId: null, paymentStatus: null, paymentGateway: null,
        pixQrCode: null, pixQrCodeBase64: null, pixPaymentId: null,
      } as any);
      await storage.addTimelineEntry({
        projectId: (req.params.id as string),
        event: "Cobrança cancelada",
        details: "Cobrança cancelada pelo administrador para geração de novo método de pagamento.",
        createdByRole: "admin",
      });
      const finalProject = await storage.getProject((req.params.id as string));
      res.json(finalProject);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erro ao cancelar cobrança" });
    }
  });


  app.post("/api/projects/:id/generate-payment", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });

      const project = await storage.getProject((req.params.id as string));
      if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
      if (project.status !== "aprovado_pagamento_pendente") {
        return res.status(400).json({ error: "Projeto não está com pagamento pendente" });
      }
      if (!project.valor) {
        return res.status(400).json({ error: "Projeto não possui valor definido" });
      }

      const method = req.body.method || "mp";
      const settingsMap = await getSettingsMap();
      const intEmail = (project as any).integrador?.email || (project as any).client?.email;
      const intName = (project as any).integrador?.name || (project as any).client?.name;
      const intCpfCnpj = (project as any).integrador?.cpfCnpj || (project as any).client?.cpfCnpj || (project as any).cpfCnpjCliente || undefined;
      const updateData: any = {};
      let gatewayLabel = "";

      if (method === "pagseguro") {
        const psToken = settingsMap["pagseguro_token"];
        const psEnabled = settingsMap["pagseguro_enabled"] === "true";
        if (!psToken || !psEnabled) {
          return res.status(400).json({ error: "PagSeguro não está configurado ou ativo" });
        }
        try {
          const psSandbox = settingsMap["pagseguro_sandbox"] === "true";
          const charge = await createPagSeguroPixCharge({
            token: psToken,
            sandbox: psSandbox,
            projectId: (req.params.id as string),
            projectTitle: project.title,
            ticketNumber: project.ticketNumber,
            valor: project.valor,
            payerName: intName || undefined,
            payerCpfCnpj: intCpfCnpj || undefined,
            payerEmail: intEmail || undefined,
          });
          updateData.paymentId = charge.chargeId;
          updateData.paymentStatus = "pending";
          updateData.paymentGateway = "pagseguro";
          updateData.pixQrCode = charge.qrCode;
          updateData.pixQrCodeBase64 = charge.qrCodeBase64;
          updateData.pixPaymentId = charge.chargeId;
          gatewayLabel = "PagSeguro";
        } catch (psErr: any) {
          console.error("[pagseguro] Erro ao gerar pagamento:", psErr);
          return res.status(500).json({ error: psErr.message || "Erro ao gerar cobrança PagSeguro" });
        }
      } else {
        const mpToken = getMpAccessToken(settingsMap);
        if (!mpToken) {
          return res.status(400).json({ error: "Mercado Pago não está configurado" });
        }
        try {
          const portalUrl = settingsMap["email_portal_url"] || "https://projetos.randolisolar.com.br";
          const webhookUrl = `${portalUrl}/api/mercadopago/webhook`;
          const paymentArgs = {
            accessToken: mpToken,
            projectId: (req.params.id as string),
            projectTitle: project.title,
            ticketNumber: project.ticketNumber,
            valor: project.valor,
            integradorEmail: intEmail || undefined,
            integradorName: intName || undefined,
            integradorCpfCnpj: intCpfCnpj || undefined,
            webhookUrl,
          };
          const pref = await createPaymentPreference(paymentArgs);
          updateData.paymentLink = pref.initPoint;
          updateData.paymentId = pref.id;
          updateData.paymentStatus = "pending";
          updateData.paymentGateway = "mp";
          try {
            const pix = await createPixPayment(paymentArgs);
            updateData.pixQrCode = pix.qrCode;
            updateData.pixQrCodeBase64 = pix.qrCodeBase64;
            updateData.pixPaymentId = pix.paymentId;
            console.log(`[mercadopago] PIX criado para projeto ${(req.params.id as string)}`);
          } catch (pixErr) {
            console.error("[mercadopago] Erro ao criar PIX (continuando sem):", pixErr);
          }
          gatewayLabel = "Mercado Pago";
        } catch (mpErr: any) {
          console.error("[mercadopago] Erro ao gerar pagamento MP:", mpErr);
          return res.status(500).json({ error: mpErr.message || "Erro ao gerar cobrança Mercado Pago" });
        }
      }

      await storage.updateProject((req.params.id as string), updateData);

      await storage.addTimelineEntry({
        projectId: (req.params.id as string),
        event: "Pagamento gerado pelo administrador",
        details: `${gatewayLabel} disponível para pagamento.`,
        createdByRole: "admin",
      });

      const finalProject = await storage.getProject((req.params.id as string));
      res.json(finalProject);
    } catch (err: any) {
      console.error("[payment] Erro ao gerar pagamento:", err);
      res.status(500).json({ error: err.message || "Erro ao gerar pagamento" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      await storage.deleteProject((req.params.id as string));
      res.status(204).send();
    } catch { res.status(500).json({ error: "Erro ao deletar" }); }
  });

  // ── DOCUMENTS ──────────────────────────────────────────────────────
  app.get("/api/projects/:id/documents", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: "Não autenticado" });
      const isInternal = ["admin", "engenharia", "financeiro", "tecnico"].includes(user.role);
      if (!isInternal) {
        const project = await storage.getProject((req.params.id as string));
        if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
        const client = await storage.getClientByUserId(user.id);
        if (!client || project.clientId !== client.id) return res.status(403).json({ error: "Sem permissão" });
      }
      res.json(await storage.getDocumentsByProject((req.params.id as string)));
    } catch { res.status(500).json({ error: "Erro ao buscar documentos" }); }
  });

  app.post("/api/projects/:id/documents", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: "Não autenticado" });
      const isInternal = ["admin", "engenharia", "financeiro", "tecnico"].includes(user.role);
      if (!isInternal) {
        const project = await storage.getProject((req.params.id as string));
        if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
        const client = await storage.getClientByUserId(user.id);
        if (!client || project.clientId !== client.id) return res.status(403).json({ error: "Sem permissão" });
      }
      const data = insertDocumentSchema.parse({
        ...req.body,
        projectId: (req.params.id as string),
        uploadedByRole: user?.role || "integrador",
        uploadedById: user?.id,
      });
      const doc = await storage.createDocument(data);

      // Auto timeline
      await storage.addTimelineEntry({
        projectId: (req.params.id as string),
        event: `Documento enviado: ${doc.name}`,
        details: `Arquivo "${doc.name}" foi enviado por ${user?.role === "admin" ? "Randoli Engenharia" : "integrador"}.`,
        createdByRole: user?.role || "integrador",
      });

      storage.createAuditLog({
        userId: user?.id,
        userName: user?.name || user?.username,
        userRole: user?.role,
        action: "document.upload",
        entityType: "document",
        entityId: doc.id,
        entityLabel: doc.name,
        payload: JSON.stringify({ projectId: (req.params.id as string), docType: doc.docType }),
      }).catch(() => {});

      // Notification for admin when integrador uploads document
      const isAdminUpload = user && ["admin", "engenharia", "financeiro"].includes(user.role);
      if (!isAdminUpload) {
        const proj = await storage.getProject((req.params.id as string));
        if (proj) {
          storage.createNotification({
            type: "document",
            title: `Documento enviado por integrador`,
            body: `${user?.name || "Integrador"} enviou "${doc.name}" no projeto ${proj.ticketNumber || proj.title}`,
            projectId: proj.id,
            projectTitle: proj.title,
            ticketNumber: proj.ticketNumber,
          }).catch(() => {});
        }
      }

      // Email notification to integrador when admin uploads a document
      if (isAdminUpload) {
        const project = await storage.getProject((req.params.id as string));
        if (project) {
          const integradorEmail = project.integrador?.email || project.client?.email;
          const integradorName = project.integrador?.name || project.client?.name || "Integrador";
          if (integradorEmail) {
            getEmailConfig().then(emailConfig => sendDocumentEmail({
              to: integradorEmail,
              integradorName,
              projectTitle: project.title,
              ticketNumber: project.ticketNumber,
              documentName: doc.name,
              uploadedBy: "Randoli Engenharia Solar",
              config: emailConfig,
            })).catch(err => console.error("[email] Falha ao enviar notificação de documento:", err));
          }
        }
      }

      // WhatsApp: notify about document upload
      (async () => {
        try {
          const waConfig = await getWhatsAppConfig();
          if (!waConfig.enabled) return;
          const proj = await storage.getProject((req.params.id as string));
          if (!proj) return;
          if (isAdminUpload) {
            const intPhone = proj.integrador?.phone || proj.client?.phone;
            if (intPhone) {
              await sendWhatsAppDocumentNotification({
                config: waConfig,
                phone: intPhone,
                recipientName: proj.integrador?.name || proj.client?.name || "Integrador",
                projectTitle: proj.title,
                ticketNumber: proj.ticketNumber || "",
                documentName: doc.name,
                uploadedBy: user?.name || "Randoli Engenharia",
              });
            }
          } else {
            const adminPhone = await getWhatsAppAdminPhone();
            if (adminPhone) {
              await sendWhatsAppDocumentNotification({
                config: waConfig,
                phone: adminPhone,
                recipientName: "Admin",
                projectTitle: proj.title,
                ticketNumber: proj.ticketNumber || "",
                documentName: doc.name,
                uploadedBy: user?.name || "Integrador",
              });
            }
          }
        } catch (err) { console.error("[whatsapp] Erro ao notificar documento:", err); }
      })();

      res.status(201).json(doc);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.delete("/api/projects/:projectId/documents/:docId", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const project = await storage.getProject((req.params.projectId as string));
      if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
      const isInternal = ["admin", "engenharia", "financeiro", "tecnico"].includes(user?.role || "");
      if (!isInternal) {
        const client = await storage.getClientByUserId(user!.id);
        if (!client || project.clientId !== client.id) return res.status(403).json({ error: "Sem permissão" });
      }
      await storage.deleteDocument((req.params.docId as string));
      res.status(204).send();
    } catch { res.status(500).json({ error: "Erro ao deletar documento" }); }
  });

  // ── TIMELINE ───────────────────────────────────────────────────────
  app.get("/api/projects/:id/timeline", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: "Não autenticado" });
      const isInternal = ["admin", "engenharia", "financeiro", "tecnico"].includes(user.role);
      if (!isInternal) {
        const project = await storage.getProject((req.params.id as string));
        if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
        const client = await storage.getClientByUserId(user.id);
        if (!client || project.clientId !== client.id) return res.status(403).json({ error: "Sem permissão" });
      }
      res.json(await storage.getTimelineByProject((req.params.id as string)));
    } catch { res.status(500).json({ error: "Erro ao buscar timeline" }); }
  });

  app.post("/api/projects/:id/timeline", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: "Não autenticado" });
      const isInternal = ["admin", "engenharia", "financeiro", "tecnico"].includes(user.role);
      if (!isInternal) {
        const project = await storage.getProject((req.params.id as string));
        if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
        const client = await storage.getClientByUserId(user.id);
        if (!client || project.clientId !== client.id) return res.status(403).json({ error: "Sem permissão" });
      }
      const entry = await storage.addTimelineEntry({
        projectId: (req.params.id as string),
        event: req.body.event,
        details: req.body.details,
        createdByRole: user?.role || "admin",
      });

      // Email notification to integrador when admin adds a timeline note
      const isAdminAction = user && ["admin", "engenharia", "financeiro"].includes(user.role);
      if (isAdminAction) {
        const project = await storage.getProject((req.params.id as string));
        if (project) {
          const integradorEmail = project.integrador?.email || project.client?.email;
          const integradorName = project.integrador?.name || project.client?.name || "Integrador";
          if (integradorEmail) {
            getEmailConfig().then(emailConfig => sendTimelineEmail({
              to: integradorEmail,
              integradorName,
              projectTitle: project.title,
              ticketNumber: project.ticketNumber,
              event: req.body.event,
              details: req.body.details,
              config: emailConfig,
            })).catch(err => console.error("[email] Falha ao enviar notificação de histórico:", err));
          }
        }
      }

      // WhatsApp: notify about timeline note
      (async () => {
        try {
          const waConfig = await getWhatsAppConfig();
          if (!waConfig.enabled) return;
          const proj = await storage.getProject((req.params.id as string));
          if (!proj) return;
          if (isAdminAction) {
            const intPhone = proj.integrador?.phone || proj.client?.phone;
            if (intPhone) {
              await sendWhatsAppTimelineNotification({
                config: waConfig,
                phone: intPhone,
                recipientName: proj.integrador?.name || proj.client?.name || "Integrador",
                projectTitle: proj.title,
                ticketNumber: proj.ticketNumber || "",
                event: req.body.event,
                details: req.body.details,
              });
            }
          } else {
            const adminPhone = await getWhatsAppAdminPhone();
            if (adminPhone) {
              await sendWhatsAppTimelineNotification({
                config: waConfig,
                phone: adminPhone,
                recipientName: "Admin",
                projectTitle: proj.title,
                ticketNumber: proj.ticketNumber || "",
                event: req.body.event,
                details: req.body.details,
              });
            }
          }
        } catch (err) { console.error("[whatsapp] Erro ao notificar timeline:", err); }
      })();

      res.status(201).json(entry);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  // ── PARTNERS ───────────────────────────────────────────────────────
  app.get("/api/partners", async (_req, res) => {
    res.json(await storage.getPartners());
  });

  app.post("/api/partners", requireAuth, async (req, res) => {
    try {
      const data = insertPartnerSchema.parse(req.body);
      res.status(201).json(await storage.createPartner(data));
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.patch("/api/partners/:id", requireAuth, async (req, res) => {
    try {
      const data = insertPartnerSchema.partial().parse(req.body);
      const p = await storage.updatePartner((req.params.id as string), data);
      if (!p) return res.status(404).json({ error: "Não encontrado" });
      res.json(p);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.delete("/api/partners/:id", requireAuth, async (req, res) => {
    try {
      await storage.deletePartner((req.params.id as string));
      res.status(204).send();
    } catch { res.status(500).json({ error: "Erro ao deletar" }); }
  });

  // ── MERCADO PAGO WEBHOOK ──────────────────────────────────────────
  async function advanceProjectAfterPayment(project: any, projectId: string, paymentId: string, paidValue: number, gatewayName: string, settingsMap?: Record<string, string>) {
    const sMap = settingsMap || await getSettingsMap();
    const STATUS_ORDER = ["orcamento", "aprovado_pagamento_pendente", "projeto_tecnico", "aguardando_art", "protocolado", "parecer_acesso", "instalacao", "vistoria", "projeto_aprovado", "homologado", "finalizado", "cancelado"];
    
    let nextStatus = sMap["payment_next_status"] || undefined;
    if (!nextStatus || !STATUS_ORDER.includes(nextStatus)) {
      const currentIdx = STATUS_ORDER.indexOf(project.status);
      nextStatus = currentIdx >= 0 && currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : "projeto_tecnico";
    }

    const STATUS_LABELS: Record<string, string> = {
      "orcamento": "Orçamento",
      "aprovado_pagamento_pendente": "Aprovado / Pag. Pendente",
      "projeto_tecnico": "Projeto Técnico",
      "aguardando_art": "Aguardando ART",
      "protocolado": "Protocolado",
      "parecer_acesso": "Parecer de Acesso",
      "instalacao": "Em Instalação",
      "vistoria": "Aguardando Vistoria",
      "projeto_aprovado": "Projeto Aprovado",
      "homologado": "Homologado",
      "finalizado": "Finalizado",
      "cancelado": "Cancelado",
    };

    await storage.updateProject(projectId, {
      status: nextStatus,
      paymentStatus: "approved",
    } as any);

    const nextStatusLabel = STATUS_LABELS[nextStatus] || nextStatus;
    await storage.addTimelineEntry({
      projectId,
      event: `Pagamento confirmado via ${gatewayName}`,
      details: `Pagamento #${paymentId} aprovado (R$ ${paidValue.toFixed(2).replace(".", ",")}). Status avançado automaticamente para ${nextStatusLabel}.`,
      createdByRole: "admin",
    });

    storage.createNotification({
      type: "payment",
      title: `Pagamento aprovado`,
      body: `Pagamento de R$ ${paidValue.toFixed(2).replace(".", ",")} aprovado no projeto ${project.ticketNumber || project.title}. Status avançado para ${nextStatusLabel}.`,
      projectId,
      projectTitle: project.title,
      ticketNumber: project.ticketNumber,
    }).catch(() => {});

    storage.createAuditLog({
      userId: null,
      userName: gatewayName,
      userRole: "system",
      action: "payment.approved",
      entityType: "project",
      entityId: projectId,
      entityLabel: `${project.ticketNumber || ""} ${project.title}`.trim(),
      payload: JSON.stringify({ paymentId, amount: paidValue, gateway: gatewayName }),
    }).catch(() => {});

    const integradorEmail = project.integrador?.email || project.client?.email;
    const integradorName = project.integrador?.name || project.client?.name || "Integrador";
    if (integradorEmail) {
      getEmailConfig().then(emailConfig => sendStatusEmail({
        to: integradorEmail,
        integradorName,
        projectTitle: project.title,
        ticketNumber: project.ticketNumber,
        newStatus: nextStatus,
        config: emailConfig,
      })).catch(err => console.error("[email] Falha ao enviar:", err));
    }

    (async () => {
      try {
        const waConfig = await getWhatsAppConfig();
        if (!waConfig.enabled) return;
        const intPhone = project.integrador?.phone || project.client?.phone;
        const intName = project.integrador?.name || project.client?.name || "Integrador";
        const valor = paidValue.toFixed(2).replace(".", ",");
        if (intPhone) {
          await sendWhatsAppPaymentNotification({
            config: waConfig, phone: intPhone, recipientName: intName,
            projectTitle: project.title, ticketNumber: project.ticketNumber || "", valor,
          });
        }
        const adminPhone = await getWhatsAppAdminPhone();
        if (adminPhone) {
          await sendWhatsAppPaymentNotification({
            config: waConfig, phone: adminPhone, recipientName: "Admin",
            projectTitle: project.title, ticketNumber: project.ticketNumber || "", valor,
          });
        }
      } catch (err) { console.error("[whatsapp] Erro ao notificar pagamento:", err); }
    })();

    // Auto NFS-e emission after payment (check gateway filter)
    const nfseGatewayFilter = (sMap["nfse_auto_emit_gateways"] || "").split(",").filter(Boolean);
    const gatewayKeyMap: Record<string, string> = {
      "Mercado Pago": "mp", "mercado_pago": "mp", "mp": "mp",
      "PagSeguro": "pagseguro", "pagseguro": "pagseguro",
      "Inter PIX": "inter_pix", "inter_pix": "inter_pix", "Banco Inter PIX": "inter_pix",
      "Inter Boleto": "inter_boleto", "inter_boleto": "inter_boleto", "Banco Inter Boleto": "inter_boleto",
      "Manual": "manual", "manual": "manual",
    };
    const gatewayKey = gatewayKeyMap[gatewayName] || gatewayName.toLowerCase().replace(/\s+/g, "_");
    const gatewayMatchesNfse = nfseGatewayFilter.length === 0 || nfseGatewayFilter.includes(gatewayKey);
    if (sMap["nfse_auto_emit"] === "true" && gatewayMatchesNfse) {
      try {
        const nfseConfig = getNfseConfig(sMap);
        if (nfseConfig) {
          const client = project.client;
          const proximoDps = nfseConfig.proximoDps;
          const nota = await storage.createNfseNota({
            projectId,
            numeroRps: String(proximoDps),
            serieRps: nfseConfig.serie,
            status: "pendente",
            valor: project.valor || "0",
            tomadorNome: client?.name || "",
            tomadorCpfCnpj: client?.cpfCnpj || "",
          });
          const result = await emitirNfse({
            config: nfseConfig,
            numeroDps: String(proximoDps),
            valor: project.valor || "0",
            tomadorNome: client?.name || "",
            tomadorCpfCnpj: client?.cpfCnpj || "",
            tomadorEmail: client?.email || undefined,
            tomadorLogradouro: client?.rua || undefined,
            tomadorNumero: client?.numero || undefined,
            tomadorBairro: client?.bairro || undefined,
            tomadorCep: client?.cep || undefined,
            tomadorCidade: client?.cidade || undefined,
            tomadorUf: client?.estado || undefined,
            descricaoServico: nfseConfig.descricaoServico,
          });
          if (result.success) {
            await storage.updateNfseNota(nota.id, {
              status: "emitida",
              numeroNota: result.numeroNota,
              codigoVerificacao: result.codigoVerificacao,
              linkNota: result.linkNota,
              xmlContent: result.xmlContent,
              emitidoEm: new Date(),
            });
            await storage.setSiteSetting("nfse_proximo_dps", String(proximoDps + 1));
            await storage.addTimelineEntry({
              projectId,
              event: "NFS-e emitida automaticamente",
              details: `NFS-e nº ${result.numeroNota || "–"} emitida automaticamente após confirmação de pagamento.`,
              createdByRole: "admin",
            });
            console.log(`[nfse] NFS-e emitida automaticamente para projeto ${projectId}`);
          } else {
            await storage.updateNfseNota(nota.id, { status: "erro", errorMessage: result.error });
            console.error(`[nfse] Erro ao emitir NFS-e automática: ${result.error}`);
          }
        }
      } catch (nfseErr) {
        console.error("[nfse] Erro na emissão automática de NFS-e:", nfseErr);
      }
    }

    console.log(`[payment] Projeto ${projectId} avançado para projeto_tecnico via ${gatewayName}`);
  }

  async function processPaymentUpdate(paymentId: string, mpToken: string, source: string): Promise<{ projectId?: string; status?: string; advanced?: boolean }> {
    const payment = await getPaymentInfo(paymentId, mpToken);
    if (!payment) {
      console.log(`[mercadopago] [${source}] Pagamento não encontrado: ${paymentId}`);
      return {};
    }

    const projectId = payment.external_reference;
    const paymentStatus = payment.status;
    const paidValue = payment.transaction_amount || 0;
    console.log(`[mercadopago] [${source}] Pagamento ${paymentId}: status=${paymentStatus}, projeto=${projectId}, valor=${paidValue}, método=${payment.payment_method_id}`);

    if (!projectId) {
      console.log(`[mercadopago] [${source}] Sem external_reference, ignorando`);
      return {};
    }

    const project = await storage.getProject(projectId);
    if (!project) {
      console.log(`[mercadopago] [${source}] Projeto ${projectId} não encontrado`);
      return {};
    }

    if (project.paymentStatus === "approved" && project.status !== "aprovado_pagamento_pendente") {
      console.log(`[mercadopago] [${source}] Projeto já pago e avançado, ignorando`);
      return { projectId, status: paymentStatus };
    }

    await storage.updateProject(projectId, { paymentStatus } as any);

    if (paymentStatus === "approved" && project.status === "aprovado_pagamento_pendente") {
      await advanceProjectAfterPayment(project, projectId, paymentId, paidValue, "Mercado Pago");
      return { projectId, status: paymentStatus, advanced: true };
    }

    return { projectId, status: paymentStatus };
  }

  app.post("/api/mercadopago/webhook", async (req, res) => {
    try {
      const { type, data, action } = req.body;
      console.log("[mercadopago] Webhook recebido:", JSON.stringify({ type, action, dataId: data?.id, body: req.body }));

      const settingsMap = await getSettingsMap();
      const mpToken = getMpAccessToken(settingsMap);
      if (!mpToken) {
        console.log("[mercadopago] Token não configurado, ignorando webhook");
        return res.sendStatus(200);
      }

      const webhookSecret = settingsMap["mp_webhook_secret"] || process.env.MP_WEBHOOK_SECRET;

      if (type === "payment" && data?.id) {
        const xSignature = req.headers["x-signature"] as string | undefined;
        const xRequestId = req.headers["x-request-id"] as string | undefined;

        if (!verifyWebhookSignature(xSignature, xRequestId, String(data.id), webhookSecret)) {
          console.warn("[mercadopago] Assinatura inválida no webhook — requisição rejeitada");
          return res.sendStatus(401);
        }

        await processPaymentUpdate(String(data.id), mpToken, "webhook");
      }

      if (type === "merchant_order" && data?.id) {
        try {
          const order = await getMerchantOrder(String(data.id), mpToken);
          if (order && order.payments) {
            console.log(`[mercadopago] Merchant order ${data.id}: ${order.payments.length} pagamentos`);
            for (const p of order.payments) {
              if (p.status === "approved") {
                await processPaymentUpdate(String(p.id), mpToken, "merchant_order");
              }
            }
          }
        } catch (err) {
          console.error("[mercadopago] Erro ao processar merchant_order:", err);
        }
      }

      res.sendStatus(200);
    } catch (err) {
      console.error("[mercadopago] Erro no webhook:", err);
      res.sendStatus(200);
    }
  });

  app.post("/api/pagseguro/webhook", async (req, res) => {
    try {
      const body = req.body;
      console.log("[pagseguro] Webhook recebido:", JSON.stringify(body));

      const settingsMap = await getSettingsMap();
      const psToken = settingsMap["pagseguro_token"];
      if (!psToken) {
        console.log("[pagseguro] Token não configurado, ignorando webhook");
        return res.sendStatus(200);
      }

      const signature = req.headers["x-pagseguro-signature"] as string | undefined;
      if (!verifyPagSeguroWebhookSignature(JSON.stringify(body), signature, psToken)) {
        console.warn("[pagseguro] Assinatura inválida no webhook — requisição rejeitada");
        return res.sendStatus(401);
      }

      const orderId = body?.id || body?.reference_id;
      if (!orderId) {
        console.log("[pagseguro] Sem ID no webhook");
        return res.sendStatus(200);
      }

      const psSandbox = settingsMap["pagseguro_sandbox"] === "true";
      const order = await getPagSeguroOrderInfo(orderId, psToken, psSandbox);
      if (!order) {
        console.log(`[pagseguro] Pedido ${orderId} não encontrado`);
        return res.sendStatus(200);
      }

      const projectId = order.reference_id;
      const paymentStatus = extractPagSeguroPaymentStatus(order);
      console.log(`[pagseguro] Pedido ${orderId}: status=${paymentStatus}, projeto=${projectId}`);

      if (!projectId) return res.sendStatus(200);

      const project = await storage.getProject(projectId);
      if (!project) {
        console.log(`[pagseguro] Projeto ${projectId} não encontrado`);
        return res.sendStatus(200);
      }

      if (project.paymentStatus === "approved" && project.status !== "aprovado_pagamento_pendente") {
        console.log(`[pagseguro] Projeto já pago e avançado, ignorando`);
        return res.sendStatus(200);
      }

      await storage.updateProject(projectId, { paymentStatus } as any);

      if (paymentStatus === "approved" && project.status === "aprovado_pagamento_pendente") {
        await advanceProjectAfterPayment(project, projectId, orderId, order.charges?.[0]?.amount?.value ? (order.charges[0].amount.value / 100) : 0, "PagSeguro", settingsMap);
      }

      res.sendStatus(200);
    } catch (err) {
      console.error("[pagseguro] Erro no webhook:", err);
      res.sendStatus(200);
    }
  });

  app.post("/api/projects/:id/verify-payment", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });

      const project = await storage.getProject((req.params.id as string));
      if (!project) return res.status(404).json({ error: "Projeto não encontrado" });

      const settingsMap = await getSettingsMap();
      const gateway = project.paymentGateway || "mp";

      if (gateway === "pagseguro") {
        const psToken = settingsMap["pagseguro_token"];
        if (!psToken) return res.status(400).json({ error: "Token PagSeguro não configurado" });
        if (!project.paymentId) return res.status(400).json({ error: "Nenhum pagamento para verificar" });

        const psSandbox = settingsMap["pagseguro_sandbox"] === "true";
        const order = await getPagSeguroOrderInfo(project.paymentId, psToken, psSandbox);
        if (!order) return res.status(400).json({ error: "Pedido não encontrado no PagSeguro" });

        const paymentStatus = extractPagSeguroPaymentStatus(order);

        if (project.paymentStatus === "approved" && project.status !== "aprovado_pagamento_pendente") {
          const updatedProject = await storage.getProject((req.params.id as string));
          return res.json({ payments: [{ status: paymentStatus, gateway: "pagseguro" }], project: updatedProject });
        }

        await storage.updateProject((req.params.id as string), { paymentStatus } as any);

        if (paymentStatus === "approved" && project.status === "aprovado_pagamento_pendente") {
          await advanceProjectAfterPayment(project, (req.params.id as string), project.paymentId, order.charges?.[0]?.amount?.value ? (order.charges[0].amount.value / 100) : 0, "PagSeguro", settingsMap);
        }

        const updatedProject = await storage.getProject((req.params.id as string));
        return res.json({ payments: [{ status: paymentStatus, gateway: "pagseguro" }], project: updatedProject });
      }

      const mpToken = getMpAccessToken(settingsMap);
      if (!mpToken) return res.status(400).json({ error: "Token do Mercado Pago não configurado" });

      const results: any[] = [];

      if (project.paymentId) {
        const prefId = project.paymentId;
        try {
          const prefRes = await fetch(`https://api.mercadopago.com/checkout/preferences/${prefId}`, {
            headers: { Authorization: `Bearer ${mpToken}` },
          });
          if (prefRes.ok) {
            const pref = await prefRes.json();
            console.log(`[mercadopago] Preferência ${prefId}: external_ref=${pref.external_reference}`);
          }
        } catch (e) {
          console.log(`[mercadopago] Não conseguiu buscar preferência ${prefId}`);
        }

        const searchRes = await fetch(
          `https://api.mercadopago.com/v1/payments/search?external_reference=${project.id}&sort=date_created&criteria=desc&limit=5`,
          { headers: { Authorization: `Bearer ${mpToken}` } }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          console.log(`[mercadopago] Busca por pagamentos do projeto ${project.id}: ${searchData.results?.length || 0} encontrados`);
          for (const p of (searchData.results || [])) {
            results.push({
              id: p.id,
              status: p.status,
              statusDetail: p.status_detail,
              amount: p.transaction_amount,
              method: p.payment_method_id,
              dateCreated: p.date_created,
              dateApproved: p.date_approved,
              gateway: "mp",
            });
            if (p.status === "approved") {
              const updateResult = await processPaymentUpdate(String(p.id), mpToken, "verify-manual");
              if (updateResult.advanced) {
                console.log(`[mercadopago] ✓ Pagamento verificado e projeto avançado manualmente`);
              }
            }
          }
        }
      }

      if (project.pixPaymentId) {
        const pixPayment = await getPaymentInfo(project.pixPaymentId, mpToken);
        if (pixPayment) {
          results.push({
            id: pixPayment.id,
            status: pixPayment.status,
            statusDetail: pixPayment.status_detail,
            amount: pixPayment.transaction_amount,
            method: "pix",
            dateCreated: pixPayment.date_created,
            dateApproved: pixPayment.date_approved,
            gateway: "mp",
          });
          if (pixPayment.status === "approved") {
            await processPaymentUpdate(String(pixPayment.id), mpToken, "verify-manual-pix");
          }
        }
      }

      const updatedProject = await storage.getProject((req.params.id as string));
      res.json({ payments: results, project: updatedProject });
    } catch (err: any) {
      console.error("[verify-payment] Erro ao verificar pagamento:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── STATUS CONFIGS ──────────────────────────────────────────────────
  const STATUS_SEED_DEFAULTS = [
    { key: "orcamento",                   label: "Orçamento",                color: "slate",   showInKanban: true,  sortOrder: 0  },
    { key: "aprovado_pagamento_pendente", label: "Aprovado / Pag. Pendente", color: "yellow",  showInKanban: false, sortOrder: 1  },
    { key: "projeto_tecnico",             label: "Projeto Técnico",          color: "blue",    showInKanban: true,  sortOrder: 2  },
    { key: "aguardando_art",              label: "Aguardando ART",           color: "violet",  showInKanban: true,  sortOrder: 3  },
    { key: "protocolado",                 label: "Protocolado",              color: "purple",  showInKanban: true,  sortOrder: 4  },
    { key: "parecer_acesso",              label: "Parecer de Acesso",        color: "amber",   showInKanban: true,  sortOrder: 5  },
    { key: "instalacao",                  label: "Em Instalação",            color: "orange",  showInKanban: false, sortOrder: 6  },
    { key: "vistoria",                    label: "Aguardando Vistoria",      color: "cyan",    showInKanban: true,  sortOrder: 7  },
    { key: "projeto_aprovado",            label: "Projeto Aprovado",         color: "teal",    showInKanban: false, sortOrder: 8  },
    { key: "homologado",                  label: "Homologado",               color: "green",   showInKanban: true,  sortOrder: 9  },
    { key: "finalizado",                  label: "Finalizado",               color: "emerald", showInKanban: true,  sortOrder: 10 },
    { key: "cancelado",                   label: "Cancelado",                color: "red",     showInKanban: false, sortOrder: 11 },
  ];

  app.get("/api/status-configs", async (_req, res) => {
    try {
      await storage.seedStatusConfigs(STATUS_SEED_DEFAULTS);
      const configs = await storage.getStatusConfigs();
      res.json(configs);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/status-configs/:key", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Apenas administradores podem alterar status" });
      const { label, color, showInKanban, sortOrder } = req.body;
      const updated = await storage.upsertStatusConfig(req.params.key as string, { label, color, showInKanban, sortOrder });
      res.json(updated);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── ANNOUNCEMENTS (INFORMATIVOS) ──────────────────────────────────────
  app.get("/api/announcements", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      const isAdmin = ["admin", "engenharia", "financeiro", "tecnico"].includes(user?.role || "");
      const items = isAdmin ? await storage.getAnnouncements() : await storage.getActiveAnnouncements();
      res.json(items);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/announcements/unread", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: "Não autenticado" });
      const items = await storage.getUnreadAnnouncements(user.id);
      res.json(items);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/announcements", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      const data = req.body;
      if (!data.title || !data.content) return res.status(400).json({ error: "Título e conteúdo são obrigatórios" });
      const item = await storage.createAnnouncement({ title: data.title, content: data.content, active: data.active ?? true });
      res.status(201).json(item);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.patch("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      const updated = await storage.updateAnnouncement(req.params.id as string, req.body);
      if (!updated) return res.status(404).json({ error: "Não encontrado" });
      res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  app.delete("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      await storage.deleteAnnouncement(req.params.id as string);
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/announcements/:id/read", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: "Não autenticado" });
      await storage.markAnnouncementRead(req.params.id as string, user.id);
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── SEARCH ───────────────────────────────────────────────────────────
  app.get("/api/search", requireAuth, async (req, res) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (!q || q.length < 2) return res.json({ projects: [], clients: [] });
      const results = await storage.searchAll(q);
      res.json(results);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── AUDIT LOGS ──────────────────────────────────────────────────────
  app.get("/api/audit-logs", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Apenas administradores" });
      const entityType = req.query.entityType as string | undefined;
      const logs = await storage.getAuditLogs(200, entityType);
      res.json(logs);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── ANALYTICS ────────────────────────────────────────────────────────
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user || !["admin", "financeiro", "engenharia"].includes(user.role)) return res.status(403).json({ error: "Sem permissão" });
      const allProjects = await storage.getAllProjectsIncludingArchived();
      // Projects per month (last 6 months)
      const now = new Date();
      const months: { month: string; count: number; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        const inMonth = allProjects.filter(p => {
          const c = new Date(p.createdAt!);
          return c >= d && c < next;
        });
        const revenue = inMonth.reduce((sum, p) => {
          if (!p.valor) return sum;
          const v = parseFloat(p.valor.replace(/\./g, "").replace(",", "."));
          return sum + (isNaN(v) ? 0 : v);
        }, 0);
        months.push({ month: label, count: inMonth.length, revenue });
      }
      // By status
      const byStatus: Record<string, number> = {};
      for (const p of allProjects) {
        byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      }
      res.json({ months, byStatus, totalProjects: allProjects.length });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── NOTIFICATIONS ────────────────────────────────────────────────────
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user || !["admin", "engenharia", "financeiro"].includes(user.role)) return res.status(403).json({ error: "Sem permissão" });
      const notifs = await storage.getNotifications(100);
      res.json(notifs);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/notifications/count", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user || !["admin", "engenharia", "financeiro"].includes(user.role)) return res.json({ count: 0 });
      const count = await storage.getUnreadNotificationCount();
      res.json({ count });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead((req.params.id as string));
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead();
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── SETTINGS ───────────────────────────────────────────────────────
  app.get("/api/settings/public", async (_req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const map: Record<string, string> = {};
      const publicKeys = [
        "mp_public_key", "mp_enabled", "pagseguro_enabled", "company_name", "logo_url", "primary_color",
        "login_badge_text", "login_headline", "login_headline_highlight",
        "login_description", "login_feature_1", "login_feature_2", "login_feature_3",
        "login_bg_type", "login_bg_image", "login_headline_size", "login_description_size",
        "support_title", "support_description", "support_button_text", "support_whatsapp_url",
      ];
      for (const s of settings) {
        if (!s.value) continue;
        if (publicKeys.includes(s.key)) {
          map[s.key] = s.value;
        }
      }
      res.json(map);
    } catch { res.status(500).json({ error: "Erro" }); }
  });

  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user || !["admin", "engenharia", "financeiro"].includes(user.role)) {
        return res.status(403).json({ error: "Sem permissão" });
      }
      const settings = await storage.getSiteSettings();
      const map: Record<string, string> = {};
      const MASKED_KEYS = new Set([
        "email_smtp_pass", "mp_access_token", "mp_webhook_secret",
        "whatsapp_api_key", "pagseguro_token",
      ]);
      for (const s of settings) {
        if (!s.value) continue;
        if (MASKED_KEYS.has(s.key)) {
          map[s.key] = "••••••••";
        } else {
          map[s.key] = s.value;
        }
      }
      res.json(map);
    } catch { res.status(500).json({ error: "Erro" }); }
  });

  app.post("/api/settings", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      const { key, value } = req.body;
      if (!key || value === undefined) return res.status(400).json({ error: "key e value obrigatórios" });
      const MASKED_KEYS = new Set([
        "email_smtp_pass", "mp_access_token", "mp_webhook_secret",
        "whatsapp_api_key",
      ]);
      if (MASKED_KEYS.has(key) && value === "••••••••") {
        return res.json({ key, value });
      }
      res.json(await storage.setSiteSetting(key, value));
    } catch { res.status(500).json({ error: "Erro" }); }
  });

  // ── WHATSAPP TEST CONNECTION ──────────────────────────────────────
  app.post("/api/whatsapp/test", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      const { apiUrl, apiKey, instanceName } = req.body;
      const settingsMap = await getSettingsMap();
      const config: WhatsAppConfig = {
        enabled: true,
        apiUrl: apiUrl || "",
        apiKey: (apiKey && apiKey !== "••••••••") ? apiKey : (settingsMap["whatsapp_api_key"] || ""),
        instanceName: instanceName || "",
      };
      const result = await testWhatsAppConnection(config);
      if (result.ok) {
        res.json({ ok: true, message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erro ao testar WhatsApp" });
    }
  });


  // ── EMAIL TEST ──────────────────────────────────────────────────────
  app.post("/api/email/test", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: "Não autorizado" });
      const { to } = req.body;
      const recipient = to || user.email;
      if (!recipient) return res.status(400).json({ error: "Destinatário não definido" });
      const config = await getEmailConfig();
      await sendTestEmail(recipient, config);
      res.json({ ok: true, sentTo: recipient });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erro ao enviar e-mail de teste" });
    }
  });

  // ── STATS ──────────────────────────────────────────────────────────
  app.get("/api/stats", requireAuth, async (_req, res) => {
    try {
      const [allProjects, allClients] = await Promise.all([
        storage.getAllProjectsIncludingArchived(),
        storage.getClients(),
      ]);
      const byStatus = allProjects.reduce((acc: Record<string, number>, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});
      res.json({ totalProjects: allProjects.length, totalClients: allClients.length, byStatus });
    } catch { res.status(500).json({ error: "Erro" }); }
  });

  // ── PRICING RANGES ─────────────────────────────────────────────────
  app.get("/api/pricing-ranges", async (req, res) => {
    try {
      const ranges = await storage.getPricingRanges();
      res.json(ranges);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/pricing-ranges/calculate", async (req, res) => {
    try {
      const kwp = parseFloat(String(req.query.kwp || "0"));
      if (!kwp || kwp <= 0) return res.status(400).json({ error: "kWp inválido" });

      // Find the matching standard range first
      const standardResult = await storage.getPriceForKwp(kwp);

      // Se o usuário está logado, verificar preço promocional específico para a faixa
      const loggedUser = await getCurrentUser(req);
      if (loggedUser) {
        const clientRecord = await storage.getClientByUserId(loggedUser.id);
        if (clientRecord) {
          // Check for range-specific promotional price first, then fallback to no-range
          const rangeId = standardResult?.range?.id || null;
          let customPricing = rangeId
            ? await storage.getClientPricing(clientRecord.id, rangeId)
            : undefined;
          if (!customPricing) {
            customPricing = await storage.getClientPricing(clientRecord.id, null);
          }
          if (customPricing) {
            return res.json({
              price: Number(customPricing.price),
              range: standardResult?.range || null,
              isPromotional: true,
              description: customPricing.description || "Preço Especial",
            });
          }
        }
      }

      if (!standardResult) return res.json({ price: null, range: null });
      res.json(standardResult);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/pricing-ranges", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!["admin", "financeiro"].includes(user?.role ?? "")) return res.status(403).json({ error: "Sem permissão" });
      const range = await storage.createPricingRange(req.body);
      res.status(201).json(range);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.patch("/api/pricing-ranges/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!["admin", "financeiro"].includes(user?.role ?? "")) return res.status(403).json({ error: "Sem permissão" });
      const range = await storage.updatePricingRange((req.params.id as string), req.body);
      if (!range) return res.status(404).json({ error: "Faixa não encontrada" });
      res.json(range);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/pricing-ranges/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!["admin", "financeiro"].includes(user?.role ?? "")) return res.status(403).json({ error: "Sem permissão" });
      await storage.deletePricingRange((req.params.id as string));
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── CLIENT PRICING (Preço Promocional) ────────────────────────────
  app.get("/api/client-pricing", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!["admin", "financeiro"].includes(user?.role ?? "")) return res.status(403).json({ error: "Sem permissão" });
      const list = await storage.getAllClientPricing();
      res.json(list);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/client-pricing/:clientId", requireAuth, async (req, res) => {
    try {
      const cp = await storage.getClientPricing((req.params.clientId as string));
      res.json(cp || null);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/client-pricing", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!["admin", "financeiro"].includes(user?.role ?? "")) return res.status(403).json({ error: "Sem permissão" });
      const cp = await storage.setClientPricing(req.body);
      res.status(201).json(cp);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/client-pricing/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!["admin", "financeiro"].includes(user?.role ?? "")) return res.status(403).json({ error: "Sem permissão" });
      await storage.deleteClientPricing((req.params.id as string));
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── FINANCIAL STATS ────────────────────────────────────────────────
  app.get("/api/stats/financial", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!["admin", "financeiro"].includes(user?.role || "")) return res.status(403).json({ error: "Sem permissão" });
      const stats = await storage.getFinancialStats();
      res.json(stats);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/stats/financial/projects", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!["admin", "financeiro"].includes(user?.role || "")) return res.status(403).json({ error: "Sem permissão" });
      const filter = req.query.filter as string;
      if (!["today", "month", "paid", "pending"].includes(filter)) return res.status(400).json({ error: "Filtro inválido" });
      const list = await storage.getFinancialProjects(filter as any);
      res.json(list);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── CHAT ────────────────────────────────────────────────────────────
  app.get("/api/projects/:id/chat", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: "Não autenticado" });
      const isAdmin = ["admin", "engenharia", "financeiro", "tecnico"].includes(user.role);
      if (!isAdmin) {
        const project = await storage.getProject((req.params.id as string));
        if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
        const client = await storage.getClientByUserId(user.id);
        if (!client || project.clientId !== client.id) return res.status(403).json({ error: "Sem permissão" });
      }
      const messages = await storage.getChatMessages((req.params.id as string));
      await storage.markChatMessagesRead((req.params.id as string), isAdmin ? "admin" : "integrador");
      res.json(messages);
    } catch { res.status(500).json({ error: "Erro ao buscar mensagens" }); }
  });

  app.post("/api/projects/:id/chat", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Não autenticado" });
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Mensagem vazia" });

    const project = await storage.getProject((req.params.id as string));
    if (!project) return res.status(404).json({ error: "Projeto não encontrado" });

    const isAdmin = ["admin", "engenharia", "financeiro"].includes(user.role);
    const projectIntegradorId = project.client?.userId;
    if (!isAdmin && projectIntegradorId !== user.id) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    const msg = await storage.createChatMessage({
      projectId: (req.params.id as string),
      senderId: user.id,
      senderName: user.name || user.username,
      senderRole: user.role,
      content: content.trim(),
      readByAdmin: isAdmin,
      readByIntegrador: !isAdmin,
    });

    const wsEvent = { type: "chat_message", projectId: (req.params.id as string), message: msg };
    if (projectIntegradorId) {
      broadcastToProjectParticipants(projectIntegradorId, wsEvent);
    } else {
      broadcastToAdmins(wsEvent);
    }

    // Notification for admin when integrador sends a message
    if (!isAdmin) {
      storage.createNotification({
        type: "message",
        title: `Nova mensagem de integrador`,
        body: `${user.name || user.username} enviou uma mensagem no projeto ${project.ticketNumber || project.title}: "${content.trim().slice(0, 80)}${content.trim().length > 80 ? "…" : ""}"`,
        projectId: project.id,
        projectTitle: project.title,
        ticketNumber: project.ticketNumber,
      }).catch(() => {});
    }

    res.json(msg);
  });

  app.get("/api/chat/unread", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Não autenticado" });
    const count = await storage.getUnreadChatCount(user.id, user.role);
    res.json({ count });
  });

  // ── AI — SOLAR ENGINEERING ─────────────────────────────────────────

  // GET /api/ai/equipment — lista painéis e inversores
  app.get("/api/ai/equipment", requireAuth, async (_req, res) => {
    const [panels, inverters] = await Promise.all([
      storage.getSolarPanels(),
      storage.getSolarInverters(),
    ]);
    res.json({ panels, inverters });
  });

  // GET /api/ai/irradiation — lista de irradiação
  app.get("/api/ai/irradiation", requireAuth, async (_req, res) => {
    res.json(await storage.getSolarIrradiation());
  });

  // POST /api/ai/analyze-bill — análise de consumo e dimensionamento
  app.post("/api/ai/analyze-bill", requireAuth, async (req, res) => {
    try {
      const result = analyzeEnergyBill(req.body);
      res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  // POST /api/ai/size-system — dimensionar sistema dado consumo e localização
  app.post("/api/ai/size-system", requireAuth, async (req, res) => {
    try {
      const { monthlyConsumptionKwh, city, state, panelPowerW } = req.body;
      if (!monthlyConsumptionKwh) return res.status(400).json({ error: "monthlyConsumptionKwh é obrigatório" });
      const [irradiationData, panels, inverters] = await Promise.all([
        storage.getSolarIrradiation(),
        storage.getSolarPanels(),
        storage.getSolarInverters(),
      ]);
      const result = dimensionSystem({
        monthlyConsumptionKwh: Number(monthlyConsumptionKwh),
        city: city ?? "",
        state: state ?? "",
        irradiationData,
        availablePanels: panels,
        availableInverters: inverters,
      });
      res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  // GET /api/ai/simulate-production — simulação mensal
  app.get("/api/ai/simulate-production", requireAuth, (req, res) => {
    try {
      const kwp = parseFloat(req.query.kwp as string || "5");
      const irr = parseFloat(req.query.irradiation as string || "4.5");
      const eff = parseFloat(req.query.efficiency as string || "0.78");
      const result = simulateProduction({ systemKwp: kwp, irradiationKwhM2Day: irr, systemEfficiency: eff });
      res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  // POST /api/ai/generate-memorial — gera memorial descritivo
  app.post("/api/ai/generate-memorial", requireAuth, async (req, res) => {
    try {
      const { projectId, format = "text", ...extra } = req.body;
      if (!projectId) return res.status(400).json({ error: "projectId é obrigatório" });
      const project = await storage.getProject(projectId as string);
      if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
      const result = generateMemorial({ project, ...extra });
      if (format === "html") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(result.html);
      }
      res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  // POST /api/ai/generate-unifilar — gera SVG do diagrama unifilar
  app.post("/api/ai/generate-unifilar", requireAuth, (req, res) => {
    try {
      const result = generateUnifilarSvg(req.body);
      if (req.body.format === "svg") {
        res.setHeader("Content-Type", "image/svg+xml");
        return res.send(result.svg);
      }
      res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  // POST /api/ai/smart-create — pipeline completo após criar projeto
  app.post("/api/ai/smart-create", requireAuth, async (req, res) => {
    try {
      const { projectId } = req.body;
      if (!projectId) return res.status(400).json({ error: "projectId é obrigatório" });
      const project = await storage.getProject(projectId as string);
      if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
      const [irradiationData, panels, inverters] = await Promise.all([
        storage.getSolarIrradiation(),
        storage.getSolarPanels(),
        storage.getSolarInverters(),
      ]);
      const city = project.cidade ?? "";
      const state = project.estado ?? "";
      const kwp = parseFloat(String(project.potencia ?? 0));
      const monthlyKwh = kwp > 0 ? Math.round(kwp * 4.5 * 30 * 0.78) : 400;
      const dimensioning = dimensionSystem({
        monthlyConsumptionKwh: monthlyKwh,
        city,
        state,
        irradiationData,
        availablePanels: panels,
        availableInverters: inverters,
      });
      const memorial = generateMemorial({
        project,
        panelBrand: dimensioning.suggestedPanel?.brand,
        panelModel: dimensioning.suggestedPanel?.model,
        panelPowerW: dimensioning.suggestedPanel?.powerW,
        panelsCount: dimensioning.panelsNeeded,
        inverterBrand: dimensioning.suggestedInverter?.brand,
        inverterModel: dimensioning.suggestedInverter?.model,
        inverterPowerKw: dimensioning.suggestedInverter ? parseFloat(String(dimensioning.suggestedInverter.powerKw)) : undefined,
        systemKwp: dimensioning.kwp,
        monthlyGenerationKwh: dimensioning.monthlyGenerationKwh,
        annualGenerationKwh: dimensioning.annualGenerationKwh,
        irradiationKwhM2Day: dimensioning.irradiationUsed,
        phase: dimensioning.phase,
      });
      const unifilar = generateUnifilarSvg({
        panelsCount: dimensioning.panelsNeeded,
        inverterModel: dimensioning.suggestedInverter?.model,
        inverterPowerKw: dimensioning.suggestedInverter ? parseFloat(String(dimensioning.suggestedInverter.powerKw)) : undefined,
        phases: dimensioning.phase === "mono" ? 1 : dimensioning.phase === "bi" ? 2 : 3,
        projectTitle: project.title,
        ticketNumber: project.ticketNumber ?? undefined,
      });
      res.json({ dimensioning, memorial, unifilar });
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });

  // CRUD painéis (admin)
  app.post("/api/ai/panels", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
    const panel = await storage.createSolarPanel(req.body);
    res.status(201).json(panel);
  });
  app.patch("/api/ai/panels/:id", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
    const p = await storage.updateSolarPanel((req.params.id as string), req.body);
    if (!p) return res.status(404).json({ error: "Não encontrado" });
    res.json(p);
  });
  app.delete("/api/ai/panels/:id", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
    await storage.deleteSolarPanel((req.params.id as string));
    res.status(204).send();
  });

  // CRUD inversores (admin)
  app.post("/api/ai/inverters", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
    const inv = await storage.createSolarInverter(req.body);
    res.status(201).json(inv);
  });
  app.patch("/api/ai/inverters/:id", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
    const i = await storage.updateSolarInverter((req.params.id as string), req.body);
    if (!i) return res.status(404).json({ error: "Não encontrado" });
    res.json(i);
  });
  app.delete("/api/ai/inverters/:id", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (user?.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
    await storage.deleteSolarInverter((req.params.id as string));
    res.status(204).send();
  });

  // ── DOWNLOAD TEMPORÁRIO ────────────────────────────────────────────
  app.get("/api/download-source", async (req, res) => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = "/tmp/randoli-solar-source.tar.gz";
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Arquivo não encontrado. Peça ao agente para recriar." });
    }
    res.setHeader("Content-Disposition", "attachment; filename=randoli-solar.tar.gz");
    res.setHeader("Content-Type", "application/gzip");
    res.sendFile(filePath);
  });

  // ─── NFS-e ROUTES ────────────────────────────────────────────────────
  app.get("/api/nfse/notas", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user || !["admin", "financeiro"].includes(user.role)) return res.status(403).json({ error: "Sem permissão" });
    const notas = await storage.getNfseNotas();
    res.json(notas);
  });

  app.get("/api/nfse/notas/projeto/:projectId", requireAuth, async (req, res) => {
    const notas = await storage.getNfseNotasByProject(req.params.projectId);
    res.json(notas);
  });

  app.post("/api/nfse/emitir/:projectId", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user || !["admin", "financeiro"].includes(user.role)) return res.status(403).json({ error: "Sem permissão" });
    try {
      const project = await storage.getProject(req.params.projectId);
      if (!project) return res.status(404).json({ error: "Projeto não encontrado" });

      const settingsMap = await getSettingsMap();
      const config = getNfseConfig(settingsMap);
      if (!config) return res.status(400).json({ error: "NFS-e não está habilitada ou não configurada." });

      const proximoDps = config.proximoDps;
      const client = project.client;

      const nota = await storage.createNfseNota({
        projectId: project.id,
        numeroRps: String(proximoDps),
        serieRps: config.serie,
        status: "pendente",
        valor: project.valor || "0",
        tomadorNome: client?.name || req.body.tomadorNome || "",
        tomadorCpfCnpj: client?.cpfCnpj || req.body.tomadorCpfCnpj || "",
      });

      const result = await emitirNfse({
        config,
        numeroDps: String(proximoDps),
        valor: project.valor || "0",
        tomadorNome: client?.name || req.body.tomadorNome || "",
        tomadorCpfCnpj: client?.cpfCnpj || req.body.tomadorCpfCnpj || "",
        tomadorEmail: client?.email || undefined,
        tomadorLogradouro: client?.rua || undefined,
        tomadorNumero: client?.numero || undefined,
        tomadorBairro: client?.bairro || undefined,
        tomadorCep: client?.cep || undefined,
        tomadorCidade: client?.cidade || undefined,
        tomadorUf: client?.estado || undefined,
        descricaoServico: req.body.descricaoServico || config.descricaoServico,
      });

      if (result.success) {
        await storage.updateNfseNota(nota.id, {
          status: "emitida",
          numeroNota: result.numeroNota,
          codigoVerificacao: result.codigoVerificacao,
          linkNota: result.linkNota,
          xmlContent: result.xmlContent,
          emitidoEm: new Date(),
          errorMessage: undefined,
        });
        await storage.setSiteSetting("nfse_proximo_dps", String(proximoDps + 1));
        await storage.addTimelineEntry({
          projectId: project.id,
          event: "NFS-e emitida",
          details: `NFS-e nº ${result.numeroNota || "–"} emitida com sucesso. Código de verificação: ${result.codigoVerificacao || "–"}`,
          createdByRole: "admin",
        });
        return res.json({ success: true, nota: await storage.getNfseNota(nota.id) });
      } else {
        await storage.updateNfseNota(nota.id, { status: "erro", errorMessage: result.error });
        return res.status(400).json({ success: false, error: result.error, nota });
      }
    } catch (err: any) {
      console.error("[nfse] Erro:", err);
      res.status(500).json({ error: err?.message || "Erro interno ao emitir NFS-e" });
    }
  });

  app.post("/api/nfse/reemitir/:notaId", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user || !["admin", "financeiro"].includes(user.role)) return res.status(403).json({ error: "Sem permissão" });
    try {
      const nota = await storage.getNfseNota(req.params.notaId);
      if (!nota) return res.status(404).json({ error: "Nota não encontrada" });
      if (!nota.projectId) return res.status(400).json({ error: "Nota sem projeto associado" });

      const project = await storage.getProject(nota.projectId);
      if (!project) return res.status(404).json({ error: "Projeto não encontrado" });

      const settingsMap = await getSettingsMap();
      const config = getNfseConfig(settingsMap);
      if (!config) return res.status(400).json({ error: "NFS-e não configurada." });

      const client = project.client;
      await storage.updateNfseNota(nota.id, { status: "pendente", errorMessage: undefined });

      const result = await emitirNfse({
        config,
        numeroDps: nota.numeroRps,
        valor: nota.valor || project.valor || "0",
        tomadorNome: nota.tomadorNome || client?.name || "",
        tomadorCpfCnpj: nota.tomadorCpfCnpj || client?.cpfCnpj || "",
        tomadorEmail: client?.email || undefined,
        tomadorLogradouro: client?.rua || undefined,
        tomadorNumero: client?.numero || undefined,
        tomadorBairro: client?.bairro || undefined,
        tomadorCep: client?.cep || undefined,
        tomadorCidade: client?.cidade || undefined,
        tomadorUf: client?.estado || undefined,
        descricaoServico: config.descricaoServico,
      });

      if (result.success) {
        await storage.updateNfseNota(nota.id, {
          status: "emitida",
          numeroNota: result.numeroNota,
          codigoVerificacao: result.codigoVerificacao,
          linkNota: result.linkNota,
          xmlContent: result.xmlContent,
          emitidoEm: new Date(),
          errorMessage: undefined,
        });
        await storage.setSiteSetting("nfse_proximo_dps", String(config.proximoDps + 1));
        await storage.addTimelineEntry({
          projectId: nota.projectId,
          event: "NFS-e re-emitida",
          details: `NFS-e nº ${result.numeroNota || "–"} re-emitida com sucesso.`,
          createdByRole: "admin",
        });
        return res.json({ success: true, nota: await storage.getNfseNota(nota.id) });
      } else {
        await storage.updateNfseNota(nota.id, { status: "erro", errorMessage: result.error });
        return res.status(400).json({ success: false, error: result.error });
      }
    } catch (err: any) {
      console.error("[nfse] Erro na re-emissão:", err);
      res.status(500).json({ error: err?.message || "Erro interno ao re-emitir NFS-e" });
    }
  });

  app.post("/api/nfse/cancelar/:notaId", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
    const nota = await storage.getNfseNota(req.params.notaId);
    if (!nota) return res.status(404).json({ error: "Nota não encontrada" });
    await storage.updateNfseNota(nota.id, { status: "cancelada" });
    res.json({ success: true });
  });

  app.delete("/api/nfse/notas/:notaId", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
    await storage.deleteNfseNota(req.params.notaId);
    res.json({ success: true });
  });

  app.post("/api/nfse/upload-certificado", requireAuth, (req, res, next) => {
    memUpload.single("certificado")(req, res, (err: any) => {
      if (err) {
        console.error("[nfse] upload error:", err.message);
        return res.status(400).json({ error: err.message || "Erro no upload do arquivo" });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
      if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado. Selecione um arquivo .pfx primeiro." });
      const base64 = req.file.buffer.toString("base64");
      await storage.setSiteSetting("nfse_certificado_pfx", base64);
      console.log(`[nfse] certificado uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
      res.json({ success: true, size: req.file.size, originalname: req.file.originalname });
    } catch (err: any) {
      console.error("[nfse] upload processing error:", err);
      res.status(500).json({ error: "Erro ao processar certificado: " + (err.message || "erro interno") });
    }
  });

  app.post("/api/nfse/testar-conexao", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Sem permissão" });
    const settingsMap = await getSettingsMap();
    if (settingsMap["nfse_enabled"] !== "true") {
      return res.json({ success: false, error: "NFS-e não está habilitada. Ative o switch 'Habilitar emissão de NFS-e' e salve antes de testar." });
    }
    const config = getNfseConfig(settingsMap);
    if (!config) return res.json({ success: false, error: "NFS-e não configurada corretamente." });
    const missing: string[] = [];
    if (!config.cnpjPrestador) missing.push("CNPJ do Prestador");
    if (!config.inscricaoMunicipal) missing.push("Inscrição Municipal");
    if (!config.certificadoPfxBase64) missing.push("Certificado Digital (.pfx)");
    if (!config.certificadoSenha) missing.push("Senha do Certificado");
    if (missing.length > 0) {
      return res.json({ success: false, error: `Campos obrigatórios faltando: ${missing.join(", ")}` });
    }

    try {
      const testResult = await emitirNfse({
        config,
        numeroDps: "99999",
        valor: "1.00",
        tomadorNome: "EMPRESA TESTE LTDA",
        tomadorCpfCnpj: "33000167000101",
        tomadorCodigoMunicipio: config.municipioCodigo || "5107909",
        tomadorCep: config.cep || "78550000",
        tomadorLogradouro: "RUA TESTE",
        tomadorNumero: "100",
        tomadorBairro: "CENTRO",
        descricaoServico: config.descricaoServico || "Teste de conexao com o webservice NFS-e",
      });

      const wsUrl = config.webserviceUrl || (config.ambiente === "producao" ? `https://gp.srv.br/tributario/${config.municipioNome || "sinop"}/anfse_ws` : `https://coplan.inf.br/tributario/${config.municipioNome || "sinop"}/anfse_ws`);
      if (testResult.success) {
        res.json({
          success: true,
          message: `Conexão OK! NFS-e teste gerada com sucesso (nº ${testResult.numeroNota || "–"}). Ambiente: ${config.ambiente}. URL: ${wsUrl}.`,
          xmlResponse: testResult.xmlContent?.slice(0, 5000),
        });
      } else {
        const errorStr = testResult.error || "";
        const onlyTestErrors = /^(E39|E47|E52|E242|E243)\b/;
        const errorCodes = errorStr.split("; ").map(e => e.trim());
        const allTestOnly = errorCodes.every(e => onlyTestErrors.test(e));

        if (allTestOnly) {
          res.json({
            success: true,
            message: `Configuração OK! A conexão SOAP, certificado digital e códigos tributários estão corretos. Os erros abaixo são esperados no teste (dados fictícios do tomador) e não ocorrerão na emissão real. Ambiente: ${config.ambiente}. URL: ${wsUrl}. CNPJ: ${config.cnpjPrestador}, IM: ${config.inscricaoMunicipal}.`,
            testErrors: errorStr,
            xmlResponse: testResult.xmlContent?.slice(0, 5000),
          });
        } else {
          res.json({
            success: false,
            error: `Webservice respondeu com erro: ${errorStr}`,
            message: `A conexão funcionou, mas há erros de configuração. Ambiente: ${config.ambiente}. URL: ${wsUrl}. CNPJ: ${config.cnpjPrestador}, IM: ${config.inscricaoMunicipal}. Certificado: ${Math.round(config.certificadoPfxBase64.length * 0.75 / 1024)}KB.`,
            xmlResponse: testResult.xmlContent?.slice(0, 5000),
          });
        }
      }
    } catch (err: any) {
      res.json({
        success: false,
        error: `Erro ao conectar ao webservice: ${err?.message || "Erro desconhecido"}. Verifique a URL e o certificado digital.`,
      });
    }
  });

  return httpServer;
}
