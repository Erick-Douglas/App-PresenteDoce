import { useEffect, useId, useRef } from 'react';
import { Calculator, FileText, Heart, Home, Info, LayoutGrid, LogIn, LogOut, MessageCircle, Package, Plus, X } from 'lucide-react';
import type { View } from '../config/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onManage: () => void;
  onNewProduct: () => void;
  onPricing: () => void;
  onPresentation: () => void;
}

export function Sidebar({ isOpen, onClose, onNavigate, isAdmin, onLogin, onLogout, onManage, onNewProduct, onPricing, onPresentation }: SidebarProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [isOpen]);

  if (!isOpen) return null;

  function dismiss() {
    ref.current?.close();
    onClose();
  }

  const menuItems = [
    { icon: Home, label: 'Início', action: () => onNavigate('home') },
    { icon: LayoutGrid, label: 'Todas as categorias', action: () => onNavigate('categories-list') },
    { icon: Heart, label: 'Favoritos', action: () => onNavigate('saved') },
    { icon: Info, label: 'Sobre nós', action: () => onNavigate('settings') },
    ...(isAdmin ? [
      { icon: Package, label: 'Gerir catálogo', action: onManage },
      { icon: Plus, label: 'Novo produto', action: onNewProduct },
      { icon: Calculator, label: 'Precificação', action: onPricing },
      { icon: FileText, label: 'Textos da loja', action: onPresentation },
      { icon: LogOut, label: 'Sair da conta', action: onLogout },
    ] : [{ icon: LogIn, label: 'Entrar', action: onLogin }]),
  ];

  return (
    <dialog ref={ref} aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); dismiss(); }}
      onClick={event => { if (event.target === event.currentTarget) dismiss(); }}
      className="fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-none w-[300px] max-w-[90vw] bg-porcelain text-on-surface shadow-xl backdrop:bg-overlay/50">
      <div className="flex h-full flex-col">
        <div className="mx-5 flex items-center justify-between border-b border-outline py-4">
          <h2 id={titleId} className="type-module text-primary">Menu</h2>
          <button type="button" aria-label="Fechar menu" onClick={dismiss} className="-mr-1 grid size-11 place-items-center rounded-full text-muted hover:bg-primary/5 hover:text-primary">
            <X size={19} strokeWidth={1.5} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-y-contain px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <nav aria-label="Menu principal" className="space-y-1">
          {menuItems.map(({ icon: Icon, label, action }) => (
            <button key={label} type="button" onClick={() => { dismiss(); action(); }}
              className="group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-on-surface transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
              <Icon size={18} strokeWidth={1.65} aria-hidden="true" className="text-muted group-hover:text-primary" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

          <button type="button" onClick={() => { dismiss(); onNavigate('contact'); }}
            className="ui-glass-panel mt-3 flex w-full items-center gap-3 text-left text-on-surface hover:border-primary/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <span className="relative shrink-0">
              <img src="/atendimento.jpg" alt="" width={44} height={44} loading="lazy" className="size-11 rounded-full object-cover ring-1 ring-emerald-900/15" />
              <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-primary text-on-strong ring-2 ring-surface">
                <MessageCircle size={12} strokeWidth={1.8} aria-hidden="true" />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-snug">Falar com a confeitaria</span>
              <span className="mt-0.5 block text-xs text-muted">Contactos</span>
            </span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
