import { AppSelect } from "../../components/AppSelect";
import { MessageCircle, Plus } from "lucide-react";
import { useState } from "react";
import {
  ActionForm,
  cents,
  Empty,
  Field,
  Metrics,
  number,
  Panel,
  text,
} from "../../components/ModuleUI";
import { formatEuros } from "../../features/checkout/order";
import { useStore } from "../../features/platform/StoreProvider";
import type { ModuleProps } from "../OperationsScreen";
export function CustomersModule({ data, token, reload }: ModuleProps) {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [archived, setArchived] = useState(false);
  const customer = data.customers.find((c) => c.id === selected),
    orders = data.orders.filter((o) => o.customer_id === selected);
  return (
    <div className="admin-form">
      <div className="module-toolbar">
        <Field label="Pesquisar clientes">
          <input
            className="ui-field"
            value={query}
            placeholder="Nome, telefone ou e-mail"
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
          Ver arquivados
        </label>
        <button className="ui-primary" onClick={() => setSelected("new")}>
          <Plus size={15} />
          Novo cliente
        </button>
      </div>
      {selected !== null && (
        <Panel
          title={customer ? "Editar cliente" : "Novo cliente"}
          action={
            <button
              className="ui-quiet-action"
              onClick={() => setSelected(null)}
            >
              Fechar
            </button>
          }
        >
          <ActionForm
            key={selected + ":" + customer?.version}
            action="customer.save"
            token={token}
            onSaved={reload}
            build={(f) => ({
              ...(customer
                ? { id: customer.id, version: customer.version }
                : {}),
              data: {
                name: text(f, "name"),
                phone: text(f, "phone"),
                email: text(f, "email"),
                address: text(f, "address"),
                notes: text(f, "notes"),
                ...(customer ? { archived: f.get("archived") === "on" } : {}),
              },
            })}
          >
            <div className="module-grid">
              <Field
                label="Nome"
                name="name"
                value={customer?.name}
                required
                maxLength={100}
              />
              <Field
                label="Telefone"
                name="phone"
                type="tel"
                value={customer?.phone}
                required
                maxLength={30}
              />
              <Field
                label="E-mail"
                name="email"
                type="email"
                value={customer?.email}
              />
              <Field
                label="Morada"
                name="address"
                value={customer?.address}
                maxLength={500}
              />
            </div>
            <Field label="Preferências e notas">
              <textarea
                name="notes"
                className="ui-field"
                rows={2}
                maxLength={2000}
                defaultValue={customer?.notes}
              />
            </Field>
            {customer && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  name="archived"
                  type="checkbox"
                  defaultChecked={customer.archived}
                />
                Arquivar contacto (preserva o histórico)
              </label>
            )}
          </ActionForm>
          {customer && (
            <>
              <a
                className="ui-secondary inline-flex mt-4"
                href={"https://wa.me/" + customer.phone.replace(/\D/g, "")}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={15} />
                Conversar no WhatsApp
              </a>
              <h3 className="type-item mt-5">Histórico de encomendas</h3>
              {orders.length ? (
                orders.map((o) => (
                  <div key={o.id} className="module-row">
                    <p>
                      #{o.reference} · {o.delivery_date}
                    </p>
                    <span>{formatEuros(o.total_cents / 100)}</span>
                  </div>
                ))
              ) : (
                <Empty title="Ainda sem encomendas" />
              )}
            </>
          )}
        </Panel>
      )}
      <Panel
        title="Base de clientes"
        description="Pedidos recebidos criam contactos. Una duplicados apenas depois de conferir a identidade."
      >
        {data.customers
          .filter(
            (c) =>
              (archived || !c.archived) &&
              (c.name + " " + c.phone + " " + c.email)
                .toLowerCase()
                .includes(query.toLowerCase()),
          )
          .map((c) => (
            <button
              key={c.id}
              className="module-row module-row-button"
              onClick={() => setSelected(c.id)}
            >
              <div>
                <p className="type-item">
                  {c.name}
                  {c.archived ? " · Arquivado" : ""}
                </p>
                <p className="text-sm text-muted">
                  {c.phone} · {c.email || "Sem e-mail"}
                </p>
              </div>
              <span className="module-badge">
                {data.orders.filter((o) => o.customer_id === c.id).length}{" "}
                pedidos
              </span>
            </button>
          ))}
        {!data.customers.length && (
          <Empty title="Conheça melhor os seus clientes">
            Registre preferências e consulte o histórico por contacto.
          </Empty>
        )}
      </Panel>
      {data.customers.length > 1 && (
        <Panel
          title="Unir contactos duplicados"
          description="Transfere o histórico para o contacto mantido e arquiva o duplicado. Notas antigas continuam no contacto arquivado."
        >
          <ActionForm
            action="customer.merge"
            token={token}
            submit="Unir contactos"
            onSaved={reload}
            build={(f) => ({
              source: text(f, "source"),
              target: text(f, "target"),
            })}
          >
            <div className="module-grid">
              {[
                ["source", "Contacto duplicado"],
                ["target", "Contacto a manter"],
              ].map(([name, label]) => (
                <Field key={name} label={label}>
                  <AppSelect name={name} className="ui-field" required>
                    <option value="">Escolher</option>
                    {data.customers
                      .filter((c) => !c.archived)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {c.phone}
                        </option>
                      ))}
                  </AppSelect>
                </Field>
              ))}
            </div>
            <label className="flex gap-2 text-sm">
              <input required type="checkbox" />
              Conferi que estes contactos são da mesma pessoa.
            </label>
          </ActionForm>
        </Panel>
      )}
    </div>
  );
}
export function InventoryModule({ data, token, reload, rows }: ModuleProps) {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState(""),
    [limit, setLimit] = useState(8);
  const choices = rows.flatMap((r) =>
    (r.details.variants?.length
      ? r.details.variants.map((v) => v.label)
      : [""]
    ).map((option) => ({
      key: JSON.stringify([r.id, option]),
      id: r.id,
      name: r.details.name,
      option,
    })),
  );
  const choice = choices.find((c) => c.key === selected),
    available = (id: string, option: string) =>
      data.stock.find((s) => s.product_id === id && s.option_key === option)
        ?.available || 0;
  return (
    <div className="admin-form">
      <Metrics
        items={[
          {
            label: "Unidades disponíveis",
            value: data.stock.reduce((s, i) => s + i.available, 0),
          },
          {
            label: "Produtos com pronta entrega",
            value: rows.filter((r) => r.details.saleModes?.includes("ready"))
              .length,
          },
        ]}
      />
      <Panel
        title="Ajustar estoque"
        description="Este saldo controla as unidades disponíveis para venda hoje. Encomendas reservam automaticamente."
      >
        <Field label="Produto e opção">
          <AppSelect
            className="ui-field"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Escolher produto</option>
            {choices.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
                {c.option ? " · " + c.option : ""} · {available(c.id, c.option)}{" "}
                un.
              </option>
            ))}
          </AppSelect>
        </Field>
        {choice && (
          <ActionForm
            key={choice.key}
            token={token}
            action="stock.adjust"
            onSaved={reload}
            submit="Confirmar ajuste"
            build={(f, key) => ({
              product_id: choice.id,
              option: choice.option,
              delta:
                number(f, "quantity") *
                (text(f, "direction") === "remove" ? -1 : 1),
              reason: text(f, "reason"),
              idempotency_key: key,
            })}
          >
            <div className="module-grid">
              <Field label="Movimento">
                <AppSelect className="ui-field" name="direction">
                  <option value="add">Adicionar unidades</option>
                  <option value="remove">Retirar unidades</option>
                </AppSelect>
              </Field>
              <Field
                label="Quantidade"
                name="quantity"
                type="number"
                min={1}
                max={100000}
                step={1}
                required
              />
              <Field
                label="Motivo"
                name="reason"
                required
                maxLength={200}
                placeholder="Produção do dia, perda ou ajuste"
              />
            </div>
          </ActionForm>
        )}
      </Panel>
      <details className="module-collapse" open={!!query}>
        <summary>Consultar saldos · {choices.length} produtos e opções</summary>
        <div className="collapse-body">
          <Field label="Pesquisar produto">
            <input
              className="ui-field"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(8);
              }}
            />
          </Field>
          {choices
            .filter((c) =>
              (c.name + " " + c.option)
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .slice(0, limit)
            .map((c) => (
              <button
                key={c.key}
                className="module-row module-row-button"
                onClick={() => setSelected(c.key)}
              >
                <div>
                  <p className="type-item">{c.name}</p>
                  <p className="text-sm text-muted">{c.option || "Unidade"}</p>
                </div>
                <span className="module-badge">
                  {available(c.id, c.option)} un.
                </span>
              </button>
            ))}
          {choices.filter((c) =>
            (c.name + " " + c.option)
              .toLowerCase()
              .includes(query.toLowerCase()),
          ).length > limit && (
            <div className="page-actions">
              <button
                className="ui-secondary"
                onClick={() => setLimit((n) => n + 8)}
              >
                Mostrar mais
              </button>
            </div>
          )}
        </div>
      </details>
      <details className="module-collapse">
        <summary>Reservas e histórico</summary>
        <div className="collapse-body">
          <p className="text-sm text-muted">
            As movimentações e reservas ficam registradas para auditoria. Não
            apague produtos com histórico: despublique-os no catálogo.
          </p>
        </div>
      </details>
    </div>
  );
}
export function IngredientsModule({ data, token, reload }: ModuleProps) {
  const { store } = useStore(),
    [selected, setSelected] = useState<string | null>(null),
    [query, setQuery] = useState("");
  const item = data.ingredients.find((i) => i.id === selected);
  return (
    <div className="admin-form">
      <div className="module-toolbar">
        <Field label="Pesquisar ingrediente">
          <input
            className="ui-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <button className="ui-primary" onClick={() => setSelected("new")}>
          <Plus size={15} />
          Novo ingrediente
        </button>
      </div>
      {selected !== null && (
        <Panel
          title={item ? "Editar ingrediente" : "Novo ingrediente"}
          description="Atualizar o preço recalcula as fichas vinculadas. O custo histórico das encomendas é preservado."
          action={
            <button
              className="ui-quiet-action"
              onClick={() => setSelected(null)}
            >
              Fechar
            </button>
          }
        >
          <ActionForm
            key={selected + ":" + item?.version}
            action="ingredient.save"
            token={token}
            onSaved={reload}
            build={(f) => ({
              ...(item ? { id: item.id, version: item.version } : {}),
              data: {
                name: text(f, "name"),
                brand: text(f, "brand"),
                unit: text(f, "unit"),
                pack_quantity: number(f, "quantity"),
                pack_price_cents: cents(f, "price"),
                stock_quantity: number(f, "stock"),
              },
            })}
          >
            <div className="module-grid">
              <Field
                label="Ingrediente"
                name="name"
                value={item?.name}
                required
                maxLength={100}
              />
              <Field
                label="Marca (opcional)"
                name="brand"
                value={item?.brand}
                maxLength={100}
              />
              <Field label="Unidade">
                <AppSelect
                  className="ui-field"
                  name="unit"
                  defaultValue={item?.unit || "g"}
                >
                  <option value="g">Gramas (g)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="un">Unidades</option>
                </AppSelect>
              </Field>
              <Field
                label="Quantidade na embalagem"
                name="quantity"
                inputMode="decimal"
                value={item?.pack_quantity}
                required
              />
              <Field
                label={"Preço da embalagem (" + store.currency + ")"}
                name="price"
                inputMode="decimal"
                value={item ? item.pack_price_cents / 100 : ""}
                required
              />
              <Field
                label="Saldo de insumo (mesma unidade)"
                name="stock"
                inputMode="decimal"
                value={item?.stock_quantity || 0}
                required
              />
            </div>
          </ActionForm>
        </Panel>
      )}
      <Panel
        title="Insumos e custos"
        description="Para 1 kg, cadastre 1000 g. Vincule estes insumos nas fichas de precificação."
      >
        {data.ingredients
          .filter((i) =>
            (i.name + " " + i.brand)
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((i) => (
            <button
              className="module-row module-row-button"
              key={i.id}
              onClick={() => setSelected(i.id)}
            >
              <div>
                <p className="type-item">{i.name}</p>
                <p className="text-sm text-muted">
                  {i.brand || "Sem marca"} · {i.pack_quantity} {i.unit} · Saldo{" "}
                  {i.stock_quantity} {i.unit}
                </p>
              </div>
              <span className="type-price">
                {formatEuros(i.pack_price_cents / 100)}
              </span>
            </button>
          ))}
        {!data.ingredients.length && (
          <Empty title="Seu primeiro ingrediente começa aqui">
            Cadastre embalagem e preço uma vez para reutilizar nas fichas.
          </Empty>
        )}
      </Panel>
    </div>
  );
}
