import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FolderOpen, ShieldCheck, Clock, Zap, ChevronRight, FileText } from "lucide-react";
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
  finalizado: "Finalizado",
  cancelado: "Cancelado",
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
  finalizado: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_COLORS: Record<string, string> = {
  orcamento: "#94a3b8", aprovado_pagamento_pendente: "#eab308",
  projeto_tecnico: "#3b82f6", aguardando_art: "#8b5cf6",
  protocolado: "#7c3aed", parecer_acesso: "#f59e0b",
  instalacao: "#f97316", vistoria: "#06b6d4",
  projeto_aprovado: "#10b981", homologado: "#22c55e",
  finalizado: "#1e3a5f", cancelado: "#ef4444",
};

type ProjectWithClient = Project & { client: Client | null };

export default function PortalHomePage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({ queryKey: ["/api/projects"] });

  const active = projects.filter(p => p.status !== "cancelado" && p.status !== "homologado").length;
  const homologados = projects.filter(p => p.status === "homologado").length;

  return (
    <div className="px-4 py-5 md:p-6 space-y-4 md:space-y-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" data-testid="text-portal-welcome">
            Olá, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Acompanhe seus projetos de homologação</p>
        </div>
        <Button asChild className="hidden md:flex" data-testid="button-new-project-portal">
          <Link href="/portal/novo-projeto">
            <Plus className="h-4 w-4 mr-2" /> Solicitar Projeto
          </Link>
        </Button>
      </div>

      {/* Mobile quick action */}
      <Link href="/portal/novo-projeto" className="md:hidden block">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary text-primary-foreground shadow-md active:scale-[0.98] transition-transform" data-testid="button-mobile-quick-new">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Solicitar Novo Projeto</p>
            <p className="text-xs opacity-80">Toque para começar</p>
          </div>
          <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
        </div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3 text-center md:text-left">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold" data-testid="text-portal-total">{projects.length}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3 text-center md:text-left">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-portal-active">{active}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3 text-center md:text-left">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-portal-homologados">{homologados}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">Homologados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base">Meus Projetos</CardTitle>
            {projects.length > 5 && (
              <p className="text-xs text-muted-foreground mt-0.5">Mostrando 5 de {projects.length}</p>
            )}
          </div>
          <Button variant="outline" size="sm" asChild data-testid="link-all-projects" className="gap-1">
            <Link href="/portal/projetos">Ver todos ({projects.length}) <ChevronRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Você ainda não tem projetos</p>
              <p className="text-sm mt-1">Solicite seu primeiro projeto de homologação</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/portal/novo-projeto">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Solicitar Projeto
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map(project => (
                <Link key={project.id} href={`/portal/projetos/${project.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card cursor-pointer hover-elevate" data-testid={`card-portal-project-${project.id}`}>
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[project.status] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {(project as any).ticketNumber && (
                          <span className="text-xs font-mono text-primary font-semibold">{(project as any).ticketNumber}</span>
                        )}
                        <p className="text-sm font-medium truncate">{project.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {project.potencia ? `${project.potencia} kWp` : ""}
                        {project.concessionaria ? ` · ${project.concessionaria}` : ""}
                        {project.numeroProtocolo ? ` · Prot. ${project.numeroProtocolo}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE_STYLES[project.status]}`}>
                        {STATUS_LABELS[project.status]}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona o processo de homologação?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: "01", title: "Envio de Documentos", desc: "Você envia os documentos necessários pelo portal", icon: FileText },
              { num: "02", title: "Projeto Técnico", desc: "Nossa equipe elabora o projeto elétrico e memória de cálculo", icon: Zap },
              { num: "03", title: "Protocolo", desc: "Protocolamos junto à concessionária de energia", icon: FolderOpen },
              { num: "04", title: "Homologação", desc: "Após aprovação e vistoria, o sistema é homologado", icon: ShieldCheck },
            ].map(step => (
              <div key={step.num} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">{step.num}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <step.icon className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
