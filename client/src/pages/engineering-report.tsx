import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Share2, Loader2, Download, Cpu, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Project { id: string; ticketNumber: string | null; title: string; status: string; }
interface MemorialResult { text: string; html: string; title: string; }
interface UnifilarResult { svg: string; description: string; }
interface SmartResult {
  dimensioning: {
    kwp: number; panelsNeeded: number; monthlyGenerationKwh: number;
    annualGenerationKwh: number; irradiationUsed: number; phase: string; coveragePercent: number;
    suggestedPanel: { brand: string; model: string; powerW: number } | null;
    suggestedInverter: { brand: string; model: string; powerKw: string } | null;
  };
  memorial: MemorialResult;
  unifilar: UnifilarResult;
}

export default function EngineeringReport() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [report, setReport] = useState<SmartResult | null>(null);

  const { data: projects, isLoading: loadingProjects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const generate = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/smart-create", { projectId: selectedProject }).then(r => r.json()),
    onSuccess: (d) => { setReport(d); toast({ title: "Relatório gerado com sucesso!" }); },
    onError: () => toast({ title: "Erro ao gerar relatório", variant: "destructive" }),
  });

  const downloadMemorial = () => {
    if (!report) return;
    const blob = new Blob([report.memorial.text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `memorial-${selectedProject}.txt`;
    a.click();
  };

  const downloadUnifilar = () => {
    if (!report) return;
    const blob = new Blob([report.unifilar.svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `unifilar-${selectedProject}.svg`;
    a.click();
  };

  const activeProjects = projects?.filter(p => !["arquivado", "cancelado"].includes(p.status)) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <FileText className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório de Engenharia</h1>
          <p className="text-sm text-muted-foreground">Gere memorial descritivo e diagrama unifilar automaticamente</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Selecionar Projeto</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Select onValueChange={setSelectedProject} value={selectedProject}>
            <SelectTrigger className="flex-1" data-testid="select-project">
              <SelectValue placeholder={loadingProjects ? "Carregando..." : "Selecione um projeto..."} />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.ticketNumber ? `[${p.ticketNumber}] ` : ""}{p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => generate.mutate()} disabled={!selectedProject || generate.isPending} className="bg-purple-600 hover:bg-purple-700" data-testid="button-generate-report">
            {generate.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><Cpu className="w-4 h-4 mr-2" />Gerar Relatório</>}
          </Button>
        </CardContent>
      </Card>

      {report && (
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="memorial" data-testid="tab-memorial">Memorial Descritivo</TabsTrigger>
            <TabsTrigger value="unifilar" data-testid="tab-unifilar">Diagrama Unifilar</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xl font-bold text-orange-600" data-testid="report-kwp">{report.dimensioning.kwp} kWp</div>
                  <div className="text-xs text-muted-foreground">Potência</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xl font-bold text-blue-600">{report.dimensioning.panelsNeeded}</div>
                  <div className="text-xs text-muted-foreground">Módulos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xl font-bold text-green-600">{report.dimensioning.monthlyGenerationKwh.toLocaleString("pt-BR")}</div>
                  <div className="text-xs text-muted-foreground">kWh/mês</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xl font-bold text-purple-600">{report.dimensioning.coveragePercent}%</div>
                  <div className="text-xs text-muted-foreground">Cobertura</div>
                </CardContent>
              </Card>
            </div>
            {(report.dimensioning.suggestedPanel || report.dimensioning.suggestedInverter) && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Equipamentos Sugeridos</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {report.dimensioning.suggestedPanel && (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm"><strong>Módulo:</strong> {report.dimensioning.suggestedPanel.brand} {report.dimensioning.suggestedPanel.model} — {report.dimensioning.suggestedPanel.powerW}Wp</span>
                    </div>
                  )}
                  {report.dimensioning.suggestedInverter && (
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-500" />
                      <span className="text-sm"><strong>Inversor:</strong> {report.dimensioning.suggestedInverter.brand} {report.dimensioning.suggestedInverter.model} — {report.dimensioning.suggestedInverter.powerKw}kW</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Share2 className="w-4 h-4 text-gray-400" />
                    <span>Fase: <Badge variant="outline">{report.dimensioning.phase}</Badge></span>
                    <span className="text-muted-foreground">· Irradiação: {report.dimensioning.irradiationUsed} kWh/m²/dia</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="memorial" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Memorial Descritivo</CardTitle>
                <Button size="sm" variant="outline" onClick={downloadMemorial}>
                  <Download className="w-4 h-4 mr-1" />Baixar .txt
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-xs font-mono bg-muted p-4 rounded-lg overflow-auto max-h-[500px]" data-testid="memorial-text">
                  {report.memorial.text}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unifilar" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Diagrama Unifilar</CardTitle>
                <Button size="sm" variant="outline" onClick={downloadUnifilar}>
                  <Download className="w-4 h-4 mr-1" />Baixar SVG
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{report.unifilar.description}</p>
                <div
                  data-testid="unifilar-diagram"
                  className="border rounded-lg p-4 bg-white dark:bg-white/5 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: report.unifilar.svg }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!report && !generate.isPending && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Selecione um projeto e clique em Gerar Relatório</p>
        </div>
      )}
    </div>
  );
}
