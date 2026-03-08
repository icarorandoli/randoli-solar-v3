import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Leaf, Sun, Loader2, BarChart2, Zap } from "lucide-react";

interface MonthlyProd { month: string; productionKwh: number; irradiation: number; }
interface SimResult {
  monthlyProduction: MonthlyProd[];
  totalAnnualKwh: number;
  averageMonthlyKwh: number;
  peakMonthKwh: number;
  lowestMonthKwh: number;
  co2SavedKg: number;
  treesEquivalent: number;
}

const IRRADIATION_PRESETS: Record<string, string> = {
  "Fortaleza (CE)": "5.8", "Natal (RN)": "5.9", "Brasília (DF)": "5.5", "Salvador (BA)": "5.5",
  "Goiânia (GO)": "5.4", "Recife (PE)": "5.6", "Cuiabá (MT)": "5.2",
  "São Paulo (SP)": "4.5", "Rio de Janeiro (RJ)": "4.8", "Belo Horizonte (MG)": "5.0",
  "Curitiba (PR)": "4.2", "Porto Alegre (RS)": "4.0",
};

export default function ProductionSimulator() {
  const [params, setParams] = useState({ kwp: "5", irr: "4.5", eff: "78" });
  const [queryParams, setQueryParams] = useState<typeof params | null>(null);

  const { data, isFetching } = useQuery<SimResult>({
    queryKey: ["/api/ai/simulate-production", queryParams?.kwp, queryParams?.irr, queryParams?.eff],
    queryFn: async () => {
      const p = queryParams!;
      const r = await fetch(`/api/ai/simulate-production?kwp=${p.kwp}&irradiation=${p.irr}&efficiency=${parseFloat(p.eff) / 100}`, { credentials: "include" });
      return r.json();
    },
    enabled: !!queryParams,
  });

  const run = () => setQueryParams({ ...params });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Simulador de Produção</h1>
          <p className="text-sm text-muted-foreground">Estimativa de geração mensal e anual do sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Parâmetros do Sistema</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label>Potência (kWp)</Label>
              <Input type="number" step="0.5" value={params.kwp} onChange={e => setParams(p => ({ ...p, kwp: e.target.value }))} data-testid="input-kwp" />
            </div>
            <div className="space-y-1">
              <Label>Irradiação (kWh/m²/dia)</Label>
              <Input type="number" step="0.1" value={params.irr} onChange={e => setParams(p => ({ ...p, irr: e.target.value }))} data-testid="input-irradiation" />
            </div>
            <div className="space-y-1">
              <Label>Localização rápida</Label>
              <Select onValueChange={v => setParams(p => ({ ...p, irr: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(IRRADIATION_PRESETS).map(([k, v]) => (
                    <SelectItem key={k} value={v}>{k} — {v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={run} className="w-full bg-green-600 hover:bg-green-700" disabled={isFetching} data-testid="button-simulate">
                {isFetching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Simulando...</> : <><Sun className="w-4 h-4 mr-2" />Simular</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card data-testid="stat-annual">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{data.totalAnnualKwh.toLocaleString("pt-BR")}</div>
                <div className="text-xs text-muted-foreground">kWh/ano</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{data.averageMonthlyKwh.toLocaleString("pt-BR")}</div>
                <div className="text-xs text-muted-foreground">kWh/mês médio</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Leaf className="w-4 h-4 text-green-500" />
                  <div className="text-2xl font-bold text-green-600">{data.co2SavedKg.toLocaleString("pt-BR")}</div>
                </div>
                <div className="text-xs text-muted-foreground">kg CO₂ evitado/ano</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{data.treesEquivalent}</div>
                <div className="text-xs text-muted-foreground">árvores equivalentes</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Produção Mensal Estimada (kWh)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.monthlyProduction} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(0, 3)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString("pt-BR")} kWh`, "Produção"]} />
                  <Bar dataKey="productionKwh" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Detalhe por Mês</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {data.monthlyProduction.map(m => (
                  <div key={m.month} className="text-center p-2 rounded-lg bg-muted/50">
                    <div className="text-xs font-medium text-muted-foreground">{m.month.slice(0, 3)}</div>
                    <div className="text-sm font-bold">{m.productionKwh.toLocaleString("pt-BR")}</div>
                    <div className="text-xs text-muted-foreground">{m.irradiation} h</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!data && !isFetching && (
        <div className="text-center py-16 text-muted-foreground">
          <Sun className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Configure os parâmetros acima e clique em Simular</p>
        </div>
      )}
    </div>
  );
}
