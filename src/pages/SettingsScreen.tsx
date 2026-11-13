import React from 'react';
import { Facebook, Instagram, Mail, Menu, MessageCircle, Phone } from 'lucide-react';
import { View } from '../config/types';
import { BUSINESS_INFO } from '../config/constants';
import { motion } from 'framer-motion';

interface SettingsScreenProps {
  mode: 'about' | 'contact';
  aboutText: string;
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ mode, onOpenMenu, aboutText }) => {
  const contactItems = [
    { icon: MessageCircle, label: 'WhatsApp', detail: BUSINESS_INFO.whatsapp, href: 'https://wa.me/' + BUSINESS_INFO.whatsapp.replace(/\D/g, '') },
    { icon: Phone, label: 'Telefone', detail: BUSINESS_INFO.whatsapp, href: 'tel:' + BUSINESS_INFO.whatsapp },
    { icon: Mail, label: 'E-mail', detail: BUSINESS_INFO.email, href: 'mailto:' + BUSINESS_INFO.email },
  ];
  const socialItems = [
    { icon: Instagram, label: 'Instagram', href: BUSINESS_INFO.instagram },
    { icon: Facebook, label: 'Facebook', href: BUSINESS_INFO.facebook },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen pb-32 bg-porcelain">
      <header className="sticky top-[env(safe-area-inset-top)] z-50 flex items-center border-b border-outline bg-surface/95 px-5 py-2 backdrop-blur-sm">
        <button type="button" aria-label="Abrir menu" onClick={onOpenMenu} className="ui-icon-action"><Menu size={16} aria-hidden="true" /></button>
        <h1 className="type-module flex-1 pr-9 text-center text-primary">
          {mode === 'about' ? 'Sobre nós' : 'Contactos'}
        </h1>
      </header>

      <div className="page-width space-y-6 py-5">
        {mode === 'about' && (
          <section className="space-y-6">
            <div className="flex flex-col items-center mb-6 mt-2">
              <img src="/logo.png" alt="Logo" className="h-24 w-auto object-contain brightness-110 mb-4" />
              <p className="text-center text-muted text-sm leading-relaxed max-w-[280px]">
                Feitos com carinho para surpreender em cada detalhe. O sabor que transforma momentos em memórias.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="type-section pl-2 text-primary">Nossa filosofia</h2>
              <div className="ui-card p-4">
                <p className="whitespace-pre-line text-sm text-on-surface/70 leading-relaxed">
                  {aboutText}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="type-section pl-2 text-primary">Como funciona</h2>
              <div className="ui-card divide-y divide-primary/5">
                <div className="flex flex-col gap-1 py-4 px-5">
                  <span className="font-bold text-sm text-primary">1. Escolha com liberdade</span>
                  <span className="text-xs text-muted">Navegue pelas nossas categorias e personalize os seus pedidos.</span>
                </div>
                <div className="flex flex-col gap-1 py-4 px-5">
                  <span className="font-bold text-sm text-primary">2. Finalize no WhatsApp</span>
                  <span className="text-xs text-muted">Envie a mensagem no WhatsApp e aguarde a confirmação de disponibilidade, entrega e pagamento.</span>
                </div>
                <div className="flex flex-col gap-1 py-4 px-5">
                  <span className="font-bold text-sm text-primary">3. Combine a recolha ou entrega</span>
                  <span className="text-xs text-muted">{BUSINESS_INFO.address}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {mode === 'contact' && (
          <div className="mx-auto max-w-lg space-y-4">
            <section className="ui-glass-panel">
              <div className="flex items-center gap-3">
                <img src="/atendimento.jpg" alt="" width={52} height={52} className="size-13 shrink-0 rounded-full object-cover" />
                <div>
                  <h2 className="type-item text-primary">Fale com a confeitaria</h2>
                  <p className="mt-1 text-sm text-muted">Tire dúvidas ou converse connosco sobre a sua encomenda.</p>
                </div>
              </div>
              <ul className="mt-3 divide-y divide-outline">
                {contactItems.map(({ icon: Icon, label, detail, href }) => <li key={label}>
                  <a href={href} target={href.startsWith('https:') ? '_blank' : undefined} rel="noopener noreferrer"
                    className="flex min-h-13 items-center gap-3 rounded-lg px-1 py-2 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary">
                    <Icon size={17} strokeWidth={1.65} className="shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="type-label block">{label}</span>
                      <span className="block break-words text-xs text-muted">{detail}</span>
                    </span>
                  </a>
                </li>)}
              </ul>
            </section>
            <section className="ui-glass-panel">
              <h2 className="type-item text-primary">Redes sociais</h2>
              <ul className="mt-1 flex flex-wrap gap-x-5">
                {socialItems.map(({ icon: Icon, label, href }) => <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="ui-quiet-action">
                    <Icon size={16} strokeWidth={1.65} aria-hidden="true" /> {label}
                  </a>
                </li>)}
              </ul>
            </section>
          </div>
        )}
      </div>
    </motion.div>
  );
};
