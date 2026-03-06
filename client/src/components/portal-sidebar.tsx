import { useLocation, Link } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, FolderOpen, Plus, User, LogOut, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const navItems = [
  { title: "Meus Projetos", url: "/portal", icon: LayoutDashboard },
  { title: "Novo Projeto", url: "/portal/novo-projeto", icon: Plus },
  { title: "Minha Conta", url: "/portal/conta", icon: User },
];

export function PortalSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

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
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive} data-testid={`link-portal-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
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
        <div className="flex items-center gap-2 px-1">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium truncate">{user?.name}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.clientType}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={logout} data-testid="button-logout">
          <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
