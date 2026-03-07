import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Bell, FileText, MessageSquare, CreditCard, CheckCheck, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Notification } from "@shared/schema";

function timeAgo(date: string | Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function NotifIcon({ type }: { type: string }) {
  if (type === "document") return <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />;
  if (type === "message") return <MessageSquare className="h-4 w-4 text-violet-500 flex-shrink-0" />;
  if (type === "payment") return <CreditCard className="h-4 w-4 text-green-500 flex-shrink-0" />;
  return <Bell className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
}

function NotifBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    document: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    message: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    payment: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  };
  const label: Record<string, string> = { document: "Documento", message: "Mensagem", payment: "Pagamento" };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${map[type] ?? ""}`}>
      {label[type] ?? type}
    </span>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    refetchInterval: 30000,
  });

  const { data: notifs = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: open,
  });

  const readMut = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const readAllMut = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unread = countData?.count ?? 0;

  function handleNotifClick(notif: Notification) {
    if (!notif.readAt) readMut.mutate(notif.id);
    setOpen(false);
    if (notif.projectId) {
      navigate(`/projetos?open=${notif.projectId}`);
    }
  }

  const recentNotifs = notifs.slice(0, 20);
  const hasUnread = notifs.some(n => !n.readAt);

  return (
    <div className="relative" ref={ref} data-testid="notification-bell-container">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(v => !v)}
        className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
        data-testid="button-notification-bell"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none"
            data-testid="badge-notification-count"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-10 w-96 max-w-[calc(100vw-1rem)] bg-background border border-border rounded-xl shadow-xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Notificações</span>
              {unread > 0 && (
                <span className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unread} nova{unread !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {hasUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => readAllMut.mutate()}
                  disabled={readAllMut.isPending}
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Marcar tudo lido
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* List */}
          <ScrollArea className="max-h-[420px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                Carregando…
              </div>
            ) : recentNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">Nenhuma notificação</p>
                <p className="text-xs mt-0.5">Novas notificações aparecerão aqui</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentNotifs.map(notif => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/50 flex items-start gap-3 ${!notif.readAt ? "bg-primary/3" : ""}`}
                    data-testid={`notif-item-${notif.id}`}
                  >
                    <div className="mt-0.5">
                      <NotifIcon type={notif.type} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <NotifBadge type={notif.type} />
                        {notif.ticketNumber && (
                          <span className="text-[10px] font-mono text-primary">{notif.ticketNumber}</span>
                        )}
                        {!notif.readAt && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground">{notif.title}</p>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{notif.body}</p>
                      )}
                      {notif.projectTitle && (
                        <p className="text-[10px] text-primary/80 truncate font-medium">{notif.projectTitle}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {notif.projectId && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-1" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{notifs.length} notificações no total</span>
              {hasUnread && (
                <button
                  type="button"
                  onClick={() => readAllMut.mutate()}
                  className="text-xs text-primary hover:underline"
                  data-testid="button-mark-all-read-footer"
                >
                  Ver todas como lidas
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
