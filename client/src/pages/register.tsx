import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Zap, User, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { formatCpfCnpj, formatCep, formatPhone, lookupCep, validateCpfCnpj } from "@/lib/utils";
import { PasswordStrength } from "@/components/password-strength";

interface RegisterForm {
  name: string;
  username: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  password: string;
  confirmPassword: string;
  company: string;
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
}

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientType, setClientType] = useState<"PF" | "PJ">("PF");
  const [loading, setLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [form, setForm] = useState<RegisterForm>({
    name: "", username: "", email: "", phone: "",
    cpfCnpj: "", password: "", confirmPassword: "",
    company: "", rua: "", numero: "", bairro: "",
    cep: "", cidade: "", estado: "",
  });

  const set = (k: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleCpfCnpj = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, cpfCnpj: formatCpfCnpj(e.target.value) }));

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }));

  const lookupCnpj = async (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
      if (!res.ok) { toast({ title: "CNPJ não encontrado", variant: "destructive" }); return; }
      const data = await res.json();
      setForm(prev => ({
        ...prev,
        name: data.razao_social || prev.name,
        company: data.nome_fantasia || prev.company,
        rua: data.logradouro || prev.rua,
        numero: data.numero || prev.numero,
        bairro: data.bairro || prev.bairro,
        cidade: data.municipio || prev.cidade,
        estado: data.uf || prev.estado,
        cep: data.cep ? data.cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2") : prev.cep,
        phone: data.ddd_telefone_1 ? formatPhone(data.ddd_telefone_1) : prev.phone,
      }));
      toast({ title: "CNPJ encontrado!", description: "Dados preenchidos automaticamente." });
    } catch { toast({ title: "Erro ao buscar CNPJ", variant: "destructive" }); }
    finally { setCnpjLoading(false); }
  };

  const handleCep = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setForm(prev => ({ ...prev, cep: formatted }));
    const data = await lookupCep(formatted);
    if (data) {
      setForm(prev => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (form.cpfCnpj) {
      const cpfCnpjError = validateCpfCnpj(form.cpfCnpj);
      if (cpfCnpjError !== true) {
        toast({ title: cpfCnpjError, variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        username: form.username,
        password: form.password,
        name: clientType === "PJ" ? form.company || form.name : form.name,
        email: form.email,
        phone: form.phone,
        cpfCnpj: form.cpfCnpj,
        clientType,
        company: clientType === "PJ" ? form.company : undefined,
        rua: form.rua,
        numero: form.numero,
        bairro: form.bairro,
        cep: form.cep,
        cidade: form.cidade,
        estado: form.estado,
      });
      const user = await res.json();
      queryClient.setQueryData(["/api/auth/me"], user);
      setLocation("/portal");
    } catch (err: any) {
      toast({ title: "Erro ao criar conta", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold">Randoli Engenharia Solar</h1>
            <p className="text-sm text-muted-foreground">Crie sua conta de integrador</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Cadastro</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={clientType} onValueChange={v => setClientType(v as "PF" | "PJ")}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="PF" className="flex-1" data-testid="tab-pf">
                  <User className="h-3.5 w-3.5 mr-1.5" /> Pessoa Física
                </TabsTrigger>
                <TabsTrigger value="PJ" className="flex-1" data-testid="tab-pj">
                  <Building2 className="h-3.5 w-3.5 mr-1.5" /> Pessoa Jurídica
                </TabsTrigger>
              </TabsList>
              <form onSubmit={handleSubmit} className="space-y-3">
                {clientType === "PJ" && (
                  <div className="space-y-1.5">
                    <Label>Razão Social *</Label>
                    <Input value={form.company} onChange={set("company")} placeholder="Empresa Solar Ltda" required={clientType === "PJ"} data-testid="input-company" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>{clientType === "PF" ? "Nome Completo *" : "Nome do Responsável *"}</Label>
                  <Input value={form.name} onChange={set("name")} placeholder="Seu nome completo" required data-testid="input-name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{clientType === "PF" ? "CPF *" : "CNPJ *"}</Label>
                    <div className="flex gap-2">
                      <Input value={form.cpfCnpj} onChange={handleCpfCnpj} placeholder={clientType === "PF" ? "000.000.000-00" : "00.000.000/0001-00"} data-testid="input-cpfcnpj" />
                      {clientType === "PJ" && (
                        <Button type="button" size="sm" variant="outline" disabled={cnpjLoading} onClick={() => lookupCnpj(form.cpfCnpj)} data-testid="button-lookup-cnpj-register">
                          {cnpjLoading ? "..." : "Buscar"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={handlePhone} placeholder="(00) 00000-0000" data-testid="input-phone" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail *</Label>
                  <Input type="email" value={form.email} onChange={set("email")} placeholder="email@exemplo.com" required data-testid="input-email" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Rua</Label>
                    <Input value={form.rua} onChange={set("rua")} placeholder="Nome da rua" data-testid="input-rua" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Número</Label>
                    <Input value={form.numero} onChange={set("numero")} placeholder="123" data-testid="input-numero" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Bairro</Label>
                    <Input value={form.bairro} onChange={set("bairro")} placeholder="Bairro" data-testid="input-bairro" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CEP</Label>
                    <Input value={form.cep} onChange={handleCep} placeholder="00000-000" maxLength={9} data-testid="input-cep" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cidade</Label>
                    <Input value={form.cidade} onChange={set("cidade")} placeholder="Cidade" data-testid="input-cidade" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Estado</Label>
                    <Input value={form.estado} onChange={set("estado")} placeholder="SP" data-testid="input-estado" />
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label>Usuário *</Label>
                    <Input value={form.username} onChange={set("username")} placeholder="nome.sobrenome" required data-testid="input-username" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Senha *</Label>
                      <Input type="password" value={form.password} onChange={set("password")} placeholder="Mín. 6 caracteres" required data-testid="input-password" />
                      <PasswordStrength password={form.password} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Confirmar Senha *</Label>
                      <Input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repita a senha" required data-testid="input-confirm-password" />
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full mt-2" disabled={loading} data-testid="button-register-submit">
                  {loading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary font-medium" data-testid="link-go-login">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
