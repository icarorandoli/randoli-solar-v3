import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Star, Upload, Globe, ExternalLink, ImageOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { useUpload } from "@/hooks/use-upload";
import type { Partner, InsertPartner } from "@shared/schema";

function PartnerCarouselPreview({ partners }: { partners: Partner[] }) {
  const [active, setActive] = useState(0);

  if (partners.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-6 space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preview do Carrossel</p>
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {partners.map((partner, i) => (
          <div
            key={partner.id}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border bg-background transition-all cursor-pointer ${i === active % partners.length ? "border-primary shadow-sm" : "border-border/50 opacity-60"}`}
            onClick={() => setActive(i)}
            data-testid={`preview-partner-${partner.id}`}
          >
            {partner.logoUrl ? (
              <img src={partner.logoUrl} alt={partner.name} className="h-12 w-24 object-contain" />
            ) : (
              <div className="h-12 w-24 flex items-center justify-center bg-muted rounded">
                <ImageOff className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <span className="text-xs font-medium text-center">{partner.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartnerDialog({
  open,
  onClose,
  partner,
}: {
  open: boolean;
  onClose: () => void;
  partner?: Partner;
}) {
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<InsertPartner>({
    defaultValues: partner ? {
      name: partner.name,
      logoUrl: partner.logoUrl || "",
      website: partner.website || "",
      sortOrder: partner.sortOrder,
    } : {
      name: "",
      logoUrl: "",
      website: "",
      sortOrder: 0,
    },
  });

  const logoUrl = watch("logoUrl");
  const [uploading, setUploading] = useState(false);

  const { uploadFile } = useUpload({
    onSuccess: (response) => {
      setValue("logoUrl", response.objectPath);
      setUploading(false);
    },
    onError: () => {
      toast({ title: "Erro ao fazer upload da imagem", variant: "destructive" });
      setUploading(false);
    },
  });

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadFile(file);
  };

  const createMut = useMutation({
    mutationFn: (data: InsertPartner) => apiRequest("POST", "/api/partners", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Parceiro adicionado!" });
      onClose();
      reset();
    },
    onError: () => toast({ title: "Erro ao adicionar parceiro", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<InsertPartner>) => apiRequest("PATCH", `/api/partners/${partner?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Parceiro atualizado!" });
      onClose();
    },
    onError: () => toast({ title: "Erro ao atualizar parceiro", variant: "destructive" }),
  });

  const onSubmit = (data: InsertPartner) => {
    if (partner) updateMut.mutate(data);
    else createMut.mutate(data);
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{partner ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome do Parceiro *</Label>
            <Input id="name" {...register("name", { required: true })} placeholder="Ex: Empresa Solar Ltda" data-testid="input-partner-name" />
          </div>

          <div className="space-y-1.5">
            <Label>Logo do Parceiro</Label>
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="URL da imagem ou faça upload"
                  {...register("logoUrl")}
                  data-testid="input-partner-logo-url"
                />
                <div className="flex items-center gap-2">
                  <label className="flex-1">
                    <Button type="button" variant="outline" size="sm" className="w-full relative" disabled={uploading} data-testid="button-upload-partner-logo">
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {uploading ? "Enviando..." : "Upload de imagem"}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileInput}
                        disabled={uploading}
                      />
                    </Button>
                  </label>
                </div>
              </div>
              {logoUrl && (
                <div className="h-16 w-20 border border-border rounded-md flex items-center justify-center bg-muted/30 flex-shrink-0">
                  <img src={logoUrl} alt="preview" className="h-14 w-18 object-contain" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" {...register("website")} placeholder="https://..." data-testid="input-partner-website" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sortOrder">Ordem no carrossel</Label>
            <Input
              id="sortOrder"
              type="number"
              {...register("sortOrder", { valueAsNumber: true })}
              placeholder="0"
              data-testid="input-partner-order"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending || uploading} data-testid="button-save-partner">
              {isPending ? "Salvando..." : partner ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PartnersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | undefined>();
  const { toast } = useToast();

  const { data: partners = [], isLoading } = useQuery<Partner[]>({ queryKey: ["/api/partners"] });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Parceiro removido!" });
    },
    onError: () => toast({ title: "Erro ao remover parceiro", variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Parceiros & Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie o carrossel de parceiros e clientes no site</p>
        </div>
        <Button onClick={() => { setEditPartner(undefined); setDialogOpen(true); }} data-testid="button-new-partner">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Parceiro
        </Button>
      </div>

      {!isLoading && partners.length > 0 && (
        <PartnerCarouselPreview partners={partners} />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-lg" />)}
        </div>
      ) : partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Star className="h-14 w-14 mb-3 opacity-30" />
          <p className="font-medium">Nenhum parceiro cadastrado</p>
          <p className="text-sm mt-1">Adicione parceiros para exibir no carrossel do site</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {partners.map(partner => (
            <Card key={partner.id} className="hover-elevate" data-testid={`card-partner-${partner.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="h-20 w-full flex items-center justify-center bg-muted/40 rounded-md">
                  {partner.logoUrl ? (
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="h-16 max-w-full object-contain"
                      data-testid={`img-partner-${partner.id}`}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageOff className="h-6 w-6 opacity-50" />
                      <span className="text-xs">Sem logo</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">{partner.name}</p>
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary mt-0.5"
                      data-testid={`link-partner-website-${partner.id}`}
                    >
                      <Globe className="h-3 w-3" />
                      {partner.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">Ordem: {partner.sortOrder}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setEditPartner(partner); setDialogOpen(true); }}
                    data-testid={`button-edit-partner-${partner.id}`}
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => deleteMut.mutate(partner.id)}
                    disabled={deleteMut.isPending}
                    data-testid={`button-delete-partner-${partner.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PartnerDialog open={dialogOpen} onClose={() => setDialogOpen(false)} partner={editPartner} />
    </div>
  );
}
