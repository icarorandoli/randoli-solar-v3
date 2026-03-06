import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"], retry: false });
  const companyName = settings?.company_name || "Randoli Engenharia Solar";
  const logoUrl = settings?.logo_url;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
      } else {
        setSent(true);
      }
    } catch {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
            <p className="text-sm text-muted-foreground">Recuperação de Senha</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Esqueceu a senha?</CardTitle>
            <CardDescription>
              {sent
                ? "Verifique sua caixa de entrada"
                : "Digite o e-mail cadastrado para receber o link de recuperação"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">E-mail enviado!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    O link é válido por 1 hora.
                  </p>
                </div>
                <Link href="/login">
                  <Button variant="outline" className="w-full mt-2" data-testid="button-back-login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-9"
                      required
                      data-testid="input-forgot-email"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="button-forgot-submit">
                  {loading ? "Enviando..." : "Enviar Link de Recuperação"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {!sent && (
          <p className="text-center text-sm text-muted-foreground">
            Lembrou a senha?{" "}
            <Link href="/login" className="text-primary font-medium" data-testid="link-back-login">
              Voltar ao Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
