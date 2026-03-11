import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, ChevronRight, ChevronLeft, Check } from "lucide-react";
import type { Announcement } from "@shared/schema";

export function AnnouncementPopup() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const { data: unread = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements/unread"],
    queryFn: () => apiRequest("GET", "/api/announcements/unread").then(r => r.json()),
    staleTime: 60000,
  });

  useEffect(() => {
    if (unread.length > 0) {
      setIndex(0);
      setOpen(true);
    }
  }, [unread.length]);

  const markReadMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/announcements/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/announcements/unread"] }),
  });

  const current = unread[index];

  const handleNext = () => {
    if (current) markReadMut.mutate(current.id);
    if (index < unread.length - 1) {
      setIndex(i => i + 1);
    } else {
      setOpen(false);
    }
  };

  const handleClose = () => {
    unread.forEach(a => markReadMut.mutate(a.id));
    setOpen(false);
  };

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md" data-testid="dialog-announcement">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Informativo</span>
                {unread.length > 1 && (
                  <Badge className="text-[9px] font-black bg-primary/10 text-primary border-0">
                    {index + 1} / {unread.length}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base font-black leading-tight mt-0.5">
                {current.title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {current.content}
          </p>
          {current.createdAt && (
            <p className="text-[11px] text-muted-foreground/40 mt-4">
              {new Date(current.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {index > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setIndex(i => i - 1)} className="rounded-xl">
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
          ) : (
            <div />
          )}

          <Button
            onClick={handleNext}
            className="rounded-xl ml-auto"
            data-testid="button-announcement-ok"
          >
            {index < unread.length - 1 ? (
              <>Próximo <ChevronRight className="h-4 w-4 ml-1" /></>
            ) : (
              <><Check className="h-4 w-4 mr-1" /> Entendido</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
