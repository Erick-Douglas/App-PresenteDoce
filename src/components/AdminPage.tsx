import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Header } from './Header';

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
          'page-width admin-content ' + (wide ? '' : 'admin-content-narrow')
        }
      >
        <div className="admin-heading">
          <button type="button" className="ui-quiet-action" onClick={onBack}>
            <ArrowLeft size={15} strokeWidth={1.65} aria-hidden="true" /> Voltar
          </button>
          <div className="flex w-full items-center justify-between gap-3">
            <h1 className="type-module text-primary">{title}</h1>
            {onRefresh && (
              <button
                type="button"
                className="ui-quiet-action"
                disabled={refreshing}
                onClick={onRefresh}
              >
                {refreshing ? 'A atualizar…' : 'Atualizar'}
              </button>
            )}
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  );
}
