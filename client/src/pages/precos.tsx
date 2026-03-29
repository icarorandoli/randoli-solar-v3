import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, Pencil, Trash2, Zap, Users, Calendar, Info, ShieldCheck } from "lucide-react";
import type { PricingRange, Client } from "@shared/schema";

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface RangeFormData {
  label: string; minKwp: string; maxKwp: string;
  price: string; sortOrder: string; active: boolean; tableType: string;
}

function RangeDialog({ open, onClose, range, defaultTableType = "standard" }: {
  open: boolean; onClose: () => void; range?: PricingRange; defaultTableType?: string;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<RangeFormData>(range ? {
    label: range.label, minKwp: String(range.minKwp), maxKwp: String(range.maxKwp),
    price: String(range.price), sortOrder: String(range.sortOrder), active: range.active,
    tableType: (range as any).tableType || (range as any).table_type || defaultTableType,
  } : { label: "", minKwp: "", maxKwp: "", price: "", sortOrder: "0", active: true, tableType: defaultTableType });

  const set = (k: keyof RangeFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const saveMut = useMutation({
    mutationFn: (data: any) => range
      ? apiRequest("PATCH", `/api/pricing-ranges/${range.id}`, data)
      : apiRequest("POST", "/api/pricing-ranges", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-ranges"] });
      toast({ title: range ? "Faixa atualizada!" : "Faixa criada!" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMut.mutate({
      label: form.label, minKwp: parseFloat(form.minKwp), maxKwp: parseFloat(form.maxKwp),
      price: parseFloat(form.price), sortOrder: parseInt(form.sortOrder),
      active: form.active, tableType: form.tableType,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{range ? "Editar Faixa" : "Nova Faixa de Preço"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Tabela</Label>
            <Select value={form.tableType} onValueChange={v => setForm(p => ({ ...p, tableType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">🆕 Tabela Novos Clientes</SelectItem>
                <SelectItem value="legacy">👥 Tabela Clientes Antigos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Input value={form.label} onChange={set("label")} placeholder="Ex: 1 a 10 kWp" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>kWp Mínimo *</Label>
              <Input type="number" step="0.01" value={form.minKwp} onChange={set("minKwp")} required />
            </div>
            <div className="space-y-1.5">
              <Label>kWp Máximo *</Label>
              <Input type="number" step="0.01" value={form.maxKwp} onChange={set("maxKwp")} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Preço (R$) *</Label>
              <Input type="number" step="0.01" value={form.price} onChange={set("price")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input type="number" value={form.sortOrder} onChange={set("sortOrder")} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} id="active-switch" />
            <Label htmlFor="active-switch">Faixa ativa</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saveMut.isPending}>
              {saveMut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ClientPricingRecord = {
  id: string; clientId: string; rangeId?: string | null;
  price: string; description: string | null; active: boolean;
  clientName: string; rangeLabel?: string;
};

function ClientPricingSection({ ranges }: { ranges: PricingRange[] }) {
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [rangeId, setRangeId] = useState("__all__");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const { data: allCp = [], isLoading } = useQuery<ClientPricingRecord[]>({ queryKey: ["/api/client-pricing"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const addMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/client-pricing", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-pricing"] });
      toast({ title: "Preço promocional definido!" });
      setClientId(""); setRangeId("__all__"); setPrice(""); setDescription("");
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/client-pricing/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-pricing"] });
      toast({ title: "Preço removido" });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-1"><Users className="h-4 w-4" /> Preços Promocionais por Cliente</h2>
        <p className="text-xs text-muted-foreground">Defina preços especiais individuais que substituem qualquer tabela.</p>
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cliente *</Label>
              <select value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Selecione...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Faixa de Potência</Label>
              <Select value={rangeId} onValueChange={setRangeId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Todas as faixas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as faixas</SelectItem>
                  {ranges.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Preço (R$) *</Label>
              <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observação</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Parceiro Premium" />
            </div>
          </div>
          <Button size="sm" disabled={!clientId || !price || addMut.isPending} onClick={() => addMut.mutate({
            clientId, rangeId: rangeId === "__all__" ? null : rangeId,
            price: parseFloat(price), description: description || null,
          })}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {addMut.isPending ? "Salvando..." : "Definir Preço Promocional"}
          </Button>
        </CardContent>
      </Card>
      {isLoading ? <Skeleton className="h-16 w-full" /> : allCp.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Nenhum preço promocional configurado.</p>
      ) : (
        <div className="space-y-2">
          {allCp.map(cp => (
            <Card key={cp.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{cp.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(cp.price)}
                    {cp.rangeLabel ? ` · ${cp.rangeLabel}` : " · Todas as faixas"}
                    {cp.description ? ` · ${cp.description}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={cp.active ? "default" : "secondary"} className="text-xs">{cp.active ? "Ativo" : "Inativo"}</Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteMut.mutate(cp.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PricingTable({ title, tableType, color, icon, ranges, onEdit, onDelete, onToggle, onCreate }: {
  title: string; tableType: string; color: string; icon: React.ReactNode;
  ranges: PricingRange[]; onEdit: (r: PricingRange) => void;
  onDelete: (id: string) => void; onToggle: (id: string, active: boolean) => void;
  onCreate: () => void;
}) {
  const filtered = ranges.filter((r: any) => (r.tableType || r.table_type || "legacy") === tableType);
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon}
            {title}
            <Badge className={`text-[10px] ${color} border-none ml-1`}>{filtered.length} faixas</Badge>
          </CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={onCreate}>
            <Plus className="h-3 w-3" /> Nova Faixa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-center py-6 text-muted-foreground">Nenhuma faixa cadastrada nesta tabela.</p>
        ) : (
          <div className="space-y-2">
            {filtered.sort((a, b) => a.sortOrder - b.sortOrder).map(range => (
              <div key={range.id} className={`flex items-center justify-between gap-4 p-3 rounded-lg border ${range.active ? "border-border" : "border-border/40 opacity-60"}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Switch checked={range.active} onCheckedChange={v => onToggle(range.id, v)} />
                  <div>
                    <p className="text-sm font-medium">{range.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(range.minKwp).toLocaleString("pt-BR")} — {Number(range.maxKwp).toLocaleString("pt-BR")} kWp
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-base font-bold text-primary">{formatPrice(range.price)}</p>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onEdit(range)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => { if (confirm("Remover esta faixa?")) onDelete(range.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PrecosPage() {
  const { toast } = useToast();
  const [editRange, setEditRange] = useState<PricingRange | null>(null);
  const [createTableType, setCreateTableType] = useState<string | null>(null);

  const { data: ranges = [], isLoading } = useQuery<PricingRange[]>({ queryKey: ["/api/pricing-ranges"] });
  const { data: cutoffData } = useQuery<{ cutoffDate: string | null }>({
    queryKey: ["/api/pricing-ranges/cutoff"],
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pricing-ranges/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pricing-ranges"] }); toast({ title: "Faixa removida" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => apiRequest("PATCH", `/api/pricing-ranges/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/pricing-ranges"] }),
  });

  const setCutoffMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pricing-ranges/set-cutoff", { date: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-ranges/cutoff"] });
      toast({ title: "✅ Data de corte definida!", description: "Integradores cadastrados a partir de agora usarão a tabela de novos clientes." });
    },
  });

  const cutoffDate = cutoffData?.cutoffDate ? new Date(cutoffData.cutoffDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Gestão de Preços
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure faixas de potência por tabela de cliente</p>
        </div>
      </div>

      {/* Cutoff date banner */}
      <Card className="border-amber-200/60 bg-amber-50/50 dark:bg-amber-900/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Data de Corte das Tabelas</p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  {cutoffDate
                    ? <>Integradores cadastrados <strong>antes de {cutoffDate}</strong> usam a tabela de clientes antigos. Os demais usam a tabela de novos clientes.</>
                    : "Nenhuma data de corte definida. Clique em 'Definir Agora' para ativar as duas tabelas."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-400 text-amber-800 hover:bg-amber-100 shrink-0"
              onClick={() => {
                if (confirm("Definir AGORA como data de corte? Integradores já cadastrados usarão a tabela antiga. Novos cadastros usarão a nova tabela.")) {
                  setCutoffMut.mutate();
                }
              }}
              disabled={setCutoffMut.isPending}
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {cutoffDate ? "Redefinir Data de Corte" : "Definir Agora"}
            </Button>
          </div>
          {cutoffDate && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-700/70 dark:text-amber-400/70">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Para que um cliente antigo passe a usar a nova tabela, remova-o dos clientes antigos ou use um preço promocional individual.
            </div>
          )}
        </CardContent>
      </Card>

      {/* New clients table */}
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <PricingTable
          title="Tabela — Novos Clientes"
          tableType="standard"
          color="bg-emerald-100 text-emerald-700"
          icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
          ranges={ranges}
          onEdit={setEditRange}
          onDelete={id => deleteMut.mutate(id)}
          onToggle={(id, active) => toggleMut.mutate({ id, active })}
          onCreate={() => setCreateTableType("standard")}
        />
      )}

      {/* Legacy clients table */}
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <PricingTable
          title="Tabela — Clientes Antigos"
          tableType="legacy"
          color="bg-blue-100 text-blue-700"
          icon={<Users className="h-4 w-4 text-blue-600" />}
          ranges={ranges}
          onEdit={setEditRange}
          onDelete={id => deleteMut.mutate(id)}
          onToggle={(id, active) => toggleMut.mutate({ id, active })}
          onCreate={() => setCreateTableType("legacy")}
        />
      )}

      {/* Client Pricing */}
      <ClientPricingSection ranges={ranges} />

      {/* Dialogs */}
      {createTableType && (
        <RangeDialog open={!!createTableType} onClose={() => setCreateTableType(null)} defaultTableType={createTableType} />
      )}
      {editRange && (
        <RangeDialog open={!!editRange} onClose={() => setEditRange(null)} range={editRange} />
      )}
    </div>
  );
}
