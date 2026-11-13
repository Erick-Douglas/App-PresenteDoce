import { useState, type FormEvent } from 'react';
import { saveStorePresentation } from '../features/products/catalogApi';
import type { StorePresentation } from '../features/products/storePresentation';

export default function StorePresentationEditor({ current, token, onSave }: {
  current: StorePresentation;
  token: string;
  onSave: (value: StorePresentation) => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fields = [
    ['home_title', 'Saudação da vitrine', 80],
    ['home_description', 'Texto abaixo da saudação', 180],
    ['admin_name', 'Nome na saudação administrativa', 60],
    ['about_text', 'Texto de Sobre nós', 1200],
  ] as const;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = { ...current };
    for (const [key, , limit] of fields) {
      value[key] = String(form.get(key) ?? '').trim();
      if (!value[key] || value[key].length > limit) {
        setError('Preencha todos os textos dentro dos limites indicados.');
        return;
      }
    }
    setError('');
    setBusy(true);
    try { onSave(await saveStorePresentation(value, token)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível guardar a apresentação.'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={save}>
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <section className="ui-glass-panel space-y-3">
          <h3 className="type-item text-primary">Página inicial</h3>
          {fields.slice(0, 3).map(([key, label, limit]) => <label key={key} className="block space-y-1 text-sm">
            <span>{label}</span>
            <input name={key} className="ui-field" defaultValue={current[key]} maxLength={limit} required />
          </label>)}
        </section>
        <section className="ui-glass-panel space-y-3">
          <h3 className="type-item text-primary">Sobre nós</h3>
          <label className="block space-y-1 text-sm">
            <span>{fields[3][1]}</span>
            <textarea name="about_text" className="ui-field resize-y" defaultValue={current.about_text} rows={4} maxLength={fields[3][2]} required />
          </label>
        </section>
        {error && <p role="alert" className="text-sm text-primary">{error}</p>}
        <button className="ui-primary" type="submit">{busy ? 'A guardar…' : 'Guardar textos'}</button>
      </fieldset>
    </form>
  );
}
