import https from "https";
import { URL } from "url";

export interface InterConfig {
  clientId: string;
  clientSecret: string;
  certificate: string;
  privateKey: string;
  pixKey: string;
  environment: "sandbox" | "production";
}

const BASE_URLS = {
  production: "https://cdpj.partners.bancointer.com.br",
  sandbox: "https://cdpj-sandbox.partners.uatinter.co",
};

const BOLEPIX_SCOPES = "boleto-cobranca.write";

interface TokenCache {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, TokenCache>();

export function cleanPem(pem: string): string {
  const lines = pem.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  return lines.join("\n") + "\n";
}

function httpsRequest(
  baseUrl: string,
  path: string,
  method: string,
  cert: string,
  key: string,
  headers: Record<string, string>,
  body?: string
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(baseUrl + path);
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method,
      cert: cleanPem(cert),
      key: cleanPem(key),
      rejectUnauthorized: true,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...(body ? { "Content-Length": Buffer.byteLength(body).toString() } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode || 0, data: raw ? JSON.parse(raw) : {} });
        } catch {
          resolve({ status: res.statusCode || 0, data: raw });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function requestToken(
  config: InterConfig,
  scope: string
): Promise<{ status: number; data: any }> {
  const baseUrl = BASE_URLS[config.environment];
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "client_credentials",
    scope,
  }).toString();

  const cert = cleanPem(config.certificate);
  const key = cleanPem(config.privateKey);
  const parsed = new URL(baseUrl + "/oauth/v2/token");

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname,
      method: "POST",
      cert,
      key,
      rejectUnauthorized: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body).toString(),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode || 0, data: raw });
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function getAccessToken(config: InterConfig): Promise<string> {
  const cacheKey = `${config.environment}:${config.clientId}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt - 30_000) {
    return cached.token;
  }

  const result = await requestToken(config, BOLEPIX_SCOPES);

  if (result.status !== 200 || !result.data.access_token) {
    console.error("[inter] Token error:", result.status, result.data);
    throw new Error(
      `Inter OAuth falhou (scope="${BOLEPIX_SCOPES}"): ${result.status} — ${JSON.stringify(result.data)}`
    );
  }

  const expiresIn = result.data.expires_in || 3600;
  tokenCache.set(cacheKey, {
    token: result.data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  });

  console.log("[inter] Token OK. Scope:", result.data.scope);
  return result.data.access_token;
}

export interface InterPixResult {
  txid: string;
  pixCopiaECola: string;
  qrCodeBase64: string;
  status: string;
}

function futureDateISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function createInterPixCharge({
  config,
  projectId,
  projectTitle,
  ticketNumber,
  valor,
  integradorName,
  integradorCpfCnpj,
}: {
  config: InterConfig;
  projectId: string;
  projectTitle: string;
  ticketNumber: string | null;
  valor: string;
  integradorName?: string;
  integradorCpfCnpj?: string;
}): Promise<InterPixResult> {
  const numericValue = parseFloat(valor.replace(/\./g, "").replace(",", "."));
  if (isNaN(numericValue) || numericValue <= 0) {
    throw new Error("Valor inválido para cobrança Inter");
  }

  const token = await getAccessToken(config);
  const baseUrl = BASE_URLS[config.environment];
  const ticket = ticketNumber || projectId.slice(0, 8).toUpperCase();
  const seuNumero = ticket.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15);

  const pagador: Record<string, string> = {
    nome: (integradorName || "Integrador Solar").slice(0, 100),
  };
  if (integradorCpfCnpj) {
    pagador.cpfCnpj = integradorCpfCnpj.replace(/\D/g, "");
  }

  const cobBody = JSON.stringify({
    seuNumero,
    valorNominal: numericValue,
    dataVencimento: futureDateISO(30),
    pagador,
    mensagem: {
      linha1: `Projeto Solar: ${projectTitle}`.slice(0, 70),
      linha2: `Ticket: ${ticket}`.slice(0, 70),
    },
  });

  const cobRes = await httpsRequest(
    baseUrl,
    "/cobranca-bolepix/v3/cobrancas",
    "POST",
    config.certificate,
    config.privateKey,
    { Authorization: `Bearer ${token}` },
    cobBody
  );

  if (cobRes.status !== 200 && cobRes.status !== 201) {
    console.error("[inter] Bolepix error:", cobRes.status, cobRes.data);
    throw new Error(`Inter cobrança falhou: ${cobRes.status} — ${JSON.stringify(cobRes.data)}`);
  }

  const d = cobRes.data;
  const nossoNumero: string = d.nossoNumero || seuNumero;
  const pixCopiaECola: string = d.pixCopiaECola || d.qrCode || d.pix?.pixCopiaECola || "";
  const qrCodeBase64: string = d.imagemQrcode || d.qrCodeBase64 || "";

  console.log("[inter] ✓ Cobrança criada. nossoNumero:", nossoNumero);

  return {
    txid: nossoNumero,
    pixCopiaECola,
    qrCodeBase64,
    status: d.situacao || "EMITIDO",
  };
}

export async function getInterPixStatus(
  config: InterConfig,
  txid: string
): Promise<{ status: string; paidAt?: string }> {
  const token = await getAccessToken(config);
  const baseUrl = BASE_URLS[config.environment];

  const res = await httpsRequest(
    baseUrl,
    `/cobranca-bolepix/v3/cobrancas/${txid}`,
    "GET",
    config.certificate,
    config.privateKey,
    { Authorization: `Bearer ${token}` }
  );

  if (res.status !== 200) {
    throw new Error(`Inter status check falhou: ${res.status}`);
  }

  const situacao: string = res.data.situacao || res.data.status || "EMITIDO";
  const paidAt: string | undefined = res.data.dataPagamento || res.data.pix?.[0]?.horario;

  return { status: situacao, paidAt };
}

export async function testInterConnection(
  config: InterConfig
): Promise<{ ok: boolean; message: string; scope?: string }> {
  try {
    tokenCache.delete(`${config.environment}:${config.clientId}`);
    const result = await requestToken(config, BOLEPIX_SCOPES);

    if (result.status !== 200 || !result.data.access_token) {
      const errBody = JSON.stringify(result.data);
      return {
        ok: false,
        message: `Inter OAuth falhou: ${result.status} — ${errBody}`,
      };
    }

    const scope: string = result.data.scope || "";
    const hasWrite = scope.includes("boleto-cobranca.write");

    if (!hasWrite) {
      return {
        ok: false,
        message:
          `Autenticação ok (scope: "${scope}"), mas o escopo "boleto-cobranca.write" é necessário.\n` +
          `Verifique as permissões da integração em developers.inter.co.`,
        scope,
      };
    }

    const expiresIn = result.data.expires_in || 3600;
    tokenCache.set(`${config.environment}:${config.clientId}`, {
      token: result.data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    });

    return {
      ok: true,
      message: `Conexão com Banco Inter OK! Escopos: ${scope}`,
      scope,
    };
  } catch (err: any) {
    return { ok: false, message: err.message || "Falha na conexão com o Banco Inter." };
  }
}
