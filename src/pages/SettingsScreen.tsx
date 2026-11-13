import React from 'react';
import { Menu, MessageCircle, Phone, Instagram, MapPin } from 'lucide-react';
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
    { icon: MessageCircle, label: 'WhatsApp', sub: BUSINESS_INFO.whatsapp, onClick: () => window.open(`https://wa.me/${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer') },
    { icon: Phone, label: 'Ligar para a loja', sub: 'Atendimento prioritário', onClick: () => window.open(`tel:${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer') },
    { icon: Instagram, label: 'Instagram', sub: '@presentedoce.s2', onClick: () => window.open(BUSINESS_INFO.instagram, '_blank', 'noopener,noreferrer') },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen pb-32 bg-porcelain">
      <header className="px-6 py-4 flex items-center sticky top-0 bg-surface/95 backdrop-blur-sm z-50 border-b border-primary/5 shadow-sm">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary"><Menu size={20} /></button>
        <h1 className="type-page flex-1 pr-8 text-center text-primary">
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
          <section className="space-y-3">
            <h2 className="type-section pl-2 text-primary">Canais de contacto</h2>
            <div className="bg-surface rounded-2xl p-1 shadow-xl shadow-black/5 border border-primary/5 divide-y divide-primary/5">
              {contactItems.map((item) => (
                <button key={item.label} className="w-full flex items-center gap-4 py-4 px-4 active:bg-primary/5 transition-colors text-left group" onClick={item.onClick}>
                  <div className="bg-primary/5 p-2.5 rounded-xl text-primary transition-transform group-hover:scale-110">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-on-surface">{item.label}</p>
                    <p className="text-xs text-muted">{item.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
};
