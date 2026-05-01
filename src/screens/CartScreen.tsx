import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Minus, Package, Pencil, Plus,
  ShoppingCart, Trash2, Truck,
} from 'lucide-react';
import { CartItem, View } from '../types';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { AddressState, GuestCustomerState } from '../hooks/useCheckout';

interface CartScreenProps {
  cart: CartItem[];
  cartTotal: number;
  grandTotal: number;
  currentDeliveryFee: number;
  isCalculatingRoute: boolean;
  deliveryMethod: 'delivery' | 'pickup' | null;
  paymentMethod: 'cash' | 'mbway' | 'wise' | null;
  guestCustomer: GuestCustomerState;
  address: AddressState;
  needsChange: boolean;
  changeAmount: string;
  isLocating: boolean;
  isAddressEditing: boolean;
  showAddressError: boolean;
  saveAddressAsDefault: boolean;
  isGoogleLoaded: boolean;
  onSetDeliveryMethod: (m: 'delivery' | 'pickup') => void;
  onSetPaymentMethod: (m: 'cash' | 'mbway' | 'wise') => void;
  onSetGuestCustomer: (customer: GuestCustomerState) => void;
  onSetAddress: (a: AddressState) => void;
  onSetNeedsChange: (v: boolean) => void;
  onSetChangeAmount: (v: string) => void;
  onSetAddressEditing: (v: boolean) => void;
  onSetShowAddressError: (v: boolean) => void;
  onSetSaveAddressAsDefault: (v: boolean) => void;
  onUpdateQuantity: (cartId: string, qty: number) => void;
  onRemoveFromCart: (cartId: string) => void;
  onEditItem: (item: CartItem) => void;
  onLocate: () => void;
  onCheckout: () => void;
  onNavigate: (view: View) => void;
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Dinheiro', img: 'https://cdn-icons-png.flaticon.com/512/2331/2331941.png' },
  { id: 'mbway', label: 'MB WAY', img: '/mb.jpeg' },
  { id: 'wise', label: 'Wise', img: '/wise.webp' },
] as const;

