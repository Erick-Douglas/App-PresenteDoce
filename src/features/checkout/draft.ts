export type CheckoutDraft = {
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  street: string;
  door: string;
  postalCode: string;
  city: string;
  complement: string;
  date: string;
  time: string;
  changeFor: string;
  fulfillment: "pickup" | "delivery";
  payment: "cash" | "mbway" | "wise";
  submittedSignature?: string;
  intent?: { signature: string; key: string };
};
export function newCheckoutDraft(): CheckoutDraft {
  return {
    name: "",
    phone: "",
    email: "",
    birthDate: "",
    street: "",
    door: "",
    postalCode: "",
    city: "",
    complement: "",
    date: "",
    time: "",
    changeFor: "",
    fulfillment: "pickup",
    payment: "mbway",
  };
}
export function deliveryAddress(d: CheckoutDraft) {
  return [
    d.street.trim() + (d.door.trim() ? ", " + d.door.trim() : ""),
    [d.postalCode.trim(), d.city.trim()].filter(Boolean).join(" "),
    d.complement.trim(),
  ]
    .filter(Boolean)
    .join(" · ");
}
