import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Minus, Plus, ChevronRight } from 'lucide-react';
import { Product, CartItem, View } from '../types';

interface ProductDetailScreenProps {
  product: Product;
  cart: CartItem[];
  onAddToCart: (product: Product, options: {
    sauce?: string; observations?: string; quantity?: number;
    massa?: string; recheio1?: string; recheio2?: string; adicionais?: string[];
  }) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  favorites: string[];
  onNavigate: (view: View) => void;
}

const SAUCES = ['Chocolate Belga', 'Doce de Leite', 'Creme de Amêndoas', 'Sem Calda'];
const MASSAS = ['Pão de Ló Tradicional', 'Massa de Chocolate', 'Cenoura Caseira', 'Red Velvet'];
const RECHEIOS = ['Brigadeiro Gourmet', 'Ninho Cremoso', 'Nutella Pura', 'Beijinho de Coco', 'Doce de Leite c/ Nozes', 'Mousse de Morango'];

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ product, cart, onAddToCart, onToggleFavorite, favorites, onNavigate }) => {
  const [sauce, setSauce] = useState('');
  const [observations, setObservations] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [massa, setMassa] = useState('');
  const [recheio1, setRecheio1] = useState('');
  const [recheio2, setRecheio2] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const isFav = favorites.includes(product.id);
  const totalPrice = product.price * quantity;

  const handleRecheioSelect = (r: string) => {
    if (recheio1 === r) setRecheio1('');
    else if (recheio2 === r) setRecheio2('');
    else if (!recheio1) setRecheio1(r);
    else if (!recheio2) setRecheio2(r);
  };

  const DropdownField = ({ id, label, value, options, onSelect }: {
    id: string; label: string; value: string; options: string[]; onSelect: (v: string) => void;
  }) => (
    <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
      <label className="font-headline font-bold text-[10px] text-[#3c3c3c] ml-1">{label}</label>
      <div className="relative">
        <button
          onClick={() => setActiveDropdown(activeDropdown === id ? null : id)}
          className="w-full h-11 px-4 bg-black/[0.02] border border-black/5 rounded-xl flex items-center justify-between transition-all"
        >
          <span className={`font-bold text-[11px] ${value ? 'text-black' : 'text-black/30'}`}>{value || `Selecione...`}</span>
          <ChevronRight size={14} className={`text-black/30 transition-transform ${activeDropdown === id ? 'rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {activeDropdown === id && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/5 rounded-xl shadow-xl z-40 overflow-hidden">
              {options.map(o => (
                <button key={o} onClick={() => { onSelect(o); setActiveDropdown(null); }}
                  className={`w-full px-4 py-3 text-left text-[11px] font-bold transition-colors ${value === o ? 'text-primary bg-primary/5' : 'text-black/60'}`}>
                  {o}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen bg-white" onClick={() => setActiveDropdown(null)}>
      <div className="relative h-[45vh] w-full shrink-0">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover object-center" referrerPolicy="no-referrer" />
        <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={() => onNavigate('home')}
            className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
            <ArrowLeft size={18} />
          </button>
          <button onClick={(e) => onToggleFavorite(product.id, e)}
            className={`w-9 h-9 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-125 flex items-center justify-center ${isFav ? 'bg-primary text-cream' : 'bg-white/80 text-primary'}`}>
            <Heart size={18} className={isFav ? 'fill-cream' : ''} />
          </button>
        </div>
      </div>

      <main className="relative -mt-10 bg-white rounded-t-[40px] px-6 pt-8 pb-32 space-y-6 shadow-2xl overflow-hidden min-h-[60vh]">
        <div className="space-y-1">
          <h2 className="font-headline font-black text-xl text-black tracking-tight leading-tight">{product.name}</h2>
          <p className="font-body text-black/50 text-[12px] leading-relaxed">{product.description}</p>
          <div className="pt-2"><span className="font-headline font-black text-xl text-primary">€ {product.price.toFixed(2)}</span></div>
        </div>

        <div className="space-y-4 max-w-sm mx-auto md:max-w-none">
          <DropdownField id="massa" label="Tipo de massa" value={massa} options={MASSAS} onSelect={setMassa} />

          {/* Recheios (multi-select) */}
          <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
            <label className="font-headline font-bold text-[10px] text-[#3c3c3c] ml-1">Recheio (Até 2)</label>
            <div className="relative">
              <button onClick={() => setActiveDropdown(activeDropdown === 'recheio' ? null : 'recheio')}
                className="w-full px-4 py-3 min-h-[44px] bg-black/[0.02] border border-black/5 rounded-xl flex items-center justify-between transition-all">
                <div className="flex flex-wrap gap-1">
                  {!recheio1 && !recheio2 ? <span className="text-black/30 font-bold text-[11px]">Selecione os recheios...</span> : (
                    <>{recheio1 && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-[10px] font-bold">{recheio1}</span>}
                      {recheio2 && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-[10px] font-bold">{recheio2}</span>}</>
                  )}
                </div>
                <ChevronRight size={14} className={`text-black/30 transition-transform ${activeDropdown === 'recheio' ? 'rotate-90' : ''}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === 'recheio' && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/5 rounded-xl shadow-xl z-40 max-h-48 overflow-y-auto">
                    {RECHEIOS.map(r => {
                      const sel = recheio1 === r || recheio2 === r;
                      return (
                        <button key={r} onClick={() => handleRecheioSelect(r)}
                          className={`w-full px-4 py-3 text-left text-[11px] font-bold transition-colors flex items-center justify-between ${sel ? 'text-primary bg-primary/5' : 'text-black/60'}`}>
                          {r}{sel && <Plus size={10} className="rotate-45" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <DropdownField id="sauce" label="Calda / Finalização" value={sauce} options={SAUCES} onSelect={setSauce} />

          <div className="space-y-2 pt-1">
            <label className="font-headline font-bold text-[10px] text-[#3c3c3c] ml-1">Observações</label>
            <textarea value={observations} onChange={(e) => setObservations(e.target.value)} onClick={(e) => e.stopPropagation()}
              placeholder="Algo que devemos saber?"
              className="w-full h-20 bg-black/[0.02] rounded-xl p-4 font-body text-[10px] text-black border border-black/5 focus:border-primary/10 outline-none transition-all resize-none placeholder:text-black/20" />
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md p-4 border-t border-black/5 flex items-center gap-3 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center bg-black/[0.03] rounded-xl h-11 px-1 shrink-0">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-full flex items-center justify-center text-black/20 hover:text-primary transition-colors">
            <Minus size={16} />
          </button>
          <span className="w-8 text-center font-headline font-black text-sm text-black">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-full flex items-center justify-center text-black/20 hover:text-primary transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <button
          onClick={() => { onAddToCart(product, { sauce, observations, quantity, massa, recheio1, recheio2 }); onNavigate('home'); }}
          className="flex-1 bg-primary text-cream h-11 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center font-headline font-bold text-[12px] tracking-[0.05em] hover:brightness-110 active:scale-[0.96] transition-all"
        >
          Adicionar <span className="ml-2 font-black text-gold/90 text-xs">€ {totalPrice.toFixed(2)}</span>
        </button>
      </div>
    </motion.div>
  );
}
