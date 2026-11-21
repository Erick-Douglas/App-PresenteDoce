import { selectedSummary } from "../features/products/options";
import { AppSelect } from "../components/AppSelect";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  MapPin,
  Minus,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { BUSINESS_INFO } from "../config/constants";
import type { CartItem, View } from "../config/types";
import {
  formatEuros,
  orderSubtotal,
  prepareOrder,
  whatsappLink,
} from "../features/checkout/order";
import {
  deliveryAddress,
  type CheckoutDraft,
} from "../features/checkout/draft";
import {
  cartUnits,
  dateProblem,
  earliestSlot,
  slotProblem,
  firstEligibleDate,
  plusDays,
} from "../features/checkout/schedule";
import { checkout, today } from "../features/platform/api";
import { useStore } from "../features/platform/StoreProvider";
import type { OrderPayload } from "../features/platform/types";

type Props = {
  cart: CartItem[];
  draft: CheckoutDraft;
  setDraft: Dispatch<SetStateAction<CheckoutDraft>>;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onEditItem: (item: CartItem) => void;
  onNavigate: (view: View) => void;
};
function orderPayload(
  cart: CartItem[],
  draft: CheckoutDraft,
  fulfillment: "pickup" | "delivery",
  date: string,
  address: string,
  key: string,
  preorderOnly: boolean,
): OrderPayload {
  return {
    idempotency_key: key,
    delivery_date: date,
    delivery_time: draft.time,
    fulfillment,
    customer: {
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      address: fulfillment === "delivery" ? address : "",
    },
    notes:
      "Preferência de pagamento: " +
      draft.payment +
      (draft.payment === "cash" && draft.changeFor
        ? " · Troco para " + draft.changeFor
        : ""),
    items: cart.map((i) => ({
      product_id: i.id,
      variant: i.variant || i.tamanho || "",
      quantity: i.quantity,
      mode: preorderOnly ? "preorder" : i.mode || "preorder",
      configuration: Object.fromEntries(
        Object.entries({
          massa: i.massa,
          recheio1: i.recheio1,
          recheio2: i.recheio2,
          tema: i.tema,
          selectedFlavors: i.selectedFlavors,
          ...(i.optionGroups !== undefined
            ? { selections: i.selections ?? {} }
            : {}),
          observations: i.observations,
        }).filter(([, v]) => v !== undefined && v !== ""),
      ),
    })),
  };
}

