import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TermAcceptanceModalProps {
  open: boolean;
  projectId: string;
  onAccepted: () => void;
  onClose: () => void;
}

export function TermAcceptanceModal({ open, projectId, onAccepted, onClose }: TermAcceptanceModalProps) {
  const [checked, setChecked] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ term: any; alreadyAccepted: boolean }>({
    queryKey: ["/api/projects", projectId, "term"],
    queryFn: () => apiRequest("GET", `/api/projects/${projectId}/term`).then(r => r.json()),
    enabled: open && !!projectId,
  });

  // Reset scroll state when modal opens/data loads
  useEffect(() => {
    if (open) {
      setChecked(false);
      setScrolledToBottom(false);
    }
  }, [open]);

  // Check if content is short enough to not need scrolling
  useEffect(() => {
    if (!data?.term || !scrollRef.current) return;
    const el = scrollRef.current;
    // Small timeout to let content render
    const t = setTimeout(() => {
      if (el.scrollHeight <= el.clientHeight + 10) {
        setScrolledToBottom(true);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [data?.term]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) setScrolledToBottom(true);
  };

  const acceptMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/projects/${projectId}/term/accept`, {}),
    onSuccess: () => {
      toast({ title: "Termo aceito com sucesso!" });
      onAccepted();
    },
    onError: (err: any) => toast({ title: "Erro ao registrar aceite", description: err.message, variant: "destructive" }),
  });

  const checkboxLabel = "Declaro que li integralmente e aceito os termos de prestação de serviços técnicos vinculados a este projeto, reconhecendo a cobrança do serviço e a forma de pagamento via PIX.";

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/60 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-black">
            <FileText className="h-5 w-5 text-primary" />
            {data?.term?.title || "Termo de Prestação de Serviços"}
          </DialogTitle>
          {data?.term && (
            <p className="text-xs text-muted-foreground">Versão {data.term.version} — Leia o termo completamente antes de aceitar</p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data?.term ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="h-10 w-10 text-destructive/40" />
            <p className="text-sm text-muted-foreground">Termo não encontrado. Contate o administrador.</p>
          </div>
        ) : (
          <>
            {/* Aviso de rolagem */}
            {!scrolledToBottom && (
              <div className="mx-6 mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 shrink-0">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Role até o final do termo para habilitar o aceite
              </div>
            )}

            {/* Conteúdo do termo — scroll via ref nativa */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 mx-6 my-4 overflow-y-auto"
              style={{ minHeight: 0 }}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80 bg-muted/20 rounded-xl p-5 border border-border/40 font-mono text-xs">
                {data.term.content}
              </div>
            </div>

            {/* Checkbox e botão */}
            <div className="px-6 pb-6 space-y-4 shrink-0 border-t border-border/40 pt-4">
              <label className={`flex items-start gap-3 cursor-pointer group ${!scrolledToBottom ? "opacity-50 pointer-events-none" : ""}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => setChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  disabled={!scrolledToBottom}
                />
                <span className="text-xs text-foreground/80 leading-relaxed font-medium">
                  {checkboxLabel}
                </span>
              </label>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={acceptMut.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={!checked || !scrolledToBottom || acceptMut.isPending}
                  onClick={() => acceptMut.mutate()}
                >
                  {acceptMut.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Registrando aceite...</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4" /> Aceitar e Enviar Projeto</>
                  )}
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                Seu IP, navegador e data/hora serão registrados como evidência do aceite (Marco Civil da Internet — Lei 12.965/2014)
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
