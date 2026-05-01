import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, Info, MessageSquare, ChevronRight, Instagram, MessageCircle, Facebook } from 'lucide-react';
import { View } from '../types';
import { BUSINESS_INFO } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
}

export function Sidebar({ isOpen, onClose, onNavigate }: SidebarProps) {
  const menuItems = [
    { icon: Home, label: 'Início', view: 'home' as View },
    { icon: Info, label: 'Sobre nós', view: 'settings' as View },
    { icon: MessageSquare, label: 'Fale conosco', view: 'contact' as View },
  ];

  const socialLinks = [
    { icon: Instagram, label: 'Instagram', href: BUSINESS_INFO.instagram },
    { icon: MessageCircle, label: 'WhatsApp', href: `https://wa.me/${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}` },
    { icon: Facebook, label: 'Facebook', href: BUSINESS_INFO.facebook },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 left-0 w-[280px] bg-white z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-headline font-black text-xl text-primary">Menu</h2>
              <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-primary transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { onNavigate(item.view); onClose(); }}
                  className="w-full flex items-center gap-4 py-4 px-6 hover:bg-primary/5 transition-colors group"
                >
                  <div className="text-gray-400 group-hover:text-primary transition-colors">
                    <item.icon size={20} />
                  </div>
                  <span className="flex-1 text-left font-headline font-bold text-sm text-gray-700 group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                  <ChevronRight size={14} className="text-gray-300" />
                </button>
              ))}
            </div>

            <div className="p-4 pb-12 border-t border-gray-100 space-y-3">
              <p className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Redes sociais</p>
              <div className="flex justify-between items-center gap-2 mt-2">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl bg-black/5 aspect-square text-primary hover:bg-primary/10 transition-colors shadow-sm"
                  >
                    <item.icon size={22} />
                    <span className="text-[9px] font-bold tracking-wide mt-1">{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
