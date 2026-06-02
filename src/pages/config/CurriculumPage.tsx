import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useState } from 'react';
import { Plus, X, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

type Cycle = { id: string; code: string; name: string; ordinal: number };
type LevelT = { id: string; cycleId: string; code: string; name: string; ordinal: number };
type Subject = {
  id: string;
  code: string;
  name: string;
  defaultCoefficient: number;
  defaultWeeklyHours: number;
  maxGrade: number;
};

export function CurriculumPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Cursus"
        description="Structure pédagogique de l'établissement : cycles, niveaux et matières enseignées."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <CyclesSection />
        <LevelsSection />
      </div>
      <SubjectsSection />
    </div>
  );
}

function CyclesSection() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['cycles'],
    queryFn: async () => (await api.get('/v1/cycles')).data.data as Cycle[],
  });
  const save = useMutation({
    mutationFn: async (payload: Partial<Cycle>) => (await api.post('/v1/cycles', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cycles'] }),
  });

  const data = list.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cycles</CardTitle>
        <CardDescription>Étapes scolaires globales — maternelle, primaire, secondaire…</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid grid-cols-1 md:grid-cols-[110px_1fr_90px_auto] gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            save.mutate({
              code: fd.get('code') as string,
              name: fd.get('name') as string,
              ordinal: Number(fd.get('ordinal')),
            });
            (e.currentTarget as HTMLFormElement).reset();
          }}
        >
          <Input name="code" placeholder="Code" required className="font-mono" />
          <Input name="name" placeholder="Nom" required />
          <Input name="ordinal" type="number" defaultValue={1} required title="Ordre" />
          <Button type="submit">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </form>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun cycle. Ajoutez-en un ci-dessus.</p>
        ) : (
          <ul className="divide-y divide-border/60 -mx-2">
            {data.map((c) => (
              <li key={c.id} className="py-2.5 px-2 flex justify-between items-center text-sm">
                <span className="flex items-center gap-3">
                  <Badge variant="secondary" className="font-mono">
                    {c.code}
                  </Badge>
                  <span className="font-medium">{c.name}</span>
                </span>
                <span className="text-xs text-muted-foreground">Ordre {c.ordinal}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function LevelsSection() {
  const qc = useQueryClient();
  const cyclesQ = useQuery({
    queryKey: ['cycles'],
    queryFn: async () => (await api.get('/v1/cycles')).data.data as Cycle[],
  });
  const list = useQuery({
    queryKey: ['levels'],
    queryFn: async () => (await api.get('/v1/levels')).data.data as LevelT[],
  });
  const save = useMutation({
    mutationFn: async (payload: Partial<LevelT>) => (await api.post('/v1/levels', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['levels'] }),
  });

  const data = list.data ?? [];
  const cycleNameById = new Map((cyclesQ.data ?? []).map((c) => [c.id, c.name] as const));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Niveaux</CardTitle>
        <CardDescription>Niveaux concrets rattachés à un cycle (CP, 6ème, Terminale…).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid grid-cols-1 md:grid-cols-[140px_110px_1fr_90px_auto] gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            save.mutate({
              cycleId: fd.get('cycleId') as string,
              code: fd.get('code') as string,
              name: fd.get('name') as string,
              ordinal: Number(fd.get('ordinal')),
            });
            (e.currentTarget as HTMLFormElement).reset();
          }}
        >
          <Select name="cycleId" required>
            <option value="">— Cycle —</option>
            {cyclesQ.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input name="code" placeholder="Code" required className="font-mono" />
          <Input name="name" placeholder="Nom" required />
          <Input name="ordinal" type="number" defaultValue={1} required />
          <Button type="submit">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </form>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun niveau. Créez d'abord un cycle.</p>
        ) : (
          <ul className="divide-y divide-border/60 -mx-2">
            {data.map((l) => (
              <li key={l.id} className="py-2.5 px-2 flex justify-between items-center text-sm">
                <span className="flex items-center gap-3 min-w-0">
                  <Badge variant="secondary" className="font-mono">
                    {l.code}
                  </Badge>
                  <span className="font-medium truncate">{l.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {cycleNameById.get(l.cycleId) ?? '—'}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground shrink-0">Ordre {l.ordinal}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function SubjectsSection() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const list = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => (await api.get('/v1/subjects')).data.data as Subject[],
  });
  const save = useMutation({
    mutationFn: async (payload: Partial<Subject>) => (await api.post('/v1/subjects', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      setOpen(false);
    },
  });

  const data = list.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Matières</CardTitle>
            <CardDescription>Disciplines enseignées avec coefficients et heures par défaut.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen((o) => !o)} variant={open ? 'outline' : 'default'}>
            {open ? <><X className="h-4 w-4" /> Annuler</> : <><Plus className="h-4 w-4" /> Nouvelle matière</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <form
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 p-4 rounded-md border border-border/70 bg-muted/30 animate-fade-in"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              save.mutate({
                code: fd.get('code') as string,
                name: fd.get('name') as string,
                defaultCoefficient: Number(fd.get('coef')),
                defaultWeeklyHours: Number(fd.get('hrs')),
                maxGrade: Number(fd.get('max')),
              });
            }}
          >
            <div className="space-y-2">
              <Label>Code</Label>
              <Input name="code" required className="font-mono" />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Nom</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-2">
              <Label>Coefficient</Label>
              <Input name="coef" type="number" step="0.5" defaultValue={1} required />
            </div>
            <div className="space-y-2">
              <Label>Heures/sem.</Label>
              <Input name="hrs" type="number" defaultValue={2} />
            </div>
            <div className="space-y-2">
              <Label>Note max.</Label>
              <Input name="max" type="number" step="0.5" defaultValue={20} required />
            </div>
            <div className="md:col-span-2 lg:col-span-5">
              <Button type="submit" disabled={save.isPending}>
                Créer la matière
              </Button>
            </div>
          </form>
        )}
        {data.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Aucune matière"
            description="Ajoutez les disciplines enseignées dans votre établissement."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Nouvelle matière
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Code</TH>
                <TH>Nom</TH>
                <TH className="text-right">Coefficient</TH>
                <TH className="text-right">Heures/sem.</TH>
                <TH className="text-right">Note max.</TH>
              </tr>
            </THead>
            <TBody>
              {data.map((s) => (
                <TR key={s.id}>
                  <TD className="font-mono text-xs">{s.code}</TD>
                  <TD className="font-medium">{s.name}</TD>
                  <TD className="text-right tabular-nums">{s.defaultCoefficient}</TD>
                  <TD className="text-right tabular-nums text-muted-foreground">{s.defaultWeeklyHours ?? '—'}</TD>
                  <TD className="text-right tabular-nums">{s.maxGrade}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}