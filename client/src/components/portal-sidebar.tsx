import { useLocation, Link } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Plus, User, LogOut, Zap, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Meus Projetos", url: "/portal", icon: LayoutDashboard },
  { title: "Novo Projeto", url: "/portal/novo-projeto", icon: Plus },
  { title: "Minha Conta", url: "/portal/conta", icon: User },
];

const CLIENT_TYPE_LABELS: Record<string, string> = {
  pf: "Pessoa Física",
  pj: "Pessoa Jurídica",
};

function NavSection({
  items,
  location,
  unreadCount,
  label,
}: {
  items: { title: string; url: string; icon: any }[];
  location: string;
  unreadCount: number;
  label: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => {
            const isActive = location === item.url;
            const showBadge = item.url === "/portal" && unreadCount > 0;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  data-active={isActive}
                  data-testid={`link-portal-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                  className={cn(
                    "group transition-all duration-200 h-9",
                    isActive 
                      ? "bg-primary/10 text-primary font-semibold border-l-[3px] border-primary rounded-none" 
                      : "hover:bg-primary/5 text-sidebar-foreground/70 hover:text-primary"
                  )}
                >
                  <Link href={item.url} className="flex items-center w-full px-3">
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-primary"
                    )} />
                    <span className="ml-3 flex-1">{item.title}</span>
                    {showBadge && (
                      <Badge 
                        className="ml-auto h-5 min-w-5 flex items-center justify-center rounded-full p-0 text-[10px] bg-primary text-primary-foreground animate-pulse border-none"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                    {isActive && <ChevronRight className="ml-auto h-3 w-3 text-primary/50" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function UserFooter({ user, logout }: { user: any; logout: () => void }) {
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 px-1 py-2">
        <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-sidebar-border">
          <AvatarImage src={user?.avatarUrl} />
          <AvatarFallback className={cn("text-white font-bold text-xs", getAvatarColor(user?.name))}>
            {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-bold truncate leading-tight text-sidebar-foreground">{user?.name}</span>
          <div className="flex items-center mt-1">
            <Badge className="text-[9px] px-2 py-0 h-4 font-bold uppercase tracking-wider bg-primary/10 text-primary border-none">
              {clientType}
            </Badge>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group"
        onClick={logout}
        data-testid="button-logout"
      >
        <LogOut className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-0.5" /> 
        <span className="font-semibold">Sair do Portal</span>
      </Button>
    </div>
  );
}

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
    <Sidebar className="border-r border-sidebar-border bg-sidebar shadow-xl">
      <SidebarHeader className="px-6 py-10">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="relative">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-12 w-12 object-contain rounded-xl shadow-md transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <Zap className="h-7 w-7 text-primary-foreground fill-current" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-sidebar animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-bold text-sidebar-foreground tracking-tight truncate leading-tight">
              {companyName}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">Portal Integrador</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <NavSection
          items={navItems}
          location={location}
          unreadCount={unreadCount}
          label="Menu Principal"
        />
      </SidebarContent>

      <SidebarFooter className="p-6 bg-sidebar-accent/30 border-t border-sidebar-border mt-auto">
        <UserFooter user={user} logout={logout} />
      </SidebarFooter>
    </Sidebar>
  );
}
