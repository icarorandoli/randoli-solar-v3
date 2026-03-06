import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, BadgeCheck, Hourglass, FileDown,
  CalendarDays, CheckCircle2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

export default function RelatoriosPage() {
  const { data: finStats, isLoading: finLoading } = useQuery<FinancialStats>({
    queryKey: ["/api/stats/financial"],
  });

  const { data: paidProjects = [], isLoading: paidLoading } = useQuery<(Project & { client: Client | null })[]>({
    queryKey: ["/api/stats/financial/projects", "paid"],
    queryFn: () => fetch("/api/stats/financial/projects?filter=paid", { credentials: "include" }).then(r => r.json()),
  });

  const { data: pendingProjects = [], isLoading: pendingLoading } = useQuery<(Project & { client: Client | null })[]>({
    queryKey: ["/api/stats/financial/projects", "pending"],
    queryFn: () => fetch("/api/stats/financial/projects?filter=pending", { credentials: "include" }).then(r => r.json()),
  });

  // Build monthly chart data from paid projects
  const monthlyMap: Record<string, number> = {};
  for (const p of paidProjects) {
    if (p.updatedAt && p.valor) {
      const key = getMonthKey(new Date(p.updatedAt));
      monthlyMap[key] = (monthlyMap[key] || 0) + parseValor(p.valor);
    }
  }
  const sortedMonths = Object.keys(monthlyMap).sort();
  const chartData = sortedMonths.map(k => ({
    mes: getMonthLabel(k),
    receita: monthlyMap[k],
  }));

  // Monthly breakdown table
  const monthlyCount: Record<string, number> = {};
  for (const p of paidProjects) {
    if (p.updatedAt) {
      const key = getMonthKey(new Date(p.updatedAt));
      monthlyCount[key] = (monthlyCount[key] || 0) + 1;
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Relatórios Financeiros</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão completa de recebimentos e pendências</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {finLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatBRL(finStats?.todayTotal)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">pagamentos do dia</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {finLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatBRL(finStats?.monthTotal)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">faturamento no mês atual</p>
          </CardContent>
        </Card>

        <Card className="border-violet-200 dark:border-violet-800">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recebido</CardTitle>
            <BadgeCheck className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            {paidLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                {formatBRL(paidProjects.reduce((s, p) => s + parseValor(p.valor), 0))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{paidProjects.length} projetos pagos</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
            <Hourglass className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {finLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatBRL(finStats?.pendingTotal)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{pendingProjects.length} projetos pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Receita por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [formatBRL(v), "Receita"]} />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly breakdown table */}
      {sortedMonths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Resumo Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Mês</th>
                    <th className="text-right py-2 pr-4 text-muted-foreground font-medium">Projetos Pagos</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sortedMonths].reverse().map(key => (
                    <tr key={key} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 font-medium capitalize">
                        {new Date(key + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-muted-foreground">{monthlyCount[key] || 0}</td>
                      <td className="py-2.5 text-right font-semibold text-green-600 dark:text-green-400">
                        {formatBRL(monthlyMap[key])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projetos Pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Projetos Pagos
              {!paidLoading && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {paidProjects.length} projetos
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {paidLoading ? (
              <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : paidProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto pago</p>
            ) : (
              <div className="space-y-0">
                {paidProjects.map(p => (
                  <div key={p.id} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0" data-testid={`row-paid-${p.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.client?.name || "—"}</p>
                      {p.updatedAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {p.valor && <span className="text-sm font-semibold text-green-600 dark:text-green-400">{formatBRL(p.valor)}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE_STYLES[p.status]}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* A Receber */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-orange-500" /> A Receber
              {!pendingLoading && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {pendingProjects.length} projetos
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {pendingLoading ? (
              <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : pendingProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum pagamento pendente</p>
            ) : (
              <div className="space-y-0">
                {pendingProjects.map(p => (
                  <div key={p.id} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0" data-testid={`row-pending-${p.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.client?.name || "—"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {p.valor && <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{formatBRL(p.valor)}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE_STYLES[p.status]}`}>
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
    </div>
  );
}
