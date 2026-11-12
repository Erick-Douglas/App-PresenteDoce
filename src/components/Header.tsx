import React from 'react';
import { Share2, Menu } from 'lucide-react';
import { BUSINESS_INFO } from '../config/constants';

interface HeaderProps {
  onOpenMenu: () => void;
  onLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu, onLogin }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Presente Doce',
          text: 'Confeitaria artesanal por encomenda.',
          url: BUSINESS_INFO.website,
        });
      } catch { /* noop */ }
    } else {
      try {
        await navigator.clipboard.writeText(BUSINESS_INFO.website);
        alert('Link copiado!');
      } catch {
        alert(BUSINESS_INFO.website);
      }
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent py-5">
      <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center relative">
        {/* Logo Centralizada */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <img src="/logo.png" alt="Presente Doce" className="object-contain h-12 drop-shadow-2xl brightness-110" />
        </div>
        <div className="flex items-center gap-1 text-white">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={onOpenMenu}
            className="min-h-11 min-w-11 p-2 transition-all active:scale-95 flex items-center justify-center hover:text-white/80"
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
          {onLogin && <button type="button" onClick={onLogin} className="min-h-11 rounded-xl bg-black/35 px-2.5 text-xs font-bold hover:bg-black/50">Entrar</button>}
        </div>

        <button
          aria-label="Partilhar catálogo"
          onClick={handleShare}
          className="p-2 transition-all active:scale-95 flex items-center gap-2 text-white hover:text-white/80"
        >
          <Share2 size={20} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
};
