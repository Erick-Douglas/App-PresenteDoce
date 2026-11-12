import { useEffect, useId, useRef } from 'react';
import { ArrowUpRight, Calculator, Home, Info, LogIn, LogOut, Package, Plus, X } from 'lucide-react';
import type { View } from '../config/types';
import { BUSINESS_INFO } from '../config/constants';

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
}

export function Sidebar({ isOpen, onClose, onNavigate, isAdmin, onLogin, onLogout, onManage, onNewProduct, onPricing }: SidebarProps) {
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
    { icon: Info, label: 'Sobre nós', action: () => onNavigate('settings') },
    ...(isAdmin ? [
      { icon: Package, label: 'Gerir catálogo', action: onManage },
      { icon: Plus, label: 'Novo produto', action: onNewProduct },
      { icon: Calculator, label: 'Precificação', action: onPricing },
      { icon: LogOut, label: 'Sair da conta', action: onLogout },
    ] : [{ icon: LogIn, label: 'Entrar', action: onLogin }]),
  ];

  return (
    <dialog ref={ref} aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); dismiss(); }}
      onClick={event => { if (event.target === event.currentTarget) dismiss(); }}
      className="fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-none w-[300px] max-w-[90vw] bg-porcelain text-stone-800 shadow-xl backdrop:bg-stone-950/50">
      <div className="flex h-full flex-col">
        <div className="mx-5 flex items-center justify-between border-b border-stone-200 py-4">
          <h2 id={titleId} className="font-editorial text-3xl leading-none text-primary">Menu</h2>
          <button type="button" aria-label="Fechar menu" onClick={dismiss} className="-mr-1 grid size-11 place-items-center rounded-full text-stone-600 hover:bg-primary/5 hover:text-primary">
            <X size={19} strokeWidth={1.5} />
          </button>
        </div>

        <nav aria-label="Menu principal" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map(({ icon: Icon, label, action }) => (
            <button key={label} type="button" onClick={() => { dismiss(); action(); }}
              className="group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-stone-700 transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
              <Icon size={18} strokeWidth={1.65} aria-hidden="true" className="text-stone-500 group-hover:text-primary" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="mx-5 border-t border-stone-200 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <a href={'https://wa.me/' + BUSINESS_INFO.whatsapp.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl px-1 py-2 text-stone-800 transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary">
            <img src="/atendimento.jpg" alt="" width={44} height={44} loading="lazy" className="size-11 shrink-0 rounded-full object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-snug">Falar com a confeitaria</span>
              <span className="block text-xs text-stone-600">WhatsApp</span>
            </span>
            <ArrowUpRight size={16} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-stone-500 group-hover:text-primary" />
          </a>
        </div>
      </div>
    </dialog>
  );
}
