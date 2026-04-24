import React from 'react';
import { Menu, MessageCircle, Phone, HelpCircle, Pencil } from 'lucide-react';
import { View, CartItem, User } from '../types';
import { BUSINESS_INFO } from '../constants';
import { motion } from 'framer-motion';

interface SettingsScreenProps {
  cart: CartItem[];
  cartTotal: number;
  user: User | null;
  onSignOut: () => void;
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ cart, cartTotal, user, onSignOut, onOpenMenu, onNavigate }) => {
  const fields = [
    { label: 'Nome', value: user?.name || 'Não informado' },
    { label: 'E-mail', value: user?.email || 'Não informado' },
    { label: 'Telefone', value: user?.phone || 'Não informado' },
  ];

  const supportItems = [
    { icon: MessageCircle, label: 'WhatsApp de suporte', sub: BUSINESS_INFO.whatsapp, onClick: () => window.open(`https://wa.me/${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}`, '_blank') },
    { icon: Phone, label: 'Ligar para a loja', sub: 'Atendimento prioritário', onClick: () => window.open(`tel:${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}`, '_blank') },
    { icon: HelpCircle, label: 'Central de ajuda', sub: 'Dúvidas frequentes', onClick: undefined },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen pb-32 bg-white">
      <header className="px-6 py-4 flex items-center sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-primary/5 shadow-sm">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary"><Menu size={20} /></button>
        <h1 className="font-headline font-black text-sm text-primary flex-1 text-center pr-8 tracking-widest uppercase">Sobre Nós / Ajuda</h1>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-6">
        <section className="space-y-3">
          <h3 className="font-headline font-black text-[10px] text-black/40 pl-2 tracking-wider">Dados da conta</h3>
          <div className="bg-white rounded-2xl p-1 shadow-xl shadow-black/5 border border-primary/5 divide-y divide-primary/5">
            {fields.map((field, idx) => (
              <div key={idx} className="flex items-center justify-between py-4 px-4 group">
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-black/30 mb-0.5">{field.label}</p>
                  <p className="font-headline font-bold text-xs text-on-surface">{field.value}</p>
                </div>
                <button className="p-2 text-primary/20 hover:text-primary active:scale-90 transition-all">
                  <Pencil size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-headline font-black text-[10px] text-black/40 pl-2 tracking-wider">Suporte & ajuda</h3>
          <div className="bg-white rounded-2xl p-1 shadow-xl shadow-black/5 border border-primary/5 divide-y divide-primary/5">
            {supportItems.map((item, idx) => (
              <button key={idx} className="w-full flex items-center gap-4 py-4 px-4 active:bg-primary/5 transition-colors text-left group" onClick={item.onClick}>
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

        <button
          onClick={onSignOut}
          className="w-full py-4 text-primary font-black text-xs tracking-widest border border-primary/10 rounded-2xl active:bg-primary/5 transition-all"
        >
          Sair da conta
        </button>
      </main>
    </motion.div>
  );
}