export const CartScreen: React.FC<CartScreenProps> = (props) => {
  const {
    cart, cartTotal, grandTotal, currentDeliveryFee, isCalculatingRoute,
    deliveryMethod, paymentMethod, guestCustomer, address, needsChange, changeAmount,
    isLocating, isAddressEditing, showAddressError, isGoogleLoaded,
    onSetDeliveryMethod, onSetPaymentMethod, onSetGuestCustomer, onSetAddress, onSetNeedsChange,
    onSetChangeAmount, onSetAddressEditing, onSetShowAddressError,
    onUpdateQuantity, onRemoveFromCart, onEditItem, onLocate, onCheckout, onNavigate,
  } = props;

  if (cart.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pb-32 bg-white">
        <header className="px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-primary/5 shadow-sm">
          <div className="max-w-[1200px] mx-auto flex items-center">
            <button onClick={() => onNavigate('home')} className="p-2 -ml-2 text-black/40"><ArrowLeft size={18} /></button>
            <h1 className="font-headline font-black text-sm text-primary flex-1 text-center pr-8 tracking-widest">Carrinho</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 m-4 bg-white rounded-2xl border border-primary/5 shadow-xl">
          <div className="p-6 bg-primary/5 rounded-full text-primary/20"><ShoppingCart size={48} /></div>
          <p className="font-headline font-bold text-lg text-primary">Carrinho vazio</p>
          <p className="font-body text-xs text-on-surface-variant opacity-50 px-10">Escolha os seus produtos e finalize quando estiver pronto.</p>
          <button onClick={() => onNavigate('home')} className="bg-primary text-cream px-6 py-2 rounded-xl text-[10px] font-bold shadow-md">Ver cardápio</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="min-h-screen pb-32 bg-white">
      <header className="px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-primary/5 shadow-sm">
        <div className="max-w-[1200px] mx-auto flex items-center">
          <button onClick={() => onNavigate('home')} className="p-2 -ml-2 text-black/40"><ArrowLeft size={18} /></button>
          <h1 className="font-headline font-black text-sm text-primary flex-1 text-center pr-8 tracking-widest">Carrinho</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-10 lg:grid lg:grid-cols-12 lg:gap-10 lg:items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-4 shadow-xl shadow-black/5 border border-primary/5 space-y-3">
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-black text-primary tracking-widest">Dados do cliente</span>
              <span className="text-[10px] font-bold text-black/40">Checkout convidado</span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={guestCustomer.name}
                onChange={(e) => onSetGuestCustomer({ ...guestCustomer, name: e.target.value })}
                placeholder="Nome *"
                className="w-full bg-transparent rounded-xl px-4 py-2.5 font-body outline-none border border-primary/10 text-xs"
              />
              <input
                type="tel"
                value={guestCustomer.phone}
                onChange={(e) => onSetGuestCustomer({ ...guestCustomer, phone: e.target.value })}
                placeholder="Telefone *"
                className="w-full bg-transparent rounded-xl px-4 py-2.5 font-body outline-none border border-primary/10 text-xs"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-primary/5 overflow-hidden">
            <div className="px-6 py-3 flex justify-between items-center border-b border-primary/5">
              <span className="text-[10px] font-black text-primary tracking-widest">Artigos</span>
              <button onClick={() => onNavigate('home')} className="text-primary text-[9px] font-bold">Adicionar mais</button>
            </div>
            <div className="divide-y divide-primary/5">
              <AnimatePresence initial={false}>
                {cart.map((item) => (
                  <motion.div key={item.cartId} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="p-4 flex gap-4 items-center cursor-pointer hover:bg-black/5 transition-colors"
                    onClick={() => onEditItem(item)}>
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-primary/5">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline font-bold text-xs text-black leading-tight">{item.name}</h3>
                      <p className="font-headline font-black text-sm text-primary">€ {item.price.toFixed(2)}</p>

                      {/* Mostrar as opções selecionadas como resumo se for configurável */}
                      {(item.tamanho || item.massa || item.recheio1 || item.variant || (item.selectedFlavors && item.selectedFlavors.length > 0)) && (
                        <div className="text-[9px] text-black/50 leading-tight mt-1 truncate">
                          {['Brigadeiros', 'Salgados'].includes(item.category) ? (
                            <>
                              {item.variant && <span className="mr-2">{item.category === 'Salgados' ? 'Qtd' : 'Cx'}: {item.variant.replace('Caixa com ', '').replace(' unidades', '')}</span>}
                              {item.selectedFlavors && item.selectedFlavors.length > 0 && <span>{item.category === 'Salgados' ? 'Op' : 'S'}: {item.selectedFlavors.join(', ')}</span>}
                            </>
                          ) : (
                            <>
                              {item.tamanho && <span className="mr-2">T: {item.tamanho}</span>}
                              {item.massa && <span className="mr-2">M: {item.massa}</span>}
                              {item.recheio1 && <span>R: {item.recheio1}</span>}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); onRemoveFromCart(item.cartId); }} className="p-1 text-primary/40 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                      <div className="flex items-center rounded-lg border border-primary/10 p-0.5">
                        <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, item.quantity - 1); }} className="w-7 h-7 flex items-center justify-center text-primary/40 hover:text-primary"><Minus size={12} /></button>
                        <span className="w-6 text-center font-headline font-bold text-xs">{item.quantity}</span>
                        <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, item.quantity + 1); }} className="w-7 h-7 flex items-center justify-center text-primary/40 hover:text-primary"><Plus size={12} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-primary/5 p-4 space-y-5">
            <span className="text-[10px] font-black text-primary tracking-widest">Entrega ou recolha</span>
            <div className="flex gap-2">
              {[{ id: 'delivery', label: 'Entrega', Icon: Truck }, { id: 'pickup', label: 'Recolha', Icon: Package }].map(({ id, label, Icon }) => (
                <button key={id} onClick={() => onSetDeliveryMethod(id as 'delivery' | 'pickup')}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all flex flex-col items-center gap-1 ${deliveryMethod === id ? 'bg-primary/5 border-primary shadow-sm' : 'border-primary/10'}`}>
                  <Icon size={18} className={deliveryMethod === id ? 'text-primary' : 'text-black/40'} />
                  <span className={`text-[10px] font-bold ${deliveryMethod === id ? 'text-primary' : 'text-black/60'}`}>{label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {deliveryMethod === 'delivery' && (
                <motion.div key="delivery" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <h4 className="text-[10px] font-black text-primary/80 tracking-widest mb-1 uppercase">Informações de entrega</h4>
                    <p className="text-[11px] text-black font-bold leading-relaxed">Morada obrigatória para entrega.</p>
                    <p className="text-[10px] text-black/60 mt-1 italic">Se preferir recolha, não precisamos do endereço.</p>
                  </div>
                  {isAddressEditing ? (
                    <div className="space-y-3">
                      <button onClick={onLocate} disabled={isLocating}
                        className="w-full py-3 bg-primary/10 text-primary rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                        {isLocating ? <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" /> : <MapPin size={12} />}
                        {isLocating ? 'Obtendo localização...' : 'Usar minha localização'}
                      </button>
                      <div className={`${showAddressError && !address.address ? 'ring-2 ring-red-500 rounded-xl' : ''}`}>
                        <AddressAutocomplete
                          onSelect={(data) => { onSetAddress({ ...address, ...data }); onSetShowAddressError(false); }}
                          initialValue={address.address}
                          isLoaded={isGoogleLoaded}
                        />
                      </div>
                      {showAddressError && !address.address && <p className="text-[8px] text-red-500 font-bold ml-1">Morada obrigatória para entrega</p>}
                      <input type="text" value={address.apartment} onChange={e => onSetAddress({ ...address, apartment: e.target.value })}
                        placeholder="Número / apartamento" className="w-full bg-transparent border border-primary/10 rounded-xl px-4 py-2 text-xs outline-none" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={address.city} onChange={e => onSetAddress({ ...address, city: e.target.value, lat: null, lng: null })}
                          placeholder="Região" className="w-full bg-transparent border border-primary/10 rounded-xl px-4 py-2 text-xs outline-none" />
                        <input type="text" value={address.postal_code} onChange={e => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length > 4) value = `${value.slice(0, 4)}-${value.slice(4, 7)}`;
                          onSetAddress({ ...address, postal_code: value, lat: null, lng: null });
                        }} placeholder="0000-000" maxLength={8} className="w-full bg-transparent border border-primary/10 rounded-xl px-4 py-2 text-xs outline-none" />
                      </div>
                      {address.address && (
                        <button onClick={() => onSetAddressEditing(false)} className="w-full py-2.5 bg-primary text-cream rounded-xl text-[10px] font-bold tracking-widest mt-2">
                          Confirmar morada e calcular
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 cursor-pointer" onClick={() => onSetAddressEditing(true)}>
                      <div className="flex items-start gap-3">
                        <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-black">{address.address}</p>
                          <p className="text-[9px] text-black/60 mt-0.5">{address.postal_code} - {address.city}</p>
                          {isCalculatingRoute && <p className="text-[8px] text-primary/50 animate-pulse mt-1">A calcular trajeto...</p>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onSetAddressEditing(true); }} className="text-primary"><Pencil size={12} /></button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {deliveryMethod === 'pickup' && (
                <motion.div key="pickup" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Rua+Miguel+Angelo+21+1A+Casal+do+Marco+2840-136"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3 active:scale-95 transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-primary"
                        >
                          <MapPin size={18} fill="currentColor" fillOpacity={0.2} />
                        </motion.div>
                        <h4 className="text-[10px] font-black text-primary uppercase">Endereço de recolha</h4>
                      </div>
                      <span className="text-[9px] font-bold text-primary underline">Ver no mapa</span>
                    </div>
                    <div className="pl-6">
                      <p className="text-[11px] font-bold text-black">Rua Miguel Angelo, 21, 1 A</p>
                      <p className="text-[10px] text-black/60 mt-0.5">CEP 2840-136, Casal do Marco</p>
                    </div>
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-primary/5 p-4 space-y-4">
            <span className="text-[10px] font-black text-primary tracking-widest">Forma de pagamento</span>
            <div className="flex flex-col gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button key={method.id} onClick={() => onSetPaymentMethod(method.id)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${paymentMethod === method.id ? 'bg-primary/5 border-primary shadow-sm' : 'border-primary/10'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-primary' : 'border-primary/20'}`}>
                      {paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className={`text-[10px] font-bold ${paymentMethod === method.id ? 'text-primary' : 'text-black/60'}`}>{method.label}</span>
                  </div>
                  <div className="w-16 h-8 flex items-center justify-center overflow-hidden rounded-md">
                    <img src={method.img} alt={method.label} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                </button>
              ))}
            </div>
            {paymentMethod === 'cash' && (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-black/60">Precisa de troco?</span>
                  <button onClick={() => onSetNeedsChange(!needsChange)} className={`w-10 h-5 rounded-full transition-all relative ${needsChange ? 'bg-primary' : 'bg-primary/20'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${needsChange ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <AnimatePresence>
                  {needsChange && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">€</span>
                        <input type="text" inputMode="decimal" value={changeAmount} onChange={e => onSetChangeAmount(e.target.value)} placeholder="0,00"
                          className="w-full bg-white border border-primary/10 rounded-xl pl-14 pr-4 py-3 text-sm font-black text-primary outline-none" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <section className="bg-white border border-primary/5 p-6 rounded-2xl shadow-xl space-y-5">
            <h3 className="font-headline font-black text-xs text-black tracking-widest">Resumo da encomenda</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold text-black/60">Artigos ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span className="font-bold text-black">€ {cartTotal.toFixed(2)}</span>
              </div>
              {deliveryMethod === 'delivery' && (
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-black/60">Entrega</span>
                  <span className="font-bold text-black">{isCalculatingRoute ? '...' : `€ ${currentDeliveryFee.toFixed(2)}`}</span>
                </div>
              )}
              {paymentMethod && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-black/60">Pagamento</span>
                  <span className="font-bold text-primary flex items-center gap-1.5">
                    <img src={PAYMENT_METHODS.find((method) => method.id === paymentMethod)?.img} className="w-8 h-5 object-contain rounded-sm" alt="" />
                    {PAYMENT_METHODS.find((method) => method.id === paymentMethod)?.label}
                  </span>
                </div>
              )}
              <div className="border-t border-primary/10 pt-5 flex justify-between items-center">
                <span className="font-headline font-black text-sm text-black">Total</span>
                <span className="font-headline font-black text-xl text-primary">€ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={onCheckout} className="w-full bg-primary text-cream font-headline font-black text-[11px] py-4 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest">
              Finalizar no WhatsApp
            </button>
          </section>
        </div>
      </main>
    </motion.div>
  );
};
