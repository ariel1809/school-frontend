import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { CreditCard, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';

type Payment = {
  id: string;
  reference: string;
  studentMatricule?: string;
  studentFullName?: string;
  method: string;
  amount: number;
  paidAt: string;
  externalReference?: string;
  status: string;
};

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Espèces',
  CARD: 'Carte bancaire',
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Virement',
  CHECK: 'Chèque',
  OTHER: 'Autre',
};

export function PaymentsListPage() {
  const [q, setQ] = useState('');

  const paymentsQ = useQuery({
    queryKey: ['payments', q],
    queryFn: async () => {
      const params: Record<string, string> = { size: '50' };
      if (q) params.q = q;
      return (await api.get('/v1/payments', { params })).data.data as {
        content: Payment[];
        totalElements: number;
      };
    },
  });

  const total = paymentsQ.data?.totalElements ?? 0;
  const list = paymentsQ.data?.content ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Paiements"
        description={`${total} paiement${total > 1 ? 's' : ''} enregistré${total > 1 ? 's' : ''}.`}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher (référence, élève, matricule)…"
          className="pl-10"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <DataTable>
        <Table>
          <THead>
            <tr>
              <TH>Référence</TH>
              <TH>Date</TH>
              <TH>Élève</TH>
              <TH>Méthode</TH>
              <TH className="text-right">Montant</TH>
              <TH>Statut</TH>
            </tr>
          </THead>
          <TBody>
            {list.map((p) => (
              <TR key={p.id}>
                <TD className="font-mono text-xs text-foreground">{p.reference}</TD>
                <TD className="text-sm text-muted-foreground">{p.paidAt}</TD>
                <TD>
                  <div className="font-medium">{p.studentFullName ?? '—'}</div>
                  {p.studentMatricule && (
                    <div className="text-xs text-muted-foreground font-mono">{p.studentMatricule}</div>
                  )}
                </TD>
                <TD>
                  <Badge variant="outline">{METHOD_LABEL[p.method] ?? p.method}</Badge>
                </TD>
                <TD className="text-right tabular-nums font-semibold">{fmt(p.amount)}</TD>
                <TD>
                  <StatusBadge status={p.status} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {list.length === 0 && (
          <EmptyState
            icon={CreditCard}
            title="Aucun paiement"
            description="Les paiements enregistrés depuis les factures apparaîtront ici."
          />
        )}
      </DataTable>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n ?? 0);
}