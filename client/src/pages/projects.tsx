import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Search, Pencil, Trash2, FolderOpen, Zap, Eye,
  MapPin, Cpu, Sun, User, FileText, Activity, Building,
  ExternalLink, Upload, Hash, CheckCircle2, Archive, RotateCcw, CreditCard, RefreshCw,
  LayoutGrid, List
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import type { Project, Client, Document, Timeline, StatusConfig } from "@shared/schema";
import ChatPanel from "@/components/chat-panel";
import { useProjectWebSocket } from "@/hooks/use-websocket";
import { useUpload } from "@/hooks/use-upload";
import { getBadgeClass } from "@/lib/status-colors";

const DOC_TYPE_LABELS: Record<string, string> = {
  rg_cnh: "RG / CNH", cpf_cnpj_doc: "CPF / CNPJ", conta_energia: "Conta de Energia",
  procuracao: "Procuração", foto_local: "Foto do Local",
  diagrama_unifilar: "Diagrama Unifilar", memorial_descritivo: "Memorial Descritivo",
  art: "ART", contrato: "Contrato", projeto_aprovado: "Projeto Elétrico",
  parecer_concessionaria: "Parecer da Concessionária", comprovante_pagamento: "Comprovante de Pagamento", outro: "Outro",
};

type ProjectWithClient = Project & {
  client: Client | null;
  integrador?: { name: string; email: string | null; cpfCnpj: string | null } | null;
};

function InfoRow({ label, value, link }: { label: string; value?: string | null; link?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground min-w-[130px] flex-shrink-0">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
          Abrir mapa <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-xs font-medium flex-1">{value}</span>
      )}
    </div>
  );
}

