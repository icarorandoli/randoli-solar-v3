import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  FolderOpen, Users, CheckCircle, Clock, Zap, AlertCircle,
  XCircle, FileText, ClipboardList, Wrench, Eye, ShieldCheck,
  DollarSign, TrendingUp, BadgeCheck, Hourglass, ChevronRight,
  KanbanSquare, Plus, Settings,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { Project, Client } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

interface Stats {
  totalProjects: number;
  totalClients: number;
  byStatus: Record<string, number>;
}

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

const STATUS_ORDER = ["orcamento", "aprovado_pagamento_pendente", "projeto_tecnico", "aguardando_art", "protocolado", "parecer_acesso", "instalacao", "vistoria", "projeto_aprovado", "homologado", "finalizado", "cancelado"];

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

function ProjectRow({ project }: { project: Project & { client: Client | null } }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
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
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FinancialFilter | null>(null);

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

  const pieData = Object.entries(stats?.byStatus || {})
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || "#94a3b8",
    }));

  const recentProjects = projects.slice(0, 5);
  const homologados = stats?.byStatus?.homologado ?? 0;
  const emAndamento = Object.entries(stats?.byStatus || {})
    .filter(([s]) => !["orcamento", "homologado", "cancelado"].includes(s))
    .reduce((sum, [, v]) => sum + v, 0);

  const quickActions = [
    { title: "Novo Projeto", desc: "Cadastrar projeto", href: "/clientes", icon: Plus, color: "text-primary bg-primary/10" },
    { title: "Kanban", desc: "Ver quadro visual", href: "/kanban", icon: KanbanSquare, color: "text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/30" },
    { title: "Clientes", desc: "Gerenciar integradores", href: "/clientes", icon: Users, color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30" },
    ...(user?.role === "admin" || user?.role === "financeiro" ? [
      { title: "Configurações", desc: "Ajustar sistema", href: "/configuracoes", icon: Settings, color: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800" },
    ] : []),
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe projetos e homologações em tempo real</p>
        </div>
        {/* Quick Actions */}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Projetos</CardTitle>
            <FolderOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold" data-testid="text-total-projects">{stats?.totalProjects ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">projetos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold" data-testid="text-total-clients">{stats?.totalClients ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">integradores ativos</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-in-progress-projects">
                {emAndamento}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">em processo junto à concessionária</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Homologados</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-homologated-projects">
                {homologados}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">conexões aprovadas</p>
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
            <Card
              className="hover-elevate border-green-200 dark:border-green-800 cursor-pointer group"
              onClick={() => setActiveFilter("today")}
              data-testid="card-fin-today"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receita Hoje</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {finLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-today-total">
                    {formatBRL(finStats?.todayTotal)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  pagamentos recebidos hoje <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </CardContent>
            </Card>

            <Card
              className="hover-elevate border-blue-200 dark:border-blue-800 cursor-pointer group"
              onClick={() => setActiveFilter("month")}
              data-testid="card-fin-month"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receita do Mês</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {finLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-month-total">
                    {formatBRL(finStats?.monthTotal)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  faturamento no mês atual <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </CardContent>
            </Card>

            <Card
              className="hover-elevate border-violet-200 dark:border-violet-800 cursor-pointer group"
              onClick={() => setActiveFilter("paid")}
              data-testid="card-fin-paid"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Projetos Pagos</CardTitle>
                <BadgeCheck className="h-4 w-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                {finLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-2xl font-bold text-violet-600 dark:text-violet-400" data-testid="text-paid-count">
                    {finStats?.paidCount ?? 0}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  pagamento confirmado <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </CardContent>
            </Card>

            <Card
              className="hover-elevate border-orange-200 dark:border-orange-800 cursor-pointer group"
              onClick={() => setActiveFilter("pending")}
              data-testid="card-fin-pending"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
                <Hourglass className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                {finLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-pending-total">
                    {formatBRL(finStats?.pendingTotal)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  pagamentos pendentes <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Sheet: Lista de projetos filtrados */}
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
              {activeFilter !== "paid" && activeFilter !== "today" && activeFilter !== "month" && (
                <p className="text-sm text-muted-foreground mb-3">
                  {filterProjects.length} projeto{filterProjects.length !== 1 ? "s" : ""} · Total:{" "}
                  <span className="font-semibold text-foreground">
                    {formatBRL(filterProjects.reduce((s, p) => {
                      const v = p.valor ? parseFloat(String(p.valor).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;
                      return s + v;
                    }, 0))}
                  </span>
                </p>
              )}
              {(activeFilter === "paid" || activeFilter === "today" || activeFilter === "month") && (
                <p className="text-sm text-muted-foreground mb-3">
                  {filterProjects.length} projeto{filterProjects.length !== 1 ? "s" : ""} · Total pago:{" "}
                  <span className="font-semibold text-foreground">
                    {formatBRL(filterProjects.reduce((s, p) => {
                      const v = p.valor ? parseFloat(String(p.valor).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;
                      return s + v;
                    }, 0))}
                  </span>
                </p>
              )}
              {filterProjects.map(p => <ProjectRow key={p.id} project={p} />)}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Fluxo de Homologação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fluxo de Homologação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            {STATUS_ORDER.filter(s => s !== "cancelado").map((status, i, arr) => {
              const count = stats?.byStatus?.[status] ?? 0;
              const Icon = STATUS_ICONS[status] || Clock;
              return (
                <div key={status} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-card min-w-[90px]" data-testid={`flow-step-${status}`}>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${STATUS_COLORS[status]}20` }}>
                      <Icon className="h-4 w-4" style={{ color: STATUS_COLORS[status] }} />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{STATUS_LABELS[status]}</span>
                    {statsLoading ? (
                      <Skeleton className="h-5 w-8 rounded" />
                    ) : (
                      <span className="text-lg font-bold" style={{ color: count > 0 ? STATUS_COLORS[status] : undefined }}>
                        {count}
                      </span>
                    )}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="text-muted-foreground/40 text-lg font-light hidden sm:block">›</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            ) : pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-sm">Nenhum projeto ainda</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, "projetos"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Projetos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projetos Recentes</CardTitle>
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
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/40" data-testid={`card-project-${project.id}`}>
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[project.status] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{project.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.client?.name || "—"}
                        {project.concessionaria ? ` · ${project.concessionaria}` : ""}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${STATUS_BADGE_STYLES[project.status]}`}>
                      {STATUS_LABELS[project.status] || project.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
