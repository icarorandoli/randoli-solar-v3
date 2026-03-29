import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { PortalSidebar } from "@/components/portal-sidebar";
import { ClienteSidebar } from "@/components/cliente-sidebar";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

import DashboardPage from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import ClientsPage from "@/pages/clients";
import PartnersPage from "@/pages/partners";
import SettingsPage from "@/pages/settings";
import UsersPage from "@/pages/users";
import KanbanPage from "@/pages/kanban";
import PrecosPage from "@/pages/precos";
import RelatoriosPage from "@/pages/relatorios";
import PlanosPage from "@/pages/planos";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import PortalHomePage from "@/pages/portal/home";
import PortalProjetoPage from "@/pages/portal/projeto";
import PortalProjetosPage from "@/pages/portal/projetos";
import NovoProjetoPage from "@/pages/portal/novo-projeto";
import ContaPage from "@/pages/portal/conta";
import PortalInformativosPage from "@/pages/portal/informativos";
import ClienteHomePage from "@/pages/cliente/home";
import ClienteProjetoPage from "@/pages/cliente/projeto";
import ClienteContaPage from "@/pages/cliente/conta";
import CompletarPerfilPage from "@/pages/completar-perfil";
import NotFound from "@/pages/not-found";
import StatusConfigPage from "@/pages/status-config";
import AuditLogPage from "@/pages/audit-log";
import AnalyticsPage from "@/pages/analytics";
import AiCalculatorPage from "@/pages/ai-calculator";
import EquipmentDbPage from "@/pages/equipment-db";
import ProductionSimulatorPage from "@/pages/production-simulator";
import EngineeringReportPage from "@/pages/engineering-report";
import InformativosPage from "@/pages/informativos";
import NfsePage from "@/pages/nfse";
import PendenciasPage from "@/pages/pendencias";
import FinanceiroVisaoGeralPage from "@/pages/financeiro-visao-geral";
import FinanceiroDREPage from "@/pages/financeiro-dre";
import FinanceiroFluxoCaixaPage from "@/pages/financeiro-fluxo";
import AssinaturasPage from "@/pages/assinaturas";
import AssinarPage from "@/pages/assinar";
import VerificarPage from "@/pages/verificar";
import PortalAssinaturasPage from "@/pages/portal-assinaturas";
import { NotificationBell } from "@/components/notification-bell";
import { GlobalSearch } from "@/components/global-search";
import { AnnouncementPopup } from "@/components/announcement-popup";
import { AiAssistant } from "@/components/ai-assistant";

import type { ReactNode } from "react";

function FaviconUpdater() {
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  useEffect(() => {
    const url = settings?.favicon_url;
    if (!url) return;
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (link) link.href = url;
    const apple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (apple) apple.href = url;
  }, [settings?.favicon_url]);
  return null;
}

