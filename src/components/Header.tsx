import React from 'react';
import { Menu, Share2 } from 'lucide-react';
import { BUSINESS_INFO } from '../config/constants';

interface HeaderProps {
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: BUSINESS_INFO.name,
          text: BUSINESS_INFO.description,
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
    <header className="bg-primary text-cream">
      <div className="mx-auto flex h-[3.75rem] max-w-6xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6">
        <button type="button" aria-label="Abrir menu" onClick={onOpenMenu}
          className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-cream">
          <Menu size={21} strokeWidth={1.6} aria-hidden="true" />
        </button>
        <img src="/logo.png" alt={BUSINESS_INFO.name} width={112} height={50} className="h-12 w-28 object-contain sm:w-32" />
        <button
          type="button"
          aria-label="Partilhar catálogo"
          onClick={handleShare}
          className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-cream"
        >
          <Share2 size={19} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
