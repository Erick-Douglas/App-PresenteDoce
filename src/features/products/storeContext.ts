export const pilotStoreId = '11111111-1111-4111-a111-111111111111';
let current = pilotStoreId;
export function activeStoreId() {
  return current;
}
export function setActiveStore(id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw new Error('Loja inválida.');
  current = id;
}
