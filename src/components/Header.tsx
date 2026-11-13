import { useState } from 'react';
import { Menu, Share2 } from 'lucide-react';
import { BUSINESS_INFO } from '../config/constants';

interface HeaderProps {
  onOpenMenu: () => void;
  showShare?: boolean;
}

export function Header({ onOpenMenu, showShare = true }: HeaderProps) {
  const [shareNotice, setShareNotice] = useState('');

  const handleShare = async () => {
    const { name, description, website } = BUSINESS_INFO;
    setShareNotice('');
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: description, url: website });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText([name, description, website].join('\n'));
      setShareNotice('Descrição e link copiados.');
    } catch {
      setShareNotice(website);
    }
  };

  return (
    <header className="relative text-on-strong">
      <div className={'page-width grid grid-cols-[2.75rem_1fr_2.75rem] items-center ' + (showShare ? 'min-h-24 pt-3 sm:min-h-28' : 'min-h-18')}>
        <button type="button" aria-label="Abrir menu" onClick={onOpenMenu}
          className="store-icon-action">
          <Menu size={21} strokeWidth={1.6} aria-hidden="true" />
        </button>
        <img src="/logo.png" alt={BUSINESS_INFO.name} width={1176} height={521}
          className={'mx-auto h-auto ' + (showShare ? 'w-36 sm:w-40' : 'w-28')} />
        {showShare && <button
          type="button"
          aria-label="Partilhar catálogo"
          onClick={handleShare}
          className="store-icon-action"
        >
          <Share2 size={19} strokeWidth={1.6} aria-hidden="true" />
        </button>}
      </div>
      {shareNotice && <p role="status" className="page-width pb-2 text-right text-xs">{shareNotice}</p>}
    </header>
  );
}
