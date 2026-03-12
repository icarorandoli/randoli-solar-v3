import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Save, Upload, Zap, ImageOff, Mail, Send, Eye, EyeOff,
  CreditCard, MonitorPlay, Image, Settings2, Globe, ShieldCheck, Palette, ArrowRight,
  CheckCircle2, XCircle, Loader2, FolderOpen, FileKey, FileBadge, FileText, Receipt
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUpload } from "@/hooks/use-upload";

function LogoUploadSection({
  currentLogoUrl,
  onLogoUrlChange,
}: {
  currentLogoUrl: string;
  onLogoUrlChange: (url: string) => void;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const { uploadFile } = useUpload({
    onSuccess: (response) => {
      onLogoUrlChange(response.objectPath);
      setUploading(false);
      toast({ title: "Logo carregada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao fazer upload da logo", variant: "destructive" });
      setUploading(false);
    },
  });

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadFile(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="h-24 w-36 border border-border rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0">
          {currentLogoUrl ? (
            <img
              src={currentLogoUrl}
              alt="Logo da empresa"
              className="h-20 w-32 object-contain"
              data-testid="img-company-logo-preview"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageOff className="h-8 w-8 opacity-40" />
              <span className="text-xs">Sem logo</span>
            </div>
          )}
        </div>
        <div className="space-y-3 flex-1">
          <div className="space-y-1.5">
            <Label>URL da Logo</Label>
            <Input
              value={currentLogoUrl}
              onChange={e => onLogoUrlChange(e.target.value)}
              placeholder="https://... ou caminho do upload"
              data-testid="input-logo-url"
            />
          </div>
          <label>
            <Button type="button" variant="outline" size="sm" className="relative" disabled={uploading} data-testid="button-upload-logo">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {uploading ? "Enviando..." : "Upload da Logo"}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileInput}
                disabled={uploading}
              />
            </Button>
          </label>
          <p className="text-xs text-muted-foreground">Recomendado: PNG ou SVG com fundo transparente, mínimo 200x80px</p>
        </div>
      </div>
    </div>
  );
}

function FaviconUploadSection({ faviconUrl, setFaviconUrl }: { faviconUrl: string; setFaviconUrl: (v: string) => void }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const { uploadFile } = useUpload({
    onSuccess: (res) => { setFaviconUrl(res.objectPath); setUploading(false); toast({ title: "Favicon enviado com sucesso!" }); },
    onError: () => { toast({ title: "Erro ao enviar favicon", variant: "destructive" }); setUploading(false); },
  });
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true); await uploadFile(file);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 border border-border rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {faviconUrl ? <img src={faviconUrl} alt="Favicon" className="h-10 w-10 object-contain" /> : <ImageOff className="h-5 w-5 text-muted-foreground/40" />}
        </div>
        <div className="flex-1 space-y-2">
          <Input value={faviconUrl} onChange={e => setFaviconUrl(e.target.value)} placeholder="https://... ou faça upload" data-testid="input-favicon-url" />
          <label>
            <Button type="button" variant="outline" size="sm" className="relative" disabled={uploading} data-testid="button-upload-favicon">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {uploading ? "Enviando..." : "Upload do Favicon"}
              <input type="file" accept="image/png,image/x-icon,image/svg+xml,image/webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFile} disabled={uploading} />
            </Button>
          </label>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Recomendado: PNG ou SVG com fundo transparente, mínimo 256×256px</p>
    </div>
  );
}

