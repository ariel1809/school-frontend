import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Plus, X, Pencil, Trash2, Lock } from 'lucide-react';
import { api, extractError } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import {
  categoryLabel,
  groupByCategory,
  useRbacAccess,
  type Permission,
  type Role,
} from '@/lib/rbac';

export function RolesPage() {
  const qc = useQueryClient();
  const access = useRbacAccess();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const rolesQ = useQuery({
    queryKey: ['roles', 'detailed'],
    queryFn: async () => (await api.get('/v1/roles')).data.data as Role[],
  });

  const permissionsQ = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => (await api.get('/v1/permissions')).data.data as Permission[],
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/v1/roles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });

  const list = rolesQ.data ?? [];
  const allPermissions = permissionsQ.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Rôles & permissions"
        description="Composez des rôles sur mesure à partir du catalogue de permissions. Les rôles système ne sont pas modifiables."
        actions={
          access.canCreateRole && (
            <Button onClick={() => { setCreating((c) => !c); setEditingId(null); }} variant={creating ? 'outline' : 'default'}>
              {creating ? (
                <><X className="h-4 w-4" /> Annuler</>
              ) : (
                <><Plus className="h-4 w-4" /> Nouveau rôle</>
              )}
            </Button>
          )
        }
      />

      {creating && (
        <RoleEditor
          allPermissions={allPermissions}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); qc.invalidateQueries({ queryKey: ['roles'] }); }}
        />
      )}

      {list.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Aucun rôle" description="Créez un premier rôle pour structurer les accès." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r) =>
            editingId === r.id ? (
              <div key={r.id} className="md:col-span-2 xl:col-span-3">
                <RoleEditor
                  role={r}
                  allPermissions={allPermissions}
                  onClose={() => setEditingId(null)}
                  onSaved={() => { setEditingId(null); qc.invalidateQueries({ queryKey: ['roles'] }); }}
                />
              </div>
            ) : (
              <RoleCard
                key={r.id}
                role={r}
                canEdit={access.canUpdateRole && !r.system}
                canDelete={access.canDeleteRole && !r.system}
                onEdit={() => { setEditingId(r.id); setCreating(false); }}
                onDelete={() => {
                  if (confirm(`Supprimer le rôle « ${r.displayName} » ? Cette action est irréversible.`)) {
                    remove.mutate(r.id);
                  }
                }}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function RoleCard({
  role,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  role: Role;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const grouped = useMemo(() => groupByCategory(role.permissions), [role.permissions]);

  return (
    <Card className="card-hover flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-2 text-lg">
          <span className="min-w-0">
            <div className="truncate">{role.displayName}</div>
            <div className="text-xs font-normal text-muted-foreground font-mono mt-0.5">{role.code}</div>
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {role.system ? (
              <Badge variant="accent"><Lock className="h-3 w-3" /> Système</Badge>
            ) : (
              <>
                {canEdit && (
                  <Button variant="ghost" size="icon-sm" onClick={onEdit} title="Modifier">
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button variant="ghost" size="icon-sm" onClick={onDelete} title="Supprimer">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {role.description && <p className="text-sm text-muted-foreground">{role.description}</p>}
        <div className="space-y-3">
          {grouped.map(([category, perms]) => (
            <div key={category}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold mb-1.5">
                {categoryLabel(category)}
              </div>
              <div className="flex flex-wrap gap-1">
                {perms.map((p) => (
                  <Badge key={p.id} variant="secondary" className="font-mono text-[10px]">
                    {p.code}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          {role.permissions.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Aucune permission</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RoleEditor({
  role,
  allPermissions,
  onClose,
  onSaved,
}: {
  role?: Role;
  allPermissions: Permission[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const access = useRbacAccess();
  const isEdit = !!role;
  const [code, setCode] = useState(role?.code ?? '');
  const [displayName, setDisplayName] = useState(role?.displayName ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((role?.permissions ?? []).map((p) => p.id))
  );
  const [err, setErr] = useState<string | null>(null);

  const grouped = useMemo(() => groupByCategory(allPermissions), [allPermissions]);

  const save = useMutation({
    mutationFn: async () => {
      const permissionIds = Array.from(selected);
      if (isEdit) {
        return (await api.put(`/v1/roles/${role!.id}`, { displayName, description: description || null, permissionIds })).data.data;
      }
      return (await api.post('/v1/roles', { code: code.toUpperCase(), displayName, description: description || null, permissionIds })).data.data;
    },
    onSuccess: () => { setErr(null); onSaved(); },
    onError: (e) => setErr(extractError(e)),
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Card className="animate-fade-in border-primary/30">
      <CardHeader>
        <CardTitle>{isEdit ? `Modifier le rôle « ${role!.displayName} »` : 'Nouveau rôle'}</CardTitle>
        <CardDescription>
          {access.isSuperAdmin
            ? 'Choisissez les permissions qui composent ce rôle.'
            : 'Vous ne pouvez accorder que les permissions que vous détenez vous-même.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CAISSIER_JUNIOR"
                pattern="[A-Z][A-Z0-9_]{1,49}"
                title="MAJUSCULES_AVEC_UNDERSCORE, 2 à 50 caractères"
                className="font-mono uppercase"
                required
                disabled={isEdit}
              />
              {isEdit && <p className="text-xs text-muted-foreground">Le code d'un rôle ne peut pas être modifié.</p>}
            </div>
            <div className="space-y-2">
              <Label>Nom affiché</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Caissier junior" required />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optionnel — à quoi sert ce rôle ?" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Permissions ({selected.size})</Label>
            <div className="space-y-4 p-4 rounded-md border border-border/70 bg-muted/30 max-h-[420px] overflow-y-auto scroll-thin">
              {grouped.map(([category, perms]) => (
                <div key={category}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold mb-1.5">
                    {categoryLabel(category)}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {perms.map((p) => {
                      const grantable = access.canGrantPermission(p.code);
                      const checked = selected.has(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-2 text-sm rounded-md px-2 py-1.5 transition-colors ${
                            grantable ? 'cursor-pointer hover:bg-muted' : 'opacity-50 cursor-not-allowed'
                          }`}
                          title={grantable ? p.description ?? p.code : 'Vous ne détenez pas cette permission'}
                        >
                          <input
                            type="checkbox"
                            className="accent-primary mt-0.5"
                            checked={checked}
                            disabled={!grantable && !checked}
                            onChange={() => toggle(p.id)}
                          />
                          <span className="min-w-0">
                            <span className="block truncate">{p.displayName}</span>
                            <span className="block font-mono text-[10px] text-muted-foreground truncate">{p.code}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {allPermissions.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Aucune permission dans le catalogue.</p>
              )}
            </div>
          </div>

          {err && <p className="text-sm text-destructive">{err}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending}>
              {isEdit ? 'Enregistrer' : 'Créer le rôle'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}