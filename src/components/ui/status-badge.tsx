import { Badge } from '@/components/ui/badge';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'accent' | 'info';

const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  // Students
  PRE_REGISTERED: { variant: 'warning', label: 'Pré-inscrit' },
  REGISTERED: { variant: 'success', label: 'Inscrit' },
  SUSPENDED: { variant: 'destructive', label: 'Suspendu' },
  TRANSFERRED: { variant: 'info', label: 'Transféré' },
  GRADUATED: { variant: 'accent', label: 'Diplômé' },
  WITHDRAWN: { variant: 'secondary', label: 'Retiré' },
  // Teachers
  ACTIVE: { variant: 'success', label: 'Actif' },
  ON_LEAVE: { variant: 'warning', label: 'En congé' },
  RESIGNED: { variant: 'secondary', label: 'Démissionnaire' },
  RETIRED: { variant: 'info', label: 'Retraité' },
  TERMINATED: { variant: 'secondary', label: 'Licencié' },
  // Invoices
  DRAFT: { variant: 'secondary', label: 'Brouillon' },
  OPEN: { variant: 'info', label: 'Ouverte' },
  PARTIALLY_PAID: { variant: 'warning', label: 'Partielle' },
  PAID: { variant: 'success', label: 'Payée' },
  OVERDUE: { variant: 'destructive', label: 'En retard' },
  CANCELLED: { variant: 'secondary', label: 'Annulée' },
  // Installments
  PENDING: { variant: 'info', label: 'En attente' },
  PARTIAL: { variant: 'warning', label: 'Partiel' },
  WAIVED: { variant: 'secondary', label: 'Annulé' },
  // Payments
  COMPLETED: { variant: 'success', label: 'Complété' },
  REFUNDED: { variant: 'info', label: 'Remboursé' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_MAP[status] ?? { variant: 'secondary' as const, label: status };
  return (
    <Badge variant={meta.variant} className={className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </Badge>
  );
}