function LoginCustomSection({
  badgeText, setBadgeText,
  headline, setHeadline,
  highlight, setHighlight,
  headlineSize, setHeadlineSize,
  description, setDescription,
  descriptionSize, setDescriptionSize,
  feature1, setFeature1,
  feature2, setFeature2,
  feature3, setFeature3,
  bgType, setBgType,
  bgImage, setBgImage,
  uploadingBg, setUploadingBg,
}: any) {
  const { toast } = useToast();
  const { uploadFile } = useUpload({
    onSuccess: (res) => {
      setBgImage(res.objectPath);
      setUploadingBg(false);
      toast({ title: "Foto de fundo carregada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao fazer upload da foto de fundo", variant: "destructive" });
      setUploadingBg(false);
    },
  });

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    await uploadFile(file);
  };

  return (
    <Card className="border-muted/40 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MonitorPlay className="h-4 w-4 text-primary" />
          <CardTitle className="text-lg">Personalização do Portal de Login</CardTitle>
        </div>
        <CardDescription>Ajuste as mensagens e o visual da tela de login do portal do integrador.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Texto do Badge (Topo)</Label>
              <Input value={badgeText} onChange={e => setBadgeText(e.target.value)} placeholder="Portal SaaS de Homologação" data-testid="input-login-badge" />
            </div>
            <div className="space-y-2">
              <Label>Título Principal (Headline)</Label>
              <Input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Gerencie projetos de energia solar..." data-testid="input-login-headline" />
            </div>
            <div className="space-y-2">
              <Label>Tamanho do Título</Label>
              <Select value={headlineSize} onValueChange={setHeadlineSize}>
                <SelectTrigger data-testid="select-headline-size"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Médio</SelectItem>
                  <SelectItem value="lg">Grande (padrão)</SelectItem>
                  <SelectItem value="xl">Muito Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destaque no Título (Highlight)</Label>
              <Input value={highlight} onChange={e => setHighlight(e.target.value)} placeholder="energia solar" data-testid="input-login-highlight" />
            </div>
            <div className="space-y-2">
              <Label>Descrição Curta</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Acompanhe cada etapa..." className="h-20" data-testid="input-login-description" />
            </div>
            <div className="space-y-2">
              <Label>Tamanho da Descrição</Label>
              <Select value={descriptionSize} onValueChange={setDescriptionSize}>
                <SelectTrigger data-testid="select-description-size"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Médio (padrão)</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Funcionalidade 1</Label>
              <Input value={feature1} onChange={e => setFeature1(e.target.value)} placeholder="Acompanhamento em tempo real..." data-testid="input-login-feature-1" />
            </div>
            <div className="space-y-2">
              <Label>Funcionalidade 2</Label>
              <Input value={feature2} onChange={e => setFeature2(e.target.value)} placeholder="Documentos e ART centralizados..." data-testid="input-login-feature-2" />
            </div>
            <div className="space-y-2">
              <Label>Funcionalidade 3</Label>
              <Input value={feature3} onChange={e => setFeature3(e.target.value)} placeholder="Status atualizado automaticamente..." data-testid="input-login-feature-3" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-muted/40 space-y-4">
          <Label>Fundo do Painel</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setBgType("gradient")}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${bgType === "gradient" ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}
              data-testid="button-bg-gradient"
            >
              <div className="h-10 w-full rounded bg-gradient-to-br from-[#0c2340] via-[#0e3460] to-[#0d6efd]/70" />
              <span className="text-xs font-medium">Gradiente Padrão</span>
            </button>
            <button
              type="button"
              onClick={() => setBgType("image")}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${bgType === "image" ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}
              data-testid="button-bg-image"
            >
              <div className="h-10 w-full rounded bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Image className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <span className="text-xs font-medium">Foto Personalizada</span>
            </button>
          </div>

          {bgType === "image" && (
            <div className="space-y-2">
              <Input value={bgImage} onChange={e => setBgImage(e.target.value)} placeholder="https://... ou faça upload abaixo" data-testid="input-login-bg-url" />
              <div className="flex items-center gap-3">
                <label>
                  <Button type="button" variant="outline" size="sm" className="relative" disabled={uploadingBg} data-testid="button-upload-bg">
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {uploadingBg ? "Enviando..." : "Upload de Foto"}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleBgUpload} disabled={uploadingBg} />
                  </Button>
                </label>
                {bgImage && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setBgImage("")} data-testid="button-remove-bg">
                    Remover foto
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Recomendado: JPG ou WebP, mínimo 1200×800px. A foto será escurecida levemente para legibilidade.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0ea5e9");

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smtpHost, setSmtpHost] = useState("smtp.office365.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [portalUrl, setPortalUrl] = useState("https://projetos.randolisolar.com.br");
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");

  const [mpEnabled, setMpEnabled] = useState(true);
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [mpWebhookSecret, setMpWebhookSecret] = useState("");

  const [psEnabled, setPsEnabled] = useState(false);
  const [psToken, setPsToken] = useState("");
  const [psEmail, setPsEmail] = useState("");
  const [showPsToken, setShowPsToken] = useState(false);

  const [nfseAutoEmit, setNfseAutoEmit] = useState(false);
  const [nfseGateways, setNfseGateways] = useState<string[]>([]);
  const [paymentNextStatus, setPaymentNextStatus] = useState("projeto_tecnico");
  const [showMpToken, setShowMpToken] = useState(false);


  const [loginBadgeText, setLoginBadgeText] = useState("Portal SaaS de Homologação");
  const [loginHeadline, setLoginHeadline] = useState("Gerencie projetos de energia solar de forma simples e eficiente");
  const [loginHighlight, setLoginHighlight] = useState("energia solar");
  const [loginHeadlineSize, setLoginHeadlineSize] = useState("lg");
  const [loginDescription, setLoginDescription] = useState("Acompanhe cada etapa da homologação fotovoltaica, do orçamento à aprovação final, com total transparência.");
  const [loginDescriptionSize, setLoginDescriptionSize] = useState("md");
  const [loginFeature1, setLoginFeature1] = useState("Acompanhamento em tempo real de cada etapa");
  const [loginFeature2, setLoginFeature2] = useState("Documentos e ART centralizados no portal");
  const [loginFeature3, setLoginFeature3] = useState("Status atualizado automaticamente pela nossa equipe");
  const [loginBgType, setLoginBgType] = useState<"gradient" | "image">("gradient");
  const [loginBgImage, setLoginBgImage] = useState("");
  const [uploadingBg, setUploadingBg] = useState(false);

  const [supportTitle, setSupportTitle] = useState("Suporte Premium");
  const [supportDescription, setSupportDescription] = useState("Nossa equipe de engenharia está pronta para auxiliar você em qualquer etapa.");
  const [supportButtonText, setSupportButtonText] = useState("Falar com Engenheiro");
  const [supportWhatsappUrl, setSupportWhatsappUrl] = useState("https://wa.me/seunumerowhatsapp");

  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappApiUrl, setWhatsappApiUrl] = useState("");
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [whatsappInstanceName, setWhatsappInstanceName] = useState("");
  const [whatsappAdminPhone, setWhatsappAdminPhone] = useState("");
  const [showWhatsappKey, setShowWhatsappKey] = useState(false);

  const [faviconUrl, setFaviconUrl] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setFaviconUrl(settings.favicon_url || "");
    setCompanyName(settings.company_name || "Randoli Engenharia");
    setLogoUrl(settings.logo_url || "");
    setPrimaryColor(settings.primary_color || "#0ea5e9");
    setEmailEnabled(settings.email_notifications_enabled !== "false");
    setSmtpHost(settings.email_smtp_host || "smtp.office365.com");
    setSmtpPort(settings.email_smtp_port || "587");
    setSmtpUser(settings.email_smtp_user || "");
    setSmtpPass(settings.email_smtp_pass || "");
    setSmtpFrom(settings.email_smtp_from || "");
    setPortalUrl(settings.email_portal_url || "https://projetos.randolisolar.com.br");
    setTestEmailTo(settings.email_smtp_user || "");
    setMpEnabled(settings.mp_enabled !== "false");
    setMpAccessToken(settings.mp_access_token || "");
    setMpPublicKey(settings.mp_public_key || "");
    setMpWebhookSecret(settings.mp_webhook_secret || "");
    setPsEnabled(settings.pagseguro_enabled === "true");
    setPsToken(settings.pagseguro_token || "");
    setPsEmail(settings.pagseguro_email || "");
    setNfseAutoEmit(settings.nfse_auto_emit === "true");
    setNfseGateways(settings.nfse_auto_emit_gateways ? settings.nfse_auto_emit_gateways.split(",").filter(Boolean) : []);
    setPaymentNextStatus(settings.payment_next_status || "projeto_tecnico");
    if (settings.login_badge_text) setLoginBadgeText(settings.login_badge_text);
    if (settings.login_headline) setLoginHeadline(settings.login_headline);
    if (settings.login_headline_highlight) setLoginHighlight(settings.login_headline_highlight);
    if (settings.login_headline_size) setLoginHeadlineSize(settings.login_headline_size);
    if (settings.login_description) setLoginDescription(settings.login_description);
    if (settings.login_description_size) setLoginDescriptionSize(settings.login_description_size);
    if (settings.login_feature_1) setLoginFeature1(settings.login_feature_1);
    if (settings.login_feature_2) setLoginFeature2(settings.login_feature_2);
    if (settings.login_feature_3) setLoginFeature3(settings.login_feature_3);
    if (settings.login_bg_type) setLoginBgType(settings.login_bg_type as "gradient" | "image");
    if (settings.login_bg_image) setLoginBgImage(settings.login_bg_image);
    if (settings.support_title) setSupportTitle(settings.support_title);
    if (settings.support_description) setSupportDescription(settings.support_description);
    if (settings.support_button_text) setSupportButtonText(settings.support_button_text);
    if (settings.support_whatsapp_url) setSupportWhatsappUrl(settings.support_whatsapp_url);
    setWhatsappEnabled(settings.whatsapp_enabled === "true");
    setWhatsappApiUrl(settings.whatsapp_api_url || "");
    setWhatsappApiKey(settings.whatsapp_api_key || "");
    setWhatsappInstanceName(settings.whatsapp_instance_name || "");
    setWhatsappAdminPhone(settings.whatsapp_admin_phone || "");
    setInitialized(true);
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const pairs = [
        { key: "company_name", value: companyName },
        { key: "logo_url", value: logoUrl },
        { key: "primary_color", value: primaryColor },
        { key: "email_notifications_enabled", value: emailEnabled ? "true" : "false" },
        { key: "email_smtp_host", value: smtpHost },
        { key: "email_smtp_port", value: smtpPort },
        { key: "email_smtp_user", value: smtpUser },
        { key: "email_smtp_from", value: smtpFrom },
        { key: "email_portal_url", value: portalUrl },
      ];
      if (smtpPass && smtpPass !== "••••••••") {
        pairs.push({ key: "email_smtp_pass", value: smtpPass });
      }
      pairs.push({ key: "mp_enabled", value: mpEnabled ? "true" : "false" });
      pairs.push({ key: "mp_public_key", value: mpPublicKey });
      if (mpAccessToken && mpAccessToken !== "••••••••") {
        pairs.push({ key: "mp_access_token", value: mpAccessToken });
      }
      if (mpWebhookSecret && mpWebhookSecret !== "••••••••") {
        pairs.push({ key: "mp_webhook_secret", value: mpWebhookSecret });
      }
      pairs.push({ key: "pagseguro_enabled", value: psEnabled ? "true" : "false" });
      pairs.push({ key: "pagseguro_email", value: psEmail });
      if (psToken && psToken !== "••••••••") {
        pairs.push({ key: "pagseguro_token", value: psToken });
      }
      pairs.push({ key: "nfse_auto_emit", value: nfseAutoEmit ? "true" : "false" });
      pairs.push({ key: "nfse_auto_emit_gateways", value: nfseGateways.join(",") });
      pairs.push({ key: "payment_next_status", value: paymentNextStatus });
      pairs.push({ key: "favicon_url", value: faviconUrl });
      pairs.push(
        { key: "login_badge_text", value: loginBadgeText },
        { key: "login_headline", value: loginHeadline },
        { key: "login_headline_highlight", value: loginHighlight },
        { key: "login_headline_size", value: loginHeadlineSize },
        { key: "login_description", value: loginDescription },
        { key: "login_description_size", value: loginDescriptionSize },
        { key: "login_feature_1", value: loginFeature1 },
        { key: "login_feature_2", value: loginFeature2 },
        { key: "login_feature_3", value: loginFeature3 },
        { key: "login_bg_type", value: loginBgType },
        { key: "login_bg_image", value: loginBgImage },
        { key: "support_title", value: supportTitle },
        { key: "support_description", value: supportDescription },
        { key: "support_button_text", value: supportButtonText },
        { key: "support_whatsapp_url", value: supportWhatsappUrl },
        { key: "whatsapp_enabled", value: whatsappEnabled ? "true" : "false" },
        { key: "whatsapp_api_url", value: whatsappApiUrl },
        { key: "whatsapp_instance_name", value: whatsappInstanceName },
        { key: "whatsapp_admin_phone", value: whatsappAdminPhone },
      );
      if (whatsappApiKey && whatsappApiKey !== "••••••••") {
        pairs.push({ key: "whatsapp_api_key", value: whatsappApiKey });
      }
      await Promise.all(pairs.map(p => apiRequest("POST", "/api/settings", p)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Configurações salvas com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao salvar configurações", variant: "destructive" }),
  });

  const testEmailMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email/test", { to: testEmailTo || undefined });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `E-mail de teste enviado para ${data.sentTo}` });
    },
    onError: async (err: any) => {
      let msg = "Erro ao enviar e-mail de teste";
      try { const body = await err.json?.(); if (body?.error) msg = body.error; } catch {}
      toast({ title: msg, variant: "destructive" });
    },
  });

  const testWhatsappMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/whatsapp/test", {
        apiUrl: whatsappApiUrl,
        apiKey: whatsappApiKey !== "••••••••" ? whatsappApiKey : undefined,
        instanceName: whatsappInstanceName,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: data.message || "Conexão testada com sucesso!" });
    },
    onError: async (err: any) => {
      let msg = "Erro ao testar conexão WhatsApp";
      try { const body = await err.json?.(); if (body?.error) msg = body.error; } catch {}
      toast({ title: msg, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Configurações</h1>
          </div>
          <p className="text-muted-foreground">Personalize a plataforma e ajuste integrações</p>
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="hover-elevate shadow-md">
          <Save className="h-4 w-4 mr-2" />
          {saveMut.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-48 col-span-1 rounded-xl" />
          <Skeleton className="h-96 col-span-3 rounded-xl" />
        </div>
      ) : (
        <Tabs defaultValue="general" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside className="md:col-span-1">
              <TabsList className="flex flex-col h-auto bg-transparent border-none p-0 space-y-1">
                <TabsTrigger value="general" className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all border border-transparent data-[state=active]:border-primary/20">
                  <Globe className="h-4 w-4 mr-2" /> Geral
                </TabsTrigger>
                <TabsTrigger value="visual" className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all border border-transparent data-[state=active]:border-primary/20">
                  <Palette className="h-4 w-4 mr-2" /> Identidade
                </TabsTrigger>
                <TabsTrigger value="notifications" className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all border border-transparent data-[state=active]:border-primary/20">
                  <Mail className="h-4 w-4 mr-2" /> Notificações
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all border border-transparent data-[state=active]:border-primary/20">
                  <Send className="h-4 w-4 mr-2" /> WhatsApp
                </TabsTrigger>
                <TabsTrigger value="integrations" className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all border border-transparent data-[state=active]:border-primary/20">
                  <CreditCard className="h-4 w-4 mr-2" /> Pagamentos
                </TabsTrigger>
                <TabsTrigger value="nfse" className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all border border-transparent data-[state=active]:border-primary/20">
                  <FileText className="h-4 w-4 mr-2" /> NFS-e
                </TabsTrigger>
              </TabsList>
            </aside>

            <div className="md:col-span-3 space-y-6">
              <TabsContent value="general" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Informações Gerais</CardTitle>
                    </div>
                    <CardDescription>Configure os dados básicos da sua empresa na plataforma.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Nome da Empresa</Label>
                        <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Randoli Engenharia" data-testid="input-company-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portal-url">URL do Portal (Integrador)</Label>
                        <Input id="portal-url" value={portalUrl} onChange={e => setPortalUrl(e.target.value)} placeholder="https://portal.suaempresa.com" data-testid="input-portal-url" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <LoginCustomSection
                  badgeText={loginBadgeText} setBadgeText={setLoginBadgeText}
                  headline={loginHeadline} setHeadline={setLoginHeadline}
                  highlight={loginHighlight} setHighlight={setLoginHighlight}
                  headlineSize={loginHeadlineSize} setHeadlineSize={setLoginHeadlineSize}
                  description={loginDescription} setDescription={setLoginDescription}
                  descriptionSize={loginDescriptionSize} setDescriptionSize={setLoginDescriptionSize}
                  feature1={loginFeature1} setFeature1={setLoginFeature1}
                  feature2={loginFeature2} setFeature2={setLoginFeature2}
                  feature3={loginFeature3} setFeature3={setLoginFeature3}
                  bgType={loginBgType} setBgType={setLoginBgType}
                  bgImage={loginBgImage} setBgImage={setLoginBgImage}
                  uploadingBg={uploadingBg} setUploadingBg={setUploadingBg}
                />

                <Card className="border-muted/40 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Suporte Premium (Portal)</CardTitle>
                    </div>
                    <CardDescription>Configure o card de suporte exibido no portal do integrador.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Título do Card</Label>
                        <Input value={supportTitle} onChange={e => setSupportTitle(e.target.value)} placeholder="Suporte Premium" data-testid="input-support-title" />
                      </div>
                      <div className="space-y-2">
                        <Label>Texto do Botão</Label>
                        <Input value={supportButtonText} onChange={e => setSupportButtonText(e.target.value)} placeholder="Falar com Engenheiro" data-testid="input-support-button-text" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea value={supportDescription} onChange={e => setSupportDescription(e.target.value)} placeholder="Nossa equipe de engenharia está pronta..." className="h-20" data-testid="input-support-description" />
                    </div>
                    <div className="space-y-2">
                      <Label>Link do WhatsApp</Label>
                      <Input value={supportWhatsappUrl} onChange={e => setSupportWhatsappUrl(e.target.value)} placeholder="https://wa.me/5511999999999" data-testid="input-support-whatsapp-url" />
                      <p className="text-xs text-muted-foreground">Formato: https://wa.me/55DDD999999999 (sem espaços ou símbolos)</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visual" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Identidade Visual</CardTitle>
                    </div>
                    <CardDescription>Personalize o visual da sua plataforma (Logo e Favicon).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <LogoUploadSection currentLogoUrl={logoUrl} onLogoUrlChange={setLogoUrl} />
                    <div className="pt-4 border-t border-muted/40 space-y-4">
                      <div className="space-y-2">
                        <Label>Favicon</Label>
                        <FaviconUploadSection faviconUrl={faviconUrl} setFaviconUrl={setFaviconUrl} />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor Primária</Label>
                        <div className="flex items-center gap-3">
                          <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1 rounded-md" data-testid="input-primary-color" />
                          <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="font-mono" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Configurações de E-mail (SMTP)</CardTitle>
                    </div>
                    <CardDescription>Configure como a plataforma envia e-mails automáticos.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted/40 mb-2">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Notificações Ativas</Label>
                        <p className="text-xs text-muted-foreground">Habilitar envio automático de e-mails para clientes e equipe.</p>
                      </div>
                      <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} data-testid="switch-email-enabled" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Host SMTP</Label>
                        <Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.office365.com" data-testid="input-smtp-host" />
                      </div>
                      <div className="space-y-2">
                        <Label>Porta SMTP</Label>
                        <Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="587" data-testid="input-smtp-port" />
                      </div>
                      <div className="space-y-2">
                        <Label>Usuário/E-mail</Label>
                        <Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="contato@suaempresa.com" data-testid="input-smtp-user" />
                      </div>
                      <div className="space-y-2">
                        <Label>Senha</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={smtpPass}
                            onChange={e => setSmtpPass(e.target.value)}
                            placeholder="••••••••"
                            className="pr-10"
                            data-testid="input-smtp-pass"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail do Remetente (From)</Label>
                        <Input value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} placeholder="Engenharia Solar <contato@suaempresa.com>" data-testid="input-smtp-from" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-muted/40 flex items-center gap-3">
                      <div className="flex-1 space-y-2">
                        <Label>Enviar teste para:</Label>
                        <Input value={testEmailTo} onChange={e => setTestEmailTo(e.target.value)} placeholder="seuemail@exemplo.com" />
                      </div>
                      <Button variant="outline" className="mt-8" onClick={() => testEmailMut.mutate()} disabled={testEmailMut.isPending} data-testid="button-test-email">
                        {testEmailMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Testar SMTP
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="whatsapp" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-green-600" />
                      <CardTitle className="text-lg">WhatsApp (Evolution API)</CardTitle>
                    </div>
                    <CardDescription>Configure notificações automáticas via WhatsApp usando a Evolution API.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted/40 mb-2">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">WhatsApp Ativo</Label>
                        <p className="text-xs text-muted-foreground">Habilitar envio automático de mensagens via WhatsApp.</p>
                      </div>
                      <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} data-testid="switch-whatsapp-enabled" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>URL da API (Evolution)</Label>
                        <Input value={whatsappApiUrl} onChange={e => setWhatsappApiUrl(e.target.value)} placeholder="https://sua-evolution-api.com" data-testid="input-whatsapp-api-url" />
                      </div>
                      <div className="space-y-2">
                        <Label>Nome da Instância</Label>
                        <Input value={whatsappInstanceName} onChange={e => setWhatsappInstanceName(e.target.value)} placeholder="randoli-solar" data-testid="input-whatsapp-instance" />
                      </div>
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <div className="relative">
                          <Input
                            type={showWhatsappKey ? "text" : "password"}
                            value={whatsappApiKey}
                            onChange={e => setWhatsappApiKey(e.target.value)}
                            placeholder="••••••••"
                            className="pr-10"
                            data-testid="input-whatsapp-api-key"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowWhatsappKey(!showWhatsappKey)}>
                            {showWhatsappKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone do Admin (notificações)</Label>
                        <Input value={whatsappAdminPhone} onChange={e => setWhatsappAdminPhone(e.target.value)} placeholder="(62) 99999-9999" data-testid="input-whatsapp-admin-phone" />
                        <p className="text-[10px] text-muted-foreground">Número que receberá notificações de novos projetos.</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-muted/40">
                      <Button
                        variant="outline"
                        onClick={() => testWhatsappMut.mutate()}
                        disabled={testWhatsappMut.isPending}
                        data-testid="button-test-whatsapp"
                      >
                        {testWhatsappMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Testar Conexão
                      </Button>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-4 border border-muted/40">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Quando o WhatsApp notifica:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Admin recebe aviso quando integrador cadastra um novo projeto</li>
                        <li>• Integrador recebe aviso quando admin altera o status do projeto</li>
                        <li>• Integrador recebe aviso quando admin adiciona documento ou nota na timeline</li>
                        <li>• Integrador e admin recebem aviso quando pagamento é confirmado</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Mercado Pago</CardTitle>
                    </div>
                    <CardDescription>Receba pagamentos via Cartão e PIX através do Mercado Pago.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted/40 mb-2">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Mercado Pago Ativo</Label>
                        <p className="text-xs text-muted-foreground">Utilizar Mercado Pago para liquidação de faturas.</p>
                      </div>
                      <Switch checked={mpEnabled} onCheckedChange={setMpEnabled} data-testid="switch-mp-enabled" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Public Key</Label>
                        <Input value={mpPublicKey} onChange={e => setMpPublicKey(e.target.value)} placeholder="APP_USR-..." data-testid="input-mp-public-key" />
                      </div>
                      <div className="space-y-2">
                        <Label>Access Token</Label>
                        <div className="relative">
                          <Input
                            type={showMpToken ? "text" : "password"}
                            value={mpAccessToken}
                            onChange={e => setMpAccessToken(e.target.value)}
                            placeholder="APP_USR-..."
                            className="pr-10"
                            data-testid="input-mp-access-token"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowMpToken(!showMpToken)}>
                            {showMpToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Webhook Secret</Label>
                        <Input value={mpWebhookSecret} onChange={e => setMpWebhookSecret(e.target.value)} placeholder="Seu secret do webhook" data-testid="input-mp-webhook-secret" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">PagSeguro</CardTitle>
                    </div>
                    <CardDescription>Receba pagamentos via PIX através do PagSeguro (PagBank).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted/40 mb-2">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">PagSeguro Ativo</Label>
                        <p className="text-xs text-muted-foreground">Utilizar PagSeguro para gerar cobranças PIX.</p>
                      </div>
                      <Switch checked={psEnabled} onCheckedChange={setPsEnabled} data-testid="switch-ps-enabled" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>E-mail PagSeguro</Label>
                        <Input value={psEmail} onChange={e => setPsEmail(e.target.value)} placeholder="seu@email.com" data-testid="input-ps-email" />
                      </div>
                      <div className="space-y-2">
                        <Label>Token</Label>
                        <div className="relative">
                          <Input
                            type={showPsToken ? "text" : "password"}
                            value={psToken}
                            onChange={e => setPsToken(e.target.value)}
                            placeholder="Token PagSeguro..."
                            className="pr-10"
                            data-testid="input-ps-token"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPsToken(!showPsToken)}>
                            {showPsToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Avanço Automático Após Pagamento</CardTitle>
                    </div>
                    <CardDescription>Defina para qual status o projeto deve avançar quando o pagamento for confirmado.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Próximo Status Após Pagamento</Label>
                      <Select value={paymentNextStatus} onValueChange={setPaymentNextStatus}>
                        <SelectTrigger data-testid="select-payment-next-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="projeto_tecnico">Projeto Técnico</SelectItem>
                          <SelectItem value="aguardando_art">Aguardando ART</SelectItem>
                          <SelectItem value="protocolado">Protocolado</SelectItem>
                          <SelectItem value="parecer_acesso">Parecer de Acesso</SelectItem>
                          <SelectItem value="instalacao">Em Instalação</SelectItem>
                          <SelectItem value="vistoria">Aguardando Vistoria</SelectItem>
                          <SelectItem value="projeto_aprovado">Projeto Aprovado</SelectItem>
                          <SelectItem value="homologado">Homologado</SelectItem>
                          <SelectItem value="finalizado">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Escolha o status para o qual o projeto avançará automaticamente após pagamento confirmado.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">NFS-e Automática</CardTitle>
                    </div>
                    <CardDescription>Emitir NFS-e automaticamente após confirmação de pagamento.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted/40">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Emissão Automática</Label>
                        <p className="text-xs text-muted-foreground">Ao ativar, a NFS-e será emitida automaticamente quando o pagamento for confirmado.</p>
                      </div>
                      <Switch checked={nfseAutoEmit} onCheckedChange={setNfseAutoEmit} data-testid="switch-nfse-auto-emit" />
                    </div>
                    {nfseAutoEmit && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-muted/40 space-y-3">
                        <Label className="text-sm font-semibold">Emitir NFS-e para os seguintes métodos de pagamento:</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { key: "mp", label: "Mercado Pago" },
                            { key: "pagseguro", label: "PagSeguro" },
                            { key: "manual", label: "Pagamento Manual" },
                          ].map(gw => (
                            <label key={gw.key} className="flex items-center gap-2 p-2 rounded border border-muted/40 bg-background cursor-pointer hover:bg-muted/20 transition-colors">
                              <input
                                type="checkbox"
                                className="rounded border-muted-foreground/30 h-4 w-4"
                                checked={nfseGateways.includes(gw.key)}
                                onChange={e => {
                                  if (e.target.checked) setNfseGateways(prev => [...prev, gw.key]);
                                  else setNfseGateways(prev => prev.filter(g => g !== gw.key));
                                }}
                                data-testid={`checkbox-nfse-gw-${gw.key}`}
                              />
                              <span className="text-sm">{gw.label}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Se nenhum for selecionado, a NFS-e será emitida para todos os métodos.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </TabsContent>

              <TabsContent value="nfse" className="mt-0 space-y-6">
                <NfseSettingsTab settingsRaw={settings} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      )}
    </div>
  );
}

function NfseSettingsTab({ settingsRaw }: { settingsRaw: any }) {
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);
  const [nfseEnabled, setNfseEnabled] = useState(false);
  const [ambiente, setAmbiente] = useState("homologacao");
  const [webserviceUrl, setWebserviceUrl] = useState("");
  const [cnpjPrestador, setCnpjPrestador] = useState("");
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState("");
  const [municipioCodigo, setMunicipioCodigo] = useState("5107909");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [emailPrestador, setEmailPrestador] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numeroPrest, setNumeroPrest] = useState("");
  const [bairroPrest, setBairroPrest] = useState("");
  const [cepPrest, setCepPrest] = useState("");
  const [ufPrest, setUfPrest] = useState("");
  const [cTribNac, setCTribNac] = useState("140601");
  const [cTribMun, setCTribMun] = useState("");
  const [cNBS, setCNBS] = useState("101061900");
  const [aliquotaIss, setAliquotaIss] = useState("2.00");
  const [opSimpNac, setOpSimpNac] = useState("3");
  const [regApTribSN, setRegApTribSN] = useState("1");
  const [regEspTrib, setRegEspTrib] = useState("0");
  const [serieDps, setSerieDps] = useState("1");
  const [proximoDps, setProximoDps] = useState("1");
  const [descricaoServico, setDescricaoServico] = useState("");
  const [infoComplementares, setInfoComplementares] = useState("");
  const [certSenha, setCertSenha] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certName, setCertName] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (settingsRaw && !initialized) {
    setNfseEnabled(settingsRaw.nfse_enabled === "true");
    setAmbiente(settingsRaw.nfse_ambiente || "homologacao");
    setWebserviceUrl(settingsRaw.nfse_webservice_url || "");
    setCnpjPrestador(settingsRaw.nfse_cnpj_prestador || "");
    setInscricaoMunicipal(settingsRaw.nfse_inscricao_municipal || "");
    setMunicipioCodigo(settingsRaw.nfse_municipio_codigo || "5107909");
    setRazaoSocial(settingsRaw.nfse_razao_social || "");
    setNomeFantasia(settingsRaw.nfse_nome_fantasia || "");
    setEmailPrestador(settingsRaw.nfse_email_prestador || "");
    setLogradouro(settingsRaw.nfse_logradouro || "");
    setNumeroPrest(settingsRaw.nfse_numero || "");
    setBairroPrest(settingsRaw.nfse_bairro || "");
    setCepPrest(settingsRaw.nfse_cep || "");
    setUfPrest(settingsRaw.nfse_uf || "");
    setCTribNac(settingsRaw.nfse_ctrib_nac || "140601");
    setCTribMun(settingsRaw.nfse_ctrib_mun || "");
    setCNBS(settingsRaw.nfse_cnbs || "101061900");
    setAliquotaIss(settingsRaw.nfse_aliquota_iss || "2.00");
    setOpSimpNac(settingsRaw.nfse_op_simples_nac || "3");
    setRegApTribSN(settingsRaw.nfse_reg_ap_trib_sn || "1");
    setRegEspTrib(settingsRaw.nfse_reg_esp_trib || "0");
    setSerieDps(settingsRaw.nfse_serie_dps || settingsRaw.nfse_serie_rps || "1");
    setProximoDps(settingsRaw.nfse_proximo_dps || settingsRaw.nfse_proximo_rps || "1");
    setDescricaoServico(settingsRaw.nfse_descricao_servico || "Prestação de serviços de engenharia e homologação de sistemas fotovoltaicos");
    setInfoComplementares(settingsRaw.nfse_informacoes_complementares || "");
    if (settingsRaw.nfse_certificado_pfx) setCertName("Certificado carregado ✓");
    setInitialized(true);
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const pairs = [
        { key: "nfse_enabled", value: nfseEnabled ? "true" : "false" },
        { key: "nfse_ambiente", value: ambiente },
        { key: "nfse_webservice_url", value: webserviceUrl },
        { key: "nfse_cnpj_prestador", value: cnpjPrestador },
        { key: "nfse_inscricao_municipal", value: inscricaoMunicipal },
        { key: "nfse_municipio_codigo", value: municipioCodigo },
        { key: "nfse_razao_social", value: razaoSocial },
        { key: "nfse_nome_fantasia", value: nomeFantasia },
        { key: "nfse_email_prestador", value: emailPrestador },
        { key: "nfse_logradouro", value: logradouro },
        { key: "nfse_numero", value: numeroPrest },
        { key: "nfse_bairro", value: bairroPrest },
        { key: "nfse_cep", value: cepPrest },
        { key: "nfse_uf", value: ufPrest },
        { key: "nfse_ctrib_nac", value: cTribNac },
        { key: "nfse_ctrib_mun", value: cTribMun },
        { key: "nfse_cnbs", value: cNBS },
        { key: "nfse_aliquota_iss", value: aliquotaIss },
        { key: "nfse_op_simples_nac", value: opSimpNac },
        { key: "nfse_reg_ap_trib_sn", value: regApTribSN },
        { key: "nfse_reg_esp_trib", value: regEspTrib },
        { key: "nfse_serie_dps", value: serieDps },
        { key: "nfse_proximo_dps", value: proximoDps },
        { key: "nfse_descricao_servico", value: descricaoServico },
        { key: "nfse_informacoes_complementares", value: infoComplementares },
      ];
      if (certSenha && certSenha !== "••••••••") {
        pairs.push({ key: "nfse_certificado_senha", value: certSenha });
      }
      for (const p of pairs) {
        await apiRequest("POST", "/api/settings", p);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "NFS-e salvo", description: "Configurações de NFS-e atualizadas." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" }),
  });

  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; message?: string; xmlResponse?: string } | null>(null);
  const testMut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/nfse/testar-conexao", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      return r.json();
    },
    onSuccess: (data: any) => {
      setTestResult(data);
      if (data.success) {
        toast({ title: "Conexão OK!", description: data.message });
      } else {
        const desc = data.message
          ? `${data.error}\n\n${data.message}`
          : (data.error || "Verifique os campos");
        toast({ title: "Resultado do Teste", description: desc, variant: "destructive", duration: 15000 });
      }
    },
    onError: (err: any) => {
      setTestResult({ success: false, error: err?.message || "Erro de conexão" });
      toast({ title: "Erro de conexão", description: err?.message || "Não foi possível conectar ao servidor", variant: "destructive" });
    },
  });

  async function uploadCert() {
    if (!certFile) return;
    setUploadingCert(true);
    try {
      const fd = new FormData();
      fd.append("certificado", certFile);
      const r = await fetch("/api/nfse/upload-certificado", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!r.ok) {
        const text = await r.text();
        let msg = `HTTP ${r.status}`;
        try { const j = JSON.parse(text); msg = j.error || msg; } catch {}
        toast({ title: "Erro ao enviar certificado", description: msg, variant: "destructive" });
        return;
      }
      const data = await r.json();
      if (data.success) {
        setCertName(`${certFile.name} (${Math.round((data.size || 0) / 1024)}KB) ✓`);
        toast({ title: "Certificado enviado com sucesso!" });
      } else {
        toast({ title: "Erro ao enviar", description: data.error || "Erro desconhecido", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao enviar certificado", description: err?.message || "Falha de conexão", variant: "destructive" });
    } finally {
      setUploadingCert(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-muted/40 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg">Nota Fiscal de Serviço (NFS-e)</CardTitle>
          </div>
          <CardDescription>Configure a emissão automática de NFS-e após confirmação de pagamento. Padrão COPLAN SPED NFS-e Nacional v1.01 — Sinop/MT.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <Switch checked={nfseEnabled} onCheckedChange={setNfseEnabled} data-testid="switch-nfse-enabled" />
            <Label>Habilitar emissão de NFS-e</Label>
            <Badge variant={nfseEnabled ? "default" : "secondary"} className="text-[10px]">{nfseEnabled ? "Ativo" : "Inativo"}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select value={ambiente} onValueChange={v => {
                setAmbiente(v);
                if (v === "producao") setWebserviceUrl("https://sefin.nfse.gov.br/sefinnacional");
                else setWebserviceUrl("https://sefin.nfse.gov.br/SefinNacional");
              }}>
                <SelectTrigger data-testid="select-nfse-ambiente"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL do Webservice NFS-e Nacional (SPED)</Label>
              <Input value={webserviceUrl} onChange={e => setWebserviceUrl(e.target.value)} placeholder="https://sefin.nfse.gov.br/sefinnacional" data-testid="input-nfse-webservice-url" />
              <p className="text-[10px] text-muted-foreground">Produção: https://sefin.nfse.gov.br/sefinnacional | Homologação: https://sefin.nfse.gov.br/SefinNacional</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t pt-4">Dados do Prestador (Emitente)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CNPJ do Prestador</Label>
              <Input value={cnpjPrestador} onChange={e => setCnpjPrestador(e.target.value)} placeholder="43.201.226/0001-63" data-testid="input-nfse-cnpj" />
            </div>
            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="ICARO RANDOLI E SILVA LTDA" data-testid="input-nfse-razao-social" />
            </div>
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} placeholder="RANDOLI SOLAR" data-testid="input-nfse-nome-fantasia" />
            </div>
            <div className="space-y-2">
              <Label>E-mail do Prestador</Label>
              <Input value={emailPrestador} onChange={e => setEmailPrestador(e.target.value)} placeholder="icaro@randolisolar.com.br" data-testid="input-nfse-email" />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Municipal (IM)</Label>
              <Input value={inscricaoMunicipal} onChange={e => setInscricaoMunicipal(e.target.value)} placeholder="40690" data-testid="input-nfse-im" />
            </div>
            <div className="space-y-2">
              <Label>Código IBGE do Município (cLocEmi)</Label>
              <Input value={municipioCodigo} onChange={e => setMunicipioCodigo(e.target.value)} placeholder="5107909 (Sinop/MT)" data-testid="input-nfse-municipio" />
            </div>
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t pt-4">Endereço do Prestador</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Logradouro</Label>
              <Input value={logradouro} onChange={e => setLogradouro(e.target.value)} placeholder="HATSUE SAKAGUSCHI" data-testid="input-nfse-logradouro" />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input value={numeroPrest} onChange={e => setNumeroPrest(e.target.value)} placeholder="599" data-testid="input-nfse-numero" />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input value={bairroPrest} onChange={e => setBairroPrest(e.target.value)} placeholder="JARDIM DAS ACACIAS" data-testid="input-nfse-bairro" />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input value={cepPrest} onChange={e => setCepPrest(e.target.value)} placeholder="78553285" data-testid="input-nfse-cep" />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input value={ufPrest} onChange={e => setUfPrest(e.target.value)} placeholder="MT" maxLength={2} data-testid="input-nfse-uf" />
            </div>
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t pt-4">Tributação e Serviço</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>cTribNac — Cód. Tributação Nacional (6 dígitos)</Label>
              <Input value={cTribNac} onChange={e => setCTribNac(e.target.value)} placeholder="140601" data-testid="input-nfse-ctrib-nac" />
            </div>
            <div className="space-y-2">
              <Label>cTribMun — Cód. Tributação Municipal (opcional)</Label>
              <Input value={cTribMun} onChange={e => setCTribMun(e.target.value)} placeholder="" data-testid="input-nfse-ctrib-mun" />
            </div>
            <div className="space-y-2">
              <Label>cNBS — Nomenclatura Brasileira de Serviços (9 dígitos)</Label>
              <Input value={cNBS} onChange={e => setCNBS(e.target.value)} placeholder="101061900" data-testid="input-nfse-cnbs" />
            </div>
            <div className="space-y-2">
              <Label>Alíquota ISS (%)</Label>
              <Input value={aliquotaIss} onChange={e => setAliquotaIss(e.target.value)} placeholder="2.00" data-testid="input-nfse-iss" />
            </div>
            <div className="space-y-2">
              <Label>Simples Nacional (opSimpNac)</Label>
              <Select value={opSimpNac} onValueChange={setOpSimpNac}>
                <SelectTrigger data-testid="select-nfse-op-simples"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Não Optante</SelectItem>
                  <SelectItem value="2">2 — MEI</SelectItem>
                  <SelectItem value="3">3 — ME/EPP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Apuração Tributária SN (regApTribSN)</Label>
              <Select value={regApTribSN} onValueChange={setRegApTribSN}>
                <SelectTrigger data-testid="select-nfse-reg-ap"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Receita Bruta</SelectItem>
                  <SelectItem value="2">2 — Valor Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Regime Especial de Tributação (regEspTrib)</Label>
              <Select value={regEspTrib} onValueChange={setRegEspTrib}>
                <SelectTrigger data-testid="select-nfse-reg-esp"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 — Nenhum</SelectItem>
                  <SelectItem value="1">1 — Ato Cooperado</SelectItem>
                  <SelectItem value="2">2 — Estimativa</SelectItem>
                  <SelectItem value="3">3 — Microempresa Municipal</SelectItem>
                  <SelectItem value="4">4 — Notário ou Registrador</SelectItem>
                  <SelectItem value="5">5 — Profissional Autônomo</SelectItem>
                  <SelectItem value="6">6 — Sociedade de Profissionais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Série do DPS</Label>
              <Input value={serieDps} onChange={e => setSerieDps(e.target.value)} placeholder="1" data-testid="input-nfse-serie" />
            </div>
            <div className="space-y-2">
              <Label>Próximo Número DPS</Label>
              <Input value={proximoDps} onChange={e => setProximoDps(e.target.value)} placeholder="1" data-testid="input-nfse-dps" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição Padrão do Serviço (xDescServ)</Label>
            <Textarea value={descricaoServico} onChange={e => setDescricaoServico(e.target.value)} rows={2} placeholder="MAO DE OBRA PARA INSTALACAO, IMPLANTACAO SISTEMA FOTOVOLTAICO..." data-testid="textarea-nfse-descricao" />
          </div>

          <div className="space-y-2">
            <Label>Informações Complementares (xInfComp)</Label>
            <Textarea value={infoComplementares} onChange={e => setInfoComplementares(e.target.value)} rows={2} placeholder="EMITIDO POR ME OU EPP OPTANTE PELO Simples Nacional..." data-testid="textarea-nfse-info-compl" />
          </div>

          <div className="border-t pt-4 space-y-3">
            <Label className="flex items-center gap-2"><FileKey className="h-4 w-4" /> Certificado Digital A1 (.pfx)</Label>
            <div className="flex items-center gap-3">
              <input ref={fileRef} type="file" accept=".pfx,.p12" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setCertFile(f); }} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} data-testid="button-nfse-select-cert">
                <Upload className="h-4 w-4 mr-2" /> Selecionar .pfx
              </Button>
              {certFile && (
                <Button size="sm" onClick={uploadCert} disabled={uploadingCert} data-testid="button-nfse-upload-cert">
                  {uploadingCert ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileKey className="h-4 w-4 mr-2" />}
                  Enviar certificado
                </Button>
              )}
              {certName && <span className="text-xs text-emerald-600 font-medium">{certName}</span>}
            </div>
            <div className="space-y-2">
              <Label>Senha do certificado</Label>
              <Input type="password" value={certSenha} onChange={e => setCertSenha(e.target.value)} placeholder="••••••••" data-testid="input-nfse-cert-senha" />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} data-testid="button-nfse-save">
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar configurações NFS-e
            </Button>
            <Button variant="outline" onClick={() => testMut.mutate()} disabled={testMut.isPending} data-testid="button-nfse-test">
              {testMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Testar configuração
            </Button>
          </div>

          {testResult && (
            <div className={`mt-4 p-4 rounded-lg border ${testResult.success ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"}`} data-testid="nfse-test-result">
              <p className={`font-semibold text-sm ${testResult.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                {testResult.success ? "Conexão OK!" : "Resultado do Teste"}
              </p>
              {testResult.error && <p className="text-sm mt-1 text-red-700 dark:text-red-300">{testResult.error}</p>}
              {testResult.message && <p className="text-xs mt-1 text-muted-foreground">{testResult.message}</p>}
              {testResult.xmlResponse && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">Ver resposta XML do webservice</summary>
                  <pre className="mt-1 text-[10px] bg-muted p-2 rounded overflow-x-auto max-h-60 whitespace-pre-wrap break-all">{testResult.xmlResponse}</pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
