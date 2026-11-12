import React from 'react';
import { Gift, Menu, Share2 } from 'lucide-react';
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
    <header className="bg-porcelain">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3.5">
        <button type="button" aria-label="Abrir menu" onClick={onOpenMenu}
          className="grid size-11 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary">
          <Menu size={21} strokeWidth={1.6} aria-hidden="true" />
        </button>
        <span className="flex items-center gap-2 whitespace-nowrap text-primary">
          <Gift size={17} strokeWidth={1.5} aria-hidden="true" />
          <span className="font-editorial text-[1.7rem] leading-none sm:text-3xl">{BUSINESS_INFO.name}</span>
        </span>
        <button
          type="button"
          aria-label="Partilhar catálogo"
          onClick={handleShare}
          className="grid size-11 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Share2 size={19} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
