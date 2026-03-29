import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Project, Client } from "@shared/schema";

function formatBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function parseValor(v: any): number {
  if (!v) return 0;
  return parseFloat(String(v).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
}

export default function FinanceiroFluxoCaixaPage() {
  const [days, setDays] = useState<30|60|90>(30);
  const { data: projects = [], isLoading } = useQuery<(Project & { client: Client | null })[]>({ queryKey: ["/api/projects"] });

  const paidProjects = projects.filter(p => p.paymentStatus === "approved");
  const pendingProjects = projects.filter(p => p.status === "aprovado_pagamento_pendente");

  const saldoReal = paidProjects.reduce((s, p) => s + parseValor(p.valor), 0);
  const entradasPrevistas = pendingProjects.reduce((s, p) => s + parseValor(p.valor), 0);

  // Generate projection chart data
  const now = new Date();
  const chartData = Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    // Spread pending payments evenly over the period
    const dailyEntry = entradasPrevistas / days;
    const projected = saldoReal + dailyEntry * (i + 1);
    return {
      day: i === 0 ? "Hoje" : i % 7 === 0 ? `+${i}d` : "",
      saldo: parseFloat(projected.toFixed(2)),
    };
  }).filter((_, i) => i === 0 || (i + 1) % Math.floor(days / 8) === 0 || i === days - 1);

  const cards = [
    { label: "Saldo Real", value: formatBRL(saldoReal), sub: "Projetos pagos", color: "text-emerald-600", icon: TrendingUp, bg: "bg-emerald-500/10" },
    { label: "Entradas Previstas", value: formatBRL(entradasPrevistas), sub: `${pendingProjects.length} proj. pendentes`, color: "text-blue-600", icon: DollarSign, bg: "bg-blue-500/10" },
    { label: "Saídas Previstas", value: formatBRL(0), sub: "Nenhuma cadastrada", color: "text-red-500", icon: TrendingDown, bg: "bg-red-500/10" },
    { label: "Saldo Projetado", value: formatBRL(saldoReal + entradasPrevistas), sub: `Próximos ${days} dias`, color: "text-violet-600", icon: Clock, bg: "bg-violet-500/10" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">Projeção baseada nos projetos ativos</p>
        </div>
        <div className="flex gap-2">
          {([30,60,90] as const).map(d => (
            <Button key={d} size="sm" variant={days === d ? "default" : "outline"} className="h-8 text-xs" onClick={() => setDays(d)}>{d} dias</Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => (
            <Card key={i} className="border-none shadow-md rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                  <div className={`h-7 w-7 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
                  </div>
                </div>
                <p className={`text-lg font-black ${c.color}`}>{c.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-none shadow-md rounded-2xl">
        <CardContent className="p-6">
          <h2 className="text-base font-bold mb-1">Projeção de Saldo — Próximos {days} dias</h2>
          <p className="text-xs text-muted-foreground mb-6">Baseado nos pagamentos pendentes esperados</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -10 }}>
                <defs>
                  <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                <Tooltip formatter={(v: any) => [formatBRL(v), "Saldo Projetado"]} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={2.5} fill="url(#saldoGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {pendingProjects.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-4">Nenhuma entrega prevista para os próximos {days} dias.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
