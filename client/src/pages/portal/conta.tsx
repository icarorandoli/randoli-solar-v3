import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Save } from "lucide-react";
import { formatPhone } from "@/lib/utils";

export default function ContaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company: user?.company || "",
    address: user?.address || "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/auth/me", data);
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/auth/me"], updated);
      toast({ title: "Perfil atualizado com sucesso!" });
    },
    onError: (err: any) => toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" }),
  });

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    updateMut.mutate(profile);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    updateMut.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">Minha Conta</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie suas informações de cadastro</p>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfile} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Usuário:</span>
              <span className="font-mono font-medium">{user?.username}</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${user?.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {user?.role === "admin" ? "Administrador" : "Integrador"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  data-testid="input-profile-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  data-testid="input-profile-email"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                  data-testid="input-profile-phone"
                />
              </div>
              {user?.clientType === "PJ" && (
                <div className="space-y-1.5">
                  <Label>Empresa</Label>
                  <Input
                    value={profile.company}
                    onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
                    data-testid="input-profile-company"
                  />
                </div>
              )}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={profile.address}
                  onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                  placeholder="Rua, número, cidade, estado"
                  data-testid="input-profile-address"
                />
              </div>
            </div>

            <Button type="submit" disabled={updateMut.isPending} data-testid="button-save-profile">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {updateMut.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Senha Atual</Label>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                data-testid="input-current-password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Mín. 6 caracteres"
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                  data-testid="input-confirm-new-password"
                />
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={updateMut.isPending} data-testid="button-change-password">
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              {updateMut.isPending ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
