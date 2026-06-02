import { cn } from '@/lib/utils';

export function getInitials(name?: string, fallback = '?') {
  if (!name) return fallback;
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface AvatarProps {
  src?: string | null;
  name?: string;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-28 w-28 text-3xl',
};

export function Avatar({ src, name, firstName, lastName, size = 'md', className }: AvatarProps) {
  const initials = firstName || lastName
    ? `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? `${firstName ?? ''} ${lastName ?? ''}`}
        className={cn('rounded-lg object-cover ring-1 ring-border', sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'rounded-lg bg-primary-soft text-primary flex items-center justify-center font-semibold shrink-0',
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}