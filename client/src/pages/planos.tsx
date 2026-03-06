import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Sun, CheckCircle, ArrowRight } from "lucide-react";
import type { PricingRange } from "@shared/schema";
import { Link } from "wouter";

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PlanosPage() {
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"], retry: false });
  const { data: ranges = [], isLoading } = useQuery<PricingRange[]>({ queryKey: ["/api/pricing-ranges"] });

  const companyName = settings?.company_name || "Randoli Engenharia Solar";
  const logoUrl = settings?.logo_url;

  const benefits = [
    "Projeto elétrico completo",
    "ART de responsabilidade técnica",
    "Memorial descritivo",
    "Protocolo junto à concessionária",
    "Acompanhamento até a homologação",
    "Suporte durante todo o processo",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-9 object-contain" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <span className="font-bold text-sm hidden sm:block">{companyName}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
              Criar Conta
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
            <Sun className="h-3.5 w-3.5" />
            Tabela de Preços
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Projetos Fotovoltaicos<br />
            <span className="text-primary">Valores Transparentes</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Preços fixos por faixa de potência. Sem surpresas, sem cálculos proporcionais.
          </p>
        </div>

        {/* Pricing Table */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Faixas de Potência
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : ranges.filter(r => r.active).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Tabela de preços em configuração. Entre em contato para mais informações.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {ranges.filter(r => r.active).map((range, idx) => (
                <Card key={range.id} className={`overflow-hidden transition-all hover:shadow-md ${idx === 0 ? "border-primary/30" : ""}`}>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          idx === 0 ? "bg-primary/10 text-primary" :
                          idx === 1 ? "bg-blue-100 text-blue-600" :
                          idx === 2 ? "bg-violet-100 text-violet-600" :
                          idx === 3 ? "bg-orange-100 text-orange-600" :
                          "bg-green-100 text-green-600"
                        }`}>
                          <Sun className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{range.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {Number(range.minKwp).toLocaleString("pt-BR")} — {Number(range.maxKwp).toLocaleString("pt-BR")} kWp
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-primary">{formatPrice(range.price)}</p>
                        <p className="text-xs text-muted-foreground">valor fixo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* What's included */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">O que está incluído</h2>
            <div className="space-y-2.5">
              {benefits.map(b => (
                <div key={b} className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <p className="text-sm">{b}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Solicite seu Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Crie uma conta gratuita e solicite seu projeto fotovoltaico de forma rápida e totalmente online.
              </p>
              <div className="space-y-2">
                <Link href="/cadastro">
                  <button className="w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2" data-testid="button-create-account">
                    Criar Conta Gratuita <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/login">
                  <button className="w-full border border-border text-sm font-medium py-2.5 rounded-md hover:bg-muted transition-colors" data-testid="button-login-planos">
                    Já tenho conta
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Note */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground text-center">
            ⚡ Os valores são fixos por faixa de potência, não calculados proporcionalmente.
            Preços podem sofrer alterações sem aviso prévio. Para projetos acima de 75 kWp, entre em contato.
          </p>
        </div>
      </div>
    </div>
  );
}
