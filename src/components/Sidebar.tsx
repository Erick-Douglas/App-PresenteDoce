import { useEffect, useId, useRef } from 'react';
import { Calculator, Home, Info, LogIn, LogOut, MessageCircle, Package, Plus, X } from 'lucide-react';
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

        <div className="overflow-y-auto overscroll-y-contain px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <nav aria-label="Menu principal" className="space-y-1">
          {menuItems.map(({ icon: Icon, label, action }) => (
            <button key={label} type="button" onClick={() => { dismiss(); action(); }}
              className="group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-stone-700 transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
              <Icon size={18} strokeWidth={1.65} aria-hidden="true" className="text-stone-500 group-hover:text-primary" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

          <a href={'https://wa.me/' + BUSINESS_INFO.whatsapp.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer"
            className="group mx-1 mt-4 flex items-center gap-3 rounded-2xl border border-emerald-900/15 bg-linear-to-br from-white to-emerald-50 px-3 py-3 text-stone-800 shadow-sm transition hover:border-emerald-700/35 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">
            <span className="relative shrink-0">
              <img src="/atendimento.jpg" alt="" width={44} height={44} loading="lazy" className="size-11 rounded-full object-cover ring-1 ring-emerald-900/15" />
              <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-emerald-700 text-white ring-2 ring-white">
                <MessageCircle size={12} strokeWidth={1.8} aria-hidden="true" />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-snug">Falar com a confeitaria</span>
              <span className="mt-0.5 block text-xs font-semibold text-emerald-800">WhatsApp</span>
            </span>
          </a>
        </div>
      </div>
    </dialog>
  );
}
