import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileSignature, Plus, Send, X, CheckCircle2, Clock, AlertCircle, Upload, Trash2, Eye, Copy } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import type { Project } from "@shared/schema";

type Signatario = { nome: string; email: string; cpf: string; telefone: string };

type Assinatura = {
  id: string;
  titulo: string;
  file_url: string;
  project_id?: string;
  status: "pendente" | "enviado" | "concluido" | "cancelado";
  total_signatarios: number;
  total_assinados: number;
  created_at: string;
  expires_at: string;
};

const STATUS_CONFIG = {
  pendente:  { label: "Pendente", color: "bg-amber-100 text-amber-700 border-amber-200" },
  enviado:   { label: "Aguardando", color: "bg-blue-100 text-blue-700 border-blue-200" },
  concluido: { label: "Concluído", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
};

function NovaAssinaturaDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { upload, uploading } = useUpload();
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [signatarios, setSignatarios] = useState<Signatario[]>([
    { nome: "", email: "", cpf: "", telefone: "" }
  ]);

  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/assinaturas", data).then(r => r.json()),
    onSuccess: async (doc) => {
      // Auto-send emails
      await apiRequest("POST", `/api/assinaturas/${doc.id}/enviar`).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["/api/assinaturas"] });
      toast({ title: "Documento criado e enviado para assinatura!" });
      onClose();
      resetForm();
    },
    onError: () => toast({ title: "Erro ao criar documento", variant: "destructive" }),
  });

  const resetForm = () => {
    setTitulo(""); setMensagem(""); setFileUrl(""); setFileName("");
    setExpiresInDays(30);
    setSignatarios([{ nome: "", email: "", cpf: "", telefone: "" }]);
  };

  const handleFileUpload = async (file: File) => {
    const result = await upload(file);
    if (result) { setFileUrl(result.objectPath); setFileName(file.name); }
  };

  const addSignatario = () => setSignatarios(s => [...s, { nome: "", email: "", cpf: "", telefone: "" }]);
  const removeSignatario = (i: number) => setSignatarios(s => s.filter((_, idx) => idx !== i));
  const updateSignatario = (i: number, field: keyof Signatario, value: string) =>
    setSignatarios(s => s.map((sig, idx) => idx === i ? { ...sig, [field]: value } : sig));

  const isValid = titulo.trim() && fileUrl && signatarios.every(s => s.nome && s.email);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Novo Documento para Assinatura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label>Nome do Documento *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Procuração - Fernando de Souza" />
          </div>

          {/* Upload PDF */}
          <div className="space-y-1.5">
            <Label>Arquivo PDF *</Label>
            {fileUrl ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium text-emerald-700 truncate flex-1">{fileName}</span>
                <Button size="sm" variant="ghost" onClick={() => { setFileUrl(""); setFileName(""); }}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Clique para selecionar o PDF</span>
                <span className="text-xs text-muted-foreground">Máximo 10MB</span>
                <input type="file" accept=".pdf" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                {uploading && <span className="text-xs text-primary animate-pulse">Enviando...</span>}
              </label>
            )}
          </div>

          {/* Signatários */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Signatários *</Label>
              <Button size="sm" variant="outline" onClick={addSignatario} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>
            {signatarios.map((sig, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Signatário {i + 1}
                  </span>
                  {signatarios.length > 1 && (
                    <Button size="icon" variant="ghost" onClick={() => removeSignatario(i)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome *</Label>
                    <Input className="h-9 text-sm" value={sig.nome}
                      onChange={e => updateSignatario(i, "nome", e.target.value)}
                      placeholder="Nome completo" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">E-mail *</Label>
                    <Input className="h-9 text-sm" type="email" value={sig.email}
                      onChange={e => updateSignatario(i, "email", e.target.value)}
                      placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CPF</Label>
                    <Input className="h-9 text-sm" value={sig.cpf}
                      onChange={e => updateSignatario(i, "cpf", e.target.value)}
                      placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">WhatsApp</Label>
                    <Input className="h-9 text-sm" value={sig.telefone}
                      onChange={e => updateSignatario(i, "telefone", e.target.value)}
                      placeholder="(66) 99999-9999" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mensagem e expiração */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prazo (dias)</Label>
              <Input type="number" min={1} max={365} value={expiresInDays}
                onChange={e => setExpiresInDays(parseInt(e.target.value) || 30)} className="h-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mensagem para os signatários</Label>
            <Textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={2}
              placeholder="Mensagem opcional que será incluída no e-mail..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!isValid || createMut.isPending || uploading}
            onClick={() => createMut.mutate({ titulo, fileUrl, mensagem, expiresInDays, signatarios })}>
            <Send className="h-4 w-4 mr-2" />
            {createMut.isPending ? "Criando..." : "Criar e Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssinaturaDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/assinaturas", id],
    queryFn: () => apiRequest("GET", `/api/assinaturas/${id}`).then(r => r.json()),
    refetchInterval: 10000,
  });

  const sendMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/assinaturas/${id}/enviar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assinaturas", id] });
      toast({ title: "Links reenviados!" });
    },
  });

  const cancelMut = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/assinaturas/${id}/cancelar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assinaturas"] });
      toast({ title: "Documento cancelado" });
      onClose();
    },
  });

  if (isLoading) return <div className="p-8 text-center"><Skeleton className="h-64 w-full rounded-xl" /></div>;
  if (!data) return null;

  const cfg = STATUS_CONFIG[data.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pendente;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            {data.titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status e info */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={`${cfg.color} border text-xs`}>{cfg.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {data.signatarios?.filter((s: any) => s.signed_at).length}/{data.signatarios?.length} assinado(s)
            </span>
            <span className="text-xs text-muted-foreground">
              Expira: {new Date(data.expires_at).toLocaleDateString("pt-BR")}
            </span>
          </div>

          {/* Document link */}
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
            <a href={data.file_url} target="_blank" rel="noreferrer"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5 flex-1">
              <Eye className="h-4 w-4" /> Ver Documento PDF
            </a>
          </div>

          {/* Signatários */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Signatários</h3>
            {data.signatarios?.map((sig: any) => (
              <div key={sig.id} className={`p-3 rounded-xl border ${sig.signed_at
                ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10"
                : "border-border bg-muted/20"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{sig.nome}</p>
                    <p className="text-xs text-muted-foreground">{sig.email}</p>
                    {sig.cpf && <p className="text-xs text-muted-foreground">CPF: {sig.cpf}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {sig.signed_at ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {new Date(sig.signed_at).toLocaleDateString("pt-BR")}
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                        Pendente
                      </Badge>
                    )}
                    {sig.sent_at && !sig.signed_at && (
                      <span className="text-[10px] text-muted-foreground">
                        Enviado: {new Date(sig.sent_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
                {sig.signed_at && sig.sign_hash && (
                  <div className="mt-2 pt-2 border-t border-emerald-200">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      IP: {sig.signed_ip}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      Hash: {sig.sign_hash}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Logs */}
          {data.logs?.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Histórico</h3>
              <div className="space-y-1">
                {data.logs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-2 text-xs">
                    <span className="text-muted-foreground shrink-0 w-32">
                      {new Date(log.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    <span className="text-foreground/80">{log.descricao}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {data.status !== "cancelado" && data.status !== "concluido" && (
            <>
              <Button variant="outline" size="sm" onClick={() => sendMut.mutate()} disabled={sendMut.isPending}
                className="gap-1.5">
                <Send className="h-3.5 w-3.5" />
                {sendMut.isPending ? "Enviando..." : "Reenviar Links"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => cancelMut.mutate()}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancelar
              </Button>
            </>
          )}
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AssinaturasPage() {
  const { user } = useAuth();
  const [novaOpen, setNovaOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: assinaturas = [], isLoading } = useQuery<Assinatura[]>({
    queryKey: ["/api/assinaturas"],
    queryFn: () => apiRequest("GET", "/api/assinaturas").then(r => r.json()),
    refetchInterval: 30000,
  });

  const filtered = assinaturas.filter(a =>
    !search || a.titulo.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: assinaturas.length,
    pendentes: assinaturas.filter(a => a.status === "pendente" || a.status === "enviado").length,
    concluidos: assinaturas.filter(a => a.status === "concluido").length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-primary" />
            Assinatura Digital
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Procurações, contratos e documentos com validade jurídica
          </p>
        </div>
        {["admin", "engenharia"].includes(user?.role || "") && (
          <Button onClick={() => setNovaOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Documento
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total, icon: FileSignature, color: "text-blue-600" },
          { label: "Aguardando", value: stats.pendentes, icon: Clock, color: "text-amber-600" },
          { label: "Concluídos", value: stats.concluidos, icon: CheckCircle2, color: "text-emerald-600" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-md rounded-2xl">
            <CardContent className="p-5 flex items-center gap-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Input placeholder="Buscar documento..." value={search} onChange={e => setSearch(e.target.value)}
          className="h-11 pl-4" />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileSignature className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <p className="font-bold text-foreground">Nenhum documento</p>
          <p className="text-sm text-muted-foreground mt-1">Crie o primeiro documento para assinatura digital</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.pendente;
            const progress = a.total_signatarios > 0 ? (Number(a.total_assinados) / Number(a.total_signatarios)) * 100 : 0;
            return (
              <Card key={a.id} className="border-none shadow-md rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedId(a.id)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileSignature className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm truncate">{a.titulo}</span>
                        <Badge className={`${cfg.color} border text-[10px]`}>{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {a.total_assinados}/{a.total_signatarios} assinado(s)
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Expira: {new Date(a.expires_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NovaAssinaturaDialog open={novaOpen} onClose={() => setNovaOpen(false)} />
      {selectedId && <AssinaturaDetail id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
