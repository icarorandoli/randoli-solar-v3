import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { KanbanSquare, Hash, User, Zap } from "lucide-react";
import type { Project, Client, StatusConfig } from "@shared/schema";
import { getBadgeClass, getKanbanClass } from "@/lib/status-colors";
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
          className={`mb-2 ${snapshot.isDragging ? "opacity-90 rotate-1 scale-105" : ""}`}
        >
          <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border border-border/60">
            <CardContent className="p-3 space-y-2">
              {project.ticketNumber && (
                <div className="flex items-center gap-1">
                  <Hash className="h-2.5 w-2.5 text-primary" />
                  <span className="text-[10px] font-mono text-primary font-semibold">{project.ticketNumber}</span>
                </div>
              )}
              <p className="text-xs font-semibold leading-snug line-clamp-2">{project.title}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <User className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="truncate">{integradorName}</span>
              </div>
              {project.potencia && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Zap className="h-2.5 w-2.5 flex-shrink-0" />
                  <span>{project.potencia} kWp</span>
                </div>
              )}
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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KanbanSquare className="h-6 w-6 text-primary" />
            Kanban
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{projects.filter(p => !p.archived).length} projetos ativos</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/status-config")}
          className="text-xs text-primary hover:underline flex items-center gap-1"
          data-testid="link-kanban-config"
        >
          Configurar colunas
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-56 space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-6">
            {columns.map(col => {
              const colProjects = projects.filter(p => p.status === col.key && !p.archived);
              const kanbanClass = getKanbanClass(col.color);
              const badgeClass = getBadgeClass(col.color);
              return (
                <div key={col.key} className="flex-shrink-0 w-60">
                  <div className={`rounded-xl p-3 min-h-[400px] ${kanbanClass}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-foreground/80">{col.label}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${badgeClass}`}>
                        {colProjects.length}
                      </span>
                    </div>
                    <Droppable droppableId={col.key}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[80px] transition-colors rounded-lg ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
                          data-testid={`kanban-column-${col.key}`}
                        >
                          {colProjects.map((project, idx) => (
                            <ProjectCard
                              key={project.id}
                              project={project}
                              index={idx}
                              badgeClass={badgeClass}
                            />
                          ))}
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
  );
}
