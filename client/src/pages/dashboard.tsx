import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  FolderOpen, Users, CheckCircle, Clock, Zap, AlertCircle,
  XCircle, FileText, ClipboardList, Wrench, Eye, ShieldCheck,
  DollarSign, TrendingUp, BadgeCheck, Hourglass, ChevronRight,
  KanbanSquare, Plus, Settings, ExternalLink,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";
import type { Project, Client } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export const STATUS_LABELS: Record<string, string> = {
  orcamento: "Orçamento",
  aprovado_pagamento_pendente: "Pag. Pendente",
  projeto_tecnico: "Projeto Técnico",
  aguardando_art: "Aguardando ART",
  protocolado: "Protocolado",
  parecer_acesso: "Parecer de Acesso",
  instalacao: "Instalação",
  vistoria: "Vistoria",
  projeto_aprovado: "Projeto Aprovado",
  homologado: "Homologado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const STATUS_COLORS: Record<string, string> = {
  orcamento: "#94a3b8",
  aprovado_pagamento_pendente: "#eab308",
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

export const STATUS_BADGE_STYLES: Record<string, string> = {
  orcamento: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  aprovado_pagamento_pendente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  projeto_tecnico: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  aguardando_art: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  protocolado: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  parecer_acesso: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  instalacao: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  vistoria: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  projeto_aprovado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  homologado: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  finalizado: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  orcamento: Clock,
  aprovado_pagamento_pendente: AlertCircle,
  projeto_tecnico: FileText,
  aguardando_art: ClipboardList,
  protocolado: ClipboardList,
  parecer_acesso: AlertCircle,
  instalacao: Wrench,
  vistoria: Eye,
  projeto_aprovado: CheckCircle,
  homologado: ShieldCheck,
  finalizado: FolderOpen,
  cancelado: XCircle,
};

const STATUS_ORDER = [
  "orcamento", "aprovado_pagamento_pendente", "projeto_tecnico", "aguardando_art",
  "protocolado", "parecer_acesso", "instalacao", "vistoria",
  "projeto_aprovado", "homologado", "finalizado", "cancelado",
];

interface Stats {
  totalProjects: number;
  totalClients: number;
  byStatus: Record<string, number>;
}

interface FinancialStats {
  todayTotal: number;
  monthTotal: number;
  paidCount: number;
  pendingTotal: number;
}

type FinancialFilter = "today" | "month" | "paid" | "pending";

const FILTER_LABELS: Record<FinancialFilter, string> = {
  today: "Receita Hoje",
  month: "Receita do Mês",
  paid: "Projetos Pagos",
  pending: "A Receber",
};

function formatBRL(val: number | string | null | undefined) {
  const n = typeof val === "string"
    ? parseFloat(val.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0
    : Number(val ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ProjectRow({ project, linkTo }: { project: Project & { client: Client | null }; linkTo?: string }) {
  const inner = (
    <div className={`flex items-start gap-3 py-3 border-b border-border/50 last:border-0 ${linkTo ? "hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors cursor-pointer" : ""}`}>
      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: STATUS_COLORS[project.status] }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{project.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {project.client?.name || "—"}
          {project.concessionaria ? ` · ${project.concessionaria}` : ""}
        </p>
        {project.updatedAt && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(project.updatedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {project.valor && (
          <span className="text-sm font-semibold text-foreground">{formatBRL(project.valor)}</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_BADGE_STYLES[project.status]}`}>
          {STATUS_LABELS[project.status] || project.status}
        </span>
        {linkTo && <ExternalLink className="h-3 w-3 text-muted-foreground/50 mt-0.5" />}
      </div>
    </div>
  );
  if (linkTo) return <Link href={linkTo}>{inner}</Link>;
  return inner;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FinancialFilter | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({ queryKey: ["/api/stats"] });
  const { data: projects = [], isLoading: projectsLoading } = useQuery<(Project & { client: Client | null })[]>({
    queryKey: ["/api/projects"],
  });
  const canSeeFinancial = ["admin", "financeiro"].includes(user?.role || "");
  const { data: finStats, isLoading: finLoading } = useQuery<FinancialStats>({
    queryKey: ["/api/stats/financial"],
    enabled: canSeeFinancial,
  });
  const { data: filterProjects = [], isLoading: filterLoading } = useQuery<(Project & { client: Client | null })[]>({
    queryKey: ["/api/stats/financial/projects", activeFilter],
    queryFn: () => fetch(`/api/stats/financial/projects?filter=${activeFilter}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!activeFilter,
  });

  const recentProjects = projects.slice(0, 5);

  const homologados = stats?.byStatus?.homologado ?? 0;
  const emAndamento = Object.entries(stats?.byStatus || {})
    .filter(([s]) => !["orcamento", "homologado", "cancelado", "finalizado"].includes(s))
    .reduce((sum, [, v]) => sum + v, 0);

  const projectsByStatus = activeStatus
    ? projects.filter(p => p.status === activeStatus)
    : [];

  const attentionProjects = projects.filter(p =>
    p.status === "aprovado_pagamento_pendente" || p.status === "cancelado"
  );

  const barData = STATUS_ORDER
    .filter(s => s !== "cancelado")
    .map(status => ({
      name: STATUS_LABELS[status],
      value: stats?.byStatus?.[status] ?? 0,
      color: STATUS_COLORS[status],
      status,
    }))
    .filter(d => d.value > 0);

  const quickActions = [
    { title: "Novo Projeto", desc: "Cadastrar projeto", href: "/projetos", icon: Plus, color: "text-primary bg-primary/10" },
    { title: "Kanban", desc: "Ver quadro visual", href: "/kanban", icon: KanbanSquare, color: "text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/30" },
    { title: "Clientes", desc: "Gerenciar integradores", href: "/clientes", icon: Users, color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30" },
    ...(user?.role === "admin" || user?.role === "financeiro" ? [
      { title: "Configurações", desc: "Ajustar sistema", href: "/configuracoes", icon: Settings, color: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800" },
    ] : []),
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header + Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe projetos e homologações em tempo real</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {quickActions.map(action => (
            <Link key={action.title} href={action.href}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover-elevate cursor-pointer transition-all" data-testid={`button-quick-${action.title.toLowerCase().replace(/\s/g, "-")}`}>
                <div className={`h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 ${action.color}`}>
                  <action.icon className="h-3.5 w-3.5" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold leading-none">{action.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{action.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Atenção Necessária */}
      {!projectsLoading && attentionProjects.length > 0 && (
        <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/15 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
              {attentionProjects.length} projeto{attentionProjects.length !== 1 ? "s" : ""} precisam de atenção
            </p>
          </div>
          <div className="space-y-2">
            {attentionProjects.slice(0, 3).map(p => (
              <Link key={p.id} href={`/projetos`}>
                <div className="flex items-center gap-3 bg-white dark:bg-orange-900/20 rounded-lg px-3 py-2.5 border border-orange-100 dark:border-orange-800/50 hover:border-orange-300 dark:hover:border-orange-600 transition-colors cursor-pointer" data-testid={`card-attention-${p.id}`}>
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[p.status] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.client?.name || "—"}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE_STYLES[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                </div>
              </Link>
            ))}
            {attentionProjects.length > 3 && (
              <p className="text-xs text-orange-600 dark:text-orange-400 text-right">
                + {attentionProjects.length - 3} mais
              </p>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Total de Projetos</p>
                {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold" data-testid="text-total-projects">{stats?.totalProjects ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">projetos cadastrados</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Clientes</p>
                {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold" data-testid="text-total-clients">{stats?.totalClients ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">integradores ativos</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Em Andamento</p>
                {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-in-progress-projects">
                    {emAndamento}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">em processo ativo</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Homologados</p>
                {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-homologated-projects">
                    {homologados}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">conexões aprovadas</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Stats */}
      {canSeeFinancial && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Resumo Financeiro
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: "today" as FinancialFilter, label: "Receita Hoje", value: formatBRL(finStats?.todayTotal), icon: TrendingUp, color: "text-green-500", border: "border-green-200 dark:border-green-800", textColor: "text-green-600 dark:text-green-400" },
              { key: "month" as FinancialFilter, label: "Receita do Mês", value: formatBRL(finStats?.monthTotal), icon: DollarSign, color: "text-blue-500", border: "border-blue-200 dark:border-blue-800", textColor: "text-blue-600 dark:text-blue-400" },
              { key: "paid" as FinancialFilter, label: "Projetos Pagos", value: String(finStats?.paidCount ?? 0), icon: BadgeCheck, color: "text-violet-500", border: "border-violet-200 dark:border-violet-800", textColor: "text-violet-600 dark:text-violet-400" },
              { key: "pending" as FinancialFilter, label: "A Receber", value: formatBRL(finStats?.pendingTotal), icon: Hourglass, color: "text-orange-500", border: "border-orange-200 dark:border-orange-800", textColor: "text-orange-600 dark:text-orange-400" },
            ].map(item => (
              <Card
                key={item.key}
                className={`hover-elevate ${item.border} cursor-pointer group`}
                onClick={() => setActiveFilter(item.key)}
                data-testid={`card-fin-${item.key}`}
              >
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{item.label}</p>
                      {finLoading ? <Skeleton className="h-7 w-24" /> : (
                        <div className={`text-2xl font-bold ${item.textColor}`}>{item.value}</div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        ver projetos <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                    </div>
                    <div className={`h-9 w-9 rounded-lg bg-current/10 flex items-center justify-center flex-shrink-0 opacity-20`} style={{ opacity: 0.15 }}>
                      <item.icon className={`h-4 w-4 ${item.color}`} style={{ opacity: 1 }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sheet: financial filter */}
      <Sheet open={!!activeFilter} onOpenChange={(o) => { if (!o) setActiveFilter(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              {activeFilter ? FILTER_LABELS[activeFilter] : ""}
            </SheetTitle>
          </SheetHeader>
          {filterLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filterProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Nenhum projeto encontrado</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                {filterProjects.length} projeto{filterProjects.length !== 1 ? "s" : ""} · Total:{" "}
                <span className="font-semibold text-foreground">
                  {formatBRL(filterProjects.reduce((s, p) => {
                    const v = p.valor ? parseFloat(String(p.valor).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;
                    return s + v;
                  }, 0))}
                </span>
              </p>
              {filterProjects.map(p => <ProjectRow key={p.id} project={p} />)}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet: projects by status */}
      <Sheet open={!!activeStatus} onOpenChange={(o) => { if (!o) setActiveStatus(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              {activeStatus && (() => {
                const Icon = STATUS_ICONS[activeStatus] || Clock;
                return <Icon className="h-5 w-5" style={{ color: STATUS_COLORS[activeStatus] }} />;
              })()}
              {activeStatus ? STATUS_LABELS[activeStatus] : ""}
            </SheetTitle>
          </SheetHeader>
          {projectsByStatus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Nenhum projeto neste status</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                {projectsByStatus.length} projeto{projectsByStatus.length !== 1 ? "s" : ""} em{" "}
                <span className="font-semibold" style={{ color: activeStatus ? STATUS_COLORS[activeStatus] : undefined }}>
                  {activeStatus ? STATUS_LABELS[activeStatus] : ""}
                </span>
              </p>
              {projectsByStatus.map(p => (
                <ProjectRow key={p.id} project={p} linkTo={`/projetos`} />
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Fluxo de Homologação — clicável */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Fluxo de Homologação</CardTitle>
            <p className="text-xs text-muted-foreground">Clique em uma etapa para ver os projetos</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            {STATUS_ORDER.filter(s => s !== "cancelado").map((status, i, arr) => {
              const count = stats?.byStatus?.[status] ?? 0;
              const Icon = STATUS_ICONS[status] || Clock;
              const isClickable = count > 0;
              return (
                <div key={status} className="flex items-center gap-2">
                  <button
                    onClick={() => isClickable && setActiveStatus(status)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border min-w-[88px] transition-all ${
                      isClickable
                        ? "border-border bg-card hover:shadow-md hover:-translate-y-0.5 cursor-pointer hover:border-primary/30"
                        : "border-border/40 bg-card/50 cursor-default opacity-50"
                    }`}
                    disabled={!isClickable}
                    data-testid={`flow-step-${status}`}
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center transition-all"
                      style={{ backgroundColor: `${STATUS_COLORS[status]}20` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: STATUS_COLORS[status] }} />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{STATUS_LABELS[status]}</span>
                    {statsLoading ? (
                      <Skeleton className="h-5 w-8 rounded" />
                    ) : (
                      <span
                        className="text-lg font-bold flex items-center gap-1"
                        style={{ color: count > 0 ? STATUS_COLORS[status] : undefined }}
                      >
                        {count}
                        {isClickable && <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />}
                      </span>
                    )}
                  </button>
                  {i < arr.length - 1 && (
                    <div className="text-muted-foreground/40 text-lg font-light hidden sm:block">›</div>
                  )}
                </div>
              );
            })}

            {/* Cancelados separados */}
            {(stats?.byStatus?.cancelado ?? 0) > 0 && (
              <>
                <div className="hidden sm:flex items-center px-2 text-muted-foreground/30">·</div>
                <button
                  onClick={() => setActiveStatus("cancelado")}
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 min-w-[88px] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  data-testid="flow-step-cancelado"
                >
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${STATUS_COLORS.cancelado}20` }}>
                    <XCircle className="h-4 w-4" style={{ color: STATUS_COLORS.cancelado }} />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">Cancelado</span>
                  <span className="text-lg font-bold" style={{ color: STATUS_COLORS.cancelado }}>
                    {stats?.byStatus?.cancelado ?? 0}
                  </span>
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
            <p className="text-xs text-muted-foreground">Clique nas barras para ver os projetos</p>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2 py-4">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : barData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-sm">Nenhum projeto ainda</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                  onClick={(d) => {
                    if (d?.activePayload?.[0]?.payload?.status) {
                      setActiveStatus(d.activePayload[0].payload.status);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    formatter={(v: number) => [v, "projetos"]}
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Projetos Recentes */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Projetos Recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projetos">
                Ver todos <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <FolderOpen className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">Nenhum projeto cadastrado</p>
                <Button asChild className="mt-4" size="sm" variant="outline">
                  <Link href="/clientes">Cadastrar primeiro projeto</Link>
                </Button>
              </div>
            ) : (
              <div>
                {recentProjects.map((project) => (
                  <ProjectRow key={project.id} project={project} linkTo="/projetos" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
