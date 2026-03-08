import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, FolderOpen, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import type { StatusConfig } from "@shared/schema";
import { getBadgeClass } from "@/lib/status-colors";

interface AnalyticsData {
  months: Array<{ month: string; count: number; revenue: number }>;
  byStatus: Record<string, number>;
  totalProjects: number;
}

const CHART_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6", "#f97316"];

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({ queryKey: ["/api/analytics"] });
  const { data: statusConfigs = [] } = useQuery<StatusConfig[]>({ queryKey: ["/api/status-configs"] });
  const configMap = Object.fromEntries(statusConfigs.map(c => [c.key, c]));

  const totalRevenue = data?.months.reduce((s, m) => s + m.revenue, 0) ?? 0;
  const totalCreated = data?.months.reduce((s, m) => s + m.count, 0) ?? 0;

  const statusEntries = data ? Object.entries(data.byStatus).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Métricas dos últimos 6 meses</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Projetos (6 meses)</p>
                {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
                  <p className="text-2xl font-bold text-foreground mt-0.5">{totalCreated}</p>
                )}
              </div>
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Receita estimada (6 meses)</p>
                {isLoading ? <Skeleton className="h-7 w-28 mt-1" /> : (
                  <p className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(totalRevenue)}</p>
                )}
              </div>
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total de projetos</p>
                {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
                  <p className="text-2xl font-bold text-foreground mt-0.5">{data?.totalProjects ?? 0}</p>
                )}
              </div>
              <div className="h-8 w-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ticket médio</p>
                {isLoading ? <Skeleton className="h-7 w-24 mt-1" /> : (
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {totalCreated > 0 ? formatCurrency(totalRevenue / totalCreated) : "—"}
                  </p>
                )}
              </div>
              <div className="h-8 w-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Projects per month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Projetos criados por mês</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.months ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                    formatter={(v: number) => [v, "Projetos"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue per month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Receita estimada por mês</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.months ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                    formatter={(v: number) => [formatCurrency(v), "Receita"]}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* By status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Projetos por status atual</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : statusEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto encontrado</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {statusEntries.map(([key, cnt], i) => {
                const cfg = configMap[key];
                return (
                  <div
                    key={key}
                    className="flex flex-col items-start gap-1 p-3 rounded-lg border border-border bg-muted/30"
                    data-testid={`analytics-status-${key}`}
                  >
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getBadgeClass(cfg?.color ?? "slate")}`}>
                      {cfg?.label ?? key}
                    </span>
                    <span className="text-2xl font-bold text-foreground">{cnt}</span>
                    <span className="text-[10px] text-muted-foreground">{((cnt / (data?.totalProjects || 1)) * 100).toFixed(0)}% do total</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
