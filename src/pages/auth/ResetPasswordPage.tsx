import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, GraduationCap, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${baseURL}/v1/auth/reset-password`, { token, newPassword: password });
      navigate('/login');
    } catch {
      setError(t('auth.invalidOrExpiredToken'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background bg-grid-dots">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">{t('app.name')}</div>
            <div className="text-xs text-muted-foreground">{t('app.tagline')}</div>
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-card shadow-elevated p-8">
          <div className="space-y-2 mb-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {t('auth.setNewPassword')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('auth.setNewPasswordSubtitle')}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="pwd">{t('auth.newPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="pwd"
                  type="password"
                  minLength={8}
                  required
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('auth.passwordHint')}</p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" disabled={loading || !token} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('auth.resetPassword')}
            </Button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('auth.backToLogin')}
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}