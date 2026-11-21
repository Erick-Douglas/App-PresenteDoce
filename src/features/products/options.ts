import type { Product } from "../../config/types";
import type { StoreSettings } from "../platform/types";
export type ProductOption = { id: string; label: string; extraCents: number };
export type OptionGroup = {
  id: string;
  title: string;
  min: number;
  max: number;
  options: ProductOption[];
  legacyKey?: "variant" | "massa" | "recheios" | "flavors";
  maxByOption?: Record<string, number>;
};
export type Selections = Record<string, string[]>;
export function validateGroups(groups: OptionGroup[]) {
  if (!Array.isArray(groups) || groups.length > 10)
    throw Error("Use até 10 grupos de opções.");
  const ids = new Set<string>();
  for (const g of groups) {
    if (
      !g.title.trim() ||
      g.title.trim().length > 80 ||
      !g.options.length ||
      g.options.length > 30
    )
      throw Error("Dê um título a cada grupo e adicione entre 1 e 30 opções.");
    if (
      !Number.isInteger(g.min) ||
      !Number.isInteger(g.max) ||
      g.min < 0 ||
      g.max < 1 ||
      g.min > g.max ||
      g.max > g.options.length
    )
      throw Error(
        "Confira o mínimo e o máximo de escolhas de " + g.title + ".",
      );
    if (ids.has(g.id))
      throw Error("Os grupos precisam de identificadores únicos.");
    ids.add(g.id);
    const labels = new Set<string>();
    for (const o of g.options) {
      if (
        ids.has(o.id) ||
        !o.label.trim() ||
        o.label.length > 80 ||
        !Number.isSafeInteger(o.extraCents) ||
        o.extraCents < 0 ||
        o.extraCents > 9999999
      )
        throw Error("Confira o nome e o acréscimo de cada opção.");
      ids.add(o.id);
      const key = o.label.trim().toLocaleLowerCase("pt-PT");
      if (labels.has(key))
        throw Error("Não repita opções dentro do mesmo grupo.");
      labels.add(key);
    }
  }
}
export function selectionLimit(g: OptionGroup, selections: Selections) {
  const picked = new Set(Object.values(selections).flat());
  const limits = Object.entries(g.maxByOption || {})
    .filter(([id]) => picked.has(id))
    .map(([, n]) => n);
  return limits.length ? Math.min(g.max, ...limits) : g.max;
}
export function selectionProblem(
  groups: OptionGroup[],
  selections: Selections,
) {
  for (const id of Object.keys(selections))
    if (!groups.some((g) => g.id === id))
      return "As opções deste produto mudaram. Reveja as suas escolhas.";
  for (const g of groups) {
    const picked = selections[g.id] || [],
      max = selectionLimit(g, selections);
    if (
      new Set(picked).size !== picked.length ||
      picked.some((id) => !g.options.some((o) => o.id === id))
    )
      return "Reveja as opções de " + g.title + ".";
    if (picked.length < g.min)
      return (
        "Escolha " +
        (g.min === 1 ? "uma opção" : "pelo menos " + g.min + " opções") +
        " em " +
        g.title +
        "."
      );
    if (picked.length > max)
      return "Escolha até " + max + " em " + g.title + ".";
  }
  return "";
}
export function selectedSummary(groups: OptionGroup[], selections: Selections) {
  return groups
    .map((g) => ({
      title: g.title,
      options: g.options.filter((o) => selections[g.id]?.includes(o.id)),
    }))
    .filter((g) => g.options.length);
}
export function optionsExtra(groups: OptionGroup[], selections: Selections) {
  return selectedSummary(groups, selections).reduce(
    (n, g) => n + g.options.reduce((s, o) => s + o.extraCents, 0),
    0,
  );
}
export function hasPurchaseOptions(product: Product) {
  return product.optionGroups !== undefined
    ? product.optionGroups.length > 0
    : !!product.configuravel;
}
export function legacyGroups(
  product: Product,
  settings: StoreSettings,
): OptionGroup[] {
  const groups: OptionGroup[] = [];
  const group = (
    title: string,
    min: number,
    max: number,
    options: { label: string; extraCents: number }[],
    legacyKey?: OptionGroup["legacyKey"],
  ): OptionGroup => ({
    id: crypto.randomUUID(),
    title,
    min,
    max,
    options: options.map((o) => ({ id: crypto.randomUUID(), ...o })),
    ...(legacyKey ? { legacyKey } : {}),
  });
  if (product.variants?.length)
    groups.push(
      group(
        product.orderMode === "cake" ? "Tamanho" : "Tamanho da caixa",
        1,
        1,
        product.variants.map((v) => ({
          label: v.label,
          extraCents: Math.max(0, Math.round((v.price - product.price) * 100)),
        })),
        "variant",
      ),
    );
  const choices = (v: StoreSettings["cake_masses"]) =>
    v.map((o) =>
      typeof o === "string"
        ? { label: o, extraCents: 0 }
        : { label: o.label, extraCents: o.extra_cents },
    );
  if (product.orderMode === "cake") {
    const masses = choices(settings.cake_masses),
      fillings = choices(settings.cake_fillings);
    if (masses.length) groups.push(group("Massa", 1, 1, masses, "massa"));
    if (fillings.length)
      groups.push(
        group("Recheio", 1, Math.min(2, fillings.length), fillings, "recheios"),
      );
  }
  if (product.flavors?.length) {
    const flavors = group(
      "Sabores",
      0,
      product.flavors.length,
      product.flavors.map((label) => ({ label, extraCents: 0 })),
      "flavors",
    );
    if (groups[0]?.legacyKey === "variant")
      flavors.maxByOption = Object.fromEntries(
        groups[0].options.map((o, i) => [
          o.id,
          Math.min(
            product.flavors!.length,
            product.variants![i].maxFlavors ?? product.flavors!.length,
          ),
        ]),
      );
    groups.push(flavors);
  }
  return groups;
}
