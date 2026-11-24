import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Uses the native <dialog> so the browser provides the focus trap, Escape
 * handling, inert background and focus restoration.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  initialFocusRef,
  className = '',
  size = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    const frame = window.requestAnimationFrame(() => {
      const target = initialFocusRef?.current;
      if (target) {
        target.focus();
        return;
      }
      const autofocus = dialog.querySelector<HTMLElement>('[autofocus]');
      autofocus?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, initialFocusRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onCloseRef.current();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [open]);

  if (!open) return null;

  const widthClass =
    size === 'sm'
      ? 'w-[min(26rem,calc(100vw-2rem))]'
      : size === 'lg'
        ? 'w-[min(48rem,calc(100vw-2rem))]'
        : 'w-[min(36rem,calc(100vw-2rem))]';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={`m-auto ${widthClass} max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-float ${className}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
    >
      <div className="flex items-start justify-between gap-6 border-b border-line px-6 py-5">
        <div>
          <h2
            id={titleId}
            className="text-[1.6rem] leading-tight text-ink"
          >
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-1.5 text-sm text-ink-soft">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          className="icon-btn -mr-2 -mt-1"
          onClick={() => dialogRef.current?.close()}
          aria-label="Cerrar"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
