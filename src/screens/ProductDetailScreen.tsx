import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Clock, Check } from 'lucide-react';
import { Product, CartItem, View } from '../types';

interface ProductDetailScreenProps {
  product: Product;
  cart: CartItem[];
  onAddToCart: (product: Product, options: {
    sauce?: string; observations?: string; quantity?: number;
    massa?: string; recheio1?: string; recheio2?: string; adicionais?: string[];
    tamanho?: string; tema?: string;
    variant?: string; selectedFlavors?: string[];
  }) => void;
  onUpdateCartItem?: (oldCartId: string, product: Product, options: {
    sauce?: string; observations?: string; quantity?: number;
    massa?: string; recheio1?: string; recheio2?: string; adicionais?: string[];
    tamanho?: string; tema?: string;
    variant?: string; selectedFlavors?: string[];
  }) => void;
  editingItem?: CartItem | null;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  favorites: string[];
  onNavigate: (view: View) => void;
  onBack: () => void;
}

const TAMANHOS = [
  { label: 'Mini (800g)', price: 19.99 },
  { label: 'Pequeno (1,5kg)', price: 39.90 },
  { label: 'Médio (3kg)', price: 59.90 },
  { label: 'Grande (5kg)', price: 79.90 },
];

const MASSAS_BT = [
  { label: 'Chocolate', extra: 0 },
  { label: 'Massa Branca', extra: 0 },
  { label: 'Cenoura', extra: 2 },
  { label: 'Red Velvet', extra: 2 },
];

const RECHEIOS_BT = [
  { label: 'Brigadeiro Tradicional', extra: 0 },
  { label: 'Brigadeiro Branco', extra: 0 },
  { label: 'Doce de Leite', extra: 0 },
  { label: 'Nido (Leite Ninho)', extra: 0 },
  { label: 'Brigadeiro de Cream Cheese', extra: 2 },
  { label: 'Doce de Leite com Ameixa', extra: 3 },
  { label: 'Morango', extra: 3 },
  { label: 'Maracujá', extra: 3 },
  { label: 'Abacaxi', extra: 3 },
  { label: 'Coco', extra: 3 },
];

// ── Badge "Obrigatório" ───────────────────────────────────────────────────────
function RequiredBadge({ done }: { done: boolean }) {
  return (
    <span className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded transition-colors ${done ? 'bg-primary text-cream' : 'bg-red-500 text-white'}`}>
      {done && <Check size={10} strokeWidth={3} />}
      Obrigatório
    </span>
  );
}

// ── Linha de opção com radio ──────────────────────────────────────────────────
function RadioRow({ label, priceLabel, selected, onClick }: {
  label: string; priceLabel?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3.5 border-b border-black/[0.05] last:border-0 active:bg-black/[0.02] transition-colors text-left"
    >
      <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? 'border-primary' : 'border-black/25'}`}>
        {selected && <div className="w-[11px] h-[11px] rounded-full bg-primary" />}
      </div>
      <span className="flex-1 font-body text-[14px] text-black leading-snug">{label}</span>
      {priceLabel && <span className="font-bold text-[14px] text-primary shrink-0">{priceLabel}</span>}
    </button>
  );
}

