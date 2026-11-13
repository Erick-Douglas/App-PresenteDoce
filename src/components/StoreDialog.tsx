import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function StoreDialog({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={event => {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto overscroll-y-contain rounded-t-3xl bg-porcelain text-on-surface shadow-2xl backdrop:bg-black/55 sm:inset-0 sm:m-auto sm:max-w-2xl sm:rounded-3xl"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-primary px-5 py-2 text-on-primary sm:px-7">
        <h2 id={titleId} className="type-module">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Fechar" className="store-icon-action">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-7">{children}</div>
    </dialog>
  );
}
