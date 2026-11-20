import type { CatalogCategory, Product } from '../../config/types.ts';

const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-PT');
export function filterCatalog(products: Product[], category: CatalogCategory | undefined, topicId: string, search: string) {
  const topic = category?.topics?.find(item => item.id === topicId);
  const query = normalize(search.trim());
  return products.filter(product => (!category || product.category === category.name) &&
    (!topic || (product.topicIds
      ? product.topicIds.includes(topic.id)
      : product.tags?.some(tag => normalize(tag) === normalize(topic.name)))) &&
    (!query || [product.name, product.category, product.description, ...(product.tags ?? [])]
      .some(value => normalize(value).includes(query))));
}
