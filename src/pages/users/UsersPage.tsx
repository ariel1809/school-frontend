import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Users as UsersIcon, X, Settings2, Trash2, Lock } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SUPER_ADMIN, useRbacAccess, type ManagedUser, type Role } from '@/lib/rbac';

export function UsersPage() {
  const qc = useQueryClient();
  const access = useRbacAccess();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createErr, setCreateErr] = useState<string | null>(null);

  const usersQ = useQuery({
    queryKey: ['users', q],
    queryFn: async () =>
      (await api.get('/v1/users', { params: { q, size: 50 } })).data.data as { content: ManagedUser[] },
  });

  const rolesQ = useQuery({
    queryKey: ['roles', 'detailed'],
    queryFn: async () => (await api.get('/v1/roles')).data.data as Role[],
  });

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post('/v1/users', payload)).data.data as ManagedUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setCreating(false); setCreateErr(null); },
    onError: (e) => setCreateErr(extractError(e)),
  });

  const list = usersQ.data?.content ?? [];
  const roles = rolesQ.data ?? [];
  const assignableRoles = roles.filter((r) => access.canAssignRole(r));
  const editing = list.find((u) => u.id === editingId) ?? null;

  const targetLocked = (u: ManagedUser) =>
    u.roles.some((r) => r.code === SUPER_ADMIN) && !access.isSuperAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Comptes ayant accès à la plateforme — administrateurs, enseignants, personnel."
        actions={
          access.canCreateUser && (
            <Button onClick={() => { setCreating((c) => !c); setEditingId(null); setCreateErr(null); }} variant={creating ? 'outline' : 'default'}>
              {creating ? (<><X className="h-4 w-4" /> Annuler</>) : (<><Plus className="h-4 w-4" /> Nouvel utilisateur</>)}
            </Button>
          )
        }
      />

      {creating && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Créer un compte utilisateur</CardTitle>
            <CardDescription>
              L'utilisateur recevra ces identifiants — il pourra changer son mot de passe à la première connexion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const roleIds = fd.getAll('roleIds') as string[];
                create.mutate({
                  email: fd.get('email'),
                  fullName: fd.get('fullName'),
                  phone: fd.get('phone') || null,
                  initialPassword: fd.get('initialPassword'),
                  roleIds,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" placeholder="prenom.nom@ecole.com" required />
              </div>
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input name="fullName" placeholder="Marie Dupont" required />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input name="phone" placeholder="Optionnel" />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe initial</Label>
                <Input name="initialPassword" type="password" minLength={8} required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Rôles</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-md border border-border/70 bg-muted/30">
                  {assignableRoles.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:text-primary transition-colors">
                      <input type="checkbox" name="roleIds" value={r.id} className="accent-primary" />
                      {r.displayName}
                    </label>
                  ))}
                  {assignableRoles.length === 0 && (
                    <p className="text-sm text-muted-foreground italic col-span-full">Aucun rôle attribuable.</p>
                  )}
                </div>
              </div>
              {createErr && <p className="md:col-span-2 text-sm text-destructive">{createErr}</p>}
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={create.isPending}>Créer le compte</Button>
                <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editing && (
        <UserEditor
          key={editing.id}
          user={editing}
          roles={roles}
          onClose={() => setEditingId(null)}
        />
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input placeholder="Rechercher un utilisateur…" className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <DataTable>
        <Table>
          <THead>
            <tr>
              <TH>Utilisateur</TH>
              <TH>Email</TH>
              <TH>Rôles</TH>
              <TH>État</TH>
              {(access.canUpdateUser || access.canAssignRoles) && <TH className="text-right">Actions</TH>}
            </tr>
          </THead>
          <TBody>
            {list.map((u) => {
              const locked = targetLocked(u);
              return (
                <TR key={u.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.fullName} size="sm" />
                      <div className="font-medium text-foreground">{u.fullName}</div>
                    </div>
                  </TD>
                  <TD className="text-sm text-muted-foreground">{u.email}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r.id} variant="outline">{r.displayName}</Badge>
                      ))}
                    </div>
                  </TD>
                  <TD>
                    {u.enabled ? <Badge variant="success">Actif</Badge> : <Badge variant="secondary">Désactivé</Badge>}
                  </TD>
                  {(access.canUpdateUser || access.canAssignRoles) && (
                    <TD className="text-right">
                      {locked ? (
                        <span className="inline-flex items-center text-muted-foreground" title="Réservé au super administrateur">
                          <Lock className="h-4 w-4" />
                        </span>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(u.id); setCreating(false); }}>
                          <Settings2 className="h-4 w-4" /> Gérer
                        </Button>
                      )}
                    </TD>
                  )}
                </TR>
              );
            })}
          </TBody>
        </Table>
        {list.length === 0 && (
          <EmptyState
            icon={UsersIcon}
            title="Aucun utilisateur"
            description="Créez le premier compte utilisateur pour donner accès à la plateforme."
          />
        )}
      </DataTable>
    </div>
  );
}

