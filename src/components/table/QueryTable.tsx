import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { DataTable, Table, THead, TBody, TR, TH, TD } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';
import type { FieldMeta } from '@/lib/graphql';
import type { UISort } from '@/hooks/useTableState';

type Props<T> = {
  fields: FieldMeta[];
  visibleColumns: string[];
  rows: T[];
  sort: UISort[];
  onToggleSort: (field: string) => void;
  labelOf: (field: FieldMeta) => string;
  rowKey: (row: T) => string;
  /** Per-field custom cell rendering; falls back to {@link formatDefault} otherwise. */
  cellRenderers?: Record<string, (row: T) => ReactNode>;
  /** Trailing actions column. */
  actions?: (row: T) => ReactNode;
};

function formatDefault(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-xs italic text-muted-foreground">—</span>;
  }
  return String(value);
}

export function QueryTable<T>({
  fields,
  visibleColumns,
  rows,
  sort,
  onToggleSort,
  labelOf,
  rowKey,
  cellRenderers,
  actions,
}: Props<T>) {
  // Keep canonical catalog order regardless of toggle order.
  const columns = fields.filter((f) => visibleColumns.includes(f.name));

  return (
    <DataTable>
      <Table>
        <THead>
          <tr>
            {columns.map((f) => {
              const active = sort.find((s) => s.field === f.name);
              return (
                <TH key={f.name}>
                  {f.sortable ? (
                    <button
                      type="button"
                      onClick={() => onToggleSort(f.name)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {labelOf(f)}
                      {active ? (
                        active.direction === 'ASC' ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    labelOf(f)
                  )}
                </TH>
              );
            })}
            {actions && <TH className="text-right">Actions</TH>}
          </tr>
        </THead>
        <TBody>
          {rows.map((row) => (
            <TR key={rowKey(row)}>
              {columns.map((f) => (
                <TD key={f.name} className={cn(f.type === 'ID' || f.name === 'matricule' ? 'font-mono text-xs text-muted-foreground' : undefined)}>
                  {cellRenderers?.[f.name]
                    ? cellRenderers[f.name](row)
                    : formatDefault((row as Record<string, unknown>)[f.name])}
                </TD>
              ))}
              {actions && <TD className="text-right">{actions(row)}</TD>}
            </TR>
          ))}
        </TBody>
      </Table>
    </DataTable>
  );
}