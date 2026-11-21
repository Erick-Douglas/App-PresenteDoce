import { AppSelect } from "../../components/AppSelect";
import { Package } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { ActionForm, Field, number, text } from "../../components/ModuleUI";
import type { Product } from "../../config/types";
import {
  getCatalogProduct,
  saveProduct,
  type CatalogRow,
} from "../products/catalogApi";
import { stockFor, useStore } from "./StoreProvider";
const Context = createContext<{
  token: string;
  reload: () => Promise<void>;
} | null>(null);
export function LiveEditingProvider({
  value,
  children,
}: {
  value: { token: string; reload: () => Promise<void> } | null;
  children: ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function LiveProductStock({ product }: { product: Product }) {
  const live = useContext(Context),
    { stock } = useStore(),
    [open, setOpen] = useState(false),
    [row, setRow] = useState<CatalogRow | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [option, setOption] = useState(product.variants?.[0]?.label || "");
  if (!live) return null;
  async function load() {
    setOpen(true);
    setError("");
    try {
      setRow(await getCatalogProduct(product.id, live!.token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar.");
    }
  }
  async function mode(value: "ready" | "preorder") {
    if (!row || busy) return;
    setBusy(true);
    setError("");
    try {
      const current = row.details.saleModes || ["preorder"];
      const modes = current.includes(value)
        ? current.filter((m) => m !== value)
        : [...current, value];
      if (!modes.length) throw Error("Mantenha uma modalidade de venda.");
      setRow(
        await saveProduct(
          {
            id: row.id,
            published: row.published,
            details: { ...row.details, saleModes: modes },
          },
          row.version,
          live!.token,
        ),
      );
      await live!.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="live-product-control">
      <button
        className="ui-edit-action"
        type="button"
        aria-label={"Disponibilidade de " + product.name}
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : void load())}
      >
        <Package size={14} />
        Stock
      </button>
      {open && (
        <div className="admin-form live-stock-form pb-3 pt-2 text-xs">
          <div className="flex gap-2 flex-wrap">
            {(["ready", "preorder"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className="category-pill text-xs"
                disabled={!row || busy}
                aria-pressed={(row?.details.saleModes || ["preorder"]).includes(
                  m,
                )}
                onClick={() => void mode(m)}
              >
                {m === "ready" ? "Pronta entrega" : "Encomenda"}
              </button>
            ))}
          </div>
          {product.variants?.length ? (
            <Field label="Opção">
              <AppSelect
                className="ui-field"
                value={option}
                onChange={(e) => setOption(e.target.value)}
              >
                {product.variants.map((v) => (
                  <option key={v.label}>{v.label}</option>
                ))}
              </AppSelect>
            </Field>
          ) : null}
          <p>{stockFor(stock, product.id, option)} unidades disponíveis</p>
          <ActionForm
            action="stock.adjust"
            token={live.token}
            submit="Ajustar"
            onSaved={live.reload}
            build={(f, key) => ({
              product_id: product.id,
              option,
              delta:
                number(f, "quantity") *
                (text(f, "direction") === "remove" ? -1 : 1),
              reason: text(f, "reason"),
              idempotency_key: key,
            })}
          >
            <Field label="Movimento">
              <AppSelect name="direction" className="ui-field">
                <option value="add">Adicionar</option>
                <option value="remove">Retirar</option>
              </AppSelect>
            </Field>
            <Field
              label="Quantidade"
              name="quantity"
              type="number"
              min={1}
              max={100000}
              step={1}
              required
            />
            <Field label="Motivo" name="reason" required maxLength={200} />
          </ActionForm>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
