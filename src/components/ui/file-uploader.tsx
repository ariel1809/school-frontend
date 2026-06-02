import { useCallback, useId, useRef, useState } from 'react';
import { Loader2, UploadCloud, X, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveFileUrl, extractError } from '@/lib/api';
import { Button } from '@/components/ui/button';

export type FileUploaderProps = {
  /** Current file URL (e.g. returned by the backend after a previous upload). */
  value?: string | null;
  /** Original filename to display alongside non-image previews. */
  filename?: string | null;
  /** Called when the user picks/drops a file. Parent handles the API call. */
  onUpload: (file: File) => Promise<void>;
  /** Optional remove handler. If omitted, the remove button is hidden. */
  onRemove?: () => Promise<void>;
  /** Accept attribute for the underlying input (e.g. `image/*`). */
  accept?: string;
  /** Max file size in megabytes. Defaults to 10. */
  maxSizeMB?: number;
  /** Field label shown above the dropzone. */
  label?: string;
  /** Helper text rendered under the label. */
  helperText?: string;
  /** When true, the uploader is read-only. */
  disabled?: boolean;
  /** When true, render the preview as a square (e.g. avatars). Default: rectangle. */
  square?: boolean;
  className?: string;
};

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';

export function FileUploader({
  value,
  filename,
  onUpload,
  onRemove,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 10,
  label,
  helperText,
  disabled,
  square,
  className,
}: FileUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolved = resolveFileUrl(value ?? null);
  const isImage =
    !!resolved &&
    (!!resolved.match(/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i) ||
      // backend file-service URLs end in `/content` — we trust the MIME-type via the server
      resolved.includes('/files/'));

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`Fichier trop volumineux (max ${maxSizeMB} Mo).`);
        return;
      }
      setError(null);
      setBusy(true);
      try {
        await onUpload(file);
      } catch (e: unknown) {
        setError(extractError(e) || 'Échec du téléversement');
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [maxSizeMB, onUpload]
  );

  const handleRemove = useCallback(async () => {
    if (!onRemove) return;
    setBusy(true);
    setError(null);
    try {
      await onRemove();
    } catch (e: unknown) {
      setError(extractError(e) || 'Échec de la suppression');
    } finally {
      setBusy(false);
    }
  }, [onRemove]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div>
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
          {helperText && <p className="text-xs text-muted-foreground mt-0.5">{helperText}</p>}
        </div>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled || busy) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          if (disabled || busy) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          if (disabled || busy) return;
          e.preventDefault();
          setIsDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'group relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDragging ? 'border-primary bg-primary-soft/40' : 'border-input bg-card hover:border-primary/40',
          disabled && 'opacity-60 cursor-not-allowed',
          square ? 'aspect-square w-40 mx-0' : 'min-h-[180px]'
        )}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled || busy}
          onChange={(e) => void handleFiles(e.target.files)}
        />

        {resolved ? (
          <div className="flex w-full flex-col items-center gap-3">
            {isImage ? (
              <img
                src={resolved}
                alt={filename ?? 'preview'}
                className={cn(
                  'rounded-md object-contain border border-input bg-muted/30',
                  square ? 'h-32 w-32' : 'max-h-32 max-w-full'
                )}
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="truncate max-w-[16rem]">{filename ?? 'Fichier'}</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || busy}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Remplacer
              </Button>
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleRemove();
                  }}
                >
                  <X className="h-4 w-4" />
                  Retirer
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {busy ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Glissez un fichier ici, ou <span className="text-primary underline">parcourez</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {acceptDescription(accept)} · max {maxSizeMB} Mo
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-xs text-destructive"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function acceptDescription(accept: string): string {
  const parts = accept
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'Tous types de fichiers';
  if (parts.every((p) => p.startsWith('image/'))) return 'Images';
  if (parts.every((p) => p === 'application/pdf')) return 'PDF';
  const exts = parts
    .map((p) => {
      if (p.startsWith('.')) return p.slice(1).toUpperCase();
      if (p === 'application/pdf') return 'PDF';
      if (p === 'image/png') return 'PNG';
      if (p === 'image/jpeg' || p === 'image/jpg') return 'JPG';
      if (p === 'image/webp') return 'WEBP';
      if (p === 'image/gif') return 'GIF';
      if (p === 'image/svg+xml') return 'SVG';
      return null;
    })
    .filter(Boolean) as string[];
  return exts.length > 0 ? exts.join(', ') : 'Fichiers acceptés';
}