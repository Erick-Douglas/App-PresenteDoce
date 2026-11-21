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
export function storeSlot(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const get = (key: string) => parts.find((p) => p.type === key)!.value;
  return {
    date: get("year") + "-" + get("month") + "-" + get("day"),
    time: get("hour") + ":" + get("minute"),
  };
}
export function earliestSlot(timeZone: string, hours = 48, now = Date.now()) {
  return storeSlot(
    Math.ceil((now + hours * 3600000) / 900000) * 900000,
    timeZone,
  );
}
export function slotInstant(date: string, time: string, timeZone: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    return NaN;
  const target = Date.parse(date + "T" + time + ":00Z");
  let candidate = target;
  for (let i = 0; i < 4; i++) {
    const shown = storeSlot(candidate, timeZone);
    const offset = Date.parse(shown.date + "T" + shown.time + ":00Z") - target;
    if (offset === 0) return candidate;
    candidate -= offset;
  }
  const final = storeSlot(candidate, timeZone);
  return final.date === date && final.time === time ? candidate : NaN;
}
export function slotProblem(
  date: string,
  time: string,
  timeZone: string,
  hours: number,
  now = Date.now(),
) {
  const instant = slotInstant(date, time, timeZone);
  if (!Number.isFinite(instant))
    return "Escolha uma data e um horário válidos.";
  if (instant < now + hours * 3600000)
    return (
      "Escolha data e horário com pelo menos " +
      hours +
      " horas de antecedência."
    );
  return "";
}