function UserEditor({ user, roles, onClose }: { user: ManagedUser; roles: Role[]; onClose: () => void }) {
  const qc = useQueryClient();
  const access = useRbacAccess();
  const [err, setErr] = useState<string | null>(null);
  const assignedIds = new Set(user.roles.map((r) => r.id));

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const saveProfile = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => api.put(`/v1/users/${user.id}`, payload),
    onSuccess: () => { invalidate(); setErr(null); },
    onError: (e) => setErr(extractError(e)),
  });

  const addRole = useMutation({
    mutationFn: async (roleId: string) => api.post(`/v1/users/${user.id}/roles/${roleId}`),
    onSuccess: invalidate,
    onError: (e) => setErr(extractError(e)),
  });

  const removeRole = useMutation({
    mutationFn: async (roleId: string) => api.delete(`/v1/users/${user.id}/roles/${roleId}`),
    onSuccess: invalidate,
    onError: (e) => setErr(extractError(e)),
  });

  const del = useMutation({
    mutationFn: async () => api.delete(`/v1/users/${user.id}`),
    onSuccess: () => { invalidate(); onClose(); },
    onError: (e) => setErr(extractError(e)),
  });

  const roleBusy = addRole.isPending || removeRole.isPending;

  return (
    <Card className="animate-fade-in border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Gérer « {user.fullName} »</span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} title="Fermer"><X className="h-4 w-4" /></Button>
        </CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile */}
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            saveProfile.mutate({
              fullName: fd.get('fullName'),
              phone: fd.get('phone') || null,
              avatarUrl: fd.get('avatarUrl') || null,
              enabled: fd.get('enabled') === 'on',
            });
          }}
        >
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input name="fullName" defaultValue={user.fullName} required disabled={!access.canUpdateUser} />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input name="phone" defaultValue={user.phone} placeholder="Optionnel" disabled={!access.canUpdateUser} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Avatar (URL)</Label>
            <Input name="avatarUrl" defaultValue={user.avatarUrl} placeholder="Optionnel" disabled={!access.canUpdateUser} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="enabled" defaultChecked={user.enabled} className="accent-primary" disabled={!access.canUpdateUser} />
            Compte actif
          </label>
          {access.canUpdateUser && (
            <div className="md:col-span-2">
              <Button type="submit" disabled={saveProfile.isPending}>Enregistrer le profil</Button>
            </div>
          )}
        </form>

        {/* Roles */}
        {access.canAssignRoles && (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <Label>Rôles {roleBusy && <span className="text-xs text-muted-foreground">(enregistrement…)</span>}</Label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 rounded-md border border-border/70 bg-muted/30">
              {roles.map((r) => {
                const assigned = assignedIds.has(r.id);
                const isSuper = r.code === SUPER_ADMIN;
                // Adding requires the actor to be allowed to grant the role; removing a
                // non-SUPER_ADMIN role is always allowed. SUPER_ADMIN is reserved to super admins.
                const canToggle = assigned
                  ? (!isSuper || access.isSuperAdmin)
                  : access.canAssignRole(r);
                return (
                  <label
                    key={r.id}
                    className={`flex items-center gap-2 text-sm rounded-md px-2 py-1.5 transition-colors ${
                      canToggle ? 'cursor-pointer hover:bg-muted' : 'opacity-50 cursor-not-allowed'
                    }`}
                    title={canToggle ? r.displayName : 'Action non autorisée pour votre profil'}
                  >
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={assigned}
                      disabled={!canToggle || roleBusy}
                      onChange={() => (assigned ? removeRole.mutate(r.id) : addRole.mutate(r.id))}
                    />
                    <span className="min-w-0 truncate">{r.displayName}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}

        {/* Danger zone */}
        {access.canDeleteUser && (
          <div className="border-t border-border/60 pt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Supprimer définitivement ce compte et ses accès.</p>
            <Button
              variant="destructive"
              size="sm"
              disabled={del.isPending}
              onClick={() => {
                if (confirm(`Supprimer le compte de ${user.fullName} ? Cette action est irréversible.`)) del.mutate();
              }}
            >
              <Trash2 className="h-4 w-4" /> Supprimer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}