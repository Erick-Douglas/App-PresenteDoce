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
      <fieldset disabled={busy} className="space-y-4">
        {fields.map(([key, label, limit]) => <label key={key} className="block space-y-1 text-sm">
          <span>{label}</span>
          {key === 'about_text' ? <textarea name={key} className="ui-field resize-y" defaultValue={current[key]} rows={4} maxLength={limit} required /> :
            <input name={key} className="ui-field" defaultValue={current[key]} maxLength={limit} required />}
        </label>)}
        {error && <p role="alert" className="text-sm text-primary">{error}</p>}
        <button className="ui-primary" type="submit">{busy ? 'A guardar…' : 'Guardar textos'}</button>
      </fieldset>
    </form>
  );
}
