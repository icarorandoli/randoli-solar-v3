import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Zap, Building, MapPin, Calendar, FileText, Download, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import type { Project, Client } from "@shared/schema";

const STATUS_LABELS: Record<string, string> = {
  orcamento: "Orçamento",
  aprovado_pagamento_pendente: "Pagamento Pendente",
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

const STATUS_STEP_COLORS: Record<string, string> = {
  completed: "bg-emerald-500 text-white",
  current: "bg-primary text-white ring-4 ring-primary/20",
  upcoming: "bg-muted text-muted-foreground",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  rg_cnh: "RG / CNH", cpf_cnpj_doc: "CPF / CNPJ", conta_energia: "Conta de Energia",
  procuracao: "Procuração", foto_local: "Foto do Local",
  diagrama_unifilar: "Diagrama Unifilar", memorial_descritivo: "Memorial Descritivo",
  art: "ART", contrato: "Contrato", projeto_aprovado: "Projeto Elétrico",
  parecer_concessionaria: "Parecer da Concessionária",
  comprovante_pagamento: "Comprovante de Pagamento", outro: "Outro",
};

type ProjectWithClient = Project & { client: Client | null };
type TimelineEntry = { id: string; event: string; details?: string; createdAt: string; createdByRole?: string };
type Document = { id: string; projectId: string; docType: string; fileName: string; fileUrl: string; uploadedAt: string };

const VISIBLE_STEPS = [
  { key: "orcamento", label: "Orçamento" },
  { key: "aprovado_pagamento_pendente", label: "Pagamento" },
  { key: "projeto_tecnico", label: "Projeto" },
  { key: "protocolado", label: "Protocolo" },
  { key: "vistoria", label: "Vistoria" },
  { key: "homologado", label: "Homologação" },
];

export default function ClienteProjetoPage() {
  const [, params] = useRoute("/cliente/projeto/:id");
  const id = params?.id;

  const { data: project, isLoading } = useQuery<ProjectWithClient>({
    queryKey: ["/api/projects", id],
    queryFn: () => fetch(`/api/projects/${id}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const { data: timeline = [] } = useQuery<TimelineEntry[]>({
    queryKey: ["/api/projects", id, "timeline"],
    queryFn: () => fetch(`/api/projects/${id}/timeline`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/projects", id, "documents"],
    queryFn: () => fetch(`/api/projects/${id}/documents`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  const currentStepIdx = VISIBLE_STEPS.findIndex(s => s.key === project.status);
  const isFinished = project.status === "finalizado" || project.status === "homologado";

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/cliente"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            {(project as any).ticketNumber && (
              <span className="text-xs font-mono text-muted-foreground">{(project as any).ticketNumber}</span>
            )}
            <h1 className="text-xl font-bold" data-testid="text-cliente-project-title">{project.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {STATUS_LABELS[project.status] || project.status}
          </p>
        </div>
      </div>

      <Card className="border shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground">Progresso do Projeto</h3>
            {isFinished && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-none text-xs">
                Projeto Concluído
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {VISIBLE_STEPS.map((step, idx) => {
              let state: "completed" | "current" | "upcoming" = "upcoming";
              if (isFinished || idx < currentStepIdx) state = "completed";
              else if (idx === currentStepIdx) state = "current";

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex items-center w-full">
                    {idx > 0 && (
                      <div className={`h-0.5 flex-1 ${state !== "upcoming" || (idx <= currentStepIdx) ? "bg-emerald-500" : "bg-muted"}`} />
                    )}
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${STATUS_STEP_COLORS[state]}`}>
                      {state === "completed" ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </div>
                    {idx < VISIBLE_STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 ${state === "completed" ? "bg-emerald-500" : "bg-muted"}`} />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight hidden sm:block">{step.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Potência", value: project.potencia ? `${project.potencia} kWp` : "—", icon: Zap },
          { label: "Concessionária", value: project.concessionaria || "—", icon: Building },
          { label: "Cidade", value: project.cidade || "—", icon: MapPin },
          { label: "Criado em", value: project.createdAt ? new Date(project.createdAt).toLocaleDateString("pt-BR") : "—", icon: Calendar },
        ].map(info => (
          <Card key={info.label} className="border shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <info.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{info.label}</span>
              </div>
              <p className="text-sm font-semibold truncate">{info.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="timeline" data-testid="tab-cliente-timeline">Histórico</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-cliente-documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atualização ainda.</p>
          ) : (
            <div className="space-y-3">
              {timeline.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.event}</p>
                    {entry.details && <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(entry.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento disponível.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <Card key={doc.id} className="border shadow-none">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {DOC_TYPE_LABELS[doc.docType] || doc.docType} · {new Date(doc.uploadedAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" data-testid={`button-download-doc-${doc.id}`}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
