import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Plus, X, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

type AcademicYear = {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  periodModel: 'TRIMESTER' | 'SEMESTER' | 'SEQUENCE' | 'MODULE' | 'CUSTOM';
};

const PERIOD_LABEL: Record<AcademicYear['periodModel'], string> = {
  TRIMESTER: 'Trimestres',
  SEMESTER: 'Semestres',
  SEQUENCE: 'Séquences',
  MODULE: 'Modules',
  CUSTOM: 'Personnalisé',
};

export function AcademicYearsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const years = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/v1/academic-years')).data.data as AcademicYear[],
  });

  const create = useMutation({
    mutationFn: async (payload: Partial<AcademicYear>) =>
      (await api.post('/v1/academic-years', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic-years'] });
      setCreating(false);
    },
  });

  const activate = useMutation({
    mutationFn: async (id: string) => (await api.post(`/v1/academic-years/${id}/activate`)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-years'] }),
  });

  const data = years.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Années académiques"
        description="Définissez les années scolaires et leur modèle de périodes (trimestres, semestres…)."
        actions={
          <Button onClick={() => setCreating((c) => !c)} variant={creating ? 'outline' : 'default'}>
            {creating ? <><X className="h-4 w-4" /> Annuler</> : <><Plus className="h-4 w-4" /> Nouvelle année</>}
          </Button>
        }
      />

      {creating && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Nouvelle année académique</CardTitle>
            <CardDescription>
              L'année sera créée inactive — activez-la quand elle est prête à être utilisée.
            </CardDescription>
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
                  startDate: fd.get('startDate') as string,
                  endDate: fd.get('endDate') as string,
                  periodModel: fd.get('periodModel') as AcademicYear['periodModel'],
                  active: false,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Code</Label>
                <Input name="code" placeholder="2025-2026" required className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input name="name" placeholder="Année scolaire 2025-2026" required />
              </div>
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input name="startDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input name="endDate" type="date" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Modèle de périodes</Label>
                <Select name="periodModel" required defaultValue="TRIMESTER">
                  <option value="TRIMESTER">Trimestres</option>
                  <option value="SEMESTER">Semestres</option>
                  <option value="SEQUENCE">Séquences</option>
                  <option value="MODULE">Modules</option>
                  <option value="CUSTOM">Personnalisé</option>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={create.isPending}>
                  Créer l'année
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
              <TH>Modèle</TH>
              <TH>Début</TH>
              <TH>Fin</TH>
              <TH>État</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {data.map((y) => (
              <TR key={y.id}>
                <TD className="font-mono text-xs">{y.code}</TD>
                <TD className="font-medium">{y.name}</TD>
                <TD>
                  <Badge variant="outline">{PERIOD_LABEL[y.periodModel]}</Badge>
                </TD>
                <TD className="text-sm text-muted-foreground">{y.startDate}</TD>
                <TD className="text-sm text-muted-foreground">{y.endDate}</TD>
                <TD>
                  {y.active ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TD>
                <TD className="text-right">
                  {!y.active && (
                    <Button size="sm" variant="outline" onClick={() => activate.mutate(y.id)}>
                      Activer
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {data.length === 0 && (
          <EmptyState
            icon={Calendar}
            title="Aucune année académique"
            description="Créez votre première année académique pour commencer."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Nouvelle année
              </Button>
            }
          />
        )}
      </DataTable>
    </div>
  );
}