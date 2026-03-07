import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Save, KanbanSquare, Tag, ChevronUp, ChevronDown } from "lucide-react";
import { STATUS_COLOR_PRESETS, getBadgeClass } from "@/lib/status-colors";
import type { StatusConfig } from "@shared/schema";

function ColorSwatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  const preset = STATUS_COLOR_PRESETS[color];
  return (
    <button
      type="button"
      onClick={onClick}
      title={preset?.label ?? color}
      className={`h-6 w-6 rounded-full border-2 transition-all ${selected ? "border-foreground scale-110 shadow-md" : "border-transparent hover:border-muted-foreground"}`}
      style={{ backgroundColor: preset?.hex ?? "#888" }}
      data-testid={`color-swatch-${color}`}
    />
  );
}

function StatusRow({
  config,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  config: StatusConfig;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { toast } = useToast();
  const [label, setLabel] = useState(config.label);
  const [color, setColor] = useState(config.color);
  const [showInKanban, setShowInKanban] = useState(config.showInKanban);
  const [dirty, setDirty] = useState(false);

  const saveMut = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/status-configs/${config.key}`, { label, color, showInKanban, sortOrder: config.sortOrder }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status-configs"] });
      toast({ title: `Status "${label}" salvo!` });
      setDirty(false);
    },
    onError: () => toast({ title: "Erro ao salvar status", variant: "destructive" }),
  });

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3" data-testid={`status-row-${config.key}`}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-0.5 pt-1">
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid={`button-move-up-${config.key}`}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid={`button-move-down-${config.key}`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{config.key}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBadgeClass(color)}`}>{label}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Status</Label>
              <Input
                value={label}
                onChange={e => { setLabel(e.target.value); setDirty(true); }}
                className="h-8 text-sm"
                data-testid={`input-status-label-${config.key}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cor</Label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.keys(STATUS_COLOR_PRESETS).map(c => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    selected={color === c}
                    onClick={() => { setColor(c); setDirty(true); }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Switch
                checked={showInKanban}
                onCheckedChange={v => { setShowInKanban(v); setDirty(true); }}
                data-testid={`switch-kanban-${config.key}`}
              />
              <Label className="text-xs flex items-center gap-1">
                <KanbanSquare className="h-3 w-3" /> Exibir no Kanban
              </Label>
            </div>
            {dirty && (
              <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="h-7 text-xs" data-testid={`button-save-status-${config.key}`}>
                <Save className="h-3 w-3 mr-1" />
                {saveMut.isPending ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatusConfigPage() {
  const { toast } = useToast();
  const { data: configs = [], isLoading } = useQuery<StatusConfig[]>({
    queryKey: ["/api/status-configs"],
  });

  const [order, setOrder] = useState<string[] | null>(null);

  const displayOrder = order ?? configs.map(c => c.key);
  const orderedConfigs = displayOrder
    .map(key => configs.find(c => c.key === key))
    .filter(Boolean) as StatusConfig[];

  const reorderMut = useMutation({
    mutationFn: async (newOrder: string[]) => {
      await Promise.all(
        newOrder.map((key, idx) =>
          apiRequest("PATCH", `/api/status-configs/${key}`, { sortOrder: idx }).then(r => r.json())
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status-configs"] });
      toast({ title: "Ordem salva!" });
    },
    onError: () => toast({ title: "Erro ao salvar ordem", variant: "destructive" }),
  });

  const moveItem = (key: string, direction: "up" | "down") => {
    const current = order ?? configs.map(c => c.key);
    const idx = current.indexOf(key);
    if (idx < 0) return;
    const newOrder = [...current];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setOrder(newOrder);
    reorderMut.mutate(newOrder);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Settings2 className="h-6 w-6 text-primary" />
          Configuração de Status
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personalize os nomes, cores e visibilidade de cada status no Kanban. A ordem aqui define a ordem nos filtros e na visualização.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Status do Fluxo de Homologação</CardTitle>
          </div>
          <CardDescription>
            {configs.length} status configurados · {configs.filter(c => c.showInKanban).length} exibidos no Kanban
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
          ) : (
            orderedConfigs.map((config, idx) => (
              <StatusRow
                key={config.key}
                config={config}
                isFirst={idx === 0}
                isLast={idx === orderedConfigs.length - 1}
                onMoveUp={() => moveItem(config.key, "up")}
                onMoveDown={() => moveItem(config.key, "down")}
              />
            ))
          )}
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">Dica</p>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Apenas o nome e a cor são customizáveis. Os identificadores de status (chaves) são fixos no banco de dados.
          Ative/desative "Exibir no Kanban" para controlar quais colunas aparecem no quadro Kanban.
        </p>
      </div>
    </div>
  );
}
