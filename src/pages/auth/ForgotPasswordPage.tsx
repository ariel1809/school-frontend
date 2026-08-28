import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, GraduationCap, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${baseURL}/v1/auth/forgot-password`, { email });
      setSent(true);
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
          {sent ? (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="mx-auto h-12 w-12 rounded-full bg-success-soft text-success flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  {t('auth.checkYourInbox')}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('auth.resetLinkSent')}
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4" />
                  {t('auth.backToLogin')}
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {t('auth.resetPassword')}
                </h2>
                <p className="text-sm text-muted-foreground">{t('auth.resetSubtitle')}</p>
              </div>
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="prenom.nom@ecole.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" size="lg" disabled={loading} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('auth.sendResetLink')}
                </Button>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t('auth.backToLogin')}
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}