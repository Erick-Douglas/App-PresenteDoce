import React from 'react';
import { motion } from 'framer-motion';
import {
  Menu, ChevronRight, Heart, MapPin, Package, Pencil,
  Settings, Settings2, User as UserIcon,
} from 'lucide-react';
import { View, CartItem, User } from '../types';

interface ProfileScreenProps {
  cart: CartItem[];
  cartTotal: number;
  user: User | null;
  onProfilePicUpload: (file: File) => void;
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  cart, cartTotal, user, onProfilePicUpload, onOpenMenu, onNavigate,
}) => {
  const menuItems = [
    ...(user?.is_admin ? [{ icon: Settings2, label: 'Painel Admin', onClick: () => onNavigate('admin') }] : []),
    { icon: Package, label: 'Meus pedidos', onClick: () => onNavigate('orders') },
    { icon: Heart, label: 'Meus favoritos', onClick: () => onNavigate('saved') },
    { icon: MapPin, label: user?.has_default_address ? 'Editar endereço padrão' : 'Salvar endereço padrão', onClick: () => onNavigate('address-editor') },
    { icon: Settings, label: 'Configurações', onClick: () => onNavigate('settings') },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen pb-32 bg-white">
      <header className="px-6 py-4 flex items-center sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-primary/5 shadow-sm">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary"><Menu size={20} /></button>
        <h1 className="font-headline font-black text-sm text-primary flex-1 text-center pr-8 tracking-widest">Meu Perfil</h1>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-6">
        <section className="bg-white rounded-3xl p-8 shadow-xl shadow-black/5 border border-primary/5 flex flex-col items-center text-center gap-6">
          <div className="relative group">
            {user ? (
              <label className="cursor-pointer">
                <input
                  type="file" className="hidden" accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onProfilePicUpload(f); }}
                />
                <div className="w-28 h-28 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden border-4 border-gold/20 shrink-0 group-hover:brightness-90 transition-all shadow-lg relative">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="bg-gold text-black font-black text-4xl w-full h-full flex items-center justify-center">
                      {user.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil size={20} className="text-white" />
                  </div>
                </div>
              </label>
            ) : (
              <div className="w-28 h-28 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden border-4 border-gold/20 shadow-lg">
                <UserIcon size={40} className="text-primary/40" />
              </div>
            )}
          </div>

          <div className="space-y-1 w-full">
            <h2 className="font-headline font-black text-2xl text-black">{user ? user.name : 'Visitante'}</h2>
            <p className="font-body text-xs text-black/40 px-4">
              {user ? user.email : 'Faça parte da nossa família e aproveite vantagens exclusivas'}
            </p>
          </div>

          {!user && (
            <button
              onClick={() => onNavigate('register')}
              className="w-full bg-primary text-cream py-4 rounded-2xl font-headline font-black text-sm tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              FAZER LOGIN
            </button>
          )}
        </section>

        <div className="bg-white rounded-2xl p-1 shadow-xl shadow-black/5 border border-primary/5 divide-y divide-primary/5">
          {menuItems.map((item, idx) => (
            <button
              key={idx} onClick={item.onClick}
              className="w-full flex items-center gap-4 py-4 px-5 active:bg-primary/5 transition-colors group"
            >
              <div className="text-primary/40 group-hover:text-primary transition-colors"><item.icon size={18} /></div>
              <span className="flex-1 text-left font-headline font-bold text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">{item.label}</span>
              <ChevronRight size={14} className="text-primary/10" />
            </button>
          ))}
        </div>
      </main>
    </motion.div>
  );
}
