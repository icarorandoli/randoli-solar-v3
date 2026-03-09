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

const PIX_SCOPES = "cob.write cob.read pix.read";

interface TokenCache {
  token: string;
  expiresAt: number;
  scope: string;
}

const tokenCache = new Map<string, TokenCache>();

function cleanPem(pem: string): string {
  const lines = pem.split("\n");
  const cleaned = lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return cleaned.join("\n") + "\n";
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

async function getAccessToken(config: InterConfig, requiredScope?: string): Promise<string> {
  const cacheKey = `${config.environment}:${config.clientId}:${requiredScope || "pix"}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt - 30_000) {
    return cached.token;
  }

  const scope = requiredScope || PIX_SCOPES;
  let result = await requestToken(config, scope);

  if (result.status !== 200 || !result.data.access_token) {
    console.error("[inter] Token error with scope:", result.status, result.data);
    throw new Error(
      `Inter OAuth falhou (scope="${scope}"): ${result.status} — ${JSON.stringify(result.data)}\n` +
      `Verifique se os escopos "${scope}" estão habilitados na sua aplicação em developers.inter.co.`
    );
  }

  const expiresIn = result.data.expires_in || 3600;
  tokenCache.set(cacheKey, {
    token: result.data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
    scope: result.data.scope || scope,
  });

  console.log("[inter] Token obtained. Scope:", result.data.scope);
  return result.data.access_token;
}

export interface InterPixResult {
  txid: string;
  pixCopiaECola: string;
  qrCodeBase64: string;
  status: string;
}

export async function createInterPixCharge({
  config,
  projectId,
  projectTitle,
  ticketNumber,
  valor,
  integradorName,
}: {
  config: InterConfig;
  projectId: string;
  projectTitle: string;
  ticketNumber: string | null;
  valor: string;
  integradorName?: string;
}): Promise<InterPixResult> {
  const numericValue = parseFloat(valor.replace(/\./g, "").replace(",", "."));
  if (isNaN(numericValue) || numericValue <= 0) {
    throw new Error("Valor inválido para PIX Inter");
  }

  const token = await getAccessToken(config, PIX_SCOPES);
  const baseUrl = BASE_URLS[config.environment];
  const ticket = ticketNumber || projectId.slice(0, 8);
  const txid = `RANDOLI${projectId.replace(/-/g, "").slice(0, 26).toUpperCase()}`;

  const cobBody = JSON.stringify({
    calendario: { expiracao: 86400 },
    devedor: integradorName ? { nome: integradorName } : undefined,
    valor: { original: numericValue.toFixed(2) },
    chave: config.pixKey,
    solicitacaoPagador: `Projeto Solar ${ticket} - ${projectTitle}`.slice(0, 140),
  });

  const cobRes = await httpsRequest(
    baseUrl,
    `/pix/v2/cob/${txid}`,
    "PUT",
    config.certificate,
    config.privateKey,
    { Authorization: `Bearer ${token}` },
    cobBody
  );

  if (cobRes.status !== 200 && cobRes.status !== 201) {
    console.error("[inter] PIX cobrança error:", cobRes.status, cobRes.data);
    throw new Error(`Inter PIX falhou: ${cobRes.status} — ${JSON.stringify(cobRes.data)}`);
  }

  const locId = cobRes.data.loc?.id;
  let qrCodeBase64 = "";
  let pixCopiaECola = cobRes.data.pixCopiaECola || "";

  if (locId) {
    try {
      const qrRes = await httpsRequest(
        baseUrl,
        `/pix/v2/loc/${locId}/qrcode`,
        "GET",
        config.certificate,
        config.privateKey,
        { Authorization: `Bearer ${token}` }
      );
      if (qrRes.status === 200) {
        qrCodeBase64 = qrRes.data.imagemQrcode || "";
        pixCopiaECola = qrRes.data.qrcode || pixCopiaECola;
      }
    } catch (e) {
      console.error("[inter] QR code fetch error:", e);
    }
  }

  return {
    txid,
    pixCopiaECola,
    qrCodeBase64,
    status: cobRes.data.status || "ATIVA",
  };
}

export async function getInterPixStatus(
  config: InterConfig,
  txid: string
): Promise<{ status: string; paidAt?: string }> {
  const token = await getAccessToken(config, PIX_SCOPES);
  const baseUrl = BASE_URLS[config.environment];

  const res = await httpsRequest(
    baseUrl,
    `/pix/v2/cob/${txid}`,
    "GET",
    config.certificate,
    config.privateKey,
    { Authorization: `Bearer ${token}` }
  );

  if (res.status !== 200) {
    throw new Error(`Inter status check falhou: ${res.status}`);
  }

  return {
    status: res.data.status,
    paidAt: res.data.pix?.[0]?.horario,
  };
}

export async function testInterConnection(
  config: InterConfig
): Promise<{ ok: boolean; message: string; scope?: string }> {
  try {
    const cacheKey = `${config.environment}:${config.clientId}:pix`;
    tokenCache.delete(cacheKey);

    const result = await requestToken(config, PIX_SCOPES);

    if (result.status !== 200 || !result.data.access_token) {
      const errBody = JSON.stringify(result.data);
      if (
        result.status === 403 ||
        (result.status === 401 && errBody.includes("scope"))
      ) {
        return {
          ok: false,
          message:
            `Certificado OK, mas os escopos PIX não estão habilitados na sua aplicação Inter.\n` +
            `Acesse developers.inter.co → sua aplicação → habilite os escopos: ${PIX_SCOPES}`,
        };
      }
      return {
        ok: false,
        message: `Inter OAuth falhou: ${result.status} — ${errBody}`,
      };
    }

    const scope: string = result.data.scope || "";
    const hasCobWrite = scope.includes("cob.write");

    if (!hasCobWrite) {
      return {
        ok: false,
        message:
          `Autenticação ok (scope: "${scope}"), mas o escopo "cob.write" é necessário para emitir PIX.\n` +
          `Acesse developers.inter.co → sua aplicação → habilite: ${PIX_SCOPES}`,
        scope,
      };
    }

    const expiresIn = result.data.expires_in || 3600;
    tokenCache.set(cacheKey, {
      token: result.data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
      scope,
    });

    return {
      ok: true,
      message: `Conexão com Banco Inter estabelecida. Escopos: ${scope}`,
      scope,
    };
  } catch (err: any) {
    return { ok: false, message: err.message || "Falha na conexão com o Banco Inter." };
  }
}
