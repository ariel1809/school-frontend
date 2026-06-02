import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  steps: { key: string; label: string }[];
  current: number;
  onStepClick?: (idx: number) => void;
  className?: string;
}

export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn('flex items-center gap-2 overflow-x-auto', className)}>
      {steps.map((step, i) => {
        const isCompleted = i < current;
        const isActive = i === current;
        const clickable = !!onStepClick && isCompleted;
        return (
          <li key={step.key} className="flex-1 min-w-[120px]">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(i)}
              className={cn(
                'group w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg border transition-all',
                isActive && 'border-primary bg-primary-soft/60',
                isCompleted && 'border-success/30 bg-success-soft hover:bg-success-soft/70 cursor-pointer',
                !isActive && !isCompleted && 'border-border/70 bg-card opacity-70',
                clickable && 'hover:border-primary/40'
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0',
                  isCompleted && 'bg-success text-success-foreground',
                  isActive && 'bg-primary text-primary-foreground',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Étape {i + 1}
                </div>
                <div
                  className={cn(
                    'text-sm font-medium truncate',
                    isActive ? 'text-foreground' : isCompleted ? 'text-success' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}