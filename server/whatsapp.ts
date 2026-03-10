export interface WhatsAppConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

async function sendEvolutionMessage(config: WhatsAppConfig, phone: string, text: string): Promise<boolean> {
  if (!config.enabled || !config.apiUrl || !config.apiKey || !config.instanceName) {
    return false;
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return false;

  const number = digits.startsWith("55") ? digits : `55${digits}`;

  const url = `${config.apiUrl.replace(/\/+$/, "")}/message/sendText/${config.instanceName}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify({
        number,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[whatsapp] Erro ao enviar para ${number}: ${res.status} — ${body.slice(0, 200)}`);
      return false;
    }

    console.log(`[whatsapp] Mensagem enviada para ${number}`);
    return true;
  } catch (err: any) {
    console.error(`[whatsapp] Falha na requisição: ${err.message}`);
    return false;
  }
}

export async function sendWhatsAppStatusNotification({
  config,
  phone,
  integradorName,
  projectTitle,
  ticketNumber,
  newStatus,
  changedBy,
}: {
  config: WhatsAppConfig;
  phone: string;
  integradorName: string;
  projectTitle: string;
  ticketNumber: string;
  newStatus: string;
  changedBy: string;
}): Promise<boolean> {
  const text =
    `🔔 *Atualização de Projeto*\n\n` +
    `Olá, ${integradorName}!\n\n` +
    `O projeto *${projectTitle}* (${ticketNumber}) foi atualizado.\n\n` +
    `📋 *Novo status:* ${newStatus}\n` +
    `👤 *Alterado por:* ${changedBy}\n\n` +
    `Acesse o portal para mais detalhes.`;

  return sendEvolutionMessage(config, phone, text);
}

export async function sendWhatsAppNewProjectNotification({
  config,
  phone,
  adminName,
  integradorName,
  projectTitle,
  ticketNumber,
  potencia,
}: {
  config: WhatsAppConfig;
  phone: string;
  adminName: string;
  integradorName: string;
  projectTitle: string;
  ticketNumber: string;
  potencia?: string;
}): Promise<boolean> {
  const text =
    `📌 *Novo Projeto Cadastrado*\n\n` +
    `${adminName}, um novo projeto foi cadastrado pelo integrador *${integradorName}*.\n\n` +
    `📋 *Projeto:* ${projectTitle}\n` +
    `🔖 *Ticket:* ${ticketNumber}\n` +
    (potencia ? `⚡ *Potência:* ${potencia} kWp\n` : ``) +
    `\nAcesse o painel administrativo para revisar.`;

  return sendEvolutionMessage(config, phone, text);
}

export async function sendWhatsAppDocumentNotification({
  config,
  phone,
  recipientName,
  projectTitle,
  ticketNumber,
  documentName,
  uploadedBy,
}: {
  config: WhatsAppConfig;
  phone: string;
  recipientName: string;
  projectTitle: string;
  ticketNumber: string;
  documentName: string;
  uploadedBy: string;
}): Promise<boolean> {
  const text =
    `📄 *Novo Documento Enviado*\n\n` +
    `Olá, ${recipientName}!\n\n` +
    `Um novo documento foi adicionado ao projeto *${projectTitle}* (${ticketNumber}).\n\n` +
    `📎 *Documento:* ${documentName}\n` +
    `👤 *Enviado por:* ${uploadedBy}\n\n` +
    `Acesse o portal para visualizar.`;

  return sendEvolutionMessage(config, phone, text);
}

export async function sendWhatsAppTimelineNotification({
  config,
  phone,
  recipientName,
  projectTitle,
  ticketNumber,
  event,
  details,
}: {
  config: WhatsAppConfig;
  phone: string;
  recipientName: string;
  projectTitle: string;
  ticketNumber: string;
  event: string;
  details?: string;
}): Promise<boolean> {
  const text =
    `📝 *Atualização no Projeto*\n\n` +
    `Olá, ${recipientName}!\n\n` +
    `Nova nota adicionada ao projeto *${projectTitle}* (${ticketNumber}).\n\n` +
    `📋 *Evento:* ${event}\n` +
    (details ? `💬 *Detalhes:* ${details}\n` : ``) +
    `\nAcesse o portal para mais informações.`;

  return sendEvolutionMessage(config, phone, text);
}

export async function sendWhatsAppPaymentNotification({
  config,
  phone,
  recipientName,
  projectTitle,
  ticketNumber,
  valor,
}: {
  config: WhatsAppConfig;
  phone: string;
  recipientName: string;
  projectTitle: string;
  ticketNumber: string;
  valor: string;
}): Promise<boolean> {
  const text =
    `💰 *Pagamento Confirmado*\n\n` +
    `Olá, ${recipientName}!\n\n` +
    `O pagamento do projeto *${projectTitle}* (${ticketNumber}) foi confirmado!\n\n` +
    `💵 *Valor:* R$ ${valor}\n\n` +
    `O projeto será avançado automaticamente. Acesse o portal para acompanhar.`;

  return sendEvolutionMessage(config, phone, text);
}

export async function testWhatsAppConnection(config: WhatsAppConfig): Promise<{ ok: boolean; message: string }> {
  if (!config.apiUrl || !config.apiKey || !config.instanceName) {
    return { ok: false, message: "Preencha URL da API, API Key e nome da instância." };
  }

  const url = `${config.apiUrl.replace(/\/+$/, "")}/instance/connectionState/${config.instanceName}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { apikey: config.apiKey },
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, message: `Erro HTTP ${res.status}: ${body.slice(0, 150)}` };
    }

    const data = await res.json();
    const state = data?.instance?.state || data?.state || "unknown";

    if (state === "open" || state === "connected") {
      return { ok: true, message: `Conectado! Instância "${config.instanceName}" está online.` };
    }

    return { ok: false, message: `Instância "${config.instanceName}" está com status: ${state}. Verifique se o QR code foi escaneado.` };
  } catch (err: any) {
    return { ok: false, message: `Erro de conexão: ${err.message}` };
  }
}
