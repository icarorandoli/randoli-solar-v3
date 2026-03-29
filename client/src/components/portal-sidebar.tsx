import { useLocation, Link } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Plus, User, LogOut, Zap, ChevronRight, Megaphone, Receipt, AlertTriangle, FileSignature } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Meus Projetos", url: "/portal", icon: LayoutDashboard },
  { title: "Pendências", url: "/pendencias", icon: AlertTriangle },
  { title: "Assinaturas", url: "/portal/assinaturas", icon: FileSignature },
  { title: "Novo Projeto", url: "/portal/novo-projeto", icon: Plus },
  { title: "Informativos", url: "/portal/informativos", icon: Megaphone },
  { title: "Notas Fiscais", url: "/portal/notas-fiscais", icon: Receipt },
  { title: "Minha Conta", url: "/portal/conta", icon: User },
];

const CLIENT_TYPE_LABELS: Record<string, string> = {
  pf: "Pessoa Física",
  pj: "Pessoa Jurídica",
  PF: "Pessoa Física",
  PJ: "Pessoa Jurídica",
};

export function PortalSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings/public"] });
  const { data: chatUnread } = useQuery<{ count: number }>({
    queryKey: ["/api/chat/unread"],
    queryFn: () => apiRequest("GET", "/api/chat/unread").then(r => r.json()),
    refetchInterval: 30000,
  });

  const unreadCount = chatUnread?.count ?? 0;

  const { data: minhasAssinaturas } = useQuery<any[]>({
    queryKey: ["/api/minha-assinaturas"],
    queryFn: () => fetch("/api/minha-assinaturas", { credentials: "include" })
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : [])
      .catch(() => []),
    refetchInterval: 60000,
  });
  const pendingSignatures = Array.isArray(minhasAssinaturas) 
    ? minhasAssinaturas.filter((a: any) => !a.signed_at && a.doc_status !== "cancelado" && new Date(a.expires_at) > new Date()).length
    : 0;
  const companyName = settings?.company_name || "Randoli Engenharia";
  const logoUrl = settings?.logo_url;
  const clientType = user?.clientType ? CLIENT_TYPE_LABELS[user.clientType] ?? user.clientType : "Integrador";

  const getAvatarColor = (name: string = "") => {
    const colors = [
      "bg-blue-500", "bg-emerald-500", "bg-indigo-500",
      "bg-violet-500", "bg-amber-500", "bg-rose-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Sidebar className="border-r border-sidebar-border/50 bg-sidebar">
      <SidebarHeader className="px-5 py-6">
        <div className="flex items-center gap-3 group cursor-default">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 w-10 object-contain rounded-xl transition-transform group-hover:scale-105"
              data-testid="img-portal-logo"
            />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20 transition-transform group-hover:scale-105">
              <Zap className="h-5 w-5 text-primary-foreground fill-current" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight truncate leading-tight">
              {companyName}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mt-0.5">Portal Integrador</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map(item => {
                const isActive = location === item.url ||
                  (item.url === "/portal" && (location.startsWith("/portal/projetos")));
                const showBadge = (item.url === "/portal" && unreadCount > 0) || (item.url === "/portal/assinaturas" && pendingSignatures > 0);
                const badgeCount = item.url === "/portal" ? unreadCount : pendingSignatures;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-active={isActive}
                      data-testid={`link-portal-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                      className={cn(
                        "transition-all duration-150 h-9 rounded-lg",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-muted/60 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      )}
                    >
                      <Link href={item.url} className="flex items-center w-full px-3">
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-sidebar-foreground/40"
                        )} />
                        <span className="ml-3 flex-1 text-[13px]">{item.title}</span>
                        {showBadge && (
                          <Badge
                            className="ml-auto h-5 min-w-5 flex items-center justify-center rounded-full p-0 text-[10px] bg-primary text-primary-foreground border-none"
                          >
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </Badge>
                        )}
                        {isActive && <ChevronRight className="ml-auto h-3 w-3 text-primary/40" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50 mt-auto">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-1 py-1.5">
            <Avatar className="h-9 w-9 border border-sidebar-border/50 shadow-sm">
              <AvatarImage src={(user as any)?.avatarUrl} />
              <AvatarFallback className={cn("text-white font-bold text-[11px]", getAvatarColor(user?.name))}>
                {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-semibold truncate leading-tight text-sidebar-foreground">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">{clientType}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground/70 hover:text-destructive hover:bg-destructive/8 transition-all duration-150 h-8 text-xs"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sair do Portal
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
