import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Plus, School, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';

type Classroom = {
  id: string;
  code: string;
  name: string;
  academicYearId: string;
  levelId: string;
  trackId?: string;
  capacity?: number;
  studentCount: number;
};

export function ClassroomsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const yearsQ = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () =>
      (await api.get('/v1/academic-years')).data.data as Array<{ id: string; name: string; active: boolean }>,
  });

  const levelsQ = useQuery({
    queryKey: ['levels', 'all'],
    queryFn: async () => (await api.get('/v1/levels')).data.data as Array<{ id: string; name: string }>,
  });

  const list = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => (await api.get('/v1/classrooms')).data.data as Classroom[],
  });

  const create = useMutation({
    mutationFn: async (payload: Partial<Classroom>) =>
      (await api.post('/v1/classrooms', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classrooms'] });
      setOpen(false);
    },
  });

  const data = list.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pédagogie"
        title="Classes"
        description="Organisation pédagogique de l'établissement — une classe par cohorte d'élèves."
        actions={
          <Button onClick={() => setOpen((o) => !o)} variant={open ? 'outline' : 'default'}>
            {open ? <><X className="h-4 w-4" /> Annuler</> : <><Plus className="h-4 w-4" /> Nouvelle classe</>}
          </Button>
        }
      />

      {open && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Nouvelle classe</CardTitle>
            <CardDescription>Rattachez la classe à une année académique et à un niveau.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                create.mutate({
                  code: fd.get('code') as string,
                  name: fd.get('name') as string,
                  academicYearId: fd.get('academicYearId') as string,
                  levelId: fd.get('levelId') as string,
                  capacity: fd.get('capacity') ? Number(fd.get('capacity')) : undefined,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Code</Label>
                <Input name="code" placeholder="6A" required className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input name="name" placeholder="6ème A" required />
              </div>
              <div className="space-y-2">
                <Label>Année académique</Label>
                <Select name="academicYearId" required>
                  <option value="">— Sélectionner —</option>
                  {yearsQ.data?.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} {y.active ? '(active)' : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select name="levelId" required>
                  <option value="">— Sélectionner —</option>
                  {levelsQ.data?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacité</Label>
                <Input name="capacity" type="number" placeholder="Optionnel" />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={create.isPending}>
                  Créer la classe
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
              <TH className="text-right">Effectif</TH>
              <TH className="text-right">Capacité</TH>
              <TH>Taux</TH>
            </tr>
          </THead>
          <TBody>
            {data.map((c) => {
              const ratio = c.capacity ? c.studentCount / c.capacity : null;
              return (
                <TR key={c.id}>
                  <TD className="font-mono text-xs">{c.code}</TD>
                  <TD className="font-medium">{c.name}</TD>
                  <TD className="text-right tabular-nums">{c.studentCount}</TD>
                  <TD className="text-right tabular-nums text-muted-foreground">{c.capacity ?? '—'}</TD>
                  <TD>
                    {ratio != null ? (
                      <Badge variant={ratio >= 0.9 ? 'destructive' : ratio >= 0.7 ? 'warning' : 'success'}>
                        {Math.round(ratio * 100)}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
        {data.length === 0 && (
          <EmptyState
            icon={School}
            title="Aucune classe"
            description="Créez vos classes pour pouvoir y affecter les élèves."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Nouvelle classe
              </Button>
            }
          />
        )}
      </DataTable>
    </div>
  );
}