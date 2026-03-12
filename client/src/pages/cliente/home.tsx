import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, ShieldCheck, Clock, Zap, ChevronRight, Building } from "lucide-react";
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

export default function ClienteHomePage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({ queryKey: ["/api/projects"] });

  const active = projects.filter(p => p.status !== "cancelado" && p.status !== "homologado" && p.status !== "finalizado").length;
  const homologados = projects.filter(p => p.status === "homologado" || p.status === "finalizado").length;
  const firstName = user?.name?.split(" ")[0] || "Cliente";

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-cliente-welcome">
          Olá, {firstName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe o status dos seus projetos de energia solar
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Meus Projetos", value: projects.length, icon: FolderOpen, color: "text-primary", bg: "bg-primary/8", testId: "text-cliente-total" },
          { label: "Em Andamento", value: active, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/8", testId: "text-cliente-active" },
          { label: "Concluídos", value: homologados, icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/8", testId: "text-cliente-concluidos" },
        ].map((stat) => (
          <Card key={stat.label} className="border shadow-none">
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

      <div>
        <h2 className="text-lg font-bold mb-4">Meus Projetos</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-foreground">Nenhum projeto encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">Seus projetos aparecerão aqui quando forem criados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {projects.map(project => (
              <Link key={project.id} href={`/cliente/projeto/${project.id}`}>
                <Card className="border shadow-none hover:bg-muted/40 transition-colors cursor-pointer group" data-testid={`card-cliente-project-${project.id}`}>
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
    </div>
  );
}
