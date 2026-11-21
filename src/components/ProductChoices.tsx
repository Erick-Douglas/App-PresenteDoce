import type { OptionGroup, Selections } from "../features/products/options";
import { selectionLimit } from "../features/products/options";
import { formatEuros } from "../features/checkout/order";
export function ProductChoices({
  groups,
  selections,
  onChange,
}: {
  groups: OptionGroup[];
  selections: Selections;
  onChange: (s: Selections) => void;
}) {
  return (
    <div className="purchase-option-groups">
      {groups.map((g) => {
        const picked = selections[g.id] || [],
          max = selectionLimit(g, selections);
        return (
          <section
            className="purchase-option-group"
            key={g.id}
            aria-label={g.title}
          >
            <header>
              <div>
                <h2 className="type-section">{g.title}</h2>
                <p className="text-xs text-muted">
                  {g.min === max
                    ? "Escolha " + max
                    : g.min
                      ? "Escolha de " + g.min + " a " + max
                      : "Escolha até " + max}
                </p>
              </div>
              <span
                className="module-badge"
                data-status={
                  picked.length >= g.min && picked.length <= max
                    ? "confirmed"
                    : "pending"
                }
              >
                {g.min ? "Obrigatório" : "Opcional"} · {picked.length}/{max}
              </span>
            </header>
            <div className="purchase-option-list">
              {g.options.map((o) => {
                const selected = picked.includes(o.id);
                return (
                  <button
                    type="button"
                    key={o.id}
                    className="ui-choice"
                    aria-pressed={selected}
                    disabled={!selected && max > 1 && picked.length >= max}
                    onClick={() => {
                      const next = {
                        ...selections,
                        [g.id]: selected
                          ? picked.filter((id) => id !== o.id)
                          : max === 1
                            ? [o.id]
                            : [...picked, o.id],
                      };
                      for (const group of groups) {
                        const limit = selectionLimit(group, next);
                        if ((next[group.id]?.length || 0) > limit)
                          next[group.id] = next[group.id].slice(0, limit);
                      }
                      onChange(next);
                    }}
                  >
                    <span
                      className={
                        "choice-indicator " + (max === 1 ? "is-radio" : "")
                      }
                      aria-hidden="true"
                    >
                      {selected ? "✓" : ""}
                    </span>
                    <span className="flex-1 text-left">{o.label}</span>
                    <span className="text-xs tabular-nums text-muted">
                      {o.extraCents
                        ? "+" + formatEuros(o.extraCents / 100)
                        : "Incluído"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
