import { useState } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap, Eye, EyeOff, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"], retry: false });
  const companyName = settings?.company_name || "Randoli Engenharia Solar";
  const logoUrl = settings?.logo_url;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
      } else {
        setSuccess(true);
      }
    } catch {
      toast({ title: "Erro ao redefinir senha", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Link inválido</p>
              <p className="text-xs text-muted-foreground mt-1">
                O link de recuperação é inválido ou está incompleto.
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full" data-testid="button-back-login-invalid">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
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
            <p className="text-sm text-muted-foreground">Redefinir Senha</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {success ? "Senha redefinida!" : "Nova senha"}
            </CardTitle>
            <CardDescription>
              {success
                ? "Sua senha foi alterada com sucesso"
                : "Digite sua nova senha abaixo"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Você já pode fazer login com sua nova senha.
                </p>
                <Link href="/login">
                  <Button className="w-full" data-testid="button-go-login">
                    Ir para Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      data-testid="input-reset-password"
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
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type={showPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    data-testid="input-reset-confirm"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="button-reset-submit">
                  {loading ? "Redefinindo..." : "Redefinir Senha"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
