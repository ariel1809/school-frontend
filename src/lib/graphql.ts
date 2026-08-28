import { api } from './api';

/**
 * Minimal GraphQL client built on the existing axios instance, so it transparently
 * reuses the Bearer-token injection and the 401 refresh-and-retry interceptor.
 * Each service exposes its own subgraph behind the gateway at `/graphql/{service}`.
 */

export type FieldType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'ENUM' | 'UUID' | 'ID';

/** Self-describing field metadata returned by `<entity>Fields`; drives the table UI. */
export type FieldMeta = {
  name: string;
  path: string;
  type: FieldType;
  label: string;
  defaultVisible: boolean;
  filterable: boolean;
  sortable: boolean;
  enumOptions?: string[] | null;
};

export type FilterOp =
  | 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE'
  | 'LIKE' | 'STARTS' | 'ENDS' | 'IN' | 'BETWEEN'
  | 'IS_NULL' | 'IS_NOT_NULL';
export type LogicOp = 'AND' | 'OR';
export type SortDir = 'ASC' | 'DESC';

export type FilterConditionInput = { field: string; op: FilterOp; value?: string | null; values?: string[] | null };
export type FilterGroupInput = { op: LogicOp; conditions?: FilterConditionInput[]; groups?: FilterGroupInput[] };
export type PageResult<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

type GraphQLResponse<T> = { data?: T; errors?: Array<{ message: string }> };

export async function gqlRequest<T>(
  service: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await api.post(`/graphql/${service}`, { query, variables });
  const body = res.data as GraphQLResponse<T>;
  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join('; '));
  }
  return body.data as T;
}

/** Operators offered in the filter builder, per logical field type. */
export const OPS_BY_TYPE: Record<FieldType, FilterOp[]> = {
  STRING: ['LIKE', 'EQ', 'NE', 'STARTS', 'ENDS', 'IS_NULL', 'IS_NOT_NULL'],
  NUMBER: ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'BETWEEN', 'IS_NULL', 'IS_NOT_NULL'],
  DATE: ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'BETWEEN', 'IS_NULL', 'IS_NOT_NULL'],
  DATETIME: ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'BETWEEN', 'IS_NULL', 'IS_NOT_NULL'],
  ENUM: ['EQ', 'NE', 'IN', 'IS_NULL', 'IS_NOT_NULL'],
  UUID: ['EQ', 'NE', 'IN', 'IS_NULL', 'IS_NOT_NULL'],
  ID: ['EQ', 'NE', 'IN'],
  BOOLEAN: ['EQ'],
};

export const OP_LABELS: Record<FilterOp, string> = {
  EQ: '=',
  NE: '≠',
  GT: '>',
  GTE: '≥',
  LT: '<',
  LTE: '≤',
  LIKE: 'contient',
  STARTS: 'commence par',
  ENDS: 'finit par',
  IN: 'parmi',
  BETWEEN: 'entre',
  IS_NULL: 'est vide',
  IS_NOT_NULL: 'non vide',
};

export function opNeedsNoValue(op: FilterOp): boolean {
  return op === 'IS_NULL' || op === 'IS_NOT_NULL';
}

export function opNeedsTwoValues(op: FilterOp): boolean {
  return op === 'BETWEEN';
}

export function opNeedsListValue(op: FilterOp): boolean {
  return op === 'IN';
}