import { useEffect, useId, useRef } from 'react';
import { Calculator, Download, FileText, Heart, Home, Info, LayoutGrid, LogIn, LogOut, Package, Phone, Plus, X } from 'lucide-react';
import type { View } from '../config/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onInstall?: () => void;
}

export function Sidebar({ isOpen, onClose, onNavigate, isAdmin, onLogin, onLogout, onInstall }: SidebarProps) {
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
    { icon: Phone, label: 'Contactos', action: () => onNavigate('contact') },
    ...(onInstall ? [{ icon: Download, label: 'Instalar app', action: onInstall }] : []),
    ...(isAdmin ? [
      { icon: Package, label: 'Gerir catálogo', action: () => onNavigate('catalog-admin') },
      { icon: Plus, label: 'Novo produto', action: () => onNavigate('product-editor') },
      { icon: Calculator, label: 'Precificação', action: () => onNavigate('pricing') },
      { icon: FileText, label: 'Textos da loja', action: () => onNavigate('store-texts') },
      { icon: LogOut, label: 'Sair da conta', action: onLogout },
    ] : [{ icon: LogIn, label: 'Entrar', action: onLogin }]),
  ];

  return (
    <dialog ref={ref} aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); dismiss(); }}
      onClick={event => { if (event.target === event.currentTarget) dismiss(); }}
      className="fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-none w-[300px] max-w-[90vw] bg-porcelain text-on-surface shadow-xl backdrop:bg-overlay/50">
      <div className="flex h-full flex-col">
        <div className="mx-5 flex items-center justify-between border-b border-outline pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <h2 id={titleId} className="type-module text-primary">Menu</h2>
          <button type="button" aria-label="Fechar menu" onClick={dismiss} className="-mr-1 grid size-11 place-items-center rounded-full text-muted hover:bg-primary/5 hover:text-primary">
            <X size={19} strokeWidth={1.5} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-y-contain px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <nav aria-label="Menu principal" className="space-y-1">
            {menuItems.map(({ icon: Icon, label, action }) => (
              <button key={label} type="button" onClick={() => { dismiss(); action(); }}
                className="group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-on-surface transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
                <Icon size={17} strokeWidth={1.65} aria-hidden="true" className="text-muted group-hover:text-primary" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </dialog>
  );
}
