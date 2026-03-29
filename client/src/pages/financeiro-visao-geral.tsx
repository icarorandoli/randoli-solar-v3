import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Clock, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Project, Client } from "@shared/schema";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseValor(v: any): number {
  if (!v) return 0;
  return parseFloat(String(v).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
}

function getMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string) {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export default function FinanceiroVisaoGeralPage() {
  const [period, setPeriod] = useState<"3"|"6"|"12">("6");
  const { data: projects = [], isLoading } = useQuery<(Project & { client: Client | null })[]>({ queryKey: ["/api/projects"] });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const paidProjects = projects.filter(p => p.paymentStatus === "approved" || (p as any).paymentStatus === "paid");
  const pendingProjects = projects.filter(p => p.status === "aprovado_pagamento_pendente");

  const receitaMes = paidProjects
    .filter(p => p.updatedAt && new Date(p.updatedAt) >= monthStart)
    .reduce((s, p) => s + parseValor(p.valor), 0);

  const receitaMesAnterior = paidProjects
    .filter(p => p.updatedAt && new Date(p.updatedAt) >= prevMonthStart && new Date(p.updatedAt) <= prevMonthEnd)
    .reduce((s, p) => s + parseValor(p.valor), 0);

  const receitaTotal = paidProjects.reduce((s, p) => s + parseValor(p.valor), 0);
  const aReceber = pendingProjects.reduce((s, p) => s + parseValor(p.valor), 0);
  const varMes = receitaMesAnterior > 0 ? ((receitaMes - receitaMesAnterior) / receitaMesAnterior * 100).toFixed(1) : null;

  // Monthly chart data
  const months = parseInt(period);
  const chartData = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = getMonthKey(d);
    const label = getMonthLabel(key);
    const monthPaid = paidProjects.filter(p => {
      if (!p.updatedAt) return false;
      return getMonthKey(new Date(p.updatedAt)) === key;
    }).reduce((s, p) => s + parseValor(p.valor), 0);
    return { month: label, receita: monthPaid };
  });

  const cards = [
    { label: "Receita do Mês", value: formatBRL(receitaMes), sub: varMes ? `${parseFloat(varMes) >= 0 ? "+" : ""}${varMes}% vs mês anterior` : "Primeiro mês", color: "text-emerald-600", icon: TrendingUp, bg: "bg-emerald-500/10" },
    { label: "Receita Total", value: formatBRL(receitaTotal), sub: `${paidProjects.length} projetos pagos`, color: "text-blue-600", icon: DollarSign, bg: "bg-blue-500/10" },
    { label: "A Receber", value: formatBRL(aReceber), sub: `${pendingProjects.length} projetos pendentes`, color: "text-amber-600", icon: Clock, bg: "bg-amber-500/10" },
    { label: "Ticket Médio", value: paidProjects.length > 0 ? formatBRL(receitaTotal / paidProjects.length) : "R$ 0,00", sub: "por projeto pago", color: "text-violet-600", icon: BarChart3, bg: "bg-violet-500/10" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Financeiro — Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resumo financeiro dos projetos</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <Card key={i} className="border-none shadow-md rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                  <div className={`h-8 w-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-none shadow-md rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold">Receita vs Mês</h2>
              <p className="text-xs text-muted-foreground">Evolução dos últimos {period} meses</p>
            </div>
            <div className="flex gap-2">
              {(["3","6","12"] as const).map(p => (
                <Button key={p} size="sm" variant={period === p ? "default" : "outline"} className="h-7 text-xs px-3" onClick={() => setPeriod(p)}>
                  {p}m
                </Button>
              ))}
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -10 }}>
                <defs>
                  <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                <Tooltip formatter={(v: any) => [formatBRL(v), "Receita"]} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2.5} fill="url(#receitaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
