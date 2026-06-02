import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, extractError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';
type ContractType = 'PERMANENT' | 'FIXED_TERM' | 'INTERIM' | 'FREELANCE' | 'INTERNSHIP';

type Form = {
  photoUrl?: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  hiredAt?: string;
  specialities?: string;
  notes?: string;
  contractType: ContractType;
  contractStart?: string;
  contractEnd?: string;
  monthlySalary?: number;
  weeklyHours?: number;
};

export function TeacherCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    contractType: 'PERMANENT',
  });
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        photoUrl: form.photoUrl,
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        phone: form.phone,
        email: form.email,
        address: form.address,
        city: form.city,
        hiredAt: form.hiredAt || undefined,
        specialities: form.specialities,
        notes: form.notes,
        initialContract: form.contractStart
          ? {
              type: form.contractType,
              startDate: form.contractStart,
              endDate: form.contractEnd || null,
              monthlySalary: form.monthlySalary,
              weeklyHours: form.weeklyHours,
              status: 'ACTIVE',
            }
          : null,
      };
      return (await api.post('/v1/teachers', payload)).data.data as { id: string; matricule: string };
    },
    onSuccess: (data) => navigate(`/teachers/${data.id}?created=1`),
    onError: (err) => setError(extractError(err)),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        backTo="/teachers"
        backLabel="Enseignants"
        eyebrow="Création"
        title="Nouvel enseignant"
        description="Le matricule sera généré automatiquement. Diplômes, matières et affectations sont à compléter dans la fiche."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          create.mutate();
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Identité</CardTitle>
            <CardDescription>État civil et photo (optionnelle).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Nom *">
              <Input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Field>
            <Field label="Prénom *">
              <Input
                required
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
            <Field label="Date de naissance">
              <Input
                type="date"
                value={form.dateOfBirth ?? ''}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </Field>
            <Field label="Photo (URL)">
              <Input
                placeholder="https://…"
                value={form.photoUrl ?? ''}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              />
            </Field>
            <Field label="Spécialités">
              <Input
                placeholder="Mathématiques, Physique…"
                value={form.specialities ?? ''}
                onChange={(e) => setForm({ ...form, specialities: e.target.value })}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Téléphone">
              <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Adresse" className="md:col-span-2">
              <Input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="Ville">
              <Input value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="Date d'embauche">
              <Input
                type="date"
                value={form.hiredAt ?? ''}
                onChange={(e) => setForm({ ...form, hiredAt: e.target.value })}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contrat initial</CardTitle>
            <CardDescription>
              Optionnel — si renseigné, sera créé en statut <strong>actif</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Type">
              <Select
                value={form.contractType}
                onChange={(e) => setForm({ ...form, contractType: e.target.value as ContractType })}
              >
                <option value="PERMANENT">CDI</option>
                <option value="FIXED_TERM">CDD</option>
                <option value="INTERIM">Intérim</option>
                <option value="FREELANCE">Vacataire</option>
                <option value="INTERNSHIP">Stage</option>
              </Select>
            </Field>
            <Field label="Date de début">
              <Input
                type="date"
                value={form.contractStart ?? ''}
                onChange={(e) => setForm({ ...form, contractStart: e.target.value })}
              />
            </Field>
            <Field label="Date de fin (vide = CDI)">
              <Input
                type="date"
                value={form.contractEnd ?? ''}
                onChange={(e) => setForm({ ...form, contractEnd: e.target.value })}
              />
            </Field>
            <Field label="Salaire mensuel">
              <Input
                type="number"
                step="100"
                value={form.monthlySalary ?? ''}
                onChange={(e) =>
                  setForm({ ...form, monthlySalary: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            <Field label="Heures hebdomadaires">
              <Input
                type="number"
                value={form.weeklyHours ?? ''}
                onChange={(e) =>
                  setForm({ ...form, weeklyHours: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Field label="Notes">
              <Textarea
                value={form.notes ?? ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Informations complémentaires…"
              />
            </Field>
          </CardContent>
        </Card>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/teachers">Annuler</Link>
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {create.isPending ? 'Création…' : "Créer l'enseignant"}
          </Button>
        </div>
      </form>
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