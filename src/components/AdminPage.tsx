import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AvatarButton } from "../features/account/AccountProvider";
import { motion } from "framer-motion";
import { ArrowLeft, Menu, RefreshCw } from "lucide-react";
type Heading = { title: string; onBack?: () => void };
const Context = createContext<((value: Heading | null) => void) | null>(null);
export function useAdminHeading(title: string | undefined, onBack: () => void) {
  const set = useContext(Context);
  useEffect(() => {
    if (!set || !title) return;
    set({ title, onBack });
    return () => set(null);
  }, [set, title, onBack]);
}
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
  const [override, setOverride] = useState<Heading | null>(null);
  return (
    <Context.Provider value={setOverride}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="admin-page"
      >
        <header className="store-masthead module-masthead">
          <div className="page-width">
            <AvatarButton />
            <h1 className="type-module">{override?.title ?? title}</h1>
            <button
              type="button"
              aria-label="Voltar"
              className="store-icon-action"
              onClick={override?.onBack ?? onBack}
            >
              <ArrowLeft size={21} />
            </button>
            <button
              type="button"
              aria-label="Abrir menu"
              className="store-icon-action"
              onClick={onMenu}
            >
              <Menu size={21} strokeWidth={1.6} />
            </button>
          </div>
        </header>
        <div
          className={
            "page-width admin-content " + (wide ? "" : "admin-content-narrow")
          }
        >
          {onRefresh && !override && (
            <div className="module-refresh">
              <button
                type="button"
                className="ui-secondary"
                disabled={refreshing}
                onClick={onRefresh}
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "A atualizar…" : "Atualizar"}
              </button>
            </div>
          )}
          {children}
        </div>
      </motion.div>
    </Context.Provider>
  );
}
