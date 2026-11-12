const decimalPrice = new Intl.NumberFormat('pt-PT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
});

export function parseCatalogPrice(value: string) {
  const normalized = value.trim().replace(',', '.');
  return /^\d{1,5}(\.\d{1,2})?$/.test(normalized) ? Number(normalized) : null;
}

export function formatCatalogPrice(value: number) {
  return decimalPrice.format(value);
}
