import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, Zap, Sun, Battery, TrendingUp, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const schema = z.object({
  monthlyConsumptionKwh: z.coerce.number().min(1, "Obrigatório").max(100000),
  city: z.string().min(2, "Obrigatório"),
  state: z.string().min(2, "Obrigatório"),
});
type FormData = z.infer<typeof schema>;

interface SizingResult {
  kwp: number;
  panelsNeeded: number;
  monthlyGenerationKwh: number;
  annualGenerationKwh: number;
  irradiationUsed: number;
  phase: string;
  coveragePercent: number;
  suggestedPanel: { brand: string; model: string; powerW: number } | null;
  suggestedInverter: { brand: string; model: string; powerKw: string } | null;
}

const STATES = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export default function AiCalculator() {
  const [result, setResult] = useState<SizingResult | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { monthlyConsumptionKwh: 400, city: "", state: "SP" },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", "/api/ai/size-system", data).then(r => r.json()),
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calculadora Solar</h1>
          <p className="text-sm text-muted-foreground">Dimensione o sistema fotovoltaico ideal pelo consumo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados de Consumo</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="monthlyConsumptionKwh" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumo Médio Mensal (kWh)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="400" {...field} data-testid="input-consumption" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-state">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={mutation.isPending} data-testid="button-calculate">
                  {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calculando...</> : <><Calculator className="w-4 h-4 mr-2" />Calcular Sistema</>}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="w-4 h-4 text-orange-500" />
                Resultado do Dimensionamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center" data-testid="result-kwp">
                  <div className="text-2xl font-bold text-orange-600">{result.kwp} kWp</div>
                  <div className="text-xs text-muted-foreground">Potência do sistema</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center" data-testid="result-panels">
                  <div className="text-2xl font-bold text-blue-600">{result.panelsNeeded}</div>
                  <div className="text-xs text-muted-foreground">Módulos necessários</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center" data-testid="result-monthly-gen">
                  <div className="text-2xl font-bold text-green-600">{result.monthlyGenerationKwh.toLocaleString("pt-BR")}</div>
                  <div className="text-xs text-muted-foreground">kWh/mês estimado</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">{result.coveragePercent}%</div>
                  <div className="text-xs text-muted-foreground">Cobertura do consumo</div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Irradiação local</span>
                  <span className="font-medium">{result.irradiationUsed} kWh/m²/dia</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fase</span>
                  <Badge variant="outline" className="text-xs">{result.phase}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Geração anual</span>
                  <span className="font-medium">{result.annualGenerationKwh.toLocaleString("pt-BR")} kWh</span>
                </div>
              </div>
              {(result.suggestedPanel || result.suggestedInverter) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Equipamentos sugeridos</p>
                    {result.suggestedPanel && (
                      <div className="flex items-start gap-2 text-sm" data-testid="result-panel">
                        <Zap className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-medium">{result.suggestedPanel.brand} {result.suggestedPanel.model}</div>
                          <div className="text-muted-foreground text-xs">{result.suggestedPanel.powerW}Wp por módulo</div>
                        </div>
                      </div>
                    )}
                    {result.suggestedInverter && (
                      <div className="flex items-start gap-2 text-sm" data-testid="result-inverter">
                        <Battery className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-medium">{result.suggestedInverter.brand} {result.suggestedInverter.model}</div>
                          <div className="text-muted-foreground text-xs">{result.suggestedInverter.powerKw} kW</div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
