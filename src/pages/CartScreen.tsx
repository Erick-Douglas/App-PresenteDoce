import { ArrowLeft, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { BUSINESS_INFO } from '../config/constants';
import type { CartItem, View } from '../config/types';
import {
  formatEuros,
  orderSubtotal,
  prepareOrder,
  whatsappLink,
} from '../features/checkout/order';
import { checkout, today } from '../features/platform/api';
import { useStore } from '../features/platform/StoreProvider';
import type { OrderPayload } from '../features/platform/types';

interface CartScreenProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onEditItem: (item: CartItem) => void;
  onNavigate: (view: View) => void;
}

const field = 'ui-field';
const iconButton = 'ui-icon-action';

export function CartScreen({
  cart,
  onUpdateQuantity,
  onEditItem,
  onNavigate,
}: CartScreenProps) {
  const { store, settings, reload } = useStore();
  const [busy, setBusy] = useState(false),
    [link, setLink] = useState('');
  const retry = useRef({ signature: '', key: crypto.randomUUID() });
  const hasReady = cart.some((i) => i.mode === 'ready');
  const minimum = new Date(today(store.timezone) + 'T12:00:00');
  minimum.setDate(minimum.getDate() + (hasReady ? 0 : settings.lead_days));
  const minDate = minimum.toISOString().slice(0, 10);
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>(
    'pickup',
  );
  const [payment, setPayment] = useState<'cash' | 'mbway' | 'wise'>('mbway');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const subtotal = orderSubtotal(cart);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const get = (name: string) => String(form.get(name) ?? '');
    setError('');
    setFeedback('');
    setMessage('');

    setBusy(true);
    try {
      prepareOrder(cart, {
        name: get('name'),
        phone: get('phone'),
        fulfillment,
        payment,
        address: get('address'),
        date: get('date'),
        changeFor: get('changeFor'),
      });
      if (
        hasReady &&
        cart.some((i) => i.mode !== 'ready') &&
        settings.lead_days > 0
      )
        throw Error(
          'Pronta entrega e encomendas com antecedência precisam de pedidos separados. Ajuste os itens do carrinho.',
        );
      const payload: OrderPayload = {
        idempotency_key: retry.current.key,
        delivery_date: get('date'),
        fulfillment,
        customer: {
          name: get('name').trim(),
          phone: get('phone').trim(),
          email: get('email').trim(),
          address: get('address').trim(),
        },
        notes:
          'Preferência de pagamento: ' +
          payment +
          (get('changeFor') ? ' · Troco para ' + get('changeFor') : ''),
        items: cart.map((i) => ({
          product_id: i.id,
          variant: i.variant || i.tamanho || '',
          quantity: i.quantity,
          mode: i.mode || 'preorder',
          configuration: Object.fromEntries(
            Object.entries({
              massa: i.massa,
              recheio1: i.recheio1,
              recheio2: i.recheio2,
              tema: i.tema,
              selectedFlavors: i.selectedFlavors,
              observations: i.observations,
            }).filter(([, v]) => v !== undefined && v !== ''),
          ),
        })),
      };
      const signature = JSON.stringify({ ...payload, idempotency_key: '' });
      if (signature !== retry.current.signature)
        retry.current = { signature, key: crypto.randomUUID() };
      payload.idempotency_key = retry.current.key;
      const saved = await checkout(payload);
      const nextMessage = saved.message;
      setMessage(nextMessage);
      setLink(saved.whatsapp_url);
      void reload().catch(() => {});

      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      if (submitter?.getAttribute('value') === 'copy') {
        await navigator.clipboard.writeText(nextMessage);
        setFeedback('Mensagem copiada.');
        return;
      }
      window.open(saved.whatsapp_url, '_blank', 'noopener,noreferrer');
      setFeedback(
        'Pedido #' +
          saved.order.reference +
          ' registrado. Envie a mensagem no WhatsApp e aguarde a confirmação da confeitaria.',
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível preparar o pedido.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-8">
      <header className="flex items-center gap-4 border-b border-outline py-5">
        <button
          type="button"
          aria-label="Voltar ao catálogo"
          onClick={() => onNavigate('home')}
          className={iconButton}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="type-page text-primary">A sua encomenda</h1>
      </header>
      {cart.length === 0 ? (
        <div className="space-y-4 py-10">
          <p>O carrinho está vazio.</p>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="ui-primary"
          >
            Ver catálogo
          </button>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-outline">
            {cart.map((item) => (
              <li
                key={item.cartId}
                className="flex flex-wrap items-center gap-3 py-4"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="size-14 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-36 flex-1">
                  <h2 className="type-item">{item.name}</h2>
                  {item.variant || item.tamanho ? (
                    <p className="text-sm text-muted">
                      {item.variant || item.tamanho}
                    </p>
                  ) : null}
                  <p className="text-sm">
                    {formatEuros(orderSubtotal([item]))}
                  </p>
                  <p className="text-xs text-muted">
                    {item.mode === 'ready'
                      ? 'Pronta entrega hoje'
                      : 'Por encomenda'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={iconButton}
                    type="button"
                    aria-label={'Diminuir quantidade de ' + item.name}
                    onClick={() => {
                      setMessage('');
                      onUpdateQuantity(item.cartId, item.quantity - 1);
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <span aria-label="Quantidade">{item.quantity}</span>
                  <button
                    className={iconButton}
                    type="button"
                    aria-label={'Aumentar quantidade de ' + item.name}
                    onClick={() => {
                      setMessage('');
                      onUpdateQuantity(item.cartId, item.quantity + 1);
                    }}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    className={iconButton}
                    type="button"
                    aria-label={'Editar ' + item.name}
                    onClick={() => onEditItem(item)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className={iconButton}
                    type="button"
                    aria-label={'Remover ' + item.name}
                    onClick={() => {
                      setMessage('');
                      onUpdateQuantity(item.cartId, 0);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <form
            aria-busy={busy}
            onSubmit={submit}
            onChange={() => {
              setMessage('');
              setFeedback('');
              setError('');
            }}
            className="space-y-5 border-t border-outline pt-6"
          >
            <fieldset disabled={busy} className="admin-form">
              <h2 className="type-section text-primary">Dados para o pedido</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span>Nome</span>
                  <input
                    name="name"
                    required
                    maxLength={100}
                    autoComplete="name"
                    className={field}
                  />
                </label>
                <label className="space-y-1">
                  <span>Telefone</span>
                  <input
                    name="phone"
                    type="tel"
                    required
                    maxLength={30}
                    autoComplete="tel"
                    className={field}
                  />
                </label>
                <label className="space-y-1">
                  <span>E-mail (opcional)</span>
                  <input
                    type="email"
                    name="email"
                    maxLength={254}
                    autoComplete="email"
                    className={field}
                  />
                </label>
                <label className="space-y-1">
                  <span>Como quer receber?</span>
                  <select
                    className={field}
                    value={fulfillment}
                    onChange={(event) =>
                      setFulfillment(
                        event.target.value === 'delivery'
                          ? 'delivery'
                          : 'pickup',
                      )
                    }
                  >
                    <option value="pickup">Recolha</option>
                    {settings.delivery_enabled && (
                      <option value="delivery">Entrega a combinar</option>
                    )}
                  </select>
                </label>
                <label className="space-y-1">
                  <span>Data pretendida</span>
                  <input
                    name="date"
                    type="date"
                    required
                    min={minDate}
                    max={hasReady ? today(store.timezone) : undefined}
                    defaultValue={minDate}
                    className={field}
                  />
                </label>
              </div>
              {fulfillment === 'delivery' ? (
                <label className="block space-y-1">
                  <span>Morada, código postal e localidade</span>
                  <textarea
                    name="address"
                    required
                    maxLength={400}
                    autoComplete="street-address"
                    rows={2}
                    className={field}
                  />
                </label>
              ) : (
                <p className="text-sm text-muted">
                  Recolha em {BUSINESS_INFO.address}, em horário a combinar.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span>Preferência de pagamento</span>
                  <select
                    className={field}
                    value={payment}
                    onChange={(event) =>
                      setPayment(event.target.value as typeof payment)
                    }
                  >
                    <option value="mbway">MB WAY</option>
                    <option value="wise">Wise</option>
                    <option value="cash">Dinheiro</option>
                  </select>
                </label>
                {payment === 'cash' && (
                  <label className="space-y-1">
                    <span>Troco para (opcional)</span>
                    <input
                      name="changeFor"
                      inputMode="decimal"
                      maxLength={12}
                      className={field}
                    />
                  </label>
                )}
              </div>
              <div className="rounded-xl bg-subtle p-4">
                <p className="flex justify-between gap-4 font-bold">
                  <span>Subtotal dos produtos</span>
                  <span>{formatEuros(subtotal)}</span>
                </p>
                {fulfillment === 'delivery' && (
                  <p className="mt-2 text-sm text-muted">
                    {settings.delivery_fee_cents === null
                      ? 'Taxa de entrega e total final a confirmar no WhatsApp.'
                      : 'Taxa de entrega: ' +
                        formatEuros(settings.delivery_fee_cents / 100)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" value="open" className="ui-primary">
                  {busy ? 'A validar pedido…' : 'Continuar no WhatsApp'}
                </button>
                <button
                  type="submit"
                  value="copy"
                  className="ui-secondary text-primary"
                >
                  Copiar mensagem
                </button>
              </div>
              <p className="text-sm text-muted">
                A encomenda é confirmada no atendimento. Os dados são
                registrados pela confeitaria para atender e acompanhar a sua
                encomenda. Uma reserva pendente expira em 30 minutos.
              </p>
              {error && (
                <p role="alert" className="text-sm text-primary">
                  {error}
                </p>
              )}
              {feedback && (
                <p role="status" className="text-sm font-bold">
                  {feedback}
                </p>
              )}
              {message && (
                <details className="rounded-xl border border-outline p-3">
                  <summary className="cursor-pointer font-bold">
                    Ver mensagem e opção de abertura
                  </summary>
                  <p className="my-3 whitespace-pre-wrap break-words text-sm">
                    {message}
                  </p>
                  <a
                    className="font-bold text-primary underline"
                    href={link || whatsappLink(BUSINESS_INFO.whatsapp, message)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir mensagem no WhatsApp
                  </a>
                </details>
              )}
            </fieldset>
          </form>
        </>
      )}
    </section>
  );
}
