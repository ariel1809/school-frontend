import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractError } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Coins, Trash2, Plus, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

type FeeType = {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  defaultAmount?: number;
  active: boolean;
};

const CATEGORIES = ['REGISTRATION', 'TUITION', 'TRANSPORT', 'CANTEEN', 'UNIFORM', 'EXAM', 'ACTIVITY', 'OTHER'];

const CATEGORY_LABEL: Record<string, string> = {
  REGISTRATION: 'Inscription',
  TUITION: 'Scolarité',
  TRANSPORT: 'Transport',
  CANTEEN: 'Cantine',
  UNIFORM: 'Uniforme',
  EXAM: 'Examens',
  ACTIVITY: 'Activités',
  OTHER: 'Autre',
};

export function FeeTypesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['fee-types'],
    queryFn: async () => (await api.get('/v1/fee-types')).data.data as FeeType[],
  });

  const create = useMutation({
    mutationFn: async (payload: Partial<FeeType>) =>
      (await api.post('/v1/fee-types', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-types'] });
      setOpen(false);
      setErr(null);
    },
    onError: (e) => setErr(extractError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/v1/fee-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-types'] }),
  });

  const toggleActive = useMutation({
    mutationFn: async (f: FeeType) => api.put(`/v1/fee-types/${f.id}`, { ...f, active: !f.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-types'] }),
  });

  const data = list.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Types de frais"
        description="Catalogue des frais facturables — utilisé comme briques pour composer les factures."
        actions={
          <Button onClick={() => { setOpen((o) => !o); setErr(null); }} variant={open ? 'outline' : 'default'}>
            {open ? (
              <>
                <X className="h-4 w-4" /> Annuler
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Nouveau type
              </>
            )}
          </Button>
        }
      />

      {open && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Nouveau type de frais</CardTitle>
            <CardDescription>
              Le code sera utilisé dans les exports. Le montant par défaut peut être surchargé à la facturation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                create.mutate({
                  code: (fd.get('code') as string).toUpperCase(),
                  name: fd.get('name') as string,
                  description: (fd.get('description') as string) || undefined,
                  category: fd.get('category') as string,
                  defaultAmount: fd.get('defaultAmount') ? Number(fd.get('defaultAmount')) : undefined,
                  active: true,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Code</Label>
                <Input name="code" placeholder="TUITION_S1" required className="font-mono uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input name="name" placeholder="Scolarité semestre 1" required />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select name="category" required defaultValue="TUITION">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant par défaut</Label>
                <Input name="defaultAmount" type="number" step="100" placeholder="0" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Description</Label>
                <Input name="description" placeholder="Optionnel" />
              </div>
              {err && <p className="md:col-span-2 text-sm text-destructive">{err}</p>}
              <div className="md:col-span-2">
                <Button type="submit" disabled={create.isPending}>
                  Créer le type
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable>
        <Table>
          <THead>
            <tr>
              <TH>Code</TH>
              <TH>Nom</TH>
              <TH>Catégorie</TH>
              <TH className="text-right">Montant par défaut</TH>
              <TH>État</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {data.map((f) => (
              <TR key={f.id}>
                <TD className="font-mono text-xs">{f.code}</TD>
                <TD className="font-medium">{f.name}</TD>
                <TD>
                  <Badge variant="outline">{CATEGORY_LABEL[f.category] ?? f.category}</Badge>
                </TD>
                <TD className="text-right tabular-nums">{f.defaultAmount != null ? fmt(f.defaultAmount) : '—'}</TD>
                <TD>
                  <button
                    type="button"
                    onClick={() => toggleActive.mutate(f)}
                    className="inline-flex"
                    title={f.active ? 'Désactiver' : 'Activer'}
                  >
                    {f.active ? <Badge variant="success">Actif</Badge> : <Badge variant="secondary">Inactif</Badge>}
                  </button>
                </TD>
                <TD className="text-right">
                  <Button variant="ghost" size="icon-sm" onClick={() => remove.mutate(f.id)} title="Supprimer">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {data.length === 0 && (
          <EmptyState
            icon={Coins}
            title="Aucun type de frais"
            description="Créez vos premiers types de frais pour pouvoir émettre des factures."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Nouveau type
              </Button>
            }
          />
        )}
      </DataTable>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
}