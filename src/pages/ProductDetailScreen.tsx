import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Clock, Check } from 'lucide-react';
import { Product, CartItem, View } from '../config/types';
import { ProductEditButton } from '../components/ProductEditButton';
import { THEMED_CAKE_SIZES } from '../config/constants';
import { formatEuros } from '../features/checkout/order';
import { productOrderMode } from '../features/products/catalogFields';

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
  onEditProduct?: (id: string) => void;
}

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
    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded transition-colors ${done ? 'bg-primary text-on-primary' : 'bg-red-500 text-on-strong'}`}>
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
    <button type="button" aria-pressed={selected}
      onClick={onClick}
      className="ui-choice"
    >
      <div className={`w-[22px] h-[22px] rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${selected ? 'border-primary shadow-[0_0_0_4px_rgba(128,0,0,0.1)]' : 'border-black/20'}`}>
        {selected && <div className="w-[12px] h-[12px] rounded-full bg-primary" />}
      </div>
      <span className="flex-1 text-sm text-on-surface leading-snug">{label}</span>
      {priceLabel && <span className="font-bold text-sm text-primary shrink-0">{priceLabel}</span>}
    </button>
  );
}

// ── Linha de opção com checkbox (multi-select) ────────────────────────────────
function CheckRow({ label, priceLabel, selected, onClick }: {
  label: string; priceLabel?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" aria-pressed={selected}
      onClick={onClick}
      className="ui-choice"
    >
      <div className={`w-[22px] h-[22px] rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${selected ? 'border-primary bg-primary shadow-[0_0_0_4px_rgba(128,0,0,0.1)]' : 'border-black/20'}`}>
        {selected && <Check size={12} strokeWidth={3} className="text-on-strong" />}
      </div>
      <span className="flex-1 text-sm text-on-surface leading-snug">{label}</span>
      {priceLabel && <span className="font-bold text-sm text-primary shrink-0">{priceLabel}</span>}
    </button>
  );
}

// ── Seção com título e badge ──────────────────────────────────────────────────
function Section({ title, done, optional, hint, children }: {
  title: string; done?: boolean; optional?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-surface">
      <div className="px-6 pt-5 pb-1 flex justify-between items-center gap-3">
        <h2 className="type-section text-on-surface">{title}</h2>
        {!optional && <RequiredBadge done={!!done} />}
        {optional && <span className="text-xs font-bold text-muted px-2.5 py-1 border border-black/10 rounded">Opcional</span>}
      </div>
      {hint && <p className="px-6 pb-1 text-xs text-muted">{hint}</p>}
      <div className="px-6 pb-2">{children}</div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product, cart, onAddToCart, onUpdateCartItem, editingItem, onToggleFavorite, favorites, onNavigate, onBack, onEditProduct,
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
  const sauce = editingItem?.selectedSauce ?? '';

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
  const orderMode = productOrderMode(product);
  const isConfiguravel = orderMode !== 'simple';
  const hasBoxOptions = orderMode === 'brigadeiros' || orderMode === 'salgados';

  const tamanhos = orderMode === 'cake' && product.variants?.length ? product.variants : THEMED_CAKE_SIZES;

  // Preço calculado dinamicamente
  const calculatedPrice = useMemo(() => {
    if (!isConfiguravel) return product.price * quantity;
    
    if (hasBoxOptions && product.variants) {
      const vPrice = product.variants.find(v => v.label === variant)?.price ?? 0;
      return vPrice * quantity;
    }

    const basePrice = tamanhos.find(t => t.label === tamanho)?.price ?? 0;
    const massaExtra = MASSAS_BT.find(m => m.label === massa)?.extra ?? 0;
    const r1Extra = RECHEIOS_BT.find(r => r.label === recheio1)?.extra ?? 0;
    const r2Extra = recheio2 && recheio2 !== recheio1 ? (RECHEIOS_BT.find(r => r.label === recheio2)?.extra ?? 0) : 0;
    return (basePrice + massaExtra + r1Extra + r2Extra) * quantity;
  }, [isConfiguravel, product.price, quantity, tamanho, massa, recheio1, recheio2, variant, hasBoxOptions, product.variants, tamanhos]);

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
    (hasBoxOptions ? !!product.variants?.some(option => option.label === variant) : (tamanhos.some(option => option.label === tamanho) && massa !== '' && recheio1 !== ''));

  const handleAdd = () => {
    if (!canAdd) return;
    const options = hasBoxOptions 
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

  const fmtExtra = (extra: number) => '+' + formatEuros(extra);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-subtle">

      {/* Botões flutuantes */}
      <div className="fixed top-[env(safe-area-inset-top)] inset-x-0 z-50 flex justify-between items-center p-3 pointer-events-none">
        <button
          type="button" aria-label="Voltar"
          onClick={onBack}
          className="ui-icon-action rounded-full bg-surface/95 shadow-sm pointer-events-auto"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <button
          type="button" aria-label="Favorito" aria-pressed={isFav} data-active={isFav}
          onClick={(e) => onToggleFavorite(product.id, e)}
          className="ui-icon-action rounded-full bg-surface/95 shadow-sm pointer-events-auto"
        >
          <Heart size={16} className={isFav ? 'fill-cream' : ''} aria-hidden="true" />
        </button>
      </div>

      {/* Layout: mobile stack / desktop 2 colunas */}
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row md:items-start">

        {/* ── Imagem ── */}
        <div className="md:sticky md:top-0 md:h-screen md:w-[42%] shrink-0">
          <div className="aspect-square md:h-screen md:w-full w-full bg-muted-fill">
            <img src={product.image} alt={product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>

        {/* ── Formulário ── */}
        <div className="flex-1 md:overflow-y-auto md:h-screen">
          <div className="relative -mt-12 md:mt-0 rounded-t-[32px] md:rounded-t-none overflow-hidden bg-surface shadow-[0_-12px_40px_rgba(0,0,0,0.06)] md:shadow-none pb-36">

            {/* Cabeçalho: nome, descrição, preço */}
            <div className="px-6 pt-6 pb-4 bg-surface border-b border-black/[0.04]">
              <div className="flex gap-2 mb-2 flex-wrap">
                {product.isNew && (
                  <span className="bg-gold/20 text-primary font-bold text-xs px-2 py-0.5 rounded-full uppercase tracking-widest">Novo ✨</span>
                )}
                {isConfiguravel && (
                  <span className="bg-primary/10 text-primary font-bold text-xs px-2 py-0.5 rounded-full uppercase tracking-widest">Personalizável 🎨</span>
                )}
              </div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3">
                <h1 className="type-page text-on-surface">{product.name}</h1>
                <ProductEditButton product={product} onEdit={onEditProduct} />
              </div>
              <p className="text-sm text-muted leading-relaxed mb-3">{product.description}</p>

              {/* Preço total — bem visível */}
              <div className="flex items-baseline gap-2">
                {isConfiguravel && ((hasBoxOptions && !variant) || (!hasBoxOptions && !tamanho)) ? (
                  <span className="text-sm text-muted">Selecione uma opção para ver o preço</span>
                ) : (
                  <>
                    <span className="type-page text-primary tabular-nums">
                      {formatEuros(calculatedPrice)}
                    </span>
                    {quantity > 1 && (
                      <span className="text-xs text-muted">{quantity}x</span>
                    )}
                    {isConfiguravel && ((hasBoxOptions && variant) || (!hasBoxOptions && tamanho)) && (
                      <span className="text-xs text-muted">estimado</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── BRIGADEIROS / SALGADOS ── */}
            {isConfiguravel && hasBoxOptions && (
              <div className="divide-y divide-black/[0.06]">
                {/* Tamanho da Caixa / Quantidade */}
                <Section title={orderMode === 'salgados' ? 'Selecione a quantidade' : 'Selecione o tamanho da caixa'} done={!!variant}>
                  {product.variants?.map(v => (
                    <RadioRow
                      key={v.label}
                      label={v.label}
                      priceLabel={formatEuros(v.price)}
                      selected={variant === v.label}
                      onClick={() => setVariant(v.label)}
                    />
                  ))}
                </Section>

                {/* Sabores / Opções */}
                {product.flavors && product.flavors.length > 0 && (
                  <Section title={orderMode === 'salgados' ? 'Escolha as opções' : 'Escolha os sabores'} optional hint="Selecione as opções desejadas. Pode detalhar as quantidades exatas nas observações.">
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
                      maxLength={300}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Especifique quantidades ou outros detalhes aqui..."
                    className="w-full h-24 bg-subtle rounded-xl p-3.5 text-base text-on-surface border border-black/8 focus:border-primary/30 outline-none transition-all resize-none placeholder:text-muted mt-1"
                  />
                </Section>
              </div>
            )}

            {/* ── BOLOS TEMÁTICOS ── */}
            {isConfiguravel && !hasBoxOptions && (
              <div className="divide-y divide-black/[0.06]">

                {/* Tamanho */}
                <Section title="Selecione o tamanho" done={!!tamanho}>
                  {tamanhos.map(t => (
                    <RadioRow
                      key={t.label}
                      label={t.label}
                      priceLabel={formatEuros(t.price)}
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
                      priceLabel={m.extra > 0 ? fmtExtra(m.extra) : undefined}
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
                        priceLabel={r.extra > 0 ? fmtExtra(r.extra) : undefined}
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
                      maxLength={200}
                    onChange={(e) => setTema(e.target.value)}
                    placeholder="Ex: Mickey Mouse, azul e amarelo. Enviarei 2 fotos de referência no WhatsApp."
                    className="w-full h-24 bg-subtle rounded-xl p-3.5 text-base text-on-surface border border-black/8 focus:border-primary/30 outline-none transition-all resize-none placeholder:text-muted mt-1"
                  />
                </Section>

                {/* Observações */}
                <Section title="Observações" optional>
                  <textarea
                    value={observations}
                      maxLength={300}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Alguma informação adicional?"
                    className="w-full h-20 bg-subtle rounded-xl p-3.5 text-base text-on-surface border border-black/8 focus:border-primary/30 outline-none transition-all resize-none placeholder:text-muted mt-1"
                  />
                </Section>
              </div>
            )}

            {/* ── BOLOS CASEIROS (simples) ── */}
            {isSimples && (
              <div className="divide-y divide-black/[0.06]">
                <div className="px-6 py-4 bg-green-50 flex gap-3 items-center">
                  <Check size={16} className="text-green-600 shrink-0" />
                  <p className="text-sm text-green-700 font-bold">Produto artesanal, pronto para encomendar.</p>
                </div>
                <Section title="Observações" optional>
                  <textarea
                    value={observations}
                      maxLength={300}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Algo especial que devemos saber?"
                    className="w-full h-20 bg-subtle rounded-xl p-3.5 text-base text-on-surface border border-black/8 focus:border-primary/30 outline-none transition-all resize-none placeholder:text-muted mt-1"
                  />
                </Section>
              </div>
            )}

            {/* ── GENÉRICO (Doces, Salgados, Kit Festa) ── */}
            {!isSimples && !isConfiguravel && (
              <Section title="Observações" optional>
                <textarea
                  value={observations}
                      maxLength={300}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Alguma preferência ou pedido especial?"
                  className="w-full h-20 bg-subtle rounded-xl p-3.5 text-base text-on-surface border border-black/8 focus:border-primary/30 outline-none transition-all resize-none placeholder:text-muted mt-1"
                />
              </Section>
            )}
          </div>
        </div>
      </div>

      {/* ── Barra de ação fixa ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-outline bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
        <div className="page-width flex flex-wrap items-center gap-2 py-2 sm:gap-4">
          {/* Quantidade */}
          <div className="flex shrink-0 items-center rounded-xl bg-muted-fill">
            <button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="ui-icon-action">
              <Minus size={14} aria-hidden="true" />
            </button>
            <span className="w-6 text-center text-sm tabular-nums">{quantity}</span>
            <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantity(quantity + 1)} className="ui-icon-action">
              <Plus size={14} aria-hidden="true" />
            </button>
          </div>

          {/* Botão */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="ui-primary flex min-w-40 flex-1 items-center justify-between gap-2 text-left"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={15} className="hidden shrink-0 sm:block" aria-hidden="true" />
              <span>{editingItem ? 'Atualizar' : 'Adicionar'}</span>
            </div>
            {calculatedPrice > 0 && (
              <span className="whitespace-nowrap tabular-nums">
                {formatEuros(calculatedPrice)}
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
