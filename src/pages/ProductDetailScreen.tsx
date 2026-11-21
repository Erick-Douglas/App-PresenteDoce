import { ProductChoices } from "../components/ProductChoices";
import {
  optionsExtra,
  selectionProblem,
  type Selections,
} from "../features/products/options";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { ProductEditButton } from "../components/ProductEditButton";
import { THEMED_CAKE_SIZES } from "../config/constants";
import { CartItem, Product, View } from "../config/types";
import { formatEuros } from "../features/checkout/order";
import {
  options as cakeOptions,
  stockFor,
  useStore,
} from "../features/platform/StoreProvider";
import { imageUrl } from "../features/products/catalogApi";
import { productOrderMode } from "../features/products/catalogFields";

interface ProductDetailScreenProps {
  product: Product;
  cart: CartItem[];
  onAddToCart: (
    product: Product,
    options: {
      sauce?: string;
      observations?: string;
      quantity?: number;
      massa?: string;
      recheio1?: string;
      recheio2?: string;
      adicionais?: string[];
      tamanho?: string;
      tema?: string;
      mode?: "ready" | "preorder";
      variant?: string;
      selectedFlavors?: string[];
      selections?: Selections;
      basePrice?: number;
    },
  ) => void;
  onUpdateCartItem?: (
    oldCartId: string,
    product: Product,
    options: {
      sauce?: string;
      observations?: string;
      quantity?: number;
      massa?: string;
      recheio1?: string;
      recheio2?: string;
      adicionais?: string[];
      tamanho?: string;
      tema?: string;
      mode?: "ready" | "preorder";
      variant?: string;
      selectedFlavors?: string[];
      selections?: Selections;
      basePrice?: number;
    },
  ) => void;
  editingItem?: CartItem | null;
  onStartAnother?: () => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  favorites: string[];
  onNavigate: (view: View) => void;
  onBack: () => void;
  categoryId?: string;
  onEditProduct?: (id: string) => void;
}

