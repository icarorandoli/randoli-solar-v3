import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Plus, FolderOpen, ShieldCheck, Clock, Zap, ChevronRight, ArrowRight,
  MessageCircle, Building, TrendingUp, CheckCircle2, AlertCircle, Download,
} from "lucide-react";
import type { Project, Client } from "@shared/schema";

const STATUS_LABELS: Record<string, string> = {
  orcamento: "Orçamento",
  aprovado_pagamento_pendente: "Pag. Pendente",
  projeto_tecnico: "Projeto Técnico",
  aguardando_art: "Aguardando ART",
  protocolado: "Protocolado",
  parecer_acesso: "Parecer de Acesso",
  instalacao: "Em Instalação",
  vistoria: "Aguardando Vistoria",
  projeto_aprovado: "Projeto Aprovado",
  homologado: "Homologado",
  finalizado: "Concluído",
  cancelado: "Cancelado",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  orcamento: "bg-slate-400",
  aprovado_pagamento_pendente: "bg-yellow-500",
  projeto_tecnico: "bg-blue-500",
  aguardando_art: "bg-violet-500",
  protocolado: "bg-purple-500",
  parecer_acesso: "bg-amber-500",
  instalacao: "bg-orange-500",
  vistoria: "bg-cyan-500",
  projeto_aprovado: "bg-emerald-500",
  homologado: "bg-green-500",
  finalizado: "bg-green-600",
  cancelado: "bg-red-500",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
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
  finalizado: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_ORDER = [
  "orcamento", "aprovado_pagamento_pendente", "projeto_tecnico",
  "aguardando_art", "protocolado", "parecer_acesso",
  "instalacao", "vistoria", "projeto_aprovado", "homologado", "finalizado",
];

function getProjectProgress(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / STATUS_ORDER.length) * 100);
}

type ProjectWithClient = Project & { client: Client | null };

