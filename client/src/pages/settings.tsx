import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, Zap, Building2, ImageOff, Mail, Send, Eye, EyeOff, CreditCard, MonitorPlay, Image } from "lucide-react";
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

function LoginCustomSection({
  badgeText, setBadgeText,
  headline, setHeadline,
  highlight, setHighlight,
  description, setDescription,
  feature1, setFeature1,
  feature2, setFeature2,
  feature3, setFeature3,
  bgType, setBgType,
  bgImage, setBgImage,
  uploadingBg, setUploadingBg,
}: {
  badgeText: string; setBadgeText: (v: string) => void;
  headline: string; setHeadline: (v: string) => void;
  highlight: string; setHighlight: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  feature1: string; setFeature1: (v: string) => void;
  feature2: string; setFeature2: (v: string) => void;
  feature3: string; setFeature3: (v: string) => void;
  bgType: "gradient" | "image"; setBgType: (v: "gradient" | "image") => void;
  bgImage: string; setBgImage: (v: string) => void;
  uploadingBg: boolean; setUploadingBg: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const { uploadFile } = useUpload({
    onSuccess: (res) => { setBgImage(res.objectPath); setUploadingBg(false); toast({ title: "Imagem de fundo enviada!" }); },
    onError: () => { toast({ title: "Erro ao enviar imagem", variant: "destructive" }); setUploadingBg(false); },
  });

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    await uploadFile(file);
  };

  const headlineWithHighlight = (() => {
    if (!highlight || !headline.includes(highlight)) return <span>{headline}</span>;
    const parts = headline.split(highlight);
    return <>{parts[0]}<span className="text-sky-300">{highlight}</span>{parts.slice(1).join(highlight)}</>;
  })();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MonitorPlay className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Personalização da Tela de Login</CardTitle>
        </div>
        <CardDescription>Altere textos, imagem de fundo e conteúdo do painel esquerdo sem precisar editar código</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="rounded-xl overflow-hidden border border-border h-40 relative flex items-center" style={{
          background: bgType === "image" && bgImage
            ? `url(${bgImage}) center/cover no-repeat`
            : "linear-gradient(135deg, #0c2340 0%, #0e3460 50%, rgba(13,110,253,0.7) 100%)",
        }}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 p-5 text-white">
            <div className="text-[10px] bg-white/15 rounded-full px-2 py-0.5 w-fit mb-2 text-sky-200">{badgeText}</div>
            <div className="text-sm font-bold leading-snug">{headlineWithHighlight}</div>
            <div className="text-[10px] text-sky-100/70 mt-1 max-w-xs line-clamp-2">{description}</div>
          </div>
          <div className="absolute top-2 right-2 text-[9px] bg-black/40 text-white px-1.5 py-0.5 rounded">Preview</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Badge */}
          <div className="space-y-1.5">
            <Label>Texto do Badge</Label>
            <Input value={badgeText} onChange={e => setBadgeText(e.target.value)} placeholder="Portal SaaS de Homologação" data-testid="input-login-badge" />
            <p className="text-xs text-muted-foreground">Aparece no topo do painel esquerdo</p>
          </div>

          {/* Highlight */}
          <div className="space-y-1.5">
            <Label>Palavra(s) em Destaque</Label>
            <Input value={highlight} onChange={e => setHighlight(e.target.value)} placeholder="energia solar" data-testid="input-login-highlight" />
            <p className="text-xs text-muted-foreground">Será colorido em azul claro no título</p>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-1.5">
          <Label>Título Principal</Label>
          <Textarea value={headline} onChange={e => setHeadline(e.target.value)} rows={2} placeholder="Gerencie projetos de energia solar de forma simples e eficiente" data-testid="input-login-headline" />
          <p className="text-xs text-muted-foreground">A palavra de destaque acima será colorida automaticamente dentro deste texto</p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Acompanhe cada etapa da homologação..." data-testid="input-login-description" />
        </div>

        {/* Features */}
        <div className="space-y-2">
          <Label>Bullets de Destaque (3 itens)</Label>
          <Input value={feature1} onChange={e => setFeature1(e.target.value)} placeholder="Bullet 1" data-testid="input-login-feature-1" />
          <Input value={feature2} onChange={e => setFeature2(e.target.value)} placeholder="Bullet 2" data-testid="input-login-feature-2" />
          <Input value={feature3} onChange={e => setFeature3(e.target.value)} placeholder="Bullet 3" data-testid="input-login-feature-3" />
        </div>

        {/* Background */}
        <div className="space-y-3">
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
  const [showMpToken, setShowMpToken] = useState(false);

  const [loginBadgeText, setLoginBadgeText] = useState("Portal SaaS de Homologação");
  const [loginHeadline, setLoginHeadline] = useState("Gerencie projetos de energia solar de forma simples e eficiente");
  const [loginHighlight, setLoginHighlight] = useState("energia solar");
  const [loginDescription, setLoginDescription] = useState("Acompanhe cada etapa da homologação fotovoltaica, do orçamento à aprovação final, com total transparência.");
  const [loginFeature1, setLoginFeature1] = useState("Acompanhamento em tempo real de cada etapa");
  const [loginFeature2, setLoginFeature2] = useState("Documentos e ART centralizados no portal");
  const [loginFeature3, setLoginFeature3] = useState("Status atualizado automaticamente pela nossa equipe");
  const [loginBgType, setLoginBgType] = useState<"gradient" | "image">("gradient");
  const [loginBgImage, setLoginBgImage] = useState("");
  const [uploadingBg, setUploadingBg] = useState(false);

  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
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
    if (settings.login_badge_text) setLoginBadgeText(settings.login_badge_text);
    if (settings.login_headline) setLoginHeadline(settings.login_headline);
    if (settings.login_headline_highlight) setLoginHighlight(settings.login_headline_highlight);
    if (settings.login_description) setLoginDescription(settings.login_description);
    if (settings.login_feature_1) setLoginFeature1(settings.login_feature_1);
    if (settings.login_feature_2) setLoginFeature2(settings.login_feature_2);
    if (settings.login_feature_3) setLoginFeature3(settings.login_feature_3);
    if (settings.login_bg_type) setLoginBgType(settings.login_bg_type as "gradient" | "image");
    if (settings.login_bg_image) setLoginBgImage(settings.login_bg_image);
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
      pairs.push(
        { key: "login_badge_text", value: loginBadgeText },
        { key: "login_headline", value: loginHeadline },
        { key: "login_headline_highlight", value: loginHighlight },
        { key: "login_description", value: loginDescription },
        { key: "login_feature_1", value: loginFeature1 },
        { key: "login_feature_2", value: loginFeature2 },
        { key: "login_feature_3", value: loginFeature3 },
        { key: "login_bg_type", value: loginBgType },
        { key: "login_bg_image", value: loginBgImage },
      );
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

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Personalize as informações da sua empresa e o visual do site</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identidade Visual */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Identidade da Empresa</CardTitle>
              </div>
              <CardDescription>Configure o nome e logo da sua empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Randoli Engenharia"
                  data-testid="input-company-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Logo da Empresa</Label>
                <LogoUploadSection currentLogoUrl={logoUrl} onLogoUrlChange={setLogoUrl} />
              </div>
            </CardContent>
          </Card>

          {/* Parceiros */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Carrossel de Parceiros</CardTitle>
              </div>
              <CardDescription>
                Gerencie os parceiros e clientes exibidos no carrossel do site. Vá para a seção "Parceiros" no menu lateral.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Zap className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Gerenciar Parceiros</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adicione logos de clientes e parceiros, configure a ordem de exibição no carrossel e visualize um preview em tempo real.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificações por E-mail */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Notificações por E-mail</CardTitle>
              </div>
              <CardDescription>
                Configure o servidor SMTP para enviar notificações automáticas aos integradores quando o status de um projeto for atualizado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Enable toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                <div>
                  <p className="text-sm font-medium">Ativar notificações automáticas</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Envia e-mail ao integrador a cada mudança de status</p>
                </div>
                <Switch
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                  data-testid="switch-email-enabled"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-host">Servidor SMTP</Label>
                  <Input
                    id="smtp-host"
                    value={smtpHost}
                    onChange={e => setSmtpHost(e.target.value)}
                    placeholder="smtp.office365.com"
                    data-testid="input-smtp-host"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-port">Porta</Label>
                  <Input
                    id="smtp-port"
                    value={smtpPort}
                    onChange={e => setSmtpPort(e.target.value)}
                    placeholder="587"
                    data-testid="input-smtp-port"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="smtp-user">E-mail de envio (usuário SMTP)</Label>
                <Input
                  id="smtp-user"
                  type="email"
                  value={smtpUser}
                  onChange={e => setSmtpUser(e.target.value)}
                  placeholder="notificacoes@randoli.eng.br"
                  data-testid="input-smtp-user"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="smtp-pass">Senha SMTP</Label>
                <div className="relative">
                  <Input
                    id="smtp-pass"
                    type={showPassword ? "text" : "password"}
                    value={smtpPass}
                    onChange={e => setSmtpPass(e.target.value)}
                    placeholder="Deixe em branco para manter a senha atual"
                    className="pr-10"
                    data-testid="input-smtp-pass"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(v => !v)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Para Outlook/Office365, use a senha do aplicativo ou a senha da conta.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="smtp-from">E-mail do remetente (From)</Label>
                <Input
                  id="smtp-from"
                  type="email"
                  value={smtpFrom}
                  onChange={e => setSmtpFrom(e.target.value)}
                  placeholder="Mesmo que o usuário SMTP, ou outro autorizado"
                  data-testid="input-smtp-from"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="portal-url">URL do portal (link nos e-mails)</Label>
                <Input
                  id="portal-url"
                  value={portalUrl}
                  onChange={e => setPortalUrl(e.target.value)}
                  placeholder="https://projetos.randolisolar.com.br"
                  data-testid="input-portal-url"
                />
              </div>

              {/* Test email */}
              <div className="pt-2 border-t border-border space-y-3">
                <p className="text-sm font-medium">Enviar e-mail de teste</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={testEmailTo}
                    onChange={e => setTestEmailTo(e.target.value)}
                    placeholder="destinatario@email.com"
                    className="flex-1"
                    data-testid="input-test-email-to"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => testEmailMut.mutate()}
                    disabled={testEmailMut.isPending || !testEmailTo}
                    data-testid="button-send-test-email"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    {testEmailMut.isPending ? "Enviando..." : "Testar"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Salve as configurações antes de testar. O e-mail de teste usa as configurações já salvas no servidor.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pagamentos — Mercado Pago */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Pagamentos — Mercado Pago</CardTitle>
              </div>
              <CardDescription>
                Configure a integração com o Mercado Pago para cobranças automáticas. Quando um projeto mudar para "Aprovado / Pag. Pendente", um link de pagamento será gerado automaticamente e enviado ao integrador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                <div>
                  <p className="text-sm font-medium">Ativar cobranças via Mercado Pago</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Gera link de pagamento automaticamente ao aprovar projeto</p>
                </div>
                <Switch
                  checked={mpEnabled}
                  onCheckedChange={setMpEnabled}
                  data-testid="switch-mp-enabled"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mp-access-token">Access Token (Produção)</Label>
                <div className="relative">
                  <Input
                    id="mp-access-token"
                    type={showMpToken ? "text" : "password"}
                    value={mpAccessToken}
                    onChange={e => setMpAccessToken(e.target.value)}
                    placeholder="APP_USR-..."
                    className="pr-10 font-mono text-xs"
                    data-testid="input-mp-access-token"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowMpToken(v => !v)}
                    data-testid="button-toggle-mp-token"
                  >
                    {showMpToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Encontre em: <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mercado Pago Developers</a> → Sua aplicação → Credenciais de Produção
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mp-public-key">Public Key (Produção)</Label>
                <Input
                  id="mp-public-key"
                  value={mpPublicKey}
                  onChange={e => setMpPublicKey(e.target.value)}
                  placeholder="APP_USR-..."
                  className="font-mono text-xs"
                  data-testid="input-mp-public-key"
                />
                <p className="text-xs text-muted-foreground">
                  Chave pública usada no checkout embutido. Encontre nas mesmas Credenciais de Produção acima.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mp-webhook-secret">Webhook Secret (opcional)</Label>
                <div className="relative">
                  <Input
                    id="mp-webhook-secret"
                    type={showMpToken ? "text" : "password"}
                    value={mpWebhookSecret}
                    onChange={e => setMpWebhookSecret(e.target.value)}
                    placeholder="Chave secreta do webhook"
                    className="pr-10 font-mono text-xs"
                    data-testid="input-mp-webhook-secret"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Encontre em: Mercado Pago Developers → Sua aplicação → Webhooks → Chave secreta. Valida a autenticidade das notificações.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Como funciona:</p>
                <ol className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-0.5 list-decimal list-inside">
                  <li>Admin muda o status do projeto para "Aprovado / Pag. Pendente"</li>
                  <li>Um link de pagamento do Mercado Pago é gerado automaticamente</li>
                  <li>O integrador recebe o link por e-mail e no portal</li>
                  <li>Após o pagamento, o status avança automaticamente para "Projeto Técnico"</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Personalização do Login */}
          <LoginCustomSection
            badgeText={loginBadgeText} setBadgeText={setLoginBadgeText}
            headline={loginHeadline} setHeadline={setLoginHeadline}
            highlight={loginHighlight} setHighlight={setLoginHighlight}
            description={loginDescription} setDescription={setLoginDescription}
            feature1={loginFeature1} setFeature1={setLoginFeature1}
            feature2={loginFeature2} setFeature2={setLoginFeature2}
            feature3={loginFeature3} setFeature3={setLoginFeature3}
            bgType={loginBgType} setBgType={setLoginBgType}
            bgImage={loginBgImage} setBgImage={setLoginBgImage}
            uploadingBg={uploadingBg} setUploadingBg={setUploadingBg}
          />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              data-testid="button-save-settings"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMut.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
