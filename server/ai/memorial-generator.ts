import type { ProjectWithIntegrador } from "../storage";

export interface MemorialInput {
  project: ProjectWithIntegrador;
  panelBrand?: string;
  panelModel?: string;
  panelPowerW?: number;
  panelsCount?: number;
  inverterBrand?: string;
  inverterModel?: string;
  inverterPowerKw?: number;
  systemKwp?: number;
  monthlyGenerationKwh?: number;
  annualGenerationKwh?: number;
  irradiationKwhM2Day?: number;
  phase?: string;
  engName?: string;
  engCrea?: string;
}

export interface MemorialResult {
  text: string;
  html: string;
  title: string;
}

function today(): string {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function generateMemorial(input: MemorialInput): MemorialResult {
  const { project } = input;
  const clientName = project.client?.name ?? "Cliente não informado";
  const location = [project.cidade, project.estado].filter(Boolean).join(", ") || "Local não informado";
  const kwp = input.systemKwp ?? parseFloat(String(project.potencia ?? 0));
  const panels = input.panelsCount ?? 0;
  const panelDesc = panels > 0 && input.panelBrand
    ? `${panels} módulos fotovoltaicos ${input.panelBrand} ${input.panelModel ?? ""} de ${input.panelPowerW ?? "—"}Wp cada`
    : `Módulos fotovoltaicos a definir`;
  const inverterDesc = input.inverterBrand
    ? `Inversor ${input.inverterBrand} ${input.inverterModel ?? ""} de ${input.inverterPowerKw ?? "—"} kW`
    : "Inversor a definir";
  const monthlyGen = input.monthlyGenerationKwh ?? 0;
  const annualGen = input.annualGenerationKwh ?? (monthlyGen * 12);
  const irr = input.irradiationKwhM2Day ?? 4.5;
  const phase = input.phase ?? "monofásico";
  const engName = input.engName ?? "Engenheiro Responsável";
  const engCrea = input.engCrea ?? "";

  const title = `Memorial Descritivo — Sistema Fotovoltaico — ${project.ticketNumber ?? project.title}`;

  const text = `
MEMORIAL DESCRITIVO
SISTEMA DE GERAÇÃO DE ENERGIA SOLAR FOTOVOLTAICA

Projeto: ${project.title}
Número: ${project.ticketNumber ?? "—"}
Cliente: ${clientName}
Local de Instalação: ${location}
Data: ${today()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. OBJETO

Este memorial descritivo tem por objetivo detalhar as especificações técnicas do sistema de geração de energia elétrica fotovoltaica a ser instalado no endereço ${project.rua ? `${project.rua}, ${project.numero ?? ""}` : location}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. SISTEMA PROPOSTO

Potência instalada: ${kwp.toFixed(2)} kWp
Conexão à rede: ${phase}
Localização: ${location}
Irradiação solar média: ${irr} kWh/m²/dia

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. EQUIPAMENTOS

3.1 Módulos Fotovoltaicos
${panelDesc}

3.2 Inversor Solar
${inverterDesc}

3.3 Estrutura de Fixação
Estrutura metálica em alumínio/aço galvanizado adequada ao tipo de telhado, conforme laudo estrutural.

3.4 Cabeamento e Proteções
Cabos solares flexíveis, string box com fusíveis, DPS (dispositivo de proteção contra surtos), disjuntor de proteção e aterramento conforme NBR 5410.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. ESTIMATIVA DE GERAÇÃO

Geração média mensal: ${monthlyGen.toLocaleString("pt-BR")} kWh
Geração média anual: ${annualGen.toLocaleString("pt-BR")} kWh
Eficiência do sistema: 78%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. NORMAS TÉCNICAS APLICÁVEIS

• NBR 16690:2019 — Instalações elétricas de sistemas fotovoltaicos
• NBR 16274:2014 — Sistemas fotovoltaicos conectados à rede
• NBR 5410:2004 — Instalações elétricas de baixa tensão
• Resolução Normativa ANEEL nº 482/2012 e atualizações
• Lei nº 14.300/2022 — Marco Legal da Microgeração e Minigeração Distribuída

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. RESPONSÁVEL TÉCNICO

${engName}${engCrea ? ` — CREA ${engCrea}` : ""}
Randoli Engenharia Solar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Documento gerado automaticamente em ${today()} pelo sistema Randoli Solar.
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #222; margin: 40px; line-height: 1.6; }
  h1 { font-size: 16px; text-align: center; color: #f97316; }
  h2 { font-size: 13px; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 24px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; }
  .info-item { background: #f8f8f8; padding: 8px; border-radius: 4px; }
  .info-label { font-size: 10px; color: #888; text-transform: uppercase; }
  .info-value { font-weight: bold; font-size: 13px; }
  footer { margin-top: 40px; font-size: 10px; color: #aaa; text-align: center; }
</style>
</head>
<body>
<h1>MEMORIAL DESCRITIVO — SISTEMA FOTOVOLTAICO</h1>
<div class="info-grid">
  <div class="info-item"><div class="info-label">Projeto</div><div class="info-value">${project.title}</div></div>
  <div class="info-item"><div class="info-label">Nº Ticket</div><div class="info-value">${project.ticketNumber ?? "—"}</div></div>
  <div class="info-item"><div class="info-label">Cliente</div><div class="info-value">${clientName}</div></div>
  <div class="info-item"><div class="info-label">Local</div><div class="info-value">${location}</div></div>
  <div class="info-item"><div class="info-label">Potência</div><div class="info-value">${kwp.toFixed(2)} kWp</div></div>
  <div class="info-item"><div class="info-label">Fase</div><div class="info-value">${phase}</div></div>
</div>
<h2>Equipamentos</h2>
<p><strong>Módulos:</strong> ${panelDesc}</p>
<p><strong>Inversor:</strong> ${inverterDesc}</p>
<h2>Estimativa de Geração</h2>
<p>Geração média mensal: <strong>${monthlyGen.toLocaleString("pt-BR")} kWh</strong></p>
<p>Geração média anual: <strong>${annualGen.toLocaleString("pt-BR")} kWh</strong></p>
<h2>Normas</h2>
<p>NBR 16690:2019 · NBR 16274:2014 · NBR 5410:2004 · RN ANEEL 482/2012 · Lei 14.300/2022</p>
<h2>Responsável Técnico</h2>
<p>${engName}${engCrea ? ` — CREA ${engCrea}` : ""}<br>Randoli Engenharia Solar</p>
<footer>Documento gerado em ${today()} pelo sistema Randoli Solar</footer>
</body>
</html>
`.trim();

  return { text, html, title };
}
