import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, extractError } from '@/lib/api';
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Stepper } from '@/components/ui/stepper';

type Establishment = {
  name?: string;
  motto?: string;
  logoUrl?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone?: string;
  language?: string;
  currency?: string;
  configured: boolean;
};

const STEPS = [
  { key: 'establishment', label: 'Établissement' },
  { key: 'academicYear', label: 'Année académique' },
  { key: 'curriculum', label: 'Cursus' },
  { key: 'done', label: 'Terminé' },
];

export function SetupWizardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const establishment = useQuery({
    queryKey: ['establishment'],
    queryFn: async () => (await api.get('/v1/config/establishment')).data.data as Establishment,
  });

  const [form, setForm] = useState<Establishment>({ configured: false });

  const save = useMutation({
    mutationFn: async (data: Establishment) =>
      (await api.put('/v1/config/establishment', data)).data.data as Establishment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['establishment'] }),
  });

  const step = STEPS[stepIdx].key;

  function next() {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  }
  function back() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  async function submitEstablishment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const merged = { ...establishment.data, ...form };
      await save.mutateAsync(merged);
      next();
    } catch (err) {
      setError(extractError(err));
    }
  }

  return (
    <div className="min-h-screen bg-background bg-grid-dots p-6">
      <div className="max-w-3xl mx-auto space-y-8 py-8">
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">{t('app.name')}</div>
            <div className="text-xs text-muted-foreground">{t('app.tagline')}</div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-xs uppercase tracking-wider text-accent font-semibold">
            Configuration initiale
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
            Configurons votre établissement
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Quelques étapes pour personnaliser la plateforme avant de commencer à l'utiliser.
          </p>
        </div>

        <Stepper steps={STEPS} current={stepIdx} onStepClick={setStepIdx} />

        {step === 'establishment' && (
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'établissement</CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur tous les documents officiels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitEstablishment} className="grid gap-4 md:grid-cols-2">
                <SetupField label="Nom *">
                  <Input
                    required
                    defaultValue={establishment.data?.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </SetupField>
                <SetupField label="Devise">
                  <Input
                    placeholder="Discipline · Travail · Excellence"
                    defaultValue={establishment.data?.motto}
                    onChange={(e) => setForm((f) => ({ ...f, motto: e.target.value }))}
                  />
                </SetupField>
                <SetupField label="URL du logo">
                  <Input
                    placeholder="https://…"
                    defaultValue={establishment.data?.logoUrl}
                    onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                  />
                </SetupField>
                <SetupField label="Email">
                  <Input
                    type="email"
                    defaultValue={establishment.data?.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </SetupField>
                <SetupField label="Téléphone">
                  <Input
                    defaultValue={establishment.data?.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </SetupField>
                <SetupField label="Site web">
                  <Input
                    defaultValue={establishment.data?.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  />
                </SetupField>
                <SetupField label="Adresse" className="md:col-span-2">
                  <Input
                    defaultValue={establishment.data?.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </SetupField>
                <SetupField label="Ville">
                  <Input
                    defaultValue={establishment.data?.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </SetupField>
                <SetupField label="Pays">
                  <Input
                    defaultValue={establishment.data?.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  />
                </SetupField>
                <SetupField label="Devise monétaire">
                  <Input
                    placeholder="XAF, EUR, USD…"
                    defaultValue={establishment.data?.currency ?? 'XAF'}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  />
                </SetupField>
                <SetupField label="Langue">
                  <Input
                    placeholder="fr"
                    defaultValue={establishment.data?.language ?? 'fr'}
                    onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                  />
                </SetupField>
                {error && (
                  <div className="md:col-span-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={save.isPending}>
                    {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('setup.next')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'academicYear' && (
          <Card>
            <CardHeader>
              <CardTitle>Année académique</CardTitle>
              <CardDescription>
                Vous configurerez votre première année active depuis le menu dédié.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-accent/30 bg-accent-soft text-accent-foreground">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                  <p className="text-sm">
                    Une fois la configuration terminée, accédez à <code className="font-mono text-xs bg-card px-1.5 py-0.5 rounded">Configuration › Années académiques</code> pour créer votre première année.
                  </p>
                </div>
              </div>
              <NavButtons onBack={back} onNext={next} />
            </CardContent>
          </Card>
        )}

        {step === 'curriculum' && (
          <Card>
            <CardHeader>
              <CardTitle>Cursus</CardTitle>
              <CardDescription>
                Configurez cycles, niveaux et matières depuis le menu Cursus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-accent/30 bg-accent-soft text-accent-foreground">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                  <p className="text-sm">
                    Cycles, niveaux, filières et matières se configurent depuis{' '}
                    <code className="font-mono text-xs bg-card px-1.5 py-0.5 rounded">Configuration › Cursus</code>.
                  </p>
                </div>
              </div>
              <NavButtons onBack={back} onNext={next} />
            </CardContent>
          </Card>
        )}

        {step === 'done' && (
          <Card className="border-success/30 bg-success-soft/40">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-success text-success-foreground flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Tout est prêt !
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Votre établissement est configuré. Vous pouvez maintenant inscrire vos premiers élèves, créer les classes et démarrer la facturation.
                </p>
              </div>
              <Button size="lg" onClick={() => navigate('/')}>
                Accéder au tableau de bord
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SetupField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function NavButtons({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack}>
        <ChevronLeft className="h-4 w-4" />
        Précédent
      </Button>
      <Button onClick={onNext}>
        Suivant
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}