import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { AppSelect } from "../../components/AppSelect";
import {
  ActionForm,
  cents,
  Empty,
  Field,
  Metrics,
  Panel,
  text,
} from "../../components/ModuleUI";
import { formatEuros } from "../../features/checkout/order";
import { downloadJson, today } from "../../features/platform/api";
import { useStore } from "../../features/platform/StoreProvider";
import type { FinanceEntry } from "../../features/platform/types";
import type { ModuleProps } from "../OperationsScreen";

export function FinanceModule({ data, token, reload }: ModuleProps) {
  const { store } = useStore();
  const paid = (id: string) =>
    data.finance
      .filter((f) => !f.voided_at && f.order_id === id)
      .reduce(
        (s, f) =>
          s +
          (f.type === "receipt"
            ? f.amount_cents
            : f.type === "refund"
              ? -f.amount_cents
              : 0),
        0,
      );
  const eligible = data.orders.filter(
    (o) =>
      ["confirmed", "production", "ready", "completed"].includes(o.status) &&
      paid(o.id) < o.total_cents,
  );
  const [month, setMonth] = useState(today(store.timezone).slice(0, 7)),
    [kind, setKind] = useState(eligible.length ? "receipt" : "expense");
  const [orderId, setOrderId] = useState(""),
    [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | null>(null),
    [deleting, setDeleting] = useState<FinanceEntry | null>(null);
  const allEntries = data.finance.filter((f) => f.day.startsWith(month)),
    entries = allEntries.filter((f) => !f.voided_at);
  const sum = (type: string) =>
    entries
      .filter((f) => f.type === type)
      .reduce((s, f) => s + f.amount_cents, 0);
  const selectable =
    kind === "refund" ? data.orders.filter((o) => paid(o.id) > 0) : eligible;
  const order = selectable.find((o) => o.id === orderId);
  const suggest = order
    ? (kind === "refund"
        ? paid(order.id)
        : Math.max(
            0,
            (paid(order.id) < order.deposit_cents
              ? order.deposit_cents
              : order.total_cents) - paid(order.id),
          )) / 100
    : "";
  const completed = data.orders.filter(
    (o) => o.status === "completed" && o.delivery_date.startsWith(month),
  );
  const items = data.items.filter((i) =>
      completed.some((o) => o.id === i.order_id),
    ),
    missing = items.filter((i) => i.unit_cost_cents === null).length;
  const revenue = completed.reduce((s, o) => s + o.total_cents, 0),
    cost = items.reduce((s, i) => s + (i.unit_cost_cents || 0) * i.quantity, 0);
  const close = () => {
    setEditing(null);
    setDeleting(null);
    setAdding(false);
  };
  return (
    <div className="admin-form">
      <div className="module-toolbar">
        <Field label="Mês financeiro">
          <input
            type="month"
            required
            className="ui-field"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        </Field>
        <div className="page-actions">
          <button
            className="ui-secondary"
            onClick={() =>
              downloadJson("financeiro-" + month + ".json", allEntries)
            }
          >
            Exportar movimentos
          </button>
          <button
            className="ui-primary"
            onClick={() => {
              close();
              setAdding(true);
            }}
          >
            <Plus size={15} />
            Novo movimento
          </button>
        </div>
      </div>
      <Metrics
        items={[
          {
            label: "Recebimentos",
            tone: "success",
            value: formatEuros(sum("receipt") / 100),
          },
          {
            label: "Estornos",
            tone: "warning",
            value: formatEuros(sum("refund") / 100),
          },
          { label: "Despesas", value: formatEuros(sum("expense") / 100) },
          {
            label: "Saldo de caixa do mês",
            value: formatEuros(
              (sum("receipt") - sum("refund") - sum("expense")) / 100,
            ),
          },
        ]}
      />
      {(adding || editing) && (
        <Panel
          focusOnOpen
          key={editing?.id || "new-movement"}
          title={editing ? "Editar movimento" : "Registrar movimento"}
          description={
            editing
              ? "A correção substitui o lançamento e preserva o histórico."
              : "Registre um valor recebido, devolvido ou pago."
          }
          action={
            <button type="button" className="ui-quiet-action" onClick={close}>
              <X size={15} />
              Fechar
            </button>
          }
        >
          <ActionForm
            key={(editing?.id || "new") + ":" + kind + ":" + orderId}
            action={editing ? "finance.correct" : "finance.record"}
            token={token}
            disabled={!editing && kind !== "expense" && !order}
            submit={editing ? "Guardar correção" : "Confirmar movimento"}
            onSaved={async () => {
              await reload();
              if (editing) close();
            }}
            build={(f, key) => {
              const replacement = {
                amount_cents: cents(f, "amount"),
                description: text(f, "description"),
                method: text(f, "method"),
                day: text(f, "day"),
              };
              return editing
                ? {
                    id: editing.id,
                    version: editing.version || 1,
                    idempotency_key: key,
                    replacement,
                  }
                : {
                    ...replacement,
                    idempotency_key: key,
                    type: kind,
                    ...(kind === "expense" ? {} : { order_id: order?.id }),
                  };
            }}
          >
            {!editing && (
              <div className="module-grid">
                <Field label="Movimento">
                  <AppSelect
                    value={kind}
                    onChange={(e) => {
                      setKind(e.target.value);
                      setOrderId("");
                    }}
                  >
                    <option value="receipt">
                      Recebimento (sinal ou saldo)
                    </option>
                    <option value="refund">Estorno ao cliente</option>
                    <option value="expense">Despesa da loja</option>
                  </AppSelect>
                </Field>
                {kind !== "expense" && (
                  <Field label="Encomenda">
                    <AppSelect
                      required
                      value={order?.id || ""}
                      onChange={(e) => setOrderId(e.target.value)}
                    >
                      <option value="">Escolher encomenda</option>
                      {selectable.map((o) => (
                        <option key={o.id} value={o.id}>
                          #{o.reference} · {o.customer_snapshot.name}
                        </option>
                      ))}
                    </AppSelect>
                  </Field>
                )}
              </div>
            )}
            {!editing && kind !== "expense" && !selectable.length && (
              <Empty
                title={
                  kind === "receipt"
                    ? "Sem encomendas com saldo a receber"
                    : "Sem recebimentos para estornar"
                }
              >
                {kind === "receipt"
                  ? "Crie ou confirme uma encomenda no módulo Encomendas. Para registrar uma compra ou custo, escolha Despesa da loja."
                  : "O estorno só fica disponível após registrar um recebimento."}
              </Empty>
            )}
            <div className="module-grid">
              <Field
                label={"Valor (" + store.currency + ")"}
                name="amount"
                inputMode="decimal"
                required
                value={editing ? editing.amount_cents / 100 : suggest}
              />
              <Field
                label="Data do movimento"
                name="day"
                type="date"
                required
                value={editing?.day || today(store.timezone)}
              />
              <Field
                label="Descrição"
                name="description"
                required
                maxLength={200}
                value={editing?.description || ""}
                placeholder={
                  kind === "expense"
                    ? "Ex.: Compra de ingredientes"
                    : "Ex.: Sinal do bolo de aniversário"
                }
              />
              <Field label="Forma">
                <AppSelect
                  name="method"
                  defaultValue={editing?.method || "MB WAY"}
                >
                  {Array.from(
                    new Set([
                      "MB WAY",
                      "Transferência",
                      "Dinheiro",
                      "Wise",
                      "Outro",
                      ...(editing ? [editing.method] : []),
                    ]),
                  ).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </AppSelect>
              </Field>
            </div>
          </ActionForm>
        </Panel>
      )}
      {deleting && (
        <Panel
          focusOnOpen
          key={deleting.id}
          title="Excluir movimento?"
          description="O valor deixa de contar nos saldos. O registro original fica no histórico para conferência."
          action={
            <button type="button" className="ui-secondary" onClick={close}>
              Cancelar
            </button>
          }
        >
          <p className="type-item">
            {deleting.description} · {formatEuros(deleting.amount_cents / 100)}
          </p>
          <ActionForm
            token={token}
            action="finance.correct"
            submit="Excluir movimento"
            onSaved={async () => {
              await reload();
              close();
            }}
            build={(_, key) => ({
              id: deleting.id,
              version: deleting.version || 1,
              idempotency_key: key,
              replacement: null,
            })}
          >
            <p className="text-sm text-muted">
              Use estorno quando houve devolução de dinheiro. Excluir serve para
              corrigir um registro incorreto.
            </p>
          </ActionForm>
        </Panel>
      )}
      <Panel
        title="Sinais e saldos"
        description="Encomendas confirmadas com valores por receber."
      >
        {eligible.length ? (
          eligible.slice(0, 8).map((o) => (
            <div key={o.id} className="module-row">
              <div>
                <p className="type-item">
                  #{o.reference} · {o.customer_snapshot.name}
                </p>
                <p className="text-sm text-muted">
                  Sinal pendente{" "}
                  {formatEuros(Math.max(0, o.deposit_cents - paid(o.id)) / 100)}{" "}
                  · Saldo{" "}
                  {formatEuros(Math.max(0, o.total_cents - paid(o.id)) / 100)}
                </p>
              </div>
              <button
                className="ui-secondary"
                onClick={() => {
                  close();
                  setKind("receipt");
                  setOrderId(o.id);
                  setAdding(true);
                }}
              >
                Registrar
              </button>
            </div>
          ))
        ) : (
          <Empty title="Sem valores pendentes">
            Recebimentos ficam disponíveis depois de confirmar uma encomenda.
          </Empty>
        )}
        {eligible.length > 8 && (
          <p className="text-sm text-muted">
            Mais {eligible.length - 8} encomendas disponíveis em Novo movimento.
          </p>
        )}
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
                    ? " · #" +
                      data.orders.find((o) => o.id === f.order_id)?.reference
                    : ""}
                </p>
              </div>
              <div className="movement-actions">
                <span
                  className={
                    "type-price " +
                    (f.type === "receipt"
                      ? "text-emerald-800"
                      : "text-on-surface")
                  }
                >
                  {f.type === "receipt" ? "+" : "−"}
                  {formatEuros(f.amount_cents / 100)}
                </span>
                <div className="page-actions">
                  <button
                    type="button"
                    className="ui-icon-action"
                    aria-label={"Editar movimento " + f.description}
                    onClick={() => {
                      close();
                      setEditing(f);
                    }}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="ui-icon-action"
                    data-destructive="true"
                    aria-label={"Excluir movimento " + f.description}
                    onClick={() => {
                      close();
                      setDeleting(f);
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <Empty title="Nenhum movimento neste mês">
            Use Novo movimento para começar.
          </Empty>
        )}
        {allEntries.some((f) => f.voided_at) && (
          <details className="module-collapse">
            <summary>Histórico de correções</summary>
            <div className="collapse-body">
              {allEntries
                .filter((f) => f.voided_at)
                .map((f) => (
                  <div className="module-row" key={f.id}>
                    <span>{f.description}</span>
                    <span className="text-xs text-muted">
                      {f.replaced_by ? "Corrigido" : "Excluído"} ·{" "}
                      {formatEuros(f.amount_cents / 100)}
                    </span>
                  </div>
                ))}
            </div>
          </details>
        )}
      </Panel>
      <details className="module-collapse">
        <summary>Resultado das entregas concluídas</summary>
        <div className="collapse-body">
          <Metrics
            items={[
              { label: "Vendas concluídas", value: formatEuros(revenue / 100) },
              {
                label: "Custos de ficha conhecidos",
                value: formatEuros(cost / 100),
              },
              {
                label: "Margem antes de despesas",
                value: missing
                  ? "Cálculo incompleto"
                  : formatEuros((revenue - cost) / 100),
                hint: missing
                  ? missing + " itens sem custo de ficha."
                  : "Custos registrados na data da encomenda.",
              },
            ]}
          />
          <p className="text-sm text-muted mt-3">
            Estimativa por competência; não equivale ao saldo de caixa.
            Considere despesas fixas, impostos e custos ainda não registrados.
          </p>
        </div>
      </details>
    </div>
  );
}