function ProjectDetailSheet({
  project,
  open,
  onClose,
}: {
  project: ProjectWithClient | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const canDeleteDocs = ["admin", "engenharia"].includes(user?.role || "");
  const canEditValor = ["admin", "financeiro"].includes(user?.role || "");
  const [timelineNote, setTimelineNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newProtocolo, setNewProtocolo] = useState("");
  const [newValor, setNewValor] = useState("");
  const [assignEngineerId, setAssignEngineerId] = useState<string>("");
  const [assignInstallerId, setAssignInstallerId] = useState<string>("");
  const [assignManagerId, setAssignManagerId] = useState<string>("");

  useProjectWebSocket(user?.id ?? null, user?.role ?? null, project?.id ?? "");

  const { data: statusConfigs = [] } = useQuery<StatusConfig[]>({ queryKey: ["/api/status-configs"] });
  const { data: internalUsers = [] } = useQuery<{ id: string; name: string; role: string }[]>({
    queryKey: ["/api/users"],
    select: (users: any[]) => users.filter((u: any) => ["admin", "engenharia", "financeiro", "tecnico"].includes(u.role)),
  });
  const configMap = Object.fromEntries(statusConfigs.map(c => [c.key, c]));
  const getStatusLabel = (key: string) => configMap[key]?.label ?? key;
  const getStatusBadge = (key: string) => getBadgeClass(configMap[key]?.color ?? "slate");

  const { data: docs = [], isLoading: docsLoading } = useQuery<Document[]>({
    queryKey: ["/api/projects", project?.id, "documents"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${project?.id}/documents`, { credentials: "include" });
      return res.json();
    },
    enabled: !!project?.id,
  });

  const { data: timeline = [], isLoading: tlLoading } = useQuery<Timeline[]>({
    queryKey: ["/api/projects", project?.id, "timeline"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${project?.id}/timeline`, { credentials: "include" });
      return res.json();
    },
    enabled: !!project?.id,
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/projects/${project?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Projeto atualizado!" });
      setNewStatus("");
      setNewValor("");
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const generatePaymentMut = useMutation({
    mutationFn: (projectId: string) => apiRequest("POST", `/api/projects/${projectId}/generate-payment`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "archived"] });
      toast({ title: "Link de pagamento gerado!" });
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao gerar pagamento", variant: "destructive" }),
  });

  const verifyPaymentMut = useMutation({
    mutationFn: (projectId: string) => apiRequest("POST", `/api/projects/${projectId}/verify-payment`),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "timeline"] });
      const payments = data.payments || [];
      const approved = payments.find((p: any) => p.status === "approved");
      if (approved) {
        toast({ title: `Pagamento aprovado! R$ ${approved.amount?.toFixed(2).replace(".", ",")} via ${approved.method}` });
      } else if (payments.length > 0) {
        const statuses = payments.map((p: any) => `#${p.id}: ${p.status}`).join(", ");
        toast({ title: `Pagamentos encontrados: ${statuses}`, description: "Nenhum aprovado ainda." });
      } else {
        toast({ title: "Nenhum pagamento encontrado no Mercado Pago", variant: "destructive" });
      }
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao verificar pagamento", variant: "destructive" }),
  });

  const deleteDocMut = useMutation({
    mutationFn: (docId: string) => apiRequest("DELETE", `/api/projects/${project?.id}/documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "documents"] });
      toast({ title: "Documento removido!" });
    },
    onError: () => toast({ title: "Erro ao remover documento", variant: "destructive" }),
  });

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const uploadingDocRef = useRef<string | null>(null);

  const addDocMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/projects/${project?.id}/documents`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "documents"] });
      toast({ title: "Documento enviado com sucesso!" });
      uploadingDocRef.current = null;
      setUploadingDoc(null);
    },
    onError: () => {
      toast({ title: "Erro ao salvar documento", variant: "destructive" });
      uploadingDocRef.current = null;
      setUploadingDoc(null);
    },
  });

  const { uploadFile } = useUpload({
    onSuccess: (res) => {
      addDocMut.mutate({
        name: res.metadata.name,
        fileUrl: res.objectPath,
        docType: uploadingDocRef.current,
        fileType: res.metadata.contentType,
      });
    },
    onError: () => {
      toast({ title: "Erro ao enviar arquivo", variant: "destructive" });
      uploadingDocRef.current = null;
      setUploadingDoc(null);
    },
  });

  const handleAdminUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadingDocRef.current = docType;
    setUploadingDoc(docType);
    await uploadFile(file);
    if (e.target) e.target.value = "";
  };

  const addTimelineMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/projects/${project?.id}/timeline`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "timeline"] });
      toast({ title: "Nota adicionada!" });
      setTimelineNote("");
    },
    onError: () => toast({ title: "Erro ao adicionar nota", variant: "destructive" }),
  });

  if (!project) return null;

  const handleUpdateStatus = () => {
    const payload: Record<string, any> = {};
    if (newStatus) payload.status = newStatus;
    if (newProtocolo) payload.numeroProtocolo = newProtocolo;
    if (newValor) payload.valor = newValor;
    if (assignEngineerId) payload.assignedEngineerId = assignEngineerId === "__none__" ? null : assignEngineerId;
    if (assignInstallerId) payload.assignedInstallerId = assignInstallerId === "__none__" ? null : assignInstallerId;
    if (assignManagerId) payload.assignedManagerId = assignManagerId === "__none__" ? null : assignManagerId;
    if (Object.keys(payload).length === 0) return;
    updateMut.mutate(payload);
  };

  const handleAddNote = () => {
    if (!timelineNote.trim()) return;
    addTimelineMut.mutate({ event: "Nota da Randoli", details: timelineNote });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {project.ticketNumber && (
                <p className="text-xs font-mono text-primary font-semibold mb-0.5 flex items-center gap-1">
                  <Hash className="h-3 w-3" />{project.ticketNumber}
                </p>
              )}
              <SheetTitle className="text-base leading-tight">{project.title}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Integrador: {(project as any).integrador?.name || project.client?.name || "—"}
                {((project as any).integrador?.cpfCnpj || project.client?.cpfCnpj) ? ` (${(project as any).integrador?.cpfCnpj || project.client?.cpfCnpj})` : ""}
                {project.nomeCliente ? ` · Cliente: ${project.nomeCliente}` : ""}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getStatusBadge(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5">
          {/* Admin Controls */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Atualizar Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Alterar Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger data-testid="select-admin-status">
                      <SelectValue placeholder={getStatusLabel(project.status)} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusConfigs.sort((a, b) => a.sortOrder - b.sortOrder).map(c => (
                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nº Protocolo da Concessionária</Label>
                  <Input
                    value={newProtocolo}
                    onChange={e => setNewProtocolo(e.target.value)}
                    placeholder={project.numeroProtocolo || "Informe após protocolar"}
                    data-testid="input-admin-protocolo"
                  />
                </div>
              </div>
              {canEditValor && (
              <div className="space-y-1.5">
                <Label className="text-xs">Valor do Projeto (R$)</Label>
                <Input
                  value={newValor}
                  onChange={e => setNewValor(e.target.value)}
                  placeholder={project.valor || "Ex: 12.500,00"}
                  data-testid="input-admin-valor"
                />
                {project.valor && (
                  <p className="text-xs text-muted-foreground">Valor atual: <span className="font-semibold text-foreground">R$ {project.valor}</span></p>
                )}
                {project.paymentStatus && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      project.paymentStatus === "approved" ? "bg-green-100 text-green-700" :
                      project.paymentStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {project.paymentStatus === "approved" ? "✓ Pago" :
                       project.paymentStatus === "pending" ? "⏳ Pagamento pendente" :
                       `Pagamento: ${project.paymentStatus}`}
                    </span>
                    {project.paymentLink && (
                      <a href={project.paymentLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-admin-payment">
                        <ExternalLink className="h-3 w-3" /> Link MP
                      </a>
                    )}
                  </div>
                )}
                {project.status === "aprovado_pagamento_pendente" && !project.paymentId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                    disabled={generatePaymentMut.isPending}
                    onClick={() => generatePaymentMut.mutate(project.id)}
                    data-testid="button-generate-payment"
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    {generatePaymentMut.isPending ? "Gerando..." : "Gerar Link de Pagamento"}
                  </Button>
                )}
                {project.paymentId && project.paymentStatus !== "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs border-blue-400 text-blue-700 hover:bg-blue-50"
                    disabled={verifyPaymentMut.isPending}
                    onClick={() => verifyPaymentMut.mutate(project.id)}
                    data-testid="button-verify-payment"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${verifyPaymentMut.isPending ? "animate-spin" : ""}`} />
                    {verifyPaymentMut.isPending ? "Verificando..." : "Verificar Pagamento MP"}
                  </Button>
                )}
              </div>
              )}
              {/* Assignment */}
              {internalUsers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Engenheiro responsável</Label>
                    <Select value={assignEngineerId} onValueChange={setAssignEngineerId}>
                      <SelectTrigger className="h-8 text-xs" data-testid="select-assign-engineer">
                        <SelectValue placeholder={(project as any).assignedEngineerId ? internalUsers.find(u => u.id === (project as any).assignedEngineerId)?.name ?? "Atribuído" : "Nenhum"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {internalUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Instalador</Label>
                    <Select value={assignInstallerId} onValueChange={setAssignInstallerId}>
                      <SelectTrigger className="h-8 text-xs" data-testid="select-assign-installer">
                        <SelectValue placeholder={(project as any).assignedInstallerId ? internalUsers.find(u => u.id === (project as any).assignedInstallerId)?.name ?? "Atribuído" : "Nenhum"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {internalUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Gerente</Label>
                    <Select value={assignManagerId} onValueChange={setAssignManagerId}>
                      <SelectTrigger className="h-8 text-xs" data-testid="select-assign-manager">
                        <SelectValue placeholder={(project as any).assignedManagerId ? internalUsers.find(u => u.id === (project as any).assignedManagerId)?.name ?? "Atribuído" : "Nenhum"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {internalUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button size="sm" disabled={updateMut.isPending} onClick={handleUpdateStatus} data-testid="button-admin-update-project">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                {updateMut.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">Adicionar nota ao histórico</Label>
                <Textarea
                  value={timelineNote}
                  onChange={e => setTimelineNote(e.target.value)}
                  placeholder="Ex: Documentação verificada. Iniciando elaboração do projeto técnico..."
                  rows={2}
                  data-testid="textarea-admin-note"
                />
                <Button size="sm" variant="outline" onClick={handleAddNote} disabled={addTimelineMut.isPending || !timelineNote.trim()} data-testid="button-admin-add-note">
                  {addTimelineMut.isPending ? "Adicionando..." : "Adicionar Nota"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin — Enviar Documentos (Projeto + ART) */}
          <Card className="border-dashed border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="h-3.5 w-3.5 text-primary" /> Enviar Documentos ao Integrador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Projeto Técnico */}
                <label className="cursor-pointer block" data-testid="upload-admin-projeto">
                  <div className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed transition-colors ${
                    uploadingDoc === "projeto_aprovado"
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}>
                    <FileText className={`h-5 w-5 flex-shrink-0 ${uploadingDoc === "projeto_aprovado" ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">Projeto Elétrico</p>
                      <p className="text-xs text-muted-foreground">
                        {uploadingDoc === "projeto_aprovado" ? "Enviando..." : "PDF, JPG ou PNG"}
                      </p>
                    </div>
                    {uploadingDoc === "projeto_aprovado" && <CheckCircle2 className="h-4 w-4 text-primary animate-pulse flex-shrink-0" />}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    disabled={!!uploadingDoc}
                    onChange={e => handleAdminUpload(e, "projeto_aprovado")}
                  />
                </label>

                {/* ART */}
                <label className="cursor-pointer block" data-testid="upload-admin-art">
                  <div className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed transition-colors ${
                    uploadingDoc === "art"
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}>
                    <FileText className={`h-5 w-5 flex-shrink-0 ${uploadingDoc === "art" ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">ART</p>
                      <p className="text-xs text-muted-foreground">
                        {uploadingDoc === "art" ? "Enviando..." : "Anotação de Resp. Técnica"}
                      </p>
                    </div>
                    {uploadingDoc === "art" && <CheckCircle2 className="h-4 w-4 text-primary animate-pulse flex-shrink-0" />}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    disabled={!!uploadingDoc}
                    onChange={e => handleAdminUpload(e, "art")}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Os documentos enviados ficam visíveis para o integrador no portal deles.
              </p>
            </CardContent>
          </Card>

          {/* Titular */}
          {(project.nomeCliente || project.cpfCnpjCliente) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Titular da Instalação
              </p>
              <InfoRow label="Nome" value={project.nomeCliente} />
              <InfoRow label="CPF / CNPJ" value={project.cpfCnpjCliente} />
              <InfoRow label="Telefone" value={project.telefoneCliente} />
            </div>
          )}

          {/* Localização */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Localização
            </p>
            <InfoRow label="Endereço" value={project.endereco} />
            <InfoRow label="Google Maps" value={project.localizacao} link={project.localizacao?.startsWith("http")} />
          </div>

          {/* Concessionária */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5" /> Concessionária
            </p>
            <InfoRow label="Concessionária" value={project.concessionaria} />
            <InfoRow label="Tipo Conexão" value={
              project.tipoConexao === "monofasico" ? "Monofásico" :
              project.tipoConexao === "bifasico" ? "Bifásico" :
              project.tipoConexao === "trifasico" ? "Trifásico" : null
            } />
            <InfoRow label="Disjuntor Padrão" value={project.amperagemDisjuntor} />
            <InfoRow label="Nº Instalação (UC)" value={project.numeroInstalacao} />
            <InfoRow label="Protocolo" value={project.numeroProtocolo} />
          </div>

          {/* Inversor */}
          {(project.marcaInversor || project.modeloInversor) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> Inversor Solar
              </p>
              <InfoRow label="Marca" value={project.marcaInversor} />
              <InfoRow label="Modelo" value={project.modeloInversor} />
              <InfoRow label="Potência" value={project.potenciaInversor ? `${project.potenciaInversor} kW` : null} />
              <InfoRow label="Quantidade" value={project.quantidadeInversor} />
            </div>
          )}

          {/* Painel */}
          {(project.marcaPainel || project.modeloPainel) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Sun className="h-3.5 w-3.5" /> Módulos Fotovoltaicos
              </p>
              <InfoRow label="Marca" value={project.marcaPainel} />
              <InfoRow label="Modelo" value={project.modeloPainel} />
              <InfoRow label="Potência Unit." value={project.potenciaPainel ? `${project.potenciaPainel} Wp` : null} />
              <InfoRow label="Quantidade" value={project.quantidadePaineis} />
              <InfoRow label="Potência Total" value={project.potencia ? `${project.potencia} kWp` : null} />
            </div>
          )}

          {project.description && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Observações</p>
              <p className="text-xs leading-relaxed">{project.description}</p>
            </div>
          )}

          <Separator />

          {/* Documents */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Documentos ({docs.length})
            </p>
            {docsLoading ? (
              <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : docs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum documento enviado.</p>
            ) : (
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2.5 p-2.5 rounded-md border border-border/60 bg-muted/30">
                    <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[doc.docType] || doc.docType}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {doc.uploadedByRole === "admin" ? "Randoli" : "Integrador"}
                    </Badge>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" data-testid={`button-view-doc-${doc.id}`}>Ver</Button>
                    </a>
                    {canDeleteDocs && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1.5 h-auto"
                        disabled={deleteDocMut.isPending}
                        onClick={() => {
                          if (confirm("Tem certeza que deseja remover este documento?")) {
                            deleteDocMut.mutate(doc.id);
                          }
                        }}
                        data-testid={`button-delete-doc-${doc.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Histórico
            </p>
            {tlLoading ? (
              <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma atualização.</p>
            ) : (
              <div className="space-y-0">
                {timeline.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${entry.createdByRole === "admin" ? "bg-primary/15" : "bg-muted"}`}>
                        <Zap className="h-3 w-3 text-primary" />
                      </div>
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-border min-h-[20px] mt-1" />}
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                      <p className="text-xs font-medium">{entry.event}</p>
                      {entry.details && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{entry.details}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.createdByRole === "admin" ? "Randoli" : "Integrador"} · {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Chat */}
          {project && user && (
            <div className="h-[380px]">
              <ChatPanel
                projectId={project.id}
                currentUserId={user.id}
                currentUserRole={user.role}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [tab, setTab] = useState("ativos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({ queryKey: ["/api/projects"] });
  const { data: archived = [], isLoading: archivedLoading } = useQuery<ProjectWithClient[]>({
    queryKey: ["/api/projects", "archived"],
    queryFn: async () => {
      const res = await fetch("/api/projects?archived=true", { credentials: "include" });
      return res.json();
    },
  });
  const { data: statusConfigs = [] } = useQuery<StatusConfig[]>({ queryKey: ["/api/status-configs"] });
  const configMap = Object.fromEntries(statusConfigs.map(c => [c.key, c]));

  const getStatusLabel = (key: string) => configMap[key]?.label ?? key;
  const getStatusBadge = (key: string) => getBadgeClass(configMap[key]?.color ?? "slate");

  const [, navigate] = useLocation();

  const allProjects = [...projects, ...archived];
  const detailProject = detailProjectId ? allProjects.find(p => p.id === detailProjectId) || null : null;

  // Auto-open project from ?open= query param (e.g. clicked from a notification)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get("open");
    if (openId && allProjects.length > 0) {
      setDetailProjectId(openId);
      navigate("/projetos", { replace: true });
    }
  }, [allProjects.length]);

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Projeto excluído!" });
    },
    onError: () => toast({ title: "Erro ao excluir projeto", variant: "destructive" }),
  });

  const unarchiveMut = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/projects/${id}`, { archived: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Projeto restaurado!" });
    },
    onError: () => toast({ title: "Erro ao restaurar projeto", variant: "destructive" }),
  });

  const currentList = tab === "arquivados" ? archived : projects;
  const loading = tab === "arquivados" ? archivedLoading : isLoading;

  const filtered = currentList.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.nomeCliente?.toLowerCase().includes(search.toLowerCase()) ||
      p.concessionaria?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "todos" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Projetos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {projects.length} projeto{projects.length !== 1 ? "s" : ""} ativo{projects.length !== 1 ? "s" : ""}
            {archived.length > 0 && ` · ${archived.length} arquivado${archived.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={v => { setTab(v); setStatusFilter("todos"); setSearch(""); }}>
        <TabsList>
          <TabsTrigger value="ativos" data-testid="tab-ativos">
            <FolderOpen className="h-3.5 w-3.5 mr-1.5" /> Ativos ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="arquivados" data-testid="tab-arquivados">
            <Archive className="h-3.5 w-3.5 mr-1.5" /> Arquivados ({archived.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cliente, concessionária..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-projects"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52" data-testid="select-filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {statusConfigs.sort((a, b) => a.sortOrder - b.sortOrder).map(c => (
              <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            data-testid="button-view-grid"
            title="Visualização em grade"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            data-testid="button-view-list"
            title="Visualização em lista"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FolderOpen className="h-14 w-14 mb-3 opacity-30" />
          <p className="font-medium">{tab === "arquivados" ? "Nenhum projeto arquivado" : "Nenhum projeto encontrado"}</p>
          <p className="text-sm mt-1">
            {tab === "arquivados" ? "Projetos finalizados aparecem aqui" : "Ajuste os filtros ou aguarde novos pedidos dos integradores"}
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Projeto</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Integrador</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Potência</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Concessionária</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(project => (
                <tr
                  key={project.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => tab !== "arquivados" && setDetailProjectId(project.id)}
                  data-testid={`row-project-${project.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      {project.ticketNumber && (
                        <span className="text-[10px] font-mono text-primary flex items-center gap-0.5">
                          <Hash className="h-2.5 w-2.5" />{project.ticketNumber}
                        </span>
                      )}
                      <span className="font-medium text-xs truncate max-w-[220px]">{project.title}</span>
                      {project.nomeCliente && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[220px]">
                          Cliente: {project.nomeCliente}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs truncate max-w-[160px] block">{project.integrador?.name || project.client?.name || "—"}</span>
                    {(project.integrador?.cpfCnpj || project.client?.cpfCnpj) && (
                      <span className="text-[10px] text-muted-foreground">{project.integrador?.cpfCnpj || project.client?.cpfCnpj}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs">{project.potencia ? `${project.potencia} kWp` : "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs truncate max-w-[140px] block">{project.concessionaria || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${getStatusBadge(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {tab === "arquivados" ? (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => unarchiveMut.mutate(project.id)} disabled={unarchiveMut.isPending} data-testid={`button-restore-project-${project.id}`}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("Excluir permanentemente este projeto?")) deleteMut.mutate(project.id); }} disabled={deleteMut.isPending} data-testid={`button-delete-archived-${project.id}`}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetailProjectId(project.id)} data-testid={`button-view-project-${project.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("Excluir este projeto?")) deleteMut.mutate(project.id); }} disabled={deleteMut.isPending} data-testid={`button-delete-project-${project.id}`}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(project => (
            <Card key={project.id} className={`hover-elevate cursor-pointer ${tab === "arquivados" ? "opacity-80" : ""}`} data-testid={`card-project-${project.id}`} onClick={() => tab !== "arquivados" && setDetailProjectId(project.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {project.ticketNumber && (
                      <p className="text-xs font-mono text-muted-foreground mb-1 flex items-center gap-1">
                        <Hash className="h-3 w-3" />{project.ticketNumber}
                      </p>
                    )}
                    <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">{project.title}</CardTitle>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${getStatusBadge(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Integrador</p>
                  <p className="text-sm font-medium truncate">{project.integrador?.name || project.client?.name || "—"}</p>
                  {(project.integrador?.cpfCnpj || project.client?.cpfCnpj) && (
                    <p className="text-xs text-muted-foreground truncate">{project.integrador?.cpfCnpj || project.client?.cpfCnpj}</p>
                  )}
                  {project.nomeCliente && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <User className="h-3 w-3" /> Cliente: {project.nomeCliente}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(project.marcaInversor || project.modeloInversor) && (
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1"><Cpu className="h-3 w-3" /> Inversor</p>
                      <p className="font-medium truncate">{project.marcaInversor} {project.modeloInversor}</p>
                    </div>
                  )}
                  {(project.marcaPainel || project.quantidadePaineis) && (
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1"><Sun className="h-3 w-3" /> Painéis</p>
                      <p className="font-medium">{project.quantidadePaineis && `${project.quantidadePaineis}x `}{project.marcaPainel}</p>
                    </div>
                  )}
                  {project.potencia && (
                    <div>
                      <p className="text-muted-foreground">Potência</p>
                      <p className="font-medium">{project.potencia} kWp</p>
                    </div>
                  )}
                  {project.concessionaria && (
                    <div>
                      <p className="text-muted-foreground">Concessionária</p>
                      <p className="font-medium truncate">{project.concessionaria}</p>
                    </div>
                  )}
                  {project.amperagemDisjuntor && (
                    <div>
                      <p className="text-muted-foreground">Disjuntor</p>
                      <p className="font-medium">{project.amperagemDisjuntor}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                  {tab === "arquivados" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => unarchiveMut.mutate(project.id)}
                        disabled={unarchiveMut.isPending}
                        data-testid={`button-restore-project-${project.id}`}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Restaurar
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          if (confirm("Excluir permanentemente este projeto?")) deleteMut.mutate(project.id);
                        }}
                        disabled={deleteMut.isPending}
                        data-testid={`button-delete-archived-${project.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setDetailProjectId(project.id)}
                        data-testid={`button-view-project-${project.id}`}
                      >
                        <Eye className="h-3 w-3 mr-1" /> Ver Detalhes
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          if (confirm("Excluir este projeto?")) deleteMut.mutate(project.id);
                        }}
                        disabled={deleteMut.isPending}
                        data-testid={`button-delete-project-${project.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectDetailSheet
        project={detailProject}
        open={!!detailProject}
        onClose={() => setDetailProjectId(null)}
      />
    </div>
  );
}
