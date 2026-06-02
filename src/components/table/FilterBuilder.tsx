import { useState } from 'react';
import { Plus, Trash2, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  OPS_BY_TYPE,
  OP_LABELS,
  opNeedsNoValue,
  opNeedsTwoValues,
  opNeedsListValue,
  type FieldMeta,
  type FilterOp,
  type LogicOp,
} from '@/lib/graphql';
import type { UICondition } from '@/hooks/useTableState';

type Props = {
  fields: FieldMeta[];
  logic: LogicOp;
  conditions: UICondition[];
  onApply: (logic: LogicOp, conditions: UICondition[]) => void;
  labelOf: (field: FieldMeta) => string;
};

function newCondition(field: FieldMeta): UICondition {
  return { id: crypto.randomUUID(), field: field.name, op: OPS_BY_TYPE[field.type][0] };
}

export function FilterBuilder({ fields, logic, conditions, onApply, labelOf }: Props) {
  const filterable = fields.filter((f) => f.filterable);
  const [open, setOpen] = useState(false);
  const [draftLogic, setDraftLogic] = useState<LogicOp>(logic);
  const [draft, setDraft] = useState<UICondition[]>(conditions);

  const fieldByName = new Map(fields.map((f) => [f.name, f]));

  const patch = (id: string, p: Partial<UICondition>) =>
    setDraft((d) => d.map((c) => (c.id === id ? { ...c, ...p } : c)));

  const addRow = () => {
    if (filterable.length) setDraft((d) => [...d, newCondition(filterable[0])]);
  };
  const removeRow = (id: string) => setDraft((d) => d.filter((c) => c.id !== id));

  const apply = () => {
    onApply(draftLogic, draft);
    setOpen(false);
  };
  const clearAll = () => {
    setDraft([]);
    onApply(draftLogic, []);
  };

  const renderValue = (c: UICondition) => {
    const field = fieldByName.get(c.field);
    if (!field || opNeedsNoValue(c.op)) return null;

    if (opNeedsTwoValues(c.op)) {
      const inputType = field.type === 'DATE' ? 'date' : field.type === 'DATETIME' ? 'datetime-local' : field.type === 'NUMBER' ? 'number' : 'text';
      return (
        <div className="flex items-center gap-1">
          <Input
            type={inputType}
            className="h-9 w-36"
            value={c.values?.[0] ?? ''}
            onChange={(e) => patch(c.id, { values: [e.target.value, c.values?.[1] ?? ''] })}
          />
          <span className="text-muted-foreground">→</span>
          <Input
            type={inputType}
            className="h-9 w-36"
            value={c.values?.[1] ?? ''}
            onChange={(e) => patch(c.id, { values: [c.values?.[0] ?? '', e.target.value] })}
          />
        </div>
      );
    }

    if (opNeedsListValue(c.op)) {
      return (
        <Input
          className="h-9 w-56"
          placeholder="valeurs séparées par des virgules"
          value={c.values?.join(', ') ?? ''}
          onChange={(e) => patch(c.id, { values: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
        />
      );
    }

    if (field.type === 'ENUM' && field.enumOptions) {
      return (
        <Select className="h-9 w-48" value={c.value ?? ''} onChange={(e) => patch(c.id, { value: e.target.value })}>
          <option value="">—</option>
          {field.enumOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      );
    }
    if (field.type === 'BOOLEAN') {
      return (
        <Select className="h-9 w-32" value={c.value ?? ''} onChange={(e) => patch(c.id, { value: e.target.value })}>
          <option value="">—</option>
          <option value="true">Oui</option>
          <option value="false">Non</option>
        </Select>
      );
    }
    const inputType = field.type === 'DATE' ? 'date' : field.type === 'DATETIME' ? 'datetime-local' : field.type === 'NUMBER' ? 'number' : 'text';
    return (
      <Input
        type={inputType}
        className="h-9 w-56"
        value={c.value ?? ''}
        onChange={(e) => patch(c.id, { value: e.target.value })}
      />
    );
  };

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen((o) => !o)}>
        <Filter className="h-4 w-4" />
        Filtres
        {conditions.length > 0 && (
          <span className="ml-1 rounded bg-primary px-1.5 text-xs text-primary-foreground">{conditions.length}</span>
        )}
      </Button>

      {open && (
        <div className="mt-3 rounded-lg border border-border bg-card p-4 shadow-soft">
          {draft.length > 1 && (
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Combiner avec</span>
              <Select className="h-8 w-24" value={draftLogic} onChange={(e) => setDraftLogic(e.target.value as LogicOp)}>
                <option value="AND">ET</option>
                <option value="OR">OU</option>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            {draft.map((c) => {
              const field = fieldByName.get(c.field);
              const ops: FilterOp[] = field ? OPS_BY_TYPE[field.type] : ['EQ'];
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-2">
                  <Select
                    className="h-9 w-44"
                    value={c.field}
                    onChange={(e) => {
                      const f = fieldByName.get(e.target.value)!;
                      patch(c.id, { field: f.name, op: OPS_BY_TYPE[f.type][0], value: undefined, values: undefined });
                    }}
                  >
                    {filterable.map((f) => (
                      <option key={f.name} value={f.name}>
                        {labelOf(f)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    className="h-9 w-40"
                    value={c.op}
                    onChange={(e) => patch(c.id, { op: e.target.value as FilterOp, value: undefined, values: undefined })}
                  >
                    {ops.map((op) => (
                      <option key={op} value={op}>
                        {OP_LABELS[op]}
                      </option>
                    ))}
                  </Select>
                  {renderValue(c)}
                  <Button variant="ghost" size="icon-sm" onClick={() => removeRow(c.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4" />
              Ajouter une condition
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <X className="h-4 w-4" />
                Effacer
              </Button>
              <Button size="sm" onClick={apply}>
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}