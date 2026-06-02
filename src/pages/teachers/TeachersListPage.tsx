import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Plus, Search, BriefcaseBusiness, Mail, Phone } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';

type Teacher = {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  specialities?: string;
  status: string;
  seniorityYears?: number;
};

export function TeachersListPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const teachersQ = useQuery({
    queryKey: ['teachers', q, status],
    queryFn: async () => {
      const params: Record<string, string> = { size: '50' };
      if (q) params.q = q;
      if (status) params.status = status;
      return (await api.get('/v1/teachers', { params })).data.data as {
        content: Teacher[];
        totalElements: number;
      };
    },
  });

  const total = teachersQ.data?.totalElements ?? 0;
  const list = teachersQ.data?.content ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ressources humaines"
        title="Enseignants"
        description={`${total} enseignant${total > 1 ? 's' : ''} dans le corps enseignant.`}
        actions={
          <Button asChild>
            <Link to="/teachers/new">
              <Plus className="h-4 w-4" />
              Nouvel enseignant
            </Link>
          </Button>
        }
      />

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher (nom, prénom, matricule, spécialité)…"
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
          <option value="ACTIVE">Actifs</option>
          <option value="ON_LEAVE">En congé</option>
          <option value="SUSPENDED">Suspendus</option>
          <option value="RESIGNED">Démissionnaires</option>
          <option value="RETIRED">Retraités</option>
          <option value="TERMINATED">Licenciés</option>
        </Select>
      </div>

      <DataTable>
        <Table>
          <THead>
            <tr>
              <TH>Matricule</TH>
              <TH>Enseignant</TH>
              <TH>Spécialités</TH>
              <TH>Contact</TH>
              <TH>Ancienneté</TH>
              <TH>Statut</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {list.map((t) => (
              <TR key={t.id}>
                <TD className="font-mono text-xs text-muted-foreground">{t.matricule}</TD>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar firstName={t.firstName} lastName={t.lastName} size="sm" />
                    <div className="font-medium text-foreground">
                      {t.lastName} {t.firstName}
                    </div>
                  </div>
                </TD>
                <TD>
                  <span className="text-sm text-muted-foreground">{t.specialities ?? '—'}</span>
                </TD>
                <TD>
                  <div className="space-y-0.5 text-xs">
                    {t.email && (
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{t.email}</span>
                      </div>
                    )}
                    {t.phone && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {t.phone}
                      </div>
                    )}
                    {!t.email && !t.phone && <span className="text-muted-foreground">—</span>}
                  </div>
                </TD>
                <TD className="text-sm text-muted-foreground">
                  {t.seniorityYears != null ? `${t.seniorityYears} an${t.seniorityYears > 1 ? 's' : ''}` : '—'}
                </TD>
                <TD>
                  <StatusBadge status={t.status} />
                </TD>
                <TD className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/teachers/${t.id}`}>Voir</Link>
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {list.length === 0 && (
          <EmptyState
            icon={BriefcaseBusiness}
            title="Aucun enseignant"
            description="Aucun enseignant ne correspond aux filtres. Commencez par en créer un."
            action={
              <Button asChild>
                <Link to="/teachers/new">
                  <Plus className="h-4 w-4" /> Nouvel enseignant
                </Link>
              </Button>
            }
          />
        )}
      </DataTable>
    </div>
  );
}