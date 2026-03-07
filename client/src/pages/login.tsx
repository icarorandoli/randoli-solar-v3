import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, Eye, EyeOff, ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings/public"], retry: false });
  const companyName = settings?.company_name || "Randoli Engenharia Solar";
  const logoUrl = settings?.logo_url;

  const loginBadgeText = settings?.login_badge_text || "Portal SaaS de Homologação";
  const loginHeadline = settings?.login_headline || "Gerencie projetos de energia solar de forma simples e eficiente";
  const loginHighlight = settings?.login_headline_highlight || "energia solar";
  const loginDescription = settings?.login_description || "Acompanhe cada etapa da homologação fotovoltaica, do orçamento à aprovação final, com total transparência.";
  const loginFeature1 = settings?.login_feature_1 || "Acompanhamento em tempo real de cada etapa";
  const loginFeature2 = settings?.login_feature_2 || "Documentos e ART centralizados no portal";
  const loginFeature3 = settings?.login_feature_3 || "Status atualizado automaticamente pela nossa equipe";
  const loginBgType = settings?.login_bg_type || "gradient";
  const loginBgImage = settings?.login_bg_image || "";

  const headlineNode = (() => {
    if (!loginHighlight || !loginHeadline.includes(loginHighlight)) return <>{loginHeadline}</>;
    const parts = loginHeadline.split(loginHighlight);
    return <>{parts[0]}<span className="text-sky-300">{loginHighlight}</span>{parts.slice(1).join(loginHighlight)}</>;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Erro ao entrar", description: err.message || "Credenciais inválidas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col p-10 relative overflow-hidden"
        style={loginBgType === "image" && loginBgImage
          ? { backgroundImage: `url(${loginBgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(135deg, #0c2340 0%, #0e3460 50%, rgba(13,110,253,0.7) 100%)" }
        }
      >
        {/* Overlay for image bg */}
        {loginBgType === "image" && loginBgImage && (
          <div className="absolute inset-0 bg-[#0c2340]/70" />
        )}
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
          )}
          <span className="text-white font-bold text-lg tracking-tight">{companyName}</span>
        </div>

        {/* Tagline */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs text-sky-200 font-medium w-fit mb-6">
            <Zap className="h-3 w-3" />
            {loginBadgeText}
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            {headlineNode}
          </h1>
          <p className="text-sky-100/80 text-sm leading-relaxed max-w-sm">
            {loginDescription}
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3">
            {[
              { icon: CheckCircle, text: loginFeature1 },
              { icon: ShieldCheck, text: loginFeature2 },
              { icon: Clock, text: loginFeature3 },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-sky-300" />
                </div>
                <span className="text-sm text-sky-100/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Partners strip */}
        {settings?.partners_enabled !== "false" && (
          <div className="relative z-10 pt-8 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-4 font-semibold">
              Empresas que confiam em nosso trabalho
            </p>
            <div className="relative overflow-hidden">
              <div className="flex animate-scroll gap-8 items-center py-1">
                <PartnersList dark />
                <PartnersList dark />
              </div>
              <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0e3460] to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0e3460] to-transparent z-10" />
            </div>
          </div>
        )}
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background min-h-screen lg:min-h-0">
        {/* Mobile logo */}
        <div className="flex flex-col items-center gap-2 mb-8 lg:hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-lg font-bold">{companyName}</h1>
            <p className="text-xs text-muted-foreground">Portal do Integrador Solar</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm mt-1">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">Usuário</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="seu.usuario"
                autoComplete="username"
                className="h-11"
                data-testid="input-login-username"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <Link href="/esqueci-senha" className="text-xs text-primary hover:underline" data-testid="link-forgot-password">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 pr-10"
                  data-testid="input-login-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading} data-testid="button-login-submit">
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 gap-2"
              disabled
              data-testid="button-login-google"
            >
              <SiGoogle className="h-4 w-4 text-[#4285F4]" />
              Entrar com Google (em breve)
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="text-primary font-semibold hover:underline" data-testid="link-go-register">
              Cadastre-se grátis
            </Link>
          </p>

          {/* Mobile partners */}
          {settings?.partners_enabled !== "false" && (
            <div className="lg:hidden mt-10 pt-6 border-t border-border/40">
              <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground mb-4 font-semibold">
                Empresas que confiam em nosso trabalho
              </p>
              <div className="relative overflow-hidden">
                <div className="flex animate-scroll gap-8 items-center py-1">
                  <PartnersList />
                  <PartnersList />
                </div>
                <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent z-10" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PartnersList({ dark }: { dark?: boolean }) {
  const { data: partners } = useQuery<any[]>({ queryKey: ["/api/partners"] });

  if (!partners || partners.length === 0) return null;

  return (
    <>
      {partners.map((partner) => (
        <div
          key={partner.id}
          className={`flex-shrink-0 transition-all duration-300 ${dark ? "grayscale brightness-200 opacity-40 hover:opacity-70" : "grayscale opacity-50 hover:grayscale-0 hover:opacity-100"}`}
          title={partner.name}
        >
          {partner.logoUrl ? (
            <img
              src={partner.logoUrl}
              alt={partner.name}
              className="h-10 w-auto object-contain max-w-[120px]"
            />
          ) : (
            <span className={`text-sm font-bold whitespace-nowrap ${dark ? "text-white/50" : "text-muted-foreground"}`}>{partner.name}</span>
          )}
        </div>
      ))}
    </>
  );
}
