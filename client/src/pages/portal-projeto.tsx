import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Tabs } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Upload, FileText, Trash2, Activity, Receipt, Download,
  MapPin, Hash, Zap, Cpu, Sun, User, ExternalLink, Building, DollarSign, AlertCircle, CreditCard, Loader2,
  Copy, Check, Lock, CheckCircle2
} from "lucide-react";
import { Link } from "wouter";
import type { Project, Client, Document, Timeline, StatusConfig } from "@shared/schema";
import ChatPanel from "@/components/chat-panel";
import { useProjectWebSocket } from "@/hooks/use-websocket";
import { STATUS_COLOR_PRESETS, DEFAULT_STATUS_CONFIGS } from "@/lib/status-colors";

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

function PixQrCodeSection({ pixQrCode, pixQrCodeBase64, gateway }: { pixQrCode: string; pixQrCodeBase64?: string | null; gateway: string }) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixQrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  const gatewayLabel = gateway === "pagseguro" ? "PagSeguro" : gateway === "asaas" ? "Asaas" : "Mercado Pago";

  // Gera QR Code via canvas quando base64 não está disponível
  useEffect(() => {
    if (!pixQrCodeBase64 && pixQrCode && canvasRef.current) {
      import("https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js" as any).catch(() => {});
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
      script.onload = () => {
        const QRCode = (window as any).QRCode;
        if (QRCode && canvasRef.current) {
          QRCode.toCanvas(canvasRef.current, pixQrCode, { width: 192, margin: 1 }, () => {});
        }
      };
      if (!(window as any).QRCode) document.head.appendChild(script);
      else {
        const QRCode = (window as any).QRCode;
        if (canvasRef.current) QRCode.toCanvas(canvasRef.current, pixQrCode, { width: 192, margin: 1 }, () => {});
      }
    }
  }, [pixQrCode, pixQrCodeBase64]);

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white dark:bg-black/20 border border-emerald-500/20">
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
        <Zap className="h-3.5 w-3.5" /> PIX via {gatewayLabel}
      </div>
      {pixQrCodeBase64 ? (
        <div className="p-3 bg-white rounded-xl border border-border/40 shadow-sm">
          <img
            src={pixQrCodeBase64.startsWith("data:") ? pixQrCodeBase64 : pixQrCodeBase64.startsWith("http") ? pixQrCodeBase64 : `data:image/png;base64,${pixQrCodeBase64}`}
            alt="QR Code PIX"
            className="w-48 h-48"
            data-testid="img-pix-qrcode"
          />
        </div>
      ) : pixQrCode ? (
        <div className="p-3 bg-white rounded-xl border border-border/40 shadow-sm">
          <canvas ref={canvasRef} className="w-48 h-48" />
        </div>
      ) : null}
      <div className="w-full space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Copie o código PIX</p>
        <div className="relative">
          <Input
            readOnly
            value={pixQrCode}
            className="pr-12 text-[11px] font-mono bg-muted/30 truncate"
            data-testid="input-pix-code"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleCopy}
            data-testid="button-copy-pix"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
        {copied && <p className="text-[10px] text-emerald-600 text-center font-bold">Copiado!</p>}
      </div>
    </div>
  );
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-border/40 shadow-xl shadow-black/5 rounded-3xl">
      <CardHeader className="bg-muted/30 border-b border-border/40 px-8 py-6">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Enviar Documento
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider">Tipo de Documento</Label>
          <Select value={docType} onValueChange={v => {
            setDocType(v);
            setDocName(DOC_TYPE_LABELS[v] || "");
          }}>
            <SelectTrigger data-testid="select-doc-type" className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider">Nome do Documento</Label>
          <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Ex: Conta de Energia — Janeiro/2025" data-testid="input-doc-name" className="h-11 rounded-xl" />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          style={{ position: "fixed", top: 0, left: 0, width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleFile}
          disabled={uploading || addDocMut.isPending}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-xl font-bold border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
          disabled={uploading || addDocMut.isPending}
          onClick={() => fileInputRef.current?.click()}
          data-testid="button-upload-doc"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading || addDocMut.isPending ? "Enviando arquivo..." : "Selecionar do Dispositivo"}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-widest">Formatos aceitos: PDF, JPG, PNG, DOC (Max 10MB)</p>
      </CardContent>
    </Card>
  );
}

