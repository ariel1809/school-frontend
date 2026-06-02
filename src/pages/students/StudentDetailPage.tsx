import { useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  CheckCircle2,
  FileText,
  MapPin,
  GraduationCap,
  Mail,
  Phone,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { InfoList, InfoRow } from '@/components/ui/info-row';
import { EmptyState } from '@/components/ui/empty-state';

type Guardian = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  relationship: string;
  primary: boolean;
  emergencyContact: boolean;
};

type Doc = { id: string; type: string; label?: string; fileUrl: string; verified: boolean };

type Student = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  currentClassroomId?: string;
  status: string;
  notes?: string;
  guardians: Guardian[];
  documents: Doc[];
};

const RELATIONSHIP_LABEL: Record<string, string> = {
  FATHER: 'Père',
  MOTHER: 'Mère',
  GUARDIAN: 'Tuteur',
  GRANDFATHER: 'Grand-père',
  GRANDMOTHER: 'Grand-mère',
  UNCLE: 'Oncle',
  AUNT: 'Tante',
  SIBLING: 'Frère / sœur',
  OTHER: 'Autre',
};

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const justEnrolled = params.get('enrolled') === '1';
  const qc = useQueryClient();

  const studentQ = useQuery({
    queryKey: ['student', id],
    queryFn: async () => (await api.get(`/v1/students/${id}`)).data.data as Student,
    enabled: !!id,
  });

  const classroomsQ = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () =>
      (await api.get('/v1/classrooms')).data.data as Array<{ id: string; name: string; code: string }>,
  });

  const assign = useMutation({
    mutationFn: async (classroomId: string) =>
      (await api.post(`/v1/students/${id}/classroom`, { classroomId })).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', id] }),
  });

  const changeStatus = useMutation({
    mutationFn: async (status: string) =>
      (await api.post(`/v1/students/${id}/status`, null, { params: { status } })).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', id] }),
  });

  if (!studentQ.data) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  const s = studentQ.data;
  const currentClass = classroomsQ.data?.find((c) => c.id === s.currentClassroomId);
  const genderLabel = s.gender === 'MALE' ? 'Masculin' : s.gender === 'FEMALE' ? 'Féminin' : 'Autre';

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/students"
        backLabel="Élèves"
        eyebrow="Fiche élève"
        title={`${s.lastName} ${s.firstName}`}
        description={
          <span className="font-mono text-xs text-muted-foreground">{s.matricule}</span>
        }
      />

      {justEnrolled && (
        <Card className="border-success/30 bg-success-soft animate-fade-in">
          <CardContent className="p-4 flex items-center gap-3 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-semibold text-foreground">Inscription réussie</p>
              <p className="text-sm">
                Matricule attribué : <span className="font-mono">{s.matricule}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start">
          <Avatar src={s.photoUrl} firstName={s.firstName} lastName={s.lastName} size="xl" />
          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <div className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {s.lastName} {s.firstName}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {genderLabel} · Né(e) le {s.dateOfBirth}
                {s.placeOfBirth ? ` à ${s.placeOfBirth}` : ''}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={s.status} />
              {currentClass && (
                <Badge variant="default">
                  <GraduationCap className="h-3 w-3" />
                  {currentClass.code} — {currentClass.name}
                </Badge>
              )}
              {s.nationality && <Badge variant="outline">{s.nationality}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parents / tuteurs</CardTitle>
              <CardDescription>{s.guardians.length} contact(s) renseigné(s).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {s.guardians.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucun parent renseigné.</p>
              ) : (
                s.guardians.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/70 bg-muted/20"
                  >
                    <Avatar firstName={g.firstName} lastName={g.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          {g.lastName} {g.firstName}
                        </span>
                        <Badge variant="outline">{RELATIONSHIP_LABEL[g.relationship] ?? g.relationship}</Badge>
                        {g.primary && <Badge variant="default">Principal</Badge>}
                        {g.emergencyContact && (
                          <Badge variant="warning">
                            <ShieldAlert className="h-3 w-3" /> Urgence
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        {g.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {g.phone}
                          </span>
                        )}
                        {g.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {g.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>{s.documents.length} document(s) attaché(s).</CardDescription>
            </CardHeader>
            <CardContent>
              {s.documents.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Aucun document"
                  description="Les pièces justificatives apparaîtront ici."
                />
              ) : (
                <ul className="divide-y divide-border/60">
                  {s.documents.map((d) => (
                    <li key={d.id}>
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate">{d.label ?? d.type}</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          {d.verified ? (
                            <Badge variant="success">Vérifié</Badge>
                          ) : (
                            <Badge variant="warning">En attente</Badge>
                          )}
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scolarité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoList>
                <InfoRow
                  label="Classe actuelle"
                  value={currentClass ? `${currentClass.code} — ${currentClass.name}` : '—'}
                />
              </InfoList>
              <div className="space-y-2">
                <Select
                  value={s.currentClassroomId ?? ''}
                  onChange={(e) => e.target.value && assign.mutate(e.target.value)}
                >
                  <option value="">Affecter à une classe…</option>
                  {classroomsQ.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="pt-2 border-t border-border/60 space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Actions sur le statut
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => changeStatus.mutate('SUSPENDED')}>
                    Suspendre
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => changeStatus.mutate('TRANSFERRED')}>
                    Transférer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => changeStatus.mutate('WITHDRAWN')}>
                    Retirer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Coordonnées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoList>
                <InfoRow label="Adresse" value={s.address} />
                <InfoRow label="Ville" value={s.city} />
                <InfoRow label="Nationalité" value={s.nationality} />
                <InfoRow label="Téléphone" value={s.phone} />
                <InfoRow label="Email" value={s.email} />
              </InfoList>
            </CardContent>
          </Card>

          {s.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">{s.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}