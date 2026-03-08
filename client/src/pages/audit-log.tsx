import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Search, FileText, Activity, CreditCard, User, ChevronDown, ChevronRight } from "lucide-react";
import type { AuditLog } from "@shared/schema";

const ACTION_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  "project.create": { label: "Projeto criado", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", icon: <FileText className="h-3.5 w-3.5" /> },
  "project.status_change": { label: "Status alterado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", icon: <Activity className="h-3.5 w-3.5" /> },
  "document.upload": { label: "Documento enviado", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", icon: <FileText className="h-3.5 w-3.5" /> },
  "payment.approved": { label: "Pagamento aprovado", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: <CreditCard className="h-3.5 w-3.5" /> },
  "user.create": { label: "Usuário criado", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: <User className="h-3.5 w-3.5" /> },
};

const ENTITY_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "project", label: "Projetos" },
  { value: "document", label: "Documentos" },
];

function timeAgo(date: string | Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function PayloadViewer({ payload }: { payload: string | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!payload) return null;
  let parsed: any;
  try { parsed = JSON.parse(payload); } catch { return <span className="text-xs text-muted-foreground font-mono">{payload}</span>; }
  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Detalhes
      </button>
      {expanded && (
        <pre className="mt-1 text-[11px] bg-muted rounded p-2 overflow-x-auto font-mono text-foreground">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const filtered = logs.filter(log => {
    if (entityFilter !== "all" && log.entityType !== entityFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(s) ||
        (log.userName || "").toLowerCase().includes(s) ||
        (log.entityLabel || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Log de Auditoria</h1>
          <p className="text-sm text-muted-foreground">Histórico de todas as ações no sistema</p>
        </div>
        <div className="ml-auto">
          <Badge variant="secondary" className="text-xs">{logs.length} registros</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por ação, usuário ou entidade…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-audit-search"
          />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-44" data-testid="select-audit-entity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_FILTERS.map(f => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Log List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground font-medium">
            {filtered.length} {filtered.length === 1 ? "registro" : "registros"} encontrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-5 py-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <Shield className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">Nenhuma ação registrada ainda</p>
              <p className="text-sm mt-1">As ações no sistema aparecerão aqui automaticamente</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map(log => {
                const actionMeta = ACTION_MAP[log.action];
                return (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors" data-testid={`audit-row-${log.id}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${actionMeta?.color ?? "bg-muted text-muted-foreground"}`}>
                      {actionMeta?.icon ?? <Activity className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${actionMeta?.color ?? "bg-muted text-foreground"}`}>
                          {actionMeta?.label ?? log.action}
                        </span>
                        {log.entityLabel && (
                          <span className="text-xs text-foreground font-medium">{log.entityLabel}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{log.userName || "Sistema"}</span>
                        {log.userRole && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{log.userRole}</span>
                        )}
                      </div>
                      <PayloadViewer payload={log.payload} />
                    </div>
                    <div className="text-[11px] text-muted-foreground flex-shrink-0 text-right">
                      {timeAgo(log.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
