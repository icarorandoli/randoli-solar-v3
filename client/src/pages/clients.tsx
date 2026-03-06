import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Users, Phone, Mail, Building2, User } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import type { Client, InsertClient } from "@shared/schema";
import { formatCpfCnpj, formatPhone, formatCep, lookupCep, validateCpfCnpj } from "@/lib/utils";

function ClientDialog({
  open,
  onClose,
  client,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client;
}) {
  const { toast } = useToast();
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<InsertClient>({
    defaultValues: client ? {
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      cpfCnpj: client.cpfCnpj || "",
      type: client.type,
      address: client.address || "",
      rua: (client as any).rua || "",
      numero: (client as any).numero || "",
      bairro: (client as any).bairro || "",
      cep: (client as any).cep || "",
      cidade: (client as any).cidade || "",
      estado: (client as any).estado || "",
    } : {
      name: "", email: "", phone: "", cpfCnpj: "", type: "PF", address: "",
      rua: "", numero: "", bairro: "", cep: "", cidade: "", estado: "",
    },
  });

  const clientType = watch("type");

  const lookupCnpj = async (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
      if (!res.ok) { toast({ title: "CNPJ não encontrado", variant: "destructive" }); return; }
      const data = await res.json();
      if (data.razao_social) setValue("name", data.razao_social);
      if (data.logradouro) setValue("rua", data.logradouro);
      if (data.numero) setValue("numero", data.numero);
      if (data.bairro) setValue("bairro", data.bairro);
      if (data.municipio) setValue("cidade", data.municipio);
      if (data.uf) setValue("estado", data.uf);
      if (data.cep) setValue("cep", data.cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2"));
      if (data.ddd_telefone_1) setValue("phone", formatPhone(data.ddd_telefone_1));
      toast({ title: "CNPJ encontrado!", description: "Dados preenchidos automaticamente." });
    } catch { toast({ title: "Erro ao buscar CNPJ", variant: "destructive" }); }
    finally { setCnpjLoading(false); }
  };

  const createMut = useMutation({
    mutationFn: (data: InsertClient) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Cliente criado com sucesso!" });
      onClose();
      reset();
    },
    onError: () => toast({ title: "Erro ao criar cliente", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<InsertClient>) => apiRequest("PATCH", `/api/clients/${client?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Cliente atualizado!" });
      onClose();
    },
    onError: () => toast({ title: "Erro ao atualizar cliente", variant: "destructive" }),
  });

  const onSubmit = (data: InsertClient) => {
    const cpfCnpjResult = data.cpfCnpj ? validateCpfCnpj(data.cpfCnpj) : true;
    if (cpfCnpjResult !== true) {
      toast({ title: cpfCnpjResult, variant: "destructive" });
      return;
    }
    if (client) updateMut.mutate(data);
    else createMut.mutate(data);
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Nome Completo / Razão Social *</Label>
              <Input id="name" {...register("name", { required: true })} placeholder="Nome do cliente" data-testid="input-client-name" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger data-testid="select-client-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
              <div className="flex gap-2">
                <Input id="cpfCnpj" {...register("cpfCnpj")} placeholder={clientType === "PJ" ? "00.000.000/0001-00" : "000.000.000-00"} data-testid="input-client-cpfcnpj"
                  onChange={e => setValue("cpfCnpj", formatCpfCnpj(e.target.value))} />
                {clientType === "PJ" && (
                  <Button type="button" size="sm" variant="outline" disabled={cnpjLoading} onClick={() => lookupCnpj(watch("cpfCnpj") || "")}>
                    {cnpjLoading ? "..." : "Buscar"}
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" {...register("email", { required: true })} placeholder="email@exemplo.com" data-testid="input-client-email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} placeholder="(00) 00000-0000" data-testid="input-client-phone"
                onChange={e => setValue("phone", formatPhone(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2 p-3 rounded-lg bg-muted/40 border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Endereço</p>
            <div className="grid grid-cols-6 gap-2">
              <div className="col-span-2 space-y-1.5">
                <Label>CEP</Label>
                <Input {...register("cep")} placeholder="00000-000" maxLength={9} data-testid="input-client-cep"
                  onChange={async e => {
                    const fmt = formatCep(e.target.value);
                    setValue("cep", fmt);
                    const data = await lookupCep(fmt);
                    if (data) {
                      if (data.logradouro) setValue("rua", data.logradouro);
                      if (data.bairro) setValue("bairro", data.bairro);
                      if (data.localidade) setValue("cidade", data.localidade);
                      if (data.uf) setValue("estado", data.uf);
                    }
                  }} />
              </div>
              <div className="col-span-4 space-y-1.5">
                <Label>Rua / Logradouro</Label>
                <Input {...register("rua")} placeholder="Rua das Flores" data-testid="input-client-rua" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Número</Label>
                <Input {...register("numero")} placeholder="123" data-testid="input-client-numero" />
              </div>
              <div className="col-span-4 space-y-1.5">
                <Label>Bairro</Label>
                <Input {...register("bairro")} placeholder="Centro" data-testid="input-client-bairro" />
              </div>
              <div className="col-span-4 space-y-1.5">
                <Label>Cidade</Label>
                <Input {...register("cidade")} placeholder="São Paulo" data-testid="input-client-cidade" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>UF</Label>
                <Input {...register("estado")} placeholder="SP" maxLength={2} style={{ textTransform: "uppercase" }} data-testid="input-client-estado" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-client">
              {isPending ? "Salvando..." : client ? "Atualizar" : "Criar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | undefined>();
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Cliente excluído!" });
    },
    onError: () => toast({ title: "Erro ao excluir cliente", variant: "destructive" }),
  });

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerenciar cadastros de clientes</p>
        </div>
        <Button onClick={() => { setEditClient(undefined); setDialogOpen(true); }} data-testid="button-new-client">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-clients"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users className="h-14 w-14 mb-3 opacity-30" />
          <p className="font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm mt-1">Adicione clientes para gerenciar projetos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(client => (
            <Card key={client.id} className="hover-elevate" data-testid={`card-client-${client.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {client.type === "PJ" ? (
                      <Building2 className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{client.name}</p>
                      <Badge variant="outline" className="text-xs">{client.type}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {client.email}
                      </span>
                      {client.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {client.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => { setEditClient(client); setDialogOpen(true); }}
                      data-testid={`button-edit-client-${client.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => deleteMut.mutate(client.id)}
                      disabled={deleteMut.isPending}
                      data-testid={`button-delete-client-${client.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientDialog open={dialogOpen} onClose={() => setDialogOpen(false)} client={editClient} />
    </div>
  );
}