// ── Badge "Obrigatório" ───────────────────────────────────────────────────────
function RequiredBadge({ done }: { done: boolean }) {
  return (
    <span
      className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded transition-colors ${done ? "bg-emerald-50 text-emerald-900" : "bg-muted-fill text-muted"}`}
    >
      {done && <Check size={10} strokeWidth={3} />}
      Obrigatório
    </span>
  );
}

// ── Linha de opção com radio ──────────────────────────────────────────────────
function RadioRow({
  label,
  priceLabel,
  selected,
  onClick,
}: {
  label: string;
  priceLabel?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="ui-choice"
    >
      <div
        className={`w-[22px] h-[22px] rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${selected ? "border-primary shadow-[0_0_0_4px_rgba(128,0,0,0.1)]" : "border-black/20"}`}
      >
        {selected && (
          <div className="w-[12px] h-[12px] rounded-full bg-primary" />
        )}
      </div>
      <span className="flex-1 text-sm text-on-surface leading-snug">
        {label}
      </span>
      {priceLabel && (
        <span className="font-bold text-sm text-primary shrink-0">
          {priceLabel}
        </span>
      )}
    </button>
  );
}

// ── Linha de opção com checkbox (multi-select) ────────────────────────────────
function CheckRow({
  label,
  priceLabel,
  selected,
  onClick,
}: {
  label: string;
  priceLabel?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="ui-choice"
    >
      <div
        className={`w-[22px] h-[22px] rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${selected ? "border-primary bg-primary shadow-[0_0_0_4px_rgba(128,0,0,0.1)]" : "border-black/20"}`}
      >
        {selected && (
          <Check size={12} strokeWidth={3} className="text-on-strong" />
        )}
      </div>
      <span className="flex-1 text-sm text-on-surface leading-snug">
        {label}
      </span>
      {priceLabel && (
        <span className="font-bold text-sm text-primary shrink-0">
          {priceLabel}
        </span>
      )}
    </button>
  );
}

// ── Seção com título e badge ──────────────────────────────────────────────────
function Section({
  title,
  done,
  optional,
  hint,
  children,
}: {
  title: string;
  done?: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface">
      <div className="px-6 pt-5 pb-1 flex justify-between items-center gap-3">
        <h2 className="type-section text-on-surface">{title}</h2>
        {!optional && <RequiredBadge done={!!done} />}
        {optional && (
          <span className="text-xs font-bold text-muted px-2.5 py-1 border border-black/10 rounded">
            Opcional
          </span>
        )}
      </div>
      {hint && <p className="px-6 pb-1 text-xs text-muted">{hint}</p>}
      <div className="px-6 pb-2">{children}</div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  cart,
  onAddToCart,
  onUpdateCartItem,
  editingItem,
  onStartAnother,
  onToggleFavorite,
  favorites,
  onNavigate,
  onBack,
  onEditProduct,
  categoryId,
}) => {
  const { settings, stock } = useStore();
  const hasGeneric = product.optionGroups !== undefined;
  const groups = product.optionGroups ?? [];
  const cleanSelections = (value: Selections): Selections =>
    Object.fromEntries(
      groups.map((g) => [
        g.id,
        (value[g.id] ?? []).filter((id) => g.options.some((o) => o.id === id)),
      ]),
    );
  const [selections, setSelections] = useState<Selections>(() =>
    cleanSelections(editingItem?.selections ?? {}),
  );
  const optionsError = selectionProblem(groups, selections);
  const preorderOnly = settings.preorder_only !== false;
  const MASSAS_BT = cakeOptions(settings.cake_masses).map((v) => ({
    label: v.label,
    extra: v.extra_cents / 100,
  }));
  const RECHEIOS_BT = cakeOptions(settings.cake_fillings).map((v) => ({
    label: v.label,
    extra: v.extra_cents / 100,
  }));
  const [saleMode, setSaleMode] = useState<"ready" | "preorder">(
    editingItem?.mode || product.saleModes?.[0] || "preorder",
  );
  const [hero, setHero] = useState(product.image);
  const gallery = settings.gallery.filter((g) => g.category_id === categoryId);
  const [quantity, setQuantity] = useState(editingItem?.quantity || 1);
  const [observations, setObservations] = useState(
    editingItem?.observations || "",
  );
  const [tamanho, setTamanho] = useState(editingItem?.tamanho || "");
  const [massa, setMassa] = useState(editingItem?.massa || "");
  const [recheio1, setRecheio1] = useState(editingItem?.recheio1 || "");
  const [recheio2, setRecheio2] = useState(editingItem?.recheio2 || "");
  const [tema, setTema] = useState(editingItem?.tema || "");
  const [variant, setVariant] = useState(editingItem?.variant || "");
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(
    editingItem?.selectedFlavors || [],
  );
  const sauce = editingItem?.selectedSauce ?? "";

  React.useEffect(() => {
    if (editingItem) {
      setQuantity(editingItem.quantity);
      setObservations(editingItem.observations || "");
      setTamanho(editingItem.tamanho || "");
      setMassa(editingItem.massa || "");
      setRecheio1(editingItem.recheio1 || "");
      setRecheio2(editingItem.recheio2 || "");
      setTema(editingItem.tema || "");
      setVariant(editingItem.variant || "");
      setSelectedFlavors(editingItem.selectedFlavors || []);
      setSelections(cleanSelections(editingItem.selections ?? {}));
    } else {
      setQuantity(1);
      setObservations("");
      setTamanho("");
      setMassa("");
      setRecheio1("");
      setRecheio2("");
      setTema("");
      setVariant("");
      setSelectedFlavors([]);
      setSelections({});
    }
  }, [editingItem]);

  const isFav = favorites.includes(product.id);
  const [favoriteNotice, setFavoriteNotice] = useState("");
  React.useEffect(() => {
    if (!favoriteNotice) return;
    const timer = setTimeout(() => setFavoriteNotice(""), 2600);
    return () => clearTimeout(timer);
  }, [favoriteNotice]);
  const isSimples = product.simples === true;
  const orderMode = productOrderMode(product);
  const isConfiguravel = !hasGeneric && orderMode !== "simple";
  const hasBoxOptions = orderMode === "brigadeiros" || orderMode === "salgados";

  const tamanhos =
    orderMode === "cake" && product.variants?.length
      ? product.variants
      : THEMED_CAKE_SIZES;

  // Preço calculado dinamicamente
  const calculatedPrice = useMemo(() => {
    if (hasGeneric)
      return (
        ((Math.round(product.price * 100) + optionsExtra(groups, selections)) *
          quantity) /
        100
      );
    if (!isConfiguravel) return product.price * quantity;

    if (hasBoxOptions && product.variants) {
      const vPrice =
        product.variants.find((v) => v.label === variant)?.price ?? 0;
      return vPrice * quantity;
    }

    const basePrice = tamanhos.find((t) => t.label === tamanho)?.price ?? 0;
    const massaExtra = MASSAS_BT.find((m) => m.label === massa)?.extra ?? 0;
    const r1Extra = RECHEIOS_BT.find((r) => r.label === recheio1)?.extra ?? 0;
    const r2Extra =
      recheio2 && recheio2 !== recheio1
        ? (RECHEIOS_BT.find((r) => r.label === recheio2)?.extra ?? 0)
        : 0;
    return (basePrice + massaExtra + r1Extra + r2Extra) * quantity;
  }, [
    isConfiguravel,
    product.price,
    quantity,
    tamanho,
    massa,
    recheio1,
    recheio2,
    variant,
    hasBoxOptions,
    product.variants,
    tamanhos,
    settings.cake_masses,
    settings.cake_fillings,
    hasGeneric,
    groups,
    selections,
  ]);

  // Lógica: 1º clique = seleciona, 2º no mesmo = duplica ("só esse"), 3º = cancela
  const handleRecheioSelect = (r: string) => {
    if (recheio1 === r && recheio2 === r) {
      setRecheio1("");
      setRecheio2("");
    } else if (recheio1 === r && !recheio2) {
      setRecheio2(r); // duplica → "só esse recheio"
    } else if (recheio2 === r && recheio1 !== r) {
      setRecheio2("");
    } else if (!recheio1) {
      setRecheio1(r);
    } else if (!recheio2) {
      setRecheio2(r);
    } else {
      setRecheio1(r);
      setRecheio2("");
    }
  };

  const available = stockFor(
    stock,
    product.id,
    orderMode === "cake" ? tamanho : variant,
  );
  const flavorLimit =
    product.variants?.find((v) => v.label === variant)?.maxFlavors ??
    product.flavors?.length ??
    0;
  const canAdd =
    (preorderOnly || saleMode !== "ready" || quantity <= available) &&
    (!hasGeneric || !optionsError) &&
    (hasGeneric || !hasBoxOptions || selectedFlavors.length <= flavorLimit) &&
    (!isConfiguravel ||
      (hasBoxOptions
        ? !!product.variants?.some((option) => option.label === variant)
        : tamanhos.some((option) => option.label === tamanho) &&
          massa !== "" &&
          recheio1 !== ""));

  const handleAdd = () => {
    if (!canAdd) return;
    if (hasGeneric) {
      const next = {
        mode: "preorder" as const,
        selections,
        observations,
        quantity,
        basePrice: product.price,
      };
      if (editingItem && onUpdateCartItem)
        onUpdateCartItem(
          editingItem.cartId,
          { ...product, price: calculatedPrice / quantity },
          next,
        );
      else onAddToCart({ ...product, price: calculatedPrice / quantity }, next);
      onBack();
      return;
    }
    const options = hasBoxOptions
      ? {
          mode: preorderOnly ? "preorder" : saleMode,
          variant,
          selectedFlavors,
          observations,
          quantity,
        }
      : {
          mode: preorderOnly ? "preorder" : saleMode,
          massa,
          recheio1,
          recheio2,
          observations,
          quantity,
          tamanho,
          tema,
        };

    if (editingItem && onUpdateCartItem) {
      if (isConfiguravel) {
        onUpdateCartItem(
          editingItem.cartId,
          { ...product, price: calculatedPrice / quantity },
          options,
        );
      } else {
        onUpdateCartItem(editingItem.cartId, product, {
          mode: preorderOnly ? "preorder" : saleMode,
          sauce,
          observations,
          quantity,
        });
      }
    } else {
      if (isConfiguravel) {
        onAddToCart({ ...product, price: calculatedPrice / quantity }, options);
      } else {
        onAddToCart(product, {
          mode: preorderOnly ? "preorder" : saleMode,
          sauce,
          observations,
          quantity,
        });
      }
    }
    onBack();
  };

  const fmtExtra = (extra: number) => "+" + formatEuros(extra);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-subtle"
    >
      {/* Botões flutuantes */}
      <div className="product-detail-toolbar fixed top-[env(safe-area-inset-top)] inset-x-0 z-50 flex justify-between items-center p-3 pointer-events-none gap-2">
        <button
          type="button"
          aria-label="Voltar"
          onClick={onBack}
          className="product-detail-action pointer-events-auto"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Favorito"
          aria-pressed={isFav}
          data-active={isFav}
          onClick={(e) => {
            onToggleFavorite(product.id, e);
            setFavoriteNotice(
              isFav ? "Removido dos favoritos" : "Guardado nos favoritos",
            );
          }}
          className="product-detail-action product-favorite-action pointer-events-auto"
        >
          <Heart
            size={16}
            className={isFav ? "fill-current" : ""}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        role="status"
        className="favorite-notice"
        data-visible={!!favoriteNotice}
      >
        {favoriteNotice}
      </div>

      {/* Layout: mobile stack / desktop 2 colunas */}
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row md:items-start">
        {/* ── Imagem ── */}
        <div className="md:sticky md:top-0 md:h-screen md:w-[42%] shrink-0">
          <div className="aspect-square md:h-screen md:w-full w-full bg-muted-fill">
            <img
              src={hero}
              alt={product.name}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* ── Formulário ── */}
        <div className="flex-1 md:overflow-y-auto md:h-screen">
          <div className="relative -mt-16 md:mt-0 rounded-t-[32px] md:rounded-t-none overflow-hidden bg-surface shadow-[0_-12px_40px_rgba(0,0,0,0.06)] md:shadow-none pb-36">
            {/* Cabeçalho: nome, descrição, preço */}
            <div className="px-6 pt-4 pb-4 bg-surface border-b border-black/[0.04]">
              <div className="flex gap-2 mb-2 flex-wrap">
                {product.isNew && (
                  <span className="module-badge">Novidade</span>
                )}
              </div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3">
                <h1 className="type-page text-on-surface">{product.name}</h1>
                <ProductEditButton product={product} onEdit={onEditProduct} />
              </div>
              <p className="text-sm text-muted leading-relaxed mb-3">
                {product.description}
              </p>

              {/* Preço total — bem visível */}
              <div className="flex items-baseline gap-2">
                {isConfiguravel &&
                ((hasBoxOptions && !variant) ||
                  (!hasBoxOptions && !tamanho)) ? (
                  <span className="text-sm text-muted">
                    Selecione uma opção para ver o preço
                  </span>
                ) : (
                  <>
                    <span className="type-page text-primary tabular-nums">
                      {formatEuros(calculatedPrice)}
                    </span>
                    {quantity > 1 && (
                      <span className="text-xs text-muted">{quantity}x</span>
                    )}
                    {isConfiguravel &&
                      ((hasBoxOptions && variant) ||
                        (!hasBoxOptions && tamanho)) && (
                        <span className="text-xs text-muted">estimado</span>
                      )}
                  </>
                )}
              </div>
            </div>

            {editingItem && onStartAnother && (
              <div className="product-cart-context">
                <p>Está a editar um item do carrinho.</p>
                <button
                  type="button"
                  className="ui-secondary"
                  onClick={onStartAnother}
                >
                  <Plus size={16} />
                  Adicionar outro com novas escolhas
                </button>
              </div>
            )}

            {hasGeneric && (
              <>
                <ProductChoices
                  groups={groups}
                  selections={selections}
                  onChange={setSelections}
                />
                <Section title="Observações" optional>
                  <textarea
                    className="ui-field min-h-20 resize-y"
                    aria-label="Observações do produto"
                    maxLength={300}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Algum pedido especial?"
                  />
                </Section>
              </>
            )}
            {/* ── BRIGADEIROS / SALGADOS ── */}
            {isConfiguravel && hasBoxOptions && (
              <div className="divide-y divide-black/[0.06]">
                {/* Tamanho da Caixa / Quantidade */}
                <Section
                  title={
                    orderMode === "salgados"
                      ? "Selecione a quantidade"
                      : "Selecione o tamanho da caixa"
                  }
                  done={!!variant}
                >
                  {product.variants?.map((v) => (
                    <RadioRow
                      key={v.label}
                      label={v.label}
                      priceLabel={formatEuros(v.price)}
                      selected={variant === v.label}
                      onClick={() => {
                        setVariant(v.label);
                        setSelectedFlavors((current) =>
                          current.slice(
                            0,
                            v.maxFlavors ?? product.flavors?.length ?? 0,
                          ),
                        );
                      }}
                    />
                  ))}
                </Section>

                {/* Sabores / Opções */}
                {product.flavors && product.flavors.length > 0 && (
                  <Section
                    title={
                      orderMode === "salgados"
                        ? "Escolha as opções"
                        : "Escolha os sabores"
                    }
                    optional
                    hint={
                      variant
                        ? "Escolha até " +
                          flavorLimit +
                          " opções. Detalhe as quantidades nas observações."
                        : "Escolha primeiro o tamanho da caixa."
                    }
                  >
                    {product.flavors.map((f) => {
                      const sel = selectedFlavors.includes(f);
                      return (
                        <CheckRow
                          key={f}
                          label={f}
                          selected={sel}
                          onClick={() => {
                            if (sel) {
                              setSelectedFlavors(
                                selectedFlavors.filter((x) => x !== f),
                              );
                            } else {
                              if (selectedFlavors.length >= flavorLimit) return;
                              if (f === "Tudo misturado") {
                                setSelectedFlavors(["Tudo misturado"]);
                              } else {
                                setSelectedFlavors([
                                  ...selectedFlavors.filter(
                                    (x) => x !== "Tudo misturado",
                                  ),
                                  f,
                                ]);
                              }
                            }
                          }}
                        />
                      );
                    })}
                  </Section>
                )}

                {/* Observações */}
                <Section
                  title="Observações"
                  optional
                  hint="Ex: Quero 10 de Ninho e 15 de Brigadeiro"
                >
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
                  {tamanhos.map((t) => (
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
                  {MASSAS_BT.map((m) => (
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
                  {RECHEIOS_BT.map((r) => {
                    const sel = recheio1 === r.label || recheio2 === r.label;
                    const isDouble =
                      recheio1 === r.label && recheio2 === r.label;
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
            {!hasGeneric && isSimples && (
              <div className="divide-y divide-black/[0.06]">
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
            {!hasGeneric && !isSimples && !isConfiguravel && (
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
      <div className="product-purchase-bar">
        <div className="page-width flex flex-wrap items-center gap-2 py-2 sm:gap-4">
          {/* Quantidade */}
          <div className="flex shrink-0 items-center rounded-xl bg-muted-fill">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="ui-icon-action"
            >
              <Minus size={14} aria-hidden="true" />
            </button>
            <span className="w-6 text-center text-sm tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => setQuantity(quantity + 1)}
              className="ui-icon-action"
            >
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
              <ShoppingCart
                size={15}
                className="hidden shrink-0 sm:block"
                aria-hidden="true"
              />
              <span>{editingItem ? "Atualizar no carrinho" : "Adicionar"}</span>
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