export default function PortalHomePage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({ queryKey: ["/api/projects"] });
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings/public"], retry: false });
  const supportWhatsappUrl = settings?.support_whatsapp_url || "https://wa.me/seunumerowhatsapp";
  const supportButtonText = settings?.support_button_text || "Falar com Suporte";

  const active = projects.filter(p => p.status !== "cancelado" && p.status !== "homologado" && p.status !== "finalizado").length;
  const homologados = projects.filter(p => p.status === "homologado" || p.status === "finalizado").length;
  const firstName = user?.name?.split(" ")[0] || "Parceiro";

  const recentProjects = projects.slice(0, 5);
  const activeProjects = projects.filter(p => p.status !== "cancelado" && p.status !== "finalizado" && p.status !== "homologado");

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1" data-testid="text-portal-greeting">
            Bem-vindo de volta
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-portal-welcome">
            {firstName}
          </h1>
        </div>
        <Button asChild className="font-semibold gap-2 h-10 px-5 shadow-sm" data-testid="button-new-project-portal">
          <Link href="/portal/novo-projeto">
            <Plus className="h-4 w-4" /> Novo Projeto
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total de Projetos",
            value: projects.length,
            icon: FolderOpen,
            color: "text-primary",
            bg: "bg-primary/10",
            borderColor: "border-primary/20",
            testId: "text-portal-total",
            href: "/portal/projetos",
          },
          {
            label: "Em Andamento",
            value: active,
            icon: Clock,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10",
            borderColor: "border-amber-500/20",
            testId: "text-portal-active",
            href: "/portal/projetos",
          },
          {
            label: "Homologados",
            value: homologados,
            icon: ShieldCheck,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20",
            testId: "text-portal-homologados",
            href: "/portal/projetos",
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={`border ${stat.borderColor} shadow-none hover:shadow-sm transition-all duration-200 cursor-pointer`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1.5 tracking-tight" data-testid={stat.testId}>{stat.value}</p>
                  </div>
                  <div className={`h-11 w-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Projetos em Andamento
              </h2>
              <div className="space-y-3">
                {activeProjects.slice(0, 3).map(project => {
                  const progress = getProjectProgress(project.status);
                  return (
                    <Link key={project.id} href={`/portal/projetos/${project.id}`}>
                      <Card className="border shadow-none hover:shadow-md transition-all duration-200 cursor-pointer group" data-testid={`card-portal-active-${project.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                {(project as any).ticketNumber && (
                                  <span className="text-[10px] font-mono font-bold text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">{(project as any).ticketNumber}</span>
                                )}
                                <p className="font-semibold truncate text-sm">{project.title}</p>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                {project.potencia && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Zap className="h-3 w-3" /> {project.potencia} kWp
                                  </span>
                                )}
                                {project.concessionaria && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building className="h-3 w-3" /> {project.concessionaria}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className={`text-[10px] font-semibold shrink-0 border-none ${STATUS_BADGE_STYLES[project.status] || "bg-muted text-muted-foreground"}`}>
                              {STATUS_LABELS[project.status] || project.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress value={progress} className="h-1.5 flex-1" />
                            <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{progress}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Todos os Projetos
              </h2>
              {projects.length > 5 && (
                <Button variant="ghost" size="sm" asChild data-testid="link-all-projects" className="text-primary hover:text-primary text-xs font-semibold gap-1 h-7">
                  <Link href="/portal/projetos">Ver todos <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : projects.length === 0 ? (
              <Card className="border-dashed border-2 shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                    <FolderOpen className="h-7 w-7 text-primary/60" />
                  </div>
                  <p className="font-bold text-lg text-foreground">Nenhum projeto ainda</p>
                  <p className="text-sm text-muted-foreground mt-1.5 mb-6 max-w-xs">
                    Comece solicitando seu primeiro projeto de homologação solar.
                  </p>
                  <Button asChild className="font-semibold gap-2 h-10 px-6">
                    <Link href="/portal/novo-projeto">
                      <Plus className="h-4 w-4" /> Criar Primeiro Projeto
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-1.5">
                {recentProjects.map(project => (
                  <Link key={project.id} href={`/portal/projetos/${project.id}`}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`card-portal-project-${project.id}`}>
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[project.status] || "bg-slate-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {(project as any).ticketNumber && (
                            <span className="text-[10px] font-mono text-muted-foreground/70">{(project as any).ticketNumber}</span>
                          )}
                          <p className="font-medium truncate text-sm">{project.title}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground hidden sm:block">
                        {STATUS_LABELS[project.status] || project.status}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="border shadow-none overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-bold text-sm">Precisa de ajuda?</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {settings?.support_description || "Nossa equipe está disponível para auxiliar em qualquer etapa."}
              </p>
              <Button size="sm" className="w-full font-semibold text-xs h-9" asChild>
                <a href={supportWhatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="link-support-whatsapp">
                  {supportButtonText}
                </a>
              </Button>
            </div>
          </Card>

          <Card className="border shadow-none">
            <CardContent className="p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Etapas do Processo
              </h3>
              <div className="space-y-3">
                {[
                  { num: "1", title: "Documentação", desc: "Envio de dados e documentos", icon: FolderOpen },
                  { num: "2", title: "Projeto Técnico", desc: "Elaboração pela engenharia", icon: Zap },
                  { num: "3", title: "Protocolo", desc: "Submissão à concessionária", icon: AlertCircle },
                  { num: "4", title: "Homologação", desc: "Aprovação e conclusão", icon: CheckCircle2 },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 group">
                    <div className="h-7 w-7 rounded-lg bg-primary/8 flex items-center justify-center text-[11px] font-bold text-primary shrink-0 mt-0.5 group-hover:bg-primary/15 transition-colors">
                      {step.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{step.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {settings?.procuracao_url && (
                <a
                  href={settings.procuracao_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40 text-xs text-primary hover:underline font-semibold transition-colors"
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  Baixar Modelo de Procuração
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
