import { useLocation, Link } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Plus, User, LogOut, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const navItems = [
  { title: "Meus Projetos", url: "/portal", icon: LayoutDashboard },
  { title: "Novo Projeto", url: "/portal/novo-projeto", icon: Plus },
  { title: "Minha Conta", url: "/portal/conta", icon: User },
];

function UserAvatar({ name }: { name?: string }) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map(n => n[0])
        .join("")
        .toUpperCase()
    : "?";
  return (
    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-primary-foreground">{initials}</span>
    </div>
  );
}

const CLIENT_TYPE_LABELS: Record<string, string> = {
  pf: "Pessoa Física",
  pj: "Pessoa Jurídica",
};

export function PortalSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const { data: chatUnread } = useQuery<{ count: number }>({
    queryKey: ["/api/chat/unread"],
    queryFn: () => apiRequest("GET", "/api/chat/unread").then(r => r.json()),
    refetchInterval: 30000,
  });

  const unreadCount = chatUnread?.count ?? 0;
  const companyName = settings?.company_name || "Randoli Engenharia";
  const logoUrl = settings?.logo_url;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-9 w-9 object-contain rounded-md" />
          ) : (
            <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{companyName}</span>
            <span className="text-xs text-muted-foreground">Portal do Integrador</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => {
                const isActive = location === item.url;
                const showBadge = item.url === "/portal" && unreadCount > 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      data-testid={`link-portal-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {showBadge && (
                          <span className="ml-auto inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-orange-500 text-white text-[10px] font-bold px-1">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3 space-y-3">
        <div className="flex items-center gap-2.5 px-1">
          <UserAvatar name={user?.name} />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold truncate">{user?.name}</span>
            <span className="text-[11px] text-muted-foreground truncate">
              {user?.clientType ? CLIENT_TYPE_LABELS[user.clientType] ?? user.clientType : "Integrador"}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={logout} data-testid="button-logout">
          <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
