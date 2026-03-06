import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap, Eye, EyeOff } from "lucide-react";
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

  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"], retry: false });
  const companyName = settings?.company_name || "Randoli Engenharia Solar";
  const logoUrl = settings?.logo_url;

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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-14 object-contain" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Zap className="h-8 w-8 text-primary-foreground" />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-xl font-bold">{companyName}</h1>
            <p className="text-sm text-muted-foreground">Portal do Integrador Solar</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Entrar</CardTitle>
            <CardDescription>Acesse sua conta para gerenciar projetos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="seu.usuario"
                  autoComplete="username"
                  data-testid="input-login-username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    data-testid="input-login-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading} data-testid="button-login-submit">
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <div className="text-center">
                <Link href="/esqueci-senha" className="text-xs text-muted-foreground hover:text-primary transition-colors" data-testid="link-forgot-password">
                  Esqueceu a senha?
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled
                data-testid="button-login-google"
              >
                <SiGoogle className="h-4 w-4 text-[#4285F4]" />
                Entrar com Google (em breve)
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-primary font-medium" data-testid="link-go-register">
            Cadastre-se
          </Link>
        </p>

        {/* Parceiros Carousel */}
        {settings?.partners_enabled !== "false" && (
          <div className="pt-8 border-t border-border/40">
            <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground mb-4 font-semibold">
              Empresas que confiam em nosso trabalho
            </p>
            <div className="relative overflow-hidden group">
              <div className="flex animate-scroll hover:pause gap-8 items-center py-2">
                <PartnersList />
                {/* Duplicate for infinite loop */}
                <PartnersList />
              </div>
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PartnersList() {
  const { data: partners } = useQuery<any[]>({ queryKey: ["/api/partners"] });
  
  if (!partners || partners.length === 0) return null;

  return (
    <>
      {partners.map((partner) => (
        <div 
          key={partner.id} 
          className="flex-shrink-0 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          title={partner.name}
        >
          {partner.logoUrl ? (
            <img 
              src={partner.logoUrl} 
              alt={partner.name} 
              className="h-14 w-auto object-contain max-w-[140px]" 
            />
          ) : (
            <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">{partner.name}</span>
          )}
        </div>
      ))}
    </>
  );
}
