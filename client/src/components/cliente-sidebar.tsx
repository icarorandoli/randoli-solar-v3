import { useLocation, Link } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, User, LogOut, Zap, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Meus Projetos", url: "/cliente", icon: LayoutDashboard },
  { title: "Minha Conta", url: "/cliente/conta", icon: User },
];

export function ClienteSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings/public"] });

  const companyName = settings?.company_name || "Randoli Engenharia";
  const logoUrl = settings?.logo_url;

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="px-6 py-8">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded-lg" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground fill-current" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-sidebar-foreground truncate leading-tight">
              {companyName}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              Área do Cliente
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => {
                const isActive = location === item.url || (item.url === "/cliente" && location.startsWith("/cliente/projeto"));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "transition-all duration-200 h-9",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-primary/5 text-sidebar-foreground/70 hover:text-primary"
                      )}
                    >
                      <Link href={item.url} className="flex items-center w-full px-3">
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-primary" : "text-sidebar-foreground/40"
                        )} />
                        <span className="ml-3 flex-1">{item.title}</span>
                        {isActive && <ChevronRight className="ml-auto h-3 w-3 text-primary/50" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-sidebar-border mt-auto">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-sidebar-border">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold truncate">{user?.name}</span>
              <Badge className="text-[9px] px-1.5 py-0 h-4 font-medium bg-muted text-muted-foreground border-none w-fit">
                Cliente
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
            data-testid="button-cliente-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="font-medium">Sair</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
