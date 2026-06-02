import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Plus, Search, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

type Invoice = {
  id: string;
  number: string;
  studentMatricule?: string;
  studentFullName?: string;
  issuedAt: string;
  dueAt: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  status: string;
  currency?: string;
};

export function InvoicesListPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const invoicesQ = useQuery({
    queryKey: ['invoices', q, status],
    queryFn: async () => {
      const params: Record<string, string> = { size: '50' };
      if (q) params.q = q;
      if (status) params.status = status;
      return (await api.get('/v1/invoices', { params })).data.data as {
        content: Invoice[];
        totalElements: number;
      };
    },
  });

  const total = invoicesQ.data?.totalElements ?? 0;
  const list = invoicesQ.data?.content ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Factures"
        description={`${total} facture${total > 1 ? 's' : ''} émise${total > 1 ? 's' : ''}.`}
        actions={
          <Button asChild>
            <Link to="/invoices/new">
              <Plus className="h-4 w-4" />
              Nouvelle facture
            </Link>
          </Button>
        }
      />

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher (numéro, élève, matricule)…"
            className="pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          className="w-auto min-w-[180px]"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tous statuts</option>
          <option value="OPEN">Ouvertes</option>
          <option value="PARTIALLY_PAID">Partiellement payées</option>
          <option value="PAID">Payées</option>
          <option value="OVERDUE">En retard</option>
          <option value="CANCELLED">Annulées</option>
        </Select>
      </div>

      <DataTable>
        <Table>
          <THead>
            <tr>
              <TH>Numéro</TH>
              <TH>Élève</TH>
              <TH>Émise</TH>
              <TH>Échéance</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">Payé</TH>
              <TH className="text-right">Solde</TH>
              <TH>Statut</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {list.map((i) => (
              <TR key={i.id}>
                <TD className="font-mono text-xs text-foreground">{i.number}</TD>
                <TD>
                  <div className="font-medium text-foreground">{i.studentFullName ?? '—'}</div>
                  {i.studentMatricule && (
                    <div className="text-xs text-muted-foreground font-mono">{i.studentMatricule}</div>
                  )}
                </TD>
                <TD className="text-sm text-muted-foreground">{i.issuedAt}</TD>
                <TD className="text-sm text-muted-foreground">{i.dueAt}</TD>
                <TD className="text-right tabular-nums">{fmt(i.totalAmount)}</TD>
                <TD className="text-right tabular-nums text-success">{fmt(i.totalPaid)}</TD>
                <TD
                  className={
                    'text-right tabular-nums font-semibold ' +
                    (i.balance > 0 ? 'text-destructive' : 'text-muted-foreground')
                  }
                >
                  {fmt(i.balance)}
                </TD>
                <TD>
                  <StatusBadge status={i.status} />
                </TD>
                <TD className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/invoices/${i.id}`}>Voir</Link>
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {list.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="Aucune facture"
            description="Émettez votre première facture pour commencer la facturation des élèves."
            action={
              <Button asChild>
                <Link to="/invoices/new">
                  <Plus className="h-4 w-4" /> Nouvelle facture
                </Link>
              </Button>
            }
          />
        )}
      </DataTable>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n ?? 0);
}