import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Mail, Lock, KeyRound, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractError } from '@/lib/api';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', mfaCode: '' },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const result = await login(values.email, values.password, values.mfaCode || undefined);
      if (result.mfaRequired) {
        setMfaRequired(true);
        return;
      }
      navigate('/');
    } catch (e) {
      setError(extractError(e));
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-5 bg-background">
      {/* Left brand panel */}
      <aside className="hidden lg:flex lg:col-span-2 relative flex-col justify-between p-12 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(222_70%_18%)]" />
        <div className="absolute inset-0 bg-grid-soft opacity-50" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary-foreground/5 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-primary-foreground/10 ring-1 ring-primary-foreground/20 backdrop-blur flex items-center justify-center">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold tracking-tight">{t('app.name')}</div>
            <div className="text-xs text-primary-foreground/70">{t('auth.brandSubtitle')}</div>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.1] tracking-tight text-balance">
              {t('auth.heroTitle')}
            </h1>
            <p className="mt-5 text-primary-foreground/80 text-base xl:text-lg leading-relaxed text-balance max-w-md">
              {t('auth.heroSubtitle')}
            </p>
          </div>

          <ul className="space-y-3 text-sm text-primary-foreground/85">
            {['auth.feature1', 'auth.feature2', 'auth.feature3'].map((k) => (
              <li key={k} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <ShieldCheck className="h-3 w-3" />
                </span>
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} {t('app.name')}. {t('auth.allRightsReserved')}
        </div>
      </aside>

      {/* Right form panel */}
      <div className="lg:col-span-3 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden mb-10 flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold">{t('app.name')}</div>
              <div className="text-xs text-muted-foreground">{t('app.tagline')}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              {t('auth.signInTitle')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('auth.signInSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="prenom.nom@ecole.com"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <a
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline underline-offset-4"
                >
                  {t('auth.forgotPassword')}
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-10"
                  {...register('password')}
                />
              </div>
            </div>

            {mfaRequired && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="mfaCode">{t('auth.mfaCode')}</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="mfaCode"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123 456"
                    className="pl-10 tracking-[0.4em] font-mono"
                    {...register('mfaCode')}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('auth.mfaRequired')}</p>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm text-destructive animate-fade-in"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('auth.login')}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            {t('auth.securedBy')}
          </p>
        </div>
      </div>
    </div>
  );
}