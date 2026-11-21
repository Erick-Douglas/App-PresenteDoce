import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { storeAction } from "../features/platform/api";
export function Panel({
  title,
  description,
  action,
  children,
  focusOnOpen = false,
}: {
  title: string;
  focusOnOpen?: boolean;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!focusOnOpen) return;
    const frame = requestAnimationFrame(() => {
      panel.current?.focus({preventScroll:true});
      panel.current?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    });
    return () => cancelAnimationFrame(frame);
  }, [focusOnOpen]);
  return (
    <section ref={panel} tabIndex={focusOnOpen ? -1 : undefined} className="module-panel scroll-mt-4">
      <div className="module-section-heading">
        <div>
          <h2 className="type-section">{title}</h2>
          {description && (
            <p className="text-sm text-muted mt-1">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Field({
  label,
  name,
  type = "text",
  value,
  required = false,
  children,
  ...rest
}: {
  label: string;
  name?: string;
  type?: string;
  value?: string | number;
  required?: boolean;
  children?: ReactNode;
  [key: string]: any;
}) {
  const id = useId();
  const control = isValidElement(children) ? (
    cloneElement(children as ReactElement<any>, { id, "aria-label": label })
  ) : (
    <input
      id={id}
      aria-label={label}
      className="ui-field"
      type={type}
      name={name}
      defaultValue={value}
      required={required}
      {...rest}
    />
  );
  return (
    <label htmlFor={id} className="module-field">
      <span>{label}</span>
      {control}
    </label>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="module-empty">
      <p className="type-item">{title}</p>
      {children && <p className="text-sm text-muted mt-1">{children}</p>}
    </div>
  );
}
export function Metrics({
  items,
}: {
  items: {
    label: string;
    value: ReactNode;
    hint?: string;
    tone?: "success" | "warning" | "danger";
  }[];
}) {
  return (
    <dl className="module-metrics">
      {items.map((i) => (
        <div key={i.label} data-tone={i.tone}>
          <dt>{i.label}</dt>
          <dd>{i.value}</dd>
          {i.hint && <p>{i.hint}</p>}
        </div>
      ))}
    </dl>
  );
}
export function ActionForm({
  token,
  action,
  build,
  onSaved,
  children,
  submit = "Guardar",
  className = "",
  disabled = false,
}: {
  token: string;
  action: string;
  build: (f: FormData, key: string) => unknown;
  onSaved: () => void | Promise<void>;
  children: ReactNode;
  submit?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const key = useRef(crypto.randomUUID());
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await storeAction(action, build(new FormData(form), key.current), token);
      key.current = crypto.randomUUID();
      try {
        await onSaved();
        setNotice("Guardado.");
      } catch {
        setNotice("Guardado. Reabra o módulo para atualizar a lista.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onInvalidCapture={(e) => {
        let parent = (e.target as HTMLElement).parentElement;
        while (parent) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
          parent = parent.parentElement;
        }
      }}
      onSubmit={send}
      onChange={() => {
        if (!busy) {
          key.current = crypto.randomUUID();
          setNotice("");
          setError("");
        }
      }}
      className={"admin-form " + className}
    >
      <fieldset disabled={busy} className="admin-form">
        {children}
        <div className="form-actions">
          {notice && (
            <p role="status" className="form-notice">
              {notice}
            </p>
          )}
          <button
            className="ui-primary"
            type="submit"
            disabled={busy || disabled}
          >
            {busy ? "A guardar…" : submit}
          </button>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="module-error">
          {error} Os campos foram preservados.
        </p>
      )}
    </form>
  );
}
export function text(f: FormData, k: string) {
  return String(f.get(k) || "").trim();
}
export function number(f: FormData, k: string) {
  const raw = text(f, k).replace(",", ".");
  if (!raw || !/^\d+(\.\d{1,6})?$/.test(raw))
    throw Error("Confira os valores numéricos.");
  const n = Number(raw);
  if (!Number.isFinite(n)) throw Error("Valor inválido.");
  return n;
}
export function cents(f: FormData, k: string) {
  const v = number(f, k);
  if (Math.abs(v * 100 - Math.round(v * 100)) > 0.00001)
    throw Error("Use duas casas decimais nos valores.");
  return Math.round(v * 100);
}
