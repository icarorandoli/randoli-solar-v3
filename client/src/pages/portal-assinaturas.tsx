import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { FileSignature, CheckCircle2, Clock, ExternalLink, FileText, Plus, Upload, X, Send } from "lucide-react";

type MinhaAssinatura = {
  signatario_id: string;
  token: string;
  nome: string;
  email: string;
  sig_status: string;
  signed_at?: string;
  sent_at?: string;
  assinatura_id: string;
  titulo: string;
  file_url: string;
  expires_at: string;
  doc_status: string;
};

type Signatario = { nome: string; email: string; cpf: string; telefone: string };

function NovaAssinaturaIntegradorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { upload, uploading } = useUpload();
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [signatarios, setSignatarios] = useState<Signatario[]>([
    { nome: "", email: "", cpf: "", telefone: "" }
  ]);

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/assinaturas", data);
      const doc = await res.json();
      // Auto-send
      await apiRequest("POST", `/api/assinaturas/${doc.id}/enviar`).catch(() => {});
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/minha-assinaturas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assinaturas-criadas"] });
      toast({ title: "✅ Documento criado e enviado para assinatura!" });
      onClose();
      setTitulo(""); setMensagem(""); setFileUrl(""); setFileName("");
      setSignatarios([{ nome: "", email: "", cpf: "", telefone: "" }]);
    },
    onError: () => toast({ title: "Erro ao criar documento", variant: "destructive" }),
  });

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      toast({ title: "Apenas arquivos PDF", variant: "destructive" });
      return;
    }
    const result = await upload(file);
    if (result) { setFileUrl(result.objectPath); setFileName(file.name); }
  };

  const updateSig = (i: number, f: keyof Signatario, v: string) =>
    setSignatarios(s => s.map((x, idx) => idx === i ? { ...x, [f]: v } : x));

  const isValid = titulo.trim() && fileUrl && signatarios.every(s => s.nome && s.email);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileSignature className="h-5 w-5 text-primary" />
            Novo Documento para Colher Assinatura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
            📄 Suba a procuração ou contrato do seu cliente. O sistema envia o link de assinatura por e-mail automaticamente.
          </div>

          <div className="space-y-1.5">
            <Label>Nome do Documento *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Procuração - João Silva" />
          </div>

          <div className="space-y-1.5">
            <Label>Arquivo PDF *</Label>
            {fileUrl ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium text-emerald-700 truncate flex-1">{fileName}</span>
                <Button size="sm" variant="ghost" onClick={() => { setFileUrl(""); setFileName(""); }}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all">
                <Upload className="h-7 w-7 text-muted-foreground" />
                <span className="text-sm font-medium">Clique para selecionar o PDF</span>
                <span className="text-xs text-muted-foreground">Apenas PDF • Máximo 10MB</span>
                <input type="file" accept=".pdf" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {uploading && <span className="text-xs text-primary animate-pulse">Enviando...</span>}
              </label>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Signatários (quem vai assinar) *</Label>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                onClick={() => setSignatarios(s => [...s, { nome: "", email: "", cpf: "", telefone: "" }])}>
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>
            {signatarios.map((sig, i) => (
              <div key={i} className="p-4 rounded-xl border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Signatário {i + 1}</span>
                  {signatarios.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-destructive"
                      onClick={() => setSignatarios(s => s.filter((_, idx) => idx !== i))}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome *</Label>
                    <Input className="h-8 text-sm" value={sig.nome} placeholder="Nome completo"
                      onChange={e => updateSig(i, "nome", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">E-mail *</Label>
                    <Input className="h-8 text-sm" type="email" value={sig.email} placeholder="email@exemplo.com"
                      onChange={e => updateSig(i, "email", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CPF</Label>
                    <Input className="h-8 text-sm" value={sig.cpf} placeholder="000.000.000-00"
                      onChange={e => updateSig(i, "cpf", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">WhatsApp</Label>
                    <Input className="h-8 text-sm" value={sig.telefone} placeholder="(66) 99999-9999"
                      onChange={e => updateSig(i, "telefone", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Mensagem para o signatário (opcional)</Label>
            <Textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={2}
              placeholder="Ex: Olá! Segue procuração para assinar referente ao seu projeto solar..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!isValid || createMut.isPending || uploading}
            onClick={() => createMut.mutate({ titulo, fileUrl, mensagem, expiresInDays: 30, signatarios })}>
            <Send className="h-4 w-4 mr-2" />
            {createMut.isPending ? "Enviando..." : "Criar e Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PortalAssinaturasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [novaOpen, setNovaOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"receber" | "enviar">("receber");

  // Docs I need to sign
  const { data: paraAssinar = [], isLoading: loading1 } = useQuery<MinhaAssinatura[]>({
    queryKey: ["/api/minha-assinaturas"],
    queryFn: () => apiRequest("GET", "/api/minha-assinaturas").then(r => r.json()),
    refetchInterval: 30000,
  });

  // Docs I created (to collect signatures)
  const { data: criadas = [], isLoading: loading2 } = useQuery<any[]>({
    queryKey: ["/api/assinaturas-criadas"],
    queryFn: () => apiRequest("GET", "/api/assinaturas").then(r => r.json()),
    refetchInterval: 30000,
  });

  const pendentes = paraAssinar.filter(a => !a.signed_at && a.doc_status !== "cancelado" && new Date(a.expires_at) > new Date());
  const assinados = paraAssinar.filter(a => !!a.signed_at);

  const TABS = [
    { key: "receber", label: "Para Assinar", count: pendentes.length },
    { key: "enviar", label: "Que Enviei", count: criadas.length },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-primary" />
            Assinatura Digital
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Procurações e contratos
          </p>
        </div>
        <Button onClick={() => setNovaOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Novo Documento
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/60">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === t.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Para Assinar */}
      {activeTab === "receber" && (
        <div className="space-y-4">
          {loading1 ? (
            <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : pendentes.length === 0 && assinados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
              <p className="font-bold">Tudo em dia!</p>
              <p className="text-sm text-muted-foreground mt-1">Nenhum documento aguardando sua assinatura.</p>
            </div>
          ) : (
            <>
              {pendentes.length > 0 && (
                <div className="space-y-3">
                  {pendentes.map(a => (
                    <Card key={a.signatario_id} className="border-amber-200/60 bg-amber-50/40 dark:bg-amber-900/10 shadow-md rounded-2xl">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{a.titulo}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-[10px]">Pendente</Badge>
                                <span className="text-xs text-muted-foreground">
                                  Expira: {new Date(a.expires_at).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <Button size="sm" className="gap-1.5 h-9"
                              onClick={() => window.open(`/assinar/${a.token}`, "_blank")}>
                              <FileSignature className="h-3.5 w-3.5" /> Assinar
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 h-7 text-xs"
                              onClick={() => window.open(a.file_url, "_blank")}>
                              <ExternalLink className="h-3 w-3" /> PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {assinados.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Já assinados
                  </p>
                  {assinados.map(a => (
                    <Card key={a.signatario_id} className="border-emerald-200/40 bg-emerald-50/20 rounded-xl shadow-sm">
                      <CardContent className="p-3 flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{a.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            Assinado em {new Date(a.signed_at!).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-[10px] shrink-0">✓</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Que Enviei */}
      {activeTab === "enviar" && (
        <div className="space-y-3">
          {loading2 ? (
            <div className="space-y-3">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
          ) : criadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSignature className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="font-bold">Nenhum documento enviado</p>
              <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro documento para colher assinatura.</p>
              <Button className="mt-4 gap-2" onClick={() => setNovaOpen(true)}>
                <Plus className="h-4 w-4" /> Novo Documento
              </Button>
            </div>
          ) : criadas.map((a: any) => {
            const total = parseInt(a.total_signatarios || 0);
            const assinados2 = parseInt(a.total_assinados || 0);
            const progress = total > 0 ? (assinados2 / total) * 100 : 0;
            const statusCfg: any = {
              pendente:  { label: "Pendente", color: "bg-amber-100 text-amber-700 border-amber-200" },
              enviado:   { label: "Aguardando", color: "bg-blue-100 text-blue-700 border-blue-200" },
              concluido: { label: "Concluído", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
              cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
            };
            const cfg = statusCfg[a.status] || statusCfg.pendente;
            return (
              <Card key={a.id} className="border-none shadow-md rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm truncate">{a.titulo}</span>
                        <Badge className={`${cfg.color} border text-[10px]`}>{cfg.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {assinados2}/{total} assinado(s) · Expira {new Date(a.expires_at).toLocaleDateString("pt-BR")}
                      </p>
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="pt-4 border-t border-border/40">
        <p className="text-xs text-center text-muted-foreground">
          🔒 Assinatura eletrônica válida — MP 2.200-2/2001 e Lei 14.063/2020
        </p>
      </div>

      <NovaAssinaturaIntegradorDialog open={novaOpen} onClose={() => setNovaOpen(false)} />
    </div>
  );
}
