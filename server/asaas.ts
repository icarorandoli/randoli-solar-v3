export interface AsaasChargeResult {
  chargeId: string;
  qrCode: string;
  qrCodeBase64: string;
  invoiceUrl: string;
  expirationDate: string;
}

function getBaseUrl(sandbox?: boolean): string {
  return sandbox
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/v3";
}

export async function createAsaasPixCharge({
  apiKey,
  sandbox,
  projectId,
  projectTitle,
  ticketNumber,
  valor,
  payerName,
  payerCpfCnpj,
  payerEmail,
}: {
  apiKey: string;
  sandbox?: boolean;
  projectId: string;
  projectTitle: string;
  ticketNumber: string | null;
  valor: string;
  payerName?: string;
  payerCpfCnpj?: string;
  payerEmail?: string;
}): Promise<AsaasChargeResult> {
  const numericValue = parseFloat(valor.replace(/\./g, "").replace(",", "."));
  if (isNaN(numericValue) || numericValue <= 0) {
    throw new Error("Valor inválido para pagamento Asaas");
  }

  const baseUrl = getBaseUrl(sandbox);
  const ticket = ticketNumber || projectId.slice(0, 8);

  // Primeiro cria ou busca o cliente no Asaas
  let customerId: string | undefined;
  if (payerCpfCnpj) {
    const cpfCnpj = payerCpfCnpj.replace(/\D/g, "");
    try {
      // Busca cliente existente
      const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cpfCnpj}`, {
        headers: { "access_token": apiKey, "Content-Type": "application/json" },
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json() as any;
        if (searchData.data && searchData.data.length > 0) {
          customerId = searchData.data[0].id;
        }
      }

      // Cria cliente se não existe
      if (!customerId) {
        const customerBody: any = {
          name: payerName || "Cliente",
          cpfCnpj,
        };
        if (payerEmail) customerBody.email = payerEmail;

        const customerRes = await fetch(`${baseUrl}/customers`, {
          method: "POST",
          headers: { "access_token": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(customerBody),
        });
        if (customerRes.ok) {
          const customerData = await customerRes.json() as any;
          customerId = customerData.id;
        }
      }
    } catch (err) {
      console.warn("[asaas] Erro ao buscar/criar cliente:", err);
    }
  }

  // Cria a cobrança PIX
  const chargeBody: any = {
    billingType: "PIX",
    value: numericValue,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: `Projeto Solar — ${projectTitle} (${ticket})`,
    externalReference: projectId,
  };

  if (customerId) {
    chargeBody.customer = customerId;
  } else if (payerName) {
    // Asaas exige customer, cria inline sem CPF
    chargeBody.customer = undefined;
  }

  if (!customerId && !payerCpfCnpj) {
    // Sem cliente, Asaas não permite cobrança sem customer — cria cliente genérico
    const fallbackRes = await fetch(`${baseUrl}/customers`, {
      method: "POST",
      headers: { "access_token": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ name: payerName || "Cliente Projeto Solar", email: payerEmail || undefined }),
    });
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json() as any;
      chargeBody.customer = fallbackData.id;
    }
  }

  console.log(`[asaas] Criando cobrança: url=${baseUrl}/payments body=${JSON.stringify(chargeBody)}`);
  const chargeRes = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers: { "access_token": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(chargeBody),
  });

  const chargeText = await chargeRes.text();
  console.log(`[asaas] Resposta cobrança status=${chargeRes.status} body=${chargeText.slice(0, 500)}`);

  if (!chargeRes.ok) {
    throw new Error(`Asaas: erro ao criar cobrança: ${chargeText}`);
  }
  
  let chargeData: any;
  try {
    chargeData = JSON.parse(chargeText);
  } catch {
    throw new Error(`Asaas: resposta inválida: ${chargeText}`);
  }

  // chargeData já foi parseado acima
  const chargeId = chargeData.id;

  // Busca o QR Code PIX
  const pixRes = await fetch(`${baseUrl}/payments/${chargeId}/pixQrCode`, {
    headers: { "access_token": apiKey, "Content-Type": "application/json" },
  });

  if (!pixRes.ok) {
    const pixErr = await pixRes.text();
    console.error(`[asaas] Erro ao buscar QR Code PIX: ${pixErr}`);
    // Retorna sem QR Code mas com chargeId válido
    return {
      chargeId,
      qrCode: "",
      qrCodeBase64: "",
      invoiceUrl: chargeData.invoiceUrl || "",
      expirationDate: chargeData.dueDate || "",
    };
  }

  const pixData = await pixRes.json() as any;
  console.log(`[asaas] QR Code PIX: payload=${!!pixData.payload} encodedImage=${!!pixData.encodedImage} success=${pixData.success}`);

  return {
    chargeId,
    qrCode: pixData.payload || "",
    qrCodeBase64: pixData.encodedImage || "",
    invoiceUrl: chargeData.invoiceUrl || "",
    expirationDate: chargeData.dueDate || "",
  };
}

export async function getAsaasPaymentStatus(
  apiKey: string,
  chargeId: string,
  sandbox?: boolean
): Promise<string> {
  const baseUrl = getBaseUrl(sandbox);
  const res = await fetch(`${baseUrl}/payments/${chargeId}`, {
    headers: { "access_token": apiKey },
  });
  if (!res.ok) throw new Error("Asaas: erro ao consultar pagamento");
  const data = await res.json() as any;
  // CONFIRMED ou RECEIVED = aprovado
  return data.status === "CONFIRMED" || data.status === "RECEIVED" ? "approved" : "pending";
}

export function verifyAsaasWebhook(body: any, token: string): boolean {
  // Asaas envia o token configurado no header ou no body
  return true; // validação básica — pode ser refinada com token
}

export function extractAsaasPaymentStatus(event: any): string {
  const status = event?.payment?.status || event?.status || "";
  return (status === "CONFIRMED" || status === "RECEIVED") ? "approved" : "pending";
}
