import nodemailer from "nodemailer";

export interface EmailConfig {
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpHost?: string;
  smtpPort?: number;
  portalUrl?: string;
}

const STATUS_LABELS: Record<string, string> = {
  orcamento: "Orçamento",
  aprovado_pagamento_pendente: "Aprovado / Pagamento Pendente",
  projeto_tecnico: "Projeto Técnico",
  aguardando_art: "Aguardando Emissão da ART",
  protocolado: "Protocolado na Concessionária",
  parecer_acesso: "Parecer de Acesso Emitido",
  instalacao: "Em Instalação",
  vistoria: "Aguardando Vistoria",
  projeto_aprovado: "Projeto Aprovado",
  homologado: "Homologado — Conexão Aprovada",
  finalizado: "Projeto Finalizado",
  cancelado: "Projeto Cancelado",
};

const STATUS_ICONS: Record<string, string> = {
  orcamento: "📋",
  aprovado_pagamento_pendente: "💰",
  projeto_tecnico: "📐",
  aguardando_art: "📝",
  protocolado: "📫",
  parecer_acesso: "📄",
  instalacao: "🔧",
  vistoria: "🔍",
  projeto_aprovado: "✅",
  homologado: "⚡",
  finalizado: "🏁",
  cancelado: "❌",
};

const STATUS_COLORS: Record<string, string> = {
  orcamento: "#64748b",
  aprovado_pagamento_pendente: "#d97706",
  projeto_tecnico: "#3b82f6",
  aguardando_art: "#8b5cf6",
  protocolado: "#7c3aed",
  parecer_acesso: "#f59e0b",
  instalacao: "#f97316",
  vistoria: "#06b6d4",
  projeto_aprovado: "#10b981",
  homologado: "#22c55e",
  finalizado: "#1e3a5f",
  cancelado: "#ef4444",
};

function createTransporter(config?: EmailConfig) {
  const user = config?.smtpUser || process.env.SMTP_USER;
  const pass = config?.smtpPass || process.env.SMTP_PASS;
  if (!user || !pass) return null;

  const host = config?.smtpHost || "smtp.office365.com";
  const port = config?.smtpPort || 587;

  // Use secure: true for port 465, false for others
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    // Some providers (like Hostinger/Outlook) need specific TLS settings
    tls: { 
      rejectUnauthorized: false,
      ciphers: "SSLv3" 
    },
  });
}

