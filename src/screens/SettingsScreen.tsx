import React from 'react';
import { Menu, MessageCircle, Phone, Instagram, MapPin } from 'lucide-react';
import { View } from '../types';
import { BUSINESS_INFO } from '../constants';
import { motion } from 'framer-motion';

interface SettingsScreenProps {
  mode: 'about' | 'contact';
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ mode, onOpenMenu }) => {
  const aboutItems = [
    { label: 'Nossa proposta', value: 'Criamos presentes doces e encomendas especiais com um processo simples e direto.' },
    { label: 'Como funciona', value: 'Você escolhe os itens, informa nome e telefone e conclui tudo pelo WhatsApp.' },
    { label: 'Retirada', value: BUSINESS_INFO.address },
  ];

  const contactItems = [
    { icon: MessageCircle, label: 'WhatsApp', sub: BUSINESS_INFO.whatsapp, onClick: () => window.open(`https://wa.me/${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}`, '_blank') },
    { icon: Phone, label: 'Ligar para a loja', sub: 'Atendimento prioritário', onClick: () => window.open(`tel:${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}`, '_blank') },
    { icon: Instagram, label: 'Instagram', sub: '@presentedoce.s2', onClick: () => window.open(BUSINESS_INFO.instagram, '_blank') },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen pb-32 bg-white">
      <header className="px-6 py-4 flex items-center sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-primary/5 shadow-sm">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary"><Menu size={20} /></button>
        <h1 className="font-headline font-black text-sm text-primary flex-1 text-center pr-8 tracking-widest uppercase">
          {mode === 'about' ? 'Sobre nós' : 'Fale conosco'}
        </h1>
      </header>

      <main className="p-4 space-y-6">
        {mode === 'about' && (
          <section className="space-y-3">
            <h3 className="font-headline font-black text-[10px] text-black/40 pl-2 tracking-wider">Sobre a Presente Doce</h3>
            <div className="bg-white rounded-2xl p-1 shadow-xl shadow-black/5 border border-primary/5 divide-y divide-primary/5">
              {aboutItems.map((item) => (
                <div key={item.label} className="flex items-start gap-4 py-4 px-4">
                  <div className="bg-primary/5 p-2.5 rounded-xl text-primary shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-black/30 mb-0.5">{item.label}</p>
                    <p className="font-headline font-bold text-xs text-on-surface">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {mode === 'contact' && (
          <section className="space-y-3">
            <h3 className="font-headline font-black text-[10px] text-black/40 pl-2 tracking-wider">Canais de contato</h3>
            <div className="bg-white rounded-2xl p-1 shadow-xl shadow-black/5 border border-primary/5 divide-y divide-primary/5">
              {contactItems.map((item) => (
                <button key={item.label} className="w-full flex items-center gap-4 py-4 px-4 active:bg-primary/5 transition-colors text-left group" onClick={item.onClick}>
                  <div className="bg-primary/5 p-2.5 rounded-xl text-primary transition-transform group-hover:scale-110">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="font-headline font-bold text-xs text-on-surface">{item.label}</p>
                    <p className="text-[10px] text-on-surface-variant opacity-50">{item.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </motion.div>
  );
};
