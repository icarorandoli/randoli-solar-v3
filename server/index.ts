import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupWebSocket } from "./websocket";
import { seedDatabase } from "./seed";

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);
  setupWebSocket(httpServer);
  await seedDatabase();

  try {
    const { pool: dbPool } = await import("./db");
    await dbPool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_gateway TEXT`);
    console.log("[migration] payment_gateway column ensured");
    await dbPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
    console.log("[migration] avatar_url column ensured");
    await dbPool.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_user_ids TEXT`);
    console.log("[migration] target_user_ids column ensured");

    // Tabela de templates de termos
    await dbPool.query(`CREATE TABLE IF NOT EXISTS term_templates (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL DEFAULT 'prestacao_servicos',
      title TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT '1.0',
      content TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log("[migration] term_templates table ensured");

    // Tabela de aceites por projeto
    await dbPool.query(`CREATE TABLE IF NOT EXISTS project_term_acceptances (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id VARCHAR NOT NULL,
      user_id VARCHAR NOT NULL,
      integrator_name TEXT NOT NULL,
      integrator_document TEXT,
      integrator_email TEXT,
      project_value TEXT,
      payment_method TEXT NOT NULL DEFAULT 'PIX',
      term_version TEXT NOT NULL,
      term_title TEXT NOT NULL,
      term_content TEXT NOT NULL,
      term_hash TEXT NOT NULL,
      checkbox_label TEXT NOT NULL,
      accepted_at TIMESTAMP DEFAULT NOW(),
      accepted_ip TEXT,
      accepted_user_agent TEXT,
      status TEXT NOT NULL DEFAULT 'accepted',
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log("[migration] project_term_acceptances table ensured");

    // Seed do termo padrão se não existir
    const termCheck = await dbPool.query("SELECT id FROM term_templates WHERE code = 'prestacao_servicos' AND active = true LIMIT 1");
    if (termCheck.rows.length === 0) {
      await dbPool.query(`INSERT INTO term_templates (title, version, content, active) VALUES ($1, $2, $3, true)`, [
        "Termo de Aceite de Prestação de Serviços Técnicos",
        "1.0",
        `📄 TERMO DE ACEITE DE PRESTAÇÃO DE SERVIÇOS TÉCNICOS

VERSÃO 1.0

Pelo presente instrumento eletrônico, as partes abaixo identificadas:

CONTRATADA: Randoli Solar Sinop, pessoa jurídica devidamente constituída, com sede em Sinop/MT;

CONTRATANTE (INTEGRADOR): {{integrator_name}}, inscrito sob CPF/CNPJ nº {{integrator_document}};

têm entre si justo e acordado o presente Termo de Aceite de Prestação de Serviços Técnicos, que se regerá pelas cláusulas e condições a seguir:

1. OBJETO

O presente termo tem por objeto a prestação de serviços técnicos especializados, consistentes na elaboração, análise, adequação, aprovação e/ou homologação de projeto fotovoltaico cadastrado na plataforma da CONTRATADA.

2. VINCULAÇÃO AO PROJETO

O presente aceite está diretamente vinculado ao seguinte projeto:

Nome do Projeto: {{project_name}}
Identificação: {{ticket_number}}
Valor do Serviço: R$ {{project_value}}
Forma de Pagamento: PIX

O CONTRATANTE reconhece que o envio do projeto por meio da plataforma configura solicitação formal da prestação dos serviços descritos neste termo.

3. CONDIÇÕES DE PAGAMENTO

O CONTRATANTE concorda que:

I. O valor do serviço será cobrado conforme informado na plataforma ou previamente acordado;
II. O pagamento será realizado exclusivamente via PIX;
III. A CONTRATADA poderá, a seu critério, condicionar a continuidade dos serviços, liberação de documentos, entrega final do projeto ou qualquer etapa operacional à confirmação do pagamento;
IV. O não pagamento poderá resultar na suspensão do serviço e bloqueio de acesso aos documentos e funcionalidades relacionadas ao projeto.

4. OBRIGAÇÕES DO CONTRATANTE

O CONTRATANTE declara e se compromete a:

I. Fornecer informações corretas, completas e atualizadas;
II. Responsabilizar-se pela veracidade dos dados inseridos na plataforma;
III. Efetuar o pagamento nos termos acordados;
IV. Reconhecer que a execução dos serviços depende das informações fornecidas.

5. INADIMPLEMENTO

Em caso de inadimplemento, o CONTRATANTE fica ciente de que:

I. Poderá ser realizada cobrança judicial e/ou extrajudicial;
II. Poderão ser aplicados encargos legais, incluindo juros, multa e correção monetária;
III. O débito poderá ser levado a protesto em cartório e/ou negativação nos órgãos de proteção ao crédito, conforme legislação vigente.

6. ACEITE ELETRÔNICO E VALIDADE JURÍDICA

O CONTRATANTE declara que:

I. Leu integralmente o presente termo;
II. Compreendeu e concorda com todas as cláusulas;
III. O aceite realizado por meio eletrônico possui plena validade jurídica, equivalendo à assinatura física, nos termos da legislação brasileira aplicável;
IV. Este aceite fica registrado com data, hora, endereço IP e demais informações técnicas, sendo passível de utilização como prova em eventuais demandas administrativas ou judiciais.

7. REGISTRO E COMPROVAÇÃO

O presente aceite será registrado eletronicamente, contendo, entre outros:

- Data e hora do aceite
- Endereço IP
- Identificação do usuário
- Dados do projeto
- Conteúdo integral do termo aceito

Tais informações poderão ser utilizadas como comprovação da contratação e concordância com os termos.

8. FORO

Fica eleito o foro da comarca de Sinop/MT, com renúncia de qualquer outro, por mais privilegiado que seja, para dirimir eventuais controvérsias oriundas deste termo.

9. DISPOSIÇÕES FINAIS

I. Este termo passa a produzir efeitos a partir do aceite eletrônico;
II. O não exercício de qualquer direito não implicará renúncia;
III. Eventuais alterações neste termo não afetarão os aceites já realizados, permanecendo válidas as condições vigentes à época da aceitação.

📌 DECLARAÇÃO FINAL

Ao marcar o aceite e concluir o envio do projeto, o CONTRATANTE declara que:

✔ Leu e concorda com todos os termos
✔ Reconhece a obrigação de pagamento
✔ Autoriza a cobrança pelos serviços prestados
✔ Está ciente que o pagamento será realizado via PIX

📅 DADOS DO ACEITE
Integrador: {{integrator_name}}
Documento: {{integrator_document}}
Projeto: {{project_name}}
ID do Projeto: {{ticket_number}}
Valor: R$ {{project_value}}
Forma de pagamento: PIX
Data/Hora: {{accepted_at}}`
      ]);
      console.log("[migration] termo padrão criado");
    }
    await dbPool.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cliente'`).catch(() => {});
    console.log("[migration] cliente role ensured");
  } catch (migErr: any) {
    console.warn("[migration] Could not ensure migrations:", migErr.message);
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
