import React from 'react';
import { Share2, Menu } from 'lucide-react';

interface HeaderProps {
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Presente Doce',
          text: 'Descubra os melhores doces, bolos, tortas e kits para festas!',
          url: window.location.href,
        });
      } catch { /* noop */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent py-5">
      <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center relative">
        {/* Logo Centralizada */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <img src="/logo.png" alt="Presente Doce" className="object-contain h-12 drop-shadow-2xl brightness-110" />
        </div>
        <button
          onClick={onOpenMenu}
          className="p-2 transition-all active:scale-95 flex items-center justify-center text-white hover:text-white/80"
        >
          <Menu size={24} strokeWidth={1.5} />
        </button>

        <button
          onClick={handleShare}
          className="p-2 transition-all active:scale-95 flex items-center gap-2 text-white hover:text-white/80"
        >
          <Share2 size={20} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
};