// ── Linha de opção com checkbox (multi-select) ────────────────────────────────
function CheckRow({ label, priceLabel, selected, onClick }: {
  label: string; priceLabel?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3.5 border-b border-black/[0.05] last:border-0 active:bg-black/[0.02] transition-colors text-left"
    >
      <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? 'border-primary bg-primary' : 'border-black/25'}`}>
        {selected && <Check size={11} strokeWidth={3} className="text-white" />}
      </div>
      <span className="flex-1 font-body text-[14px] text-black leading-snug">{label}</span>
      {priceLabel && <span className="font-bold text-[14px] text-primary shrink-0">{priceLabel}</span>}
    </button>
  );
}

// ── Seção com título e badge ──────────────────────────────────────────────────
function Section({ title, done, optional, hint, children }: {
  title: string; done?: boolean; optional?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white">
      <div className="px-6 pt-5 pb-1 flex justify-between items-center gap-3">
        <h3 className="font-headline font-black text-[17px] text-black leading-tight">{title}</h3>
        {!optional && <RequiredBadge done={!!done} />}
        {optional && <span className="text-[11px] font-bold text-black/30 px-2.5 py-1 border border-black/10 rounded">Opcional</span>}
      </div>
      {hint && <p className="px-6 pb-1 text-[12px] text-black/40 font-body">{hint}</p>}
      <div className="px-6 pb-2">{children}</div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product, cart, onAddToCart, onUpdateCartItem, editingItem, onToggleFavorite, favorites, onNavigate, onBack,
}) => {
  const [quantity, setQuantity] = useState(editingItem?.quantity || 1);
  const [observations, setObservations] = useState(editingItem?.observations || '');
  const [tamanho, setTamanho] = useState(editingItem?.tamanho || '');
  const [massa, setMassa] = useState(editingItem?.massa || '');
  const [recheio1, setRecheio1] = useState(editingItem?.recheio1 || '');
  const [recheio2, setRecheio2] = useState(editingItem?.recheio2 || '');
  const [tema, setTema] = useState(editingItem?.tema || '');
  const [variant, setVariant] = useState(editingItem?.variant || '');
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(editingItem?.selectedFlavors || []);
  const [sauce] = useState('');

  React.useEffect(() => {
    if (editingItem) {
      setQuantity(editingItem.quantity);
      setObservations(editingItem.observations || '');
      setTamanho(editingItem.tamanho || '');
      setMassa(editingItem.massa || '');
      setRecheio1(editingItem.recheio1 || '');
      setRecheio2(editingItem.recheio2 || '');
      setTema(editingItem.tema || '');
      setVariant(editingItem.variant || '');
      setSelectedFlavors(editingItem.selectedFlavors || []);
    } else {
      setQuantity(1);
      setObservations('');
      setTamanho('');
      setMassa('');
      setRecheio1('');
      setRecheio2('');
      setTema('');
      setVariant('');
      setSelectedFlavors([]);
    }
  }, [editingItem]);

  const isFav = favorites.includes(product.id);
  const isSimples = product.simples === true;
  const isConfiguravel = product.configuravel === true;

  // Preço calculado dinamicamente
  const calculatedPrice = useMemo(() => {
    if (!isConfiguravel) return product.price * quantity;
    
    if (['Brigadeiros', 'Salgados'].includes(product.category) && product.variants) {
      const vPrice = product.variants.find(v => v.label === variant)?.price ?? 0;
      return vPrice * quantity;
    }

    const basePrice = TAMANHOS.find(t => t.label === tamanho)?.price ?? 0;
    const massaExtra = MASSAS_BT.find(m => m.label === massa)?.extra ?? 0;
    const r1Extra = RECHEIOS_BT.find(r => r.label === recheio1)?.extra ?? 0;
    const r2Extra = recheio2 && recheio2 !== recheio1 ? (RECHEIOS_BT.find(r => r.label === recheio2)?.extra ?? 0) : 0;
    return (basePrice + massaExtra + r1Extra + r2Extra) * quantity;
  }, [isConfiguravel, product.price, quantity, tamanho, massa, recheio1, recheio2, variant, product.category, product.variants]);

  // Lógica: 1º clique = seleciona, 2º no mesmo = duplica ("só esse"), 3º = cancela
  const handleRecheioSelect = (r: string) => {
    if (recheio1 === r && recheio2 === r) {
      setRecheio1(''); setRecheio2('');
    } else if (recheio1 === r && !recheio2) {
      setRecheio2(r); // duplica → "só esse recheio"
    } else if (recheio2 === r && recheio1 !== r) {
      setRecheio2('');
    } else if (!recheio1) {
      setRecheio1(r);
    } else if (!recheio2) {
      setRecheio2(r);
    } else {
      setRecheio1(r); setRecheio2('');
    }
  };

  const canAdd = !isConfiguravel || 
    (['Brigadeiros', 'Salgados'].includes(product.category) ? variant !== '' : (tamanho !== '' && massa !== '' && recheio1 !== ''));

  const handleAdd = () => {
    if (!canAdd) return;
    const options = ['Brigadeiros', 'Salgados'].includes(product.category) 
      ? { variant, selectedFlavors, observations, quantity }
      : { massa, recheio1, recheio2, observations, quantity, tamanho, tema };
    
    if (editingItem && onUpdateCartItem) {
      if (isConfiguravel) {
        onUpdateCartItem(editingItem.cartId, { ...product, price: calculatedPrice / quantity }, options);
      } else {
        onUpdateCartItem(editingItem.cartId, product, { sauce, observations, quantity });
      }
    } else {
      if (isConfiguravel) {
        onAddToCart({ ...product, price: calculatedPrice / quantity }, options);
      } else {
        onAddToCart(product, { sauce, observations, quantity });
      }
    }
    onNavigate('cart');
  };

  const fmtExtra = (extra: number) => extra > 0 ? `+${extra.toFixed(2)} €` : '+0,00 €';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-stone-50">

      {/* Botões flutuantes */}
      <div className="fixed top-0 inset-x-0 z-50 flex justify-between items-center p-4 pointer-events-none">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center text-primary shadow-md active:scale-90 transition-transform pointer-events-auto border border-black/5"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={(e) => onToggleFavorite(product.id, e)}
          className={`w-10 h-10 rounded-full shadow-md backdrop-blur-md transition-all active:scale-125 flex items-center justify-center pointer-events-auto border ${isFav ? 'bg-primary text-cream border-primary' : 'bg-white/95 text-primary border-black/5'}`}
        >
          <Heart size={18} className={isFav ? 'fill-cream' : ''} />
        </button>
      </div>

      {/* Layout: mobile stack / desktop 2 colunas */}
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row md:items-start">

        {/* ── Imagem ── */}
        <div className="md:sticky md:top-0 md:h-screen md:w-[42%] shrink-0">
          <div className="aspect-square md:h-screen md:w-full w-full bg-stone-100">
            <img src={product.image} alt={product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>

        {/* ── Formulário ── */}
        <div className="flex-1 md:overflow-y-auto md:h-screen">
          <div className="relative -mt-10 md:mt-0 rounded-t-[24px] md:rounded-none overflow-hidden bg-white shadow-xl md:shadow-none pb-36">

            {/* Cabeçalho: nome, descrição, preço */}
            <div className="px-6 pt-4 pb-3 bg-white border-b border-black/[0.06]">
              <div className="flex gap-2 mb-2 flex-wrap">
                {product.isNew && (
                  <span className="bg-gold/20 text-primary font-headline font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest">Novo ✨</span>
                )}
                {isConfiguravel && (
                  <span className="bg-primary/10 text-primary font-headline font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest">Personalizável 🎨</span>
                )}
              </div>
              <h2 className="font-headline font-black text-[22px] text-black tracking-tight leading-tight mb-1">{product.name}</h2>
              <p className="font-body text-[13px] text-black/50 leading-relaxed mb-3">{product.description}</p>

              {/* Preço total — bem visível */}
              <div className="flex items-baseline gap-2">
                {isConfiguravel && ((['Brigadeiros', 'Salgados'].includes(product.category) && !variant) || (!['Brigadeiros', 'Salgados'].includes(product.category) && !tamanho)) ? (
                  <span className="font-body text-[13px] text-black/40">Selecione uma opção para ver o preço</span>
                ) : (
                  <>
                    <span className="font-headline font-black text-[28px] text-primary leading-none">
                      € {calculatedPrice.toFixed(2)}
                    </span>
                    {quantity > 1 && (
                      <span className="font-body text-[12px] text-black/40">{quantity}x</span>
                    )}
                    {isConfiguravel && ((['Brigadeiros', 'Salgados'].includes(product.category) && variant) || (!['Brigadeiros', 'Salgados'].includes(product.category) && tamanho)) && (
                      <span className="font-body text-[12px] text-black/40">estimado</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── BRIGADEIROS / SALGADOS ── */}
            {isConfiguravel && ['Brigadeiros', 'Salgados'].includes(product.category) && (
              <div className="divide-y divide-black/[0.06]">
                {/* Tamanho da Caixa / Quantidade */}
                <Section title={product.category === 'Salgados' ? 'Selecione a quantidade' : 'Selecione o tamanho da caixa'} done={!!variant}>
                  {product.variants?.map(v => (
                    <RadioRow
                      key={v.label}
                      label={v.label}
                      priceLabel={`${v.price.toFixed(2)} €`}
                      selected={variant === v.label}
                      onClick={() => setVariant(v.label)}
                    />
                  ))}
                </Section>

                {/* Sabores / Opções */}
                {product.flavors && product.flavors.length > 0 && (
                  <Section title={product.category === 'Salgados' ? 'Escolha as opções' : 'Escolha os sabores'} optional hint="Selecione as opções desejadas. Pode detalhar as quantidades exatas nas observações.">
                    {product.flavors.map(f => {
                      const sel = selectedFlavors.includes(f);
                      return (
                        <CheckRow
                          key={f}
                          label={f}
                          selected={sel}
                          onClick={() => {
                            if (sel) {
                              setSelectedFlavors(selectedFlavors.filter(x => x !== f));
                            } else {
                              if (f === 'Tudo misturado') {
                                setSelectedFlavors(['Tudo misturado']);
                              } else {
                                setSelectedFlavors([...selectedFlavors.filter(x => x !== 'Tudo misturado'), f]);
                              }
                            }
                          }}
                        />
                      );
                    })}
                  </Section>
                )}

                {/* Observações */}
                <Section title="Observações" optional hint="Ex: Quero 10 de Ninho e 15 de Brigadeiro">
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Especifique quantidades ou outros detalhes aqui..."
                    className="w-full h-24 bg-stone-50 rounded-xl p-3.5 font-body text-[13px] text-black border border-black/8 focus:border-primary/30 outline-none transition-all resize-none placeholder:text-black/25 mt-1"
                  />
                </Section>
              </div>
            )}

            {/* ── BOLOS TEMÁTICOS ── */}
            {isConfiguravel && !['Brigadeiros', 'Salgados'].includes(product.category) && (
              <div className="divide-y divide-black/[0.06]">

                {/* Tamanho */}
                <Section title="Selecione o tamanho" done={!!tamanho}>
                  {TAMANHOS.map(t => (
                    <RadioRow
                      key={t.label}
                      label={t.label}
                      priceLabel={`${t.price.toFixed(2)} €`}
                      selected={tamanho === t.label}
                      onClick={() => setTamanho(t.label)}
                    />
                  ))}
                </Section>

                {/* Massa */}
                <Section title="Selecione a massa" done={!!massa}>
                  {MASSAS_BT.map(m => (
                    <RadioRow
                      key={m.label}
                      label={m.label}
                      priceLabel={m.extra > 0 ? `+${m.extra.toFixed(2)} €` : undefined}
                      selected={massa === m.label}
                      onClick={() => setMassa(m.label)}
                    />
                  ))}
                </Section>

                {/* Recheio */}
                <Section
                  title="Escolha o recheio"
                  done={!!recheio1}
                  hint="Até 2 opções. Clique 2x no mesmo para usar só ele."
                >
                  {RECHEIOS_BT.map(r => {
                    const sel = recheio1 === r.label || recheio2 === r.label;
                    const isDouble = recheio1 === r.label && recheio2 === r.label;
                    return (
                      <CheckRow
                        key={r.label}
                        label={isDouble ? `${r.label} (somente este)` : r.label}
                        priceLabel={r.extra > 0 ? `+${r.extra.toFixed(2)} €` : undefined}
                        selected={sel}
                        onClick={() => handleRecheioSelect(r.label)}
                      />
                    );
                  })}
                </Section>

                {/* Tema */}
                <Section title="Tema / Referência" optional hint="Descreva o tema ou informe que enviará fotos pelo WhatsApp.">
                  <textarea
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    placeholder="Ex: Mickey Mouse, azul e amarelo. Enviarei 2 fotos de referência no WhatsApp."
                    className="w-full h-24 bg-stone-50 rounded-xl p-3.5 font-body text-[13px] text-black border border-black/8 focus:border-primary/30 outline-none transition-all resize-none placeholder:text-black/25 mt-1"
                  />
                </Section>

                {/* Observações */}
                <Section title="Observações" optional>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Alguma informação adicional?"
                    className="w-full h-20 bg-stone-50 rounded-xl p-3.5 font-body text-[13px] text-black border border-black/8 focus:border-primary/30 outline-none transition-all resize-none placeholder:text-black/25 mt-1"
                  />
                </Section>
              </div>
            )}

            {/* ── BOLOS CASEIROS (simples) ── */}
            {isSimples && (
              <div className="divide-y divide-black/[0.06]">
                <div className="px-6 py-4 bg-green-50 flex gap-3 items-center">
                  <Check size={16} className="text-green-600 shrink-0" />
                  <p className="font-body text-[13px] text-green-700 font-semibold">Produto artesanal, pronto para encomendar.</p>
                </div>
                <Section title="Observações" optional>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Algo especial que devemos saber?"
                    className="w-full h-20 bg-stone-50 rounded-xl p-3.5 font-body text-[13px] text-black border border-black/8 focus:border-primary/30 outline-none transition-all resize-none placeholder:text-black/25 mt-1"
                  />
                </Section>
              </div>
            )}

            {/* ── GENÉRICO (Doces, Salgados, Kit Festa) ── */}
            {!isSimples && !isConfiguravel && (
              <Section title="Observações" optional>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Alguma preferência ou pedido especial?"
                  className="w-full h-20 bg-stone-50 rounded-xl p-3.5 font-body text-[13px] text-black border border-black/8 focus:border-primary/30 outline-none transition-all resize-none placeholder:text-black/25 mt-1"
                />
              </Section>
            )}
          </div>
        </div>
      </div>

      {/* ── Barra de ação fixa ── */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-black/[0.07] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="max-w-[1100px] mx-auto px-4 py-3 flex items-center gap-3">
          {/* Quantidade */}
          <div className="flex items-center bg-stone-100 rounded-full h-12 px-2 shrink-0 gap-1">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center text-black/40 hover:text-primary transition-colors rounded-full">
              <Minus size={16} />
            </button>
            <span className="w-7 text-center font-headline font-black text-[15px] text-black">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center text-black/40 hover:text-primary transition-colors rounded-full">
              <Plus size={16} />
            </button>
          </div>

          {/* Botão */}
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className={`flex-1 h-12 rounded-full flex items-center justify-between px-5 font-headline font-bold text-[14px] tracking-wide transition-all ${
              canAdd
                ? 'bg-primary text-cream shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98]'
                : 'bg-black/10 text-black/30 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} />
              <span>{editingItem ? 'Atualizar Produto' : (isConfiguravel ? 'Adicionar encomenda' : 'Adicionar')}</span>
            </div>
            {calculatedPrice > 0 && (
              <span className={`font-black text-[15px] ${canAdd ? 'text-gold' : 'text-black/30'}`}>
                € {calculatedPrice.toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
