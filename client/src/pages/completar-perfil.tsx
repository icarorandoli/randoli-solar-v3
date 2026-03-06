import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCpfCnpj, formatPhone, validateCpfCnpj } from "@/lib/utils";

export default function CompletarPerfilPage() {
  const { user, refetch } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"], retry: false });
  const logoUrl = settings?.logo_url;
  const companyName = settings?.company_name || "Randoli Engenharia Solar";

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      clientType: "PJ",
      cpfCnpj: "",
      company: "",
      cep: "",
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
    },
  });

  const watchClientType = watch("clientType");
  const isPJ = watchClientType === "PJ";

  const lookupCnpj = async (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
      if (!res.ok) { toast({ title: "CNPJ não encontrado", variant: "destructive" }); return; }
      const data = await res.json();
      if (data.razao_social) setValue("name", data.razao_social);
      if (data.nome_fantasia) setValue("company", data.nome_fantasia);
      if (data.logradouro) setValue("rua", data.logradouro);
      if (data.numero) setValue("numero", data.numero);
      if (data.bairro) setValue("bairro", data.bairro);
      if (data.municipio) setValue("cidade", data.municipio);
      if (data.uf) setValue("estado", data.uf);
      if (data.cep) setValue("cep", data.cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2"));
      if (data.ddd_telefone_1) setValue("phone", data.ddd_telefone_1);
      toast({ title: "CNPJ encontrado!", description: "Dados preenchidos automaticamente." });
    } catch { toast({ title: "Erro ao buscar CNPJ", variant: "destructive" }); }
    finally { setCnpjLoading(false); }
  };

  const lookupCep = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) setValue("rua", data.logradouro);
        if (data.bairro) setValue("bairro", data.bairro);
        if (data.localidade) setValue("cidade", data.localidade);
        if (data.uf) setValue("estado", data.uf);
      }
    } catch { /* ignore */ }
  };

  const onSubmit = async (data: any) => {
    if (data.cpfCnpj) {
      const result = validateCpfCnpj(data.cpfCnpj);
      if (result !== true) {
        toast({ title: result, variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    try {
      await apiRequest("POST", "/api/auth/complete-profile", data);
      await refetch();
      toast({ title: "Perfil completo!", description: "Bem-vindo ao portal!" });
      setLocation("/portal");
    } catch (err: any) {
      toast({ title: "Erro ao salvar perfil", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex flex-col items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-14 object-contain" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Zap className="h-8 w-8 text-primary-foreground" />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-xl font-bold">{companyName}</h1>
            <p className="text-sm text-muted-foreground">Complete seu perfil para continuar</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Complete seu cadastro</CardTitle>
            <CardDescription>Precisamos de mais algumas informações para ativar sua conta de integrador.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Tipo de pessoa */}
              <div className="space-y-1.5">
                <Label>Tipo de Pessoa *</Label>
                <Controller
                  name="clientType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="select-complete-clienttype">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PJ">Pessoa Jurídica (Empresa / CNPJ)</SelectItem>
                        <SelectItem value="PF">Pessoa Física (CPF)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* CNPJ / CPF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{isPJ ? "CNPJ *" : "CPF"}</Label>
                  <div className="flex gap-2">
                    <Input
                      {...register("cpfCnpj", isPJ ? { required: "CNPJ obrigatório" } : {})}
                      placeholder={isPJ ? "00.000.000/0001-00" : "000.000.000-00"}
                      data-testid="input-complete-cpfcnpj"
                      onChange={e => setValue("cpfCnpj", formatCpfCnpj(e.target.value))}
                    />
                    {isPJ && (
                      <Button
                        type="button" size="sm" variant="outline"
                        disabled={cnpjLoading}
                        onClick={() => lookupCnpj(watch("cpfCnpj"))}
                        data-testid="button-complete-lookup-cnpj"
                      >
                        {cnpjLoading ? "..." : "Buscar"}
                      </Button>
                    )}
                  </div>
                  {isPJ && <p className="text-xs text-muted-foreground">Clique Buscar para preencher dados automaticamente</p>}
                  {errors.cpfCnpj && <p className="text-xs text-destructive">{errors.cpfCnpj.message}</p>}
                </div>
                {isPJ && (
                  <div className="space-y-1.5">
                    <Label>Nome Fantasia</Label>
                    <Input {...register("company")} placeholder="Nome Fantasia" data-testid="input-complete-company" />
                  </div>
                )}
              </div>

              {/* Nome e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{isPJ ? "Razão Social *" : "Nome Completo *"}</Label>
                  <Input
                    {...register("name", { required: "Nome obrigatório" })}
                    data-testid="input-complete-name"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone *</Label>
                  <Input
                    {...register("phone", { required: "Telefone obrigatório" })}
                    placeholder="(66) 99999-9999"
                    data-testid="input-complete-phone"
                    onChange={e => setValue("phone", formatPhone(e.target.value))}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-3 p-3 rounded-lg bg-muted/40 border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Endereço</p>
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-2 space-y-1.5">
                    <Label>CEP *</Label>
                    <Input
                      {...register("cep", { required: "CEP obrigatório" })}
                      placeholder="00000-000"
                      data-testid="input-complete-cep"
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                        const fmt = val.length > 5 ? `${val.slice(0,5)}-${val.slice(5)}` : val;
                        setValue("cep", fmt);
                        lookupCep(val);
                      }}
                    />
                    {errors.cep && <p className="text-xs text-destructive">{errors.cep.message}</p>}
                  </div>
                  <div className="col-span-4 space-y-1.5">
                    <Label>Rua / Logradouro *</Label>
                    <Input {...register("rua", { required: "Rua obrigatória" })} placeholder="Rua das Flores" data-testid="input-complete-rua" />
                    {errors.rua && <p className="text-xs text-destructive">{errors.rua.message}</p>}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Número</Label>
                    <Input {...register("numero")} placeholder="123" data-testid="input-complete-numero" />
                  </div>
                  <div className="col-span-4 space-y-1.5">
                    <Label>Bairro</Label>
                    <Input {...register("bairro")} placeholder="Centro" data-testid="input-complete-bairro" />
                  </div>
                  <div className="col-span-4 space-y-1.5">
                    <Label>Cidade *</Label>
                    <Input {...register("cidade", { required: "Cidade obrigatória" })} placeholder="São Paulo" data-testid="input-complete-cidade" />
                    {errors.cidade && <p className="text-xs text-destructive">{errors.cidade.message}</p>}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>UF *</Label>
                    <Input {...register("estado", { required: "UF obrigatória" })} placeholder="SP" maxLength={2} data-testid="input-complete-estado" style={{ textTransform: "uppercase" }} />
                    {errors.estado && <p className="text-xs text-destructive">{errors.estado.message}</p>}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving} data-testid="button-complete-submit">
                {saving ? "Salvando..." : "Concluir Cadastro"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
