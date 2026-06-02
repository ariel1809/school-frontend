import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Wallet,
  Calendar,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  ClipboardList,
  Receipt,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Stat = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  tone: 'primary' | 'accent' | 'success' | 'info';
  to?: string;
};

const STATS: Stat[] = [
  { icon: Users, label: 'Élèves inscrits', value: '—', hint: 'Année en cours', tone: 'primary', to: '/students' },
  { icon: GraduationCap, label: 'Enseignants actifs', value: '—', hint: 'Contrats en cours', tone: 'info', to: '/teachers' },
  { icon: Wallet, label: 'Recettes du mois', value: '—', hint: 'Paiements encaissés', tone: 'success', to: '/billing' },
  { icon: Calendar, label: 'Cours cette semaine', value: '—', hint: 'Séances planifiées', tone: 'accent' },
];

const toneStyles: Record<Stat['tone'], { bg: string; text: string; ring: string }> = {
  primary: { bg: 'bg-primary-soft', text: 'text-primary', ring: 'ring-primary/10' },
  accent: { bg: 'bg-accent-soft', text: 'text-accent', ring: 'ring-accent/10' },
  success: { bg: 'bg-success-soft', text: 'text-success', ring: 'ring-success/10' },
  info: { bg: 'bg-info-soft', text: 'text-info', ring: 'ring-info/10' },
};

const QUICK_ACTIONS = [
  { icon: UserPlus, label: 'Inscrire un élève', to: '/students/enroll' },
  { icon: Receipt, label: 'Émettre une facture', to: '/invoices/new' },
  { icon: BookOpen, label: 'Gérer le cursus', to: '/config/curriculum' },
  { icon: ClipboardList, label: 'Voir les classes', to: '/classrooms' },
];

const MODULES_ROADMAP: { label: string; status: 'done' | 'soon' }[] = [
  { label: 'Configuration & RBAC', status: 'done' },
  { label: 'Élèves & inscriptions', status: 'done' },
  { label: 'Enseignants & contrats', status: 'done' },
  { label: 'Facturation & paiements', status: 'done' },
  { label: 'Pédagogie (notes, bulletins)', status: 'soon' },
  { label: 'Emplois du temps', status: 'soon' },
  { label: 'Reporting & analytics', status: 'soon' },
  { label: 'Notifications & PDF', status: 'soon' },
];

function todayLabel() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <div className="space-y-8">
      {/* Hero / greeting */}
      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground/80 font-medium">
            {todayLabel()}
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Bonjour, {firstName} <span className="text-accent">·</span>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Voici un aperçu de votre établissement. Toutes les données sont synchronisées en temps réel.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/config/establishment">Configuration</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/students/enroll">
              <UserPlus className="h-4 w-4" />
              Nouvelle inscription
            </Link>
          </Button>
        </div>
      </section>

      {/* KPI grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const tone = toneStyles[s.tone];
          const inner = (
            <Card className="card-hover h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}
                  >
                    <s.icon className="h-5 w-5" />
                  </div>
                  {s.to && (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                  )}
                </div>
                <div className="mt-5">
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
                </div>
              </CardContent>
            </Card>
          );
          return s.to ? (
            <Link key={s.label} to={s.to} className="group block">
              {inner}
            </Link>
          ) : (
            <div key={s.label}>{inner}</div>
          );
        })}
      </section>

      {/* Quick actions + roadmap */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Actions rapides</h2>
                <p className="text-sm text-muted-foreground">Les opérations courantes en un clic.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="group flex items-center gap-3 rounded-lg border border-border/70 bg-card p-4 hover:border-primary/40 hover:bg-primary-soft/40 transition-colors"
                >
                  <div className="h-10 w-10 rounded-md bg-primary-soft text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-sm font-medium text-foreground">{a.label}</div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="font-display text-lg font-semibold tracking-tight">Modules</h2>
            </div>
            <ul className="space-y-2.5">
              {MODULES_ROADMAP.map((m) => (
                <li key={m.label} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/80">{m.label}</span>
                  {m.status === 'done' ? (
                    <Badge variant="success">Actif</Badge>
                  ) : (
                    <Badge variant="outline">À venir</Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}