import React from 'react';
import { motion } from 'framer-motion';
import { Menu, MapPin } from 'lucide-react';
import { View, CartItem, User } from '../types';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { AddressState } from '../hooks/useCheckout';

interface AddressEditorScreenProps {
  cart: CartItem[];
  cartTotal: number;
  user: User | null;
  address: AddressState;
  isGoogleLoaded: boolean;
  onSetAddress: (a: AddressState) => void;
  onSave: () => void;
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export const AddressEditorScreen: React.FC<AddressEditorScreenProps> = ({
  cart, cartTotal, user, address,
  isGoogleLoaded, onSetAddress, onSave, onOpenMenu, onNavigate,
}) => {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen pb-32 bg-white">
      <header className="px-6 py-4 flex items-center sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-primary/5 shadow-sm">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary"><Menu size={20} /></button>
        <h1 className="font-headline font-black text-sm text-primary flex-1 text-center pr-8 tracking-widest uppercase">Endereços</h1>
      </header>
      <main className="max-w-lg mx-auto p-6 space-y-6">
        <h4 className="font-headline font-bold text-[12px] text-primary ml-1">Endereço de entrega principal</h4>

        <div className="space-y-1.5 relative">
          <label className="font-headline font-bold text-[10px] text-[#3c3c3c] ml-1">Morada / Rua <span className="text-primary">*</span></label>
          <AddressAutocomplete
            onSelect={(data) => onSetAddress({ ...address, ...data })}
            initialValue={address.address}
            isLoaded={isGoogleLoaded}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-headline font-bold text-[10px] text-[#3c3c3c] ml-1">Apartamento / Nº</label>
            <input
              type="text" value={address.apartment}
              onChange={(e) => onSetAddress({ ...address, apartment: e.target.value })}
              placeholder="Ex: 2º Esq ou Nº 15"
              className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-4 h-11 text-[12px] font-medium outline-none focus:bg-white focus:border-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-headline font-bold text-[10px] text-[#3c3c3c] ml-1">Cód. Postal</label>
            <input
              type="text" value={address.postal_code}
              onChange={(e) => onSetAddress({ ...address, postal_code: e.target.value })}
              placeholder="0000-000"
              className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-4 h-11 text-[12px] font-medium outline-none focus:bg-white focus:border-primary/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-headline font-bold text-[10px] text-[#3c3c3c] ml-1">Região</label>
          <input
            type="text" value={address.city}
            onChange={(e) => onSetAddress({ ...address, city: e.target.value })}
            placeholder="Região"
            className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-4 h-11 text-[12px] font-medium outline-none focus:bg-white focus:border-primary/20"
          />
        </div>

        <button
          onClick={onSave}
          className="w-full h-14 bg-primary text-cream font-headline font-black text-sm rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all mt-8"
        >
          {user?.has_default_address ? 'Editar endereço padrão' : 'Salvar endereço padrão'}
        </button>
      </main>
    </motion.div>
  );
}
