import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, X, Pencil, Trash2, Info } from 'lucide-react';
import { api, extractError } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { categoryLabel, groupByCategory, useRbacAccess, type Permission } from '@/lib/rbac';

export function PermissionsPage() {
  const qc = useQueryClient();
  const access = useRbacAccess();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Permission | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const permsQ = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => (await api.get('/v1/permissions')).data.data as Permission[],
  });

  const upsert = useMutation({
    mutationFn: async (p: Partial<Permission> & { id?: string }) => {
      if (p.id) {
        return (await api.put(`/v1/permissions/${p.id}`, { displayName: p.displayName, description: p.description || null, category: p.category || null })).data.data;
      }
      return (await api.post('/v1/permissions', { code: (p.code as string).toUpperCase(), displayName: p.displayName, description: p.description || null, category: p.category || null })).data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permissions'] }); setOpen(false); setEditing(null); setErr(null); },
    onError: (e) => setErr(extractError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/v1/permissions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permissions'] }),
    onError: (e) => alert(extractError(e)),
  });

  const grouped = useMemo(() => groupByCategory(permsQ.data ?? []), [permsQ.data]);
  const canManage = access.canManagePermissionCatalog;

  const startCreate = () => { setEditing(null); setOpen((o) => !o); setErr(null); };
  const startEdit = (p: Permission) => { setEditing(p); setOpen(true); setErr(null); };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Catalogue de permissions"
        description="Les capacités atomiques du logiciel, utilisées pour composer les rôles."
        actions={
          canManage && (
            <Button onClick={startCreate} variant={open && !editing ? 'outline' : 'default'}>
              {open && !editing ? (<><X className="h-4 w-4" /> Annuler</>) : (<><Plus className="h-4 w-4" /> Nouvelle permission</>)}
            </Button>
          )
        }
      />

      <div className="flex items-start gap-2 rounded-md border border-info/30 bg-info-soft/40 px-4 py-3 text-sm text-info">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Une permission ne protège réellement une fonctionnalité que lorsque le code la contrôle. Le catalogue est
          donc géré par la plateforme (super administrateur) ; l'administration de l'école compose librement ses
          <strong> rôles</strong> à partir de ces permissions.
        </p>
      </div>

      {open && canManage && (
        <PermissionForm
          permission={editing}
          pending={upsert.isPending}
          error={err}
          onCancel={() => { setOpen(false); setEditing(null); }}
          onSubmit={(values) => upsert.mutate({ ...values, id: editing?.id })}
        />
      )}

      {grouped.length === 0 ? (
        <EmptyState icon={KeyRound} title="Aucune permission" description="Le catalogue de permissions est vide." />
      ) : (
        <DataTable>
          <Table>
            <THead>
              <tr>
                <TH>Permission</TH>
                <TH>Code</TH>
                <TH>Catégorie</TH>
                {canManage && <TH className="text-right">Actions</TH>}
              </tr>
            </THead>
            <TBody>
              {grouped.flatMap(([category, perms]) =>
                perms.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <div className="font-medium text-foreground">{p.displayName}</div>
                      {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                    </TD>
                    <TD className="font-mono text-xs">{p.code}</TD>
                    <TD><Badge variant="outline">{categoryLabel(category)}</Badge></TD>
                    {canManage && (
                      <TD className="text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => startEdit(p)} title="Modifier">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Supprimer"
                            onClick={() => {
                              if (confirm(`Supprimer la permission « ${p.code} » ?`)) remove.mutate(p.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TD>
                    )}
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </DataTable>
      )}
    </div>
  );
}

function PermissionForm({
  permission,
  pending,
  error,
  onCancel,
  onSubmit,
}: {
  permission: Permission | null;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: { code?: string; displayName: string; description?: string; category?: string }) => void;
}) {
  const isEdit = !!permission;
  return (
    <Card className="animate-fade-in border-primary/30">
      <CardHeader>
        <CardTitle>{isEdit ? `Modifier « ${permission!.code} »` : 'Nouvelle permission'}</CardTitle>
        <CardDescription>Le code suit la convention MAJUSCULES_AVEC_UNDERSCORE et ne pourra plus être modifié.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onSubmit({
              code: (fd.get('code') as string) || undefined,
              displayName: fd.get('displayName') as string,
              description: (fd.get('description') as string) || undefined,
              category: (fd.get('category') as string) || undefined,
            });
          }}
        >
          <div className="space-y-2">
            <Label>Code</Label>
            <Input
              name="code"
              defaultValue={permission?.code}
              placeholder="CANTINE_MANAGE"
              pattern="[A-Z][A-Z0-9_]{1,99}"
              title="MAJUSCULES_AVEC_UNDERSCORE, 2 à 100 caractères"
              className="font-mono uppercase"
              required
              disabled={isEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>Nom affiché</Label>
            <Input name="displayName" defaultValue={permission?.displayName} placeholder="Gérer la cantine" required />
          </div>
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Input name="category" defaultValue={permission?.category} placeholder="ex. cantine" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Description</Label>
            <Textarea name="description" defaultValue={permission?.description} placeholder="Optionnel" />
          </div>
          {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" disabled={pending}>{isEdit ? 'Enregistrer' : 'Créer la permission'}</Button>
            <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}