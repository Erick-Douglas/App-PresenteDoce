import React from 'react';
import { Menu, MessageCircle, Phone, Instagram, MapPin } from 'lucide-react';
import { View } from '../config/types';
import { BUSINESS_INFO } from '../config/constants';
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
          <section className="space-y-6">
            <div className="flex flex-col items-center mb-6 mt-2">
              <img src="/logo.png" alt="Logo" className="h-24 w-auto object-contain brightness-110 mb-4" />
              <p className="text-center text-black/60 text-[13px] leading-relaxed max-w-[280px]">
                Feitos com carinho para surpreender em cada detalhe. O sabor que transforma momentos em memórias.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-headline font-black text-xs text-black/40 pl-2 tracking-wider uppercase">Nossa Filosofia</h3>
              <div className="bg-white rounded-2xl p-4 shadow-xl shadow-black/5 border border-primary/10 flex flex-col gap-3">
                <p className="font-body text-sm text-black/70 leading-relaxed">
                  Acreditamos que a confeitaria é uma forma de expressar afeto. Trabalhamos apenas com ingredientes selecionados para garantir a máxima qualidade.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-headline font-black text-xs text-black/40 pl-2 tracking-wider uppercase">Como Funciona</h3>
              <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-primary/10 divide-y divide-primary/5">
                <div className="flex flex-col gap-1 py-4 px-5">
                  <span className="font-headline font-bold text-[13px] text-primary">1. Escolha com liberdade</span>
                  <span className="text-[11px] text-black/50">Navegue pelas nossas categorias e personalize os seus pedidos.</span>
                </div>
                <div className="flex flex-col gap-1 py-4 px-5">
                  <span className="font-headline font-bold text-[13px] text-primary">2. Finalize no WhatsApp</span>
                  <span className="text-[11px] text-black/50">Ao concluir, a sua encomenda é enviada diretamente para o nosso atendimento.</span>
                </div>
                <div className="flex flex-col gap-1 py-4 px-5">
                  <span className="font-headline font-bold text-[13px] text-primary">3. Recolha na loja</span>
                  <span className="text-[11px] text-black/50">{BUSINESS_INFO.address}</span>
                </div>
              </div>
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
