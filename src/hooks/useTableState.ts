import { useCallback, useEffect, useState } from 'react';
import type { FieldMeta, FilterOp, LogicOp, SortDir } from '@/lib/graphql';

/** One filter row as edited in the UI (string values; coerced server-side). */
export type UICondition = {
  id: string;
  field: string;
  op: FilterOp;
  value?: string;
  values?: string[];
};

export type UISort = { field: string; direction: SortDir };

export type TableState = {
  visibleColumns: string[];
  logic: LogicOp;
  conditions: UICondition[];
  sort: UISort[];
  page: number;
  size: number;
};

const VERSION = 1;
const DEFAULT_SIZE = 20;

function storageKey(key: string): string {
  return `table:${key}:v${VERSION}`;
}

function defaultState(fields: FieldMeta[]): TableState {
  return {
    visibleColumns: fields.filter((f) => f.defaultVisible).map((f) => f.name),
    logic: 'AND',
    conditions: [],
    sort: [],
    page: 0,
    size: DEFAULT_SIZE,
  };
}

/**
 * Per-table UI state (visible columns, filters, sort, paging) persisted to localStorage.
 * Initialization waits for the field catalog so defaults come from `defaultVisible`, and
 * stored state is pruned of fields that no longer exist.
 */
export function useTableState(key: string, fields: FieldMeta[]) {
  const [state, setState] = useState<TableState | null>(null);

  useEffect(() => {
    if (state || fields.length === 0) return;
    const stored = localStorage.getItem(storageKey(key));
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TableState;
        const names = new Set(fields.map((f) => f.name));
        parsed.visibleColumns = (parsed.visibleColumns ?? []).filter((c) => names.has(c));
        parsed.conditions = (parsed.conditions ?? []).filter((c) => names.has(c.field));
        parsed.sort = (parsed.sort ?? []).filter((s) => names.has(s.field));
        if (parsed.visibleColumns.length === 0) {
          parsed.visibleColumns = defaultState(fields).visibleColumns;
        }
        setState(parsed);
        return;
      } catch {
        /* corrupt entry — fall back to defaults */
      }
    }
    setState(defaultState(fields));
  }, [key, fields, state]);

  useEffect(() => {
    if (state) localStorage.setItem(storageKey(key), JSON.stringify(state));
  }, [key, state]);

  const update = useCallback((patch: Partial<TableState>) => {
    setState((s) => (s ? { ...s, ...patch } : s));
  }, []);

  const toggleColumn = useCallback((name: string) => {
    setState((s) => {
      if (!s) return s;
      const has = s.visibleColumns.includes(name);
      return {
        ...s,
        visibleColumns: has ? s.visibleColumns.filter((c) => c !== name) : [...s.visibleColumns, name],
      };
    });
  }, []);

  const toggleSort = useCallback((field: string) => {
    setState((s) => {
      if (!s) return s;
      const current = s.sort.find((x) => x.field === field);
      let sort: UISort[];
      if (!current) sort = [{ field, direction: 'ASC' }];
      else if (current.direction === 'ASC') sort = [{ field, direction: 'DESC' }];
      else sort = []; // third click removes sorting
      return { ...s, sort, page: 0 };
    });
  }, []);

  const setFilters = useCallback((logic: LogicOp, conditions: UICondition[]) => {
    setState((s) => (s ? { ...s, logic, conditions, page: 0 } : s));
  }, []);

  const reset = useCallback(() => setState(defaultState(fields)), [fields]);

  return { state, update, toggleColumn, toggleSort, setFilters, reset };
}