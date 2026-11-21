import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { OptionGroup } from "../features/products/options";
import {
  parseCatalogPrice,
  formatCatalogPrice,
} from "../features/products/catalogFields";
import { currencySymbol } from "../features/checkout/order";

function ExtraPrice({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const [text, setText] = useState(() => formatCatalogPrice(value / 100));
  return (
    <label className="module-field option-extra">
      <span>Acréscimo ({currencySymbol})</span>
      <input
        aria-label={label}
        className="ui-field"
        inputMode="decimal"
        required
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseCatalogPrice(e.target.value);
          e.target.setCustomValidity(
            n === null
              ? "Indique um acréscimo válido. Use 0 para uma opção incluída."
              : "",
          );
          if (n !== null) onChange(Math.round(n * 100));
        }}
        onBlur={() => {
          const n = parseCatalogPrice(text);
          if (n !== null) setText(formatCatalogPrice(n));
        }}
      />
    </label>
  );
}
export function OptionGroupsEditor({
  value,
  onChange: onGroupsChange,
  prefix = "categoria",
}: {
  value: OptionGroup[];
  onChange: (groups: OptionGroup[]) => void;
  prefix?: string;
}) {
  const onChange = (next: OptionGroup[]) => {
    const ids = new Set(next.flatMap((g) => g.options.map((o) => o.id)));
    onGroupsChange(
      next.map((g) => ({
        ...g,
        ...(g.maxByOption
          ? {
              maxByOption: Object.fromEntries(
                Object.entries(g.maxByOption)
                  .filter(([id]) => ids.has(id))
                  .map(([id, n]) => [id, Math.max(g.min, Math.min(g.max, n))]),
              ),
            }
          : {}),
      })),
    );
  };
  const update = (id: string, patch: Partial<OptionGroup>) =>
    onChange(value.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const move = (i: number, d: number) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <section
      aria-label={
        "Grupos de opções " +
        (prefix === "produto" ? "do produto" : "da categoria")
      }
      className="option-groups-editor"
    >
      <div className="module-section-heading">
        <div>
          <h2 className="type-item">Grupos e opções de compra</h2>
          <p className="text-xs text-muted mt-1">
            Ex.: Massa, Recheio ou Acabamento. As opções podem estar incluídas
            ou acrescentar valor.
          </p>
        </div>
        <button
          type="button"
          className="ui-secondary"
          disabled={value.length >= 10}
          onClick={() =>
            onChange([
              ...value,
              {
                id: crypto.randomUUID(),
                title: "",
                min: 1,
                max: 1,
                options: [],
              },
            ])
          }
        >
          <Plus size={15} />
          Adicionar grupo
        </button>
      </div>
      {!value.length && (
        <div className="module-empty">
          <p className="type-item">Ainda não há grupos de escolha</p>
          <p className="text-sm text-muted">
            Adicione um grupo, dê-lhe um título e crie as opções que o cliente
            pode escolher.
          </p>
        </div>
      )}
      {value.map((g, i) => (
        <fieldset key={g.id} className="option-group-editor">
          <div className="option-group-heading">
            <span className="step-number">{i + 1}</span>
            <label className="module-field">
              <span>Título do grupo</span>
              <input
                className="ui-field"
                aria-label={"Título do grupo " + (i + 1)}
                required
                maxLength={80}
                value={g.title}
                placeholder="Ex.: Escolha a massa"
                onChange={(e) => update(g.id, { title: e.target.value })}
              />
            </label>
            <div className="flex">
              <button
                type="button"
                className="ui-icon-action"
                aria-label={"Subir grupo " + (i + 1)}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ChevronUp size={17} />
              </button>
              <button
                type="button"
                className="ui-icon-action"
                aria-label={"Descer grupo " + (i + 1)}
                disabled={i === value.length - 1}
                onClick={() => move(i, 1)}
              >
                <ChevronDown size={17} />
              </button>
              <button
                type="button"
                className="ui-icon-action"
                data-destructive="true"
                aria-label={"Excluir grupo " + (i + 1)}
                onClick={() => onChange(value.filter((x) => x.id !== g.id))}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
          <div className="option-group-rules">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={g.min > 0}
                onChange={(e) =>
                  update(g.id, { min: e.target.checked ? 1 : 0 })
                }
              />
              Escolha obrigatória
            </label>
            <label className="module-field">
              <span>Mínimo de escolhas</span>
              <input
                className="ui-field"
                type="number"
                min={0}
                max={30}
                value={g.min}
                onChange={(e) => update(g.id, { min: Number(e.target.value) })}
              />
            </label>
            <label className="module-field">
              <span>Máximo de escolhas</span>
              <input
                className="ui-field"
                type="number"
                min={1}
                max={30}
                value={g.max}
                onChange={(e) =>
                  update(g.id, {
                    max: Number(e.target.value),
                    maxByOption: undefined,
                  })
                }
              />
            </label>
          </div>
          <div className="option-editor-list">
            {g.options.map((o, j) => (
              <div className="option-editor-row" key={o.id}>
                <label className="module-field">
                  <span>Opção {j + 1}</span>
                  <input
                    className="ui-field"
                    aria-label={"Opção " + (i + 1) + "." + (j + 1)}
                    value={o.label}
                    required
                    maxLength={80}
                    placeholder="Ex.: Chocolate"
                    onChange={(e) =>
                      update(g.id, {
                        options: g.options.map((x) =>
                          x.id === o.id ? { ...x, label: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </label>
                <ExtraPrice
                  value={o.extraCents}
                  label={"Acréscimo " + (i + 1) + "." + (j + 1)}
                  onChange={(n) =>
                    update(g.id, {
                      options: g.options.map((x) =>
                        x.id === o.id ? { ...x, extraCents: n } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="ui-icon-action"
                  data-destructive="true"
                  aria-label={"Excluir opção " + (i + 1) + "." + (j + 1)}
                  onClick={() =>
                    update(g.id, {
                      options: g.options.filter((x) => x.id !== o.id),
                      max: Math.max(1, Math.min(g.max, g.options.length - 1)),
                      min: Math.min(g.min, Math.max(1, g.options.length - 1)),
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <span className="text-xs text-muted mr-auto">
              0,00 = incluído. Os acréscimos são cobrados por unidade.
            </span>
            <button
              type="button"
              className="ui-secondary"
              disabled={g.options.length >= 30}
              onClick={() =>
                update(g.id, {
                  options: [
                    ...g.options,
                    { id: crypto.randomUUID(), label: "", extraCents: 0 },
                  ],
                })
              }
            >
              <Plus size={14} />
              Adicionar opção
            </button>
          </div>
        </fieldset>
      ))}
      <p className="text-xs text-muted flex items-center gap-2">
        <Check size={14} />
        As alterações ficam gravadas ao guardar a {prefix}.
      </p>
    </section>
  );
}
