import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Wallet, AlertCircle, FileCheck2, Clock, TrendingUp, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type Dashboard = {
  revenueThisMonth: number;
  revenueYearToDate: number;
  totalOutstanding: number;
  openInvoices: number;
  partiallyPaidInvoices: number;
  overdueInvoices: number;
  paidInvoices: number;
  last12Months: Array<{ month: string; amount: number }>;
};

export function FinancialDashboardPage() {
  const q = useQuery({
    queryKey: ['billing-dashboard'],
    queryFn: async () => (await api.get('/v1/billing/dashboard')).data.data as Dashboard,
  });

  if (!q.data) return <p className="text-sm text-muted-foreground">Chargement du dashboard…</p>;
  const d = q.data;

  const chartData = d.last12Months.map((p) => ({
    month: p.month.slice(0, 7),
    amount: Number(p.amount),
  }));
  const maxRevenue = Math.max(...chartData.map((c) => c.amount), 0);

  const statusBreakdown = [
    { label: 'Ouvertes', value: d.openInvoices, tone: 'info' as const },
    { label: 'Partiellement payées', value: d.partiallyPaidInvoices, tone: 'warning' as const },
    { label: 'En retard', value: d.overdueInvoices, tone: 'destructive' as const },
    { label: 'Payées', value: d.paidInvoices, tone: 'success' as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Dashboard financier"
        description="Pilotage en temps réel des recettes et des impayés de l'établissement."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/invoices">
              <ArrowUpRight className="h-4 w-4" /> Voir les factures
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={Wallet}
          label="Recettes du mois"
          value={fmt(d.revenueThisMonth)}
          tone="primary"
          subtitle="Paiements encaissés ce mois"
        />
        <Kpi
          icon={FileCheck2}
          label="Recettes annuelles"
          value={fmt(d.revenueYearToDate)}
          tone="success"
          subtitle="Cumul depuis le 1ᵉʳ janvier"
        />
        <Kpi
          icon={AlertCircle}
          label="Impayés"
          value={fmt(d.totalOutstanding)}
          tone="warning"
          subtitle="Solde restant dû"
        />
        <Kpi
          icon={Clock}
          label="Factures en retard"
          value={String(d.overdueInvoices)}
          tone="destructive"
          subtitle="À relancer en priorité"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Recettes mensuelles
              </CardTitle>
              <CardDescription>Évolution des 12 derniers mois.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px -2px hsl(222 47% 11% / 0.08)',
                  }}
                  formatter={(value: number) => [fmt(value), 'Recettes']}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.amount === maxRevenue ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Répartition des factures</CardTitle>
          <CardDescription>État global du portefeuille de factures.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statusBreakdown.map((s) => (
              <StatusCard key={s.label} {...s} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const TONE_STYLES = {
  primary: { bg: 'bg-primary-soft', text: 'text-primary', ring: 'ring-primary/10' },
  accent: { bg: 'bg-accent-soft', text: 'text-accent', ring: 'ring-accent/10' },
  success: { bg: 'bg-success-soft', text: 'text-success', ring: 'ring-success/10' },
  warning: { bg: 'bg-warning-soft', text: 'text-warning', ring: 'ring-warning/10' },
  destructive: { bg: 'bg-destructive-soft', text: 'text-destructive', ring: 'ring-destructive/10' },
  info: { bg: 'bg-info-soft', text: 'text-info', ring: 'ring-info/10' },
} as const;

type Tone = keyof typeof TONE_STYLES;

function Kpi({
  icon: Icon,
  label,
  value,
  subtitle,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  tone: Tone;
}) {
  const t = TONE_STYLES[tone];
  return (
    <Card>
      <CardContent className="p-5">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ring-1 ${t.bg} ${t.text} ${t.ring}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-5">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </div>
          {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusCard({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  const t = TONE_STYLES[tone];
  return (
    <div className={`rounded-lg p-4 border border-border/70 ${t.bg}`}>
      <div className={`font-display text-3xl font-semibold tracking-tight tabular-nums ${t.text}`}>
        {value}
      </div>
      <div className="text-xs text-foreground/70 mt-1">{label}</div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n ?? 0);
}