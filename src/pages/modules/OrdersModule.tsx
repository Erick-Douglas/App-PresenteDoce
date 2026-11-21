import { ChevronLeft, ChevronRight, MessageCircle, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  ActionForm,
  cents,
  Empty,
  Field,
  Metrics,
  number,
  Panel,
  text,
} from '../../components/ModuleUI';
import { formatEuros } from '../../features/checkout/order';
import { downloadJson, today } from '../../features/platform/api';
import { options, useStore } from '../../features/platform/StoreProvider';
import type { Order, OrderPayload } from '../../features/platform/types';
import { productionDemand } from '../../features/pricing/demand';
import {
  listPricingRecipes,
  type PricingRow,
} from '../../features/pricing/pricingApi';
import type { ModuleProps } from '../OperationsScreen';
const labels: Record<string, string> = {
  draft: 'Orçamento',
  pending: 'A confirmar',
  confirmed: 'Confirmada',
  production: 'Em produção',
  ready: 'Pronta',
  completed: 'Concluída',
  canceled: 'Cancelada',
  expired: 'Reserva expirada',
};
export function OrderComposer({
  data,
  token,
  reload,
  rows,
  onClose,
}: { onClose: () => void } & ModuleProps) {
  const { store, settings } = useStore(),
    [lines, setLines] = useState([
      {
        id: crypto.randomUUID(),
        product: '',
        variant: '',
        quantity: 1,
        mode: 'preorder',
      },
    ]),
    [customerId, setCustomerId] = useState('');
  const selected = data.customers.find((c) => c.id === customerId);
  return (
    <Panel
      title="Nova encomenda ou orçamento"
      description="Os preços e a disponibilidade são conferidos ao guardar."
      action={
        <button className="ui-quiet-action" onClick={onClose}>
          Fechar
        </button>
      }
    >
      <ActionForm
        action="order.create"
        token={token}
        submit="Guardar encomenda"
        onSaved={reload}
        build={(f, key): OrderPayload => ({
          idempotency_key: key,
          delivery_date: text(f, 'day'),
          fulfillment: text(f, 'fulfillment') as 'pickup' | 'delivery',
          kind: text(f, 'kind') as 'order' | 'quote',
          customer: {
            name: text(f, 'name'),
            phone: text(f, 'phone'),
            email: text(f, 'email'),
            address: text(f, 'address'),
          },
          ...(customerId ? { customer_id: customerId } : {}),
          notes: text(f, 'notes'),
          items: lines.map((l) => ({
            product_id: l.product,
            variant: l.variant,
            quantity: l.quantity,
            mode: l.mode as 'preorder' | 'ready',
            configuration: Object.fromEntries(
              ['massa', 'recheio1', 'recheio2', 'tema', 'observations']
                .map((key) => [key, text(f, l.id + ':' + key)])
                .filter(([, value]) => value),
            ),
          })),
        })}
      >
        <div className="module-grid">
          <Field label="Tipo">
            <select name="kind" className="ui-field">
              <option value="order">Encomenda confirmada</option>
              <option value="quote">Orçamento (sem reserva)</option>
            </select>
          </Field>
          <Field label="Cliente existente">
            <select
              className="ui-field"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Novo contacto</option>
              {data.customers
                .filter((c) => !c.archived)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.phone}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <div className="module-grid" key={customerId}>
          <Field
            label="Nome"
            name="name"
            value={selected?.name}
            required
            maxLength={100}
          />
          <Field
            label="Telefone"
            name="phone"
            type="tel"
            value={selected?.phone}
            required
            maxLength={30}
          />
          <Field
            label="E-mail (opcional)"
            name="email"
            type="email"
            value={selected?.email}
          />
          <Field
            label="Morada"
            name="address"
            value={selected?.address}
            maxLength={500}
          />
        </div>
        <div className="module-grid">
          <Field
            label="Data"
            name="day"
            type="date"
            value={today(store.timezone)}
            required
          />
          <Field label="Receção">
            <select name="fulfillment" className="ui-field">
              <option value="pickup">Recolha</option>
              <option value="delivery">Entrega</option>
            </select>
          </Field>
        </div>
        <div className="space-y-3">
          {lines.map((line, index) => {
            const product = rows.find((r) => r.id === line.product);
            const update = (patch: Partial<typeof line>) =>
              setLines((ls) =>
                ls.map((l) => (l.id === line.id ? { ...l, ...patch } : l)),
              );
            return (
              <div className="module-inset" key={line.id}>
                <p className="type-item mb-3">Produto {index + 1}</p>
                <div className="module-grid">
                  <Field label="Produto">
                    <select
                      required
                      className="ui-field"
                      value={line.product}
                      onChange={(e) => {
                        const p = rows.find((r) => r.id === e.target.value);
                        update({
                          product: e.target.value,
                          variant: p?.details.variants?.[0]?.label || '',
                          mode: p?.details.saleModes?.[0] || 'preorder',
                        });
                      }}
                    >
                      <option value="">Escolher produto</option>
                      {rows.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.details.name}
                          {r.published ? '' : ' · Rascunho'}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Quantidade">
                    <input
                      required
                      type="number"
                      min={1}
                      max={1000}
                      className="ui-field"
                      value={line.quantity}
                      onChange={(e) =>
                        update({ quantity: Number(e.target.value) })
                      }
                    />
                  </Field>
                  {!!product?.details.variants?.length && (
                    <Field label="Tamanho ou opção">
                      <select
                        className="ui-field"
                        value={line.variant}
                        onChange={(e) => update({ variant: e.target.value })}
                      >
                        {product.details.variants.map((v) => (
                          <option key={v.label} value={v.label}>
                            {v.label} · {formatEuros(v.price)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label="Disponibilidade">
                    <select
                      className="ui-field"
                      value={line.mode}
                      onChange={(e) => update({ mode: e.target.value })}
                    >
                      {(product?.details.saleModes || ['preorder']).map((m) => (
                        <option key={m} value={m}>
                          {m === 'ready'
                            ? 'Pronta entrega (hoje)'
                            : 'Por encomenda'}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                {product?.details.orderMode === 'cake' && (
                  <div className="module-grid mt-3">
                    {(['massa', 'recheio1', 'recheio2'] as const).map((key) => (
                      <Field
                        key={key}
                        label={
                          key === 'massa'
                            ? 'Massa'
                            : key === 'recheio1'
                              ? 'Recheio principal'
                              : 'Segundo recheio (opcional)'
                        }
                      >
                        <select
                          className="ui-field"
                          name={line.id + ':' + key}
                          required={key !== 'recheio2'}
                        >
                          <option value="">Escolher</option>
                          {options(
                            key === 'massa'
                              ? settings.cake_masses
                              : settings.cake_fillings,
                          ).map((v) => (
                            <option key={v.label} value={v.label}>
                              {v.label}
                              {v.extra_cents
                                ? ' + ' + formatEuros(v.extra_cents / 100)
                                : ''}
                            </option>
                          ))}
                        </select>
                      </Field>
                    ))}
                    <Field
                      label="Tema ou referência"
                      name={line.id + ':tema'}
                      maxLength={300}
                    />
                  </div>
                )}
                {lines.length > 1 && (
                  <button
                    type="button"
                    className="ui-quiet-action mt-2"
                    onClick={() =>
                      setLines((ls) => ls.filter((l) => l.id !== line.id))
                    }
                  >
                    Remover produto
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="ui-secondary justify-self-start"
          disabled={lines.length >= 50}
          onClick={() =>
            setLines((ls) => [
              ...ls,
              {
                id: crypto.randomUUID(),
                product: '',
                variant: '',
                quantity: 1,
                mode: 'preorder',
              },
            ])
          }
        >
          <Plus size={15} />
          Adicionar produto
        </button>
        <Field label="Notas">
          <textarea
            name="notes"
            maxLength={2000}
            rows={2}
            className="ui-field"
          />
        </Field>
      </ActionForm>
    </Panel>
  );
}
function OrderDetail({
  order: o,
  data,
  token,
  reload,
}: ModuleProps & { order: Order }) {
  const { settings, store } = useStore();
  const items = data.items.filter((i) => i.order_id === o.id);
  const paid = data.finance
    .filter((f) => f.order_id === o.id)
    .reduce(
      (s, f) =>
        s +
        (f.type === 'receipt'
          ? f.amount_cents
          : f.type === 'refund'
            ? -f.amount_cents
            : 0),
      0,
    );
  const message = [
    store.name +
      ' · ' +
      (o.kind === 'quote' ? 'Orçamento' : 'Encomenda') +
      ' #' +
      o.reference,
    ...items.map(
      (i) =>
        i.quantity +
        ' × ' +
        i.snapshot.name +
        (i.option_key ? ' · ' + i.option_key : '') +
        ' — ' +
        formatEuros((i.quantity * i.unit_cents) / 100),
    ),
    o.delivery_date,
    'Total: ' +
      formatEuros(o.total_cents / 100) +
      (o.delivery_pending ? ' + entrega a confirmar' : ''),
    'Sinal: ' + formatEuros(o.deposit_cents / 100),
    'Recebido: ' + formatEuros(paid / 100),
  ].join('\n');
  return (
    <Panel
      title={'#' + o.reference + ' · ' + o.customer_snapshot.name}
      description={labels[o.status] + ' · ' + o.delivery_date}
    >
      <Metrics
        items={[
          {
            label: o.delivery_pending ? 'Subtotal' : 'Total',
            value: formatEuros(o.total_cents / 100),
          },
          {
            label: 'Sinal previsto',
            value: formatEuros(o.deposit_cents / 100),
          },
          { label: 'Recebido', value: formatEuros(paid / 100) },
          {
            label: 'Por receber',
            value: formatEuros(Math.max(0, o.total_cents - paid) / 100),
          },
        ]}
      />
      <div className="module-inset text-sm space-y-2">
        {items.map((i) => (
          <div key={i.id}>
            <p className="type-item">
              {i.quantity} × {i.snapshot.name}
              {i.option_key ? ' · ' + i.option_key : ''}
            </p>
            <p className="text-muted">
              {i.mode === 'ready' ? 'Pronta entrega' : 'Por encomenda'} ·{' '}
              {formatEuros((i.quantity * i.unit_cents) / 100)}
            </p>
            {Object.entries(i.configuration || {}).map(([k, v]) => (
              <p key={k} className="text-muted">
                {k}: {Array.isArray(v) ? v.join(', ') : String(v)}
              </p>
            ))}
          </div>
        ))}
      </div>
      <p className="text-sm">
        {o.fulfillment === 'pickup'
          ? 'Recolha'
          : 'Entrega: ' + o.customer_snapshot.address}{' '}
        · {o.customer_snapshot.phone}
      </p>
      {o.notes && (
        <p className="module-inset text-sm whitespace-pre-wrap">{o.notes}</p>
      )}
      <a
        className="ui-secondary mt-3 inline-flex"
        href={
          'https://wa.me/' +
          o.customer_snapshot.phone.replace(/\D/g, '') +
          '?text=' +
          encodeURIComponent(message)
        }
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={16} />
        Enviar resumo ao cliente
      </a>
      {o.delivery_pending && (
        <div className="module-inset mt-4">
          <p className="text-sm mb-3">
            Defina a taxa combinada com o cliente antes de confirmar a entrega.
          </p>
          <ActionForm
            action="order.delivery_fee"
            token={token}
            submit="Definir taxa"
            onSaved={reload}
            build={(f) => ({
              id: o.id,
              version: o.version,
              amount_cents: cents(f, 'fee'),
            })}
          >
            <Field
              label={'Taxa de entrega (' + store.currency + ')'}
              name="fee"
              inputMode="decimal"
              required
            />
          </ActionForm>
        </div>
      )}
      {!['completed', 'canceled'].includes(o.status) && (
        <div className="module-inset mt-4">
          <ActionForm
            action="order.status"
            token={token}
            submit="Atualizar estado"
            onSaved={reload}
            build={(f) => ({
              id: o.id,
              version: o.version,
              status: text(f, 'status'),
            })}
          >
            <Field label="Próxima etapa">
              <select
                key={o.status}
                name="status"
                required
                className="ui-field"
              >
                <option value="">Escolher ação</option>
                {(['draft', 'pending', 'expired'].includes(o.status)
                  ? ['confirmed', 'canceled']
                  : o.status === 'confirmed'
                    ? ['production', 'canceled']
                    : o.status === 'production'
                      ? ['ready', 'canceled']
                      : o.status === 'ready'
                        ? ['completed', 'canceled']
                        : []
                ).map((s) => (
                  <option key={s} value={s}>
                    {labels[s]}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" required />
              Confirmo esta alteração. Cancelar libera o estoque reservado;
              valores já recebidos exigem estorno próprio.
            </label>
          </ActionForm>
        </div>
      )}
      {!!settings.whatsapp && (
        <p className="text-xs text-muted mt-3">
          Os recebimentos são registrados no módulo Financeiro.
        </p>
      )}
    </Panel>
  );
}
export function OrdersModule(props: ModuleProps) {
  const [adding, setAdding] = useState(false),
    [selected, setSelected] = useState(''),
    [query, setQuery] = useState(''),
    [status, setStatus] = useState('all');
  const orders = props.data.orders.filter(
    (o) =>
      (status === 'all' || o.status === status) &&
      (
        o.reference +
        ' ' +
        o.customer_snapshot.name +
        ' ' +
        o.customer_snapshot.phone
      )
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const order = props.data.orders.find((o) => o.id === selected);
  return (
    <div className="admin-form">
      <div className="module-toolbar">
        <label className="module-field flex-1">
          <span>Pesquisar encomendas</span>
          <input
            className="ui-field"
            placeholder="Número, cliente ou telefone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Field label="Estado">
          <select
            className="ui-field"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Todos</option>
            {Object.entries(labels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <button className="ui-primary" onClick={() => setAdding(!adding)}>
          <Plus size={16} />
          Nova encomenda
        </button>
      </div>
      {adding && <OrderComposer {...props} onClose={() => setAdding(false)} />}
      {order && <OrderDetail key={order.id} {...props} order={order} />}
      <Panel
        title="Encomendas e orçamentos"
        description="Pedidos da vitrine aguardam a sua confirmação. Reservas pendentes expiram em 30 minutos."
      >
        {!orders.length ? (
          <Empty title="Nenhuma encomenda nesta vista">
            Crie uma encomenda ou ajuste o filtro.
          </Empty>
        ) : (
          orders.map((o) => (
            <button
              key={o.id}
              className="module-row module-row-button"
              onClick={() => setSelected(o.id)}
              aria-pressed={selected === o.id}
            >
              <div>
                <span className="module-badge">{labels[o.status]}</span>
                <p className="type-item mt-1">
                  #{o.reference} · {o.customer_snapshot.name}
                </p>
                <p className="text-sm text-muted">
                  {o.delivery_date} ·{' '}
                  {o.fulfillment === 'pickup' ? 'Recolha' : 'Entrega'}
                </p>
              </div>
              <div className="text-right">
                <p className="type-price">{formatEuros(o.total_cents / 100)}</p>
                {o.delivery_pending && (
                  <p className="text-xs text-muted">+ entrega</p>
                )}
              </div>
            </button>
          ))
        )}
      </Panel>
    </div>
  );
}
export function AgendaModule(props: ModuleProps) {
  const { data, token, reload } = props,
    { store } = useStore(),
    [day, setDay] = useState(today(store.timezone)),
    [month, setMonth] = useState(day.slice(0, 7)),
    [period, setPeriod] = useState('day');
  const [recipes, setRecipes] = useState<PricingRow[]>([]),
    [recipeError, setRecipeError] = useState('');
  useEffect(() => {
    const c = new AbortController();
    listPricingRecipes(token, c.signal)
      .then(setRecipes)
      .catch((e) => {
        if (!c.signal.aborted)
          setRecipeError(
            e instanceof Error
              ? e.message
              : 'Não foi possível carregar as fichas.',
          );
      });
    return () => c.abort();
  }, [token]);
  const orders = data.orders.filter(
    (o) => !['draft', 'canceled', 'expired'].includes(o.status),
  );
  const capacity =
      data.blocks.find((b) => b.day === day)?.capacity ??
      data.settings.settings.daily_capacity,
    blocked = data.blocks.find((b) => b.day === day)?.blocked;
  const end = new Date(day + 'T12:00:00');
  end.setDate(end.getDate() + 6);
  const last = end.toISOString().slice(0, 10);
  const selected = orders.filter(
    (o) =>
      o.delivery_date >= day &&
      o.delivery_date <= (period === 'week' ? last : day),
  );
  const productionOrders = selected.filter((o) => o.status !== 'pending');
  let demand: ReturnType<typeof productionDemand> | null = null,
    demandError = '';
  try {
    demand = productionDemand(
      data.items.filter((i) =>
        productionOrders.some((o) => o.id === i.order_id),
      ),
      recipes,
      data.ingredients,
    );
  } catch (e) {
    demandError = e instanceof Error ? e.message : 'Confira as fichas.';
  }
  const production = new Map<
    string,
    { name: string; option: string; quantity: number }
  >();
  for (const i of data.items.filter((i) =>
    productionOrders.some((o) => o.id === i.order_id),
  )) {
    const key = i.product_id + '|' + i.option_key;
    const v = production.get(key);
    if (v) v.quantity += i.quantity;
    else
      production.set(key, {
        name: i.snapshot.name,
        option: i.option_key,
        quantity: i.quantity,
      });
  }
  const [y, m] = month.split('-').map(Number),
    count = new Date(y, m, 0).getDate(),
    offset = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  function move(delta: number) {
    const d = new Date(y, m - 1 + delta, 1, 12);
    setMonth(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  }
  const block = data.blocks.find((b) => b.day === day);
  return (
    <div className="admin-form">
      <Panel
        title="Agenda"
        action={
          <div className="flex gap-1">
            <button
              className="ui-icon-action"
              aria-label="Mês anterior"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <input
              aria-label="Mês"
              type="month"
              className="ui-field"
              value={month}
              onChange={(e) => {
                if (e.target.value) setMonth(e.target.value);
              }}
            />
            <button
              className="ui-icon-action"
              aria-label="Mês seguinte"
              onClick={() => move(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        }
      >
        <div className="calendar-grid">
          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
            <span key={i} className="calendar-label">
              {d}
            </span>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={'gap' + i} />
          ))}
          {Array.from({ length: count }, (_, i) => {
            const key = month + '-' + String(i + 1).padStart(2, '0'),
              busy = orders.filter((o) => o.delivery_date === key).length,
              b = data.blocks.find((b) => b.day === key);
            return (
              <button
                key={key}
                aria-label={
                  key +
                  (b?.blocked ? ' · bloqueado' : '') +
                  ' · ' +
                  busy +
                  ' encomendas'
                }
                aria-pressed={key === day}
                className={b?.blocked ? 'blocked' : ''}
                onClick={() => setDay(key)}
              >
                {i + 1}
                <small>{b?.blocked ? '—' : busy || ' '}</small>
              </button>
            );
          })}
        </div>
      </Panel>
      <Metrics
        items={[
          {
            label: 'Encomendas do dia',
            value: orders.filter((o) => o.delivery_date === day).length,
          },
          {
            label: 'Capacidade de produção',
            value: blocked
              ? 'Bloqueada'
              : orders
                  .filter((o) => o.delivery_date === day)
                  .reduce((s, o) => s + o.capacity_units, 0) +
                ' / ' +
                capacity,
            hint: 'Unidades de produção, incluindo concluídas',
          },
        ]}
      />
      <Panel
        title="Produção consolidada"
        action={
          <select
            aria-label="Período de produção"
            className="ui-field"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="day">Dia selecionado</option>
            <option value="week">Próximos 7 dias</option>
          </select>
        }
      >
        <Field label="Data selecionada">
          <input
            type="date"
            className="ui-field"
            required
            value={day}
            onChange={(e) => {
              if (e.target.value) setDay(e.target.value);
            }}
          />
        </Field>
        {production.size ? (
          Array.from(production, ([key, p]) => (
            <div className="module-row" key={key}>
              <div>
                <p className="type-item">{p.name}</p>
                <p className="text-sm text-muted">{p.option}</p>
              </div>
              <strong>{p.quantity} un.</strong>
            </div>
          ))
        ) : (
          <Empty title="Nenhum item a produzir neste período" />
        )}
        {selected.map((o) => (
          <p key={o.id} className="text-sm mt-2">
            #{o.reference} · {o.customer_snapshot.name} · {labels[o.status]}
            {o.notes ? ' · ' + o.notes : ''}
          </p>
        ))}
      </Panel>
      <Panel
        title="Ingredientes e compras"
        description="Demanda de produção confirmada. Usa as fichas atuais, desconta o saldo cadastrado e exclui itens já disponíveis para pronta entrega."
      >
        {recipeError || demandError ? (
          <p role="alert" className="module-error">
            {recipeError || demandError}
          </p>
        ) : demand?.rows.length ? (
          <>
            {demand.rows.map((r, i) => (
              <div key={i} className="module-row">
                <div>
                  <p className="type-item">{r.name}</p>
                  <p className="text-sm text-muted">
                    Usar{' '}
                    {new Intl.NumberFormat('pt-PT', {
                      maximumFractionDigits: 3,
                    }).format(r.required)}{' '}
                    {r.unit} · Saldo {r.available} {r.unit}
                  </p>
                </div>
                <p className="text-sm">
                  Comprar{' '}
                  {new Intl.NumberFormat('pt-PT', {
                    maximumFractionDigits: 3,
                  }).format(r.toBuy)}{' '}
                  {r.unit}
                  {r.packages !== null ? ' · ' + r.packages + ' embal.' : ''}
                </p>
              </div>
            ))}
            <button
              className="ui-secondary"
              onClick={() => downloadJson('compras-' + day + '.json', demand)}
            >
              Exportar lista de compras
            </button>
          </>
        ) : (
          <Empty title="Sem demanda calculada">
            Associe fichas aos produtos encomendados para consolidar os insumos.
          </Empty>
        )}
        {!!demand?.missing.length && (
          <p className="text-sm text-primary">
            Fichas ou componentes ausentes: {demand.missing.join(', ')}. A lista
            está incompleta.
          </p>
        )}
        <p className="text-xs text-muted">
          Custos manuais são listados pelo nome, sem saldo de estoque associado.
          A lista não dá baixa automática nos insumos.
        </p>
      </Panel>
      <Panel
        title="Disponibilidade do dia"
        description="Bloquear impede novas reservas; encomendas existentes são preservadas."
      >
        <ActionForm
          key={day}
          action="calendar.save"
          token={token}
          onSaved={reload}
          submit="Guardar disponibilidade"
          build={(f) => ({
            day,
            blocked: f.get('blocked') === 'on',
            capacity: text(f, 'capacity') ? number(f, 'capacity') : null,
            reason: text(f, 'reason'),
          })}
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="blocked"
              defaultChecked={block?.blocked}
            />
            Bloquear novas encomendas neste dia
          </label>
          <div className="module-grid">
            <Field
              label="Capacidade especial (vazio usa o padrão)"
              name="capacity"
              type="number"
              min={0}
              max={10000}
              value={block?.capacity ?? ''}
            />
            <Field
              label="Motivo (opcional)"
              name="reason"
              maxLength={200}
              value={block?.reason}
            />
          </div>
        </ActionForm>
      </Panel>
    </div>
  );
}
