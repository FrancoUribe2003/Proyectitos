import { useEffect, useRef } from 'react';
import { SidebarContent } from './Sidebar';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onCloseRef.current();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      id="mobile-navigation"
      aria-label="Navegación"
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-ink lg:hidden"
    >
      <div className="flex h-full">
        <div className="h-full w-[min(19rem,86vw)] shrink-0 shadow-float">
          <SidebarContent
            onClose={() => dialogRef.current?.close()}
            onNavigate={() => dialogRef.current?.close()}
          />
        </div>
        <div
          className="h-full flex-1 bg-ink/35"
          onClick={() => dialogRef.current?.close()}
          aria-hidden="true"
        />
      </div>
    </dialog>
  );
}
