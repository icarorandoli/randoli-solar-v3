import { useQuery } from "@tanstack/react-query";
import { Receipt, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotasFiscaisPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/portal/minhas-notas"],
    queryFn: async () => {
      const res = await fetch("/api/portal/minhas-notas", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const notas = Array.isArray(data) ? data.filter((n: any) => n.status === "emitida") : [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Receipt className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Notas Fiscais</h1>
          <p className="text-sm text-muted-foreground">Notas fiscais emitidas para seus projetos</p>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Carregando...</p>}
      {error && <p className="text-red-500 text-sm">Erro ao carregar notas fiscais.</p>}

      {!isLoading && notas.length === 0 && (
        <div className="border rounded-xl p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma nota fiscal emitida ainda.</p>
        </div>
      )}

      <div className="space-y-3">
        {notas.map((nota: any) => (
          <div key={nota.id} className="border rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">
                NFS-e {nota.numeroNota ? `nº ${nota.numeroNota}` : "Emitida"}
              </p>
              {nota.projeto && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {nota.projeto.ticketNumber ? `${nota.projeto.ticketNumber} — ` : ""}{nota.projeto.title}
                </p>
              )}
              {nota.valor && (
                <p className="text-xs font-semibold text-emerald-600 mt-1">
                  R$ {parseFloat(nota.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <div>
              <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5" onClick={() => window.open(`/api/portal/nfse/${nota.id}/pdf`, "_blank")}>
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
