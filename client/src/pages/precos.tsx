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
import { DollarSign, Plus, Pencil, Trash2, Zap, Users } from "lucide-react";
import type { PricingRange, Client } from "@shared/schema";

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface RangeFormData {
  label: string;
  minKwp: string;
  maxKwp: string;
  price: string;
  sortOrder: string;
  active: boolean;
}

const EMPTY_RANGE: RangeFormData = { label: "", minKwp: "", maxKwp: "", price: "", sortOrder: "0", active: true };

function RangeDialog({
  open, onClose, range,
}: { open: boolean; onClose: () => void; range?: PricingRange }) {
  const { toast } = useToast();
  const [form, setForm] = useState<RangeFormData>(range ? {
    label: range.label, minKwp: String(range.minKwp), maxKwp: String(range.maxKwp),
    price: String(range.price), sortOrder: String(range.sortOrder), active: range.active,
  } : EMPTY_RANGE);

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
      label: form.label,
      minKwp: parseFloat(form.minKwp),
      maxKwp: parseFloat(form.maxKwp),
      price: parseFloat(form.price),
      sortOrder: parseInt(form.sortOrder),
      active: form.active,
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
            <Label>Descrição *</Label>
            <Input value={form.label} onChange={set("label")} placeholder="Ex: 1 a 10 kWp" required data-testid="input-range-label" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>kWp Mínimo *</Label>
              <Input type="number" step="0.01" value={form.minKwp} onChange={set("minKwp")} placeholder="1" required data-testid="input-range-min" />
            </div>
            <div className="space-y-1.5">
              <Label>kWp Máximo *</Label>
              <Input type="number" step="0.01" value={form.maxKwp} onChange={set("maxKwp")} placeholder="10" required data-testid="input-range-max" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Preço (R$) *</Label>
              <Input type="number" step="0.01" value={form.price} onChange={set("price")} placeholder="250" required data-testid="input-range-price" />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input type="number" value={form.sortOrder} onChange={set("sortOrder")} placeholder="0" data-testid="input-range-order" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} id="active-switch" />
            <Label htmlFor="active-switch">Faixa ativa</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saveMut.isPending} data-testid="button-save-range">
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

function ClientPricingSection() {
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [rangeId, setRangeId] = useState("__all__");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const { data: allCp = [], isLoading } = useQuery<ClientPricingRecord[]>({ queryKey: ["/api/client-pricing"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: ranges = [] } = useQuery<PricingRange[]>({ queryKey: ["/api/pricing-ranges"] });

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
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleAdd = () => {
    addMut.mutate({
      clientId,
      rangeId: rangeId === "__all__" ? null : rangeId,
      price: parseFloat(price),
      description: description || null,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-1"><Users className="h-4 w-4" /> Preços Promocionais por Cliente</h2>
        <p className="text-xs text-muted-foreground">Defina preços especiais por cliente e por faixa de potência. Se configurado, substitui o preço padrão.</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cliente *</Label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                data-testid="select-promo-client"
              >
                <option value="">Selecione...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Faixa de Potência</Label>
              <Select value={rangeId} onValueChange={setRangeId}>
                <SelectTrigger className="h-9" data-testid="select-promo-range">
                  <SelectValue placeholder="Todas as faixas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as faixas</SelectItem>
                  {ranges.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Preço (R$) *</Label>
              <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="200" data-testid="input-promo-price" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observação</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Parceiro Premium" data-testid="input-promo-desc" />
            </div>
          </div>
          <Button
            size="sm"
            disabled={!clientId || !price || addMut.isPending}
            onClick={handleAdd}
            data-testid="button-add-promo"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {addMut.isPending ? "Salvando..." : "Definir Preço Promocional"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : allCp.length === 0 ? (
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
                  <Button
                    size="icon" variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteMut.mutate(cp.id)}
                    data-testid={`button-delete-promo-${cp.id}`}
                  >
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

export default function PrecosPage() {
  const { toast } = useToast();
  const [editRange, setEditRange] = useState<PricingRange | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: ranges = [], isLoading } = useQuery<PricingRange[]>({ queryKey: ["/api/pricing-ranges"] });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pricing-ranges/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-ranges"] });
      toast({ title: "Faixa removida" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiRequest("PATCH", `/api/pricing-ranges/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/pricing-ranges"] }),
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Gestão de Preços
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure faixas de potência e preços promocionais</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="button-new-range">
          <Plus className="h-4 w-4 mr-2" /> Nova Faixa
        </Button>
      </div>

      {/* Pricing Ranges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Tabela de Faixas de Potência
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : ranges.length === 0 ? (
            <p className="text-sm text-center py-6 text-muted-foreground">Nenhuma faixa cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {ranges.map(range => (
                <div key={range.id} data-testid={`row-range-${range.id}`}
                  className={`flex items-center justify-between gap-4 p-3 rounded-lg border ${range.active ? "border-border" : "border-border/40 opacity-60"}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Switch
                      checked={range.active}
                      onCheckedChange={v => toggleMut.mutate({ id: range.id, active: v })}
                      data-testid={`switch-range-${range.id}`}
                    />
                    <div>
                      <p className="text-sm font-medium">{range.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(range.minKwp).toLocaleString("pt-BR")} — {Number(range.maxKwp).toLocaleString("pt-BR")} kWp
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-base font-bold text-primary">{formatPrice(range.price)}</p>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditRange(range)} data-testid={`button-edit-range-${range.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => {
                      if (confirm("Remover esta faixa?")) deleteMut.mutate(range.id);
                    }} data-testid={`button-delete-range-${range.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Pricing */}
      <ClientPricingSection />

      {/* Dialogs */}
      {createOpen && <RangeDialog open={createOpen} onClose={() => setCreateOpen(false)} />}
      {editRange && <RangeDialog open={!!editRange} onClose={() => setEditRange(null)} range={editRange} />}
    </div>
  );
}
