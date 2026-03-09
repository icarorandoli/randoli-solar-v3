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
    <div className={`flex items-start gap-4 p-4 border-b border-border/40 last:border-0 ${linkTo ? "hover-elevate rounded-xl transition-all cursor-pointer group" : ""}`}>
      <div className="mt-1 flex-shrink-0">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm border border-border/50 ${STATUS_BADGE_STYLES[project.status].split(' ')[0]}`}>
          {(() => {
            const Icon = STATUS_ICONS[project.status] || Clock;
            return <Icon className="h-5 w-5" />;
          })()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">{project.title}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap ${STATUS_BADGE_STYLES[project.status]}`}>
            {STATUS_LABELS[project.status] || project.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate font-medium">
          {project.client?.name || "—"}
          {project.concessionaria ? ` · ${project.concessionaria}` : ""}
        </p>
        {project.updatedAt && (
          <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Atualizado em {new Date(project.updatedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0 self-center">
        {project.valor && (
          <span className="text-sm font-black text-foreground tracking-tight">{formatBRL(project.valor)}</span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
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
    { title: "Novo Projeto", desc: "Cadastrar projeto", href: "/projetos", icon: Plus, variant: "default" as const },
    { title: "Projetos", desc: "Ver lista", href: "/projetos", icon: FolderOpen, variant: "outline" as const },
    { title: "Kanban", desc: "Fluxo de trabalho", href: "/kanban", icon: KanbanSquare, variant: "outline" as const },
    { title: "Integradores", desc: "Gerenciar parceiros", href: "/clientes", icon: Users, variant: "outline" as const },
    ...(user?.role === "admin" || user?.role === "financeiro" ? [
      { title: "Configurações", desc: "Ajustar sistema", href: "/configuracoes", icon: Settings, variant: "outline" as const },
    ] : []),
  ];

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-[1600px] mx-auto">
      {/* Header + Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight" data-testid="text-page-title">Dashboard</h1>
              <p className="text-muted-foreground text-sm font-medium">Controle de Homologações e Desempenho Operacional</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-3">
          {quickActions.map(action => (
            <Link key={action.title} href={action.href}>
              <Button 
                variant={action.variant}
                className={`gap-2 h-12 px-5 font-bold shadow-sm rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto ${
                  action.variant === "default" ? "bg-primary hover:bg-primary/90" : "bg-card border-border/50 hover:bg-accent/50"
                }`}
                data-testid={`button-quick-${action.title.toLowerCase().replace(/\s/g, "-")}`}
              >
                <action.icon className="h-4 w-4" />
                <span>{action.title}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Atenção Necessária */}
      {!projectsLoading && attentionProjects.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/20 flex items-center justify-center shadow-inner border border-amber-500/30">
                <AlertCircle className="h-7 w-7 text-amber-600 dark:text-amber-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">Ação Requerida</h2>
                <p className="text-sm font-semibold text-amber-800/70 dark:text-amber-200/60">
                  {attentionProjects.length} projeto{attentionProjects.length !== 1 ? "s" : ""} {attentionProjects.length === 1 ? "precisa" : "precisam"} da sua atenção imediata
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3 overflow-hidden p-1">
                {attentionProjects.slice(0, 3).map((p, i) => (
                  <div key={p.id} className="inline-block h-10 w-10 rounded-xl ring-2 ring-background bg-card shadow-md flex items-center justify-center border border-border" title={p.title}>
                    <p className="text-[10px] font-black">{p.title.substring(0, 2).toUpperCase()}</p>
                  </div>
                ))}
              </div>
              <Link href="/projetos">
                <Button variant="outline" size="sm" className="rounded-xl font-bold bg-background/50 backdrop-blur-sm border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 h-10 px-4">
                  Resolver Agora <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          {/* Subtle background pattern */}
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Zap className="h-24 w-24 text-amber-500" />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Total Projetos", 
            value: stats?.totalProjects ?? 0, 
            sub: "Projetos gerenciados", 
            icon: FolderOpen, 
            color: "text-blue-600 dark:text-blue-400", 
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            gradient: "from-blue-500/5 to-transparent",
            testId: "text-total-projects"
          },
          { 
            label: "Integradores", 
            value: stats?.totalClients ?? 0, 
            sub: "Parceiros vinculados", 
            icon: Users, 
            color: "text-indigo-600 dark:text-indigo-400", 
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/20",
            gradient: "from-indigo-500/5 to-transparent",
            testId: "text-total-clients"
          },
          { 
            label: "Em Andamento", 
            value: emAndamento, 
            sub: "Fases operacionais", 
            icon: Zap, 
            color: "text-amber-600 dark:text-amber-400", 
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            gradient: "from-amber-500/5 to-transparent",
            testId: "text-in-progress-projects"
          },
          { 
            label: "Homologados", 
            value: homologados, 
            sub: "Conexões finalizadas", 
            icon: ShieldCheck, 
            color: "text-emerald-600 dark:text-emerald-400", 
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            gradient: "from-emerald-500/5 to-transparent",
            testId: "text-homologated-projects"
          }
        ].map((kpi, idx) => (
          <Card key={idx} className={`group hover-elevate border-none bg-card shadow-md shadow-black/5 overflow-hidden rounded-2xl`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${kpi.gradient.replace('to-transparent', kpi.color.split(' ')[0].replace('text-', 'bg-'))} opacity-40`} />
            <CardContent className="p-7 relative overflow-hidden">
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-2">{kpi.label}</p>
                  {statsLoading ? <Skeleton className="h-10 w-20 bg-muted/50 rounded-lg" /> : (
                    <div className={`text-4xl font-black tracking-tighter ${kpi.color} drop-shadow-sm`} data-testid={kpi.testId}>{kpi.value}</div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[11px] font-bold text-muted-foreground/70">{kpi.sub}</span>
                  </div>
                </div>
                <div className={`h-14 w-14 rounded-2xl ${kpi.bg} flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                  <kpi.icon className={`h-7 w-7 ${kpi.color}`} />
                </div>
              </div>
              {/* Subtle background gradient */}
              <div className={`absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${kpi.gradient} blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-500`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Stats */}
      {canSeeFinancial && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">Performance Financeira</h2>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Fluxo de Caixa e Previsibilidade</p>
              </div>
            </div>
            <div className="h-[2px] flex-1 mx-8 bg-gradient-to-r from-border/50 via-border/10 to-transparent hidden md:block" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { key: "today" as FinancialFilter, label: "Receita Hoje", value: formatBRL(finStats?.todayTotal), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { key: "month" as FinancialFilter, label: "Faturamento Mês", value: formatBRL(finStats?.monthTotal), icon: DollarSign, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
              { key: "paid" as FinancialFilter, label: "Projetos Pagos", value: String(finStats?.paidCount ?? 0), icon: BadgeCheck, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
              { key: "pending" as FinancialFilter, label: "A Receber", value: formatBRL(finStats?.pendingTotal), icon: Hourglass, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
            ].map(item => (
              <Card
                key={item.key}
                className={`group hover-elevate cursor-pointer border border-border/50 bg-card shadow-lg shadow-black/5 overflow-hidden rounded-2xl transition-all hover:border-primary/30`}
                onClick={() => setActiveFilter(item.key)}
                data-testid={`card-fin-${item.key}`}
              >
                <CardContent className="p-7 relative overflow-hidden">
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">{item.label}</p>
                      {finLoading ? <Skeleton className="h-9 w-32 bg-muted/50 rounded-lg" /> : (
                        <div className={`text-2xl font-black tracking-tight ${item.color} drop-shadow-sm`}>{item.value}</div>
                      )}
                      <div className="flex items-center gap-1.5 mt-4 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0 duration-300">
                        <span className="text-xs font-black text-foreground uppercase tracking-wider">Analisar Fluxo</span>
                        <ChevronRight className="h-3 w-3 text-primary animate-bounce-x" />
                      </div>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 shadow-inner group-hover:rotate-12 transition-transform duration-300`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-black text-foreground tracking-tight uppercase">Atividades Recentes</h2>
            </div>
            <Link href="/projetos">
              <Button variant="ghost" size="sm" className="font-black text-[11px] text-primary uppercase tracking-widest hover:bg-primary/10 px-4 rounded-xl">
                Listagem Completa <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <Card className="border-none bg-card shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {projectsLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="p-6 flex gap-4">
                      <Skeleton className="h-12 w-12 rounded-2xl bg-muted/50" />
                      <div className="space-y-3 flex-1">
                        <Skeleton className="h-4 w-1/3 bg-muted/50 rounded-full" />
                        <Skeleton className="h-3 w-1/4 bg-muted/50 rounded-full" />
                      </div>
                    </div>
                  ))
                ) : recentProjects.length === 0 ? (
                  <div className="py-24 text-center">
                    <div className="h-20 w-20 rounded-3xl bg-muted/30 flex items-center justify-center mx-auto mb-6">
                      <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <p className="font-black text-muted-foreground uppercase tracking-[0.2em]">Sem Atividade Recente</p>
                    <p className="text-xs text-muted-foreground/60 mt-2 font-semibold">Os novos projetos aparecerão aqui automaticamente.</p>
                  </div>
                ) : (
                  recentProjects.map(p => (
                    <ProjectRow key={p.id} project={p} linkTo={`/projetos`} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <KanbanSquare className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-black text-foreground tracking-tight uppercase">Saúde do Funil</h2>
          </div>
          <Card className="border-none bg-card shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 px-7 pt-7">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">Carga de Trabalho por Etapa</CardTitle>
            </CardHeader>
            <CardContent className="p-7 pt-0">
              <div className="h-[300px] w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: -30, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 9, fontWeight: 800, fill: 'currentColor', opacity: 0.6 }} 
                      width={120}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--primary)/0.03)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover/90 backdrop-blur-md border border-border px-4 py-3 rounded-2xl shadow-2xl animate-in zoom-in-95 ring-1 ring-black/5">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{data.name}</p>
                              <div className="flex items-end gap-2">
                                <span className="text-2xl font-black tracking-tighter" style={{ color: data.color }}>{data.value}</span>
                                <span className="text-[10px] font-bold text-muted-foreground/60 mb-1 uppercase">Projetos Ativos</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} className="transition-all hover:fill-opacity-100" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 space-y-3">
                {barData.slice(0, 5).map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full shadow-sm ring-2 ring-background" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] font-black text-muted-foreground/80 uppercase tracking-tight group-hover:text-foreground transition-colors">{d.name}</span>
                    </div>
                    <span className="text-xs font-black text-foreground bg-muted/50 px-2 py-0.5 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-all">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fluxo de Homologação — Stepper Visual */}
      <div className="space-y-6 pt-10">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
              <BadgeCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">Fluxo Operacional</h2>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Métricas por Estágio de Homologação</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/30">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sistema Online</span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-4 overflow-x-auto pb-10 pt-4 scrollbar-hide no-scrollbar -mx-4 px-4 mask-fade-right">
            {STATUS_ORDER.filter(s => s !== "cancelado").map((status, i) => {
              const count = stats?.byStatus?.[status] ?? 0;
              const Icon = STATUS_ICONS[status] || Clock;
              const isClickable = count > 0;
              const isActive = activeStatus === status;
              return (
                <div key={status} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => isClickable && setActiveStatus(status)}
                    className={`relative flex flex-col items-center gap-4 p-6 rounded-[2.5rem] border-2 transition-all duration-500 w-[160px] shadow-lg group overflow-hidden ${
                      isActive
                        ? "bg-primary border-primary shadow-primary/30 scale-105 z-10"
                        : isClickable
                          ? "bg-card border-border/50 hover:border-primary/50 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
                          : "bg-card/40 border-border/20 cursor-default opacity-40 grayscale pointer-events-none"
                    }`}
                    disabled={!isClickable}
                    data-testid={`flow-step-${status}`}
                  >
                    {/* Step number background */}
                    <div className={`absolute -top-4 -right-4 text-8xl font-black opacity-[0.03] select-none transition-all duration-500 group-hover:scale-125 ${isActive ? "text-white" : "text-foreground"}`}>
                      {i + 1}
                    </div>
                    
                    <div
                      className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-inner ring-4 ${
                        isActive 
                          ? "bg-white/20 ring-white/10" 
                          : "bg-muted ring-transparent group-hover:bg-primary/10 group-hover:ring-primary/5"
                      }`}
                    >
                      <Icon className={`h-8 w-8 transition-all duration-500 ${isActive ? "text-white" : "text-primary group-hover:scale-110"}`} />
                    </div>
                    
                    <div className="text-center relative z-10">
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-tight h-8 flex items-center justify-center transition-colors duration-500 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`}>
                        {STATUS_LABELS[status]}
                      </p>
                      <div className={`mt-3 inline-flex items-center justify-center h-8 w-12 rounded-2xl font-black text-sm transition-all duration-500 ${
                        isActive 
                          ? "bg-white text-primary shadow-lg" 
                          : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                      }`}>
                        {count}
                      </div>
                    </div>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute bottom-1 w-12 h-1.5 bg-white rounded-full" />
                    )}
                  </button>
                  {i < STATUS_ORDER.filter(s => s !== "cancelado").length - 1 && (
                    <div className="flex-shrink-0 w-8 h-px bg-gradient-to-r from-border/50 to-transparent relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ChevronRight className="h-3 w-3 text-border/40" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sheets remain same for functionality */}
      <Sheet open={!!activeFilter} onOpenChange={(o) => { if (!o) setActiveFilter(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-l-4 border-l-primary">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              {activeFilter ? FILTER_LABELS[activeFilter] : ""}
            </SheetTitle>
          </SheetHeader>
          {filterLoading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : filterProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed">
              <FolderOpen className="h-16 w-16 mb-4 opacity-10" />
              <p className="font-bold text-lg uppercase tracking-tighter opacity-40">Nenhum projeto encontrado</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Resumo da Seleção</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-foreground">
                    {formatBRL(filterProjects.reduce((s, p) => {
                      const v = p.valor ? parseFloat(String(p.valor).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;
                      return s + v;
                    }, 0))}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">({filterProjects.length} projeto{filterProjects.length !== 1 ? "s" : ""})</span>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {filterProjects.map(p => <ProjectRow key={p.id} project={p} />)}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!activeStatus} onOpenChange={(o) => { if (!o) setActiveStatus(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-l-4" style={{ borderLeftColor: activeStatus ? STATUS_COLORS[activeStatus] : undefined }}>
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
              {activeStatus && (() => {
                const Icon = STATUS_ICONS[activeStatus] || Clock;
                return (
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-inner" style={{ backgroundColor: `${STATUS_COLORS[activeStatus]}15` }}>
                    <Icon className="h-6 w-6" style={{ color: STATUS_COLORS[activeStatus] }} />
                  </div>
                );
              })()}
              {activeStatus ? STATUS_LABELS[activeStatus] : ""}
            </SheetTitle>
          </SheetHeader>
          {projectsByStatus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed">
              <FolderOpen className="h-16 w-16 mb-4 opacity-10" />
              <p className="font-bold text-lg uppercase tracking-tighter opacity-40">Nenhum projeto neste status</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl p-5 border" style={{ backgroundColor: activeStatus ? `${STATUS_COLORS[activeStatus]}05` : undefined, borderColor: activeStatus ? `${STATUS_COLORS[activeStatus]}15` : undefined }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: activeStatus ? STATUS_COLORS[activeStatus] : undefined }}>Status Atual</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-foreground">{projectsByStatus.length}</span>
                  <span className="text-sm font-semibold text-muted-foreground">projeto{projectsByStatus.length !== 1 ? "s" : ""} em {activeStatus ? STATUS_LABELS[activeStatus] : ""}</span>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {projectsByStatus.map(p => (
                  <ProjectRow key={p.id} project={p} linkTo={`/projetos`} />
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
