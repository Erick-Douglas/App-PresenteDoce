import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { BUSINESS_INFO } from '../config/constants';

const introKey = 'presente-doce:contact-intro';
const interactionEvents = ['pointerdown', 'wheel', 'scroll', 'keydown', 'click'];

export function ContactAssistant({ visible, aboveOrder }: { visible: boolean; aboveOrder: boolean }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showIntro, setShowIntro] = useState(() => {
    try { return sessionStorage.getItem(introKey) === null; }
    catch { return true; }
  });
  const launcher = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();
  const phone = BUSINESS_INFO.whatsapp.replace(/\D/g, '');
  const whatsapp = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message.trim());

  useEffect(() => {
    if (!visible || !showIntro) return;
    try { sessionStorage.setItem(introKey, '1'); } catch { /* Keep the flag in memory when storage is unavailable. */ }
    const collapse = (event: Event) => {
      if ((event.type === 'pointerdown' || event.type === 'keydown' || event.type === 'click') &&
        event.target instanceof Node && launcher.current?.contains(event.target)) return;
      setShowIntro(false);
    };
    for (const event of interactionEvents) window.addEventListener(event, collapse, { capture: true, passive: true });
    return () => {
      for (const event of interactionEvents) window.removeEventListener(event, collapse, true);
    };
  }, [visible, showIntro]);

  if (!visible) return null;

  function close() {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus());
  }

  return (
    <aside aria-label="Atendimento da confeitaria" className={'contact-assistant ' + (aboveOrder ? 'contact-assistant-above-order' : '')}
      onKeyDown={event => { if (event.key === 'Escape' && open) close(); }}>
      {open && (
        <section id={panelId} aria-labelledby={titleId} className="ui-glass-panel mb-2 space-y-2 shadow-lg">
          <div className="flex items-center gap-2">
            <img src="/atendimento.jpg" alt="" width={38} height={38} className="size-9 rounded-full object-cover" />
            <h2 id={titleId} className="type-label flex-1 text-primary">Fale com a confeitaria</h2>
            <button type="button" aria-label="Fechar atendimento" onClick={close} className="ui-icon-action">
              <X size={14} aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm text-muted">Olá! Tem alguma dúvida sobre os nossos produtos ou encomendas?</p>
          <label className="block space-y-1 text-xs text-muted">
            <span>A sua mensagem</span>
            <textarea className="ui-field resize-y" rows={2} maxLength={500} value={message}
              onChange={event => setMessage(event.target.value)} />
          </label>
          <a className="ui-quiet-action font-bold" href={whatsapp} target="_blank" rel="noopener noreferrer">
            Abrir no WhatsApp <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <p className="text-xs text-muted">Confirme o envio no WhatsApp.</p>
        </section>
      )}
      <button ref={launcher} type="button" aria-label="Falar com a confeitaria" aria-expanded={open} aria-controls={open ? panelId : undefined}
        onClick={() => { setShowIntro(false); setOpen(value => !value); }}
        className="contact-launcher" data-intro={showIntro}>
        <img src="/atendimento.jpg" alt="" width={34} height={34} className="size-8 rounded-full object-cover" />
        {showIntro && <span>Precisa de ajuda?</span>}
      </button>
    </aside>
  );
}
