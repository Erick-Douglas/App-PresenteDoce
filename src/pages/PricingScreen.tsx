import { useState, type FormEvent } from 'react';
import { calculatePricing, parseDecimal } from '../features/pricing/calculation';
import { formatEuros } from '../features/checkout/order';

type Ingredient = { name: string; unit: string; packQuantity: string; packPrice: string; usedQuantity: string };
type Recipe = { title: string; yieldCount: string; salePrice: string; ingredients: Ingredient[] };
type Pricing = ReturnType<typeof calculatePricing>;
const storageKey = 'presente-doce-pricing-draft-v1';
const input = 'ui-field';
const secondary = 'ui-secondary';
const emptyIngredient = (): Ingredient => ({ name: '', unit: 'g', packQuantity: '', packPrice: '', usedQuantity: '' });
const emptyRecipe = (): Recipe => ({ title: '', yieldCount: '', salePrice: '', ingredients: [emptyIngredient()] });
const percent = new Intl.NumberFormat('pt-PT', { style: 'percent', maximumFractionDigits: 2 });

function readDraft(): Recipe {
  try {
    const value: Recipe = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (!value || ![value.title, value.yieldCount, value.salePrice].every(item => typeof item === 'string') ||
      !Array.isArray(value.ingredients) || value.ingredients.length < 1 || value.ingredients.length > 70 ||
      !value.ingredients.every(row => row && [row.name, row.unit, row.packQuantity, row.packPrice, row.usedQuantity].every(item => typeof item === 'string'))) return emptyRecipe();
    return value;
  } catch {
    return emptyRecipe();
  }
}

export default function PricingScreen() {
  const [recipe, setRecipe] = useState(readDraft);
  const [result, setResult] = useState<Pricing | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function update(fields: Partial<Recipe>) {
    setRecipe(current => ({ ...current, ...fields }));
    setResult(null);
    setError('');
    setNotice('');
  }

  function updateIngredient(index: number, fields: Partial<Ingredient>) {
    update({ ingredients: recipe.ingredients.map((row, i) => i === index ? { ...row, ...fields } : row) });
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);
    try {
      const costs = recipe.ingredients.map(row => ({
        packQuantity: parseDecimal(row.packQuantity),
        packPrice: parseDecimal(row.packPrice),
        usedQuantity: parseDecimal(row.usedQuantity),
      }));
      setResult(calculatePricing(costs, parseDecimal(recipe.yieldCount), parseDecimal(recipe.salePrice)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível calcular.');
    }
  }

  function saveDraft() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(recipe));
      setNotice('Rascunho guardado neste navegador.');
    } catch {
      setNotice('Este navegador não permitiu guardar o rascunho.');
    }
  }

  function clearDraft() {
    try { localStorage.removeItem(storageKey); } catch { /* The in-memory form can still be cleared. */ }
    update(emptyRecipe());
    setNotice('Formulário limpo.');
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">Calcule os custos e simule o preço de venda. Os valores ficam neste dispositivo e não alteram o catálogo.</p>
      <form onSubmit={calculate} className="space-y-5">
        <section className="ui-glass-panel space-y-3">
          <h2 className="type-item text-primary">Dados da receita</h2>
          <label className="block space-y-1"><span>Nome da receita (opcional)</span><input className={input} maxLength={100} value={recipe.title} onChange={event => update({ title: event.target.value })} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1"><span>Rendimento da receita</span><input className={input} inputMode="decimal" maxLength={16} required value={recipe.yieldCount} onChange={event => update({ yieldCount: event.target.value })} /></label>
            <label className="block space-y-1"><span>Preço de venda por unidade (€)</span><input className={input} inputMode="decimal" maxLength={16} required value={recipe.salePrice} onChange={event => update({ salePrice: event.target.value })} /></label>
          </div>
        </section>
        <section className="ui-glass-panel space-y-3">
          <h2 className="type-item text-primary">Ingredientes e custos</h2>
          <p className="text-sm text-muted">Use a mesma unidade para a quantidade comprada e a utilizada. Por exemplo, indique 1.000 g para uma embalagem de 1 kg, escrevendo 1000 sem o separador de milhares.</p>
          {recipe.ingredients.map((row, index) => (
            <fieldset key={index} className="space-y-3 rounded-lg border border-outline bg-surface/65 px-3 pb-3">
              <legend className="px-1 text-sm font-bold">Custo {index + 1}</legend>
              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 block space-y-1 sm:col-span-1"><span>Ingrediente ou despesa</span><input className={input} maxLength={100} value={row.name} onChange={event => updateIngredient(index, { name: event.target.value })} /></label>
                <label className="block space-y-1"><span>Unidade</span><select className={input} value={row.unit} onChange={event => updateIngredient(index, { unit: event.target.value })}><option value="g">g</option><option value="ml">ml</option><option value="un">unidade</option></select></label>
                <label className="block space-y-1"><span>Quantidade comprada</span><input className={input} inputMode="decimal" maxLength={16} required value={row.packQuantity} onChange={event => updateIngredient(index, { packQuantity: event.target.value })} /></label>
                <label className="block space-y-1"><span>Preço da compra (€)</span><input className={input} inputMode="decimal" maxLength={16} required value={row.packPrice} onChange={event => updateIngredient(index, { packPrice: event.target.value })} /></label>
                <label className="block space-y-1"><span>Quantidade utilizada</span><input className={input} inputMode="decimal" maxLength={16} required value={row.usedQuantity} onChange={event => updateIngredient(index, { usedQuantity: event.target.value })} /></label>
              </div>
              {result && <p className="text-sm">Custo na receita {formatEuros(result.lineCosts[index])}</p>}
              {recipe.ingredients.length > 1 && <button type="button" className="ui-quiet-action" onClick={() => update({ ingredients: recipe.ingredients.filter((_, i) => i !== index) })}>Remover custo {index + 1}</button>}
            </fieldset>
          ))}
          <button type="button" className={secondary} disabled={recipe.ingredients.length >= 70} onClick={() => update({ ingredients: [...recipe.ingredients, emptyIngredient()] })}>Adicionar custo</button>
        </section>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="ui-primary">Calcular receita</button>
          <button type="button" className={secondary} onClick={saveDraft}>Guardar rascunho</button>
          <button type="button" className="ui-quiet-action" onClick={clearDraft}>Limpar rascunho</button>
        </div>
        {error && <p role="alert" className="text-primary">{error}</p>}
        {notice && <p role="status">{notice}</p>}
      </form>
      {result && (
        <section className="ui-glass-panel" aria-live="polite">
          <h2 className="type-item text-primary">Resultado da simulação</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            {[
              ['Custo total', formatEuros(result.totalCost)],
              ['Custo por unidade', formatEuros(result.unitCost)],
              ['Venda total', formatEuros(result.totalSales)],
              ['Lucro total', formatEuros(result.totalProfit)],
              ['Lucro por unidade', formatEuros(result.unitProfit)],
              ['Markup', result.markup === null ? '—' : percent.format(result.markup)],
              ['Margem', result.margin === null ? '—' : percent.format(result.margin)],
            ].map(([label, value]) => <div key={label}><dt className="text-sm text-muted">{label}</dt><dd className="font-bold">{value}</dd></div>)}
          </dl>
          <p className="mt-3 text-sm text-muted">O lucro considera os custos que você adicionou à receita.</p>
        </section>
      )}
    </div>
  );
}
