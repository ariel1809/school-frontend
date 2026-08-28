import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, extractError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Trash2, Plus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Stepper } from '@/components/ui/stepper';
import { Badge } from '@/components/ui/badge';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';
type Relationship =
  | 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'GRANDFATHER' | 'GRANDMOTHER'
  | 'UNCLE' | 'AUNT' | 'SIBLING' | 'OTHER';
type DocumentType =
  | 'BIRTH_CERTIFICATE' | 'PHOTO' | 'PREVIOUS_REPORT_CARD' | 'PREVIOUS_DIPLOMA'
  | 'MEDICAL_CERTIFICATE' | 'ID_CARD' | 'TRANSFER_CERTIFICATE' | 'OTHER';

type GuardianForm = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  address?: string;
  profession?: string;
  employer?: string;
  nationalId?: string;
  relationship: Relationship;
  primary: boolean;
  emergencyContact: boolean;
};

type DocumentForm = {
  type: DocumentType;
  label?: string;
  fileUrl: string;
  contentType?: string;
  sizeBytes?: number;
};

type EnrollmentForm = {
  photoUrl?: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  placeOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  classroomId?: string;
  academicYearId?: string;
  guardians: GuardianForm[];
  documents: DocumentForm[];
  notes?: string;
};

const STEPS = [
  { key: 'personal', label: 'Identité' },
  { key: 'academic', label: 'Classe' },
  { key: 'guardians', label: 'Parents' },
  { key: 'documents', label: 'Documents' },
  { key: 'review', label: 'Validation' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  BIRTH_CERTIFICATE: 'Acte de naissance',
  PHOTO: 'Photo',
  PREVIOUS_REPORT_CARD: 'Bulletin précédent',
  PREVIOUS_DIPLOMA: 'Diplôme précédent',
  MEDICAL_CERTIFICATE: 'Certificat médical',
  ID_CARD: "Pièce d'identité",
  TRANSFER_CERTIFICATE: 'Certificat de transfert',
  OTHER: 'Autre',
};

const RELATIONSHIP_LABEL: Record<Relationship, string> = {
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

export function EnrollmentWizardPage() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState<EnrollmentForm>({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    dateOfBirth: '',
    guardians: [
      {
        firstName: '',
        lastName: '',
        relationship: 'FATHER',
        primary: true,
        emergencyContact: true,
      },
    ],
    documents: [],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const classroomsQ = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () =>
      (await api.get('/v1/classrooms')).data.data as Array<{ id: string; name: string; code: string }>,
  });

  const yearsQ = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () =>
      (await api.get('/v1/academic-years')).data.data as Array<{
        id: string;
        code: string;
        name: string;
        active: boolean;
      }>,
  });

  const enroll = useMutation({
    mutationFn: async (payload: EnrollmentForm) =>
      (await api.post('/v1/students/enroll', payload)).data.data as {
        id: string;
        matricule: string;
      },
    onSuccess: (data) => navigate(`/students/${data.id}?enrolled=1`),
    onError: (err) => setServerError(extractError(err)),
  });

  const step: StepKey = STEPS[stepIdx].key;

  function validate(): string[] {
    const errs: string[] = [];
    if (step === 'personal') {
      if (!form.firstName.trim()) errs.push('Prénom requis');
      if (!form.lastName.trim()) errs.push('Nom requis');
      if (!form.dateOfBirth) errs.push('Date de naissance requise');
      else if (new Date(form.dateOfBirth) >= new Date()) errs.push('Date de naissance doit être passée');
    }
    if (step === 'guardians') {
      if (form.guardians.length === 0) errs.push('Au moins un parent/tuteur requis');
      form.guardians.forEach((g, i) => {
        if (!g.firstName.trim() || !g.lastName.trim()) errs.push(`Parent #${i + 1} : nom & prénom requis`);
        if (!g.phone && !g.email) errs.push(`Parent #${i + 1} : téléphone ou email requis`);
      });
      if (!form.guardians.some((g) => g.primary)) errs.push('Marquez au moins un parent comme principal');
    }
    return errs;
  }

  function next() {
    const errs = validate();
    setErrors(errs);
    if (errs.length === 0 && stepIdx < STEPS.length - 1) {
      setStepIdx(stepIdx + 1);
      setServerError(null);
    }
  }

  function back() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  function submit() {
    setServerError(null);
    enroll.mutate(form);
  }

  function updateGuardian(i: number, patch: Partial<GuardianForm>) {
    setForm({
      ...form,
      guardians: form.guardians.map((g, j) => (j === i ? { ...g, ...patch } : g)),
    });
  }

  function updateDocument(i: number, patch: Partial<DocumentForm>) {
    setForm({
      ...form,
      documents: form.documents.map((d, j) => (j === i ? { ...d, ...patch } : d)),
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        backTo="/students"
        backLabel="Élèves"
        eyebrow="Inscription"
        title="Nouvelle inscription"
        description={`Renseignez les informations en ${STEPS.length} étapes. Le matricule sera généré automatiquement.`}
      />

      <Stepper steps={STEPS as unknown as { key: string; label: string }[]} current={stepIdx} onStepClick={setStepIdx} />

      <div className="animate-fade-in">
        {step === 'personal' && (
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>État civil et coordonnées de l'élève.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Nom *">
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </Field>
              <Field label="Prénom *">
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </Field>
              <Field label="Genre *">
                <Select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                >
                  <option value="MALE">Masculin</option>
                  <option value="FEMALE">Féminin</option>
                  <option value="OTHER">Autre</option>
                </Select>
              </Field>
              <Field label="Date de naissance *">
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </Field>
              <Field label="Lieu de naissance">
                <Input
                  value={form.placeOfBirth ?? ''}
                  onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })}
                />
              </Field>
              <Field label="Nationalité">
                <Input
                  value={form.nationality ?? ''}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                />
              </Field>
              <Field label="Adresse" className="md:col-span-2">
                <Input
                  value={form.address ?? ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </Field>
              <Field label="Ville">
                <Input value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="URL de la photo">
                <Input
                  placeholder="https://…"
                  value={form.photoUrl ?? ''}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                />
              </Field>
              <Field label="Téléphone (de l'élève)">
                <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
            </CardContent>
          </Card>
        )}

        {step === 'academic' && (
          <Card>
            <CardHeader>
              <CardTitle>Affectation académique</CardTitle>
              <CardDescription>
                Si la classe n'est pas encore décidée, l'élève sera marqué <strong>pré-inscrit</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Année académique">
                <Select
                  value={form.academicYearId ?? ''}
                  onChange={(e) => setForm({ ...form, academicYearId: e.target.value || undefined })}
                >
                  <option value="">— Année active —</option>
                  {yearsQ.data?.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} {y.active ? '(active)' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Classe">
                <Select
                  value={form.classroomId ?? ''}
                  onChange={(e) => setForm({ ...form, classroomId: e.target.value || undefined })}
                >
                  <option value="">— Pré-inscription (à affecter) —</option>
                  {classroomsQ.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Notes / observations" className="md:col-span-2">
                <Textarea
                  value={form.notes ?? ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
            </CardContent>
          </Card>
        )}

        {step === 'guardians' && (
          <Card>
            <CardHeader>
              <CardTitle>Parents / tuteurs</CardTitle>
              <CardDescription>
                Au moins un parent est requis. Marquez celui qui est le contact principal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.guardians.map((g, i) => (
                <div key={i} className="rounded-lg border border-border/70 bg-muted/20 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-base">Parent #{i + 1}</h3>
                      {g.primary && <Badge variant="default">Principal</Badge>}
                    </div>
                    {form.guardians.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setForm({ ...form, guardians: form.guardians.filter((_, j) => j !== i) })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="Nom *"
                      value={g.lastName}
                      onChange={(e) => updateGuardian(i, { lastName: e.target.value })}
                    />
                    <Input
                      placeholder="Prénom *"
                      value={g.firstName}
                      onChange={(e) => updateGuardian(i, { firstName: e.target.value })}
                    />
                    <Select
                      value={g.relationship}
                      onChange={(e) => updateGuardian(i, { relationship: e.target.value as Relationship })}
                    >
                      {(Object.keys(RELATIONSHIP_LABEL) as Relationship[]).map((r) => (
                        <option key={r} value={r}>
                          {RELATIONSHIP_LABEL[r]}
                        </option>
                      ))}
                    </Select>
                    <Input
                      placeholder="Téléphone"
                      value={g.phone ?? ''}
                      onChange={(e) => updateGuardian(i, { phone: e.target.value })}
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={g.email ?? ''}
                      onChange={(e) => updateGuardian(i, { email: e.target.value })}
                    />
                    <Input
                      placeholder="Profession"
                      value={g.profession ?? ''}
                      onChange={(e) => updateGuardian(i, { profession: e.target.value })}
                    />
                    <Input
                      placeholder="Adresse"
                      className="md:col-span-2"
                      value={g.address ?? ''}
                      onChange={(e) => updateGuardian(i, { address: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-5 text-sm pt-1 border-t border-border/60">
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="radio"
                        name="primary"
                        className="accent-primary"
                        checked={g.primary}
                        onChange={() => {
                          setForm({
                            ...form,
                            guardians: form.guardians.map((gg, j) => ({ ...gg, primary: j === i })),
                          });
                        }}
                      />
                      Contact principal
                    </label>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={g.emergencyContact}
                        onChange={(e) => updateGuardian(i, { emergencyContact: e.target.checked })}
                      />
                      Contact d'urgence
                    </label>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm({
                    ...form,
                    guardians: [
                      ...form.guardians,
                      {
                        firstName: '',
                        lastName: '',
                        relationship: 'MOTHER',
                        primary: false,
                        emergencyContact: false,
                      },
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Ajouter un parent / tuteur
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'documents' && (
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Optionnel. Indiquez l'URL d'un document déjà téléversé (les uploads directs arriveront prochainement).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.documents.map((d, i) => (
                <div key={i} className="rounded-lg border border-border/70 bg-muted/20 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-semibold">Document #{i + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setForm({ ...form, documents: form.documents.filter((_, j) => j !== i) })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Select
                      value={d.type}
                      onChange={(e) => updateDocument(i, { type: e.target.value as DocumentType })}
                    >
                      {(Object.keys(DOCUMENT_TYPE_LABEL) as DocumentType[]).map((t) => (
                        <option key={t} value={t}>
                          {DOCUMENT_TYPE_LABEL[t]}
                        </option>
                      ))}
                    </Select>
                    <Input
                      placeholder="Libellé (optionnel)"
                      value={d.label ?? ''}
                      onChange={(e) => updateDocument(i, { label: e.target.value })}
                    />
                    <Input
                      placeholder="URL du fichier"
                      className="md:col-span-2 font-mono text-xs"
                      value={d.fileUrl}
                      onChange={(e) => updateDocument(i, { fileUrl: e.target.value })}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm({
                    ...form,
                    documents: [...form.documents, { type: 'BIRTH_CERTIFICATE', fileUrl: '' }],
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Ajouter un document
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
              <CardDescription>Vérifiez les informations puis validez l'inscription.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ReviewRow
                label="Élève"
                value={`${form.lastName} ${form.firstName} — ${form.gender}, né(e) le ${form.dateOfBirth}`}
              />
              <ReviewRow label="Lieu de naissance" value={form.placeOfBirth ?? '—'} />
              <ReviewRow
                label="Adresse"
                value={`${form.address ?? '—'}${form.city ? ` (${form.city})` : ''}`}
              />
              <ReviewRow
                label="Classe"
                value={
                  form.classroomId
                    ? classroomsQ.data?.find((c) => c.id === form.classroomId)?.name ?? '—'
                    : 'Pré-inscription (à affecter)'
                }
              />
              <ReviewRow
                label="Parents/tuteurs"
                value={`${form.guardians.length} renseigné(s) — principal : ${
                  form.guardians.find((g) => g.primary)?.lastName ?? '—'
                }`}
              />
              <ReviewRow label="Documents" value={`${form.documents.length} document(s)`} />
              {serverError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm text-destructive mt-3"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive animate-fade-in"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold mb-1">Corrigez ces points avant de continuer :</div>
            <ul className="list-disc list-inside space-y-0.5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2 pt-2">
        <Button variant="outline" onClick={back} disabled={stepIdx === 0}>
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </Button>
        {step !== 'review' ? (
          <Button onClick={next}>
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={enroll.isPending}>
            {enroll.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {enroll.isPending ? 'Inscription…' : "Valider l'inscription"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-border/60 last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}