export function CartScreen({
  cart,
  draft,
  setDraft,
  onUpdateQuantity,
  onEditItem,
  onNavigate,
}: Props) {
  const { store, settings, blocks, days, reload } = useStore();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [feedback, setFeedback] = useState(""),
    [message, setMessage] = useState(""),
    [link, setLink] = useState("");
  const retry = useRef(
    draft.intent ?? { signature: "", key: crypto.randomUUID() },
  );
  const currentDay = today(store.timezone),
    hasReady =
      settings.preorder_only === false && cart.some((i) => i.mode === "ready");
  const notice = hasReady
    ? 0
    : Math.max(
        settings.preorder_only !== false ? 48 : 0,
        settings.min_notice_hours ?? 48,
        settings.lead_days * 24,
      );
  const earliest = earliestSlot(store.timezone, notice);
  const minimum = earliest.date,
    units = cart.reduce(
      (n, i) =>
        n +
        (hasReady && i.mode === "ready"
          ? 0
          : i.quantity * (i.capacityUnits ?? 1)),
      0,
    );
  const initialDate = firstEligibleDate(
    minimum,
    hasReady,
    currentDay,
    blocks,
    days,
    units,
  );
  const date = draft.date || initialDate,
    fulfillment = settings.delivery_enabled ? draft.fulfillment : "pickup";
  const time = draft.time || (date === earliest.date ? earliest.time : "12:00");
  const address = deliveryAddress(draft);
  const currentSignature = JSON.stringify({
    ...orderPayload(
      cart,
      { ...draft, time },
      fulfillment,
      date,
      address,
      "",
      settings.preorder_only !== false,
    ),
    idempotency_key: "",
  });
  const dateError =
    (draft.submittedSignature === currentSignature
      ? ""
      : slotProblem(date, time, store.timezone, notice)) ||
    dateProblem(
      date,
      minimum,
      hasReady,
      currentDay,
      blocks,
      draft.submittedSignature === currentSignature ? [] : days,
      units,
    );
  const subtotal = orderSubtotal(cart);
  const fee = fulfillment === "delivery" ? settings.delivery_fee_cents : 0;
  // Preserve the selected eligible day when navigating to an item and back.
  useEffect(() => {
    if (!draft.date && initialDate)
      setDraft((d) => ({
        ...d,
        date: initialDate,
        time:
          d.time || (initialDate === earliest.date ? earliest.time : "12:00"),
      }));
  }, [draft.date, initialDate, setDraft]);
  const update = <K extends keyof CheckoutDraft>(
    name: K,
    value: CheckoutDraft[K],
  ) => {
    setDraft((d) => ({ ...d, [name]: value }));
    setError("");
    setFeedback("");
    setMessage("");
    setLink("");
  };
  const input = (
    name:
      | "name"
      | "phone"
      | "email"
      | "street"
      | "door"
      | "postalCode"
      | "city"
      | "complement"
      | "changeFor",
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label className="module-field">
      <span>{label}</span>
      <input
        name={name}
        className="ui-field"
        value={draft[name]}
        onChange={(e) => update(name, e.target.value)}
        {...props}
      />
    </label>
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setFeedback("");
    const copying =
      (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ===
      "copy";
    let popup: Window | null = null;
    setBusy(true);
    try {
      if (dateError) throw Error(dateError);
      if (
        hasReady &&
        cart.some((i) => i.mode !== "ready") &&
        settings.lead_days > 0
      )
        throw Error(
          "Pronta entrega e encomendas com antecedência precisam de pedidos separados. Ajuste os itens do carrinho.",
        );
      const preview = prepareOrder(cart, {
        ...draft,
        time,
        fulfillment,
        date,
        address,
      });
      if (copying) {
        await navigator.clipboard.writeText(preview);
        setFeedback(
          "Mensagem copiada. O pedido só será reservado ao continuar no WhatsApp.",
        );
        return;
      }
      // Opening during the user gesture avoids mobile popup blocking after the API request.
      popup = window.open("", "_blank");
      if (popup) popup.opener = null;
      const payload = orderPayload(
        cart,
        { ...draft, time },
        fulfillment,
        date,
        address,
        retry.current.key,
        settings.preorder_only !== false,
      );
      const signature = JSON.stringify({ ...payload, idempotency_key: "" });
      if (signature !== retry.current.signature)
        retry.current = { signature, key: crypto.randomUUID() };
      payload.idempotency_key = retry.current.key;
      setDraft((d) => ({ ...d, intent: retry.current }));
      const saved = await checkout(payload);
      setDraft((d) => ({ ...d, submittedSignature: signature }));
      setMessage(saved.message);
      setLink(saved.whatsapp_url);
      if (popup) popup.location.href = saved.whatsapp_url;
      setFeedback(
        "Pedido #" +
          saved.order.reference +
          " registrado. Envie a mensagem no WhatsApp para confirmar com a confeitaria.",
      );
      void reload().catch(() => {});
    } catch (cause) {
      popup?.close();
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível preparar o pedido.",
      );
      void reload().catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page-width checkout-page">
      <header className="customer-page-heading">
        <button
          type="button"
          aria-label="Voltar ao catálogo"
          onClick={() => onNavigate("home")}
          className="ui-icon-action"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="page-eyebrow">Feito para si</span>
          <h1 className="type-module text-on-surface">A sua encomenda</h1>
        </div>
      </header>
      {!cart.length ? (
        <div className="module-panel">
          <ShoppingBag size={24} />
          <h2 className="type-section">O carrinho está vazio.</h2>
          <p className="text-sm text-muted">
            Escolha algo especial na nossa vitrine.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="ui-primary"
              onClick={() => onNavigate("home")}
            >
              Ver catálogo
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} aria-busy={busy} className="checkout-layout">
          <fieldset disabled={busy} className="checkout-fields">
            <section className="checkout-card">
              <h2 className="checkout-title">
                <ShoppingBag size={18} />
                Os seus produtos{" "}
                <small>{cart.reduce((n, i) => n + i.quantity, 0)} itens</small>
              </h2>
              <ul className="checkout-items">
                {cart.map((item) => (
                  <li key={item.cartId}>
                    {item.image && (
                      <img src={item.image} alt="" className="checkout-thumb" />
                    )}
                    <div className="checkout-item-info">
                      <h3 className="type-item">{item.name}</h3>
                      <p className="text-xs text-muted">
                        {[
                          item.variant || item.tamanho,
                          item.massa,
                          item.recheio1,
                          item.recheio2 !== item.recheio1 ? item.recheio2 : "",
                          item.selectedFlavors?.join(", "),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {selectedSummary(
                        item.optionGroups ?? [],
                        item.selections ?? {},
                      ).map((g) => (
                        <p className="text-xs text-muted" key={g.title}>
                          {g.title}: {g.options.map((o) => o.label).join(", ")}
                        </p>
                      ))}
                      <span className="text-xs text-muted">
                        {item.mode === "ready"
                          ? "Pronta entrega hoje"
                          : "Por encomenda"}
                      </span>
                      <p className="type-price mt-1">
                        {formatEuros(orderSubtotal([item]))}
                      </p>
                    </div>
                    <div className="checkout-item-actions">
                      <div className="quantity-control">
                        <button
                          type="button"
                          aria-label={"Diminuir " + item.name}
                          className="ui-icon-action"
                          onClick={() =>
                            onUpdateQuantity(item.cartId, item.quantity - 1)
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span className="tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={"Aumentar " + item.name}
                          className="ui-icon-action"
                          onClick={() =>
                            onUpdateQuantity(item.cartId, item.quantity + 1)
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="ui-icon-action"
                          aria-label={"Editar " + item.name}
                          onClick={() => onEditItem(item)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="ui-icon-action"
                          data-destructive="true"
                          aria-label={"Remover " + item.name}
                          onClick={() => onUpdateQuantity(item.cartId, 0)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <section className="checkout-card">
              <h2 className="checkout-title">
                <UserRound size={18} />
                Os seus dados
              </h2>
              <div className="module-form-grid">
                {input("name", "Nome", {
                  required: true,
                  maxLength: 100,
                  autoComplete: "name",
                })}
                {input("phone", "Telefone", {
                  required: true,
                  type: "tel",
                  maxLength: 30,
                  autoComplete: "tel",
                })}
                {input("email", "E-mail (opcional)", {
                  type: "email",
                  maxLength: 254,
                  autoComplete: "email",
                })}
              </div>
            </section>
            <section className="checkout-card">
              <h2 className="checkout-title">
                <MapPin size={18} />
                Entrega ou recolha
              </h2>
              <label className="module-field">
                <span>Como quer receber?</span>
                <AppSelect
                  className="ui-field"
                  value={fulfillment}
                  onChange={(e) =>
                    update(
                      "fulfillment",
                      e.target.value === "delivery" ? "delivery" : "pickup",
                    )
                  }
                >
                  <option value="pickup">Recolha</option>
                  {settings.delivery_enabled && (
                    <option value="delivery">Entrega a combinar</option>
                  )}
                </AppSelect>
              </label>
              {fulfillment === "delivery" ? (
                <div className="module-form-grid mt-4">
                  {input("street", "Rua ou avenida", {
                    required: true,
                    maxLength: 180,
                    autoComplete: "address-line1",
                  })}
                  {input("door", "Número, andar ou porta", {
                    required: true,
                    maxLength: 50,
                    autoComplete: "address-line2",
                  })}
                  {input("postalCode", "Código postal", {
                    required: true,
                    maxLength: 20,
                    autoComplete: "postal-code",
                    placeholder: "0000-000",
                  })}
                  {input("city", "Localidade", {
                    required: true,
                    maxLength: 80,
                    autoComplete: "address-level2",
                  })}
                  {input("complement", "Referência para a entrega (opcional)", {
                    maxLength: 100,
                  })}
                </div>
              ) : (
                <p className="checkout-note">
                  <MapPin size={16} />
                  Recolha em {BUSINESS_INFO.address}, em horário a combinar.
                </p>
              )}
              <label className="module-field mt-4">
                <span className="flex items-center gap-2">
                  <CalendarDays size={15} />
                  Data pretendida
                </span>
                <input
                  name="date"
                  type="date"
                  required
                  min={minimum}
                  max={hasReady ? currentDay : undefined}
                  value={date}
                  onChange={(e) => update("date", e.target.value)}
                  className="ui-field"
                  aria-invalid={!!dateError}
                  aria-describedby="checkout-date-help"
                />
              </label>
              <label className="module-field mt-4">
                <span>Horário pretendido</span>
                <input
                  name="time"
                  type="time"
                  required
                  step={60}
                  min={date === earliest.date ? earliest.time : undefined}
                  value={time}
                  onChange={(e) => update("time", e.target.value)}
                  className="ui-field"
                  aria-describedby="checkout-date-help"
                />
              </label>
              <p
                id="checkout-date-help"
                role={dateError ? "alert" : undefined}
                className={
                  "text-xs mt-2 " + (dateError ? "text-primary" : "text-muted")
                }
              >
                {dateError ||
                  (hasReady
                    ? "Pronta entrega disponível hoje."
                    : "Encomendas com antecedência mínima de 48 horas. Escolha a data e o horário para entrega ou recolha; a confeitaria confirma a disponibilidade.")}
              </p>
            </section>
            <section className="checkout-card">
              <h2 className="checkout-title">
                <Wallet size={18} />
                Pagamento
              </h2>
              <p className="text-sm text-muted mb-3">
                Escolha a sua preferência. O pagamento é combinado com a
                confeitaria.
              </p>
              <div className="module-form-grid">
                <label className="module-field">
                  <span>Preferência de pagamento</span>
                  <AppSelect
                    value={draft.payment}
                    className="ui-field"
                    onChange={(e) =>
                      update(
                        "payment",
                        e.target.value as CheckoutDraft["payment"],
                      )
                    }
                  >
                    <option value="mbway">MB WAY</option>
                    <option value="wise">Wise</option>
                    <option value="cash">Dinheiro</option>
                  </AppSelect>
                </label>
                {draft.payment === "cash" &&
                  input("changeFor", "Troco para (opcional)", {
                    inputMode: "decimal",
                    maxLength: 12,
                  })}
              </div>
            </section>
          </fieldset>
          <aside className="checkout-summary">
            <section className="checkout-card">
              <h2 className="checkout-title">Resumo da encomenda</h2>
              <dl className="checkout-totals">
                <div>
                  <dt>Subtotal dos produtos</dt>
                  <dd>{formatEuros(subtotal)}</dd>
                </div>
                <div>
                  <dt>{fulfillment === "delivery" ? "Entrega" : "Recolha"}</dt>
                  <dd>
                    {fee === null
                      ? "A combinar"
                      : fee === 0
                        ? "Sem custo"
                        : formatEuros(fee / 100)}
                  </dd>
                </div>
                <div className="checkout-total">
                  <dt>{fee === null ? "Subtotal" : "Total"}</dt>
                  <dd>{formatEuros(subtotal + (fee || 0) / 100)}</dd>
                </div>
              </dl>
              {fee === null && (
                <p className="text-xs text-muted">
                  Taxa de entrega e total final a confirmar no WhatsApp.
                </p>
              )}
              <div className="checkout-submit">
                <button
                  disabled={busy || !!dateError}
                  type="submit"
                  value="open"
                  className="ui-primary"
                >
                  {busy ? "A validar pedido…" : "Continuar no WhatsApp"}
                </button>
                <button
                  disabled={busy || !!dateError}
                  type="submit"
                  value="copy"
                  className="ui-quiet-action"
                >
                  Copiar mensagem
                </button>
              </div>
              <p className="text-xs text-muted">
                A confeitaria confirma a encomenda no atendimento. Ao continuar,
                os dados são registados para atender o pedido e a reserva
                aguarda confirmação por 30 minutos.
              </p>
              {error && (
                <p role="alert" className="module-error">
                  {error}
                </p>
              )}
              {feedback && (
                <p role="status" className="checkout-feedback">
                  <Check size={17} />
                  {feedback}
                </p>
              )}
              {message && (
                <div className="checkout-message">
                  <a
                    className="ui-secondary"
                    href={link || whatsappLink(BUSINESS_INFO.whatsapp, message)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir mensagem no WhatsApp
                  </a>
                  <details>
                    <summary>Ver mensagem do pedido</summary>
                    <p className="whitespace-pre-wrap break-words text-sm mt-3">
                      {message}
                    </p>
                  </details>
                </div>
              )}
            </section>
          </aside>
        </form>
      )}
    </section>
  );
}
