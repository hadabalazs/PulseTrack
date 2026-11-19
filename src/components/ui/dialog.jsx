import * as Dialog from '@radix-ui/react-dialog';
import { useLayoutEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Modal({ open, onClose, title, description, children, fullScreen = false, returnFocus = null, initialFocus = null, onBack = null }) {
  // Install before paint, so Escape also works in the first frame of a new dialog.
  useLayoutEffect(() => {
    if (!open) return;
    const dismiss = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();event.stopPropagation();
      if (onBack) onBack();else onClose();
    };
    document.addEventListener('keydown', dismiss, true);
    return () => document.removeEventListener('keydown', dismiss, true);
  }, [open, onClose, onBack]);
  return <Dialog.Root open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm" />
      <Dialog.Content
        className={cn('fixed z-[81] bg-card text-card-foreground border shadow-2xl flex flex-col focus:outline-none', fullScreen
          ? 'inset-0 sm:inset-6 sm:rounded-3xl max-w-5xl sm:mx-auto'
          : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl w-[calc(100%-2rem)] max-w-md max-h-[90dvh]')}
        onOpenAutoFocus={event => { if (initialFocus?.current) { event.preventDefault(); initialFocus.current.focus(); } }}
        onCloseAutoFocus={event => { if (returnFocus?.isConnected) { event.preventDefault(); returnFocus.focus(); } }}
        onEscapeKeyDown={event => { if (onBack) { event.preventDefault(); onBack(); } }}
      >
        <div className="flex items-start gap-3 p-5 pb-4 shrink-0 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="flex-1 min-w-0"><Dialog.Title className="font-display text-xl font-bold">{title}</Dialog.Title><Dialog.Description className="text-sm text-muted-foreground mt-1">{description}</Dialog.Description></div>
          <Dialog.Close className="h-11 w-11 shrink-0 rounded-xl hover:bg-muted flex items-center justify-center" aria-label="Close dialog"><X className="w-5 h-5" /></Dialog.Close>
        </div>
        <div data-modal-scroll className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
