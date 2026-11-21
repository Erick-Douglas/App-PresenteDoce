import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Header } from "./Header";

export function AdminPage({
  title,
  wide,
  onMenu,
  onBack,
  children,
  onRefresh,
  refreshing,
}: {
  title: string;
  wide?: boolean;
  onMenu: () => void;
  onBack: () => void;
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="admin-page"
    >
      <div className="store-masthead">
        <Header onOpenMenu={onMenu} showShare={false} />
      </div>
      <div
        className={
          "page-width admin-content " + (wide ? "" : "admin-content-narrow")
        }
      >
        <div className="admin-heading">
          <div className="admin-page-title">
            <span className="page-eyebrow">Gestão da loja</span>
            <h1 className="type-module">{title}</h1>
          </div>
          <div className="page-actions">
            {onRefresh && (
              <button
                type="button"
                className="ui-secondary"
                disabled={refreshing}
                onClick={onRefresh}
              >
                <RefreshCw
                  size={15}
                  aria-hidden="true"
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "A atualizar…" : "Atualizar"}
              </button>
            )}
            <button type="button" className="ui-secondary" onClick={onBack}>
              <ArrowLeft size={15} strokeWidth={1.65} aria-hidden="true" />
              Voltar
            </button>
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  );
}
