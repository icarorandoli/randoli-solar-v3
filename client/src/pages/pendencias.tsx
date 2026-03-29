import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Plus, CheckCircle2, Clock, Eye, X, FolderOpen } from "lucide-react";
import type { Project, Client } from "@shared/schema";

type Pendencia = {
  id: string;
  projectId: string;
  projectTitle: string;
  ticketNumber?: string;
  clientName: string;
  descricao: string;
  prioridade: "baixa" | "media" | "alta";
  status: "aberta" | "verificar" | "resolvida";
  criadoPor: string;
  criadoEm: string;
  resolvidoEm?: string;
};

type ProjectWithClient = Project & { client: Client | null };

const PRIORIDADE_CONFIG = {
  alta: { label: "Alta", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  media: { label: "Média", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  baixa: { label: "Baixa", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400" },
};

function NovaPendenciaDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [projectId, setProjectId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("media");

  const { data: projects = [] } = useQuery<ProjectWithClient[]>({ queryKey: ["/api/projects"] });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/pendencias", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pendencias"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pendencias/counts"] });
      toast({ title: "Pendência criada com sucesso!" });
      onClose();
      setProjectId(""); setDescricao(""); setPrioridade("media");
    },
    onError: () => toast({ title: "Erro ao criar pendência", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Nova Pendência
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Projeto *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o projeto..." />
              </SelectTrigger>
              <SelectContent>
                {projects.filter(p => p.status !== "cancelado" && p.status !== "finalizado").map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {(p as any).ticketNumber ? `${(p as any).ticketNumber} — ` : ""}{p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select value={prioridade} onValueChange={setPrioridade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta">🔴 Alta</SelectItem>
                <SelectItem value="media">🟡 Média</SelectItem>
                <SelectItem value="baixa">🔵 Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição da Pendência *</Label>
            <Textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Falta documentação, RG/CNH do titular pendente..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!projectId || !descricao.trim() || createMut.isPending}
            onClick={() => createMut.mutate({ projectId, descricao, prioridade })}
          >
            {createMut.isPending ? "Criando..." : "Criar Pendência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PendenciaCard({
  pendencia,
  isAdmin,
  onResolve,
  onVerify,
  onDelete,
}: {
  pendencia: Pendencia;
  isAdmin: boolean;
  onResolve: (id: string) => void;
  onVerify: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const prio = PRIORIDADE_CONFIG[pendencia.prioridade];

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      pendencia.status === "aberta"
        ? "border-amber-200/60 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800/40"
        : pendencia.status === "verificar"
        ? "border-blue-200/60 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800/40"
        : "border-emerald-200/60 bg-emerald-50/30 dark:bg-emerald-900/10 dark:border-emerald-800/40"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {pendencia.ticketNumber && (
              <span className="text-[10px] font-mono font-bold text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded">
                {pendencia.ticketNumber}
              </span>
            )}
            <span className="text-sm font-bold text-foreground truncate">{pendencia.projectTitle}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${prio.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${prio.dot}`} />
              {prio.label}
            </span>
          </div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">{pendencia.clientName}</p>
          <p className="text-sm text-foreground/80">{pendencia.descricao}</p>
          <p className="text-[10px] text-muted-foreground mt-2">
            Criado por {pendencia.criadoPor} · {new Date(pendencia.criadoEm).toLocaleDateString("pt-BR")}
            {pendencia.resolvidoEm && ` · Resolvido em ${new Date(pendencia.resolvidoEm).toLocaleDateString("pt-BR")}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pendencia.status === "aberta" && (
            <Button size="sm" variant="outline" className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5"
              onClick={() => onResolve(pendencia.id)}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Resolver
            </Button>
          )}
          {pendencia.status === "verificar" && isAdmin && (
            <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 gap-1.5"
              onClick={() => onVerify(pendencia.id)}>
              <Eye className="h-3.5 w-3.5" /> Verificar
            </Button>
          )}
          {pendencia.status === "verificar" && !isAdmin && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">Aguardando verificação</Badge>
          )}
          {pendencia.status === "resolvida" && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Resolvida
            </Badge>
          )}
          {isAdmin && pendencia.status !== "resolvida" && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(pendencia.id)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PendenciasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"todas" | "abertas" | "verificar" | "resolvidas">("abertas");
  const [novaOpen, setNovaOpen] = useState(false);
  const isAdmin = ["admin", "engenharia"].includes(user?.role ?? "");

  const { data: pendencias = [], isLoading } = useQuery<Pendencia[]>({
    queryKey: ["/api/pendencias"],
    queryFn: () => apiRequest("GET", "/api/pendencias").then(r => r.json()),
    refetchInterval: 30000,
  });

  const resolveMut = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/pendencias/${id}/resolver`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pendencias"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pendencias/counts"] });
      toast({ title: "Pendência marcada para verificação!" });
    },
  });

  const verifyMut = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/pendencias/${id}/verificar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pendencias"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pendencias/counts"] });
      toast({ title: "Pendência resolvida!" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pendencias/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pendencias"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pendencias/counts"] });
      toast({ title: "Pendência removida" });
    },
  });

  const abertas = pendencias.filter(p => p.status === "aberta");
  const verificar = pendencias.filter(p => p.status === "verificar");
  const resolvidas = pendencias.filter(p => p.status === "resolvida");

  const filtered = tab === "todas" ? pendencias
    : tab === "abertas" ? abertas
    : tab === "verificar" ? verificar
    : resolvidas;

  const TABS = [
    { key: "todas", label: "Todas", count: pendencias.length },
    { key: "abertas", label: "Abertas", count: abertas.length, color: "text-amber-600" },
    { key: "verificar", label: "Verificar", count: verificar.length, color: "text-blue-600" },
    { key: "resolvidas", label: "Resolvidas", count: resolvidas.length, color: "text-emerald-600" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Pendências
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendencias.length} pendência{pendencias.length !== 1 ? "s" : ""} no total
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setNovaOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Pendência
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/60">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all -mb-px ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted ${t.color ?? ""}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="font-bold text-foreground">Nenhuma pendência</p>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "abertas" ? "Todos os projetos estão em dia!" : "Nenhuma pendência neste filtro."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <PendenciaCard
              key={p.id}
              pendencia={p}
              isAdmin={isAdmin}
              onResolve={id => resolveMut.mutate(id)}
              onVerify={id => verifyMut.mutate(id)}
              onDelete={id => { if (confirm("Remover esta pendência?")) deleteMut.mutate(id); }}
            />
          ))}
        </div>
      )}

      <NovaPendenciaDialog open={novaOpen} onClose={() => setNovaOpen(false)} />
    </div>
  );
}
