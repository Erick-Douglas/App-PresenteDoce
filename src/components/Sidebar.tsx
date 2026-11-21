import { useStore } from "../features/platform/StoreProvider";
import {
  Download,
  Eye,
  FileText,
  Heart,
  Home,
  Info,
  LayoutGrid,
  LogIn,
  LogOut,
  Phone,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { View } from "../config/types";
import { managementLinks } from "./ManagementNav";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  isAdmin: boolean;
  onPreview?: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onInstall?: () => void;
  canInstallDirectly: boolean;
}

export function Sidebar({
  isOpen,
  onClose,
  onNavigate,
  isAdmin,
  onLogin,
  onPreview,
  onLogout,
  onInstall,
  canInstallDirectly,
}: SidebarProps) {
  const { settings } = useStore();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [isOpen]);

  if (!isOpen) return null;

  function dismiss() {
    ref.current?.close();
    onClose();
  }

  const menuItems = [
    { icon: Home, label: "Início", action: () => onNavigate("home") },
    {
      icon: LayoutGrid,
      label: "Todas as categorias",
      action: () => onNavigate("categories-list"),
    },
    { icon: Heart, label: "Favoritos", action: () => onNavigate("saved") },
    { icon: Info, label: "Sobre nós", action: () => onNavigate("settings") },
    { icon: Phone, label: "Contactos", action: () => onNavigate("contact") },
    ...(!isAdmin && onInstall
      ? [
          {
            icon: Download,
            label: canInstallDirectly ? "Instalar app" : "Como instalar",
            action: onInstall,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          ...(onPreview
            ? [
                {
                  icon: Eye,
                  label: "Pré-visualizar como cliente",
                  action: onPreview,
                },
              ]
            : []),
          ...managementLinks
            .filter((l) => l.view !== "home")
            .map((l) => ({
              icon: l.icon,
              label: l.view === "catalog-admin" ? "Gerir catálogo" : l.label,
              action: () => onNavigate(l.view),
            })),
          {
            icon: Plus,
            label: "Novo produto",
            action: () => onNavigate("product-editor"),
          },

          {
            icon: FileText,
            label: "Textos da loja",
            action: () => onNavigate("store-texts"),
          },
          { icon: LogOut, label: "Sair da conta", action: onLogout },
        ]
      : [{ icon: LogIn, label: "Entrar", action: onLogin }]),
  ];

  const groups = [
    {
      title: "Vitrine",
      labels: ["Início", "Todas as categorias", "Favoritos"],
    },
    {
      title: "Negócio",
      labels: [
        "Visão geral",
        "Encomendas",
        "Agenda e produção",
        "Financeiro",
        "Clientes",
      ],
    },
    {
      title: "Produtos e produção",
      labels: [
        "Gerir catálogo",
        "Novo produto",
        "Precificação",
        "Pronta entrega",
        "Ingredientes",
      ],
    },
    {
      title: "A sua loja",
      labels: [
        "Configurações da loja",
        "Textos da loja",
        "Sobre nós",
        "Contactos",
      ],
    },
    {
      title: "Conta",
      labels: [
        "Pré-visualizar como cliente",
        "Entrar",
        "Instalar app",
        "Como instalar",
        "Sair da conta",
      ],
    },
  ]
    .map((group) => ({
      ...group,
      items: menuItems.filter((item) => group.labels.includes(item.label)),
    }))
    .filter((group) => group.items.length);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
      className="fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-none w-[300px] max-w-[90vw] bg-porcelain text-on-surface shadow-xl backdrop:bg-overlay/50"
    >
      <div className="flex h-full flex-col">
        <div className="mx-5 flex items-center justify-between border-b border-outline pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <h2 id={titleId} className="type-module text-primary">
            Menu
          </h2>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={dismiss}
            className="-mr-1 grid size-11 place-items-center rounded-full text-muted hover:bg-primary/5 hover:text-primary"
          >
            <X size={19} strokeWidth={1.5} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-y-contain px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <nav aria-label="Menu principal" className="menu-groups">
            {groups.map((group) => (
              <section key={group.title} className="sidebar-group">
                <h3>{group.title}</h3>
                {group.items.map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    disabled={
                      label === "Pronta entrega" &&
                      settings.preorder_only !== false
                    }
                    type="button"
                    onClick={() => {
                      dismiss();
                      action();
                    }}
                    className="group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-on-surface transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.65}
                      aria-hidden="true"
                      className="menu-group-icon"
                    />
                    <span>
                      {label}
                      {label === "Pronta entrega" &&
                      settings.preorder_only !== false
                        ? " · Em breve"
                        : ""}
                    </span>
                  </button>
                ))}
              </section>
            ))}
          </nav>
        </div>
      </div>
    </dialog>
  );
}
