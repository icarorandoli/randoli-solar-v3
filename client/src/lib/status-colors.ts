export const STATUS_COLOR_PRESETS: Record<string, { badge: string; kanban: string; hex: string; label: string }> = {
  slate:   { badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",   kanban: "bg-slate-100 dark:bg-slate-800",       hex: "#94a3b8", label: "Cinza" },
  yellow:  { badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", kanban: "bg-yellow-50 dark:bg-yellow-950/30", hex: "#eab308", label: "Amarelo" },
  blue:    { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",    kanban: "bg-blue-50 dark:bg-blue-950/30",       hex: "#3b82f6", label: "Azul" },
  violet:  { badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", kanban: "bg-violet-50 dark:bg-violet-950/30", hex: "#8b5cf6", label: "Violeta" },
  purple:  { badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", kanban: "bg-purple-50 dark:bg-purple-950/30", hex: "#a855f8", label: "Roxo" },
  amber:   { badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",  kanban: "bg-amber-50 dark:bg-amber-950/30",   hex: "#f59e0b", label: "Âmbar" },
  cyan:    { badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",    kanban: "bg-cyan-50 dark:bg-cyan-950/30",       hex: "#06b6d4", label: "Ciano" },
  green:   { badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",  kanban: "bg-green-50 dark:bg-green-950/30",   hex: "#22c55e", label: "Verde" },
  emerald: { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", kanban: "bg-emerald-50 dark:bg-emerald-950/30", hex: "#10b981", label: "Esmeralda" },
  red:     { badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",        kanban: "bg-red-50 dark:bg-red-950/30",         hex: "#ef4444", label: "Vermelho" },
  orange:  { badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", kanban: "bg-orange-50 dark:bg-orange-950/30", hex: "#f97316", label: "Laranja" },
  pink:    { badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",    kanban: "bg-pink-50 dark:bg-pink-950/30",       hex: "#ec4899", label: "Rosa" },
  teal:    { badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",    kanban: "bg-teal-50 dark:bg-teal-950/30",       hex: "#14b8a6", label: "Teal" },
};

export const DEFAULT_STATUS_CONFIGS = [
  { key: "orcamento",                   label: "Orçamento",                  color: "slate",   showInKanban: true,  sortOrder: 0  },
  { key: "aprovado_pagamento_pendente", label: "Aprovado / Pag. Pendente",   color: "yellow",  showInKanban: false, sortOrder: 1  },
  { key: "projeto_tecnico",             label: "Projeto Técnico",            color: "blue",    showInKanban: true,  sortOrder: 2  },
  { key: "aguardando_art",              label: "Aguardando ART",             color: "violet",  showInKanban: true,  sortOrder: 3  },
  { key: "protocolado",                 label: "Protocolado",                color: "purple",  showInKanban: true,  sortOrder: 4  },
  { key: "parecer_acesso",              label: "Parecer de Acesso",          color: "amber",   showInKanban: true,  sortOrder: 5  },
  { key: "instalacao",                  label: "Em Instalação",              color: "orange",  showInKanban: false, sortOrder: 6  },
  { key: "vistoria",                    label: "Aguardando Vistoria",        color: "cyan",    showInKanban: true,  sortOrder: 7  },
  { key: "projeto_aprovado",            label: "Projeto Aprovado",           color: "teal",    showInKanban: false, sortOrder: 8  },
  { key: "homologado",                  label: "Homologado",                 color: "green",   showInKanban: true,  sortOrder: 9  },
  { key: "finalizado",                  label: "Finalizado",                 color: "emerald", showInKanban: true,  sortOrder: 10 },
  { key: "cancelado",                   label: "Cancelado",                  color: "red",     showInKanban: false, sortOrder: 11 },
];

export function getBadgeClass(color: string): string {
  return STATUS_COLOR_PRESETS[color]?.badge ?? STATUS_COLOR_PRESETS.slate.badge;
}

export function getKanbanClass(color: string): string {
  return STATUS_COLOR_PRESETS[color]?.kanban ?? STATUS_COLOR_PRESETS.slate.kanban;
}
