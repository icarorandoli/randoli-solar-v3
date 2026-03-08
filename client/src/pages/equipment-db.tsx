import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Database, Plus, Pencil, Trash2, Zap, Battery, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Panel { id: string; brand: string; model: string; powerW: number; efficiencyPct: string; voltageVoc: string | null; active: boolean; }
interface Inverter { id: string; brand: string; model: string; powerKw: string; phases: number; mpptCount: number; active: boolean; }

const panelSchema = z.object({
  brand: z.string().min(1), model: z.string().min(1),
  powerW: z.coerce.number().min(1), efficiencyPct: z.coerce.number().min(1).max(100),
  voltageVoc: z.coerce.number().optional(),
});
const inverterSchema = z.object({
  brand: z.string().min(1), model: z.string().min(1),
  powerKw: z.coerce.number().min(0.1), phases: z.coerce.number().min(1).max(3),
  mpptCount: z.coerce.number().min(1),
  minMpptVoltage: z.coerce.number().optional(), maxMpptVoltage: z.coerce.number().optional(),
});

function PanelForm({ initial, onSave, onCancel }: { initial?: Partial<Panel>; onSave: (d: any) => void; onCancel: () => void }) {
  const form = useForm({ resolver: zodResolver(panelSchema), defaultValues: { brand: initial?.brand ?? "", model: initial?.model ?? "", powerW: initial?.powerW ?? 540, efficiencyPct: initial?.efficiencyPct ? parseFloat(initial.efficiencyPct) : 20.5, voltageVoc: initial?.voltageVoc ? parseFloat(initial.voltageVoc) : undefined } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="powerW" render={({ field }) => (<FormItem><FormLabel>Potência (Wp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="efficiencyPct" render={({ field }) => (<FormItem><FormLabel>Eficiência (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="voltageVoc" render={({ field }) => (<FormItem><FormLabel>Voc (V)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function InverterForm({ initial, onSave, onCancel }: { initial?: Partial<Inverter>; onSave: (d: any) => void; onCancel: () => void }) {
  const form = useForm({ resolver: zodResolver(inverterSchema), defaultValues: { brand: initial?.brand ?? "", model: initial?.model ?? "", powerKw: initial?.powerKw ? parseFloat(initial.powerKw) : 5, phases: initial?.phases ?? 1, mpptCount: initial?.mpptCount ?? 2 } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="powerKw" render={({ field }) => (<FormItem><FormLabel>Potência (kW)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="phases" render={({ field }) => (
            <FormItem><FormLabel>Fases</FormLabel>
              <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="1">Monofásico</SelectItem>
                  <SelectItem value="2">Bifásico</SelectItem>
                  <SelectItem value="3">Trifásico</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="mpptCount" render={({ field }) => (<FormItem><FormLabel>Qtd MPPT</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function EquipmentDb() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [panelDialog, setPanelDialog] = useState<{ open: boolean; item?: Panel }>({ open: false });
  const [inverterDialog, setInverterDialog] = useState<{ open: boolean; item?: Inverter }>({ open: false });

  const { data, isLoading } = useQuery<{ panels: Panel[]; inverters: Inverter[] }>({ queryKey: ["/api/ai/equipment"] });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["/api/ai/equipment"] });

  const savePanel = useMutation({ mutationFn: (d: any) => panelDialog.item ? apiRequest("PATCH", `/api/ai/panels/${panelDialog.item!.id}`, d) : apiRequest("POST", "/api/ai/panels", d), onSuccess: () => { invalidate(); setPanelDialog({ open: false }); toast({ title: "Painel salvo" }); } });
  const delPanel = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/ai/panels/${id}`), onSuccess: () => { invalidate(); toast({ title: "Painel removido" }); } });
  const saveInv = useMutation({ mutationFn: (d: any) => inverterDialog.item ? apiRequest("PATCH", `/api/ai/inverters/${inverterDialog.item!.id}`, d) : apiRequest("POST", "/api/ai/inverters", d), onSuccess: () => { invalidate(); setInverterDialog({ open: false }); toast({ title: "Inversor salvo" }); } });
  const delInv = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/ai/inverters/${id}`), onSuccess: () => { invalidate(); toast({ title: "Inversor removido" }); } });

  const panels = (data?.panels ?? []).filter(p => !search || `${p.brand} ${p.model}`.toLowerCase().includes(search.toLowerCase()));
  const inverters = (data?.inverters ?? []).filter(i => !search || `${i.brand} ${i.model}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Banco de Equipamentos</h1>
            <p className="text-sm text-muted-foreground">Módulos fotovoltaicos e inversores cadastrados</p>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar equipamento..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-equipment-search" />
        </div>
      </div>

      <Tabs defaultValue="panels">
        <TabsList>
          <TabsTrigger value="panels" data-testid="tab-panels"><Zap className="w-4 h-4 mr-1" />Módulos ({panels.length})</TabsTrigger>
          <TabsTrigger value="inverters" data-testid="tab-inverters"><Battery className="w-4 h-4 mr-1" />Inversores ({inverters.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="panels" className="mt-4">
          <div className="flex justify-end mb-3">
            {isAdmin && <Button size="sm" onClick={() => setPanelDialog({ open: true })} data-testid="button-add-panel"><Plus className="w-4 h-4 mr-1" />Adicionar Módulo</Button>}
          </div>
          {isLoading ? <p className="text-center text-muted-foreground py-8">Carregando...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {panels.map(p => (
                <Card key={p.id} data-testid={`card-panel-${p.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm">{p.brand}</div>
                        <div className="text-xs text-muted-foreground">{p.model}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">{p.powerW}Wp</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-3">
                      <span>Eficiência: <strong className="text-foreground">{p.efficiencyPct}%</strong></span>
                      {p.voltageVoc && <span>Voc: <strong className="text-foreground">{p.voltageVoc}V</strong></span>}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 justify-end">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPanelDialog({ open: true, item: p })}><Pencil className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => delPanel.mutate(p.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inverters" className="mt-4">
          <div className="flex justify-end mb-3">
            {isAdmin && <Button size="sm" onClick={() => setInverterDialog({ open: true })} data-testid="button-add-inverter"><Plus className="w-4 h-4 mr-1" />Adicionar Inversor</Button>}
          </div>
          {isLoading ? <p className="text-center text-muted-foreground py-8">Carregando...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inverters.map(i => (
                <Card key={i.id} data-testid={`card-inverter-${i.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm">{i.brand}</div>
                        <div className="text-xs text-muted-foreground">{i.model}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">{i.powerKw} kW</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-3">
                      <span>Fases: <strong className="text-foreground">{i.phases === 1 ? "Mono" : i.phases === 2 ? "Bi" : "Tri"}</strong></span>
                      <span>MPPT: <strong className="text-foreground">{i.mpptCount}</strong></span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 justify-end">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setInverterDialog({ open: true, item: i })}><Pencil className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => delInv.mutate(i.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={panelDialog.open} onOpenChange={(o) => setPanelDialog({ open: o })}>
        <DialogContent><DialogHeader><DialogTitle>{panelDialog.item ? "Editar" : "Novo"} Módulo</DialogTitle></DialogHeader>
          <PanelForm initial={panelDialog.item} onSave={(d) => savePanel.mutate(d)} onCancel={() => setPanelDialog({ open: false })} />
        </DialogContent>
      </Dialog>

      <Dialog open={inverterDialog.open} onOpenChange={(o) => setInverterDialog({ open: o })}>
        <DialogContent><DialogHeader><DialogTitle>{inverterDialog.item ? "Editar" : "Novo"} Inversor</DialogTitle></DialogHeader>
          <InverterForm initial={inverterDialog.item} onSave={(d) => saveInv.mutate(d)} onCancel={() => setInverterDialog({ open: false })} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
