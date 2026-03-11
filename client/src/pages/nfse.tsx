import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Check, X, Loader2, ExternalLink, Trash2, RefreshCw } from "lucide-react";
import type { NfseNota } from "@shared/schema";
import { Link } from "wouter";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  emitida: { label: "Emitida", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  erro: { label: "Erro", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  cancelada: { label: "Cancelada", className: "bg-muted text-muted-foreground border-border" },
};

export default function NfsePage() {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: notas = [], isLoading } = useQuery<NfseNota[]>({
    queryKey: ["/api/nfse/notas"],
    queryFn: () => apiRequest("GET", "/api/nfse/notas").then(r => r.json()),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/nfse/notas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nfse/notas"] });
      toast({ title: "Registro removido" });
      setDeletingId(null);
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/nfse/cancelar/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nfse/notas"] });
      toast({ title: "Nota marcada como cancelada" });
    },
    onError: () => toast({ title: "Erro ao cancelar", variant: "destructive" }),
  });

  const emitidas = notas.filter(n => n.status === "emitida").length;
  const erros = notas.filter(n => n.status === "erro").length;

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto pb-20">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Fiscal</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight">NFS-e</h1>
        <p className="text-muted-foreground text-sm font-medium">Notas fiscais de serviço emitidas pelo sistema.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-border/40 rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Total de notas</p>
            <p className="text-3xl font-black">{notas.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Emitidas</p>
            <p className="text-3xl font-black text-emerald-600">{emitidas}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Com erro</p>
            <p className="text-3xl font-black text-red-600">{erros}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-border/40 rounded-2xl animate-pulse">
              <CardContent className="p-5">
                <div className="h-5 w-48 bg-muted rounded mb-2" />
                <div className="h-4 w-32 bg-muted/50 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notas.length === 0 ? (
        <Card className="border-border/40 rounded-2xl border-dashed">
          <CardContent className="p-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma NFS-e emitida ainda.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">As notas serão emitidas automaticamente após confirmação de pagamento ou manualmente na página do projeto.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notas.map(nota => {
            const st = STATUS_MAP[nota.status] || STATUS_MAP.pendente;
            return (
              <Card key={nota.id} className="border-border/40 rounded-2xl" data-testid={`card-nfse-${nota.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${nota.status === "emitida" ? "bg-emerald-500/10" : nota.status === "erro" ? "bg-red-500/10" : "bg-muted"}`}>
                      <Receipt className={`h-5 w-5 ${nota.status === "emitida" ? "text-emerald-600" : nota.status === "erro" ? "text-red-600" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="font-bold text-sm">
                          {nota.numeroNota ? `NFS-e nº ${nota.numeroNota}` : `RPS ${nota.serieRps}/${nota.numeroRps}`}
                        </span>
                        <Badge className={`text-[10px] font-bold border ${st.className}`}>{st.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {nota.tomadorNome || "–"}
                        {nota.tomadorCpfCnpj ? ` · ${nota.tomadorCpfCnpj}` : ""}
                        {nota.valor ? ` · R$ ${nota.valor}` : ""}
                      </p>
                      {nota.codigoVerificacao && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">Código: {nota.codigoVerificacao}</p>
                      )}
                      {nota.errorMessage && (
                        <p className="text-xs text-red-600 mt-1 font-medium">{nota.errorMessage}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <p className="text-[11px] text-muted-foreground/50">
                          {nota.emitidoEm
                            ? new Date(nota.emitidoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                            : new Date(nota.createdAt!).toLocaleDateString("pt-BR")}
                        </p>
                        {nota.linkNota && (
                          <a href={nota.linkNota} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg">
                              <ExternalLink className="h-3 w-3 mr-1" /> Ver nota
                            </Button>
                          </a>
                        )}
                        {nota.status === "emitida" && (
                          <Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-lg text-orange-600" onClick={() => cancelMut.mutate(nota.id)} disabled={cancelMut.isPending} data-testid={`button-cancelar-${nota.id}`}>
                            <X className="h-3 w-3 mr-1" /> Cancelar
                          </Button>
                        )}
                        {deletingId === nota.id ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="destructive" className="h-7 text-[11px] rounded-lg" onClick={() => deleteMut.mutate(nota.id)} disabled={deleteMut.isPending}>
                              {deleteMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirmar"}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-lg" onClick={() => setDeletingId(null)}>Cancelar</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-lg text-muted-foreground" onClick={() => setDeletingId(nota.id)} data-testid={`button-delete-${nota.id}`}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
