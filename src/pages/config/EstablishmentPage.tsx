import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FileUploader } from '@/components/ui/file-uploader';

type Establishment = Record<string, any> & { configured: boolean; logoUrl?: string | null };

const FIELD_GROUPS: { title: string; description?: string; fields: { key: string; label: string; type?: string; placeholder?: string }[] }[] = [
  {
    title: 'Identité',
    description: "Nom officiel et devise de l'établissement.",
    fields: [
      { key: 'name', label: "Nom de l'établissement", placeholder: 'Lycée Léopold Sédar Senghor' },
      { key: 'motto', label: 'Devise', placeholder: 'Discipline · Travail · Excellence' },
    ],
  },
  {
    title: 'Contact',
    fields: [
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'website', label: 'Site web', placeholder: 'https://…' },
    ],
  },
  {
    title: 'Localisation',
    fields: [
      { key: 'address', label: 'Adresse' },
      { key: 'city', label: 'Ville' },
      { key: 'country', label: 'Pays' },
    ],
  },
  {
    title: 'Préférences régionales',
    description: 'Affecte les formats utilisés dans toute la plateforme.',
    fields: [
      { key: 'currency', label: 'Monnaie', placeholder: 'XAF, EUR, USD…' },
      { key: 'language', label: 'Langue', placeholder: 'fr, en' },
      { key: 'timezone', label: 'Fuseau horaire', placeholder: 'Africa/Douala' },
    ],
  },
];

export function EstablishmentPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Establishment>({ configured: false });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['establishment'],
    queryFn: async () => (await api.get('/v1/config/establishment')).data.data as Establishment,
  });

  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);

  const save = useMutation({
    mutationFn: async (data: Establishment) =>
      (await api.put('/v1/config/establishment', data)).data.data as Establishment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['establishment'] });
      setMsg('Modifications enregistrées');
      setTimeout(() => setMsg(null), 4000);
    },
    onError: (e) => setErr(extractError(e)),
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/v1/config/establishment/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data as Establishment;
    },
    onSuccess: (data) => {
      qc.setQueryData(['establishment'], data);
      setForm((prev) => ({ ...prev, logoUrl: data.logoUrl }));
      setMsg('Logo mis à jour');
      setTimeout(() => setMsg(null), 4000);
    },
  });

  const removeLogo = useMutation({
    mutationFn: async () => {
      const res = await api.delete('/v1/config/establishment/logo');
      return res.data.data as Establishment;
    },
    onSuccess: (data) => {
      qc.setQueryData(['establishment'], data);
      setForm((prev) => ({ ...prev, logoUrl: data.logoUrl ?? null }));
      setMsg('Logo retiré');
      setTimeout(() => setMsg(null), 4000);
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Établissement"
        description="Informations qui apparaîtront sur les documents, en-têtes et factures."
      />

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          setErr(null);
          save.mutate(form);
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>
              Affiché sur les documents, factures et en-têtes. Recommandé : PNG ou SVG, fond transparent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              value={form.logoUrl}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              maxSizeMB={5}
              helperText="Visible sans authentification (utilisé sur les documents et la page de connexion)."
              onUpload={async (file) => {
                await uploadLogo.mutateAsync(file);
              }}
              onRemove={form.logoUrl ? async () => { await removeLogo.mutateAsync(); } : undefined}
            />
          </CardContent>
        </Card>

        {FIELD_GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
              {group.description && <CardDescription>{group.description}</CardDescription>}
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {group.fields.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label>{f.label}</Label>
                  <Input
                    type={f.type ?? 'text'}
                    placeholder={f.placeholder}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {msg && (
          <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success-soft px-3 py-2.5 text-sm text-success animate-fade-in">
            <CheckCircle2 className="h-4 w-4" />
            <span>{msg}</span>
          </div>
        )}
        {err && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}