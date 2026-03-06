import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, Search, Pencil, Trash2, KeyRound, Users, Mail, Phone,
  User, ShieldCheck, Eye, EyeOff, UserPlus, MapPin, Building2, FileText,
  Wrench, DollarSign
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import type { User as UserType } from "@shared/schema";
import { formatCpfCnpj, formatPhone, formatCep, lookupCep as lookupCepUtil } from "@/lib/utils";
import { PasswordStrength } from "@/components/password-strength";

type SafeUser = Omit<UserType, "password">;

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  engenharia: "Engenharia",
  financeiro: "Financeiro",
  integrador: "Integrador",
};

function EditUserDialog({ open, onClose, user }: { open: boolean; onClose: () => void; user: SafeUser }) {
  const { toast } = useToast();
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: user.name, username: user.username, email: user.email || "", phone: user.phone || "",
      cpfCnpj: user.cpfCnpj || "", clientType: (user as any).clientType || "PJ", company: user.company || "",
      rua: (user as any).rua || "", numero: (user as any).numero || "", bairro: (user as any).bairro || "",
      cep: (user as any).cep || "", cidade: (user as any).cidade || "", estado: (user as any).estado || "",
      role: user.role || "integrador",
    },
  });

  const lookupCnpj = async (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
      if (!res.ok) return;
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
    } catch { toast({ title: "CNPJ não encontrado", variant: "destructive" }); }
    finally { setCnpjLoading(false); }
  };

  const updateMut = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/users/${user.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário atualizado com sucesso!" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Editar Usuário
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => updateMut.mutate(d))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome Completo *</Label>
              <Input {...register("name", { required: "Obrigatório" })} data-testid="input-edit-name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Usuário (login) *</Label>
              <Input {...register("username", { required: "Obrigatório" })} data-testid="input-edit-username" />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>E-mail *</Label>
              <Input type="email" {...register("email", { required: "Obrigatório" })} data-testid="input-edit-email" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input {...register("phone")} placeholder="(11) 99999-9999" data-testid="input-edit-phone"
                onChange={e => setValue("phone", formatPhone(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de Pessoa</Label>
              <Controller
                name="clientType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger data-testid="select-edit-clienttype">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
                      <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Função (Role)</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger data-testid="select-edit-role">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="integrador">Integrador</SelectItem>
                      <SelectItem value="engenharia">Engenharia</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{watch("clientType") === "PJ" ? "CNPJ" : "CPF"}</Label>
              <div className="flex gap-2">
                <Input {...register("cpfCnpj")} placeholder={watch("clientType") === "PJ" ? "00.000.000/0001-00" : "000.000.000-00"} data-testid="input-edit-cpfcnpj"
                  onChange={e => setValue("cpfCnpj", formatCpfCnpj(e.target.value))} />
                {watch("clientType") === "PJ" && (
                  <Button type="button" size="sm" variant="outline" disabled={cnpjLoading} onClick={() => lookupCnpj(watch("cpfCnpj"))} data-testid="button-edit-lookup-cnpj">
                    {cnpjLoading ? "..." : "Buscar"}
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Empresa / Razão Social</Label>
              <Input {...register("company")} placeholder="Razão Social" data-testid="input-edit-company" />
            </div>
          </div>
          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Endereço</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Rua</Label>
              <Input {...register("rua")} placeholder="Nome da rua" data-testid="input-edit-rua" />
            </div>
            <div className="space-y-1.5">
              <Label>Número</Label>
              <Input {...register("numero")} placeholder="123" data-testid="input-edit-numero" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bairro</Label>
              <Input {...register("bairro")} placeholder="Bairro" data-testid="input-edit-bairro" />
            </div>
            <div className="space-y-1.5">
              <Label>CEP</Label>
              <Input {...register("cep")} placeholder="00000-000" data-testid="input-edit-cep" maxLength={9}
                onChange={async e => {
                  const fmt = formatCep(e.target.value);
                  setValue("cep", fmt);
                  const data = await lookupCepUtil(fmt);
                  if (data) {
                    if (data.logradouro) setValue("rua", data.logradouro);
                    if (data.bairro) setValue("bairro", data.bairro);
                    if (data.localidade) setValue("cidade", data.localidade);
                    if (data.uf) setValue("estado", data.uf);
                  }
                }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input {...register("cidade")} placeholder="Cidade" data-testid="input-edit-cidade" />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Input {...register("estado")} placeholder="SP" data-testid="input-edit-estado" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={updateMut.isPending} data-testid="button-save-user">
              {updateMut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ open, onClose, user }: { open: boolean; onClose: () => void; user: SafeUser }) {
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const resetMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/users/${user.id}/reset-password`, { newPassword: data.newPassword }),
    onSuccess: () => {
      toast({ title: "Senha alterada com sucesso!" });
      reset();
      onClose();
    },
    onError: (e: any) => toast({ title: "Erro ao alterar senha", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Redefinir Senha
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Definindo nova senha para <strong>{user.name}</strong></p>
        <form onSubmit={handleSubmit(d => resetMut.mutate(d))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nova Senha *</Label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                {...register("newPassword", { required: "Obrigatório", minLength: { value: 6, message: "Mínimo 6 caracteres" } })}
                className="pr-10"
                data-testid="input-new-password"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar Senha *</Label>
            <Input
              type={showPass ? "text" : "password"}
              {...register("confirmPassword", {
                required: "Obrigatório",
                validate: v => v === watch("newPassword") || "As senhas não coincidem",
              })}
              data-testid="input-confirm-password"
            />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
            <Button type="submit" disabled={resetMut.isPending} data-testid="button-reset-password">
              {resetMut.isPending ? "Salvando..." : "Alterar Senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({ open, onClose, defaultRole = "integrador" }: { open: boolean; onClose: () => void; defaultRole?: string }) {
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: "", username: "", email: "", phone: "", password: "", role: defaultRole,
      clientType: "PJ", cpfCnpj: "", company: "",
      cep: "", rua: "", numero: "", bairro: "", cidade: "", estado: "",
    },
  });
  const selectedRole = watch("role");
  const watchClientType = watch("clientType");

  const isStaff = ["engenharia", "financeiro", "admin"].includes(selectedRole);
  const isIntegrador = selectedRole === "integrador";
  const isPJ = watchClientType === "PJ";

  const lookupCnpj = async (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
      if (!res.ok) return;
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
    } catch { toast({ title: "CNPJ não encontrado", variant: "destructive" }); }
    finally { setCnpjLoading(false); }
  };

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/auth/register", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário criado com sucesso!" });
      reset();
      onClose();
    },
    onError: (e: any) => toast({ title: "Erro ao criar usuário", description: e.message, variant: "destructive" }),
  });

  const dialogTitle = isStaff ? "Novo Funcionário" : "Novo Integrador";

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="space-y-4 py-2">
          {/* Role selector */}
          <div className="space-y-1.5">
            <Label>Tipo de Acesso *</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger data-testid="select-new-role">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="integrador">Integrador (acesso ao portal)</SelectItem>
                    <SelectItem value="engenharia">Engenharia (acesso ao painel admin)</SelectItem>
                    <SelectItem value="financeiro">Financeiro (acesso ao painel admin)</SelectItem>
                    <SelectItem value="admin">Admin (acesso total)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Integrador-specific: PF/PJ + CNPJ */}
          {isIntegrador && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados do Integrador</p>
              <div className="space-y-1.5">
                <Label>Tipo de Pessoa *</Label>
                <Controller
                  name="clientType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="select-new-client-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
                        <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{isPJ ? "CNPJ *" : "CPF"}</Label>
                  <div className="flex gap-2">
                    <Input
                      {...register("cpfCnpj")}
                      placeholder={isPJ ? "00.000.000/0000-00" : "000.000.000-00"}
                      data-testid="input-new-cpfcnpj"
                      onChange={e => setValue("cpfCnpj", formatCpfCnpj(e.target.value))}
                    />
                    {isPJ && (
                      <Button
                        type="button" size="sm" variant="outline"
                        disabled={cnpjLoading}
                        onClick={() => lookupCnpj(watch("cpfCnpj"))}
                        data-testid="button-lookup-cnpj"
                      >
                        {cnpjLoading ? "..." : "Buscar"}
                      </Button>
                    )}
                  </div>
                  {isPJ && <p className="text-xs text-muted-foreground">Digite o CNPJ e clique Buscar para preencher automaticamente</p>}
                </div>
                {isPJ && (
                  <div className="space-y-1.5">
                    <Label>Nome Fantasia</Label>
                    <Input {...register("company")} placeholder="Nome Fantasia" data-testid="input-new-company" />
                  </div>
                )}
              </div>
              {/* Address section */}
              <div className="grid grid-cols-6 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <Label>CEP</Label>
                  <Input
                    {...register("cep")}
                    placeholder="00000-000"
                    data-testid="input-new-cep"
                    maxLength={9}
                    onChange={async e => {
                      const fmt = formatCep(e.target.value);
                      setValue("cep", fmt);
                      const data = await lookupCepUtil(fmt);
                      if (data) {
                        if (data.logradouro) setValue("rua", data.logradouro);
                        if (data.bairro) setValue("bairro", data.bairro);
                        if (data.localidade) setValue("cidade", data.localidade);
                        if (data.uf) setValue("estado", data.uf);
                      }
                    }}
                  />
                </div>
                <div className="col-span-4 space-y-1.5">
                  <Label>Rua / Logradouro</Label>
                  <Input {...register("rua")} placeholder="Rua das Flores" data-testid="input-new-rua" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Número</Label>
                  <Input {...register("numero")} placeholder="123" data-testid="input-new-numero" />
                </div>
                <div className="col-span-4 space-y-1.5">
                  <Label>Bairro</Label>
                  <Input {...register("bairro")} placeholder="Centro" data-testid="input-new-bairro" />
                </div>
                <div className="col-span-4 space-y-1.5">
                  <Label>Cidade</Label>
                  <Input {...register("cidade")} placeholder="São Paulo" data-testid="input-new-cidade" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>UF</Label>
                  <Input {...register("estado")} placeholder="SP" maxLength={2} data-testid="input-new-estado" style={{ textTransform: "uppercase" }} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome Completo *</Label>
              <Input {...register("name", { required: "Obrigatório" })} data-testid="input-new-name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Usuário (login) *</Label>
              <Input {...register("username", { required: "Obrigatório" })} data-testid="input-new-username" />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>E-mail *</Label>
              <Input type="email" {...register("email", { required: "Obrigatório" })} data-testid="input-new-email" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input {...register("phone")} placeholder="(11) 99999-9999" data-testid="input-new-phone"
                onChange={e => setValue("phone", formatPhone(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Senha *</Label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                {...register("password", { required: "Obrigatório", minLength: { value: 6, message: "Mínimo 6 caracteres" } })}
                className="pr-10"
                data-testid="input-new-password-create"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength password={watch("password") || ""} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
            <Button type="submit" disabled={createMut.isPending} data-testid="button-create-user">
              {createMut.isPending ? "Criando..." : `Criar ${isStaff ? "Funcionário" : "Integrador"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({ open, onClose, user }: { open: boolean; onClose: () => void; user: SafeUser }) {
  const { toast } = useToast();
  const deleteMut = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/users/${user.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Usuário removido" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" /> Remover Usuário
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja remover <strong>{user.name}</strong>? Esta ação não pode ser desfeita.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate()} data-testid="button-confirm-delete-user">
            {deleteMut.isPending ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<SafeUser | null>(null);
  const [resetUser, setResetUser] = useState<SafeUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<SafeUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
  });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const admins = filtered.filter(u => u.role === "admin");
  const engenharia = filtered.filter(u => u.role === "engenharia");
  const financeiro = filtered.filter(u => u.role === "financeiro");
  const integradores = filtered.filter(u => u.role === "integrador");

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Gestão de Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie integradores e funcionários da equipe</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="button-novo-usuario">
          <UserPlus className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome, usuário ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-users"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Admins */}
          {admins.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                <ShieldCheck className="h-3.5 w-3.5" /> Administradores ({admins.length})
              </h2>
              <div className="space-y-2">
                {admins.map(u => (
                  <UserRow key={u.id} user={u} currentUserId={currentUser?.id}
                    onEdit={() => setEditUser(u)} onReset={() => setResetUser(u)} onDelete={() => setDeleteUser(u)} />
                ))}
              </div>
            </div>
          )}

          {/* Equipe Técnica */}
          {engenharia.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                <Wrench className="h-3.5 w-3.5" /> Equipe de Engenharia ({engenharia.length})
              </h2>
              <div className="space-y-2">
                {engenharia.map(u => (
                  <UserRow key={u.id} user={u} currentUserId={currentUser?.id}
                    onEdit={() => setEditUser(u)} onReset={() => setResetUser(u)} onDelete={() => setDeleteUser(u)} />
                ))}
              </div>
            </div>
          )}

          {/* Equipe Financeira */}
          {financeiro.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                <DollarSign className="h-3.5 w-3.5" /> Equipe Financeira ({financeiro.length})
              </h2>
              <div className="space-y-2">
                {financeiro.map(u => (
                  <UserRow key={u.id} user={u} currentUserId={currentUser?.id}
                    onEdit={() => setEditUser(u)} onReset={() => setResetUser(u)} onDelete={() => setDeleteUser(u)} />
                ))}
              </div>
            </div>
          )}

          {/* Integradores */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
              <User className="h-3.5 w-3.5" /> Integradores ({integradores.length})
            </h2>
            {integradores.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum integrador encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {integradores.map(u => (
                  <UserRow key={u.id} user={u} currentUserId={currentUser?.id}
                    onEdit={() => setEditUser(u)} onReset={() => setResetUser(u)} onDelete={() => setDeleteUser(u)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      {editUser && <EditUserDialog open={!!editUser} onClose={() => setEditUser(null)} user={editUser} />}
      {resetUser && <ResetPasswordDialog open={!!resetUser} onClose={() => setResetUser(null)} user={resetUser} />}
      {deleteUser && <DeleteUserDialog open={!!deleteUser} onClose={() => setDeleteUser(null)} user={deleteUser} />}
      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function UserRow({
  user, currentUserId, onEdit, onReset, onDelete,
}: {
  user: SafeUser;
  currentUserId?: string;
  onEdit: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const isYou = user.id === currentUserId;
  return (
    <Card data-testid={`card-user-${user.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold" data-testid={`text-username-${user.id}`}>{user.name}</p>
              <Badge variant="outline" className="text-xs py-0">
                {ROLE_LABELS[user.role] || user.role}
              </Badge>
              {isYou && <Badge className="text-xs py-0 bg-primary/20 text-primary hover:bg-primary/20">Você</Badge>}
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono">@{user.username}</span>
              {user.email && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {user.email}
                </span>
              )}
              {user.phone && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {user.phone}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              {user.cpfCnpj && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" /> {user.clientType === "PJ" ? "CNPJ" : "CPF"}: {user.cpfCnpj}
                </span>
              )}
              {user.company && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {user.company}
                </span>
              )}
            </div>
            {(user.rua || user.cidade || user.estado || user.address) && (
              <div className="flex items-start gap-1 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {user.rua ? (
                    <>
                      {user.rua}{user.numero ? `, ${user.numero}` : ""}
                      {user.bairro ? ` - ${user.bairro}` : ""}
                      {user.cep ? ` · CEP: ${user.cep}` : ""}
                      {user.cidade || user.estado ? ` · ${[user.cidade, user.estado].filter(Boolean).join("/")}` : ""}
                    </>
                  ) : user.address}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={onEdit} data-testid={`button-edit-user-${user.id}`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
            </Button>
            <Button size="sm" variant="outline" onClick={onReset} data-testid={`button-reset-password-${user.id}`}>
              <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Senha
            </Button>
            {!isYou && (
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete} data-testid={`button-delete-user-${user.id}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
