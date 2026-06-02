import { useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CheckCircle2, Receipt, X, Wallet, FileDown, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';

type Item = {
  id: string;
  label: string;
  kind: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  feeTypeCode?: string;
};
type Installment = {
  id: string;
  ordinal: number;
  label?: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: string;
};
type Invoice = {
  id: string;
  number: string;
  studentId: string;
  studentMatricule?: string;
  studentFullName?: string;
  academicYearCode?: string;
  classroomName?: string;
  issuedAt: string;
  dueAt: string;
  status: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  currency?: string;
  notes?: string;
  items: Item[];
  installments: Installment[];
};

const KIND_LABEL: Record<string, string> = {
  CHARGE: 'Frais',
  DISCOUNT: 'Remise',
  SCHOLARSHIP: 'Bourse',
  PENALTY: 'Pénalité',
};

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const justCreated = params.get('created') === '1';
  const qc = useQueryClient();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invoiceQ = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => (await api.get(`/v1/invoices/${id}`)).data.data as Invoice,
    enabled: !!id,
  });

  const cancel = useMutation({
    mutationFn: async () => api.post(`/v1/invoices/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice', id] }),
    onError: (e) => setError(extractError(e)),
  });

  const fetchPdfBlob = async () => {
    const res = await api.get(`/v1/invoices/${id}/pdf`, { responseType: 'blob' });
    return res.data as Blob;
  };

  const openPdf = useMutation({
    mutationFn: async () => {
      const blob = await fetchPdfBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (e) => setError(extractError(e)),
  });

  const downloadPdf = useMutation({
    mutationFn: async () => {
      const blob = await fetchPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoiceQ.data?.number ?? id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
    },
    onError: (e) => setError(extractError(e)),
  });

  const recordPayment = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post('/v1/payments', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoice', id] });
      setRecording(false);
      setError(null);
    },
    onError: (e) => setError(extractError(e)),
  });

  if (!invoiceQ.data) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  const inv = invoiceQ.data;
  const canCancel = inv.status !== 'PAID' && inv.status !== 'CANCELLED';
  const canPay = inv.balance > 0 && inv.status !== 'CANCELLED';
  const progress = inv.totalAmount > 0 ? Math.min(100, (inv.totalPaid / inv.totalAmount) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/invoices"
        backLabel="Factures"
        eyebrow="Facture"
        title={inv.number}
        description={
          <span>
            {inv.studentFullName}{' '}
            {inv.studentMatricule && <span className="font-mono text-xs">({inv.studentMatricule})</span>}
            {inv.classroomName && ` · ${inv.classroomName}`}
            {inv.academicYearCode && ` · ${inv.academicYearCode}`}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => openPdf.mutate()}
              disabled={openPdf.isPending}
              title="Ouvrir le PDF dans un nouvel onglet (impression depuis le viewer)"
            >
              <Printer className="h-4 w-4" />
              {openPdf.isPending ? 'Préparation…' : 'Voir / Imprimer'}
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadPdf.mutate()}
              disabled={downloadPdf.isPending}
            >
              <FileDown className="h-4 w-4" />
              {downloadPdf.isPending ? 'Préparation…' : 'Télécharger PDF'}
            </Button>
            {canCancel && (
              <Button variant="outline" onClick={() => cancel.mutate()}>
                <X className="h-4 w-4" />
                Annuler la facture
              </Button>
            )}
          </div>
        }
      />

      {justCreated && (
        <Card className="border-success/30 bg-success-soft animate-fade-in">
          <CardContent className="p-4 flex items-center gap-3 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-semibold text-foreground">Facture créée</p>
              <p className="text-sm">
                Numéro : <span className="font-mono">{inv.number}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary card */}
      <Card>
        <CardContent className="p-6 grid gap-6 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Émise le</div>
                <div className="font-medium">{inv.issuedAt}</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Échéance</div>
                <div className="font-medium">{inv.dueAt}</div>
              </div>
              <div className="ml-auto">
                <StatusBadge status={inv.status} />
              </div>
            </div>
            {/* Progress */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Avancement du règlement</span>
                <span className="tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    progress >= 100 ? 'bg-success' : progress > 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="md:border-l md:border-border/70 md:pl-6 space-y-2 min-w-[220px]">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold tabular-nums">
                {fmt(inv.totalAmount)} {inv.currency}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payé</span>
              <span className="text-success tabular-nums">{fmt(inv.totalPaid)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border/70 font-display text-lg">
              <span className="font-semibold">Solde</span>
              <span
                className={cn(
                  'font-bold tabular-nums',
                  inv.balance > 0 ? 'text-destructive' : 'text-success'
                )}
              >
                {fmt(inv.balance)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lignes de facture</CardTitle>
            <CardDescription>{inv.items.length} ligne(s)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <tr>
                  <TH>Libellé</TH>
                  <TH>Type</TH>
                  <TH className="text-right">PU</TH>
                  <TH className="text-right">Qté</TH>
                  <TH className="text-right">Montant</TH>
                </tr>
              </THead>
              <TBody>
                {inv.items.map((it) => (
                  <TR key={it.id}>
                    <TD>
                      <div className="font-medium">{it.label}</div>
                      {it.feeTypeCode && (
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{it.feeTypeCode}</div>
                      )}
                    </TD>
                    <TD>
                      <Badge
                        variant={it.kind === 'CHARGE' ? 'outline' : it.kind === 'PENALTY' ? 'destructive' : 'success'}
                      >
                        {KIND_LABEL[it.kind] ?? it.kind}
                      </Badge>
                    </TD>
                    <TD className="text-right tabular-nums">{fmt(it.unitPrice)}</TD>
                    <TD className="text-right tabular-nums">{it.quantity}</TD>
                    <TD
                      className={cn(
                        'text-right tabular-nums font-semibold',
                        it.amount < 0 && 'text-success'
                      )}
                    >
                      {fmt(it.amount)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Échéancier</CardTitle>
                <CardDescription>{inv.installments.length} échéance(s)</CardDescription>
              </div>
              {canPay && (
                <Button
                  size="sm"
                  onClick={() => {
                    setRecording(true);
                    setError(null);
                  }}
                >
                  <Wallet className="h-4 w-4" />
                  Enregistrer un paiement
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <tr>
                  <TH>#</TH>
                  <TH>Libellé</TH>
                  <TH>Échéance</TH>
                  <TH className="text-right">Dû</TH>
                  <TH className="text-right">Payé</TH>
                  <TH>Statut</TH>
                </tr>
              </THead>
              <TBody>
                {inv.installments.map((i) => (
                  <TR key={i.id}>
                    <TD className="font-mono text-xs">{i.ordinal}</TD>
                    <TD className="text-sm">{i.label ?? '—'}</TD>
                    <TD className="text-sm text-muted-foreground">{i.dueDate}</TD>
                    <TD className="text-right tabular-nums">{fmt(i.amountDue)}</TD>
                    <TD className="text-right tabular-nums text-success">{fmt(i.amountPaid)}</TD>
                    <TD>
                      <StatusBadge status={i.status} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {recording && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Enregistrer un paiement</CardTitle>
            <CardDescription>
              Le paiement sera réparti automatiquement sur les échéances les plus anciennes non soldées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                recordPayment.mutate({
                  studentId: inv.studentId,
                  studentMatricule: inv.studentMatricule,
                  studentFullName: inv.studentFullName,
                  method: fd.get('method'),
                  amount: Number(fd.get('amount')),
                  paidAt: fd.get('paidAt'),
                  externalReference: (fd.get('externalReference') as string) || undefined,
                  notes: (fd.get('notes') as string) || undefined,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Méthode</Label>
                <Select name="method" required defaultValue="CASH">
                  <option value="CASH">Espèces</option>
                  <option value="CARD">Carte bancaire</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Virement</option>
                  <option value="CHECK">Chèque</option>
                  <option value="OTHER">Autre</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant</Label>
                <Input name="amount" type="number" step="100" required defaultValue={inv.balance} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  name="paidAt"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-2">
                <Label>Référence externe</Label>
                <Input name="externalReference" placeholder="N° transaction, chèque…" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Notes</Label>
                <Input name="notes" />
              </div>
              {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={recordPayment.isPending}>
                  Enregistrer (auto-allocation)
                </Button>
                <Button type="button" variant="outline" onClick={() => setRecording(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n ?? 0);
}