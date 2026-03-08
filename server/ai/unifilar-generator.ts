export interface UnifilarInput {
  panelsCount: number;
  stringsCount?: number;
  panelsPerString?: number;
  inverterModel?: string;
  inverterPowerKw?: number;
  phases?: 1 | 2 | 3;
  projectTitle?: string;
  ticketNumber?: string;
}

export interface UnifilarResult {
  svg: string;
  description: string;
}

export function generateUnifilarSvg(input: UnifilarInput): UnifilarResult {
  const strings = input.stringsCount ?? Math.max(1, Math.ceil(input.panelsCount / 12));
  const ppStr = input.panelsPerString ?? Math.ceil(input.panelsCount / strings);
  const phases = input.phases ?? 1;
  const phaseLabel = phases === 1 ? "Monofásico" : phases === 2 ? "Bifásico" : "Trifásico";
  const inverterLabel = input.inverterModel
    ? `${input.inverterModel} (${input.inverterPowerKw ?? "—"}kW)`
    : `Inversor ${input.inverterPowerKw ?? "—"}kW`;

  const visibleStrings = Math.min(strings, 6);
  const svgH = 120 + visibleStrings * 46 + 160;

  let stringRows = "";
  for (let s = 0; s < visibleStrings; s++) {
    const y = 64 + s * 46;
    const visible = Math.min(ppStr, 6);
    for (let p = 0; p < visible; p++) {
      const x = 20 + p * 50;
      stringRows += `<rect x="${x}" y="${y}" width="36" height="24" rx="3" fill="#fef9c3" stroke="#f59e0b" stroke-width="1.5"/>`;
      stringRows += `<text x="${x + 18}" y="${y + 16}" text-anchor="middle" font-size="8" fill="#92400e">M${p + 1}</text>`;
      if (p < visible - 1) {
        stringRows += `<line x1="${x + 36}" y1="${y + 12}" x2="${x + 50}" y2="${y + 12}" stroke="#f59e0b" stroke-width="1.5"/>`;
      }
    }
    if (ppStr > 6) {
      stringRows += `<text x="${20 + 6 * 50}" y="${y + 16}" font-size="11" fill="#9ca3af">…</text>`;
    }
    const endX = 20 + visible * 50 + (ppStr > 6 ? 16 : 0);
    stringRows += `<line x1="${endX}" y1="${y + 12}" x2="360" y2="${y + 12}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4,2"/>`;
    stringRows += `<text x="4" y="${y + 16}" font-size="9" fill="#6b7280">S${s + 1}</text>`;
  }
  if (strings > visibleStrings) {
    const y = 64 + visibleStrings * 46;
    stringRows += `<text x="20" y="${y + 14}" font-size="10" fill="#9ca3af">... +${strings - visibleStrings} strings adicionais</text>`;
  }

  const boxY = 72 + visibleStrings * 46 + 10;
  const invY = boxY + 80;
  const gridY = invY + 80;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="${svgH}" viewBox="0 0 560 ${svgH}">
  <rect width="560" height="${svgH}" fill="#ffffff" rx="8" stroke="#e5e7eb" stroke-width="1"/>

  <!-- Título -->
  <text x="280" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#111827">Diagrama Unifilar — ${input.projectTitle ?? "Sistema FV"}${input.ticketNumber ? ` · ${input.ticketNumber}` : ""}</text>
  <text x="280" y="40" text-anchor="middle" font-size="10" fill="#6b7280">${input.panelsCount} módulos · ${strings} string(s) de ${ppStr} · ${phaseLabel}</text>

  <!-- Label módulos -->
  <text x="20" y="58" font-size="10" font-weight="bold" fill="#1f2937">Módulos Fotovoltaicos</text>

  ${stringRows}

  <!-- String Box -->
  <rect x="310" y="${boxY}" width="120" height="56" rx="6" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/>
  <text x="370" y="${boxY + 22}" text-anchor="middle" font-size="11" font-weight="bold" fill="#1d4ed8">String Box</text>
  <text x="370" y="${boxY + 38}" text-anchor="middle" font-size="9" fill="#3b82f6">DPS + Fusíveis</text>
  <line x1="370" y1="${boxY + 56}" x2="370" y2="${invY}" stroke="#3b82f6" stroke-width="2"/>

  <!-- Inversor -->
  <rect x="290" y="${invY}" width="160" height="60" rx="6" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/>
  <text x="370" y="${invY + 24}" text-anchor="middle" font-size="11" font-weight="bold" fill="#166534">Inversor</text>
  <text x="370" y="${invY + 40}" text-anchor="middle" font-size="9" fill="#16a34a">${inverterLabel}</text>
  <line x1="370" y1="${invY + 60}" x2="370" y2="${gridY}" stroke="#22c55e" stroke-width="2"/>

  <!-- Medidor -->
  <rect x="330" y="${gridY}" width="80" height="42" rx="6" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
  <text x="370" y="${gridY + 18}" text-anchor="middle" font-size="10" font-weight="bold" fill="#92400e">Medidor</text>
  <text x="370" y="${gridY + 32}" text-anchor="middle" font-size="9" fill="#b45309">Bidirecional</text>
  <line x1="370" y1="${gridY + 42}" x2="370" y2="${gridY + 62}" stroke="#f59e0b" stroke-width="2"/>

  <!-- Rede -->
  <rect x="300" y="${gridY + 62}" width="140" height="36" rx="6" fill="#f3f4f6" stroke="#6b7280" stroke-width="2"/>
  <text x="370" y="${gridY + 85}" text-anchor="middle" font-size="11" font-weight="bold" fill="#374151">Rede Elétrica (${phaseLabel})</text>
</svg>`.trim();

  const description = `Sistema ${input.panelsCount} módulos / ${strings} strings de ${ppStr} módulos / Inversor ${inverterLabel} / ${phaseLabel}`;
  return { svg, description };
}
