import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { KanbanSquare, Hash, User, Zap } from "lucide-react";
import type { Project, Client, StatusConfig } from "@shared/schema";
import { getBadgeClass, getKanbanClass, STATUS_COLOR_PRESETS } from "@/lib/status-colors";
import { useLocation } from "wouter";

type ProjectWithClient = Project & {
  client: Client | null;
  integrador?: { name: string; email: string | null; cpfCnpj: string | null } | null;
};

function ProjectCard({ project, index, badgeClass }: { project: ProjectWithClient; index: number; badgeClass: string }) {
  const integradorName = project.integrador?.name || project.client?.name || "—";
  return (
    <Draggable draggableId={project.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-testid={`kanban-card-${project.id}`}
          className={`mb-3 ${snapshot.isDragging ? "opacity-90 rotate-2 scale-[1.02]" : ""}`}
        >
          <Card className={`cursor-grab active:cursor-grabbing hover:shadow-lg transition-all border border-border/50 group bg-card/50 backdrop-blur-sm ${snapshot.isDragging ? "shadow-2xl border-primary/50" : ""}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                {project.ticketNumber && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                    <Hash className="h-2.5 w-2.5 text-primary" />
                    <span className="text-[9px] font-mono text-primary font-bold tracking-tighter uppercase">{project.ticketNumber}</span>
                  </div>
                )}
                <div className="h-1.5 w-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
              </div>
              
              <p className="text-xs font-bold leading-relaxed text-foreground group-hover:text-primary transition-colors line-clamp-2">{project.title}</p>
              
              <div className="space-y-1.5 pt-2 border-t border-border/30">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                  <User className="h-3 w-3 flex-shrink-0 text-muted-foreground/60" />
                  <span className="truncate">{integradorName}</span>
                </div>
                
                {project.potencia && (
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                    <Zap className="h-3 w-3 flex-shrink-0 text-amber-500" />
                    <span className="font-bold text-foreground/70">{project.potencia} <span className="text-[9px] font-normal text-muted-foreground">kWp</span></span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: allProjects = [], isLoading: projLoading } = useQuery<ProjectWithClient[]>({
    queryKey: ["/api/projects"],
  });
  const { data: statusConfigsRaw = [], isLoading: configLoading } = useQuery<StatusConfig[]>({
    queryKey: ["/api/status-configs"],
  });

  const [localProjects, setLocalProjects] = useState<ProjectWithClient[] | null>(null);
  const projects = localProjects ?? allProjects;

  const columns = statusConfigsRaw
    .filter(c => c.showInKanban)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/projects/${id}`, { status }),
    onError: () => {
      setLocalProjects(null);
      toast({ title: "Erro ao mover projeto", variant: "destructive" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const proj = projects.find(p => p.id === draggableId);
    if (!proj || proj.status === newStatus) return;
    const updated = projects.map(p => p.id === draggableId ? { ...p, status: newStatus as Project["status"] } : p);
    setLocalProjects(updated);
    updateMut.mutate({ id: draggableId, status: newStatus });
  };

  const isLoading = projLoading || configLoading;

  return (
    <div className="p-6 space-y-8 h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-background">
      <div className="flex items-end justify-between flex-shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Fluxo de Operações</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Pipeline <span className="text-primary/20">/</span> Kanban
          </h1>
          <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            {projects.filter(p => !p.archived).length} projetos ativos sob sua gestão
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/status-config")}
          className="rounded-xl border-border/60 font-bold uppercase tracking-widest text-[10px] h-10 px-5 bg-background hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
          data-testid="link-kanban-config"
        >
          Configurar Estágios
        </Button>
      </div>

      <div className="flex-1 overflow-hidden -mx-6 px-6">
        {isLoading ? (
          <div className="flex gap-6 overflow-x-auto pb-6 h-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-80 space-y-4">
                <Skeleton className="h-12 w-full rounded-2xl bg-muted/40" />
                <Skeleton className="h-40 w-full rounded-2xl bg-muted/40 shadow-sm" />
                <Skeleton className="h-40 w-full rounded-2xl bg-muted/40 shadow-sm" />
              </div>
            ))}
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-8 h-full scroll-smooth snap-x scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20">
              {columns.map(col => {
                const colProjects = projects.filter(p => p.status === col.key && !p.archived);
                const badgeClass = getBadgeClass(col.color);
                const colorHex = STATUS_COLOR_PRESETS[col.color]?.hex || "#94a3b8";
                return (
                  <div key={col.key} className="flex-shrink-0 w-80 flex flex-col h-full snap-start group/column">
                    <div className="rounded-[2rem] p-4 flex flex-col h-full transition-all border border-border/40 bg-muted/5 hover:bg-muted/10 relative overflow-hidden">
                      {/* Subtlest color indicator at the top */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1.5 opacity-40 group-hover/column:opacity-100 transition-opacity" 
                        style={{ backgroundColor: colorHex }}
                      />
                      
                      <div className="flex items-center justify-between mb-6 px-2 pt-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${badgeClass.split(" ")[1]}`} />
                          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/70">{col.label}</h3>
                        </div>
                        <Badge className={`px-2.5 py-0.5 rounded-lg font-black text-[10px] border-0 shadow-sm ${badgeClass}`}>
                          {colProjects.length}
                        </Badge>
                      </div>
                      
                      <Droppable droppableId={col.key}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 overflow-y-auto pr-2 -mr-1 scrollbar-none transition-all rounded-3xl p-1 ${snapshot.isDraggingOver ? "bg-primary/[0.04] ring-2 ring-primary/10 ring-inset" : ""}`}
                            data-testid={`kanban-column-${col.key}`}
                          >
                            <div className="space-y-3">
                              {colProjects.map((project, idx) => (
                                <ProjectCard
                                  key={project.id}
                                  project={project}
                                  index={idx}
                                  badgeClass={badgeClass}
                                />
                              ))}
                            </div>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
