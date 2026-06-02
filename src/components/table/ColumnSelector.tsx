import { useEffect, useRef, useState } from 'react';
import { Columns3, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FieldMeta } from '@/lib/graphql';

type Props = {
  fields: FieldMeta[];
  visibleColumns: string[];
  onToggle: (name: string) => void;
  /** Display label resolver (page supplies localized labels). */
  labelOf: (field: FieldMeta) => string;
};

/** Dropdown panel to toggle which columns are shown. Default columns come from the field catalog. */
export function ColumnSelector({ fields, visibleColumns, onToggle, labelOf }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" onClick={() => setOpen((o) => !o)}>
        <Columns3 className="h-4 w-4" />
        Colonnes
        <span className="ml-1 rounded bg-muted px-1.5 text-xs text-muted-foreground">
          {visibleColumns.length}
        </span>
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-60 rounded-md border border-border bg-card p-1 shadow-elevated">
          <div className="max-h-72 overflow-auto">
            {fields.map((f) => {
              const checked = visibleColumns.includes(f.name);
              return (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => onToggle(f.name)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border',
                      checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{labelOf(f)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}