import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

type Props = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
};

const SIZES = [10, 20, 50, 100];

export function Pagination({ page, size, totalElements, totalPages, first, last, onPage, onSize }: Props) {
  const from = totalElements === 0 ? 0 : page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <div>
        {from}–{to} sur {totalElements}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span>Par page</span>
          <Select className="h-8 w-auto" value={String(size)} onChange={(e) => onSize(Number(e.target.value))}>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" disabled={first} onClick={() => onPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2">
            {totalPages === 0 ? 0 : page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="icon-sm" disabled={last} onClick={() => onPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}