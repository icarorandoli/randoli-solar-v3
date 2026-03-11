import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Check } from "lucide-react";
import type { Announcement } from "@shared/schema";

export default function PortalInformativosPage() {
  const { data: items = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: () => apiRequest("GET", "/api/announcements").then(r => r.json()),
  });

  const { data: unread = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements/unread"],
    queryFn: () => apiRequest("GET", "/api/announcements/unread").then(r => r.json()),
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/announcements/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/announcements/unread"] }),
  });

  const unreadIds = new Set(unread.map(a => a.id));

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto pb-20">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Portal</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight">Informativos</h1>
        <p className="text-muted-foreground text-sm font-medium">Comunicados e atualizações da equipe.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i} className="border-border/40 rounded-2xl animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 w-48 bg-muted rounded mb-3" />
                <div className="h-4 w-full bg-muted/50 rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted/50 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-border/40 rounded-2xl border-dashed">
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum informativo no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            const isUnread = unreadIds.has(item.id);
            return (
              <Card
                key={item.id}
                className={`border-border/40 rounded-2xl transition-colors ${isUnread ? "border-primary/40 bg-primary/5" : ""}`}
                data-testid={`card-portal-announcement-${item.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-base leading-tight">{item.title}</h3>
                        {isUnread && (
                          <Badge className="text-[9px] font-black bg-primary text-primary-foreground border-0 animate-pulse">
                            Novo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.content}</p>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-[11px] text-muted-foreground/50">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : ""}
                        </p>
                        {isUnread && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markReadMut.mutate(item.id)}
                            disabled={markReadMut.isPending}
                            className="rounded-xl h-8 text-[11px] font-bold"
                            data-testid={`button-mark-read-${item.id}`}
                          >
                            <Check className="h-3.5 w-3.5 mr-1.5" /> Marcar como lido
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
