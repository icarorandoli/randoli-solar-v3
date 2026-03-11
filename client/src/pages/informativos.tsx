import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Megaphone, Eye, EyeOff } from "lucide-react";
import type { Announcement } from "@shared/schema";

function AnnouncementFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Announcement | null;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(editing?.title || "");
  const [content, setContent] = useState(editing?.content || "");
  const [active, setActive] = useState(editing?.active ?? true);

  useState(() => {
    setTitle(editing?.title || "");
    setContent(editing?.content || "");
    setActive(editing?.active ?? true);
  });

  const saveMut = useMutation({
    mutationFn: () => editing
      ? apiRequest("PATCH", `/api/announcements/${editing.id}`, { title, content, active })
      : apiRequest("POST", "/api/announcements", { title, content, active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: editing ? "Informativo atualizado!" : "Informativo criado!" });
      onClose();
    },
    onError: () => toast({ title: "Erro ao salvar informativo", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black">
            <Megaphone className="h-5 w-5 text-primary" />
            {editing ? "Editar Informativo" : "Novo Informativo"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Título *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Atualização do sistema v2.1"
              className="mt-1.5 rounded-xl border-border/40"
              data-testid="input-announcement-title"
            />
          </div>
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conteúdo *</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Descreva o informativo aqui..."
              rows={5}
              className="mt-1.5 rounded-xl border-border/40 resize-none"
              data-testid="input-announcement-content"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
            <div>
              <p className="text-sm font-semibold">Ativo</p>
              <p className="text-[11px] text-muted-foreground">Integradores verão este informativo como popup</p>
            </div>
            <Switch
              checked={active}
              onCheckedChange={setActive}
              data-testid="switch-announcement-active"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
          <Button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !title.trim() || !content.trim()}
            className="rounded-xl"
            data-testid="button-save-announcement"
          >
            {saveMut.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InformativosPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery<Announcement[]>({ queryKey: ["/api/announcements"] });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiRequest("PATCH", `/api/announcements/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/announcements"] }),
    onError: () => toast({ title: "Erro ao alterar status", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Informativo excluído!" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  const openEdit = (item: Announcement) => { setEditing(item); setShowForm(true); };
  const closeForm = () => { setEditing(null); setShowForm(false); };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Comunicação</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Informativos</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Crie avisos que aparecem como popup para os integradores no portal.
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="rounded-xl px-5"
          data-testid="button-new-announcement"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Informativo
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i} className="border-border/40 rounded-2xl animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 w-48 bg-muted rounded mb-3" />
                <div className="h-4 w-full bg-muted/50 rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted/50 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-border/40 rounded-2xl border-dashed">
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum informativo criado ainda.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Clique em "Novo Informativo" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <Card key={item.id} className="border-border/40 rounded-2xl hover:border-primary/30 transition-colors" data-testid={`card-announcement-${item.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
                      <Badge
                        className={`text-[9px] font-black uppercase tracking-widest border-0 ${item.active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}
                      >
                        {item.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-3">{item.content}</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-3">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={item.active ? "Desativar" : "Ativar"}
                      onClick={() => toggleMut.mutate({ id: item.id, active: !item.active })}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                      data-testid={`button-toggle-announcement-${item.id}`}
                    >
                      {item.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(item)}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary"
                      data-testid={`button-edit-announcement-${item.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(item.id)}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive"
                      data-testid={`button-delete-announcement-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnnouncementFormDialog open={showForm} onClose={closeForm} editing={editing} />

      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Excluir Informativo
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este informativo? Esta ação é irreversível.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
