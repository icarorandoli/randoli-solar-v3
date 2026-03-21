import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, TrendingUp, BadgeCheck, Hourglass,
  CalendarDays, CheckCircle2, ArrowUpRight, ArrowDownRight,
  ReceiptText, BarChart3, CreditCard, Clock, AlertCircle
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";
import type { Project, Client } from "@shared/schema";
import { STATUS_LABELS, STATUS_BADGE_STYLES } from "./dashboard";

interface FinancialStats {
  todayTotal: number;
  monthTotal: number;
  paidCount: number;
  pendingTotal: number;
}

function formatBRL(val: number | string | null | undefined) {
  const n = typeof val === "string"
    ? parseFloat(String(val).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0
    : Number(val ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseValor(v: string | null | undefined): number {
  if (!v) return 0;
  return parseFloat(String(v).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string) {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

const GATEWAY_COLORS: Record<string, string> = {
  mp: "#009EE3", mp2: "#4F46E5", pagseguro: "#00B094",
  asaas: "#FF6B00", manual: "#6B7280",
};
const GATEWAY_LABELS: Record<string, string> = {
  mp: "MP CPF", mp2: "MP CNPJ", pagseguro: "PagSeguro",
  asaas: "Asaas", manual: "Manual",
};

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<"3"|"6"|"12">("6");

  const { data: finStats, isLoading: finLoading } = useQuery<FinancialStats>({ queryKey: ["/api/stats/financial"] });

  const paidQuery = useQuery<(Project & { client: Client | null })[]>({
    queryKey: ["/api/stats/financial/projects", "paid"],
    queryFn: () => fetch("/api/stats/financial/projects?filter=paid", { credentials: "include" }).then(r => r.json()),
  });

  const pendingQuery = useQuery<(Project & { client: Client | null })[]>({
    queryKey: ["/api/stats/financial/projects", "pending"],
    queryFn: () => fetch("/api/stats/financial/projects?filter=pending", { credentials: "include" }).then(r => r.json()),
  });

  const paidProjects = paidQuery.data || [];
  const pendingProjects = pendingQuery.data || [];

  useEffect(() => {
    const handleFocus = () => queryClient.invalidateQueries({ queryKey: ["/api/stats/financial/projects"] });
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const monthlyMap: Record<string, number> = {};
  const monthlyCount: Record<string, number> = {};
  for (const p of paidProjects) {
    if (p.updatedAt && p.valor) {
      const key = getMonthKey(new Date(p.updatedAt));
      monthlyMap[key] = (monthlyMap[key] || 0) + parseValor(p.valor);
      monthlyCount[key] = (monthlyCount[key] || 0) + 1;
    }
  }
  const sortedMonths = Object.keys(monthlyMap).sort();
  const chartData = sortedMonths.map(k => ({ mes: getMonthLabel(k), receita: monthlyMap[k], projetos: monthlyCount[k] || 0 }));

  const gatewayMap: Record<string, number> = {};
  for (const p of paidProjects) {
    const gw = (p as any).paymentGateway || "manual";
    gatewayMap[gw] = (gatewayMap[gw] || 0) + parseValor(p.valor);
  }
  const gatewayData = Object.entries(gatewayMap).map(([gw, total]) => ({
    name: GATEWAY_LABELS[gw] || gw, value: total, color: GATEWAY_COLORS[gw] || "#6B7280", key: gw,
  })).sort((a, b) => b.value - a.value);

  const totalPago = paidProjects.reduce((s, p) => s + parseValor(p.valor), 0);
  const totalPendente = pendingProjects.reduce((s, p) => s + parseValor(p.valor), 0);
  const ticketMedio = paidProjects.length > 0 ? totalPago / paidProjects.length : 0;

  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const prevMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const currentMonthTotal = monthlyMap[currentMonthKey] || 0;
  const prevMonthTotal = monthlyMap[prevMonthKey] || 0;
  const monthGrowth = prevMonthTotal > 0 ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-background border border-border/60 rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold text-foreground mb-2 uppercase tracking-wider">{label}</p>
        {payload.map((e: any, i: number) => (
          <div key={i} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{e.name === "receita" ? "Recebido" : "Projetos"}</span>
            <span className="font-bold" style={{ color: e.color }}>
              {e.name === "projetos" ? e.value : formatBRL(e.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <ReceiptText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Relatórios Financeiros</h1>
            <p className="text-sm text-muted-foreground">Fluxo de caixa e desempenho de recebimentos</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/40 rounded-xl p-1">
          {(["3","6","12"] as const).map(p => (
            <Button key={p} size="sm" variant={period === p ? "default" : "ghost"}
              onClick={() => setPeriod(p)} className="h-7 text-xs font-bold rounded-lg px-3">
              {p}M
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70 mb-1">Faturamento Mês</p>
                {finLoading ? <Skeleton className="h-8 w-28" /> : (
                  <p className="text-2xl font-black text-blue-600 tracking-tight" data-testid="text-month-revenue">{formatBRL(finStats?.monthTotal)}</p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  {monthGrowth >= 0
                    ? <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full"><ArrowUpRight className="h-3 w-3" />+{monthGrowth.toFixed(1)}%</span>
                    : <span className="flex items-center text-[10px] font-bold text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded-full"><ArrowDownRight className="h-3 w-3" />{monthGrowth.toFixed(1)}%</span>
                  }
                  <span className="text-[10px] text-muted-foreground">vs mês ant.</span>
                </div>
              </div>
              <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 mb-1">Total Liquidado</p>
                {paidQuery.isLoading ? <Skeleton className="h-8 w-28" /> : (
                  <p className="text-2xl font-black text-emerald-600 tracking-tight" data-testid="text-paid-revenue">{formatBRL(totalPago)}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">{paidProjects.length} projeto{paidProjects.length !== 1 ? "s" : ""} pagos</p>
              </div>
              <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <BadgeCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600/70 mb-1">Ticket Médio</p>
                {paidQuery.isLoading ? <Skeleton className="h-8 w-28" /> : (
                  <p className="text-2xl font-black text-violet-600 tracking-tight">{formatBRL(ticketMedio)}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">por projeto liquidado</p>
              </div>
              <div className="h-10 w-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600/70 mb-1">A Receber</p>
                {finLoading ? <Skeleton className="h-8 w-28" /> : (
                  <p className="text-2xl font-black text-orange-600 tracking-tight" data-testid="text-pending-revenue">{formatBRL(totalPendente)}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">{pendingProjects.length} fatura{pendingProjects.length !== 1 ? "s" : ""} em aberto</p>
              </div>
              <div className="h-10 w-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico + Resumo Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-muted/40 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Recebimentos Mensais
            </CardTitle>
            <CardDescription>Evolução do faturamento liquidado</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2.5}
                    fill="url(#colorReceita)"
                    dot={{ fill: "hsl(var(--primary))", r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                    activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-muted/10 rounded-xl border-2 border-dashed border-muted">
                <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum dado financeiro disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-muted/40 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Por Mês
            </CardTitle>
            <CardDescription>Histórico de recebimentos</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-auto" style={{ maxHeight: 280 }}>
            {sortedMonths.length > 0 ? (
              <div className="divide-y divide-border/40">
                {[...sortedMonths].reverse().map(key => {
                  const isCurrent = key === currentMonthKey;
                  const pct = Math.max(...Object.values(monthlyMap)) > 0
                    ? (monthlyMap[key] / Math.max(...Object.values(monthlyMap))) * 100 : 0;
                  return (
                    <div key={key} className={`px-5 py-3 hover:bg-muted/20 transition-colors ${isCurrent ? "bg-primary/5" : ""}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold capitalize">
                            {new Date(key + "-01").toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                          </p>
                          {isCurrent && <span className="text-[9px] bg-primary text-primary-foreground px-1 py-0.5 rounded font-black">ATUAL</span>}
                        </div>
                        <p className="text-xs font-black text-emerald-600">{formatBRL(monthlyMap[key])}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-muted/50">
                          <div className="h-1 rounded-full bg-emerald-500/70 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{monthlyCount[key] || 0} proj.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Sem dados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gateway + Recebimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-muted/40 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Por Gateway
            </CardTitle>
            <CardDescription>Distribuição por forma de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            {gatewayData.length > 0 ? (
              <div className="space-y-4 mt-1">
                {gatewayData.map(gw => (
                  <div key={gw.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: gw.color }} />
                        <span className="text-xs font-bold">{gw.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black" style={{ color: gw.color }}>{formatBRL(gw.value)}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          {totalPago > 0 ? ((gw.value / totalPago) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${totalPago > 0 ? (gw.value / totalPago) * 100 : 0}%`, backgroundColor: gw.color }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border/40 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Total recebido</span>
                    <span className="font-black text-foreground">{formatBRL(totalPago)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">Sem dados de gateway</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-muted/40 shadow-md">
          <CardHeader className="pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Recebimentos Recentes
                </CardTitle>
                <CardDescription>Projetos com pagamento confirmado</CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-bold text-[10px]">
                {paidProjects.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0" style={{ maxHeight: 320, overflowY: "auto" }}>
            {paidQuery.isLoading ? (
              <div className="p-4 space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
            ) : paidProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum recebimento registrado</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {paidProjects.map(p => {
                  const gw = (p as any).paymentGateway || "manual";
                  return (
                    <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/10 transition-colors group" data-testid={`row-paid-${p.id}`}>
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{p.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-muted-foreground truncate">{p.client?.name || "—"}</p>
                          {p.updatedAt && (
                            <><span className="text-muted-foreground/30">·</span>
                            <p className="text-[11px] text-muted-foreground shrink-0">{new Date(p.updatedAt).toLocaleDateString("pt-BR")}</p></>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-sm font-black text-emerald-600" data-testid="text-today-revenue">{formatBRL(p.valor)}</span>
                        <div className="flex items-center gap-1.5">
                          {gw !== "manual" && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: GATEWAY_COLORS[gw] + "20", color: GATEWAY_COLORS[gw] }}>
                              {GATEWAY_LABELS[gw] || gw}
                            </span>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${STATUS_BADGE_STYLES[p.status]}`}>
                            {STATUS_LABELS[p.status] || p.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cobranças Pendentes */}
      <Card className="border-muted/40 shadow-md">
        <CardHeader className="pb-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-orange-600">
                <AlertCircle className="h-4 w-4" /> Cobranças Pendentes
              </CardTitle>
              <CardDescription>Projetos aguardando confirmação de pagamento</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-orange-600">{formatBRL(totalPendente)}</span>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500/20 font-bold text-[10px]">
                {pendingProjects.length} em aberto
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pendingQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : pendingProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/40 mb-2" />
              <p className="text-sm font-bold text-emerald-600">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground">Nenhuma cobrança pendente</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {pendingProjects.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-3 px-5 py-4 hover:bg-muted/10 transition-colors group border-b border-border/30 ${i % 3 !== 2 ? "lg:border-r" : ""}`} data-testid={`row-pending-${p.id}`}>
                  <div className="h-9 w-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{p.client?.name || "—"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-sm font-black text-orange-600">{formatBRL(p.valor)}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${STATUS_BADGE_STYLES[p.status]}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