export async function sendStatusEmail({
  to,
  integradorName,
  projectTitle,
  ticketNumber,
  newStatus,
  portalUrl,
  paymentLink,
  config,
}: {
  to: string;
  integradorName: string;
  projectTitle: string;
  ticketNumber: string | null | undefined;
  newStatus: string;
  portalUrl?: string;
  paymentLink?: string;
  config?: EmailConfig;
}) {
  const transporter = createTransporter(config);
  if (!transporter) {
    console.log("[email] SMTP não configurado — pulando envio de e-mail");
    return;
  }

  const label = STATUS_LABELS[newStatus] || newStatus;
  const icon = STATUS_ICONS[newStatus] || "🔔";
  const color = STATUS_COLORS[newStatus] || "#1a56db";
  const from = config?.smtpFrom || process.env.SMTP_FROM || config?.smtpUser || process.env.SMTP_USER;
  const ticket = ticketNumber ? ` [${ticketNumber}]` : "";
  const portal = portalUrl || config?.portalUrl || process.env.APP_URL || "https://projetos.randolisolar.com.br";

  try {
    await transporter.sendMail({
      from: `"Randoli Engenharia Solar" <${from}>`,
      to,
      subject: `${icon} Atualização de Projeto${ticket} — ${label}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;max-width:600px">
                <!-- Header -->
                <tr>
                  <td style="background:#1e3a5f;padding:28px 36px">
                    <p style="color:#fff;margin:0;font-size:22px;font-weight:bold">⚡ Randoli Engenharia Solar</p>
                    <p style="color:#93c5fd;margin:6px 0 0;font-size:14px">Portal do Integrador Solar</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:36px">
                    <p style="color:#374151;margin:0 0 8px;font-size:16px">Olá, <strong>${integradorName}</strong>!</p>
                    <p style="color:#6b7280;margin:0 0 28px;font-size:14px">O status do seu projeto foi atualizado pela equipe Randoli.</p>

                    <!-- Project Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:28px">
                      <tr>
                        <td style="padding:20px 24px">
                          <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">PROJETO</p>
                          <p style="color:#111827;font-size:16px;font-weight:bold;margin:0 0 20px">${projectTitle}${ticket}</p>

                          <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">NOVO STATUS</p>
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:${color};border-radius:6px;padding:10px 18px">
                                <p style="color:#fff;font-size:16px;font-weight:bold;margin:0">${icon} ${label}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${paymentLink && newStatus === "aprovado_pagamento_pendente" ? `
                    <!-- Payment CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9c3;border:1px solid #fbbf24;border-radius:10px;margin-bottom:20px">
                      <tr>
                        <td style="padding:20px 24px">
                          <p style="color:#92400e;font-size:14px;font-weight:bold;margin:0 0 8px">💳 Realize o pagamento para dar início ao projeto</p>
                          <p style="color:#a16207;font-size:13px;margin:0 0 16px">Clique no botão abaixo para efetuar o pagamento de forma segura pelo Mercado Pago.</p>
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:#009ee3;border-radius:8px;padding:14px 28px">
                                <a href="${paymentLink}" style="color:#fff;font-size:14px;font-weight:bold;text-decoration:none">Pagar Agora →</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    ` : ""}

                    <!-- CTA -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#1e3a5f;border-radius:8px;padding:14px 28px">
                          <a href="${portal}" style="color:#fff;font-size:14px;font-weight:bold;text-decoration:none">Acessar Portal →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:16px 36px;border-top:1px solid #e5e7eb">
                    <p style="color:#9ca3af;font-size:12px;margin:0">Este é um e-mail automático da Randoli Engenharia Solar. Não responda.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`[email] ✓ Notificação enviada para ${to} (${label})`);
  } catch (err) {
    console.error("[email] Erro ao enviar e-mail:", err);
    throw err;
  }
}

export async function sendPasswordResetEmail({
  to,
  userName,
  resetLink,
  config,
}: {
  to: string;
  userName: string;
  resetLink: string;
  config?: EmailConfig;
}) {
  const transporter = createTransporter(config);
  if (!transporter) {
    console.log("[email] SMTP não configurado — pulando envio de recuperação de senha");
    throw new Error("Servidor de e-mail não configurado. Contate o administrador.");
  }

  const from = config?.smtpFrom || process.env.SMTP_FROM || config?.smtpUser || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from: `"Randoli Engenharia Solar" <${from}>`,
      to,
      subject: "🔑 Recuperação de Senha — Randoli Engenharia Solar",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;max-width:600px">
                <tr>
                  <td style="background:#1e3a5f;padding:28px 36px">
                    <p style="color:#fff;margin:0;font-size:22px;font-weight:bold">⚡ Randoli Engenharia Solar</p>
                    <p style="color:#93c5fd;margin:6px 0 0;font-size:14px">Recuperação de Senha</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px">
                    <p style="color:#374151;margin:0 0 8px;font-size:16px">Olá, <strong>${userName}</strong>!</p>
                    <p style="color:#6b7280;margin:0 0 28px;font-size:14px">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>

                    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
                      <tr>
                        <td style="background:#1e3a5f;border-radius:8px;padding:14px 28px">
                          <a href="${resetLink}" style="color:#fff;font-size:14px;font-weight:bold;text-decoration:none">Redefinir Minha Senha →</a>
                        </td>
                      </tr>
                    </table>

                    <p style="color:#6b7280;font-size:13px;margin:0 0 8px">Este link é válido por <strong>1 hora</strong>.</p>
                    <p style="color:#9ca3af;font-size:12px;margin:0">Se você não solicitou esta recuperação, ignore este e-mail. Sua senha permanecerá a mesma.</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:16px 36px;border-top:1px solid #e5e7eb">
                    <p style="color:#9ca3af;font-size:12px;margin:0">Este é um e-mail automático da Randoli Engenharia Solar. Não responda.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`[email] ✓ E-mail de recuperação enviado para ${to}`);
  } catch (err) {
    console.error("[email] Erro ao enviar e-mail de recuperação:", err);
    throw err;
  }
}

export async function sendDocumentEmail({
  to,
  integradorName,
  projectTitle,
  ticketNumber,
  documentName,
  uploadedBy,
  portalUrl,
  config,
}: {
  to: string;
  integradorName: string;
  projectTitle: string;
  ticketNumber: string | null | undefined;
  documentName: string;
  uploadedBy: string;
  portalUrl?: string;
  config?: EmailConfig;
}) {
  const transporter = createTransporter(config);
  if (!transporter) return;

  const from = config?.smtpFrom || process.env.SMTP_FROM || config?.smtpUser || process.env.SMTP_USER;
  const ticket = ticketNumber ? ` [${ticketNumber}]` : "";
  const portal = portalUrl || config?.portalUrl || process.env.APP_URL || "https://projetos.randolisolar.com.br";

  try {
    await transporter.sendMail({
      from: `"Randoli Engenharia Solar" <${from}>`,
      to,
      subject: `📎 Novo Documento${ticket} — ${projectTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;max-width:600px">
                <tr>
                  <td style="background:#1e3a5f;padding:28px 36px">
                    <p style="color:#fff;margin:0;font-size:22px;font-weight:bold">⚡ Randoli Engenharia Solar</p>
                    <p style="color:#93c5fd;margin:6px 0 0;font-size:14px">Portal do Integrador Solar</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px">
                    <p style="color:#374151;margin:0 0 8px;font-size:16px">Olá, <strong>${integradorName}</strong>!</p>
                    <p style="color:#6b7280;margin:0 0 28px;font-size:14px">Um novo documento foi adicionado ao seu projeto pela equipe Randoli.</p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:28px">
                      <tr>
                        <td style="padding:20px 24px">
                          <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">PROJETO</p>
                          <p style="color:#111827;font-size:16px;font-weight:bold;margin:0 0 20px">${projectTitle}${ticket}</p>

                          <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">DOCUMENTO</p>
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 18px">
                                <p style="color:#1d4ed8;font-size:15px;font-weight:bold;margin:0">📎 ${documentName}</p>
                              </td>
                            </tr>
                          </table>

                          <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">Enviado por: ${uploadedBy}</p>
                        </td>
                      </tr>
                    </table>

                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#1e3a5f;border-radius:8px;padding:14px 28px">
                          <a href="${portal}" style="color:#fff;font-size:14px;font-weight:bold;text-decoration:none">Ver no Portal →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:16px 36px;border-top:1px solid #e5e7eb">
                    <p style="color:#9ca3af;font-size:12px;margin:0">Este é um e-mail automático da Randoli Engenharia Solar. Não responda.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`[email] ✓ Notificação de documento enviada para ${to}`);
  } catch (err) {
    console.error("[email] Erro ao enviar e-mail de documento:", err);
  }
}

export async function sendTimelineEmail({
  to,
  integradorName,
  projectTitle,
  ticketNumber,
  event,
  details,
  portalUrl,
  config,
}: {
  to: string;
  integradorName: string;
  projectTitle: string;
  ticketNumber: string | null | undefined;
  event: string;
  details?: string;
  portalUrl?: string;
  config?: EmailConfig;
}) {
  const transporter = createTransporter(config);
  if (!transporter) return;

  const from = config?.smtpFrom || process.env.SMTP_FROM || config?.smtpUser || process.env.SMTP_USER;
  const ticket = ticketNumber ? ` [${ticketNumber}]` : "";
  const portal = portalUrl || config?.portalUrl || process.env.APP_URL || "https://projetos.randolisolar.com.br";

  try {
    await transporter.sendMail({
      from: `"Randoli Engenharia Solar" <${from}>`,
      to,
      subject: `📋 Nova Atualização no Histórico${ticket} — ${projectTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;max-width:600px">
                <tr>
                  <td style="background:#1e3a5f;padding:28px 36px">
                    <p style="color:#fff;margin:0;font-size:22px;font-weight:bold">⚡ Randoli Engenharia Solar</p>
                    <p style="color:#93c5fd;margin:6px 0 0;font-size:14px">Portal do Integrador Solar</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px">
                    <p style="color:#374151;margin:0 0 8px;font-size:16px">Olá, <strong>${integradorName}</strong>!</p>
                    <p style="color:#6b7280;margin:0 0 28px;font-size:14px">Uma nova atualização foi adicionada ao histórico do seu projeto.</p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:28px">
                      <tr>
                        <td style="padding:20px 24px">
                          <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">PROJETO</p>
                          <p style="color:#111827;font-size:16px;font-weight:bold;margin:0 0 20px">${projectTitle}${ticket}</p>

                          <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">EVENTO</p>
                          <table cellpadding="0" cellspacing="0" style="margin-bottom:${details ? "16px" : "0"}">
                            <tr>
                              <td style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:6px;padding:10px 18px">
                                <p style="color:#7c3aed;font-size:15px;font-weight:bold;margin:0">📋 ${event}</p>
                              </td>
                            </tr>
                          </table>

                          ${details ? `
                          <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">DETALHES</p>
                          <p style="color:#374151;font-size:14px;margin:0">${details}</p>
                          ` : ""}
                        </td>
                      </tr>
                    </table>

                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#1e3a5f;border-radius:8px;padding:14px 28px">
                          <a href="${portal}" style="color:#fff;font-size:14px;font-weight:bold;text-decoration:none">Ver no Portal →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:16px 36px;border-top:1px solid #e5e7eb">
                    <p style="color:#9ca3af;font-size:12px;margin:0">Este é um e-mail automático da Randoli Engenharia Solar. Não responda.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`[email] ✓ Notificação de histórico enviada para ${to}`);
  } catch (err) {
    console.error("[email] Erro ao enviar e-mail de histórico:", err);
  }
}

export async function sendTestEmail(to: string, config?: EmailConfig) {
  const transporter = createTransporter(config);
  if (!transporter) throw new Error("SMTP não configurado");

  const from = config?.smtpFrom || process.env.SMTP_FROM || config?.smtpUser || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"Randoli Engenharia Solar" <${from}>`,
    to,
    subject: "✅ Teste de Notificação — Randoli Engenharia Solar",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;max-width:600px">
              <tr>
                <td style="background:#1e3a5f;padding:28px 36px">
                  <p style="color:#fff;margin:0;font-size:22px;font-weight:bold">⚡ Randoli Engenharia Solar</p>
                  <p style="color:#93c5fd;margin:6px 0 0;font-size:14px">Portal do Integrador Solar</p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px">
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin-bottom:24px">
                    <p style="color:#15803d;font-size:18px;font-weight:bold;margin:0 0 8px">✅ Configuração de e-mail funcionando!</p>
                    <p style="color:#166534;font-size:14px;margin:0">Este é um e-mail de teste enviado pelo painel de configurações do Randoli Solar Portal.</p>
                  </div>
                  <p style="color:#6b7280;font-size:13px;margin:0">Se você recebeu esta mensagem, as notificações automáticas estão configuradas corretamente.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:16px 36px;border-top:1px solid #e5e7eb">
                  <p style="color:#9ca3af;font-size:12px;margin:0">Este é um e-mail automático da Randoli Engenharia Solar. Não responda.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}
