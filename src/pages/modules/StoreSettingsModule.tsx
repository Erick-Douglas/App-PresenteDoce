import { readableBrand } from "../../design-system/brand";
import { AppSelect } from "../../components/AppSelect";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  ActionForm,
  cents,
  Field,
  number,
  Panel,
  text,
} from "../../components/ModuleUI";
import { options, useStore } from "../../features/platform/StoreProvider";
import {
  imageUrl,
  uploadProductImage,
} from "../../features/products/catalogApi";
import type { ModuleProps } from "../OperationsScreen";
type Option = { label: string; extra_cents: number };
function OptionsEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: Option[];
  onChange: (v: Option[]) => void;
}) {
  return (
    <details className="module-collapse">
      <summary>{title}</summary>
      <div className="collapse-body">
        <div className="module-section-heading">
          <h3 className="type-item">{title}</h3>
          <button
            type="button"
            className="ui-quiet-action"
            disabled={value.length >= 50}
            onClick={() => onChange([...value, { label: "", extra_cents: 0 }])}
          >
            <Plus size={15} />
            Adicionar
          </button>
        </div>
        {value.map((v, i) => (
          <div className="flex items-end gap-2 mb-3" key={i}>
            <Field label="Nome">
              <input
                required
                maxLength={80}
                className="ui-field"
                value={v.label}
                onChange={(e) =>
                  onChange(
                    value.map((o, n) =>
                      i === n ? { ...o, label: e.target.value } : o,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Acréscimo">
              <input
                required
                type="number"
                min={0}
                max={9999.99}
                step=".01"
                className="ui-field"
                value={v.extra_cents / 100}
                onChange={(e) =>
                  onChange(
                    value.map((o, n) =>
                      i === n
                        ? {
                            ...o,
                            extra_cents: Math.round(
                              Number(e.target.value) * 100,
                            ),
                          }
                        : o,
                    ),
                  )
                }
              />
            </Field>
            <button
              type="button"
              aria-label={"Remover " + (v.label || "opção")}
              className="ui-icon-action shrink-0"
              onClick={() => onChange(value.filter((_, n) => i !== n))}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </details>
  );
}
export function StoreSettingsModule({
  data,
  token,
  reload,
  rows,
}: ModuleProps) {
  const { reload: reloadStore } = useStore(),
    initial = data.settings.settings,
    [color, setColor] = useState(data.store.primary_color),
    [logo, setLogo] = useState(data.store.logo_url),
    [masses, setMasses] = useState(options(initial.cake_masses)),
    [fillings, setFillings] = useState(options(initial.cake_fillings)),
    [gallery, setGallery] = useState(initial.gallery),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  const categories = Array.from(
    new Map(rows.map((r) => [r.details.category, r.details.category])).values(),
  );
  // Gallery associations use real category IDs, including empty categories.
  const [categoryRows, setCategoryRows] = useState<
    { id: string; name: string }[]
  >([]);
  async function loadCategories() {
    const { listCatalogCategories } =
      await import("../../features/products/catalogApi");
    setCategoryRows(await listCatalogCategories());
  }
  async function upload(file: File | undefined, kind: "logo" | "gallery") {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      if (kind === "gallery" && !categoryRows.length) await loadCategories();
      const path = await uploadProductImage(file, token);
      if (kind === "logo") setLogo(path);
      else
        setGallery((items) => [
          ...items,
          { image: path, title: "", category_id: "" },
        ]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível enviar a imagem.",
      );
    } finally {
      setUploading(false);
    }
  }
  function move(index: number, delta: number) {
    setGallery((items) => {
      const next = [...items];
      const j = index + delta;
      if (j < 0 || j >= next.length) return items;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }
  return (
    <div className="admin-form">
      <Panel
        title="Identidade e funcionamento"
        description="Estas configurações atualizam a vitrine desta loja."
      >
        <ActionForm
          token={token}
          action="settings.save"
          submit="Guardar configurações"
          onSaved={async () => {
            await reload();
            await reloadStore();
          }}
          build={(f) => {
            if (uploading)
              throw Error("Aguarde o envio da imagem antes de guardar.");
            if (!readableBrand(color))
              throw Error(
                "Escolha um tom mais escuro para manter os textos brancos legíveis. A prévia mostra a cor antes de guardar.",
              );
            const unique = (list: Option[]) => {
              if (
                new Set(list.map((v) => v.label.trim().toLowerCase())).size !==
                list.length
              )
                throw Error("Evite nomes duplicados nas opções.");
              return list;
            };
            return {
              version: data.settings.version,
              store: {
                name: text(f, "name"),
                logo_url: logo,
                primary_color: color,
                currency: text(f, "currency"),
                timezone: text(f, "timezone"),
              },
              settings: {
                whatsapp: text(f, "whatsapp"),
                email: text(f, "email"),
                address: text(f, "address"),
                hours: text(f, "hours"),
                lead_days: number(f, "lead"),
                preorder_only: initial.preorder_only !== false,
                min_notice_hours: Math.max(
                  initial.preorder_only !== false ? 48 : 0,
                  initial.min_notice_hours ?? 48,
                ),
                daily_capacity: number(f, "capacity"),
                deposit_percent: number(f, "deposit"),
                delivery_enabled: f.get("delivery") === "on",
                delivery_fee_cents: text(f, "fee") ? cents(f, "fee") : null,
                cake_masses: unique(masses),
                cake_fillings: unique(fillings),
                gallery,
              },
            };
          }}
        >
          <details className="module-collapse" open>
            <summary>A sua marca</summary>
            <div className="collapse-body">
              <div className="module-grid">
                <Field
                  label="Nome da loja"
                  name="name"
                  value={data.store.name}
                  required
                  maxLength={100}
                />
                <div className="space-y-2">
                  <Field label="Cor de destaque">
                    <input
                      name="color"
                      className="ui-field"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      required
                    />
                  </Field>
                  <div
                    className="brand-preview"
                    style={{
                      backgroundColor: color,
                      color: readableBrand(color) ? "#fff" : "#1a1a1a",
                    }}
                  >
                    <span>Prévia da sua marca</span>
                    <strong>{color.toUpperCase()}</strong>
                  </div>
                  <p
                    className={
                      readableBrand(color)
                        ? "text-xs text-muted"
                        : "field-error text-xs"
                    }
                  >
                    {readableBrand(color)
                      ? "A cor é aplicada em toda a loja ao guardar."
                      : "Este tom é muito claro para os textos brancos. Escolha uma cor mais escura."}
                  </p>
                </div>
                <Field label="Moeda">
                  <AppSelect
                    className="ui-field"
                    name="currency"
                    defaultValue={data.store.currency}
                  >
                    {["EUR", "BRL", "USD", "GBP"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </AppSelect>
                </Field>
                <Field label="Fuso horário">
                  <AppSelect
                    name="timezone"
                    className="ui-field"
                    defaultValue={data.store.timezone}
                  >
                    {[
                      "Europe/Lisbon",
                      "Europe/London",
                      "America/Sao_Paulo",
                      "America/New_York",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </AppSelect>
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 items-center">
                <div className="bg-primary rounded-xl p-3">
                  <img
                    className="h-12 w-28 object-contain"
                    src={imageUrl(logo)}
                    alt="Logótipo atual"
                  />
                </div>
                <Field label="Enviar logótipo">
                  <input
                    type="file"
                    className="ui-field"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={(e) => void upload(e.target.files?.[0], "logo")}
                  />
                </Field>
              </div>
            </div>
          </details>
          <details className="module-collapse">
            <summary>Contactos e atendimento</summary>
            <div className="collapse-body">
              <div className="module-grid">
                <Field
                  label="WhatsApp com indicativo"
                  name="whatsapp"
                  type="tel"
                  value={initial.whatsapp}
                  required
                  maxLength={30}
                />
                <Field
                  label="E-mail"
                  name="email"
                  type="email"
                  value={initial.email}
                />
                <Field
                  label="Morada de recolha"
                  name="address"
                  value={initial.address}
                  maxLength={500}
                />
                <Field
                  label="Horários"
                  name="hours"
                  value={initial.hours}
                  maxLength={300}
                />
              </div>
            </div>
          </details>
          <details className="module-collapse">
            <summary>Encomendas e produção</summary>
            <div className="collapse-body">
              <div className="module-grid">
                <Field
                  label="Antecedência mínima (dias, pelo menos 48 horas)"
                  name="lead"
                  type="number"
                  min={initial.preorder_only !== false ? 2 : 0}
                  max={99}
                  value={Math.max(
                    initial.preorder_only !== false ? 2 : 0,
                    initial.lead_days,
                  )}
                  required
                />
                <Field
                  label="Capacidade diária (unidades de produção)"
                  name="capacity"
                  type="number"
                  min={0}
                  max={9999}
                  value={initial.daily_capacity}
                  required
                />
                <Field
                  label="Sinal previsto (%)"
                  name="deposit"
                  type="number"
                  min={0}
                  max={100}
                  value={initial.deposit_percent}
                  required
                />
                <Field
                  label="Taxa fixa de entrega (vazio: combinar)"
                  name="fee"
                  inputMode="decimal"
                  value={
                    initial.delivery_fee_cents === null
                      ? ""
                      : initial.delivery_fee_cents / 100
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm mt-3">
                <input
                  type="checkbox"
                  name="delivery"
                  defaultChecked={initial.delivery_enabled}
                />
                Disponibilizar entrega a combinar
              </label>
            </div>
          </details>
          <OptionsEditor
            title="Massas de bolo"
            value={masses}
            onChange={setMasses}
          />
          <OptionsEditor
            title="Recheios"
            value={fillings}
            onChange={setFillings}
          />
          <details className="module-collapse">
            <summary>Galeria de modelos</summary>
            <div className="collapse-body">
              <div className="module-section-heading">
                <div>
                  <h3 className="type-item">Galeria de modelos</h3>
                  <p className="text-sm text-muted mt-1">
                    Referências por categoria. A ordem abaixo será a ordem na
                    vitrine.
                  </p>
                </div>
              </div>
              <Field label="Adicionar imagem à galeria">
                <input
                  className="ui-field"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading || gallery.length >= 100}
                  onChange={(e) => void upload(e.target.files?.[0], "gallery")}
                />
              </Field>
              <button
                type="button"
                className="ui-quiet-action"
                onClick={() => void loadCategories()}
              >
                Carregar categorias da galeria
              </button>
              {gallery.map((item, index) => (
                <div key={item.image} className="module-gallery-editor">
                  <img
                    src={imageUrl(item.image)}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div className="min-w-0 space-y-2">
                    <Field label="Título">
                      <input
                        className="ui-field"
                        maxLength={100}
                        value={item.title}
                        onChange={(e) =>
                          setGallery((g) =>
                            g.map((v, i) =>
                              i === index ? { ...v, title: e.target.value } : v,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label="Categoria">
                      <AppSelect
                        className="ui-field"
                        required
                        value={item.category_id}
                        onFocus={() => {
                          if (!categoryRows.length) void loadCategories();
                        }}
                        onChange={(e) =>
                          setGallery((g) =>
                            g.map((v, i) =>
                              i === index
                                ? { ...v, category_id: e.target.value }
                                : v,
                            ),
                          )
                        }
                      >
                        <option value="">Escolher categoria</option>
                        {item.category_id &&
                          !categoryRows.some(
                            (c) => c.id === item.category_id,
                          ) && (
                            <option value={item.category_id}>
                              Categoria guardada
                            </option>
                          )}
                        {categoryRows.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </AppSelect>
                    </Field>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="ui-icon-action"
                        aria-label={"Subir modelo " + (index + 1)}
                        disabled={!index}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        className="ui-icon-action"
                        aria-label={"Descer modelo " + (index + 1)}
                        disabled={index === gallery.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        className="ui-icon-action"
                        aria-label={"Remover modelo " + (index + 1)}
                        onClick={() =>
                          setGallery((g) => g.filter((_, i) => i !== index))
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>
          {uploading && (
            <p role="status">A enviar imagem… Aguarde antes de guardar.</p>
          )}
          {error && (
            <p role="alert" className="module-error">
              {error}
            </p>
          )}
        </ActionForm>
      </Panel>
      <Panel title="Plano da loja">
        <p className="type-item">
          {data.entitlement.status === "internal"
            ? "Loja piloto · acesso interno"
            : data.entitlement.status === "trial"
              ? "Período de avaliação"
              : "Estado: " + data.entitlement.status}
        </p>
        {data.entitlement.expires_at && (
          <p className="text-sm text-muted mt-1">
            Válido até{" "}
            {new Intl.DateTimeFormat("pt-PT").format(
              new Date(data.entitlement.expires_at),
            )}
          </p>
        )}
        <p className="text-sm text-muted mt-3">
          A assinatura da plataforma será disponibilizada numa próxima etapa
          pela Stripe. A cobrança ainda não está ativa.
        </p>
      </Panel>
    </div>
  );
}
