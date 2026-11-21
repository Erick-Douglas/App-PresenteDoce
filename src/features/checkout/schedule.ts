import type { CartItem } from "../../config/types";
import type { CalendarBlock } from "../platform/types";
export type CapacityDay = { day: string; available_capacity: number | null };
export function plusDays(day: string, count: number) {
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export function dateProblem(
  day: string,
  minimum: string,
  ready: boolean,
  currentDay: string,
  blocks: CalendarBlock[],
  days: CapacityDay[],
  units: number,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "Escolha a data pretendida.";
  if (day < minimum)
    return (
      "Escolha uma data a partir de " +
      minimum.split("-").reverse().join("/") +
      "."
    );
  if (ready && day !== currentDay)
    return "Os produtos de pronta entrega são para hoje.";
  if (blocks.some((b) => b.day === day && b.blocked))
    return "A confeitaria não recebe encomendas nesta data. Escolha outro dia.";
  const free = days.find((d) => d.day === day)?.available_capacity;
  if (free != null && units > free)
    return "Esta data já não tem capacidade para os seus produtos. Escolha outro dia.";
  return "";
}
export function cartUnits(cart: CartItem[]) {
  return cart.reduce(
    (n, i) =>
      n + (i.mode === "ready" ? 0 : i.quantity * (i.capacityUnits ?? 1)),
    0,
  );
}
export function firstEligibleDate(
  minimum: string,
  ready: boolean,
  currentDay: string,
  blocks: CalendarBlock[],
  days: CapacityDay[],
  units: number,
) {
  for (let n = 0; n < (ready ? 1 : 120); n++) {
    const day = plusDays(minimum, n);
    if (!dateProblem(day, minimum, ready, currentDay, blocks, days, units))
      return day;
  }
  return "";
}
