import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { db, pool } from "./db";
import { projects, statusConfigs, siteSettings } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

async function getOpenAIKey(): Promise<string | undefined> {
  const rows = await db.select().from(siteSettings)
    .where(eq(siteSettings.key, "ai_openai_key"));
  return rows[0]?.value || undefined;
}

function makeOpenAIClient(customKey?: string): OpenAI {
  if (customKey) return new OpenAI({ apiKey: customKey });
  if (process.env.OPENAI_API_KEY) return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

async function buildProjectContext(): Promise<string> {
  const [allProjects, statusCfgs] = await Promise.all([
    db.select({
      id: projects.id,
      ticketNumber: projects.ticketNumber,
      title: projects.title,
      status: projects.status,
      potencia: projects.potencia,
      valor: projects.valor,
      concessionaria: projects.concessionaria,
      nomeCliente: projects.nomeCliente,
      updatedAt: projects.updatedAt,
    }).from(projects).orderBy(desc(projects.updatedAt)).limit(100),
    db.select().from(statusConfigs),
  ]);
  const statusMap = Object.fromEntries(statusCfgs.map(s => [s.key, s.label]));
  const lines = allProjects.map(p =>
    `- [${p.ticketNumber || p.id.slice(0,8)}] ${p.title} | Cliente: ${p.nomeCliente || "?"} | Status: ${statusMap[p.status] || p.status} | Potência: ${p.potencia || "?"}kWp | Valor: R$${p.valor || "?"} | Conc: ${p.concessionaria || "?"} | Atualizado: ${p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("pt-BR") : "?"}`
  );
  return `PROJETOS DO SISTEMA (${allProjects.length} registros):\n${lines.join("\n")}`;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!(req.session as any)?.userId) return res.status(401).json({ error: "Não autenticado" });
  next();
}

export function registerAssistantRoutes(app: Express) {
  // Criar tabelas se não existirem
  pool.query(`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      title TEXT NOT NULL DEFAULT 'Nova conversa',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ai_messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `).catch(e => console.warn("[assistant] table init:", e.message));

  app.get("/api/assistant/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const result = await pool.query(
        "SELECT * FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC",
        [userId]
      );
      res.json(result.rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/assistant/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const title = req.body.title || "Nova conversa";
      const result = await pool.query(
        "INSERT INTO ai_conversations (user_id, title) VALUES ($1, $2) RETURNING *",
        [userId, title]
      );
      res.json(result.rows[0]);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete("/api/assistant/conversations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await pool.query("DELETE FROM ai_messages WHERE conversation_id = $1", [req.params.id]);
      await pool.query("DELETE FROM ai_conversations WHERE id = $1", [req.params.id]);
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/assistant/conversations/:id/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        "SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/assistant/chat", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const { message, conversationId } = req.body;
      if (!message) return res.status(400).json({ error: "Mensagem obrigatória" });

      let convId = conversationId;
      if (!convId) {
        const title = message.slice(0, 50);
        const conv = await pool.query(
          "INSERT INTO ai_conversations (user_id, title) VALUES ($1, $2) RETURNING *",
          [userId, title]
        );
        convId = conv.rows[0].id;
      }

      await pool.query(
        "INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, $2, $3)",
        [convId, "user", message]
      );

      const histResult = await pool.query(
        "SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [convId]
      );
      const history = histResult.rows;

      const projectContext = await buildProjectContext();
      const systemPrompt = `Você é a Lumi, assistente inteligente da Randoli Solar. Você tem acesso aos dados dos projetos de homologação solar e pode responder perguntas sobre projetos, status, clientes e pagamentos.

${projectContext}

Responda de forma clara, objetiva e em português. Use os dados acima para responder perguntas específicas sobre projetos.`;

      const openaiKey = await getOpenAIKey();
      const openai = makeOpenAIClient(openaiKey);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...history.slice(-20).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        stream: true,
        max_tokens: 1000,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      await pool.query(
        "INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, $2, $3)",
        [convId, "assistant", fullResponse]
      );

      await pool.query(
        "UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1",
        [convId]
      );

      res.write(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error("[assistant] erro:", err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
      else { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); res.end(); }
    }
  });
}
