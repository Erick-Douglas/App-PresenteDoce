import { useState } from 'react';
import {
  ActionForm,
  cents,
  Empty,
  Field,
  Metrics,
  Panel,
  text,
} from '../../components/ModuleUI';
import { formatEuros } from '../../features/checkout/order';
import { downloadJson, today } from '../../features/platform/api';
import { useStore } from '../../features/platform/StoreProvider';
import type { ModuleProps } from '../OperationsScreen';
export function FinanceModule({ data, token, reload }: ModuleProps) {
  const { store } = useStore(),
    [month, setMonth] = useState(today(store.timezone).slice(0, 7)),
    [kind, setKind] = useState('receipt'),
    [orderId, setOrderId] = useState('');
  const entries = data.finance.filter((f) => f.day.startsWith(month)),
    sum = (type: string) =>
      entries
        .filter((f) => f.type === type)
        .reduce((s, f) => s + f.amount_cents, 0);
  const paid = (id: string) =>
    data.finance
      .filter((f) => f.order_id === id)
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
  const active = data.orders.filter(
      (o) => !['draft', 'canceled', 'expired'].includes(o.status),
    ),
    order = data.orders.find((o) => o.id === orderId);
  const completed = data.orders.filter(
    (o) => o.status === 'completed' && o.delivery_date.startsWith(month),
  );
  const items = data.items.filter((i) =>
      completed.some((o) => o.id === i.order_id),
    ),
    missing = items.filter((i) => i.unit_cost_cents === null).length;
  const revenue = completed.reduce((s, o) => s + o.total_cents, 0),
    cost = items.reduce((s, i) => s + (i.unit_cost_cents || 0) * i.quantity, 0);
  return (
    <div className="admin-form">
      <div className="module-toolbar">
        <Field label="Mês financeiro">
          <input
            aria-label="Mês financeiro"
            type="month"
            required
            className="ui-field"
            value={month}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
          />
        </Field>
        <button
          className="ui-secondary"
          onClick={() => downloadJson('financeiro-' + month + '.json', entries)}
        >
          Exportar movimentos
        </button>
      </div>
      <Metrics
        items={[
          { label: 'Recebimentos', value: formatEuros(sum('receipt') / 100) },
          { label: 'Estornos', value: formatEuros(sum('refund') / 100) },
          { label: 'Despesas', value: formatEuros(sum('expense') / 100) },
          {
            label: 'Saldo de caixa do mês',
            value: formatEuros(
              (sum('receipt') - sum('refund') - sum('expense')) / 100,
            ),
          },
        ]}
      />
      <Panel
        title="Sinais e saldos"
        description="Valores pendentes das encomendas em curso."
      >
        {active.length ? (
          active.map((o) => (
            <div key={o.id} className="module-row">
              <div>
                <p className="type-item">
                  #{o.reference} · {o.customer_snapshot.name}
                </p>
                <p className="text-sm text-muted">
                  Sinal pendente{' '}
                  {formatEuros(Math.max(0, o.deposit_cents - paid(o.id)) / 100)}{' '}
                  · Saldo total{' '}
                  {formatEuros(Math.max(0, o.total_cents - paid(o.id)) / 100)}
                </p>
              </div>
              <button
                className="ui-secondary"
                onClick={() => {
                  setOrderId(o.id);
                  setKind('receipt');
                }}
              >
                Registrar
              </button>
            </div>
          ))
        ) : (
          <Empty title="Sem valores pendentes" />
        )}
      </Panel>
      <Panel
        title="Registrar movimento"
        description="O registro financeiro é permanente. Para corrigir um recebimento, registre o estorno correspondente."
      >
        <ActionForm
          key={orderId + kind}
          action="finance.record"
          token={token}
          onSaved={reload}
          submit="Confirmar movimento"
          build={(f, key) => ({
            idempotency_key: key,
            type: kind,
            amount_cents: cents(f, 'amount'),
            description: text(f, 'description'),
            method: text(f, 'method'),
            day: text(f, 'day'),
            ...(kind === 'expense' ? {} : { order_id: orderId }),
          })}
        >
          <div className="module-grid">
            <Field label="Movimento">
              <select
                className="ui-field"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="receipt">Recebimento (sinal ou saldo)</option>
                <option value="refund">Estorno ao cliente</option>
                <option value="expense">Despesa da loja</option>
              </select>
            </Field>
            {kind !== 'expense' && (
              <Field label="Encomenda">
                <select
                  className="ui-field"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                >
                  <option value="">Escolher encomenda</option>
                  {data.orders
                    .filter((o) => o.status !== 'draft')
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.reference} · {o.customer_snapshot.name}
                      </option>
                    ))}
                </select>
              </Field>
            )}
            <Field
              label={'Valor (' + store.currency + ')'}
              name="amount"
              inputMode="decimal"
              required
              value={
                order
                  ? (kind === 'refund'
                      ? Math.max(0, paid(order.id))
                      : Math.max(
                          0,
                          (paid(order.id) < order.deposit_cents
                            ? order.deposit_cents
                            : order.total_cents) - paid(order.id),
                        )) / 100
                  : ''
              }
            />
            <Field
              label="Data do movimento"
              name="day"
              type="date"
              value={today(store.timezone)}
              required
            />
            <Field
              label="Descrição"
              name="description"
              maxLength={200}
              value={
                kind === 'expense'
                  ? ''
                  : kind === 'refund'
                    ? 'Estorno'
                    : 'Recebimento de encomenda'
              }
              required
            />
            <Field label="Forma">
              <select name="method" className="ui-field">
                <option>MB WAY</option>
                <option>Transferência</option>
                <option>Dinheiro</option>
                <option>Wise</option>
                <option>Outro</option>
              </select>
            </Field>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required />
            Confirmei que este valor foi efetivamente recebido, devolvido ou
            pago.
          </label>
        </ActionForm>
      </Panel>
      <Panel
        title="Resultado das entregas concluídas"
        description="Estimativa por competência; não equivale ao saldo de caixa."
      >
        <Metrics
          items={[
            { label: 'Vendas concluídas', value: formatEuros(revenue / 100) },
            {
              label: 'Custos de ficha conhecidos',
              value: formatEuros(cost / 100),
            },
            {
              label: 'Margem antes de despesas',
              value: missing
                ? 'Cálculo incompleto'
                : formatEuros((revenue - cost) / 100),
              hint: missing
                ? missing + ' itens sem custo de ficha.'
                : 'Custos registrados na data da encomenda.',
            },
          ]}
        />
        <p className="text-sm text-muted mt-3">
          Despesas fixas, impostos e custos ainda não registrados devem ser
          considerados na apuração do lucro líquido. O histórico mantém o custo
          vigente na venda.
        </p>
      </Panel>
      <Panel title="Movimentos do mês">
        {entries.length ? (
          entries.map((f) => (
            <div className="module-row" key={f.id}>
              <div>
                <p className="type-item">{f.description}</p>
                <p className="text-sm text-muted">
                  {f.day} · {f.method}
                  {f.order_id
                    ? ' · #' +
                      data.orders.find((o) => o.id === f.order_id)?.reference
                    : ''}
                </p>
              </div>
              <span
                className={
                  'type-price ' +
                  (f.type === 'receipt' ? 'text-emerald-800' : 'text-primary')
                }
              >
                {f.type === 'receipt' ? '+' : '−'}
                {formatEuros(f.amount_cents / 100)}
              </span>
            </div>
          ))
        ) : (
          <Empty title="Nenhum movimento neste mês" />
        )}
      </Panel>
    </div>
  );
}