function TimelineItem({ entry, isLast }: { entry: Timeline; isLast: boolean }) {
  const isAdmin = entry.createdByRole === "admin";
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${isAdmin ? "bg-primary/10" : "bg-muted"}`}>
          {isAdmin ? (
            <Zap className="h-5 w-5 text-primary" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border/40 mt-2 min-h-[30px]" />}
      </div>
      <div className="pb-8 flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-tight">{entry.event}</p>
        {entry.details && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">{entry.details}</p>}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-[9px] font-black uppercase py-0 px-1.5 h-4">
            {isAdmin ? "Engenharia" : "Integrador"}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
          </span>
        </div>

      </div>
    </div>
  );
}

import { TermAcceptanceModal } from "@/components/term-acceptance-modal";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export default function PortalProjetoPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();

  useProjectWebSocket(user?.id ?? null, user?.role ?? null, id ?? "");

  const { data: project, isLoading } = useQuery<ProjectDetail>({
    queryKey: ["/api/projects", id],
  });

  const { data: notasFiscais = [] } = useQuery<any[]>({
    queryKey: ["/api/nfse/notas/projeto", id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/nfse/notas/projeto/${id}`, { credentials: "include" });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch { return []; }
    },
    enabled: !!id,
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

  const { data: statusConfigsRaw = [] } = useQuery<StatusConfig[]>({
    queryKey: ["/api/status-configs"],
  });

  const deleteDocMut = useMutation({
    mutationFn: (docId: string) => apiRequest("DELETE", `/api/projects/${id}/documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "documents"] });
      toast({ title: "Documento removido" });
    },
  });

  const [activeTab, setActiveTab] = useState("sobre");
  const [showTermModal, setShowTermModal] = useState(false);

  const { data: termData } = useQuery<{ term: any; alreadyAccepted: boolean; acceptance?: any }>({
    queryKey: ["/api/projects", id, "term"],
    queryFn: () => apiRequest("GET", `/api/projects/${id}/term`).then(r => r.json()),
    enabled: !!id,
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "documents"] });
    queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "timeline"] });
  }, [activeTab, id]);

  useEffect(() => {
    if (!project || project.status !== "aprovado_pagamento_pendente") return;
    if (!project.paymentLink) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
    }, 30000);
    return () => clearInterval(interval);
  }, [project?.status, project?.paymentLink, id]);

  // Use status configs from DB (same as Kanban), sorted by sortOrder
  // Fall back to DEFAULT_STATUS_CONFIGS while loading
  const statusSteps = (statusConfigsRaw.length > 0 ? statusConfigsRaw : DEFAULT_STATUS_CONFIGS as any[])
    .filter((c: { key: string }) => c.key !== "cancelado")
    .sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder) as Array<{ key: string; label: string; color: string; sortOrder: number }>;

  const currentIdx = project ? statusSteps.findIndex(s => s.key === project.status) : -1;

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!project) return <div className="p-8 text-center font-bold text-muted-foreground">Projeto não encontrado.</div>;

  return (
    <>
    <div className="p-4 md:p-10 space-y-10 max-w-6xl mx-auto pb-20">
      {/* Banner de aceite pendente */}
      {termData && !termData.alreadyAccepted && (
        <div className="flex items-start gap-4 p-4 rounded-2xl border border-orange-500/30 bg-orange-500/5">
          <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-orange-700 dark:text-orange-400">Termo de aceite pendente</p>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-0.5">Este projeto ainda não possui o termo de prestação de serviços aceito.</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 border-orange-300 text-orange-700 hover:bg-orange-50" onClick={() => setShowTermModal(true)}>
            Aceitar agora
          </Button>
        </div>
      )}
      {termData?.alreadyAccepted && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Termo de aceite registrado — {termData.acceptance?.accepted_at ? new Date(termData.acceptance.accepted_at).toLocaleDateString("pt-BR") : ""}</p>
        </div>
      )}
      {/* Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-full h-12 w-12 shrink-0 shadow-sm hover-elevate">
            <Link href="/portal"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              {(project as any).ticketNumber && (
                <Badge variant="secondary" className="font-mono text-xs py-0.5 px-2 bg-primary/10 text-primary border-primary/20 font-bold">
                  {(project as any).ticketNumber}
                </Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-black tracking-tight truncate" data-testid="text-project-title">
                {project.title}
              </h1>
            </div>
            <p className="text-muted-foreground font-medium mt-1">Gerencie os detalhes e acompanhe o progresso da sua homologação.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm ${STATUS_BADGE_STYLES[project.status]}`}>
            {STATUS_LABELS[project.status]}
          </div>
        </div>
      </div>

      {/* Stepper Status Horizontal — sincronizado com o Kanban */}
      <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden rounded-[2.5rem]">
        <CardContent className="p-8 md:p-12">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-6 left-0 w-full h-0.5 bg-muted z-0 hidden md:block" />
            <div
              className="absolute top-6 left-0 h-0.5 bg-primary z-0 transition-all duration-1000 hidden md:block"
              style={{ width: `${currentIdx >= 0 ? (currentIdx / Math.max(statusSteps.length - 1, 1)) * 100 : 0}%` }}
            />

            <div className="relative z-10 flex justify-between gap-4 overflow-x-auto pb-4 no-scrollbar">
              {statusSteps.map((step, idx) => {
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const isPast = idx <= currentIdx;
                const colorHex = STATUS_COLOR_PRESETS[step.color]?.hex ?? "#94a3b8";

                return (
                  <div key={step.key} className="flex flex-col items-center gap-3 min-w-[80px]">
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center border-4 transition-all duration-500 ${
                        isCurrent
                          ? "shadow-lg scale-110 z-10"
                          : isCompleted
                            ? "text-white"
                            : "bg-muted border-muted text-muted-foreground"
                      }`}
                      style={
                        isCurrent || isCompleted
                          ? { backgroundColor: colorHex, borderColor: colorHex }
                          : undefined
                      }
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6 stroke-[3] text-white" />
                      ) : (
                        <span className={`text-sm font-black ${isCurrent ? "text-white" : ""}`}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest text-center max-w-[100px] leading-tight ${isCurrent ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Dados do Projeto */}
          <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden rounded-3xl">
            <CardHeader className="bg-muted/30 border-b border-border/40 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-sky-500" />
                </div>
                <CardTitle className="text-xl font-bold">Dados do Projeto</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
                    <User className="h-3.5 w-3.5" /> Informações Básicas
                  </div>
                  <InfoRow label="Cliente" value={project.nomeCliente || (project.client as any)?.name} />
                  <InfoRow label="CPF/CNPJ" value={project.cpfCnpjCliente || (project.client as any)?.cpfCnpj} />
                  <InfoRow label="Potência" value={project.potencia ? `${project.potencia} kWp` : null} />
                  <InfoRow label="Concessionária" value={project.concessionaria} />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
                    <MapPin className="h-3.5 w-3.5" /> Localização e Identificação
                  </div>
                  <InfoRow label="Endereço" value={project.endereco} link />
                  <InfoRow label="Nº Instalação" value={project.numeroInstalacao} />
                  <InfoRow label="Nº Protocolo" value={project.numeroProtocolo} />
                  <InfoRow label="Valor do Projeto" value={project.valor ? `R$ ${parseFloat(project.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : null} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pagamento */}
          {(project.status === "aprovado_pagamento_pendente" || project.status === "orcamento" || project.paymentStatus === "pending") && (
            <Card className="border-emerald-500/20 bg-emerald-500/[0.02] shadow-xl shadow-emerald-500/5 overflow-hidden rounded-3xl">
              <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/20 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-emerald-900 dark:text-emerald-100">Pagamento da Taxa</CardTitle>
                    <CardDescription className="text-emerald-700/70 dark:text-emerald-400/70">Escolha a melhor forma de pagamento para iniciar seu projeto.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white dark:bg-black/20 border border-emerald-500/20 shadow-sm">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Valor a Pagar</p>
                      <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                        {project.valor ? `R$ ${parseFloat(project.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00"}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-sm font-bold flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" /> Liberação imediata após confirmação
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {project.pixQrCode && (
                      <PixQrCodeSection
                        pixQrCode={project.pixQrCode}
                        pixQrCodeBase64={project.pixQrCodeBase64}
                        gateway={project.paymentGateway || "mp"}
                      />
                    )}

                    {project.paymentLink && !project.pixQrCode && (
                      <MercadoPagoBrick
                        preferenceId={project.paymentId || ""}
                        paymentLink={project.paymentLink}
                      />
                    )}

                    {project.paymentLink && project.pixQrCode && (
                      <div className="pt-2 border-t border-border/30">
                        <MercadoPagoBrick
                          preferenceId={project.paymentId || ""}
                          paymentLink={project.paymentLink}
                        />
                      </div>
                    )}

                    {!project.paymentLink && !project.pixQrCode && (
                      <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-2xl border border-dashed border-border/60">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
                        <p className="text-sm font-bold">Aguardando geração da cobrança</p>
                        <p className="text-xs text-muted-foreground mt-1">Nossa equipe financeira está processando seu pedido.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat / Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden rounded-3xl flex flex-col h-[600px]">
              <CardHeader className="bg-muted/30 border-b border-border/40 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold">Histórico do Projeto</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 overflow-y-auto flex-1 no-scrollbar">
                {tl.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-50">
                    <Lock className="h-12 w-12 mb-4" />
                    <p className="font-bold">Nenhuma atividade registrada</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {tl.map((entry, idx) => (
                      <TimelineItem key={entry.id} entry={entry} isLast={idx === tl.length - 1} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <ChatPanel projectId={id!} currentUserId={user?.id ?? ""} currentUserRole={user?.role ?? "integrador"} />
          </div>
        </div>

        <div className="space-y-8">
          {/* Documentos */}
          <DocumentUploadCard projectId={id!} />

          <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden rounded-3xl">
            <CardHeader className="bg-muted/30 border-b border-border/40 px-8 py-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Arquivos do Projeto ({docs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {docs.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground opacity-50">
                  <p className="text-sm font-bold">Nenhum documento</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {docs.map(doc => (
                    <div key={doc.id} className="group p-6 hover:bg-muted/30 transition-all">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-12 w-12 rounded-2xl bg-background border border-border/40 flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                            <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{doc.name}</p>
                            <Badge variant="outline" className="text-[9px] font-black uppercase mt-1 border-primary/20 text-primary/60">
                              {DOC_TYPE_LABELS[doc.docType] || doc.docType}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary" asChild>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl hover:bg-red-500/10 hover:text-red-500"
                            onClick={() => deleteDocMut.mutate(doc.id)}
                            disabled={deleteDocMut.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas Fiscais */}
          {notasFiscais.filter((n: any) => n.status === "emitida").length > 0 && (
            <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden rounded-3xl">
              <CardHeader className="bg-muted/30 border-b border-border/40 px-8 py-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Notas Fiscais ({notasFiscais.filter((n: any) => n.status === "emitida").length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {notasFiscais.filter((n: any) => n.status === "emitida").map((nota: any) => (
                    <div key={nota.id} className="group p-6 hover:bg-muted/30 transition-all">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-12 w-12 rounded-2xl bg-background border border-border/40 flex items-center justify-center shrink-0 shadow-sm">
                            <Receipt className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold">NFS-e {nota.numeroNota ? `nº ${nota.numeroNota}` : "Emitida"}</p>
                            {nota.valor && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                R$ {parseFloat(nota.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5 text-xs" onClick={() => window.open(`/api/portal/nfse/${nota.id}/pdf`, "_blank")}>
                            <Download className="h-3.5 w-3.5" /> PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>

    {showTermModal && id && (
      <TermAcceptanceModal
        open={showTermModal}
        projectId={String(id)}
        onAccepted={() => { setShowTermModal(false); queryClient.invalidateQueries({ queryKey: ["/api/projects", id, "term"] }); }}
        onClose={() => setShowTermModal(false)}
      />
    )}
    </>
  );
}
