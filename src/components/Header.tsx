import React from 'react';
import { Menu, Share2 } from 'lucide-react';
import { BUSINESS_INFO } from '../config/constants';

interface HeaderProps {
  onOpenMenu: () => void;
  showShare?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu, showShare = true }) => {
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
    <header className="relative text-on-strong">
      <div className={'page-width grid grid-cols-[2.75rem_1fr_2.75rem] items-center ' + (showShare ? 'min-h-24 pt-3 sm:min-h-28' : 'min-h-18')}>
        <button type="button" aria-label="Abrir menu" onClick={onOpenMenu}
          className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface/10 focus-visible:outline-2 focus-visible:outline-cream">
          <Menu size={21} strokeWidth={1.6} aria-hidden="true" />
        </button>
        <img src="/logo.png" alt={BUSINESS_INFO.name} width={1176} height={521}
          className={'mx-auto h-auto ' + (showShare ? 'w-36 sm:w-40' : 'w-28')} />
        {showShare && <button
          type="button"
          aria-label="Partilhar catálogo"
          onClick={handleShare}
          className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface/10 focus-visible:outline-2 focus-visible:outline-cream"
        >
          <Share2 size={19} strokeWidth={1.6} aria-hidden="true" />
        </button>}
      </div>
    </header>
  );
};
