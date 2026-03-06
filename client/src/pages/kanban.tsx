import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { KanbanSquare, Hash, User, Zap } from "lucide-react";
import type { Project, Client } from "@shared/schema";

type ProjectWithClient = Project & {
  client: Client | null;
  integrador?: { name: string; email: string | null; cpfCnpj: string | null } | null;
};

const KANBAN_COLUMNS: { id: string; label: string; status: string; color: string }[] = [
  { id: "col_orcamento", label: "Orçamento", status: "orcamento", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "col_projeto_tecnico", label: "Projeto Técnico", status: "projeto_tecnico", color: "bg-blue-50 dark:bg-blue-950/30" },
  { id: "col_aguardando_art", label: "Emissão de ART", status: "aguardando_art", color: "bg-violet-50 dark:bg-violet-950/30" },
  { id: "col_protocolado", label: "Protocolado", status: "protocolado", color: "bg-purple-50 dark:bg-purple-950/30" },
  { id: "col_parecer_acesso", label: "Parecer de Acesso", status: "parecer_acesso", color: "bg-amber-50 dark:bg-amber-950/30" },
  { id: "col_vistoria", label: "Solicitar Vistoria", status: "vistoria", color: "bg-cyan-50 dark:bg-cyan-950/30" },
  { id: "col_homologado", label: "Homologado", status: "homologado", color: "bg-green-50 dark:bg-green-950/30" },
  { id: "col_finalizado", label: "Finalizado", status: "finalizado", color: "bg-emerald-50 dark:bg-emerald-950/30" },
];

const STATUS_BADGE: Record<string, string> = {
  orcamento: "bg-slate-100 text-slate-700",
  projeto_tecnico: "bg-blue-100 text-blue-700",
  aguardando_art: "bg-violet-100 text-violet-700",
  protocolado: "bg-purple-100 text-purple-700",
  parecer_acesso: "bg-amber-100 text-amber-700",
  vistoria: "bg-cyan-100 text-cyan-700",
  homologado: "bg-green-100 text-green-700",
  finalizado: "bg-emerald-100 text-emerald-700",
};

function ProjectCard({ project, index }: { project: ProjectWithClient; index: number }) {
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
          <Card className={`cursor-grab active:cursor-grabbing transition-shadow ${snapshot.isDragging ? "shadow-xl" : "hover:shadow-md"}`}>
            <CardContent className="p-3 space-y-2">
              {project.ticketNumber && (
                <p className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                  <Hash className="h-2.5 w-2.5" />{project.ticketNumber}
                </p>
              )}
              <p className="text-xs font-semibold leading-tight line-clamp-2">{project.title}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{integradorName}</span>
              </div>
              {project.potencia && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 flex-shrink-0" />
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
  const [localProjects, setLocalProjects] = useState<ProjectWithClient[] | null>(null);

  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({
    queryKey: ["/api/projects"],
  });

  const displayProjects = localProjects ?? projects;

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/projects/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao mover projeto", description: e.message, variant: "destructive" });
      setLocalProjects(null);
    },
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceColStatus = result.source.droppableId;
    const destColStatus = result.destination.droppableId;

    if (sourceColStatus === destColStatus && result.source.index === result.destination.index) return;

    const projectId = result.draggableId;
    const project = displayProjects.find(p => p.id === projectId);
    if (!project) return;

    // Optimistically update UI
    const updated = displayProjects.map(p =>
      p.id === projectId ? { ...p, status: destColStatus as any } : p
    );
    setLocalProjects(updated);

    // Persist change
    updateMut.mutate({ id: projectId, status: destColStatus });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <KanbanSquare className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Kanban de Projetos</h1>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(col => (
            <div key={col.id} className="flex-shrink-0 w-60">
              <Skeleton className="h-8 w-full mb-3" />
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full mb-2" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <KanbanSquare className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Kanban de Projetos</h1>
          <p className="text-xs text-muted-foreground">{displayProjects.length} projetos · Arraste para mover entre etapas</p>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1" data-testid="kanban-board">
          {KANBAN_COLUMNS.map(col => {
            const colProjects = displayProjects.filter(p => p.status === col.status);
            return (
              <div key={col.id} className="flex-shrink-0 w-60 flex flex-col">
                {/* Column Header */}
                <div className={`rounded-t-lg px-3 py-2 mb-2 ${col.color}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{col.label}</p>
                    <Badge variant="secondary" className="text-xs h-4 px-1.5 min-w-[1.25rem] flex items-center justify-center">
                      {colProjects.length}
                    </Badge>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={col.status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      data-testid={`kanban-col-${col.status}`}
                      className={`flex-1 rounded-b-lg p-2 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/30"
                      }`}
                    >
                      {colProjects.map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} />
                      ))}
                      {provided.placeholder}
                      {colProjects.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-6 text-xs text-muted-foreground/50">
                          Arraste aqui
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
