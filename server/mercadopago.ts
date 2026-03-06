import crypto from "crypto";

export interface MercadoPagoConfig {
  accessToken: string;
  webhookUrl?: string;
}

export interface PaymentPreference {
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export async function createPaymentPreference({
  accessToken,
  projectId,
  projectTitle,
  ticketNumber,
  valor,
  integradorEmail,
  integradorName,
  webhookUrl,
}: {
  accessToken: string;
  projectId: string;
  projectTitle: string;
  ticketNumber: string | null;
  valor: string;
  integradorEmail?: string;
  integradorName?: string;
  webhookUrl?: string;
}): Promise<PaymentPreference> {
  const numericValue = parseFloat(
    valor.replace(/\./g, "").replace(",", ".")
  );

  if (isNaN(numericValue) || numericValue <= 0) {
    throw new Error("Valor inválido para pagamento");
  }

  const ticket = ticketNumber || projectId.slice(0, 8);

  let portalBaseUrl = "https://projetos.randolisolar.com.br";
  if (webhookUrl) {
    try {
      const u = new URL(webhookUrl);
      portalBaseUrl = `${u.protocol}//${u.host}`;
    } catch {}
  }
  const projectUrl = `${portalBaseUrl}/portal/projetos/${projectId}`;

  const body: any = {
    items: [
      {
        id: projectId,
        title: `Projeto Solar — ${projectTitle}`,
        description: `Pagamento do projeto ${ticket}`,
        quantity: 1,
        unit_price: numericValue,
        currency_id: "BRL",
      },
    ],
    external_reference: projectId,
    statement_descriptor: "RANDOLI SOLAR",
    back_urls: {
      success: projectUrl,
      failure: projectUrl,
      pending: projectUrl,
    },
    auto_return: "approved",
  };

  if (webhookUrl) {
    body.notification_url = webhookUrl;
  }

  if (integradorEmail) {
    body.payer = {
      email: integradorEmail,
      name: integradorName || undefined,
    };
  }

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[mercadopago] Erro ao criar preferência:", res.status, errorBody);
    throw new Error(`Erro Mercado Pago: ${res.status}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
  };
}

export interface PixPaymentResult {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
}

export async function createPixPayment({
  accessToken,
  projectId,
  projectTitle,
  ticketNumber,
  valor,
  integradorEmail,
  integradorName,
  webhookUrl,
}: {
  accessToken: string;
  projectId: string;
  projectTitle: string;
  ticketNumber: string | null;
  valor: string;
  integradorEmail?: string;
  integradorName?: string;
  webhookUrl?: string;
}): Promise<PixPaymentResult> {
  const numericValue = parseFloat(
    valor.replace(/\./g, "").replace(",", ".")
  );

  if (isNaN(numericValue) || numericValue <= 0) {
    throw new Error("Valor inválido para pagamento PIX");
  }

  const ticket = ticketNumber || projectId.slice(0, 8);
  const body: any = {
    transaction_amount: numericValue,
    payment_method_id: "pix",
    description: `Projeto Solar — ${projectTitle} (${ticket})`,
    external_reference: projectId,
    payer: {
      email: integradorEmail || "cliente@randolisolar.com.br",
      first_name: integradorName?.split(" ")[0] || "Cliente",
      last_name: integradorName?.split(" ").slice(1).join(" ") || "Solar",
    },
  };

  if (webhookUrl) {
    body.notification_url = webhookUrl;
  }

  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Idempotency-Key": `pix-${projectId}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[mercadopago] Erro ao criar PIX:", res.status, errorBody);
    throw new Error(`Erro Mercado Pago PIX: ${res.status}`);
  }

  const data = await res.json();
  const txData = data.point_of_interaction?.transaction_data;

  if (!txData?.qr_code) {
    throw new Error("PIX não retornou QR code");
  }

  return {
    paymentId: String(data.id),
    qrCode: txData.qr_code,
    qrCodeBase64: txData.qr_code_base64 || "",
    ticketUrl: txData.ticket_url || "",
  };
}

export async function getPaymentInfo(paymentId: string, accessToken: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.error("[mercadopago] Erro ao buscar pagamento:", res.status);
    return null;
  }

  return res.json();
}

export async function getMerchantOrder(orderId: string, accessToken: string) {
  const res = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;
  return res.json();
}

export function verifyWebhookSignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string,
  webhookSecret: string | undefined,
): boolean {
  if (!webhookSecret) {
    console.log("[mercadopago] Webhook secret não configurado — validação de assinatura ignorada");
    return true;
  }
  if (!xSignature || !xRequestId) {
    console.log("[mercadopago] Headers de assinatura ausentes");
    return false;
  }

  const parts: Record<string, string> = {};
  xSignature.split(",").forEach(part => {
    const [k, v] = part.trim().split("=");
    if (k && v) parts[k.trim()] = v.trim();
  });

  const ts = parts["ts"];
  const hash = parts["v1"];
  if (!ts || !hash) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", webhookSecret).update(manifest).digest("hex");
  return hmac === hash;
}
