import { cn } from '@/lib/utils';

interface InfoRowProps {
  label: React.ReactNode;
  value?: React.ReactNode;
  className?: string;
}

export function InfoRow({ label, value, className }: InfoRowProps) {
  const display = value === null || value === undefined || value === '' ? '—' : value;
  return (
    <div className={cn('flex items-start justify-between gap-3 py-2', className)}>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-foreground text-right break-words">{display}</span>
    </div>
  );
}

interface InfoListProps {
  className?: string;
  children: React.ReactNode;
}

export function InfoList({ className, children }: InfoListProps) {
  return <dl className={cn('divide-y divide-border/60', className)}>{children}</dl>;
}