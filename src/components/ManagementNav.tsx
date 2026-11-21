import { useStore } from "../features/platform/StoreProvider";
import {
  Calculator,
  CalendarDays,
  ClipboardList,
  Eye,
  EyeOff,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  Settings,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import type { View } from "../config/types";
export const managementLinks: {
  view: View;
  label: string;
  icon: typeof Store;
}[] = [
  { view: "home", label: "Vitrine", icon: Store },
  { view: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { view: "orders", label: "Encomendas", icon: ClipboardList },
  { view: "agenda", label: "Agenda e produção", icon: CalendarDays },
  { view: "finance", label: "Financeiro", icon: Wallet },
  { view: "customers", label: "Clientes", icon: Users },
  { view: "catalog-admin", label: "Catálogo", icon: Package },
  { view: "pricing", label: "Precificação", icon: Calculator },
  { view: "inventory", label: "Pronta entrega", icon: Package },
  { view: "ingredients", label: "Ingredientes", icon: Package },
  { view: "store-settings", label: "Configurações da loja", icon: Settings },
];
export function ManagementNav({
  current,
  onNavigate,
  onMenu,
  preview,
  onPreview,
}: {
  current: View;
  onNavigate: (v: View) => void;
  onMenu: () => void;
  preview: boolean;
  onPreview: () => void;
}) {
  const { settings } = useStore();
  return (
    <>
      <aside
        className={"management-rail " + (preview ? "is-preview" : "")}
        aria-label="Gestão da loja"
      >
        <div className="management-brand">Gestão da loja</div>
        <button className="ui-secondary preview-action" onClick={onPreview}>
          {preview ? <EyeOff size={16} /> : <Eye size={16} />}{" "}
          {preview ? "Voltar à gestão" : "Pré-visualizar como cliente"}
        </button>
        {!preview && (
          <nav>
            {managementLinks.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                disabled={
                  view === "inventory" && settings.preorder_only !== false
                }
                aria-current={current === view ? "page" : undefined}
                onClick={() => onNavigate(view)}
              >
                <Icon size={18} strokeWidth={1.6} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        )}
      </aside>
      <nav className="management-bottom" aria-label="Atalhos de gestão">
        {preview ? (
          <button onClick={onPreview}>
            <EyeOff size={18} />
            Voltar à gestão
          </button>
        ) : (
          <>
            {managementLinks
              .filter((l) =>
                ["home", "agenda", "customers", "finance"].includes(l.view),
              )
              .map(({ view, label, icon: Icon }) => (
                <button
                  key={view}
                  aria-current={current === view ? "page" : undefined}
                  onClick={() => onNavigate(view)}
                >
                  <Icon size={19} strokeWidth={1.6} />
                  <span>
                    {label === "Agenda e produção" ? "Agenda" : label}
                  </span>
                </button>
              ))}
          </>
        )}
      </nav>
    </>
  );
}
