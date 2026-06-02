import { useQuery } from '@tanstack/react-query';
import { FileClock } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';

type Audit = {
  id: string;
  actorEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  occurredAt: string;
};

export function AuditPage() {
  const auditQ = useQuery({
    queryKey: ['audit'],
    queryFn: async () =>
      (await api.get('/v1/audit', { params: { size: 100 } })).data.data as { content: Audit[] },
  });

  const list = auditQ.data?.content ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Journal d'audit"
        description="Trace complète et immuable des actions sensibles effectuées sur la plateforme."
      />

      <DataTable>
        <Table>
          <THead>
            <tr>
              <TH>Date</TH>
              <TH>Utilisateur</TH>
              <TH>Action</TH>
              <TH>Entité</TH>
              <TH>Adresse IP</TH>
            </tr>
          </THead>
          <TBody>
            {list.map((a) => (
              <TR key={a.id}>
                <TD className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(a.occurredAt).toLocaleString('fr-FR')}
                </TD>
                <TD className="text-sm">{a.actorEmail ?? <span className="text-muted-foreground italic">—</span>}</TD>
                <TD>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {a.action}
                  </Badge>
                </TD>
                <TD className="text-xs">
                  {a.entityType ? (
                    <span>
                      <span className="text-muted-foreground">{a.entityType}#</span>
                      <span className="font-mono">{a.entityId?.slice(0, 8)}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TD>
                <TD className="font-mono text-xs text-muted-foreground">{a.ipAddress ?? '—'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {list.length === 0 && (
          <EmptyState
            icon={FileClock}
            title="Aucune entrée"
            description="Les actions sensibles seront listées ici dès qu'elles se produisent."
          />
        )}
      </DataTable>
    </div>
  );
}