import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, extractError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Sparkles, AlertCircle, Loader2, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';

type FeeType = { id: string; code: string; name: string; category: string; defaultAmount?: number };
type Student = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  currentClassroomId?: string;
};
type Classroom = { id: string; name: string };
type AcademicYear = { id: string; code: string; name: string; active: boolean };

type ItemForm = {
  feeTypeId?: string;
  feeTypeCode?: string;
  label: string;
  kind: 'CHARGE' | 'DISCOUNT' | 'SCHOLARSHIP' | 'PENALTY';
  unitPrice: number;
  quantity: number;
  reason?: string;
};

type InstallmentForm = {
  label: string;
  dueDate: string;
  amountDue: number;
};

const KIND_LABEL: Record<ItemForm['kind'], string> = {
  CHARGE: 'Frais',
  DISCOUNT: 'Remise',
  SCHOLARSHIP: 'Bourse',
  PENALTY: 'Pénalité',
};

export function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetStudentId = params.get('studentId') ?? '';

  const [studentId, setStudentId] = useState(presetStudentId);
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().slice(0, 10));
  const [dueAt, setDueAt] = useState(
    new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10)
  );
  const [currency, setCurrency] = useState('XAF');
  const [academicYearId, setAcademicYearId] = useState<string | undefined>();
  const [items, setItems] = useState<ItemForm[]>([]);
  const [installments, setInstallments] = useState<InstallmentForm[]>([]);
  const [error, setError] = useState<string | null>(null);

  const feeTypesQ = useQuery({
    queryKey: ['fee-types', 'active'],
    queryFn: async () =>
      (await api.get('/v1/fee-types', { params: { activeOnly: true } })).data.data as FeeType[],
  });

  const studentsQ = useQuery({
    queryKey: ['students-quick'],
    queryFn: async () =>
      (await api.get('/v1/students', { params: { size: 200 } })).data.data.content as Student[],
  });

  const classroomsQ = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => (await api.get('/v1/classrooms')).data.data as Classroom[],
  });

  const yearsQ = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/v1/academic-years')).data.data as AcademicYear[],
  });

  useEffect(() => {
    if (academicYearId == null && yearsQ.data) {
      const active = yearsQ.data.find((y) => y.active);
      if (active) setAcademicYearId(active.id);
    }
  }, [academicYearId, yearsQ.data]);

  const student = useMemo(
    () => studentsQ.data?.find((s) => s.id === studentId),
    [studentsQ.data, studentId]
  );

  const total = useMemo(() => {
    return items.reduce((acc, it) => {
      const base = it.unitPrice * it.quantity;
      const signed = it.kind === 'DISCOUNT' || it.kind === 'SCHOLARSHIP' ? -Math.abs(base) : Math.abs(base);
      return acc + signed;
    }, 0);
  }, [items]);

  const installmentSum = useMemo(
    () => installments.reduce((acc, i) => acc + (Number(i.amountDue) || 0), 0),
    [installments]
  );

  const create = useMutation({
    mutationFn: async () => {
      const classroom = classroomsQ.data?.find((c) => c.id === student?.currentClassroomId);
      const year = yearsQ.data?.find((y) => y.id === academicYearId);
      const payload = {
        studentId: student?.id,
        studentMatricule: student?.matricule,
        studentFullName: student ? `${student.lastName} ${student.firstName}` : undefined,
        academicYearId,
        academicYearCode: year?.code,
        classroomId: student?.currentClassroomId,
        classroomName: classroom?.name,
        issuedAt,
        dueAt,
        currency,
        items: items.map((it) => ({
          feeTypeId: it.feeTypeId,
          feeTypeCode: it.feeTypeCode,
          label: it.label,
          kind: it.kind,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          reason: it.reason,
        })),
        installments:
          installments.length > 0
            ? installments.map((i) => ({
                label: i.label,
                dueDate: i.dueDate,
                amountDue: i.amountDue,
              }))
            : undefined,
      };
      return (await api.post('/v1/invoices', payload)).data.data as { id: string; number: string };
    },
    onSuccess: (d) => navigate(`/invoices/${d.id}?created=1`),
    onError: (e) => setError(extractError(e)),
  });

  function addItemFromFeeType(ft: FeeType) {
    setItems([
      ...items,
      {
        feeTypeId: ft.id,
        feeTypeCode: ft.code,
        label: ft.name,
        kind: 'CHARGE',
        unitPrice: ft.defaultAmount ?? 0,
        quantity: 1,
      },
    ]);
  }

  function generateMonthlySchedule(months: number) {
    if (total <= 0 || months <= 0) return;
    const base = Math.floor((total / months) * 100) / 100;
    const last = +(total - base * (months - 1)).toFixed(2);
    const start = new Date(dueAt);
    const next: InstallmentForm[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      next.push({
        label: `Échéance ${i + 1}/${months}`,
        dueDate: d.toISOString().slice(0, 10),
        amountDue: i === months - 1 ? last : base,
      });
    }
    setInstallments(next);
  }

  function updateItem(idx: number, patch: Partial<ItemForm>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function updateInst(idx: number, patch: Partial<InstallmentForm>) {
    setInstallments(installments.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  const canSubmit =
    !!student &&
    items.length > 0 &&
    (installments.length === 0 || Math.abs(installmentSum - total) < 0.01);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        backTo="/invoices"
        backLabel="Factures"
        eyebrow="Création"
        title="Nouvelle facture"
        description="Le numéro de facture sera généré automatiquement à la validation."
      />

      <Card>
        <CardHeader>
          <CardTitle>Élève & période</CardTitle>
          <CardDescription>Identifiez l'élève facturé et la période concernée.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Élève *">
            <Select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            >
              <option value="">— Sélectionner un élève —</option>
              {studentsQ.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.matricule} · {s.lastName} {s.firstName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Année académique">
            <Select
              value={academicYearId ?? ''}
              onChange={(e) => setAcademicYearId(e.target.value || undefined)}
            >
              <option value="">—</option>
              {yearsQ.data?.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.active ? '(active)' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Émise le *">
            <Input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} required />
          </Field>
          <Field label="Échéance *">
            <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
          </Field>
          <Field label="Devise">
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Lignes de facture</CardTitle>
              <CardDescription>Composez la facture à partir de vos types de frais.</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select
                className="w-auto min-w-[180px]"
                onChange={(e) => {
                  const ft = feeTypesQ.data?.find((f) => f.id === e.target.value);
                  if (ft) addItemFromFeeType(ft);
                  e.target.value = '';
                }}
              >
                <option value="">+ Depuis un type</option>
                {feeTypesQ.data?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} — {f.name}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setItems([...items, { label: '', kind: 'CHARGE', unitPrice: 0, quantity: 1 }])
                }
              >
                <Plus className="h-4 w-4" /> Ligne libre
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setItems([...items, { label: 'Remise', kind: 'DISCOUNT', unitPrice: 0, quantity: 1 }])
                }
              >
                <Plus className="h-4 w-4" /> Remise
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setItems([...items, { label: 'Bourse', kind: 'SCHOLARSHIP', unitPrice: 0, quantity: 1 }])
                }
              >
                <Plus className="h-4 w-4" /> Bourse
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={items.length === 0 ? '' : 'p-0'}>
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Ajoutez vos lignes via les boutons ci-dessus.
              </p>
            </div>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Type</TH>
                  <TH>Libellé</TH>
                  <TH className="text-right">Prix unitaire</TH>
                  <TH className="text-right">Quantité</TH>
                  <TH className="text-right">Montant</TH>
                  <TH />
                </tr>
              </THead>
              <TBody>
                {items.map((it, idx) => {
                  const lineAmount =
                    (it.kind === 'DISCOUNT' || it.kind === 'SCHOLARSHIP' ? -1 : 1) *
                    Math.abs(it.unitPrice * it.quantity);
                  return (
                    <TR key={idx}>
                      <TD>
                        <Select
                          className="text-xs"
                          value={it.kind}
                          onChange={(e) => updateItem(idx, { kind: e.target.value as ItemForm['kind'] })}
                        >
                          {(Object.keys(KIND_LABEL) as Array<ItemForm['kind']>).map((k) => (
                            <option key={k} value={k}>
                              {KIND_LABEL[k]}
                            </option>
                          ))}
                        </Select>
                      </TD>
                      <TD>
                        <Input value={it.label} onChange={(e) => updateItem(idx, { label: e.target.value })} />
                      </TD>
                      <TD>
                        <Input
                          type="number"
                          step="100"
                          className="text-right tabular-nums"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                        />
                      </TD>
                      <TD>
                        <Input
                          type="number"
                          step="1"
                          className="text-right tabular-nums w-20 ml-auto"
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                        />
                      </TD>
                      <TD
                        className={cn(
                          'text-right tabular-nums font-semibold',
                          lineAmount < 0 && 'text-success'
                        )}
                      >
                        {fmt(lineAmount)}
                      </TD>
                      <TD>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
              <tfoot className="bg-muted/40 border-t-2 border-border">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold">
                    Total facture
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-display text-xl font-bold">
                    {fmt(total)} {currency}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Échéancier</CardTitle>
              <CardDescription>
                Laissez vide pour une échéance unique (total à la date d'échéance). La somme doit égaler le total.
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[3, 6, 9].map((m) => (
                <Button key={m} size="sm" variant="outline" onClick={() => generateMonthlySchedule(m)}>
                  <Sparkles className="h-3.5 w-3.5" /> {m} mois
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setInstallments([
                    ...installments,
                    {
                      label: `Échéance ${installments.length + 1}`,
                      dueDate: dueAt,
                      amountDue: 0,
                    },
                  ])
                }
              >
                <Plus className="h-4 w-4" /> Ligne
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={installments.length === 0 ? '' : 'p-0'}>
          {installments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Échéance unique : <span className="tabular-nums font-medium text-foreground">{fmt(total)} {currency}</span> le {dueAt}.
            </p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>#</TH>
                  <TH>Libellé</TH>
                  <TH>Échéance</TH>
                  <TH className="text-right">Montant</TH>
                  <TH />
                </tr>
              </THead>
              <TBody>
                {installments.map((inst, idx) => (
                  <TR key={idx}>
                    <TD className="font-mono text-xs">{idx + 1}</TD>
                    <TD>
                      <Input value={inst.label} onChange={(e) => updateInst(idx, { label: e.target.value })} />
                    </TD>
                    <TD>
                      <Input
                        type="date"
                        value={inst.dueDate}
                        onChange={(e) => updateInst(idx, { dueDate: e.target.value })}
                      />
                    </TD>
                    <TD>
                      <Input
                        type="number"
                        step="100"
                        className="text-right tabular-nums"
                        value={inst.amountDue}
                        onChange={(e) => updateInst(idx, { amountDue: Number(e.target.value) })}
                      />
                    </TD>
                    <TD>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          setInstallments(installments.filter((_, i) => i !== idx))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
              <tfoot className="bg-muted/40 border-t-2 border-border">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                    Somme des échéances
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <Badge
                      variant={Math.abs(installmentSum - total) > 0.01 ? 'destructive' : 'success'}
                    >
                      {fmt(installmentSum)} / {fmt(total)}
                    </Badge>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </Table>
          )}
        </CardContent>
      </Card>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link to="/invoices">Annuler</Link>
        </Button>
        <Button
          onClick={() => {
            setError(null);
            create.mutate();
          }}
          disabled={!canSubmit || create.isPending}
        >
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
          {create.isPending ? 'Création…' : 'Créer la facture'}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n ?? 0);
}