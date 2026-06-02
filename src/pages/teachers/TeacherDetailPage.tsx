import { useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CheckCircle2, Trash2, Plus, X, GraduationCap, BookOpen, FileSignature, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { InfoList, InfoRow } from '@/components/ui/info-row';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';

type Diploma = { id: string; title: string; field?: string; institution?: string; obtainedYear?: number };
type Contract = {
  id: string;
  type: string;
  startDate: string;
  endDate?: string;
  monthlySalary?: number;
  weeklyHours?: number;
  status: string;
};
type Teacher = {
  id: string;
  matricule: string;
  photoUrl?: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  hiredAt?: string;
  seniorityYears?: number;
  specialities?: string;
  notes?: string;
  status: string;
  diplomas: Diploma[];
  subjectIds: string[];
  classroomIds: string[];
  currentContract?: Contract;
};

const TABS = [
  { key: 'identity', label: 'Identité', icon: User },
  { key: 'diplomas', label: 'Diplômes', icon: GraduationCap },
  { key: 'assignments', label: 'Affectations', icon: BookOpen },
  { key: 'contracts', label: 'Contrats', icon: FileSignature },
] as const;
type Tab = (typeof TABS)[number]['key'];

const CONTRACT_TYPE_LABEL: Record<string, string> = {
  PERMANENT: 'CDI',
  FIXED_TERM: 'CDD',
  INTERIM: 'Intérim',
  FREELANCE: 'Vacataire',
  INTERNSHIP: 'Stage',
};

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const justCreated = params.get('created') === '1';
  const [tab, setTab] = useState<Tab>('identity');

  const teacherQ = useQuery({
    queryKey: ['teacher', id],
    queryFn: async () => (await api.get(`/v1/teachers/${id}`)).data.data as Teacher,
    enabled: !!id,
  });

  if (!teacherQ.data) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  const t = teacherQ.data;
  const genderLabel = t.gender === 'MALE' ? 'Masculin' : t.gender === 'FEMALE' ? 'Féminin' : 'Autre';

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/teachers"
        backLabel="Enseignants"
        eyebrow="Fiche enseignant"
        title={`${t.lastName} ${t.firstName}`}
        description={<span className="font-mono text-xs text-muted-foreground">{t.matricule}</span>}
      />

      {justCreated && (
        <Card className="border-success/30 bg-success-soft animate-fade-in">
          <CardContent className="p-4 flex items-center gap-3 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-semibold text-foreground">Enseignant créé</p>
              <p className="text-sm">
                Matricule : <span className="font-mono">{t.matricule}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start">
          <Avatar src={t.photoUrl} firstName={t.firstName} lastName={t.lastName} size="xl" />
          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <div className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {t.lastName} {t.firstName}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {genderLabel}
                {t.dateOfBirth && ` · Né(e) le ${t.dateOfBirth}`}
                {t.seniorityYears != null && ` · ${t.seniorityYears} an${t.seniorityYears > 1 ? 's' : ''} d'ancienneté`}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={t.status} />
              {t.specialities && <Badge variant="default">{t.specialities}</Badge>}
              {t.currentContract && (
                <Badge variant="info">{CONTRACT_TYPE_LABEL[t.currentContract.type] ?? t.currentContract.type}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/70 -mb-px overflow-x-auto">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            type="button"
            onClick={() => setTab(tabDef.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === tabDef.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <tabDef.icon className="h-4 w-4" />
            {tabDef.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {tab === 'identity' && <IdentityTab teacher={t} />}
        {tab === 'diplomas' && <DiplomasTab teacherId={t.id} diplomas={t.diplomas} />}
        {tab === 'assignments' && <AssignmentsTab teacher={t} />}
        {tab === 'contracts' && <ContractsTab teacherId={t.id} />}
      </div>
    </div>
  );
}

// ---------------- Identity ----------------

function IdentityTab({ teacher: t }: { teacher: Teacher }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoList>
            <InfoRow label="Téléphone" value={t.phone} />
            <InfoRow label="Email" value={t.email} />
            <InfoRow label="Adresse" value={t.address} />
            <InfoRow label="Ville" value={t.city} />
          </InfoList>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Carrière</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoList>
            <InfoRow label="Embauché(e) le" value={t.hiredAt} />
            <InfoRow
              label="Ancienneté"
              value={t.seniorityYears != null ? `${t.seniorityYears} an${t.seniorityYears > 1 ? 's' : ''}` : undefined}
            />
            <InfoRow label="Spécialités" value={t.specialities} />
            <InfoRow label="Notes" value={t.notes} />
          </InfoList>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Diplomas ----------------

function DiplomasTab({ teacherId, diplomas }: { teacherId: string; diplomas: Diploma[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const add = useMutation({
    mutationFn: async (payload: Partial<Diploma>) =>
      (await api.post(`/v1/teachers/${teacherId}/diplomas`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', teacherId] });
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: async (diplomaId: string) => api.delete(`/v1/teachers/${teacherId}/diplomas/${diplomaId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher', teacherId] }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Diplômes</CardTitle>
            <CardDescription>Parcours académique et titres obtenus.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen((o) => !o)} variant={open ? 'outline' : 'default'}>
            {open ? <><X className="h-4 w-4" /> Annuler</> : <><Plus className="h-4 w-4" /> Ajouter</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <form
            className="grid gap-4 md:grid-cols-2 p-4 rounded-md border border-border/70 bg-muted/30 animate-fade-in"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              add.mutate({
                title: fd.get('title') as string,
                field: (fd.get('field') as string) || undefined,
                institution: (fd.get('institution') as string) || undefined,
                obtainedYear: fd.get('obtainedYear') ? Number(fd.get('obtainedYear')) : undefined,
              });
            }}
          >
            <div className="space-y-2 md:col-span-2">
              <Label>Intitulé du diplôme</Label>
              <Input name="title" required />
            </div>
            <div className="space-y-2">
              <Label>Domaine</Label>
              <Input name="field" placeholder="Mathématiques" />
            </div>
            <div className="space-y-2">
              <Label>Établissement</Label>
              <Input name="institution" />
            </div>
            <div className="space-y-2">
              <Label>Année d'obtention</Label>
              <Input name="obtainedYear" type="number" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={add.isPending}>
                Ajouter le diplôme
              </Button>
            </div>
          </form>
        )}
        {diplomas.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Aucun diplôme renseigné"
            description="Documentez le parcours académique pour faciliter les vérifications."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {diplomas.map((d) => (
              <li key={d.id} className="py-4 flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">{d.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {[d.field, d.institution, d.obtainedYear].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove.mutate(d.id)}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- Assignments ----------------

function AssignmentsTab({ teacher: t }: { teacher: Teacher }) {
  const qc = useQueryClient();
  const subjectsQ = useQuery({
    queryKey: ['subjects'],
    queryFn: async () =>
      (await api.get('/v1/subjects')).data.data as Array<{ id: string; code: string; name: string }>,
  });
  const classroomsQ = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () =>
      (await api.get('/v1/classrooms')).data.data as Array<{ id: string; code: string; name: string }>,
  });

  const [selectedSubjects, setSelectedSubjects] = useState(new Set(t.subjectIds));
  const [selectedClassrooms, setSelectedClassrooms] = useState(new Set(t.classroomIds));

  const saveSubjects = useMutation({
    mutationFn: async () =>
      api.put(`/v1/teachers/${t.id}/subjects`, { subjectIds: Array.from(selectedSubjects) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher', t.id] }),
  });
  const saveClassrooms = useMutation({
    mutationFn: async () =>
      api.put(`/v1/teachers/${t.id}/classrooms`, { classroomIds: Array.from(selectedClassrooms) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher', t.id] }),
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Matières enseignées</CardTitle>
              <CardDescription>{selectedSubjects.size} sélection(s)</CardDescription>
            </div>
            <Button size="sm" onClick={() => saveSubjects.mutate()} disabled={saveSubjects.isPending}>
              Enregistrer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[420px] overflow-y-auto scroll-thin pr-1">
            {subjectsQ.data?.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={selectedSubjects.has(s.id)}
                  onChange={(e) => {
                    const next = new Set(selectedSubjects);
                    if (e.target.checked) next.add(s.id);
                    else next.delete(s.id);
                    setSelectedSubjects(next);
                  }}
                />
                <Badge variant="secondary" className="font-mono shrink-0">
                  {s.code}
                </Badge>
                <span className="text-sm">{s.name}</span>
              </label>
            ))}
            {subjectsQ.data?.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-4 px-2">
                Aucune matière. Configurez-les dans Cursus.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Classes assignées</CardTitle>
              <CardDescription>{selectedClassrooms.size} sélection(s)</CardDescription>
            </div>
            <Button size="sm" onClick={() => saveClassrooms.mutate()} disabled={saveClassrooms.isPending}>
              Enregistrer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[420px] overflow-y-auto scroll-thin pr-1">
            {classroomsQ.data?.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={selectedClassrooms.has(c.id)}
                  onChange={(e) => {
                    const next = new Set(selectedClassrooms);
                    if (e.target.checked) next.add(c.id);
                    else next.delete(c.id);
                    setSelectedClassrooms(next);
                  }}
                />
                <Badge variant="secondary" className="font-mono shrink-0">
                  {c.code}
                </Badge>
                <span className="text-sm">{c.name}</span>
              </label>
            ))}
            {classroomsQ.data?.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-4 px-2">Aucune classe créée.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Contracts ----------------

function ContractsTab({ teacherId }: { teacherId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractsQ = useQuery({
    queryKey: ['contracts', teacherId],
    queryFn: async () => (await api.get(`/v1/teachers/${teacherId}/contracts`)).data.data as Contract[],
  });

  const add = useMutation({
    mutationFn: async (payload: Partial<Contract>) =>
      (await api.post(`/v1/teachers/${teacherId}/contracts`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts', teacherId] });
      qc.invalidateQueries({ queryKey: ['teacher', teacherId] });
      setOpen(false);
    },
    onError: (err) => setError(extractError(err)),
  });

  const terminate = useMutation({
    mutationFn: async (contractId: string) =>
      api.post(`/v1/teachers/${teacherId}/contracts/${contractId}/terminate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts', teacherId] });
      qc.invalidateQueries({ queryKey: ['teacher', teacherId] });
    },
  });

  const list = contractsQ.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Contrats</CardTitle>
            <CardDescription>
              Historique des contrats. Le précédent est automatiquement terminé à la création d'un nouveau.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setOpen((o) => !o);
              setError(null);
            }}
            variant={open ? 'outline' : 'default'}
          >
            {open ? <><X className="h-4 w-4" /> Annuler</> : <><Plus className="h-4 w-4" /> Nouveau contrat</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <form
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4 rounded-md border border-border/70 bg-muted/30 animate-fade-in"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              add.mutate({
                type: fd.get('type') as string,
                startDate: fd.get('startDate') as string,
                endDate: (fd.get('endDate') as string) || undefined,
                monthlySalary: fd.get('monthlySalary') ? Number(fd.get('monthlySalary')) : undefined,
                weeklyHours: fd.get('weeklyHours') ? Number(fd.get('weeklyHours')) : undefined,
                status: 'ACTIVE',
              });
            }}
          >
            <div className="space-y-2">
              <Label>Type</Label>
              <Select name="type" required defaultValue="PERMANENT">
                <option value="PERMANENT">CDI</option>
                <option value="FIXED_TERM">CDD</option>
                <option value="INTERIM">Intérim</option>
                <option value="FREELANCE">Vacataire</option>
                <option value="INTERNSHIP">Stage</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label>Date de fin (vide = CDI)</Label>
              <Input name="endDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label>Salaire mensuel</Label>
              <Input name="monthlySalary" type="number" step="100" />
            </div>
            <div className="space-y-2">
              <Label>Heures hebdomadaires</Label>
              <Input name="weeklyHours" type="number" />
            </div>
            {error && <p className="md:col-span-2 lg:col-span-3 text-sm text-destructive">{error}</p>}
            <div className="md:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={add.isPending}>
                Créer le contrat (et terminer le précédent)
              </Button>
            </div>
          </form>
        )}

        {list.length === 0 ? (
          <EmptyState icon={FileSignature} title="Aucun contrat" description="Aucun contrat n'est encore enregistré." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Type</TH>
                <TH>Période</TH>
                <TH className="text-right">Salaire</TH>
                <TH className="text-right">Heures/sem.</TH>
                <TH>Statut</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {list.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <Badge variant="outline">{CONTRACT_TYPE_LABEL[c.type] ?? c.type}</Badge>
                  </TD>
                  <TD className="text-sm text-muted-foreground">
                    {c.startDate} → {c.endDate ?? <span className="italic">indéterminé</span>}
                  </TD>
                  <TD className="text-right tabular-nums">{c.monthlySalary ?? '—'}</TD>
                  <TD className="text-right tabular-nums">{c.weeklyHours ?? '—'}</TD>
                  <TD>{c.status === 'ACTIVE' ? <Badge variant="success">Actif</Badge> : <Badge variant="secondary">{c.status}</Badge>}</TD>
                  <TD className="text-right">
                    {c.status === 'ACTIVE' && (
                      <Button size="sm" variant="outline" onClick={() => terminate.mutate(c.id)}>
                        Terminer
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}