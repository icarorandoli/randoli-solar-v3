import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Upload, FileText, Trash2, Activity,
  MapPin, Hash, Zap, Cpu, Sun, User, ExternalLink, Building, DollarSign, AlertCircle, CreditCard, Loader2,
  QrCode, Copy, Check
} from "lucide-react";
import { Link } from "wouter";
import type { Project, Client, Document, Timeline } from "@shared/schema";
import ChatPanel from "@/components/chat-panel";
import { useProjectWebSocket } from "@/hooks/use-websocket";

const STATUS_LABELS: Record<string, string> = {
  orcamento: "Orçamento",
  aprovado_pagamento_pendente: "Aprovado / Pag. Pendente",
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

const STATUS_COLORS: Record<string, string> = {
  orcamento: "#94a3b8",
  aprovado_pagamento_pendente: "#eab308",
  projeto_tecnico: "#3b82f6",
  aguardando_art: "#8b5cf6",
  protocolado: "#7c3aed",
  parecer_acesso: "#f59e0b",
  instalacao: "#f97316",
  vistoria: "#06b6d4",
  projeto_aprovado: "#10b981",
  homologado: "#22c55e",
  finalizado: "#1e3a5f",
  cancelado: "#ef4444",
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

const DOC_TYPE_LABELS: Record<string, string> = {
  rg_cnh: "RG / CNH", cpf_cnpj_doc: "CPF / CNPJ", conta_energia: "Conta de Energia",
  procuracao: "Procuração", foto_local: "Foto do Local",
  diagrama_unifilar: "Diagrama Unifilar", memorial_descritivo: "Memorial Descritivo",
  art: "ART", contrato: "Contrato", projeto_aprovado: "Projeto Elétrico",
  parecer_concessionaria: "Parecer da Concessionária",
  comprovante_pagamento: "Comprovante de Pagamento", outro: "Outro",
};

function MercadoPagoBrick({ preferenceId, paymentLink }: { preferenceId: string; paymentLink?: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const brickControllerRef = useRef<any>(null);

  const { data: publicSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  const publicKey = publicSettings?.mp_public_key;
  const mpEnabled = publicSettings?.mp_enabled !== "false";

  const initBrick = useCallback(async () => {
    if (!publicKey || !containerRef.current) return;

    setLoading(true);
    setError(null);

    if (brickControllerRef.current) {
      try { await brickControllerRef.current.unmount(); } catch {}
      brickControllerRef.current = null;
    }

    containerRef.current.innerHTML = "";

    try {
      const MercadoPago = (window as any).MercadoPago;
      if (!MercadoPago) {
        setError("SDK do Mercado Pago não carregou. Tente recarregar a página.");
        setLoading(false);
        return;
      }

      const mp = new MercadoPago(publicKey, { locale: "pt-BR" });
      const bricksBuilder = mp.bricks();
      const controller = await bricksBuilder.create("wallet", containerRef.current.id, {
        initialization: { preferenceId, redirectMode: "modal" },
        customization: {
          texts: { valueProp: "security_details" },
        },
      });
      brickControllerRef.current = controller;
      setLoading(false);
    } catch (err: any) {
      console.error("[MP Brick] error:", err);
      setError("Erro ao carregar checkout. Tente recarregar a página.");
      setLoading(false);
    }
  }, [publicKey, preferenceId]);

  useEffect(() => {
    if (!publicKey) return;

    const handleLoad = () => initBrick();
    const handleError = () => {
      setError("Erro ao carregar SDK do Mercado Pago.");
      setLoading(false);
    };

    const existingScript = document.querySelector('script[src*="sdk.mercadopago.com"]') as HTMLScriptElement | null;
    if (existingScript) {
      if ((window as any).MercadoPago) {
        initBrick();
      } else {
        existingScript.addEventListener("load", handleLoad);
        existingScript.addEventListener("error", handleError);
      }
    } else {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
      document.head.appendChild(script);
    }

    return () => {
      if (brickControllerRef.current) {
        try { brickControllerRef.current.unmount(); } catch {}
        brickControllerRef.current = null;
      }
      if (existingScript) {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      }
    };
  }, [publicKey, initBrick]);

  if (!mpEnabled || !publicKey) {
    if (paymentLink) {
      return (
        <a
          href={paymentLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 rounded-lg text-sm font-bold text-white no-underline"
          style={{ background: "#009ee3" }}
          data-testid="link-pay-mercadopago"
        >
          <CreditCard className="h-4 w-4" />
          Pagar com Mercado Pago
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      );
    }
    return null;
  }

  if (error) {
    return (
      <div className="mt-2">
        <p className="text-xs text-red-500">{error}</p>
        {paymentLink && (
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white no-underline"
            style={{ background: "#009ee3" }}
            data-testid="link-pay-mercadopago-fallback"
          >
            <CreditCard className="h-4 w-4" />
            Pagar com Mercado Pago
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando checkout...
        </div>
      )}
      <div id="mp-wallet-brick" ref={containerRef} data-testid="mp-wallet-brick" />
    </div>
  );
}

function PixSection({ qrCode, qrCodeBase64 }: { qrCode: string; qrCodeBase64: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = qrCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="h-5 w-5 text-green-700 dark:text-green-400" />
        <p className="text-sm font-semibold text-green-800 dark:text-green-300">Pagar com PIX</p>
      </div>

      {qrCodeBase64 && (
        <div className="flex justify-center mb-3">
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code PIX"
            className="w-48 h-48 rounded-lg border border-green-300 bg-white p-2"
            data-testid="img-pix-qrcode"
          />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-green-700 dark:text-green-400 font-medium">PIX Copia e Cola:</p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={qrCode}
            className="flex-1 text-xs font-mono bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded px-2 py-1.5 truncate"
            data-testid="input-pix-copiacola"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="shrink-0 border-green-400 text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/40"
            data-testid="button-copy-pix"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="ml-1 text-xs">{copied ? "Copiado!" : "Copiar"}</span>
          </Button>
        </div>
        <p className="text-[11px] text-green-600 dark:text-green-500">
          Abra o app do seu banco, escolha "Pagar com PIX" e cole o código acima.
        </p>
      </div>
    </div>
  );
}

type ProjectDetail = Project & { client: Client | null };

function InfoRow({ label, value, link }: { label: string; value?: string | null; link?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground min-w-[120px] flex-shrink-0">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary flex items-center gap-1 hover:underline truncate">
          {value.length > 40 ? "Abrir no mapa" : value}
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      ) : (
        <span className="text-xs font-medium flex-1">{value}</span>
      )}
    </div>
  );
}

function DocumentUploadCard({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("outro");
  const [uploading, setUploading] = useState(false);

  const addDocMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/projects/${projectId}/documents`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "timeline"] });
      toast({ title: "Documento enviado com sucesso!" });
      setDocName("");
    },
    onError: () => toast({ title: "Erro ao registrar documento", variant: "destructive" }),
  });

  const { uploadFile } = useUpload({
    onSuccess: async (response) => {
      await addDocMut.mutateAsync({
        name: docName || DOC_TYPE_LABELS[docType] || "Documento",
        fileUrl: response.objectPath,
        docType,
        fileType: "application/octet-stream",
      });
      setUploading(false);
    },
    onError: () => {
      toast({ title: "Erro ao fazer upload", variant: "destructive" });
      setUploading(false);
    },
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!docName) setDocName(DOC_TYPE_LABELS[docType] || file.name.replace(/\.[^.]+$/, ""));
    setUploading(true);
    await uploadFile(file);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          Enviar Documento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de Documento</Label>
          <Select value={docType} onValueChange={v => {
            setDocType(v);
            setDocName(DOC_TYPE_LABELS[v] || "");
          }}>
            <SelectTrigger data-testid="select-doc-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Nome do Documento</Label>
          <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Ex: Conta de Energia — Janeiro/2025" data-testid="input-doc-name" />
        </div>
        <label className="block">
          <Button
            type="button"
            variant="outline"
            className="w-full relative"
            disabled={uploading || addDocMut.isPending}
            data-testid="button-upload-doc"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {uploading || addDocMut.isPending ? "Enviando..." : "Selecionar Arquivo"}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFile}
              disabled={uploading || addDocMut.isPending}
            />
          </Button>
        </label>
        <p className="text-xs text-muted-foreground">PDF, imagens, Word — máx. 10MB</p>
      </CardContent>
    </Card>
  );
}

function TimelineItem({ entry, isLast }: { entry: Timeline; isLast: boolean }) {
  const isAdmin = entry.createdByRole === "admin";
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin ? "bg-primary/15" : "bg-muted"}`}>
          {isAdmin ? (
            <Zap className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-[24px]" />}
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{entry.event}</p>
        {entry.details && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{entry.details}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          {isAdmin ? "Randoli Engenharia" : "Você"} · {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
        </p>
      </div>
    </div>
  );
}

export default function PortalProjetoPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();

  useProjectWebSocket(user?.id ?? null, user?.role ?? null, id ?? "");

  const { data: project, isLoading } = useQuery<ProjectDetail>({
    queryKey: ["/api/projects", id],
  });

  const { data: docs = [], isLoading: docsLoading } = useQuery<Document[]>({
    queryKey: ["/api/projects", id, "documents"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}/documents`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: tl = [], isLoading: tlLoading } = useQuery<Timeline[]>({
    queryKey: ["/api/projects", id, "timeline"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}/timeline`, { credentials: "include" });
      return res.json();
    },
  });

  const deleteDocMut = useMutation({
    mutationFn: (docId: string) => apiRequest("DELETE", `/api/projects/${id}/documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "documents"] });
      toast({ title: "Documento removido" });
    },
  });

  const STATUS_ORDER = ["orcamento", "aprovado_pagamento_pendente", "projeto_tecnico", "aguardando_art", "protocolado", "parecer_acesso", "instalacao", "vistoria", "projeto_aprovado", "homologado", "finalizado"];
  const currentIdx = project ? STATUS_ORDER.indexOf(project.status) : -1;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) return <div className="p-6 text-muted-foreground">Projeto não encontrado.</div>;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/portal"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {(project as any).ticketNumber && (
              <span className="text-sm font-mono text-primary font-bold flex items-center gap-1">
                <Hash className="h-4 w-4" />{(project as any).ticketNumber}
              </span>
            )}
            <h1 className="text-xl font-bold leading-tight" data-testid="text-project-title">{project.title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE_STYLES[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {project.concessionaria && `${project.concessionaria}`}
            {project.numeroProtocolo && ` · Protocolo: ${project.numeroProtocolo}`}
          </p>
        </div>
      </div>

      {/* Status Stepper */}
      {project.status !== "cancelado" && (
        <Card>
          <CardContent className="p-4 pb-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progresso da Homologação</p>
              <span className="text-xs text-muted-foreground">
                Etapa {currentIdx + 1} de {STATUS_ORDER.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative mb-5">
              <div className="h-1.5 w-full bg-border rounded-full" />
              <div
                className="h-1.5 rounded-full absolute top-0 left-0 transition-all duration-500"
                style={{
                  width: `${Math.round(((currentIdx + 1) / STATUS_ORDER.length) * 100)}%`,
                  backgroundColor: STATUS_COLORS[project.status] || "#3b82f6",
                }}
              />
            </div>

            {/* Steps */}
            <div className="flex items-start gap-0 overflow-x-auto pb-1 -mx-1 px-1">
              {STATUS_ORDER.map((status, i) => {
                const isPast = i < currentIdx;
                const isCurrent = i === currentIdx;
                const isFuture = i > currentIdx;
                return (
                  <div key={status} className="flex items-start flex-shrink-0" style={{ flex: "1 0 auto", minWidth: "52px", maxWidth: "72px" }}>
                    <div className="flex flex-col items-center w-full gap-1.5">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border-2 ${
                          isCurrent
                            ? "border-transparent text-white shadow-md scale-110"
                            : isPast
                            ? "border-transparent text-white"
                            : "border-border bg-background text-muted-foreground/50"
                        }`}
                        style={
                          isCurrent || isPast
                            ? { backgroundColor: STATUS_COLORS[status] }
                            : undefined
                        }
                      >
                        {isPast ? "✓" : i + 1}
                      </div>
                      <span
                        className={`text-[9px] font-medium text-center leading-tight px-0.5 ${
                          isCurrent
                            ? "text-foreground font-semibold"
                            : isPast
                            ? "text-muted-foreground"
                            : "text-muted-foreground/40"
                        }`}
                      >
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                    {i < STATUS_ORDER.length - 1 && (
                      <div
                        className="h-px mt-3 flex-shrink-0 transition-all"
                        style={{
                          width: "100%",
                          minWidth: "8px",
                          backgroundColor: i < currentIdx ? STATUS_COLORS[status] : "hsl(var(--border))",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment pending alert */}
      {project.status === "aprovado_pagamento_pendente" && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Projeto Aprovado — Pagamento Pendente</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                Seu projeto foi aprovado! Realize o pagamento para darmos início ao projeto técnico.
              </p>
              {project.valor && (
                <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mt-2 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  Valor: R$ {project.valor}
                </p>
              )}
              {project.pixQrCode && (
                <PixSection qrCode={project.pixQrCode} qrCodeBase64={project.pixQrCodeBase64 || ""} />
              )}
              {project.paymentId && (
                <MercadoPagoBrick preferenceId={project.paymentId} paymentLink={project.paymentLink} />
              )}
              {!project.paymentId && project.paymentLink && (
                <a
                  href={project.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 rounded-lg text-sm font-bold text-white no-underline"
                  style={{ background: "#009ee3" }}
                  data-testid="link-pay-mercadopago"
                >
                  <CreditCard className="h-4 w-4" />
                  Pagar com Mercado Pago
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {!project.paymentId && !project.paymentLink && !project.pixQrCode && (
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                  Envie o comprovante de pagamento abaixo para darmos início ao projeto.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: details + upload */}
        <div className="lg:col-span-1 space-y-4">

          {/* Valor do projeto */}
          {project.valor && project.status !== "aprovado_pagamento_pendente" && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor do Projeto</p>
                  <p className="text-base font-bold">R$ {project.valor}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dados do titular */}
          {(project.nomeCliente || project.cpfCnpjCliente) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Titular
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <InfoRow label="Nome" value={project.nomeCliente} />
                <InfoRow label="CPF/CNPJ" value={project.cpfCnpjCliente} />
                <InfoRow label="Telefone" value={project.telefoneCliente} />
              </CardContent>
            </Card>
          )}

          {/* Localização */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <InfoRow label="Endereço" value={project.endereco} />
              <InfoRow label="Mapa" value={project.localizacao} link={!!project.localizacao?.startsWith("http")} />
            </CardContent>
          </Card>

          {/* Concessionária */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" /> Concessionária
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <InfoRow label="Concessionária" value={project.concessionaria} />
              <InfoRow label="Tipo conexão" value={project.tipoConexao === "monofasico" ? "Monofásico" : project.tipoConexao === "bifasico" ? "Bifásico" : project.tipoConexao === "trifasico" ? "Trifásico" : null} />
              <InfoRow label="Disjuntor padrão" value={project.amperagemDisjuntor} />
              <InfoRow label="Nº Instalação (UC)" value={project.numeroInstalacao} />
              <InfoRow label="Protocolo" value={project.numeroProtocolo} />
            </CardContent>
          </Card>

          {/* Inversor */}
          {(project.marcaInversor || project.modeloInversor) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" /> Inversor
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <InfoRow label="Marca" value={project.marcaInversor} />
                <InfoRow label="Modelo" value={project.modeloInversor} />
                <InfoRow label="Potência" value={project.potenciaInversor ? `${project.potenciaInversor} kW` : null} />
                <InfoRow label="Quantidade" value={project.quantidadeInversor} />
              </CardContent>
            </Card>
          )}

          {/* Painel */}
          {(project.marcaPainel || project.modeloPainel) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5" /> Módulos Fotovoltaicos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <InfoRow label="Marca" value={project.marcaPainel} />
                <InfoRow label="Modelo" value={project.modeloPainel} />
                <InfoRow label="Potência unit." value={project.potenciaPainel ? `${project.potenciaPainel} Wp` : null} />
                <InfoRow label="Quantidade" value={project.quantidadePaineis} />
                <InfoRow label="Total do sistema" value={project.potencia ? `${project.potencia} kWp` : null} />
              </CardContent>
            </Card>
          )}

          {project.description && (
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-xs leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Upload */}
          <DocumentUploadCard projectId={id!} />
        </div>

        {/* Right column: Docs + Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Documentos ({docs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : docs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum documento enviado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-md border border-border/60 bg-card" data-testid={`doc-item-${doc.id}`}>
                      <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[doc.docType] || doc.docType}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {doc.uploadedByRole === "admin" ? "Randoli" : "Você"}
                        </Badge>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" data-testid={`button-view-doc-${doc.id}`}>Ver</Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Histórico de Atualizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tlLoading ? (
                <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : tl.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atualização ainda.</p>
              ) : (
                <div className="pt-1">
                  {tl.map((entry, i) => (
                    <TimelineItem key={entry.id} entry={entry} isLast={i === tl.length - 1} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat */}
          {user && id && (
            <div className="h-[420px]">
              <ChatPanel
                projectId={id}
                currentUserId={user.id}
                currentUserRole={user.role}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
