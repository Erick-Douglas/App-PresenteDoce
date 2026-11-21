import { useAdminHeading } from "../components/AdminPage";
import { OptionGroupsEditor } from "../components/OptionGroupsEditor";
import {
  legacyGroups,
  validateGroups,
  type OptionGroup,
} from "../features/products/options";
import { useStore } from "../features/platform/StoreProvider";
import { AppSelect } from "../components/AppSelect";
import { Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { THEMED_CAKE_SIZES } from "../config/constants";
import type { Product, ProductOrderMode } from "../config/types";
import { currencySymbol, formatEuros } from "../features/checkout/order";
import {
  createCatalogCategory,
  deleteProduct,
  getCatalogProduct,
  imageUrl,
  saveProduct,
  saveCatalogCategory,
  uploadProductImage,
  type AdminCategoryRow,
  type CatalogRow,
} from "../features/products/catalogApi";
import {
  formatCatalogPrice,
  parseCatalogPrice,
  productOrderMode,
} from "../features/products/catalogFields";
import { validateProductImage } from "../features/products/productImage";
import {
  CategoryEditor,
  categoryNameFrom,
  type CategoryChange,
} from "./CategoryEditor";

const primary = "ui-primary";
const secondary = "ui-secondary";
const field = "ui-field";
const chip =
  "rounded-full border border-primary/15 px-3 py-1.5 text-sm text-primary";
type Variant = { label: string; price: string; maxFlavors: string };
const optionFields = new Map<
  ProductOrderMode,
  { title: string; label: string; example: string; add: string }
>([
  [
    "cake",
    {
      title: "Tamanhos do bolo",
      label: "Tamanho",
      example: "Pequeno (1,5 kg)",
      add: "Adicionar tamanho",
    },
  ],
  [
    "brigadeiros",
    {
      title: "Tamanhos da caixa",
      label: "Caixa",
      example: "Caixa com 12",
      add: "Adicionar caixa",
    },
  ],
  [
    "salgados",
    {
      title: "Quantidades disponíveis",
      label: "Quantidade",
      example: "25 unidades",
      add: "Adicionar quantidade",
    },
  ],
]);
const parseList = (value: string) => [
  ...new Set(
    value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
  ),
];
const topicKey = (value: string) => value.trim().toLocaleLowerCase("pt-PT");

function productContent(details: CatalogRow["details"]) {
  return JSON.stringify(
    Object.entries(details)
      .filter(([key]) => !["category", "topicIds", "tags"].includes(key))
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

function priceFrom(value: string) {
  const price = parseCatalogPrice(value);
  if (price === null)
    throw new Error("Indique um preço válido com até duas casas decimais.");
  return price;
}

function PriceInput({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span>{label}</span>
      <span className="relative block">
        <input
          aria-label={label}
          className={field + " pr-9 tabular-nums"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            const price = parseCatalogPrice(value);
            if (price !== null) onChange(formatCatalogPrice(price));
          }}
          inputMode="decimal"
          maxLength={8}
          placeholder="0,00"
          required={required}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
          {currencySymbol}
        </span>
      </span>
    </label>
  );
}

type CategoryFields = {
  categories: AdminCategoryRow[];
  rows: CatalogRow[];
  onCategoryCreated: (category: AdminCategoryRow) => void;
  onCategoryChanged: (change: CategoryChange) => void;
};

function ProductForm({
  row,
  token,
  onSaved,
  onDeleted,
  onCancel,
  categories,
  rows,
  onCategoryCreated,
  onCategoryChanged,
}: CategoryFields & {
  row: CatalogRow | null;
  token: string;
  onSaved: (row: CatalogRow) => void;
  onDeleted: (id: string) => void;
  onCancel: () => void;
}) {
  const { settings } = useStore();
  const data = row?.details;
  const [groupMode, setGroupMode] = useState<"category" | "product">(
    data?.optionGroupsMode ??
      (data && productOrderMode(data) !== "simple" ? "product" : "category"),
  );
  const [customGroups, setCustomGroups] = useState<OptionGroup[]>(
    () =>
      data?.optionGroups ??
      (data ? legacyGroups({ ...data, id: row!.id }, settings) : []),
  );
  const initialCategory = data
    ? categories.find((item) => item.name === data.category)
    : (categories.find(
        (c) =>
          c.id === new URLSearchParams(window.location.search).get("categoria"),
      ) ?? categories[0]);
  const [productId] = useState(() => row?.id ?? crypto.randomUUID());
  const [baseline, setBaseline] = useState(row);
  const version = baseline?.version ?? null;
  const [categoryId, setCategoryId] = useState(initialCategory?.id ?? "");
  const [managingCategory, setManagingCategory] = useState(false);
  const leaveCategory = useCallback(() => setManagingCategory(false), []);
  useAdminHeading(
    managingCategory ? "Editar categoria" : undefined,
    leaveCategory,
  );
  const [categoryDraft, setCategoryDraft] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [saleModes, setSaleModes] = useState<("ready" | "preorder")[]>(
    data?.saleModes || ["preorder"],
  );
  const [price, setPrice] = useState(
    data ? formatCatalogPrice(data.price) : "",
  );
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string[]>>(
    () =>
      initialCategory
        ? {
            [initialCategory.id]:
              data?.topicIds ??
              initialCategory.topics
                .filter((topic) =>
                  data?.tags?.some(
                    (tag) => topicKey(tag) === topicKey(topic.name),
                  ),
                )
                .map((topic) => topic.id),
          }
        : {},
  );
  const [variantDrafts, setVariantDrafts] = useState<Record<string, Variant[]>>(
    () => {
      if (!data) return {};
      const savedOptions = data.variants ?? [];
      const options: NonNullable<Product["variants"]> =
        !savedOptions.length &&
        productOrderMode(data) === "cake" &&
        row?.published
          ? THEMED_CAKE_SIZES
          : savedOptions;
      return {
        [productOrderMode(data)]: options.map((option) => ({
          label: option.label,
          price: formatCatalogPrice(option.price),
          maxFlavors:
            option.maxFlavors == null ? "" : String(option.maxFlavors),
        })),
      };
    },
  );
  const [flavorDrafts, setFlavorDrafts] = useState(
    () =>
      new Map(
        data ? [[productOrderMode(data), data.flavors?.join("\n") ?? ""]] : [],
      ),
  );
  const [image, setImage] = useState(data?.image ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saveStage, setSaveStage] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selectedCategory = categories.find((item) => item.id === categoryId);
  const activeGroups =
    groupMode === "category"
      ? (selectedCategory?.option_groups ?? [])
      : customGroups;
  const mode = data
    ? productOrderMode(data)
    : (selectedCategory?.order_mode ?? "simple");
  const optionFieldsForCategory = optionFields.get(mode);
  const isThemedCake = mode === "cake";
  const variants = optionFieldsForCategory ? (variantDrafts[mode] ?? []) : [];
  const optionPrices = variants.map((option) =>
    parseCatalogPrice(option.price),
  );
  const lowestPrice =
    optionPrices.length && optionPrices.every((value) => value !== null)
      ? Math.min(...optionPrices)
      : null;
  const chosenTopics =
    selectedCategory?.topics.filter((topic) =>
      topicDrafts[categoryId]?.includes(topic.id),
    ) ?? [];

  useEffect(() => {
    if (!selectedImage) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(selectedImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  useEffect(() => {
    if (error)
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  async function addCategory() {
    if (busy || creatingCategory) return;
    setCategoryError("");
    try {
      const name = categoryNameFrom(categoryDraft ?? "");
      setCreatingCategory(true);
      const created = await createCatalogCategory(name, token);
      onCategoryCreated(created);
      setCategoryId(created.id);
      setCategoryDraft(null);
    } catch (cause) {
      setCategoryError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar a categoria.",
      );
    } finally {
      setCreatingCategory(false);
    }
  }

  async function applyManagedCategory(change: CategoryChange) {
    onCategoryChanged(change);
    if (change.saved && change.previous.id === categoryId) {
      const added = change.saved.topics.filter(
        (topic) => !change.previous.topics.some((old) => old.id === topic.id),
      );
      setTopicDrafts((current) => ({
        ...current,
        [categoryId]: [
          ...new Set([
            ...(current[categoryId] ?? []).filter((id) =>
              change.saved!.topics.some((topic) => topic.id === id),
            ),
            ...added.map((topic) => topic.id),
          ]),
        ],
      }));
    }
    setManagingCategory(false);
    if (!change.saved && change.previous.id === categoryId) {
      const target =
        change.destination ?? categories.find((item) => item.id !== categoryId);
      if (target) {
        setTopicDrafts((current) => ({
          ...current,
          [target.id]: target.topics
            .filter((topic) =>
              chosenTopics.some(
                (chosen) => topicKey(chosen.name) === topicKey(topic.name),
              ),
            )
            .map((topic) => topic.id),
        }));
      }
      setCategoryId(target?.id ?? "");
    }
    if (!baseline) return;
    setBusy(true);
    return getCatalogProduct(baseline.id, token)
      .then((updated) => {
        const previous = baseline.details;
        const affected = change.previous.name === previous.category;
        const nextCategory = change.saved ?? change.destination;
        const expectedCategory = affected
          ? nextCategory?.name
          : previous.category;
        let expectedTopics = previous.topicIds ?? [];
        if (affected && nextCategory) {
          expectedTopics = change.saved
            ? expectedTopics.filter((id) =>
                nextCategory.topics.some((topic) => topic.id === id),
              )
            : nextCategory.topics
                .filter((topic) =>
                  previous.tags?.some(
                    (tag) => topicKey(tag) === topicKey(topic.name),
                  ),
                )
                .map((topic) => topic.id);
        }
        if (
          updated.published === baseline.published &&
          updated.details.category === expectedCategory &&
          JSON.stringify([...(updated.details.topicIds ?? [])].sort()) ===
            JSON.stringify([...expectedTopics].sort()) &&
          productContent(updated.details) ===
            productContent(
              previous.optionGroupsMode === "category" && change.saved
                ? {
                    ...previous,
                    optionGroups: change.saved.option_groups ?? [],
                  }
                : previous,
            )
        ) {
          setBaseline(updated);
        }
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  }

  async function remove() {
    if (!row || busy) return;
    setBusy(true);
    setError("");
    try {
      await deleteProduct({ ...row, version: version ?? row.version }, token);
      onDeleted(row.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível excluir o produto.",
      );
    } finally {
      setBusy(false);
    }
  }

  function setVariants(next: Variant[]) {
    setVariantDrafts((current) => ({ ...current, [mode]: next }));
  }

  function updateVariant(index: number, value: Partial<Variant>) {
    setVariants(
      variants.map((option, i) =>
        i === index ? { ...option, ...value } : option,
      ),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || creatingCategory) return;
    if (categoryDraft !== null) {
      setCategoryError(
        "Crie a categoria ou cancele antes de guardar o produto.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const name = text("name");
    const description = text("description");
    const published = form.get("published") === "on";
    try {
      if (!saleModes.length)
        throw Error("Escolha ao menos uma forma de disponibilidade.");
      if (!name || !description)
        throw new Error("Preencha o nome e a descrição.");
      if (!selectedCategory) throw new Error("Escolha uma categoria.");
      validateGroups(activeGroups);
      const productPrice = priceFrom(price);
      if (published && productPrice <= 0)
        throw Error("O preço base deve ser superior a zero.");
      const sizeGroup = activeGroups.find((g) => g.legacyKey === "variant");
      const options = sizeGroup?.options.map((o) => ({
        label: o.label,
        price: Math.round(productPrice * 100 + o.extraCents) / 100,
        ...(data?.variants?.find((v) => v.label === o.label)?.maxFlavors
          ? {
              maxFlavors: data.variants.find((v) => v.label === o.label)!
                .maxFlavors,
            }
          : {}),
      }));
      const flavorsGroup = activeGroups.find((g) => g.legacyKey === "flavors");
      const flavors = flavorsGroup?.options.map((o) => o.label);
      const configurable = activeGroups.length > 0;
      const file = selectedImage;
      let nextImage = image;
      if (file instanceof File && file.size) {
        setSaveStage("A enviar fotografia…");
        nextImage = await uploadProductImage(file, token);
        setSelectedImage(null);
        setImage(nextImage);
        const input = formElement.elements.namedItem("image");
        if (input instanceof HTMLInputElement) input.value = "";
      }
      if (published && !nextImage)
        throw new Error("Adicione uma imagem antes de publicar.");
      const details: Omit<Product, "id"> = {
        ...data,
        name,
        description,
        category: selectedCategory.name,
        price: productPrice,
        image: nextImage,
        saleModes,
        capacityUnits:
          settings.preorder_only !== false
            ? (data?.capacityUnits ?? 1)
            : Number(form.get("capacityUnits")),
        optionGroups: activeGroups,
        optionGroupsMode: groupMode,
        orderMode: mode,
        topicIds: chosenTopics.map((topic) => topic.id),
        tags: chosenTopics.map((topic) => topic.name),
        configuravel: configurable,
        simples: !configurable,
        variants: options?.length ? options : undefined,
        flavors: flavors?.length ? flavors : undefined,
      };
      setSaveStage("A guardar produto…");
      const saved = await saveProduct(
        { id: productId, details, published },
        version,
        token,
      );
      onSaved(saved);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível guardar.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} hidden={managingCategory}>
        <fieldset disabled={busy || creatingCategory} className="admin-form">
          {error && (
            <p
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm text-primary"
            >
              {error}
            </p>
          )}
          <section
            hidden={settings.preorder_only !== false}
            className="ui-glass-panel space-y-3"
            aria-label="Disponibilidade do produto"
          >
            <h2 className="type-item text-primary">
              Disponibilidade e produção
            </h2>
            <div className="flex flex-wrap gap-4">
              {(["preorder", "ready"] as const).map((m) => (
                <label key={m} className="flex gap-2 items-center text-sm">
                  <input
                    type="checkbox"
                    checked={saleModes.includes(m)}
                    onChange={(e) =>
                      setSaleModes((current) =>
                        e.target.checked
                          ? [...current, m]
                          : current.filter((x) => x !== m),
                      )
                    }
                  />
                  {m === "ready" ? "Pronta entrega" : "Por encomenda"}
                </label>
              ))}
            </div>
            <label className="block space-y-1">
              <span>Unidades de capacidade por produto encomendado</span>
              <input
                type="number"
                name="capacityUnits"
                className="ui-field"
                min={0}
                max={100}
                required
                defaultValue={data?.capacityUnits ?? 1}
              />
            </label>
            <p className="text-xs text-muted">
              Ex.: um bolo ocupa 1 unidade da capacidade diária. Defina 0 para
              itens que não usam essa capacidade. Ajuste o saldo de pronta
              entrega no módulo próprio.
            </p>
          </section>
          <section
            aria-label="Dados do produto"
            className="ui-glass-panel space-y-3"
          >
            <h2 className="type-item text-primary">Dados do produto</h2>
            <label className="block space-y-1">
              <span>Nome</span>
              <input
                name="name"
                required
                maxLength={100}
                defaultValue={data?.name}
                className={field}
              />
            </label>
            <label className="block space-y-1">
              <span>Descrição</span>
              <textarea
                aria-label="Descrição"
                name="description"
                rows={2}
                required
                maxLength={3000}
                defaultValue={data?.description}
                className={field + " resize-y"}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-end gap-2">
                <label className="min-w-0 flex-1 space-y-1">
                  <span>Categoria</span>
                  <AppSelect
                    aria-label="Categoria"
                    className={field}
                    value={selectedCategory?.id ?? ""}
                    onChange={(event) => {
                      if (event.target.value === "@manage")
                        setManagingCategory(true);
                      else setCategoryId(event.target.value);
                    }}
                    required
                  >
                    <option value="" disabled>
                      Selecione a categoria
                    </option>
                    {categories.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                    {selectedCategory && (
                      <option value="@manage">Gerir categorias…</option>
                    )}
                  </AppSelect>
                </label>
                <button
                  type="button"
                  aria-label="Criar categoria"
                  aria-expanded={categoryDraft !== null}
                  className="ui-icon-action"
                  onClick={() => {
                    setCategoryDraft(categoryDraft === null ? "" : null);
                    setCategoryError("");
                  }}
                >
                  <Plus size={16} strokeWidth={1.65} aria-hidden="true" />
                </button>
              </div>
              <PriceInput
                label="Preço base"
                value={price}
                onChange={setPrice}
                required
              />
            </div>
            {categoryDraft !== null && (
              <div className="space-y-2 rounded-lg border border-outline bg-surface/70 p-3">
                <div className="flex flex-wrap items-end gap-2">
                  <label className="min-w-44 flex-1 space-y-1">
                    <span>Nome da categoria</span>
                    <input
                      value={categoryDraft}
                      maxLength={60}
                      className={field}
                      onChange={(event) => setCategoryDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          void addCategory();
                        }
                      }}
                    />
                  </label>
                  <button
                    className={primary}
                    type="button"
                    onClick={addCategory}
                  >
                    {creatingCategory ? "A criar…" : "Confirmar nome"}
                  </button>
                  <button
                    className={secondary}
                    type="button"
                    onClick={() => {
                      setCategoryDraft(null);
                      setCategoryError("");
                    }}
                  >
                    Cancelar
                  </button>
                </div>
                {categoryError && (
                  <p role="alert" className="text-sm font-bold text-primary">
                    {categoryError}
                  </p>
                )}
              </div>
            )}
          </section>
          {selectedCategory && (
            <section className="ui-glass-panel space-y-4">
              <h2 className="type-item">Tópicos e opções do produto</h2>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={groupMode === "category"}
                  onChange={(e) => {
                    if (e.target.checked) setGroupMode("category");
                    else {
                      if (!customGroups.length)
                        setCustomGroups(
                          structuredClone(selectedCategory.option_groups ?? []),
                        );
                      setGroupMode("product");
                    }
                  }}
                />
                Usar os grupos da categoria
              </label>
              {groupMode === "category" ? (
                <>
                  <p className="text-xs text-muted">
                    Alterações guardadas na categoria atualizam estes grupos no
                    produto. Para personalizar só este produto, desmarque a
                    opção acima.
                  </p>
                  <div className="space-y-2">
                    {activeGroups.length ? (
                      activeGroups.map((g) => (
                        <div className="module-inset" key={g.id}>
                          <h3 className="type-item">{g.title}</h3>
                          <p className="text-xs text-muted">
                            {g.options
                              .map(
                                (o) =>
                                  o.label +
                                  (o.extraCents
                                    ? " (+" +
                                      formatEuros(o.extraCents / 100) +
                                      ")"
                                    : ""),
                              )
                              .join(" · ")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted">
                        A categoria ainda não tem grupos de escolha.
                      </p>
                    )}
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="ui-secondary"
                      onClick={() => setManagingCategory(true)}
                    >
                      Editar grupos da categoria
                    </button>
                  </div>
                </>
              ) : (
                <OptionGroupsEditor
                  value={customGroups}
                  onChange={setCustomGroups}
                  prefix="produto"
                />
              )}
            </section>
          )}
          <section
            aria-label="Imagem e publicação"
            className="ui-glass-panel space-y-3"
          >
            <h2 className="type-item text-primary">Imagem e publicação</h2>
            {(preview || image) && (
              <img
                src={preview || imageUrl(image)}
                alt="Fotografia do produto"
                className="h-32 w-40 rounded-xl object-cover"
              />
            )}
            <label className="block space-y-1">
              <span>Fotografia do produto</span>
              <input
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className={field}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setError("");
                  try {
                    validateProductImage(file);
                  } catch (cause) {
                    setError(
                      (cause instanceof Error
                        ? cause.message
                        : "Fotografia inválida.") +
                        (selectedImage
                          ? " A fotografia anterior foi mantida."
                          : " Nenhuma nova fotografia foi selecionada."),
                    );
                    event.target.value = "";
                    return;
                  }
                  setSelectedImage(file);
                }}
              />
            </label>
            <p className="text-xs text-muted">
              {selectedImage
                ? "Selecionada: " +
                  selectedImage.name +
                  ". Será enviada ao guardar o produto."
                : "JPG, PNG, WebP ou HEIC até 20 MB. A fotografia é otimizada antes do envio."}
            </p>
            <label className="flex min-h-11 items-center gap-3">
              <input
                name="published"
                type="checkbox"
                defaultChecked={row?.published}
                className="size-4 accent-primary"
              />{" "}
              Mostrar no catálogo público
            </label>
          </section>
          <div className="admin-actions">
            <button className={primary} type="submit">
              {busy ? saveStage || "A guardar…" : "Guardar produto"}
            </button>
            <button className="ui-secondary" type="button" onClick={onCancel}>
              Cancelar edição
            </button>
            {row && !confirmDelete && (
              <button
                className="ui-danger"
                type="button"
                onClick={() => setConfirmDelete(true)}
              >
                Excluir produto
              </button>
            )}
          </div>
          {row && confirmDelete && (
            <section
              aria-label="Confirmar exclusão"
              className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <p>
                <strong>Excluir {row.details.name}?</strong> A exclusão é
                permanente. Para ocultar o produto temporariamente, desmarque a
                publicação e guarde.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondary}
                  onClick={() => {
                    setConfirmDelete(false);
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
        </fieldset>
      </form>
      {managingCategory && selectedCategory && (
        <section className="space-y-4">
          <CategoryEditor
            category={selectedCategory}
            categories={categories}
            rows={rows}
            token={token}
            onBack={() => setManagingCategory(false)}
            onChanged={applyManagedCategory}
          />
        </section>
      )}
    </>
  );
}

export function CatalogEditor({
  productId,
  token,
  onCancel,
  onChanged,
  categories,
  rows,
  onCategoryCreated,
  onCategoryChanged,
}: CategoryFields & {
  productId?: string;
  token: string;
  onCancel: () => void;
  onChanged: (id: string, row: CatalogRow | null) => void;
}) {
  const [row, setRow] = useState<CatalogRow | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    getCatalogProduct(productId, token, controller.signal)
      .then(setRow)
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível abrir o produto.",
          );
      });
    return () => controller.abort();
  }, [productId, token]);

  if (error)
    return (
      <p role="alert" className="text-primary">
        {error}
      </p>
    );
  if (productId && !row) return <p role="status">A carregar produto…</p>;
  return (
    <ProductForm
      row={row}
      token={token}
      categories={categories}
      rows={rows}
      onCategoryCreated={onCategoryCreated}
      onCategoryChanged={onCategoryChanged}
      onCancel={onCancel}
      onSaved={(saved) => onChanged(saved.id, saved)}
      onDeleted={(id) => onChanged(id, null)}
    />
  );
}
