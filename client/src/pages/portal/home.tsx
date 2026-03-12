import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FolderOpen, ShieldCheck, Clock, Zap, ChevronRight, ArrowRight, MessageCircle, Sparkles, Building } from "lucide-react";
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

type ProjectWithClient = Project & { client: Client | null };

export default function PortalHomePage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({ queryKey: ["/api/projects"] });
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings/public"], retry: false });
  const supportWhatsappUrl = settings?.support_whatsapp_url || "https://wa.me/seunumerowhatsapp";

  const active = projects.filter(p => p.status !== "cancelado" && p.status !== "homologado" && p.status !== "finalizado").length;
  const homologados = projects.filter(p => p.status === "homologado" || p.status === "finalizado").length;
  const firstName = user?.name?.split(" ")[0] || "Parceiro";

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-portal-welcome">
            Olá, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe o status das suas homologações solares
          </p>
        </div>
        <Button asChild className="font-semibold gap-2 shadow-sm" data-testid="button-new-project-portal">
          <Link href="/portal/novo-projeto">
            <Plus className="h-4 w-4" /> Novo Projeto
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total de Projetos", value: projects.length, icon: FolderOpen, color: "text-primary", bg: "bg-primary/8", testId: "text-portal-total" },
          { label: "Em Andamento", value: active, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/8", testId: "text-portal-active" },
          { label: "Homologados", value: homologados, icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/8", testId: "text-portal-homologados" },
        ].map((stat) => (
          <Card key={stat.label} className="border shadow-none hover:shadow-sm transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1 tracking-tight" data-testid={stat.testId}>{stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Projetos Recentes</h2>
            <Button variant="ghost" size="sm" asChild data-testid="link-all-projects" className="text-primary hover:text-primary text-xs font-semibold gap-1">
              <Link href="/portal/projetos">Ver todos <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="font-semibold text-foreground">Nenhum projeto ainda</p>
                <p className="text-sm text-muted-foreground mt-1 mb-6">Solicite seu primeiro projeto de homologação.</p>
                <Button asChild size="sm" className="font-semibold gap-2">
                  <Link href="/portal/novo-projeto">
                    <Plus className="h-4 w-4" /> Criar Projeto
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 6).map(project => (
                <Link key={project.id} href={`/portal/projetos/${project.id}`}>
                  <Card className="border shadow-none hover:bg-muted/40 transition-colors cursor-pointer group" data-testid={`card-portal-project-${project.id}`}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[project.status] || "bg-slate-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {(project as any).ticketNumber && (
                            <span className="text-[11px] font-mono text-muted-foreground">{(project as any).ticketNumber}</span>
                          )}
                          <p className="font-medium truncate text-sm">{project.title}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
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
                      <Badge variant="secondary" className="text-[10px] font-semibold shrink-0 hidden sm:flex">
                        {STATUS_LABELS[project.status] || project.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="border shadow-none bg-primary/5 dark:bg-primary/10">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Precisa de ajuda?</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nossa equipe de engenharia está disponível para auxiliar em qualquer etapa do seu projeto.
              </p>
              <Button size="sm" className="w-full font-semibold text-xs" asChild>
                <a href={supportWhatsappUrl} target="_blank" rel="noopener noreferrer">
                  Falar com Suporte
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border shadow-none">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Como funciona</h3>
              <div className="space-y-4">
                {[
                  { num: "1", title: "Documentação", desc: "Envio de dados e documentos" },
                  { num: "2", title: "Projeto Técnico", desc: "Elaboração pela engenharia" },
                  { num: "3", title: "Protocolo", desc: "Submissão à concessionária" },
                  { num: "4", title: "Homologação", desc: "Aprovação e conclusão" },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0 mt-0.5">
                      {step.num}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
