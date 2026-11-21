import { Calculator, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { formatEuros } from '../features/checkout/order';
import type { Ingredient as ManagedIngredient } from '../features/platform/types';
import { parseDecimal } from '../features/pricing/calculation';
import {
  applyProductPrice,
  listPricingRecipes,
  savePricingRecipe,
  type PricingRecipe,
  type PricingRow,
} from '../features/pricing/pricingApi';
import { validatePricingRecipe } from '../features/pricing/recipe';
import type { CatalogRow } from '../features/products/catalogApi';
import { activeStoreId, pilotStoreId } from '../features/products/storeContext';

type Ingredient = {
  ingredientId?: string;
  recipeId?: string;
  name: string;
  unit: string;
  packQuantity: string;
  packPrice: string;
  usedQuantity: string;
};
type Recipe = PricingRecipe;
type Pricing = ReturnType<typeof validatePricingRecipe>;
const storageKey = () =>
  activeStoreId() === pilotStoreId
    ? 'presente-doce-pricing-draft-v1'
    : 'pricing-draft:' + activeStoreId();
const input = 'ui-field';
const emptyIngredient = (): Ingredient => ({
  name: '',
  unit: 'g',
  packQuantity: '',
  packPrice: '',
  usedQuantity: '',
});
const emptyRecipe = (): Recipe => ({
  title: '',
  yieldCount: '',
  salePrice: '',
  ingredients: [emptyIngredient()],
});
const percent = new Intl.NumberFormat('pt-PT', {
  style: 'percent',
  maximumFractionDigits: 2,
});

function readDraft(): Recipe {
  try {
    const value: Recipe = JSON.parse(
      localStorage.getItem(storageKey()) ?? 'null',
    );
    if (
      !value ||
      ![value.title, value.yieldCount, value.salePrice].every(
        (item) => typeof item === 'string',
      ) ||
      !Array.isArray(value.ingredients) ||
      value.ingredients.length < 1 ||
      value.ingredients.length > 70 ||
      !value.ingredients.every(
        (row) =>
          row &&
          [
            row.name,
            row.unit,
            row.packQuantity,
            row.packPrice,
            row.usedQuantity,
          ].every((item) => typeof item === 'string'),
      )
    )
      return emptyRecipe();
    return value;
  } catch {
    return emptyRecipe();
  }
}

export default function PricingScreen({
  rows,
  token,
  onProductChanged,
  ingredients = [],
}: {
  ingredients?: ManagedIngredient[];
  rows: CatalogRow[];
  token: string;
  onProductChanged: (row: CatalogRow) => void;
}) {
  const [recipe, setRecipe] = useState(readDraft);
  const [result, setResult] = useState<Pricing | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savedRecipes, setSavedRecipes] = useState<PricingRow[]>([]);
  const [saved, setSaved] = useState<PricingRow | null>(null);
  const [productId, setProductId] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmPrice, setConfirmPrice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const product = rows.find((row) => row.id === productId);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    listPricingRecipes(token, controller.signal)
      .then(setSavedRecipes)
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar as fichas.',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, loadAttempt]);

  function chooseRecipe(id: string) {
    const row = savedRecipes.find((item) => item.id === id) ?? null;
    setSaved(row);
    setRecipe(row?.recipe ?? emptyRecipe());
    setProductId(row?.product_id ?? '');
    setResult(null);
    setError('');
    setNotice('');
    setConfirmPrice(false);
  }

  async function saveRecipe() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      validatePricingRecipe(recipe);
      const row = await savePricingRecipe(
        {
          id: saved?.id ?? crypto.randomUUID(),
          product_id: productId || null,
          recipe,
        },
        saved?.version ?? null,
        token,
      );
      setSaved(row);
      setSavedRecipes((current) => [
        row,
        ...current.filter((item) => item.id !== row.id),
      ]);
      setNotice('Ficha guardada na conta da confeitaria.');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível guardar a ficha.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function applyPrice() {
    if (!product || busy) return;
    setBusy(true);
    setError('');
    try {
      validatePricingRecipe(recipe);
      const row = await applyProductPrice(
        product,
        recipe.salePrice,
        recipe.variant ?? '',
        token,
      );
      onProductChanged(row);
      setNotice('Preço atualizado no catálogo.');
      setConfirmPrice(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível aplicar o preço.',
      );
    } finally {
      setBusy(false);
    }
  }

  function update(fields: Partial<Recipe>) {
    setRecipe((current) => ({ ...current, ...fields }));
    setResult(null);
    setError('');
    setNotice('');
    setConfirmPrice(false);
  }

  function updateIngredient(index: number, fields: Partial<Ingredient>) {
    update({
      ingredients: recipe.ingredients.map((row, i) =>
        i === index ? { ...row, ...fields } : row,
      ),
    });
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);
    try {
      setResult(validatePricingRecipe(recipe));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível calcular.',
      );
    }
  }

  function saveDraft() {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(recipe));
      setNotice('Rascunho guardado neste navegador.');
    } catch {
      setNotice('Este navegador não permitiu guardar o rascunho.');
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(storageKey());
    } catch {
      /* The in-memory form can still be cleared. */
    }
    chooseRecipe('');
    setNotice(
      'Rascunho local limpo. As fichas guardadas na conta foram preservadas.',
    );
  }

  return (
    <div className="admin-form">
      <section className="ui-glass-panel space-y-3">
        <h2 className="type-item text-primary">Fichas da confeitaria</h2>
        <label className="block space-y-1">
          <span>Ficha guardada</span>
          <select
            aria-label="Ficha guardada"
            className="ui-field"
            disabled={busy || loading}
            value={saved?.id ?? ''}
            onChange={(event) => chooseRecipe(event.target.value)}
          >
            <option value="">Nova ficha</option>
            {savedRecipes.map((row) => (
              <option key={row.id} value={row.id}>
                {row.recipe.title ||
                  rows.find((product) => product.id === row.product_id)?.details
                    .name ||
                  'Ficha sem título'}
              </option>
            ))}
          </select>
        </label>
        {loading && (
          <p role="status" className="text-xs text-muted">
            A carregar fichas…
          </p>
        )}
        <label className="block space-y-1">
          <span>Produto do catálogo</span>
          <select
            aria-label="Produto do catálogo"
            className="ui-field"
            value={productId}
            disabled={busy}
            onChange={(event) => {
              const item = rows.find((row) => row.id === event.target.value);
              setProductId(event.target.value);
              update({
                title: recipe.title || item?.details.name || '',
                salePrice: item ? String(item.details.price) : recipe.salePrice,
                variant: '',
              });
            }}
          >
            <option value="">Receita sem produto associado</option>
            {rows.map((row) => (
              <option key={row.id} value={row.id}>
                {row.details.name}
                {row.published ? '' : ' · Rascunho'}
              </option>
            ))}
          </select>
        </label>
        {product?.details.variants?.length ? (
          <label className="block space-y-1">
            <span>Tamanho ou opção</span>
            <select
              aria-label="Tamanho ou opção"
              className="ui-field"
              disabled={busy}
              value={recipe.variant ?? ''}
              onChange={(event) => {
                const option = product.details.variants?.find(
                  (item) => item.label === event.target.value,
                );
                update({
                  variant: event.target.value,
                  salePrice: option ? String(option.price) : recipe.salePrice,
                });
              }}
            >
              <option value="">Selecione a opção</option>
              {product.details.variants.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <p className="text-xs text-muted">
          Guarde a ficha na conta para voltar a usá-la noutro dispositivo.
          Aplicar o preço ao catálogo é uma ação de confirmação própria.
        </p>
      </section>
      <form onSubmit={calculate} className="admin-form">
        <fieldset disabled={busy} className="admin-form">
          <section className="ui-glass-panel space-y-3">
            <h2 className="type-item text-primary">Dados da receita</h2>
            <label className="block space-y-1">
              <span>Nome da receita (opcional)</span>
              <input
                className={input}
                maxLength={100}
                value={recipe.title}
                onChange={(event) => update({ title: event.target.value })}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span>Rendimento da receita</span>
                <input
                  className={input}
                  inputMode="decimal"
                  maxLength={16}
                  required
                  value={recipe.yieldCount}
                  onChange={(event) =>
                    update({ yieldCount: event.target.value })
                  }
                />
              </label>
              <label className="block space-y-1">
                <span>Preço de venda por unidade (€)</span>
                <input
                  className={input}
                  inputMode="decimal"
                  maxLength={16}
                  required
                  value={recipe.salePrice}
                  onChange={(event) =>
                    update({ salePrice: event.target.value })
                  }
                />
              </label>
            </div>
          </section>
          <section className="ui-glass-panel space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3">
              <h2 className="type-item text-primary">Ingredientes e custos</h2>
              <button
                type="button"
                className="ui-quiet-action"
                disabled={recipe.ingredients.length >= 70}
                onClick={() =>
                  update({
                    ingredients: [...recipe.ingredients, emptyIngredient()],
                  })
                }
              >
                <Plus size={15} strokeWidth={1.65} aria-hidden="true" />{' '}
                Adicionar custo
              </button>
            </div>
            <p className="text-muted">
              Use a mesma unidade na compra e na receita. Para 1 kg, introduza
              1000 g.
            </p>
            {recipe.ingredients.map((row, index) => (
              <fieldset
                key={index}
                className="min-w-0 space-y-3 rounded-lg border border-outline bg-surface/65 px-3 pb-3"
              >
                <legend className="px-1 text-sm font-bold">
                  Custo {index + 1}
                </legend>
                <label className="module-field mb-3">
                  <span>Origem do custo</span>
                  <select
                    className="ui-field"
                    value={
                      row.ingredientId
                        ? 'i:' + row.ingredientId
                        : row.recipeId
                          ? 'r:' + row.recipeId
                          : ''
                    }
                    onChange={(e) => {
                      const [kind, id] = e.target.value.split(':');
                      if (kind === 'i') {
                        const i = ingredients.find((v) => v.id === id);
                        if (i)
                          updateIngredient(index, {
                            ingredientId: id,
                            recipeId: undefined,
                            name: i.name,
                            unit: i.unit,
                            packQuantity: String(i.pack_quantity),
                            packPrice: String(i.pack_price_cents / 100),
                          });
                      } else if (kind === 'r') {
                        const r = savedRecipes.find((v) => v.id === id);
                        if (r) {
                          try {
                            const result = validatePricingRecipe(r.recipe);
                            updateIngredient(index, {
                              recipeId: id,
                              ingredientId: undefined,
                              name: r.recipe.title,
                              unit: 'un',
                              packQuantity: r.recipe.yieldCount,
                              packPrice: String(result.totalCost),
                            });
                          } catch {
                            setError(
                              'Esta sub-receita precisa de uma ficha válida antes de ser usada.',
                            );
                          }
                        }
                      } else
                        updateIngredient(index, {
                          ingredientId: undefined,
                          recipeId: undefined,
                        });
                    }}
                  >
                    <option value="">Custo manual</option>
                    <optgroup label="Ingredientes cadastrados">
                      {ingredients.map((i) => (
                        <option key={i.id} value={'i:' + i.id}>
                          {i.name} · {i.brand}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Sub-receitas">
                      {savedRecipes
                        .filter((r) => r.id !== saved?.id)
                        .map((r) => (
                          <option key={r.id} value={'r:' + r.id}>
                            {r.recipe.title || 'Ficha sem título'}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </label>
                {(row.ingredientId || row.recipeId) && (
                  <p className="text-xs text-muted mb-3">
                    Custo vinculado: a fonte é conferida no servidor ao guardar
                    e recalculada quando a fonte muda.
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span>Ingrediente ou despesa</span>
                    <input
                      className={input}
                      maxLength={100}
                      readOnly={!!(row.ingredientId || row.recipeId)}
                      value={row.name}
                      onChange={(event) =>
                        updateIngredient(index, { name: event.target.value })
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span>Unidade</span>
                    <select
                      className={input}
                      disabled={!!(row.ingredientId || row.recipeId)}
                      value={row.unit}
                      onChange={(event) =>
                        updateIngredient(index, { unit: event.target.value })
                      }
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="un">unidade</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span>Quantidade comprada</span>
                    <input
                      className={input}
                      inputMode="decimal"
                      maxLength={16}
                      required
                      readOnly={!!(row.ingredientId || row.recipeId)}
                      value={row.packQuantity}
                      onChange={(event) =>
                        updateIngredient(index, {
                          packQuantity: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span>Preço da compra (€)</span>
                    <input
                      className={input}
                      inputMode="decimal"
                      maxLength={16}
                      required
                      readOnly={!!(row.ingredientId || row.recipeId)}
                      value={row.packPrice}
                      onChange={(event) =>
                        updateIngredient(index, {
                          packPrice: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span>Quantidade utilizada</span>
                    <input
                      className={input}
                      inputMode="decimal"
                      maxLength={16}
                      required
                      value={row.usedQuantity}
                      onChange={(event) =>
                        updateIngredient(index, {
                          usedQuantity: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                {result && (
                  <p className="text-sm">
                    Custo na receita {formatEuros(result.lineCosts[index])}
                  </p>
                )}
                {recipe.ingredients.length > 1 && (
                  <button
                    type="button"
                    className="ui-quiet-action"
                    onClick={() =>
                      update({
                        ingredients: recipe.ingredients.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  >
                    <Trash2 size={14} strokeWidth={1.65} aria-hidden="true" />{' '}
                    Remover custo {index + 1}
                  </button>
                )}
              </fieldset>
            ))}
          </section>
          <div className="admin-actions">
            <button
              type="submit"
              className="ui-primary inline-flex items-center gap-2"
            >
              <Calculator size={15} strokeWidth={1.65} aria-hidden="true" />{' '}
              Calcular receita
            </button>
            <button
              type="button"
              className="ui-quiet-action"
              onClick={saveDraft}
            >
              <Save size={15} strokeWidth={1.65} aria-hidden="true" /> Guardar
              rascunho
            </button>
            <button
              type="button"
              className="ui-secondary"
              onClick={() => void saveRecipe()}
            >
              {busy ? 'A guardar…' : 'Guardar ficha'}
            </button>
            <button
              type="button"
              className="ui-quiet-action sm:ml-auto"
              onClick={clearDraft}
            >
              Limpar rascunho local
            </button>
          </div>
          {error && (
            <div role="alert" className="space-y-1 text-primary">
              <p>{error}</p>
              <button
                type="button"
                className="ui-quiet-action"
                onClick={() => setLoadAttempt((value) => value + 1)}
              >
                Recarregar fichas
              </button>
            </div>
          )}
          {notice && <p role="status">{notice}</p>}
        </fieldset>
      </form>
      {result && (
        <section className="ui-glass-panel" aria-live="polite">
          <h2 className="type-item text-primary">Resultado da simulação</h2>
          <dl className="pricing-results mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ['Custo total', formatEuros(result.totalCost)],
              ['Custo por unidade', formatEuros(result.unitCost)],
              ['Venda total', formatEuros(result.totalSales)],
              ['Lucro total', formatEuros(result.totalProfit)],
              ['Lucro por unidade', formatEuros(result.unitProfit)],
              [
                'Markup',
                result.markup === null ? '—' : percent.format(result.markup),
              ],
              [
                'Margem',
                result.margin === null ? '—' : percent.format(result.margin),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-outline bg-surface/60 px-3 py-2"
              >
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="type-price mt-1 break-words text-primary">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-muted">
            O lucro considera os custos que você adicionou à receita.
          </p>
          {product && (
            <div className="mt-4 space-y-2 border-t border-outline pt-3">
              <p className="text-sm">
                Produto associado <strong>{product.details.name}</strong>
                {recipe.variant ? ' · ' + recipe.variant : ''}
              </p>
              {confirmPrice ? (
                <>
                  <p className="text-sm text-primary">
                    Confirmar {formatEuros(parseDecimal(recipe.salePrice))} como
                    preço de venda desta opção no catálogo?
                  </p>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="ui-primary"
                      disabled={busy}
                      onClick={() => void applyPrice()}
                    >
                      Confirmar preço
                    </button>
                    <button
                      type="button"
                      className="ui-quiet-action"
                      disabled={busy}
                      onClick={() => setConfirmPrice(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="ui-secondary mt-1"
                  disabled={busy}
                  onClick={() => setConfirmPrice(true)}
                >
                  Aplicar preço ao produto
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
