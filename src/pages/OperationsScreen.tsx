import { ArrowRight, Download, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Empty, Metrics, Panel } from '../components/ModuleUI';
import type { View } from '../config/types';
import { formatEuros } from '../features/checkout/order';
import { downloadJson, today } from '../features/platform/api';
import { useStore } from '../features/platform/StoreProvider';
import type { Snapshot } from '../features/platform/types';
import type { CatalogRow } from '../features/products/catalogApi';
import { FinanceModule } from './modules/FinanceModule';
import { AgendaModule, OrdersModule } from './modules/OrdersModule';
import {
  CustomersModule,
  IngredientsModule,
  InventoryModule,
} from './modules/RecordsModule';
import { StoreSettingsModule } from './modules/StoreSettingsModule';
export type ModuleProps = {
  data: Snapshot;
  token: string;
  reload: () => Promise<void>;
  rows: CatalogRow[];
};
export default function OperationsScreen({
  view,
  data,
  token,
  reload,
  rows,
  onNavigate,
}: { view: View; onNavigate: (v: View) => void } & ModuleProps) {
  const props = { data, token, reload, rows };
  const { store } = useStore();
  const day = today(store.timezone),
    [query, setQuery] = useState('');
  if (view === 'orders') return <OrdersModule {...props} />;
  if (view === 'agenda') return <AgendaModule {...props} />;
  if (view === 'finance') return <FinanceModule {...props} />;
  if (view === 'customers') return <CustomersModule {...props} />;
  if (view === 'inventory') return <InventoryModule {...props} />;
  if (view === 'ingredients') return <IngredientsModule {...props} />;
  if (view === 'store-settings') return <StoreSettingsModule {...props} />;
  const active = data.orders.filter(
      (o) => !['draft', 'canceled', 'expired', 'completed'].includes(o.status),
    ),
    due = active.filter((o) => o.delivery_date === day);
  const net = (id: string) =>
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
  const month = day.slice(0, 7),
    cash = data.finance
      .filter((f) => f.day.startsWith(month))
      .reduce(
        (s, f) => s + (f.type === 'receipt' ? f.amount_cents : -f.amount_cents),
        0,
      );
  return (
    <div className="admin-form">
      <div className="module-welcome">
        <div>
          <p className="text-sm text-muted">O seu negócio, num só lugar</p>
          <h2 className="type-module">Vamos organizar o dia?</h2>
        </div>
        <button className="ui-secondary" onClick={() => onNavigate('orders')}>
          <Plus size={16} /> Gerir encomendas
        </button>
      </div>
      <Metrics
        items={[
          { label: 'Encomendas em curso', value: active.length },
          { label: 'Produção de hoje', value: due.length },
          {
            label: 'Sinais por receber',
            value: formatEuros(
              active.reduce(
                (s, o) => s + Math.max(0, o.deposit_cents - net(o.id)),
                0,
              ) / 100,
            ),
          },
          {
            label: 'Caixa do mês',
            value: formatEuros(cash / 100),
            hint: 'Recebimentos − estornos − despesas',
          },
        ]}
      />
      <Panel title="Acesso rápido">
        <div className="module-shortcuts">
          {[
            ['agenda', 'Agenda e produção'],
            ['pricing', 'Calcular preços'],
            ['inventory', 'Ajustar pronta entrega'],
            ['catalog-admin', 'Organizar catálogo'],
          ].map(([v, label]) => (
            <button
              key={v}
              className="ui-secondary"
              onClick={() => onNavigate(v as View)}
            >
              {label}
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      </Panel>
      <Panel
        title="Próximas entregas"
        action={
          <button
            className="ui-quiet-action"
            onClick={() => onNavigate('orders')}
          >
            Ver encomendas
          </button>
        }
      >
        <label className="module-search">
          <Search size={17} />
          <input
            aria-label="Pesquisar entregas"
            placeholder="Cliente ou número da encomenda"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {active
          .filter((o) =>
            (o.reference + ' ' + o.customer_snapshot.name)
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .sort((a, b) => a.delivery_date.localeCompare(b.delivery_date))
          .slice(0, 8)
          .map((o) => (
            <div className="module-row" key={o.id}>
              <div>
                <p className="type-item">
                  #{o.reference} · {o.customer_snapshot.name}
                </p>
                <p className="text-sm text-muted">
                  {o.delivery_date} ·{' '}
                  {o.fulfillment === 'pickup' ? 'Recolha' : 'Entrega'}
                </p>
              </div>
              <span className="type-price">
                {formatEuros(o.total_cents / 100)}
              </span>
            </div>
          ))}
        {!active.length && (
          <Empty title="Tudo pronto para a primeira encomenda">
            Registre encomendas recebidas no WhatsApp ou acompanhe os pedidos da
            vitrine.
          </Empty>
        )}
      </Panel>
      <Panel title="Seus dados">
        <p className="text-sm text-muted">
          Exporte uma cópia dos registros desta loja. O arquivo contém dados de
          clientes e deve ficar num local privado.
        </p>
        <button
          className="ui-secondary mt-3"
          onClick={() =>
            downloadJson('loja-' + store.slug + '-' + day + '.json', data)
          }
        >
          <Download size={15} />
          Exportar dados da loja
        </button>
      </Panel>
    </div>
  );
}
