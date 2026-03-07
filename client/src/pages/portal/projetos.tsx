import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { FolderOpen, Search, ChevronRight } from "lucide-react";
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

export default function PortalProjetosPage() {
  const [search, setSearch] = useState("");
  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({
    queryKey: ["/api/projects"],
  });

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p as any).ticketNumber?.toLowerCase().includes(q) ||
      p.concessionaria?.toLowerCase().includes(q) ||
      p.numeroProtocolo?.toLowerCase().includes(q) ||
      STATUS_LABELS[p.status]?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-4 py-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" data-testid="text-portal-projetos-title">
            Meus Projetos
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? "Carregando..." : `${projects.length} projeto${projects.length !== 1 ? "s" : ""} no total`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, protocolo, concessionária..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-portal-projects"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">
            {search ? "Nenhum projeto encontrado" : "Você ainda não tem projetos"}
          </p>
          {search && (
            <p className="text-sm mt-1">Tente buscar por outro termo</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(project => (
            <Link key={project.id} href={`/portal/projetos/${project.id}`}>
              <div
                className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card cursor-pointer hover-elevate transition-all"
                data-testid={`card-portal-proj-${project.id}`}
              >
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[project.status] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {(project as any).ticketNumber && (
                      <span className="text-xs font-mono text-primary font-semibold">
                        {(project as any).ticketNumber}
                      </span>
                    )}
                    <p className="text-sm font-semibold truncate">{project.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {project.potencia ? `${project.potencia} kWp` : ""}
                    {project.concessionaria ? ` · ${project.concessionaria}` : ""}
                    {project.numeroProtocolo ? ` · Prot. ${project.numeroProtocolo}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_BADGE_STYLES[project.status]}`}>
                    {STATUS_LABELS[project.status]}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
