import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Home, User, Package, MapPin, Info, Heart,
  MessageSquare, ShieldCheck, FileText, LogOut, ChevronRight
} from 'lucide-react';
import { View, User as UserType } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onNavigate: (view: View) => void;
  onSignOut: () => void;
}

export function Sidebar({ isOpen, onClose, user, onNavigate, onSignOut }: SidebarProps) {
  const menuItems = [
    { icon: Home, label: 'Início', view: 'home' as View },
    { icon: User, label: user ? 'Meu Perfil' : 'Login / Entrar', view: user ? 'profile' as View : 'register' as View },
    { icon: Package, label: 'Meus Pedidos', view: 'orders' as View },
    { icon: Heart, label: 'Meus Favoritos', view: 'saved' as View },
    { icon: MapPin, label: 'Endereços', view: 'address-editor' as View },
    { icon: Info, label: 'Sobre Nós', view: 'settings' as View },
    { icon: MessageSquare, label: 'Fale Conosco', view: 'settings' as View },
    { icon: ShieldCheck, label: 'Política de Privacidade', view: 'settings' as View },
    { icon: FileText, label: 'Termos de Uso', view: 'settings' as View },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar Panel */}
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
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
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

            {user && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => { onSignOut(); onClose(); }}
                  className="w-full flex items-center gap-4 py-4 px-2 text-red-500 hover:bg-red-50 transition-colors rounded-xl"
                >
                  <LogOut size={20} className="ml-4" />
                  <span className="font-headline font-black text-sm uppercase tracking-widest">Sair</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
