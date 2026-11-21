import { OptionGroupsEditor } from "../components/OptionGroupsEditor";
import { validateGroups } from "../features/products/options";
import { AppSelect } from "../components/AppSelect";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  deleteCatalogCategory,
  saveCatalogCategory,
  saveProduct,
  type AdminCategoryRow,
  type CatalogRow,
} from "../features/products/catalogApi";
import { moveCatalogItem } from "../features/products/catalogFields";

export const catalogPrimary = "ui-primary";
export const catalogSecondary = "ui-secondary text-primary";
export const catalogField = "ui-field";
const actionIcon = "ui-icon-action";
const panel = "ui-glass-panel space-y-3";
const normalize = (text: string) =>
  text.normalize("NFC").trim().replace(/\s+/g, " ");

export function categoryNameFrom(value: string) {
  const name = normalize(value);
  if (!name || name.length > 60 || name.toLowerCase() === "all") {
    throw new Error(
      "Indique um nome de categoria válido com até 60 caracteres.",
    );
  }
  return name;
}

export type CategoryChange = {
  previous: AdminCategoryRow;
  saved?: AdminCategoryRow;
  destination?: AdminCategoryRow;
};

function SortList({
  items,
  onMove,
  empty,
}: {
  items: { id: string; name: string }[];
  onMove: (index: number, offset: -1 | 1) => void;
  empty: string;
}) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-muted-fill">
      {items.map((item, index) => (
        <li key={item.id} className="flex min-h-12 items-center gap-1">
          <span className="min-w-0 flex-1 break-words text-sm">
            {item.name}
          </span>
          <button
            type="button"
            className={actionIcon}
            aria-label={"Subir " + item.name}
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
          >
            <ArrowUp size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={actionIcon}
            aria-label={"Descer " + item.name}
            disabled={index === items.length - 1}
            onClick={() => onMove(index, 1)}
          >
            <ArrowDown size={17} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function CategoryEditor({
  category,
  categories,
  rows,
  token,
  onBack,
  onChanged,
  onNewProduct,
}: {
  category: AdminCategoryRow;
  categories: AdminCategoryRow[];
  rows: CatalogRow[];
  token: string;
  onBack: () => void;
  onChanged: (change: CategoryChange) => void;
  onNewProduct?: () => void;
}) {
  const [associate, setAssociate] = useState("");
  const [name, setName] = useState(category.name);
  const topics = category.topics;
  const [optionGroups, setOptionGroups] = useState(
    category.option_groups ?? [],
  );
  const [section, setSection] = useState<"details" | "products" | "categories">(
    "details",
  );
  const [originalProducts] = useState(() =>
    rows
      .filter((row) => row.details.category === category.name)
      .map((row) => ({ id: row.id, name: row.details.name })),
  );
  const [originalCategories] = useState(() =>
    categories.map((item) => ({ id: item.id, name: item.name })),
  );
  const [productOrder, setProductOrder] = useState(originalProducts);
  const [categoryOrder, setCategoryOrder] = useState(originalCategories);
  const [deleting, setDeleting] = useState(false);
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      validateGroups(optionGroups);
      const updated = {
        ...category,
        name: categoryNameFrom(name),
        topics,
        option_groups: optionGroups,
      };
      const changes = (before: { id: string }[], after: { id: string }[]) =>
        before.some((item, index) => item.id !== after[index]?.id)
          ? {
              current: before.map((item) => item.id),
              next: after.map((item) => item.id),
            }
          : undefined;
      const savedCategory = await saveCatalogCategory(
        updated,
        token,
        changes(originalProducts, productOrder),
        changes(originalCategories, categoryOrder),
      );
      onChanged({
        previous: category,
        saved: savedCategory,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível guardar a categoria.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    const target = categories.find((item) => item.id === destination);
    if (originalProducts.length && !target) {
      setError("Escolha uma categoria de destino para os produtos.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await deleteCatalogCategory(category, target?.id ?? null, token);
      onChanged({ previous: category, destination: target });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível excluir a categoria.",
      );
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    ["details", "Dados e tópicos"],
    ["products", "Ordem dos produtos"],
    ["categories", "Ordem das categorias"],
  ] as const;
  return (
    <form onSubmit={save} className="space-y-4">
      <fieldset disabled={busy} className="admin-form">
        <div
          role="group"
          aria-label="Opções da categoria"
          className="category-rail category-editor-tabs"
        >
          {tabs.map(([id, title]) => (
            <button
              key={id}
              type="button"
              aria-pressed={section === id}
              onClick={() => setSection(id)}
              className="category-pill"
            >
              {title}
            </button>
          ))}
        </div>
        {section === "details" && (
          <>
            <div className={panel}>
              <label className="block max-w-xl space-y-2 text-sm">
                <span className="type-item text-primary">
                  Nome da categoria
                </span>
                <input
                  className={catalogField}
                  required
                  maxLength={60}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
            </div>
            <div className={panel}>
              <OptionGroupsEditor
                value={optionGroups}
                onChange={setOptionGroups}
              />
            </div>
          </>
        )}
        {section === "products" && (
          <section className={panel} aria-label="Ordem dos produtos">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted flex-1">
                A vitrine mostra os produtos publicados nesta ordem.
              </p>
              {onNewProduct && (
                <button
                  type="button"
                  className="ui-secondary"
                  onClick={onNewProduct}
                >
                  <Plus size={15} />
                  Novo produto nesta categoria
                </button>
              )}
            </div>
            <div className="module-inset space-y-3">
              <label className="module-field">
                <span>Mover produto existente para esta categoria</span>
                <AppSelect
                  className="ui-field"
                  value={associate}
                  onChange={(e) => setAssociate(e.target.value)}
                >
                  <option value="">Escolher produto</option>
                  {rows
                    .filter((r) => r.details.category !== category.name)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.details.name} · {r.details.category}
                      </option>
                    ))}
                </AppSelect>
              </label>
              <p className="text-xs text-muted">
                O produto sai da categoria anterior. Os tópicos são associados
                pelo mesmo nome; preço e opções são preservados.
              </p>
              <button
                type="button"
                className="ui-secondary"
                disabled={!associate || busy}
                onClick={async () => {
                  const row = rows.find((r) => r.id === associate);
                  if (!row) return;
                  setBusy(true);
                  setError("");
                  try {
                    const picked = category.topics.filter((t) =>
                      row.details.tags?.some(
                        (tag) =>
                          tag.trim().toLocaleLowerCase() ===
                          t.name.trim().toLocaleLowerCase(),
                      ),
                    );
                    await saveProduct(
                      {
                        id: row.id,
                        published: row.published,
                        details: {
                          ...row.details,
                          category: category.name,
                          topicIds: picked.map((t) => t.id),
                          tags: picked.map((t) => t.name),
                        },
                      },
                      row.version,
                      token,
                    );
                    onChanged({ previous: category, saved: category });
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Não foi possível mover o produto.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Confirmar transferência
              </button>
            </div>
            <SortList
              items={productOrder}
              empty="Esta categoria ainda não tem produtos."
              onMove={(index, offset) =>
                setProductOrder((current) =>
                  moveCatalogItem(current, index, offset),
                )
              }
            />
          </section>
        )}
        {section === "categories" && (
          <section className={panel} aria-label="Ordem das categorias">
            <p className="text-sm text-muted">
              Esta ordem aparece nos atalhos e no catálogo da loja.
            </p>
            <SortList
              items={categoryOrder.map((item) =>
                item.id === category.id
                  ? { ...item, name: name || category.name }
                  : item,
              )}
              empty="Ainda não há categorias."
              onMove={(index, offset) =>
                setCategoryOrder((current) =>
                  moveCatalogItem(current, index, offset),
                )
              }
            />
          </section>
        )}
        {deleting && (
          <section
            className={panel}
            aria-label="Confirmar exclusão de categoria"
          >
            <h3 className="type-section text-primary">
              Excluir {category.name}?
            </h3>
            {originalProducts.length > 0 && (
              <>
                <label className="block max-w-md space-y-1 text-sm">
                  <span>
                    Mover {originalProducts.length}{" "}
                    {originalProducts.length === 1 ? "produto" : "produtos"}{" "}
                    para
                  </span>
                  <AppSelect
                    className={catalogField}
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                  >
                    <option value="">Selecione a categoria de destino</option>
                    {categories
                      .filter((item) => item.id !== category.id)
                      .map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </AppSelect>
                </label>
                <p className="text-sm text-muted">
                  Os produtos mantêm preços e opções de encomenda. Os tópicos
                  passam para a categoria de destino quando existe um tópico com
                  o mesmo nome.
                </p>
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={catalogSecondary}
                onClick={() => {
                  setDeleting(false);
                  setError("");
                }}
              >
                Cancelar exclusão
              </button>
              <button type="button" className="ui-danger" onClick={remove}>
                Confirmar exclusão
              </button>
            </div>
          </section>
        )}
        {error && (
          <p role="alert" className="text-sm text-primary">
            {error}
          </p>
        )}
        <div className="admin-actions">
          <button type="submit" className={catalogPrimary}>
            {busy ? "A guardar…" : "Guardar alterações"}
          </button>
          <button type="button" className="ui-secondary" onClick={onBack}>
            Cancelar edição
          </button>
          {!deleting && (
            <button
              type="button"
              className="ui-danger"
              onClick={() => setDeleting(true)}
            >
              Excluir categoria
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
