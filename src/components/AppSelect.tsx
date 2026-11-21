import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Check, ChevronDown } from "lucide-react";

type Props = SelectHTMLAttributes<HTMLSelectElement>;
type Choice = { value: string; label: string; disabled: boolean };
function choices(children: ReactNode, disabled = false): Choice[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<any>(child)) return [];
    const props = child.props as any;
    if (child.type === "option") {
      const label = Children.toArray(props.children).join("");
      return [
        {
          value: String(props.value ?? label),
          label,
          disabled: disabled || !!props.disabled,
        },
      ];
    }
    return choices(props.children, disabled || !!props.disabled);
  });
}
/** Native form value/validation, with an anchored and keyboard accessible list. */
export function AppSelect({
  children,
  className = "ui-field",
  onChange,
  onInvalid,
  ...props
}: Props) {
  const generated = useId(),
    id = props.id || generated;
  const native = useRef<HTMLSelectElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false),
    [invalid, setInvalid] = useState(false);
  const [value, setValue] = useState(
    String(props.value ?? props.defaultValue ?? ""),
  );
  const items = choices(children),
    selected = String(props.value ?? value);
  const [active, setActive] = useState(0),
    [inferredLabel, setInferredLabel] = useState("");
  useEffect(() => {
    const label = box.current?.closest("label");
    if (label)
      setInferredLabel(
        Array.from(label.childNodes)
          .filter((node) => node !== box.current)
          .map((node) => node.textContent || "")
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      );
  }, []);

  useEffect(() => {
    if (native.current && props.value === undefined)
      setValue(native.current.value);
  }, [children, props.value]);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  useEffect(() => {
    if (open)
      box.current
        ?.querySelector('[data-highlighted="true"]')
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  function choose(index: number) {
    const item = items[index],
      select = native.current;
    if (!item || item.disabled || !select) return;
    select.value = item.value;
    setValue(item.value);
    setInvalid(false);
    setOpen(false);
    select.dispatchEvent(new Event("change", { bubbles: true }));
    trigger.current?.focus({ preventScroll: true });
  }
  function move(step: number) {
    let next = active;
    for (let n = 0; n < items.length; n++) {
      next = (next + step + items.length) % items.length;
      if (!items[next].disabled) break;
    }
    setActive(next);
  }
  const label = props["aria-label"] || props.title || inferredLabel;
  return (
    <div ref={box} className="app-select" data-open={open}>
      <select
        {...props}
        id={id}
        ref={native}
        aria-hidden="true"
        tabIndex={-1}
        className="app-select-native"
        onInvalid={(e) => {
          e.preventDefault();
          setInvalid(true);
          trigger.current?.focus();
          onInvalid?.(e);
        }}
        onChange={(e) => {
          setValue(e.target.value);
          setInvalid(false);
          onChange?.(e);
        }}
      >
        {children}
      </select>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-label={label}
        aria-labelledby={props["aria-labelledby"]}
        aria-expanded={open}
        aria-controls={id + "-list"}
        aria-haspopup="listbox"
        aria-required={props.required}
        aria-invalid={invalid || undefined}
        aria-activedescendant={open ? id + "-option-" + active : undefined}
        disabled={props.disabled}
        onFocus={(e) => props.onFocus?.(e as any)}
        className={className + " app-select-trigger"}
        onClick={(e) => {
          e.preventDefault();
          setActive(
            Math.max(
              0,
              items.findIndex((i) => i.value === selected),
            ),
          );
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (
            [
              "ArrowDown",
              "ArrowUp",
              "Enter",
              " ",
              "Home",
              "End",
              "Escape",
            ].includes(e.key)
          )
            e.preventDefault();
          if (e.key === "Escape") setOpen(false);
          else if (e.key === "Tab") setOpen(false);
          else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            if (!open) {
              setOpen(true);
              setActive(
                Math.max(
                  0,
                  items.findIndex((i) => i.value === selected),
                ),
              );
            } else move(e.key === "ArrowDown" ? 1 : -1);
          } else if (e.key === "Home") {
            setOpen(true);
            setActive(0);
          } else if (e.key === "End") {
            setOpen(true);
            setActive(items.length - 1);
          } else if (e.key === "Enter" || e.key === " ") {
            if (open) choose(active);
            else {
              setOpen(true);
              setActive(
                Math.max(
                  0,
                  items.findIndex((i) => i.value === selected),
                ),
              );
            }
          } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            const i = items.findIndex(
              (i) =>
                !i.disabled &&
                i.label
                  .toLocaleLowerCase()
                  .startsWith(e.key.toLocaleLowerCase()),
            );
            if (i >= 0) {
              setActive(i);
              setOpen(true);
            }
          }
        }}
      >
        <span>
          {items.find((i) => i.value === selected)?.label ||
            items[0]?.label ||
            "Escolher"}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={id + "-list"}
          role="listbox"
          aria-label={label}
          className="app-select-list"
        >
          {items.map((item, i) => (
            <div
              key={i}
              id={id + "-option-" + i}
              role="option"
              aria-selected={item.value === selected}
              aria-disabled={item.disabled || undefined}
              data-highlighted={active === i}
              onPointerMove={() => setActive(i)}
              onPointerDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                choose(i);
              }}
            >
              <span>{item.label}</span>
              {item.value === selected && (
                <Check size={15} aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      )}
      {invalid && (
        <small role="alert" className="field-error">
          Selecione uma opção da lista.
        </small>
      )}
    </div>
  );
}
