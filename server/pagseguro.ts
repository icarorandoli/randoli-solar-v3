import crypto from "crypto";

export interface PagSeguroConfig {
  token: string;
  email?: string;
  sandbox?: boolean;
}

export interface PagSeguroChargeResult {
  chargeId: string;
  qrCode: string;
  qrCodeBase64: string;
  qrCodeUrl: string;
  expirationDate: string;
}

function getBaseUrl(sandbox?: boolean): string {
  return sandbox
    ? "https://sandbox.api.pagseguro.com"
    : "https://api.pagseguro.com";
}

export async function createPagSeguroPixCharge({
  token,
  sandbox,
  projectId,
  projectTitle,
  ticketNumber,
  valor,
  payerName,
  payerCpfCnpj,
  payerEmail,
}: {
  token: string;
  sandbox?: boolean;
  projectId: string;
  projectTitle: string;
  ticketNumber: string | null;
  valor: string;
  payerName?: string;
  payerCpfCnpj?: string;
  payerEmail?: string;
}): Promise<PagSeguroChargeResult> {
  const numericValue = parseFloat(valor.replace(/\./g, "").replace(",", "."));
  if (isNaN(numericValue) || numericValue <= 0) {
    throw new Error("Valor inválido para pagamento PagSeguro");
  }

  const amountInCents = Math.round(numericValue * 100);
  const ticket = ticketNumber || projectId.slice(0, 8);
  const baseUrl = getBaseUrl(sandbox);

  const body: any = {
    reference_id: projectId,
    description: `Projeto Solar — ${projectTitle} (${ticket})`,
    amount: {
      value: amountInCents,
      currency: "BRL",
    },
    payment_method: {
      type: "PIX",
    },
    notification_urls: [],
  };

  if (payerName || payerCpfCnpj || payerEmail) {
    body.customer = {};
    if (payerName) body.customer.name = payerName;
    if (payerEmail) body.customer.email = payerEmail;
    if (payerCpfCnpj) {
      const digits = payerCpfCnpj.replace(/\D/g, "");
      if (digits.length === 11) {
        body.customer.tax_id = digits;
      } else if (digits.length === 14) {
        body.customer.tax_id = digits;
      }
    }
  }

  const res = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[pagseguro] Erro ao criar cobrança:", res.status, errorBody);
    throw new Error(`Erro PagSeguro: ${res.status}`);
  }

  const data = await res.json();
  const qrCodes = data.qr_codes || [];
  const pixCharge = qrCodes[0];

  if (!pixCharge) {
    const links = data.links || [];
    const payLink = links.find((l: any) => l.rel === "PAY");
    if (payLink) {
      return {
        chargeId: data.id,
        qrCode: payLink.href,
        qrCodeBase64: "",
        qrCodeUrl: payLink.href,
        expirationDate: "",
      };
    }
    throw new Error("PagSeguro não retornou QR Code PIX");
  }

  return {
    chargeId: data.id,
    qrCode: pixCharge.text || "",
    qrCodeBase64: pixCharge.links?.find((l: any) => l.type === "image/png")?.href || "",
    qrCodeUrl: pixCharge.links?.find((l: any) => l.rel === "PAY")?.href || "",
    expirationDate: pixCharge.expiration_date || "",
  };
}

export async function getPagSeguroOrderInfo(orderId: string, token: string, sandbox?: boolean) {
  const baseUrl = getBaseUrl(sandbox);
  const res = await fetch(`${baseUrl}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error("[pagseguro] Erro ao buscar pedido:", res.status);
    return null;
  }

  return res.json();
}

export function verifyPagSeguroWebhookSignature(
  body: string,
  signature: string | undefined,
  token: string,
): boolean {
  if (!signature) {
    console.log("[pagseguro] Sem assinatura no webhook — validação ignorada");
    return true;
  }
  try {
    const hmac = crypto.createHmac("sha256", token).update(body).digest("hex");
    return hmac === signature;
  } catch {
    return false;
  }
}

export function extractPagSeguroPaymentStatus(order: any): string {
  const charges = order?.charges || [];
  if (charges.length === 0) return "pending";
  const lastCharge = charges[charges.length - 1];
  const status = lastCharge?.status || "";
  switch (status) {
    case "PAID": return "approved";
    case "AUTHORIZED": return "approved";
    case "DECLINED": return "rejected";
    case "CANCELED": return "cancelled";
    case "IN_ANALYSIS": return "in_process";
    default: return "pending";
  }
}
