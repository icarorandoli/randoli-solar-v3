import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Sun, CheckCircle, ArrowRight, Calculator } from "lucide-react";
import type { PricingRange } from "@shared/schema";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const RANGE_COLORS = [
  { bg: "bg-sky-50 dark:bg-sky-900/20", border: "border-sky-200 dark:border-sky-800", icon: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400", badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  { bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800", icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  { bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800", icon: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400", badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
];

function KwpCalculator({ ranges }: { ranges: PricingRange[] }) {
  const [kwp, setKwp] = useState("");

  const active = ranges.filter(r => r.active);
  const kwpNum = parseFloat(kwp.replace(",", "."));

  const matched = !isNaN(kwpNum) && kwpNum > 0
    ? active.find(r => kwpNum >= Number(r.minKwp) && kwpNum <= Number(r.maxKwp))
    : null;

  const aboveMax = !isNaN(kwpNum) && kwpNum > 0 && active.length > 0
    ? kwpNum > Math.max(...active.map(r => Number(r.maxKwp)))
    : false;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Calculadora de Preço
        </CardTitle>
        <p className="text-xs text-muted-foreground">Digite a potência do sistema para ver o valor do projeto</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="kwp-input" className="text-sm">Potência do sistema</Label>
          <div className="relative">
            <Input
              id="kwp-input"
              type="number"
              min="0"
              step="0.1"
              value={kwp}
              onChange={e => setKwp(e.target.value)}
              placeholder="Ex: 12"
              className="pr-12"
              data-testid="input-kwp-calculator"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">kWp</span>
          </div>
        </div>

        {kwp && (
          <div className={`rounded-lg p-4 border transition-all ${matched
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
            : aboveMax
            ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
            : "bg-muted/50 border-border"
          }`}>
            {matched ? (
              <div>
                <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">{matched.label}</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatPrice(matched.price)}</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">valor fixo · faixa {Number(matched.minKwp).toLocaleString("pt-BR")}–{Number(matched.maxKwp).toLocaleString("pt-BR")} kWp</p>
              </div>
            ) : aboveMax ? (
              <div>
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">Acima da tabela</p>
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">Para projetos acima de {Math.max(...active.map(r => Number(r.maxKwp))).toLocaleString("pt-BR")} kWp, entre em contato para um orçamento personalizado.</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Digite uma potência válida</p>
            )}
          </div>
        )}

        {!kwp && (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <Zap className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Insira os kWp para calcular</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlanosPage() {
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"], retry: false });
  const { data: ranges = [], isLoading } = useQuery<PricingRange[]>({ queryKey: ["/api/pricing-ranges"] });

  const companyName = settings?.company_name || "Randoli Engenharia Solar";
  const logoUrl = settings?.logo_url;
  const activeRanges = ranges.filter(r => r.active);

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
            <Link href="/cadastro" className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors font-medium">
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

        {/* Pricing Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Faixas de Potência
          </h2>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
            </div>
          ) : activeRanges.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Tabela de preços em configuração. Entre em contato para mais informações.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRanges.map((range, idx) => {
                const colors = RANGE_COLORS[idx % RANGE_COLORS.length];
                return (
                  <Card
                    key={range.id}
                    className={`overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 border ${colors.border} ${colors.bg}`}
                    data-testid={`card-pricing-range-${range.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                          <Sun className="h-5 w-5" />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                          Faixa {idx + 1}
                        </span>
                      </div>
                      <p className="font-bold text-sm mb-1">{range.label}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {Number(range.minKwp).toLocaleString("pt-BR")} — {Number(range.maxKwp).toLocaleString("pt-BR")} kWp
                      </p>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{formatPrice(range.price)}</p>
                        <p className="text-xs text-muted-foreground">valor fixo por projeto</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Calculator + CTA */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {activeRanges.length > 0 && <KwpCalculator ranges={ranges} />}

          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">O que está incluído</h2>
              <div className="space-y-2.5">
                {benefits.map(b => (
                  <div key={b} className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm">{b}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Solicite seu Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Crie uma conta gratuita e solicite seu projeto fotovoltaico de forma rápida e totalmente online.
                </p>
                <div className="space-y-2">
                  <Link href="/cadastro">
                    <button className="w-full bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2" data-testid="button-create-account">
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
