import React, { useState, useRef, useEffect } from "react";
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
  LayoutGrid, List, XCircle, ArrowLeftRight, BadgeCheck, ShieldCheck, FileText} from "lucide-react";
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
    <div className="flex gap-4 py-2 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors px-3 -mx-3 rounded-md">
      <span className="text-[10px] font-bold text-muted-foreground min-w-[140px] flex-shrink-0 uppercase tracking-widest">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary flex items-center gap-1.5 hover:underline decoration-primary/30 underline-offset-4">
          Visualizar Mapa <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <span className="text-xs font-medium flex-1 text-foreground/90 leading-relaxed">{value}</span>
      )}
    </div>
  );
}

function ProjectDetailSheet({
  project,
  open,
  onClose,
  onEdit,
}: {
  project: ProjectWithClient | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const canDeleteDocs = ["admin", "engenharia"].includes(user?.role || "");
  const canEditValor = ["admin", "financeiro"].includes(user?.role || "");
  const isAdmin = user?.role === "admin";
  const [timelineNote, setTimelineNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newProtocolo, setNewProtocolo] = useState("");
  const [newValor, setNewValor] = useState("");
  const [assignEngineerId, setAssignEngineerId] = useState<string>("");
  const [assignInstallerId, setAssignInstallerId] = useState<string>("");
  const [assignManagerId, setAssignManagerId] = useState<string>("");

  useProjectWebSocket(user?.id ?? null, user?.role ?? null, project?.id ?? "");

  const { data: statusConfigs = [] } = useQuery<StatusConfig[]>({ queryKey: ["/api/status-configs"] });
  const { data: siteSettings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const hasMp = siteSettings?.mp_enabled !== "false" && !!siteSettings?.mp_access_token;
  const hasPs = siteSettings?.pagseguro_enabled === "true" && !!siteSettings?.pagseguro_token;
  const hasAsaas = siteSettings?.asaas_enabled === "true" && !!siteSettings?.asaas_api_key;
  const hasMp2 = siteSettings?.mp2_enabled === "true" && !!siteSettings?.mp2_access_token;
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

  const { data: termAcceptance } = useQuery<any>({
    queryKey: ["/api/projects", project?.id, "term/acceptance"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${project?.id}/term/acceptance`, { credentials: "include" });
      if (!res.ok) return null;
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
    mutationFn: ({ projectId, method }: { projectId: string; method: string }) =>
      apiRequest("POST", `/api/projects/${projectId}/generate-payment`, { method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "timeline"] });
      toast({ title: "Cobrança gerada com sucesso!" });
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao gerar pagamento", variant: "destructive" }),
  });

  const cancelPaymentMut = useMutation({
    mutationFn: (projectId: string) => apiRequest("POST", `/api/projects/${projectId}/cancel-payment`),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "timeline"] });
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao cancelar cobrança", variant: "destructive" }),
  });

  const handleGeneratePayment = (projectId: string, method: string = "mp") => {
    generatePaymentMut.mutate({ projectId, method });
  };

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
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 border-l border-border/50 shadow-2xl">
        <SheetHeader className="px-6 py-5 border-b border-border/60 sticky top-0 bg-background/95 backdrop-blur-sm z-10 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              {project.ticketNumber && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                  <Hash className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-tighter">
                    {project.ticketNumber}
                  </span>
                </div>
              )}
              <SheetTitle className="text-xl font-bold tracking-tight text-foreground">{project.title}</SheetTitle>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{(project as any).integrador?.name || project.client?.name || "—"}</span>
                </div>
                {project.nomeCliente && (
                  <>
                    <span className="text-muted-foreground/30">•</span>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>{project.nomeCliente}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm border-0 ${getStatusBadge(project.status)}`}>
                {getStatusLabel(project.status)}
              </Badge>
              {isAdmin && onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5"
                  onClick={() => onEdit(project.id)}
                >
                  <Pencil className="h-3 w-3" /> Editar Projeto
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-8 pb-12">
          {/* Admin Controls */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gestão do Projeto</h3>
            </div>
            <Card className="border-border/50 bg-muted/30 shadow-sm overflow-visible">
              <CardContent className="p-5 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status Atual</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger data-testid="select-admin-status" className="bg-background/50 border-border/40 hover:bg-background transition-colors h-10">
                        <SelectValue placeholder={getStatusLabel(project.status)} />
                      </SelectTrigger>
                      <SelectContent>
                        {statusConfigs.sort((a, b) => a.sortOrder - b.sortOrder).map(c => (
                          <SelectItem key={c.key} value={c.key} className="text-xs">{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Protocolo Concessionária</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input
                        value={newProtocolo}
                        onChange={e => setNewProtocolo(e.target.value)}
                        placeholder={project.numeroProtocolo || "Informe o protocolo"}
                        data-testid="input-admin-protocolo"
                        className="bg-background/50 border-border/40 hover:bg-background transition-colors pl-9 h-10"
                      />
                    </div>
                  </div>
                </div>

                {canEditValor && (
                  <div className="space-y-4 pt-2 border-t border-border/40">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valor do Projeto</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground/50">R$</span>
                          <Input
                            value={newValor}
                            onChange={e => setNewValor(e.target.value)}
                            placeholder={project.valor || "0,00"}
                            data-testid="input-admin-valor"
                            className="bg-background/50 border-border/40 hover:bg-background transition-colors pl-9 font-mono h-10"
                          />
                        </div>
                        {project.valor && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 ml-1">
                            <CreditCard className="h-3 w-3" /> Valor atual: <span className="font-bold text-foreground">R$ {project.valor}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {project.paymentStatus && (
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-0 shadow-sm ${
                              project.paymentStatus === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                              project.paymentStatus === "pending" ? "bg-amber-500/10 text-amber-600" :
                              "bg-rose-500/10 text-rose-600"
                            }`}>
                              {project.paymentStatus === "approved" ? "✓ Pago" :
                               project.paymentStatus === "pending" ? "⏳ Pendente" :
                               project.paymentStatus}
                            </Badge>
                            {project.paymentLink && (
                              <a href={project.paymentLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10" data-testid="link-admin-payment">
                                <ExternalLink className="h-3 w-3" /> MP
                              </a>
                            )}
                          </div>
                        )}
                        <div className="space-y-2">
                          {/* Active payment methods badges */}
                          {project.paymentId && project.paymentStatus !== "approved" && (
                            <div className="flex flex-wrap gap-1.5 mb-1">
                              <Badge variant="outline" className={`text-[10px] font-bold gap-1 ${
                                project.paymentGateway === "pagseguro"
                                  ? "bg-green-50 border-green-200 text-green-700"
                                  : "bg-sky-50 border-sky-200 text-sky-700"
                              }`}>
                                <CreditCard className="h-2.5 w-2.5" /> {project.paymentGateway === "pagseguro" ? "PagSeguro" : "Mercado Pago"}
                              </Badge>
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            {project.status === "aprovado_pagamento_pendente" && !project.paymentId && (
                              <div className="flex gap-2">
                                {hasMp && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-[10px] font-bold uppercase tracking-wider h-10 border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 no-default-hover-elevate"
                                    disabled={generatePaymentMut.isPending}
                                    onClick={() => handleGeneratePayment(project.id, "mp")}
                                    data-testid="button-generate-payment-mp"
                                  >
                                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                                    {generatePaymentMut.isPending ? "Gerando..." : "MP CPF"}
                                  </Button>
                                )}
                                {hasPs && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-[10px] font-bold uppercase tracking-wider h-10 border-green-200 text-green-700 bg-green-50 hover:bg-green-100 no-default-hover-elevate"
                                    disabled={generatePaymentMut.isPending}
                                    onClick={() => handleGeneratePayment(project.id, "pagseguro")}
                                    data-testid="button-generate-payment-ps"
                                  >
                                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                                    {generatePaymentMut.isPending ? "Gerando..." : "PagSeguro"}
                                  </Button>
                                )}
                                {hasAsaas && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-[10px] font-bold uppercase tracking-wider h-10 border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 no-default-hover-elevate"
                                    disabled={generatePaymentMut.isPending}
                                    onClick={() => handleGeneratePayment(project.id, "asaas")}
                                    data-testid="button-generate-payment-asaas"
                                  >
                                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                                    {generatePaymentMut.isPending ? "Gerando..." : "Asaas PIX"}
                                  </Button>
                                )}
                                {hasMp2 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-[10px] font-bold uppercase tracking-wider h-10 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 no-default-hover-elevate"
                                    disabled={generatePaymentMut.isPending}
                                    onClick={() => handleGeneratePayment(project.id, "mp2")}
                                    data-testid="button-generate-payment-mp2"
                                  >
                                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                                    {generatePaymentMut.isPending ? "Gerando..." : "MP CNPJ"}
                                  </Button>
                                )}
                                {!hasMp && !hasPs && !hasAsaas && !hasMp2 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-[10px] font-bold uppercase tracking-wider h-10 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 no-default-hover-elevate"
                                    disabled
                                    data-testid="button-generate-payment-disabled"
                                  >
                                    <CreditCard className="h-3.5 w-3.5 mr-2" />
                                    Nenhum gateway configurado
                                  </Button>
                                )}
                              </div>
                            )}
                            {project.paymentId && project.paymentStatus !== "approved" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-[10px] font-bold uppercase tracking-wider h-10 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 no-default-hover-elevate"
                                  disabled={cancelPaymentMut.isPending}
                                  onClick={() => cancelPaymentMut.mutate(project.id)}
                                  data-testid="button-cancel-payment"
                                >
                                  <ArrowLeftRight className={`h-3.5 w-3.5 mr-2 ${cancelPaymentMut.isPending ? "animate-spin" : ""}`} />
                                  {cancelPaymentMut.isPending ? "..." : "Cancelar"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-[10px] font-bold uppercase tracking-wider h-10 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 no-default-hover-elevate"
                                  disabled={verifyPaymentMut.isPending}
                                  onClick={() => verifyPaymentMut.mutate(project.id)}
                                  data-testid="button-verify-payment"
                                >
                                  <RefreshCw className={`h-3.5 w-3.5 mr-2 ${verifyPaymentMut.isPending ? "animate-spin" : ""}`} />
                                  {verifyPaymentMut.isPending ? "..." : "Verificar"}
                                </Button>
                              </div>
                            )}
                            {project.status === "aprovado_pagamento_pendente" && project.paymentStatus !== "approved" && ["admin", "financeiro"].includes(user?.role || "") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-[10px] font-bold uppercase tracking-wider h-10 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 no-default-hover-elevate"
                                onClick={() => setManualPaymentModal({ open: true, projectId: project.id, valor: project.valor || "", observacao: "" })}
                                data-testid="button-confirm-manual-payment"
                              >
                                <BadgeCheck className="h-3.5 w-3.5 mr-2" />
                                Confirmar Pagamento Manual
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignment */}
                {internalUsers.length > 0 && (
                  <div className="pt-4 border-t border-border/40">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-3">Atribuição de Responsáveis</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground font-medium">Engenharia</Label>
                        <Select value={assignEngineerId} onValueChange={setAssignEngineerId}>
                          <SelectTrigger className="h-9 text-xs bg-background/50 border-border/40" data-testid="select-assign-engineer">
                            <SelectValue placeholder={(project as any).assignedEngineerId ? internalUsers.find(u => u.id === (project as any).assignedEngineerId)?.name ?? "Atribuído" : "Nenhum"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-xs">Nenhum</SelectItem>
                            {internalUsers.map(u => <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground font-medium">Instalação</Label>
                        <Select value={assignInstallerId} onValueChange={setAssignInstallerId}>
                          <SelectTrigger className="h-9 text-xs bg-background/50 border-border/40" data-testid="select-assign-installer">
                            <SelectValue placeholder={(project as any).assignedInstallerId ? internalUsers.find(u => u.id === (project as any).assignedInstallerId)?.name ?? "Atribuído" : "Nenhum"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-xs">Nenhum</SelectItem>
                            {internalUsers.map(u => <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground font-medium">Gestão</Label>
                        <Select value={assignManagerId} onValueChange={setAssignManagerId}>
                          <SelectTrigger className="h-9 text-xs bg-background/50 border-border/40" data-testid="select-assign-manager">
                            <SelectValue placeholder={(project as any).assignedManagerId ? internalUsers.find(u => u.id === (project as any).assignedManagerId)?.name ?? "Atribuído" : "Nenhum"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-xs">Nenhum</SelectItem>
                            {internalUsers.map(u => <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border/40 flex justify-end">
                  <Button
                    size="default"
                    className="w-full sm:w-auto px-8 font-bold uppercase tracking-wider text-xs shadow-md"
                    disabled={updateMut.isPending}
                    onClick={handleUpdateStatus}
                    data-testid="button-admin-update-project"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {updateMut.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Admin — Notes */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notas Internas</h3>
            </div>
            <Card className="border-border/50 bg-muted/30 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <Textarea
                  value={timelineNote}
                  onChange={e => setTimelineNote(e.target.value)}
                  placeholder="Descreva uma atualização importante ou observação técnica..."
                  className="bg-background/50 border-border/40 hover:bg-background transition-colors min-h-[100px] text-sm resize-none"
                  data-testid="textarea-admin-note"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-bold uppercase tracking-wider text-[10px] h-9 px-4 border-border/60"
                    onClick={handleAddNote}
                    disabled={addTimelineMut.isPending || !timelineNote.trim()}
                    data-testid="button-admin-add-note"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    {addTimelineMut.isPending ? "Adicionando..." : "Adicionar Nota"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Admin — Enviar Documentos (Projeto + ART) */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Documentação Técnica</h3>
            </div>
            <Card className="border-border/50 bg-muted/30 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Projeto Técnico */}
                  <label className="cursor-pointer group" data-testid="upload-admin-projeto">
                    <div className={`flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
                      uploadingDoc === "projeto_aprovado"
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border/60 bg-background/50 group-hover:border-primary/40 group-hover:bg-background group-hover:shadow-sm"
                    }`}>
                      <div className={`p-2 rounded-lg ${uploadingDoc === "projeto_aprovado" ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10 transition-colors"}`}>
                        <FileText className={`h-5 w-5 ${uploadingDoc === "projeto_aprovado" ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">Projeto Elétrico</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                          {uploadingDoc === "projeto_aprovado" ? "Enviando arquivo..." : "Clique para selecionar"}
                        </p>
                      </div>
                      {uploadingDoc === "projeto_aprovado" && <RefreshCw className="h-4 w-4 text-primary animate-spin flex-shrink-0" />}
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
                  <label className="cursor-pointer group" data-testid="upload-admin-art">
                    <div className={`flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
                      uploadingDoc === "art"
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border/60 bg-background/50 group-hover:border-primary/40 group-hover:bg-background group-hover:shadow-sm"
                    }`}>
                      <div className={`p-2 rounded-lg ${uploadingDoc === "art" ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10 transition-colors"}`}>
                        <FileText className={`h-5 w-5 ${uploadingDoc === "art" ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">ART</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                          {uploadingDoc === "art" ? "Enviando arquivo..." : "Clique para selecionar"}
                        </p>
                      </div>
                      {uploadingDoc === "art" && <RefreshCw className="h-4 w-4 text-primary animate-spin flex-shrink-0" />}
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
              </CardContent>
            </Card>
          </section>

          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-11 bg-muted/50 p-1 border border-border/40 rounded-xl mb-6">
              <TabsTrigger value="detalhes" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Detalhes</TabsTrigger>
              <TabsTrigger value="equipamento" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Equipamentos</TabsTrigger>
              <TabsTrigger value="documentos" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Arquivos</TabsTrigger>
              <TabsTrigger value="timeline" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-8 mt-0 focus-visible:ring-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Instalação</h3>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/30 space-y-1">
                    <InfoRow label="Concessionária" value={project.concessionaria} />
                    <InfoRow label="Nº Instalação" value={project.numeroInstalacao} />
                    <InfoRow label="Tipo Conexão" value={project.tipoConexao ? project.tipoConexao.charAt(0).toUpperCase() + project.tipoConexao.slice(1) : null} />
                    <InfoRow label="Disjuntor" value={project.amperagemDisjuntor} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Localização</h3>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/30 space-y-1">
                    <InfoRow label="Endereço" value={`${project.rua || ""}, ${project.numero || ""} - ${project.bairro || ""}`} />
                    <InfoRow label="Cidade/UF" value={`${project.cidade || ""} / ${project.estado || ""}`} />
                    <InfoRow label="CEP" value={project.cep} />
                    <InfoRow label="Mapa" value={project.localizacao} link />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Beneficiário</h3>
                </div>
                <div className="bg-muted/20 rounded-xl p-4 border border-border/30 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                  <InfoRow label="Nome Completo" value={project.nomeCliente} />
                  <InfoRow label="CPF/CNPJ" value={project.cpfCnpjCliente} />
                  <InfoRow label="Telefone" value={project.telefoneCliente} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="equipamento" className="mt-0 focus-visible:ring-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border/40 shadow-sm bg-muted/10">
                  <CardHeader className="pb-3 border-b border-border/30 bg-muted/20 rounded-t-xl">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Cpu className="h-3.5 w-3.5 text-primary" /> Sistema de Inversão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-1">
                    <InfoRow label="Marca" value={project.marcaInversor} />
                    <InfoRow label="Modelo" value={project.modeloInversor} />
                    <InfoRow label="Potência" value={project.potenciaInversor} />
                    <InfoRow label="Quantidade" value={project.quantidadeInversor} />
                  </CardContent>
                </Card>

                <Card className="border-border/40 shadow-sm bg-muted/10">
                  <CardHeader className="pb-3 border-b border-border/30 bg-muted/20 rounded-t-xl">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Sun className="h-3.5 w-3.5 text-primary" /> Módulos Fotovoltaicos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-1">
                    <InfoRow label="Marca" value={project.marcaPainel} />
                    <InfoRow label="Modelo" value={project.modeloPainel} />
                    <InfoRow label="Potência Unit." value={project.potenciaPainel} />
                    <InfoRow label="Qtd. Painéis" value={project.quantidadePaineis} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="mt-0 focus-visible:ring-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {docsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl bg-muted" />
                  ))
                ) : docs.length > 0 ? (
                  docs.map(doc => (
                    <div key={doc.id} className="group relative flex items-center gap-3 p-3 bg-muted/30 border border-border/40 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border/30 group-hover:border-primary/30 transition-colors shadow-sm">
                        <FileText className="h-5 w-5 text-primary/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-foreground truncate uppercase tracking-tight">{DOC_TYPE_LABELS[doc.docType] || "Documento"}</p>
                        <p className="text-[10px] text-muted-foreground truncate font-mono">{doc.name}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        {canDeleteDocs && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteDocMut.mutate(doc.id)}
                            disabled={deleteDocMut.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/60">
                    <FolderOpen className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-xs font-medium uppercase tracking-widest">Nenhum documento arquivado</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0 focus-visible:ring-0">
              <div className="space-y-6 pl-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary/50 before:via-primary/20 before:to-transparent">
                {tlLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted ml-6" />
                  ))
                ) : timeline.length > 0 ? (
                  timeline.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()).map((item, i) => (
                    <div key={item.id} className="relative pl-8">
                      <div className={`absolute left-[-13px] top-1.5 h-6 w-6 rounded-full border-4 border-background shadow-sm flex items-center justify-center ${
                        item.createdByRole === "integrador" ? "bg-primary" : "bg-emerald-500"
                      }`}>
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                      <div className="bg-muted/30 border border-border/30 rounded-xl p-4 hover:bg-muted/50 transition-colors shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                            {item.event}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(item.createdAt!).toLocaleString("pt-BR", {
                              day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/90 leading-relaxed italic">{item.details}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0 border-0 bg-background/60 shadow-none">
                            {item.createdByRole}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/60 ml-6">
                    <Activity className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-xs font-medium uppercase tracking-widest">Início da jornada do projeto</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Chat Panel */}
          <section className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Comunicação Direta</h3>
            </div>
            <div className="rounded-2xl border border-border/40 shadow-xl overflow-hidden bg-background">
              {/* Termo de Aceite */}
      {isAdmin && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Termo de Aceite</span>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          {termAcceptance ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Termo aceito</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{termAcceptance.term_version && `v${termAcceptance.term_version}`}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Integrador:</span> <span className="font-medium">{termAcceptance.integrator_name}</span></div>
                <div><span className="text-muted-foreground">Documento:</span> <span className="font-medium">{termAcceptance.integrator_document || "—"}</span></div>
                <div><span className="text-muted-foreground">Aceito em:</span> <span className="font-medium">{termAcceptance.accepted_at ? new Date(termAcceptance.accepted_at).toLocaleString("pt-BR") : "—"}</span></div>
                <div><span className="text-muted-foreground">IP:</span> <span className="font-mono text-[10px]">{termAcceptance.accepted_ip || "—"}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Hash SHA-256:</span> <span className="font-mono text-[10px] break-all">{termAcceptance.term_hash?.slice(0, 32)}...</span></div>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">Ver conteúdo do termo aceito</summary>
                <div className="mt-2 p-3 bg-muted/30 rounded-lg font-mono text-[10px] whitespace-pre-wrap max-h-48 overflow-y-auto">{termAcceptance.term_content}</div>
              </details>
            </div>
          ) : (
            <div className="rounded-xl border border-muted/40 bg-muted/10 p-4 flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Termo ainda não aceito pelo integrador</span>
            </div>
          )}
        </div>
      )}

      <ChatPanel projectId={project.id} currentUserId={user?.id || ""} currentUserRole={user?.role || "integrador"} />
            </div>
          </section>
        </div>
      </SheetContent>

    </Sheet>
  );
}

const CONCESSIONARIAS_ADMIN = [
  "ENEL SP", "ENEL CE", "ENEL GO", "ENEL RJ",
  "CEMIG", "COPEL", "CPFL", "RGE", "ELEKTRO",
  "ENERGISA", "COELBA", "CELPE", "EQUATORIAL",
  "COSERN", "CELESC", "LIGHT", "EDP", "Outra",
];
const AMPERAGENS_ADMIN = ["15A", "20A", "25A", "30A", "40A", "50A", "60A", "70A", "80A", "100A", "Outro"];

interface AdminProjectForm {
  clientId: string;
  title: string;
  nomeCliente: string;
  cpfCnpjCliente: string;
  telefoneCliente: string;
  concessionaria: string;
  numeroInstalacao: string;
  tipoConexao: string;
  amperagemDisjuntor: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  localizacao: string;
  marcaInversor: string;
  modeloInversor: string;
  potenciaInversor: string;
  quantidadeInversor: string;
  marcaPainel: string;
  modeloPainel: string;
  potenciaPainel: string;
  quantidadePaineis: string;
  potencia: string;
}

function AdminNewProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AdminProjectForm>({
    defaultValues: {
      clientId: "", title: "", nomeCliente: "", cpfCnpjCliente: "", telefoneCliente: "",
      concessionaria: "", numeroInstalacao: "", tipoConexao: "monofasico", amperagemDisjuntor: "",
      cep: "", rua: "", numero: "", bairro: "", cidade: "", estado: "", localizacao: "",
      marcaInversor: "", modeloInversor: "", potenciaInversor: "", quantidadeInversor: "",
      marcaPainel: "", modeloPainel: "", potenciaPainel: "", quantidadePaineis: "", potencia: "",
    }
  });

  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const integradores = clients.filter(c => c.tipo === "integrador" || !c.tipo);
  const todosClientes = clients;

  const cep = watch("cep");

  useEffect(() => {
    const digits = cep?.replace(/\D/g, "");
    if (digits?.length === 8) {
      fetch(`https://viacep.com.br/ws/${digits}/json/`)
        .then(r => r.json())
        .then(d => {
          if (!d.erro) {
            setValue("rua", d.logradouro || "");
            setValue("bairro", d.bairro || "");
            setValue("cidade", d.localidade || "");
            setValue("estado", d.uf || "");
          }
        }).catch(() => {});
    }
  }, [cep, setValue]);

  // Calcula potencia total automaticamente (potenciaPainel * quantidadePaineis / 1000)
  const watchPotenciaPainel = watch("potenciaPainel");
  const watchQuantidadePaineis = watch("quantidadePaineis");
  useEffect(() => {
    const unit = parseFloat(watchPotenciaPainel || "0");
    const qty = parseFloat(watchQuantidadePaineis || "0");
    if (unit > 0 && qty > 0) {
      setValue("potencia", ((unit * qty) / 1000).toFixed(2).replace(".", ","));
    }
  }, [watchPotenciaPainel, watchQuantidadePaineis, setValue]);

  const createMut = useMutation({
    mutationFn: (data: AdminProjectForm) => apiRequest("POST", "/api/projects", {
      clientId: data.clientId || undefined,
      title: data.title,
      nomeCliente: data.nomeCliente,
      cpfCnpjCliente: data.cpfCnpjCliente,
      telefoneCliente: data.telefoneCliente || undefined,
      concessionaria: data.concessionaria || undefined,
      numeroInstalacao: data.numeroInstalacao || undefined,
      tipoConexao: data.tipoConexao || undefined,
      amperagemDisjuntor: data.amperagemDisjuntor || undefined,
      cep: data.cep || undefined,
      rua: data.rua || undefined,
      numero: data.numero || undefined,
      bairro: data.bairro || undefined,
      cidade: data.cidade || undefined,
      estado: data.estado || undefined,
      localizacao: data.localizacao || undefined,
      marcaInversor: data.marcaInversor || undefined,
      modeloInversor: data.modeloInversor || undefined,
      potenciaInversor: data.potenciaInversor || undefined,
      quantidadeInversor: data.quantidadeInversor || undefined,
      marcaPainel: data.marcaPainel || undefined,
      modeloPainel: data.modeloPainel || undefined,
      potenciaPainel: data.potenciaPainel || undefined,
      quantidadePaineis: data.quantidadePaineis || undefined,
      potencia: data.potencia || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Projeto criado com sucesso!" });
      reset();
      onClose();
    },
    onError: (err: any) => toast({ title: "Erro ao criar projeto", description: err.message, variant: "destructive" }),
  });

  const onSubmit = (data: AdminProjectForm) => createMut.mutate(data);

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2 pt-4 pb-1">
      <div className="h-px flex-1 bg-border/40" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{children}</span>
      <div className="h-px flex-1 bg-border/40" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Novo Projeto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <SectionTitle>Vínculo</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Integrador responsável</Label>
              <select
                {...register("clientId")}
                data-testid="select-admin-new-integrador"
                className="mt-1.5 w-full h-10 rounded-xl border border-border/40 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                onChange={e => {
                  const found = integradores.find(c => c.id === e.target.value);
                  if (found) {
                    setValue("clientId", found.id);
                  } else {
                    setValue("clientId", e.target.value);
                  }
                }}
              >
                <option value="">— Sem integrador —</option>
                {integradores.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ou selecione um cliente</Label>
              <select
                data-testid="select-admin-new-cliente"
                className="mt-1.5 w-full h-10 rounded-xl border border-border/40 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                onChange={e => setValue("clientId", e.target.value)}
              >
                <option value="">— Selecione um cliente —</option>
                {todosClientes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ""}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60">Selecione integrador <strong>ou</strong> cliente — apenas um vínculo por projeto.</p>

          <SectionTitle>Identificação</SectionTitle>
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Título do Projeto *</Label>
            <Input
              {...register("title", { required: "Obrigatório" })}
              placeholder="Ex: Residencial João Silva"
              className="mt-1.5 rounded-xl border-border/40"
              data-testid="input-new-project-title"
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <SectionTitle>Dados do Titular</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome Completo *</Label>
              <Input
                {...register("nomeCliente", { required: "Obrigatório" })}
                placeholder="Nome do titular"
                className="mt-1.5 rounded-xl border-border/40"
                data-testid="input-new-project-nome"
              />
              {errors.nomeCliente && <p className="text-xs text-destructive mt-1">{errors.nomeCliente.message}</p>}
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CPF / CNPJ *</Label>
              <Input
                {...register("cpfCnpjCliente", { required: "Obrigatório" })}
                placeholder="000.000.000-00"
                className="mt-1.5 rounded-xl border-border/40"
                data-testid="input-new-project-cpf"
              />
              {errors.cpfCnpjCliente && <p className="text-xs text-destructive mt-1">{errors.cpfCnpjCliente.message}</p>}
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Telefone</Label>
              <Input
                {...register("telefoneCliente")}
                placeholder="(66) 99999-0000"
                className="mt-1.5 rounded-xl border-border/40"
                data-testid="input-new-project-telefone"
              />
            </div>
          </div>

          <SectionTitle>Concessionária</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Concessionária</Label>
              <select
                {...register("concessionaria")}
                data-testid="select-new-project-concessionaria"
                className="mt-1.5 w-full h-10 rounded-xl border border-border/40 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecione...</option>
                {CONCESSIONARIAS_ADMIN.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nº Instalação</Label>
              <Input
                {...register("numeroInstalacao")}
                placeholder="Número da UC"
                className="mt-1.5 rounded-xl border-border/40"
                data-testid="input-new-project-instalacao"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo de Conexão</Label>
              <select
                {...register("tipoConexao")}
                data-testid="select-new-project-conexao"
                className="mt-1.5 w-full h-10 rounded-xl border border-border/40 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="monofasico">Monofásico</option>
                <option value="bifasico">Bifásico</option>
                <option value="trifasico">Trifásico</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Disjuntor</Label>
              <select
                {...register("amperagemDisjuntor")}
                data-testid="select-new-project-disjuntor"
                className="mt-1.5 w-full h-10 rounded-xl border border-border/40 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecione...</option>
                {AMPERAGENS_ADMIN.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <SectionTitle>Endereço</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CEP</Label>
              <Input
                {...register("cep")}
                placeholder="00000-000"
                className="mt-1.5 rounded-xl border-border/40"
                data-testid="input-new-project-cep"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rua</Label>
              <Input
                {...register("rua")}
                placeholder="Rua, Avenida..."
                className="mt-1.5 rounded-xl border-border/40"
                data-testid="input-new-project-rua"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Número</Label>
              <Input
                {...register("numero")}
                placeholder="Nº"
                className="mt-1.5 rounded-xl border-border/40"
                data-testid="input-new-project-numero"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bairro</Label>
              <Input
                {...register("bairro")}
                placeholder="Bairro"
                className="mt-1.5 rounded-xl border-border/40"
                data-testid="input-new-project-bairro"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cidade</Label>
              <Input
                {...register("cidade")}
                placeholder="Cidade"
                className="mt-1.5 rounded-xl border-border/40"
                data-testid="input-new-project-cidade"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estado (UF)</Label>
              <Input
                {...register("estado")}
                placeholder="MT"
                maxLength={2}
                className="mt-1.5 rounded-xl border-border/40"
                data-testid="input-new-project-estado"
              />
            </div>
            <div className="col-span-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Link Google Maps (opcional)</Label>
              <Input
                {...register("localizacao")}
                placeholder="https://maps.google.com/..."
                className="mt-1.5 rounded-xl border-border/40"
                data-testid="input-new-project-maps"
              />
            </div>
          </div>

          <SectionTitle>Equipamentos (opcional)</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
              <Cpu className="h-3 w-3" /> Inversor
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marca</Label>
              <Input {...register("marcaInversor")} placeholder="Ex: Fronius" className="mt-1.5 rounded-xl border-border/40" data-testid="input-new-project-marca-inv" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Modelo</Label>
              <Input {...register("modeloInversor")} placeholder="Ex: Primo GEN24" className="mt-1.5 rounded-xl border-border/40" data-testid="input-new-project-modelo-inv" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Potência (W)</Label>
              <Input {...register("potenciaInversor")} type="text" inputMode="decimal" placeholder="Ex: 5000" className="mt-1.5 rounded-xl border-border/40" data-testid="input-new-project-pot-inv" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quantidade</Label>
              <Input {...register("quantidadeInversor")} placeholder="Ex: 1" type="number" className="mt-1.5 rounded-xl border-border/40" data-testid="input-new-project-qtd-inv" />
            </div>

            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 pt-2">
              <Sun className="h-3 w-3" /> Painéis
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marca</Label>
              <Input {...register("marcaPainel")} placeholder="Ex: BYD" className="mt-1.5 rounded-xl border-border/40" data-testid="input-new-project-marca-painel" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Modelo</Label>
              <Input {...register("modeloPainel")} placeholder="Ex: HVS 10.24" className="mt-1.5 rounded-xl border-border/40" data-testid="input-new-project-modelo-painel" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Potência Unit. (W)</Label>
              <Input {...register("potenciaPainel")} type="text" inputMode="decimal" placeholder="Ex: 550" className="mt-1.5 rounded-xl border-border/40" data-testid="input-new-project-pot-painel" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Qtd. Painéis</Label>
              <Input {...register("quantidadePaineis")} placeholder="Ex: 12" type="number" className="mt-1.5 rounded-xl border-border/40" data-testid="input-new-project-qtd-painel" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Potência Total do Sistema (kWp)</Label>
              <Input {...register("potencia")} placeholder="Calculado automaticamente" className="mt-1.5 rounded-xl border-border/40 font-bold" data-testid="input-new-project-potencia-total" />
              <p className="text-[10px] text-muted-foreground mt-1">Calculado automaticamente a partir da potência e quantidade de painéis. Pode editar manualmente.</p>
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={createMut.isPending} className="rounded-xl" data-testid="button-admin-create-project">
              {createMut.isPending ? "Criando..." : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminEditProjectDialog({ projectId, open, onClose }: { projectId: string | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AdminProjectForm>();

  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const integradores = clients.filter((c: any) => c.tipo === "integrador" || !c.tipo);
  const todosClientes = clients;

  const { data: project } = useQuery<ProjectWithClient>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId && open,
  });

  // Preencher o formulário com dados do projeto ao abrir
  useEffect(() => {
    if (project && open) {
      reset({
        clientId: project.clientId || "",
        title: project.title || "",
        nomeCliente: project.nomeCliente || "",
        cpfCnpjCliente: project.cpfCnpjCliente || "",
        telefoneCliente: project.telefoneCliente || "",
        concessionaria: project.concessionaria || "",
        numeroInstalacao: project.numeroInstalacao || "",
        tipoConexao: (project as any).tipoConexao || "monofasico",
        amperagemDisjuntor: (project as any).amperagemDisjuntor || "",
        cep: (project as any).cep || "",
        rua: (project as any).rua || "",
        numero: (project as any).numero || "",
        bairro: (project as any).bairro || "",
        cidade: (project as any).cidade || "",
        estado: (project as any).estado || "",
        localizacao: project.localizacao || "",
        marcaInversor: (project as any).marcaInversor || "",
        modeloInversor: (project as any).modeloInversor || "",
        potenciaInversor: (project as any).potenciaInversor || "",
        quantidadeInversor: (project as any).quantidadeInversor || "",
        marcaPainel: (project as any).marcaPainel || "",
        modeloPainel: (project as any).modeloPainel || "",
        potenciaPainel: (project as any).potenciaPainel || "",
        quantidadePaineis: (project as any).quantidadePaineis || "",
        potencia: project.potencia || "",
      });
    }
  }, [project, open, reset]);

  // CEP auto-complete
  const cep = watch("cep");
  useEffect(() => {
    const digits = cep?.replace(/\D/g, "");
    if (digits?.length === 8) {
      fetch(`https://viacep.com.br/ws/${digits}/json/`)
        .then(r => r.json())
        .then(d => {
          if (!d.erro) {
            setValue("rua", d.logradouro || "");
            setValue("bairro", d.bairro || "");
            setValue("cidade", d.localidade || "");
            setValue("estado", d.uf || "");
          }
        }).catch(() => {});
    }
  }, [cep, setValue]);

  // Calcula potencia total automaticamente
  const watchPotenciaPainel = watch("potenciaPainel");
  const watchQuantidadePaineis = watch("quantidadePaineis");
  useEffect(() => {
    const unit = parseFloat(watchPotenciaPainel || "0");
    const qty = parseFloat(watchQuantidadePaineis || "0");
    if (unit > 0 && qty > 0) {
      setValue("potencia", ((unit * qty) / 1000).toFixed(2).replace(".", ","));
    }
  }, [watchPotenciaPainel, watchQuantidadePaineis, setValue]);

  const updateMut = useMutation({
    mutationFn: (data: AdminProjectForm) => apiRequest("PATCH", `/api/projects/${projectId}`, {
      clientId: data.clientId || undefined,
      title: data.title,
      nomeCliente: data.nomeCliente,
      cpfCnpjCliente: data.cpfCnpjCliente,
      telefoneCliente: data.telefoneCliente || undefined,
      concessionaria: data.concessionaria || undefined,
      numeroInstalacao: data.numeroInstalacao || undefined,
      tipoConexao: data.tipoConexao || undefined,
      amperagemDisjuntor: data.amperagemDisjuntor || undefined,
      cep: data.cep || undefined,
      rua: data.rua || undefined,
      numero: data.numero || undefined,
      bairro: data.bairro || undefined,
      cidade: data.cidade || undefined,
      estado: data.estado || undefined,
      localizacao: data.localizacao || undefined,
      marcaInversor: data.marcaInversor || undefined,
      modeloInversor: data.modeloInversor || undefined,
      potenciaInversor: data.potenciaInversor || undefined,
      quantidadeInversor: data.quantidadeInversor || undefined,
      marcaPainel: data.marcaPainel || undefined,
      modeloPainel: data.modeloPainel || undefined,
      potenciaPainel: data.potenciaPainel || undefined,
      quantidadePaineis: data.quantidadePaineis || undefined,
      potencia: data.potencia || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({ title: "✅ Projeto atualizado com sucesso!" });
      onClose();
    },
    onError: (err: any) => toast({ title: "Erro ao atualizar projeto", description: err.message, variant: "destructive" }),
  });

  const onSubmit = (data: AdminProjectForm) => updateMut.mutate(data);

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2 pt-4 pb-1">
      <div className="h-px flex-1 bg-border/40" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{children}</span>
      <div className="h-px flex-1 bg-border/40" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Projeto — {project?.ticketNumber || ""}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <SectionTitle>Vínculo</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Integrador responsável</Label>
              <select
                {...register("clientId")}
                className="mt-1.5 w-full h-10 rounded-xl border border-border/40 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">— Sem integrador —</option>
                {integradores.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ou selecione um cliente</Label>
              <select
                className="mt-1.5 w-full h-10 rounded-xl border border-border/40 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                onChange={e => setValue("clientId", e.target.value)}
              >
                <option value="">— Selecione um cliente —</option>
                {todosClientes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ""}</option>
                ))}
              </select>
            </div>
          </div>

          <SectionTitle>Identificação</SectionTitle>
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Título do Projeto *</Label>
            <Input {...register("title", { required: "Obrigatório" })} className="mt-1.5 rounded-xl border-border/40" />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <SectionTitle>Dados do Titular</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome Completo *</Label>
              <Input {...register("nomeCliente", { required: "Obrigatório" })} className="mt-1.5 rounded-xl border-border/40" />
              {errors.nomeCliente && <p className="text-xs text-destructive mt-1">{errors.nomeCliente.message}</p>}
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CPF / CNPJ *</Label>
              <Input {...register("cpfCnpjCliente", { required: "Obrigatório" })} className="mt-1.5 rounded-xl border-border/40" />
              {errors.cpfCnpjCliente && <p className="text-xs text-destructive mt-1">{errors.cpfCnpjCliente.message}</p>}
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Telefone</Label>
              <Input {...register("telefoneCliente")} className="mt-1.5 rounded-xl border-border/40" />
            </div>
          </div>

          <SectionTitle>Concessionária</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Concessionária</Label>
              <select {...register("concessionaria")} className="mt-1.5 w-full h-10 rounded-xl border border-border/40 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Selecione...</option>
                {CONCESSIONARIAS_ADMIN.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nº Instalação</Label>
              <Input {...register("numeroInstalacao")} className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo de Conexão</Label>
              <select {...register("tipoConexao")} className="mt-1.5 w-full h-10 rounded-xl border border-border/40 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="monofasico">Monofásico</option>
                <option value="bifasico">Bifásico</option>
                <option value="trifasico">Trifásico</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Disjuntor</Label>
              <select {...register("amperagemDisjuntor")} className="mt-1.5 w-full h-10 rounded-xl border border-border/40 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Selecione...</option>
                {AMPERAGENS_ADMIN.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <SectionTitle>Endereço</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CEP</Label>
              <Input {...register("cep")} placeholder="00000-000" className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rua / Logradouro</Label>
              <Input {...register("rua")} className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Número</Label>
              <Input {...register("numero")} className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bairro</Label>
              <Input {...register("bairro")} className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cidade</Label>
              <Input {...register("cidade")} className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estado (UF)</Label>
              <Input {...register("estado")} placeholder="MT" maxLength={2} className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Link Google Maps</Label>
              <Input {...register("localizacao")} placeholder="https://maps.google.com/..." className="mt-1.5 rounded-xl border-border/40" />
            </div>
          </div>

          <SectionTitle>Inversor</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marca</Label>
              <Input {...register("marcaInversor")} className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Modelo</Label>
              <Input {...register("modeloInversor")} className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Potência (kW)</Label>
              <Input {...register("potenciaInversor")} type="text" inputMode="decimal" placeholder="Ex: 7.5" className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quantidade</Label>
              <Input {...register("quantidadeInversor")} type="text" inputMode="numeric" className="mt-1.5 rounded-xl border-border/40" />
            </div>
          </div>

          <SectionTitle>Módulos Fotovoltaicos</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marca</Label>
              <Input {...register("marcaPainel")} className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Modelo</Label>
              <Input {...register("modeloPainel")} className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Potência Unit. (Wp)</Label>
              <Input {...register("potenciaPainel")} type="text" inputMode="decimal" placeholder="Ex: 610" className="mt-1.5 rounded-xl border-border/40" />
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Qtd. Painéis</Label>
              <Input {...register("quantidadePaineis")} type="text" inputMode="numeric" className="mt-1.5 rounded-xl border-border/40" />
            </div>
          </div>

          <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Potência Total do Sistema (kWp)</Label>
            <Input {...register("potencia")} className="mt-1.5 rounded-xl border-border/40 font-bold text-lg" />
            <p className="text-[10px] text-muted-foreground/60 mt-1">Calculado automaticamente. Pode editar manualmente.</p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
            <Button type="submit" disabled={updateMut.isPending} className="gap-2">
              {updateMut.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [tab, setTab] = useState("ativos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showNewProject, setShowNewProject] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const canDelete = user?.role === "admin";

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

  const getStatusProgress = (key: string): number => {
    const active = statusConfigs.filter(s => s.key !== "cancelado").sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = active.findIndex(s => s.key === key);
    if (idx < 0 || key === "cancelado") return 0;
    return Math.round(((idx + 1) / active.length) * 100);
  };

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

  const [manualPaymentModal, setManualPaymentModal] = useState<{ open: boolean; projectId: string; valor: string; observacao: string } | null>(null);

  const confirmManualPaymentMut = useMutation({
    mutationFn: ({ projectId, valor, observacao }: { projectId: string; valor: string; observacao: string }) =>
      apiRequest("POST", `/api/projects/${projectId}/confirm-payment-manual`, { valor, observacao }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "archived"] });
      toast({ title: "✅ Pagamento confirmado manualmente!" });
      setManualPaymentModal(null);
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao confirmar pagamento", variant: "destructive" }),
  });

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

  const [clientFilter, setClientFilter] = useState("todos");
  const [concessionariaFilter, setConcessionariaFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({});

  const toggleStateCollapse = (estado: string) => {
    setCollapsedStates(prev => ({ ...prev, [estado]: !prev[estado] }));
  };

  const uniqueClients = Array.from(new Set(currentList.map(p => p.client?.name || p.nomeCliente).filter(Boolean))) as string[];
  const uniqueConcessionarias = Array.from(new Set(currentList.map(p => p.concessionaria).filter(Boolean))) as string[];
  const uniqueEstados = Array.from(new Set(currentList.map(p => p.estado?.toUpperCase()).filter(Boolean))).sort() as string[];

  const canGroupByState = ["admin", "engenharia"].includes(user?.role || "");

  const filtered = currentList.filter(p => {
    const s = search.toLowerCase();
    const matchesSearch = !s ||
      p.title.toLowerCase().includes(s) ||
      p.client?.name?.toLowerCase().includes(s) ||
      p.nomeCliente?.toLowerCase().includes(s) ||
      p.concessionaria?.toLowerCase().includes(s) ||
      (p.ticketNumber || "").toLowerCase().includes(s) ||
      (p.endereco || "").toLowerCase().includes(s) ||
      (p.numeroInstalacao || "").toLowerCase().includes(s);
    const matchesStatus = statusFilter === "todos" || p.status === statusFilter;
    const matchesClient = clientFilter === "todos" || (p.client?.name || p.nomeCliente) === clientFilter;
    const matchesConcessionaria = concessionariaFilter === "todos" || p.concessionaria === concessionariaFilter;
    const matchesEstado = estadoFilter === "todos" || (estadoFilter === "__sem_estado__" ? !p.estado : (p.estado?.toUpperCase() === estadoFilter));
    return matchesSearch && matchesStatus && matchesClient && matchesConcessionaria && matchesEstado;
  });

  // Separar projetos próprios (sem integrador portal) dos de integradores
  // Projeto próprio = não tem usuário integrador vinculado (integrador é null)
  const isOwnProject = (p: any) => !(p as any).integrador;
  const filteredOwn = filtered.filter(isOwnProject);
  const filteredIntegradores = filtered.filter(p => !isOwnProject(p));
  const [ownCollapsed, setOwnCollapsed] = useState(false);

  // Agrupamento por estado (apenas para admin e engenharia) - só projetos de integradores
  const groupedByEstado = canGroupByState ? (() => {
    const groups: Record<string, typeof filteredIntegradores> = {};
    for (const p of filteredIntegradores) {
      const key = p.estado?.toUpperCase() || "__sem_estado__";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    const sorted = Object.keys(groups).sort((a, b) => {
      if (a === "__sem_estado__") return 1;
      if (b === "__sem_estado__") return -1;
      return a.localeCompare(b);
    });
    return sorted.map(key => ({ key, label: key === "__sem_estado__" ? "Sem Estado" : key, projects: groups[key] }));
  })() : [{ key: "all", label: "", projects: filteredIntegradores }];

  const exportCSV = () => {
    const headers = ["Ticket", "Título", "Cliente", "Status", "Potência (kWp)", "Concessionária", "Valor", "Endereço"];
    const rows = filtered.map(p => [
      p.ticketNumber || "",
      p.title,
      p.client?.name || p.nomeCliente || "",
      getStatusLabel(p.status),
      p.potencia || "",
      p.concessionaria || "",
      p.valor ? `R$ ${parseFloat(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "",
      p.endereco || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projetos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${filtered.length} projeto(s) exportado(s) para CSV` });
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Gestão de Operações</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground" data-testid="text-page-title">Projetos</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {projects.length} projeto{projects.length !== 1 ? "s" : ""} em andamento
            {archived.length > 0 && (
              <>
                <span className="mx-2 text-border">|</span>
                <span className="text-muted-foreground/60">{archived.length} arquivado{archived.length !== 1 ? "s" : ""}</span>
              </>
            )}
            {filtered.length !== currentList.length && (
              <>
                <span className="mx-2 text-border">|</span>
                <span className="text-primary font-bold">{filtered.length} exibido{filtered.length !== 1 ? "s" : ""}</span>
              </>
            )}
          </p>
        </div>
        
        <Tabs value={tab} onValueChange={v => { setTab(v); setStatusFilter("todos"); setClientFilter("todos"); setConcessionariaFilter("todos"); setEstadoFilter("todos"); setSearch(""); }} className="bg-muted/30 p-1 rounded-xl border border-border/40 w-full md:w-auto">
          <TabsList className="bg-transparent h-10 gap-1">
            <TabsTrigger value="ativos" data-testid="tab-ativos" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FolderOpen className="h-3.5 w-3.5 mr-2" /> Ativos
            </TabsTrigger>
            <TabsTrigger value="arquivados" data-testid="tab-arquivados" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Archive className="h-3.5 w-3.5 mr-2" /> Arquivados
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="border-border/40 shadow-sm bg-muted/10 overflow-visible rounded-2xl">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Pesquisar por cliente, integrador, ticket..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background border-border/40 focus:border-primary/50 transition-all rounded-xl shadow-inner text-sm"
              data-testid="input-search-projects"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 bg-background border-border/40 rounded-xl px-4 text-xs font-bold uppercase tracking-wider" data-testid="select-filter-status">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="todos" className="text-[10px] font-bold uppercase tracking-widest">Todos os Status</SelectItem>
                  {statusConfigs.sort((a, b) => a.sortOrder - b.sortOrder).map(c => (
                    <SelectItem key={c.key} value={c.key} className="text-[10px] font-bold uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusBadge(c.key).split(" ")[1]}`} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {uniqueClients.length > 1 && (
              <div className="min-w-[180px]">
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="h-11 bg-background border-border/40 rounded-xl px-4 text-xs font-bold uppercase tracking-wider" data-testid="select-filter-client">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    <SelectItem value="todos" className="text-[10px] font-bold uppercase tracking-widest">Todos os Clientes</SelectItem>
                    {uniqueClients.sort().map(c => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {uniqueConcessionarias.length > 1 && (
              <div className="min-w-[180px]">
                <Select value={concessionariaFilter} onValueChange={setConcessionariaFilter}>
                  <SelectTrigger className="h-11 bg-background border-border/40 rounded-xl px-4 text-xs font-bold uppercase tracking-wider" data-testid="select-filter-concessionaria">
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-primary" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    <SelectItem value="todos" className="text-[10px] font-bold uppercase tracking-widest">Todas Concessionárias</SelectItem>
                    {uniqueConcessionarias.sort().map(c => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {canGroupByState && uniqueEstados.length > 1 && (
              <div className="min-w-[150px]">
                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger className="h-11 bg-background border-border/40 rounded-xl px-4 text-xs font-bold uppercase tracking-wider" data-testid="select-filter-estado">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    <SelectItem value="todos" className="text-[10px] font-bold uppercase tracking-widest">Todos os Estados</SelectItem>
                    {uniqueEstados.map(e => (
                      <SelectItem key={e} value={e} className="text-xs font-bold">{e}</SelectItem>
                    ))}
                    <SelectItem value="__sem_estado__" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sem Estado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {user?.role === "admin" && (
              <Button
                onClick={() => setShowNewProject(true)}
                className="h-11 rounded-xl px-4 font-bold text-[10px] uppercase tracking-wider"
                data-testid="button-admin-new-project"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            )}

            <Button
              variant="outline"
              onClick={exportCSV}
              className="h-11 rounded-xl px-4 font-bold text-[10px] uppercase tracking-wider border-border/40"
              data-testid="button-export-csv"
              title="Exportar projetos filtrados para CSV"
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>

            <div className="flex bg-background border border-border/40 rounded-xl p-1 gap-1 h-11">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg transition-all h-9 w-9 ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}
                data-testid="button-view-grid"
                title="Grade"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={`rounded-lg transition-all h-9 w-9 ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}
                data-testid="button-view-list"
                title="Lista"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="border-border/40 overflow-hidden rounded-2xl">
              <div className="h-1.5 bg-muted animate-pulse" />
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4 rounded-md" />
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                </div>
                <div className="space-y-3 pt-4 border-t border-border/30">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                </div>
                <div className="pt-4 flex justify-between items-center">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-border/40 shadow-inner">
          <div className="h-24 w-24 rounded-full bg-background flex items-center justify-center mb-8 shadow-sm border border-border/40">
            <FolderOpen className="h-10 w-10 text-primary/40" />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">
            {tab === "arquivados" ? "Nenhum projeto arquivado" : "O horizonte está limpo"}
          </h3>
          <p className="text-muted-foreground max-w-sm text-sm font-medium leading-relaxed">
            {tab === "arquivados" ? "Projetos concluídos ou cancelados aparecerão aqui para seu histórico." : "Não encontramos nenhum projeto com os critérios atuais. Tente redefinir seus filtros ou buscar por outros termos."}
          </p>
          {search && (
            <Button variant="outline" onClick={() => setSearch("")} className="mt-8 rounded-xl font-bold uppercase tracking-widest text-[10px] h-10 px-6 border-primary/20 hover:bg-primary hover:text-primary-foreground">
              Limpar Filtros de Busca
            </Button>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-6">
          {/* Seção: Projetos Próprios da Randoli Solar */}
          {filteredOwn.length > 0 && (
            <div>
              <button
                onClick={() => setOwnCollapsed(v => !v)}
                className="flex items-center gap-3 mb-3 w-full group/section"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                  <span className="text-base">⭐</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Projetos Randoli Solar</span>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">{filteredOwn.length}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">{ownCollapsed ? "▶" : "▼"}</span>
                </div>
              </button>
              {!ownCollapsed && (
                <Card className="border-amber-200/40 shadow-sm overflow-hidden bg-background rounded-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-amber-50/50 dark:bg-amber-900/10 border-b border-border/40">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Projeto / ID</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Potência</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Progresso</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Concessionária</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {filteredOwn.map(project => (
                          <tr
                            key={project.id}
                            className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                            onClick={() => setDetailProjectId(project.id)}
                          >
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1 min-w-0">
                                {project.ticketNumber && (
                                  <div className="flex items-center gap-1.5">
                                    <Hash className="h-3 w-3 text-amber-600/60" />
                                    <span className="text-[10px] font-mono font-bold text-amber-600/70 tracking-tighter uppercase">{project.ticketNumber}</span>
                                  </div>
                                )}
                                <span className="text-sm font-bold text-foreground group-hover:text-amber-600 transition-colors truncate max-w-[250px]">{project.title}</span>
                                <span className="text-[10px] text-muted-foreground">{project.nomeCliente || "—"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 hidden md:table-cell">
                              <span className="text-xs font-mono">{project.potencia ? `${project.potencia} kWp` : "—"}</span>
                            </td>
                            <td className="px-6 py-5 hidden lg:table-cell">
                              <span className="text-xs text-muted-foreground">{project.concessionaria || "—"}</span>
                            </td>
                            <td className="px-6 py-5">
                              <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border-0 shadow-sm ${getStatusBadge(project.status)}`}>
                                {configMap[project.status]?.label || project.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="rounded-lg text-[11px] h-8" onClick={e => { e.stopPropagation(); setDetailProjectId(project.id); }}>
                                  Gerenciar
                                </Button>
                                {user?.role === "admin" && (
                                  <Button size="sm" variant="outline" className="rounded-lg text-[11px] h-8 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={e => { e.stopPropagation(); setEditProjectId(project.id); }}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}
          {/* Seção: Projetos de Integradores */}
          {filteredIntegradores.length > 0 && filteredOwn.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Projetos de Integradores</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>
          )}
          {groupedByEstado.map(group => (
            <div key={group.key}>
              {canGroupByState && groupedByEstado.length > 1 && (
                <button
                  onClick={() => toggleStateCollapse(group.key)}
                  className="flex items-center gap-3 mb-3 w-full group/section"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary">{group.label}</span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">{group.projects.length}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">{collapsedStates[group.key] ? "▶" : "▼"}</span>
                  </div>
                </button>
              )}
              {!collapsedStates[group.key] && (
        <Card className="border-border/40 shadow-sm overflow-hidden bg-background rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Projeto / ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Integrador</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Potência</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Concessionária</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {group.projects.map(project => (
                  <tr
                    key={project.id}
                    className="hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                    onClick={() => setDetailProjectId(project.id)}
                    data-testid={`row-project-${project.id}`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 min-w-0">
                        {project.ticketNumber && (
                          <div className="flex items-center gap-1.5">
                            <Hash className="h-3 w-3 text-primary/60" />
                            <span className="text-[10px] font-mono font-bold text-primary/70 tracking-tighter uppercase">{project.ticketNumber}</span>
                          </div>
                        )}
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[250px]">{project.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {((project as any).integrador?.name || project.client?.name || "U")[0]}
                        </div>
                        <span className="text-xs font-medium text-foreground/80">{(project as any).integrador?.name || project.client?.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden lg:table-cell" style={{minWidth: 120}}>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{getStatusProgress(project.status)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                          <div className={`h-1.5 rounded-full ${getStatusBadge(project.status).split(" ")[1]}`} style={{ width: `${getStatusProgress(project.status)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell">
                      {project.potencia ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-foreground/70">
                          <Zap className="h-3 w-3 text-amber-500" />
                          <span>{project.potencia} <span className="text-[10px] text-muted-foreground">kWp</span></span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-6 py-5 hidden lg:table-cell">
                      <span className="text-xs font-medium text-foreground/70">{project.concessionaria || "—"}</span>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border-0 shadow-sm ${getStatusBadge(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {tab === "arquivados" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500"
                            onClick={(e) => { e.stopPropagation(); unarchiveMut.mutate(project.id); }}
                            disabled={unarchiveMut.isPending}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setDeleteProjectId(project.id); }}
                            data-testid={`button-delete-project-${project.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Seção: Projetos Próprios da Randoli Solar - Grid */}
          {filteredOwn.length > 0 && (
            <div>
              <button
                onClick={() => setOwnCollapsed(v => !v)}
                className="flex items-center gap-3 mb-4 w-full"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                  <span className="text-base">⭐</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Projetos Randoli Solar</span>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">{filteredOwn.length}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">{ownCollapsed ? "▶" : "▼"}</span>
                </div>
              </button>
              {!ownCollapsed && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredOwn.map(project => (
                    <div
                      key={project.id}
                      className="group relative bg-background rounded-3xl border border-amber-200/40 shadow-md hover:shadow-lg transition-all duration-300 hover:border-amber-400/40 cursor-pointer overflow-hidden flex flex-col"
                      onClick={() => setDetailProjectId(project.id)}
                    >
                      <div className={`h-1.5 w-full ${getStatusBadge(project.status).split(" ")[1]}`} />
                      <div className="p-5 flex-1 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1 min-w-0">
                            {project.ticketNumber && (
                              <span className="text-[10px] font-mono font-bold text-amber-600/70 uppercase"># {project.ticketNumber}</span>
                            )}
                            <h3 className="text-sm font-bold leading-tight text-foreground group-hover:text-amber-600 transition-colors line-clamp-2">{project.title}</h3>
                          </div>
                          <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-0 shadow-sm shrink-0 ${getStatusBadge(project.status)}`}>
                            {configMap[project.status]?.label || project.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {project.nomeCliente && <div><span className="font-medium">Cliente:</span> {project.nomeCliente}</div>}
                          {project.potencia && <div><span className="font-medium">Potência:</span> ⚡ {project.potencia} kWp</div>}
                          {project.concessionaria && <div><span className="font-medium">Conc.:</span> {project.concessionaria}</div>}
                          {project.valor && <div className="font-bold text-amber-600">R$ {project.valor}</div>}
                        </div>
                      </div>
                      <div className="px-5 pb-4 flex items-center justify-between border-t border-border/20 pt-3">
                        <span className="text-[10px] text-muted-foreground">{project.createdAt ? new Date(project.createdAt).toLocaleDateString("pt-BR") : ""}</span>
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-red-50 hover:text-red-500" onClick={() => { setProjectToDelete(project); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-lg text-[11px] h-7" onClick={() => setDetailProjectId(project.id)}>
                            Gerenciar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {filteredIntegradores.length > 0 && filteredOwn.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Projetos de Integradores</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>
          )}
          {groupedByEstado.map(group => (
            <div key={group.key}>
              {canGroupByState && groupedByEstado.length > 1 && (
                <button
                  onClick={() => toggleStateCollapse(group.key)}
                  className="flex items-center gap-3 mb-4 w-full"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary">{group.label}</span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">{group.projects.length}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">{collapsedStates[group.key] ? "▶" : "▼"}</span>
                  </div>
                </button>
              )}
              {!collapsedStates[group.key] && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {group.projects.map(project => (
            <Card
              key={project.id}
              className="group relative border-border/40 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden bg-background rounded-2xl"
              onClick={() => setDetailProjectId(project.id)}
              data-testid={`card-project-${project.id}`}
            >
              <div className={`h-1.5 w-full ${getStatusBadge(project.status).split(" ")[1]}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    {project.ticketNumber && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/5 border border-primary/10 w-fit">
                        <Hash className="h-2.5 w-2.5 text-primary/60" />
                        <span className="text-[9px] font-mono font-bold text-primary/70 tracking-tighter uppercase">{project.ticketNumber}</span>
                      </div>
                    )}
                    <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">{project.title}</h3>
                  </div>
                  <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-0 shadow-sm ${getStatusBadge(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>

                <div className="space-y-3 pt-2 border-t border-border/30">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-semibold uppercase tracking-tight">Integrador</span>
                    <span className="font-bold text-foreground/80 truncate max-w-[140px]">{(project as any).integrador?.name || project.client?.name || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-semibold uppercase tracking-tight">Potência</span>
                    <div className="flex items-center gap-1.5 font-bold text-foreground/80">
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span>{project.potencia || "0"} kWp</span>
                    </div>
                  </div>
                  {project.valor && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-semibold uppercase tracking-tight">Investimento</span>
                      <span className="font-black text-primary/80">R$ {project.valor}</span>
                    </div>
                  )}
                </div>

                {/* Barra de progresso */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-medium">Progresso</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{getStatusProgress(project.status)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${getStatusBadge(project.status).split(" ")[1]}`}
                      style={{ width: `${getStatusProgress(project.status)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </span>
                  <div className="flex gap-2">
                    {tab === "arquivados" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500"
                        onClick={(e) => { e.stopPropagation(); unarchiveMut.mutate(project.id); }}
                        disabled={unarchiveMut.isPending}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteProjectId(project.id); }}
                        data-testid={`button-delete-card-${project.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {user?.role === "admin" && (
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50" onClick={e => { e.stopPropagation(); setEditProjectId(project.id); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-4 h-8 rounded-lg border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                      Gerenciar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ProjectDetailSheet
        project={detailProject}
        open={!!detailProjectId}
        onClose={() => setDetailProjectId(null)}
        onEdit={user?.role === "admin" ? (id: string) => { setDetailProjectId(null); setEditProjectId(id); } : undefined}
      />

      <Dialog open={!!deleteProjectId} onOpenChange={(open) => { if (!open) setDeleteProjectId(null); }}>
        <DialogContent data-testid="dialog-confirm-delete-project">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Excluir Projeto
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir este projeto? Esta ação é <strong>irreversível</strong> e todos os dados do projeto serão perdidos.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteProjectId(null)} data-testid="button-cancel-delete">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteProjectId) { deleteMut.mutate(deleteProjectId); setDeleteProjectId(null); } }}
              disabled={deleteMut.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMut.isPending ? "Excluindo..." : "Sim, excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmação manual de pagamento */}
      <Dialog open={!!manualPaymentModal?.open} onOpenChange={(open) => !open && setManualPaymentModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <BadgeCheck className="h-5 w-5" />
              Confirmar Pagamento Manual
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Esta ação marcará o pagamento como <strong>aprovado</strong> e avançará o status do projeto automaticamente.
            </p>
            <div className="space-y-1">
              <Label htmlFor="manual-valor">Valor pago (R$)</Label>
              <Input
                id="manual-valor"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={manualPaymentModal?.valor || ""}
                onChange={(e) => setManualPaymentModal(prev => prev ? { ...prev, valor: e.target.value } : null)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-obs">Observação <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                id="manual-obs"
                placeholder="Ex: PIX recebido via banco X, comprovante verificado..."
                rows={3}
                value={manualPaymentModal?.observacao || ""}
                onChange={(e) => setManualPaymentModal(prev => prev ? { ...prev, observacao: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setManualPaymentModal(null)} disabled={confirmManualPaymentMut.isPending}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={confirmManualPaymentMut.isPending}
              onClick={() => {
                if (manualPaymentModal) {
                  confirmManualPaymentMut.mutate({
                    projectId: manualPaymentModal.projectId,
                    valor: manualPaymentModal.valor,
                    observacao: manualPaymentModal.observacao,
                  });
                }
              }}
            >
              <BadgeCheck className="h-4 w-4 mr-2" />
              {confirmManualPaymentMut.isPending ? "Confirmando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminNewProjectDialog open={showNewProject} onClose={() => setShowNewProject(false)} />
      <AdminEditProjectDialog projectId={editProjectId} open={!!editProjectId} onClose={() => setEditProjectId(null)} />
    </div>
  );
}
