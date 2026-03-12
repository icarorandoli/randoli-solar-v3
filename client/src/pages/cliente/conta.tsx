import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Building, MapPin } from "lucide-react";

export default function ClienteContaPage() {
  const { user } = useAuth();

  const fields = [
    { label: "Nome", value: user?.name, icon: User },
    { label: "E-mail", value: user?.email, icon: Mail },
    { label: "Telefone", value: user?.phone, icon: Phone },
    { label: "CPF/CNPJ", value: user?.cpfCnpj, icon: Building },
    { label: "Empresa", value: user?.company, icon: Building },
    { label: "Cidade", value: user?.cidade, icon: MapPin },
    { label: "Estado", value: user?.estado, icon: MapPin },
  ].filter(f => f.value);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha Conta</h1>
        <p className="text-sm text-muted-foreground mt-1">Informações da sua conta</p>
      </div>

      <Card className="border shadow-none">
        <CardContent className="p-6 space-y-4">
          {fields.map((field) => (
            <div key={field.label} className="flex items-center gap-3 py-2 border-b last:border-0 border-border/40">
              <field.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                <p className="text-sm font-semibold">{field.value}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold">
              {user?.clientType === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