function RoleGuard({ allow, children }: { allow: string[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) return <Redirect to="/" />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-3 w-64">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      data-testid="button-theme-toggle"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function AdminLayout() {
  return (
    <SidebarProvider style={{ "--sidebar-width": "17rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AdminSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            <GlobalSearch />
            <span className="text-xs text-muted-foreground font-medium hidden sm:block">Portal Admin</span>
            <NotificationBell />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/projetos" component={ProjectsPage} />
              <Route path="/kanban" component={KanbanPage} />
              <Route path="/clientes" component={ClientsPage} />
              <Route path="/precos">
                <RoleGuard allow={["admin", "financeiro"]}><PrecosPage /></RoleGuard>
              </Route>
              <Route path="/relatorios">
                <RoleGuard allow={["admin", "financeiro"]}><RelatoriosPage /></RoleGuard>
              </Route>
              <Route path="/parceiros">
                <RoleGuard allow={["admin", "financeiro"]}><PartnersPage /></RoleGuard>
              </Route>
              <Route path="/usuarios">
                <RoleGuard allow={["admin"]}><UsersPage /></RoleGuard>
              </Route>
              <Route path="/configuracoes">
                <RoleGuard allow={["admin", "financeiro"]}><SettingsPage /></RoleGuard>
              </Route>
              <Route path="/status-config">
                <RoleGuard allow={["admin"]}><StatusConfigPage /></RoleGuard>
              </Route>
              <Route path="/audit-log">
                <RoleGuard allow={["admin"]}><AuditLogPage /></RoleGuard>
              </Route>
              <Route path="/analytics">
                <RoleGuard allow={["admin", "financeiro", "engenharia"]}><AnalyticsPage /></RoleGuard>
              </Route>
              <Route path="/ai-calculator">
                <RoleGuard allow={["admin", "engenharia"]}><AiCalculatorPage /></RoleGuard>
              </Route>
              <Route path="/equipment-db">
                <RoleGuard allow={["admin", "engenharia"]}><EquipmentDbPage /></RoleGuard>
              </Route>
              <Route path="/production-simulator">
                <RoleGuard allow={["admin", "engenharia"]}><ProductionSimulatorPage /></RoleGuard>
              </Route>
              <Route path="/engineering-report">
                <RoleGuard allow={["admin", "engenharia"]}><EngineeringReportPage /></RoleGuard>
              </Route>
              <Route path="/informativos">
                <RoleGuard allow={["admin"]}><InformativosPage /></RoleGuard>
              </Route>
              <Route path="/nfse">
                <RoleGuard allow={["admin", "financeiro"]}><NfsePage /></RoleGuard>
              </Route>
              <Route path="/pendencias">
                <RoleGuard allow={["admin", "engenharia", "financeiro"]}><PendenciasPage /></RoleGuard>
              </Route>
              <Route path="/financeiro">
                <RoleGuard allow={["admin", "financeiro"]}><FinanceiroVisaoGeralPage /></RoleGuard>
              </Route>
              <Route path="/financeiro/dre">
                <RoleGuard allow={["admin", "financeiro"]}><FinanceiroDREPage /></RoleGuard>
              </Route>
              <Route path="/assinaturas">
                <RoleGuard allow={["admin", "engenharia", "financeiro"]}><AssinaturasPage /></RoleGuard>
              </Route>
              <Route path="/financeiro/fluxo-caixa">
                <RoleGuard allow={["admin", "financeiro"]}><FinanceiroFluxoCaixaPage /></RoleGuard>
              </Route>
              <Route><Redirect to="/" /></Route>
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PortalLayout() {
  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <PortalSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger data-testid="button-portal-sidebar-toggle" />
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground font-medium hidden sm:block">Portal do Integrador</span>
            <NotificationBell />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/portal/novo-projeto" component={NovoProjetoPage} />
              <Route path="/portal/projetos/:id" component={PortalProjetoPage} />
              <Route path="/portal/projetos" component={PortalProjetosPage} />
              <Route path="/portal/conta" component={ContaPage} />
              <Route path="/portal/informativos" component={PortalInformativosPage} />
              <Route path="/portal/assinaturas" component={PortalAssinaturasPage} />
              <Route path="/pendencias" component={PendenciasPage} />
              <Route path="/portal" component={PortalHomePage} />
              <Route><Redirect to="/portal" /></Route>
            </Switch>
          </main>
        </div>
        <AnnouncementPopup />
      </div>
    </SidebarProvider>
  );
}

function ClienteLayout() {
  return (
    <SidebarProvider style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <ClienteSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger data-testid="button-cliente-sidebar-toggle" />
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground font-medium hidden sm:block">Área do Cliente</span>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/cliente" component={ClienteHomePage} />
              <Route path="/cliente/projeto/:id" component={ClienteProjetoPage} />
              <Route path="/cliente/conta" component={ClienteContaPage} />
              <Route><Redirect to="/cliente" /></Route>
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Public signing page - MUST be before isLoading check - no auth required ever
  if (location.startsWith("/assinar/")) {
    return <AssinarPage />;
  }
  if (location.startsWith("/verificar/")) {
    return <VerificarPage />;
  }

  if (isLoading) return <LoadingScreen />;

  const publicPaths = ["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha", "/planos"];
  const isPublicPath = publicPaths.some(p => location === p || location.startsWith(p + "?"));

  if (location === "/planos") {
    return <PlanosPage />;
  }

  if (location === "/completar-perfil") {
    if (!user) return <Redirect to="/login" />;
    return <CompletarPerfilPage />;
  }

  if (isPublicPath) {
    if (user) {
      if (user.needsProfileCompletion) return <Redirect to="/completar-perfil" />;
      const isAdminRole = ["admin", "engenharia", "financeiro", "tecnico"].includes(user.role);
      if (user.role === "cliente") return <Redirect to="/cliente" />;
      return <Redirect to={isAdminRole ? "/" : "/portal"} />;
    }
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/cadastro" component={RegisterPage} />
        <Route path="/esqueci-senha" component={ForgotPasswordPage} />
        <Route path="/redefinir-senha" component={ResetPasswordPage} />
      </Switch>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.needsProfileCompletion) {
    return <Redirect to="/completar-perfil" />;
  }

  const isAdminRole = ["admin", "engenharia", "financeiro", "tecnico"].includes(user.role);

  if (isAdminRole) {
    if (location.startsWith("/portal") || (location.startsWith("/cliente") && !location.startsWith("/clientes"))) {
      return <Redirect to="/" />;
    }
    return <AdminLayout />;
  }

  if (user.role === "cliente") {
    if (!location.startsWith("/cliente")) {
      return <Redirect to="/cliente" />;
    }
    return <ClienteLayout />;
  }

  // Allow /pendencias for integrador without portal prefix
  const portalAllowed = location.startsWith("/portal") || location === "/pendencias" || location.startsWith("/assinaturas");
  if (!portalAllowed) {
    return <Redirect to="/portal" />;
  }
  return <PortalLayout />;
}

function ConditionalAiAssistant() {
  const { user } = useAuth();
  if (!user || !["admin", "engenharia"].includes(user.role)) return null;
  return <AiAssistant />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <FaviconUpdater />
          <AppRoutes />
          <ConditionalAiAssistant />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
