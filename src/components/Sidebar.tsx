import { useAccount } from "../features/account/AccountProvider";
import { BUSINESS_INFO } from "../config/constants";
import { useStore } from "../features/platform/StoreProvider";
import {
  UserRound,
  Share2,
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
import { useEffect, useId, useRef, useState } from "react";
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
  const account = useAccount();
  const [shareNotice, setShareNotice] = useState("");
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

  async function share() {
    setShareNotice("");
    const { name, description, website } = BUSINESS_INFO;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: description, url: website });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(
        [name, description, website].join("\n"),
      );
      setShareNotice("Descrição e link copiados.");
    } catch {
      setShareNotice(website);
    }
  }
  const menuItems = [
    {
      icon: UserRound,
      label: "Perfil e aparência",
      action: () => account?.openAccount(),
    },
    { icon: Share2, label: "Partilhar catálogo", action: () => void share() },
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
      labels: [
        "Início",
        "Todas as categorias",
        "Favoritos",
        "Partilhar catálogo",
      ],
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
        "Perfil e aparência",
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
      items: menuItems
        .filter((item) => group.labels.includes(item.label))
        .sort(
          (a, b) =>
            group.labels.indexOf(a.label) - group.labels.indexOf(b.label),
        ),
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
      data-admin={isAdmin}
      className="store-menu bg-porcelain text-on-surface"
    >
      <div className="flex h-full flex-col">
        <div className="mx-5 flex items-center justify-between border-b border-outline pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <h2 id={titleId} className="type-module">
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

        <div className="store-menu-scroll overflow-y-auto overscroll-y-contain px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {shareNotice && (
            <p role="status" className="text-sm mb-3">
              {shareNotice}
            </p>
          )}
          <nav aria-label="Menu principal" className="menu-groups">
            {groups.map((group) => (
              <section key={group.title} className="sidebar-group">
                <h3>{group.title}</h3>
                <div className="menu-module-list">
                  {group.items.map(({ icon: Icon, label, action }) => (
                    <button
                      key={label}
                      disabled={
                        label === "Pronta entrega" &&
                        settings.preorder_only !== false
                      }
                      type="button"
                      onClick={() => {
                        if (label !== "Partilhar catálogo") dismiss();
                        action();
                      }}
                      className="menu-module-pill"
                    >
                      <span className="menu-module-icon">
                        <Icon
                          size={17}
                          strokeWidth={1.65}
                          aria-hidden="true"
                          className="menu-group-icon"
                        />
                      </span>
                      <span>
                        {label}
                        {label === "Pronta entrega" &&
                        settings.preorder_only !== false
                          ? " · Em breve"
                          : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </nav>
        </div>
      </div>
    </dialog>
  );
}
