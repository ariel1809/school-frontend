import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Plus, Search, Users } from 'lucide-react';
import { api } from '@/lib/api';
import {
  gqlRequest,
  opNeedsListValue,
  opNeedsNoValue,
  opNeedsTwoValues,
  type FieldMeta,
  type FilterConditionInput,
  type FilterGroupInput,
  type PageResult,
} from '@/lib/graphql';
import { useTableState, type UICondition } from '@/hooks/useTableState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ColumnSelector } from '@/components/table/ColumnSelector';
import { FilterBuilder } from '@/components/table/FilterBuilder';
import { Pagination } from '@/components/table/Pagination';
import { QueryTable } from '@/components/table/QueryTable';

type StudentRow = Record<string, unknown> & { id: string };
type Classroom = { id: string; name: string };

const LABELS: Record<string, string> = {
  id: 'ID',
  matricule: 'Matricule',
  firstName: 'Prénom',
  lastName: 'Nom',
  gender: 'Genre',
  dateOfBirth: 'Date de naissance',
  placeOfBirth: 'Lieu de naissance',
  nationality: 'Nationalité',
  city: 'Ville',
  phone: 'Téléphone',
  email: 'Email',
  currentClassroomId: 'Classe',
  status: 'Statut',
  createdAt: 'Créé le',
  updatedAt: 'Modifié le',
};
const GENDER_LABELS: Record<string, string> = { MALE: 'Masculin', FEMALE: 'Féminin', OTHER: 'Autre' };

const FIELDS_QUERY = `query StudentFields {
  studentFields { name path type label defaultVisible filterable sortable enumOptions }
}`;

function buildStudentsQuery(columns: string[]): string {
  const selection = Array.from(new Set(['id', ...columns])).join(' ');
  return `query Students($filter: FilterGroup, $sort: [SortInput!], $page: PageInput) {
    students(filter: $filter, sort: $sort, page: $page) {
      content { ${selection} }
      page size totalElements totalPages first last
    }
  }`;
}

/** Drops incomplete rows and shapes UI conditions into the GraphQL FilterCondition input. */
function toConditions(conditions: UICondition[]): FilterConditionInput[] {
  return conditions
    .filter((c) => {
      if (opNeedsNoValue(c.op)) return true;
      if (opNeedsTwoValues(c.op)) return c.values?.length === 2 && c.values.every(Boolean);
      if (opNeedsListValue(c.op)) return (c.values?.length ?? 0) > 0;
      return c.value !== undefined && c.value !== '';
    })
    .map((c) => ({
      field: c.field,
      op: c.op,
      value: opNeedsNoValue(c.op) || opNeedsTwoValues(c.op) || opNeedsListValue(c.op) ? null : c.value,
      values: opNeedsTwoValues(c.op) || opNeedsListValue(c.op) ? c.values : null,
    }));
}

export function StudentsListPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // 1. Field catalog (drives columns + filter builder).
  const fieldsQ = useQuery({
    queryKey: ['student-fields'],
    queryFn: async () => (await gqlRequest<{ studentFields: FieldMeta[] }>('student-service', FIELDS_QUERY)).studentFields,
    staleTime: 5 * 60 * 1000,
  });
  const fields = useMemo(() => fieldsQ.data ?? [], [fieldsQ.data]);

  const { state, update, toggleColumn, toggleSort, setFilters } = useTableState('students', fields);

  // 2. Classroom names for the "Classe" column.
  const classroomsQ = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => (await api.get('/v1/classrooms')).data.data as Classroom[],
  });
  const classroomNameById = useMemo(
    () => new Map((classroomsQ.data ?? []).map((c) => [c.id, c.name])),
    [classroomsQ.data]
  );

  // 3. Compose the filter: quick search (OR over text fields) AND the builder's group.
  const filter = useMemo<FilterGroupInput | null>(() => {
    if (!state) return null;
    const names = new Set(fields.map((f) => f.name));
    const searchTargets = ['lastName', 'firstName', 'matricule'].filter((n) => names.has(n));
    const searchGroup: FilterGroupInput | null =
      debounced && searchTargets.length
        ? { op: 'OR', conditions: searchTargets.map((f) => ({ field: f, op: 'LIKE', value: debounced })) }
        : null;
    const builderConds = toConditions(state.conditions);
    const builderGroup: FilterGroupInput | null = builderConds.length ? { op: state.logic, conditions: builderConds } : null;

    const groups = [searchGroup, builderGroup].filter(Boolean) as FilterGroupInput[];
    if (groups.length === 0) return null;
    if (groups.length === 1) return groups[0];
    return { op: 'AND', groups };
  }, [state, debounced, fields]);

  // 4. The dynamic, paginated query.
  const studentsQ = useQuery({
    queryKey: ['students-gql', state?.visibleColumns, state?.sort, state?.page, state?.size, filter],
    enabled: !!state && fields.length > 0,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await gqlRequest<{ students: PageResult<StudentRow> }>(
        'student-service',
        buildStudentsQuery(state!.visibleColumns),
        { filter, sort: state!.sort, page: { page: state!.page, size: state!.size } }
      );
      return data.students;
    },
  });

  const labelOf = (f: FieldMeta) => LABELS[f.name] ?? f.label ?? f.name;
  const page = studentsQ.data;
  const total = page?.totalElements ?? 0;
  const rows = page?.content ?? [];

  const cellRenderers: Record<string, (row: StudentRow) => ReactNode> = {
    status: (r) => <StatusBadge status={String(r.status)} />,
    gender: (r) => <span className="text-sm text-muted-foreground">{GENDER_LABELS[String(r.gender)] ?? '—'}</span>,
    currentClassroomId: (r) =>
      r.currentClassroomId ? (
        <span className="text-sm">{classroomNameById.get(String(r.currentClassroomId)) ?? '—'}</span>
      ) : (
        <span className="text-xs italic text-muted-foreground">Non affecté</span>
      ),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pédagogie"
        title="Élèves"
        description={`${total} élève${total > 1 ? 's' : ''} enregistré${total > 1 ? 's' : ''} dans le système.`}
        actions={
          <Button asChild>
            <Link to="/students/enroll">
              <Plus className="h-4 w-4" />
              Nouvelle inscription
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-start gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher (nom, prénom, matricule)…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {state && (
          <>
            <FilterBuilder
              fields={fields}
              logic={state.logic}
              conditions={state.conditions}
              onApply={setFilters}
              labelOf={labelOf}
            />
            <ColumnSelector
              fields={fields}
              visibleColumns={state.visibleColumns}
              onToggle={toggleColumn}
              labelOf={labelOf}
            />
          </>
        )}
      </div>

      {state && (
        <>
          <QueryTable<StudentRow>
            fields={fields}
            visibleColumns={state.visibleColumns}
            rows={rows}
            sort={state.sort}
            onToggleSort={toggleSort}
            labelOf={labelOf}
            rowKey={(r) => r.id}
            cellRenderers={cellRenderers}
            actions={(r) => (
              <Button asChild variant="ghost" size="sm">
                <Link to={`/students/${r.id}`}>Voir</Link>
              </Button>
            )}
          />

          {rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aucun élève"
              description="Aucun élève ne correspond aux filtres."
            />
          ) : (
            <Pagination
              page={page!.page}
              size={page!.size}
              totalElements={page!.totalElements}
              totalPages={page!.totalPages}
              first={page!.first}
              last={page!.last}
              onPage={(p) => update({ page: p })}
              onSize={(s) => update({ size: s, page: 0 })}
            />
          )}
        </>
      )}
    </div>
  );
}