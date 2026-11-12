import React, { useState, useCallback, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { useCart } from './features/cart/useCart';
import { useCatalog } from './features/products/useCatalog';
import { useFavorites } from './features/products/useFavorites';
import { signOut, toProduct, type CatalogRow, type CatalogSession } from './features/products/catalogApi';
import { readRecoveryCallback } from './features/products/adminLink';

import { Product, View, CartItem } from './config/types';

import { WelcomeScreen } from './pages/WelcomeScreen';
import { HomeScreen } from './pages/HomeScreen';
import { ProductListScreen } from './pages/ProductListScreen';
import { ProductDetailScreen } from './pages/ProductDetailScreen';
import { CartScreen } from './pages/CartScreen';
import { SavedScreen } from './pages/SavedScreen';
import { SettingsScreen } from './pages/SettingsScreen';
import { CategoriesScreen } from './pages/CategoriesScreen';

import { Sidebar } from './components/Sidebar';
import { FloatingCart } from './components/FloatingCart';
import { StoreDialog } from './components/StoreDialog';

const AccountForm = lazy(() => import('./pages/AccountForm'));
const CatalogManagement = lazy(() => import('./pages/AdminScreen').then(module => ({ default: module.CatalogManagement })));
const CatalogEditor = lazy(() => import('./pages/AdminScreen').then(module => ({ default: module.CatalogEditor })));
const PricingScreen = lazy(() => import('./pages/PricingScreen'));

type StorePanel = { type: 'login' | 'catalog' | 'pricing' } | { type: 'editor'; id?: string; fromCatalog?: boolean };

const panelTitles = { login: 'Entrar na Presente Doce', catalog: 'Gerir catálogo', pricing: 'Precificação de receitas' };

function entryPanel() {
  const path = window.location.pathname.replace(/\/$/, '');
  if (path === '/admin') return 'login';
  if (path === '/precificacao') return 'pricing';
  return null;
}

const views: View[] = ['welcome', 'home', 'product-list', 'product-details', 'cart', 'saved', 'categories-list', 'settings', 'contact'];

function locationView(): View {
  const hash = window.location.hash.slice(1) as View;
  return views.includes(hash) && hash !== 'product-details' ? hash : 'home';
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>(locationView);
  const [previousView, setPreviousView] = useState<View>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [activeRecCategory, setActiveRecCategory] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<CatalogSession | null>(null);
  const [recoveryCallback, setRecoveryCallback] = useState(() => readRecoveryCallback(new URL(window.location.href)));
  const [panel, setPanel] = useState<StorePanel | null>(() => entryPanel() || recoveryCallback ? { type: 'login' } : null);
  const [notice, setNotice] = useState('');

  const { cart, cartTotal, showSuccessToast, addToCart, updateQuantity, toggleCartItem, updateCartItem } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const { products, status, reload, applyChange } = useCatalog();

  useLayoutEffect(() => {
    if (recoveryCallback) window.history.replaceState(window.history.state, '', '/admin?recuperar=1');
  }, [recoveryCallback]);

  useEffect(() => {
    if (!session) return;
    const timeout = window.setTimeout(() => {
      setSession(null);
      setPanel(null);
      setNotice('A sessão terminou. Entre novamente pelo menu.');
    }, Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [session]);

  useEffect(() => {
    if (!notice || panel) return;
    const timeout = window.setTimeout(() => setNotice(''), 6500);
    return () => window.clearTimeout(timeout);
  }, [notice, panel]);

  useEffect(() => {
    const syncLocation = () => {
      const view = window.history.state?.view;
      setCurrentView(view === 'product-details' && selectedProduct ? view : locationView());
    };
    window.addEventListener('popstate', syncLocation);
    window.addEventListener('hashchange', syncLocation);
    return () => {
      window.removeEventListener('popstate', syncLocation);
      window.removeEventListener('hashchange', syncLocation);
    };
  }, [selectedProduct]);
  const handleNavigate = useCallback((view: View) => {
    if (view !== currentView) {
      window.history.pushState({ view }, '', `#${view}`);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  function closePanel() {
    if (recoveryCallback && 'token' in recoveryCallback) void signOut(recoveryCallback.token).catch(() => {});
    setRecoveryCallback(null);
    if (entryPanel()) window.history.replaceState(window.history.state, '', '/' + window.location.hash);
    setPanel(null);
  }

  function handleLogin(next: CatalogSession) {
    const destination = entryPanel();
    setSession(next);
    closePanel();
    if (destination === 'pricing') setPanel({ type: 'pricing' });
    handleNavigate('home');
    setNotice('');
  }

  function handleLogout() {
    if (session) void signOut(session.token).catch(() => {});
    setSession(null);
    setPanel(null);
    setNotice('Sessão encerrada.');
  }

  const openLogin = () => { setNotice(''); setPanel({ type: 'login' }); };
  const openProductEditor = session ? (id: string) => setPanel({ type: 'editor', id }) : undefined;

  function leaveEditor() {
    if (panel?.type === 'editor' && panel.fromCatalog) setPanel({ type: 'catalog' });
    else closePanel();
  }

  function onCatalogChanged(id: string, row: CatalogRow | null) {
    applyChange(id, row);
    if (selectedProduct?.id === id && !editingCartItem) {
      if (row?.published) setSelectedProduct(toProduct(row));
      else {
        setSelectedProduct(null);
        if (currentView === 'product-details') handleNavigate(previousView);
      }
    }
    setNotice(row ? (row.published ? 'Produto guardado no catálogo.' : 'Rascunho guardado.') : 'Produto excluído.');
    leaveEditor();
  }

  const handleProductClick = useCallback((product: Product) => {
    setPreviousView(currentView);
    setSelectedProduct(product);
    setEditingCartItem(null);
    handleNavigate('product-details');
  }, [currentView, handleNavigate]);

  const handleEditCartItem = useCallback((item: CartItem) => {
    setPreviousView(currentView);
    setSelectedProduct(item);
    setEditingCartItem(item);
    handleNavigate('product-details');
  }, [currentView, handleNavigate]);

  const selectOrConfigure = (product: Product, event?: React.MouseEvent) => {
    if (product.configuravel && !cart.some(item => item.id === product.id)) {
      event?.stopPropagation();
      handleProductClick(product);
      return;
    }
    toggleCartItem(product, event);
  };

  const commonProps = { onNavigate: handleNavigate, onOpenMenu: () => setIsMenuOpen(true) };

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <div className="w-full min-h-screen relative">
        <Sidebar
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onNavigate={handleNavigate}
          isAdmin={!!session}
          onLogin={openLogin}
          onLogout={handleLogout}
          onManage={() => { setNotice(''); setPanel({ type: 'catalog' }); }}
          onNewProduct={() => setPanel({ type: 'editor' })}
          onPricing={() => setPanel({ type: 'pricing' })}
        />

        {status !== 'ready' && (
          <div className="flex items-center justify-center gap-3 bg-amber-50 p-3 text-sm text-stone-800" role="status">
            {status === 'loading' ? 'A carregar o catálogo…' : 'Catálogo temporariamente indisponível.'}
            {status === 'error' && <button type="button" onClick={reload} className="font-bold text-primary underline">Tentar novamente</button>}
          </div>
        )}
        <main className="min-h-screen flex flex-col">
          <AnimatePresence mode="wait">
            {currentView === 'welcome' && <WelcomeScreen key="welcome" {...commonProps} />}

            {currentView === 'home' && (
              <HomeScreen
                key="home"
                products={products}
                cart={cart}
                favorites={favorites}
                isAdmin={!!session}
                {...commonProps}
                onSetCategory={setActiveRecCategory}
                onProductClick={handleProductClick}
                onEditProduct={openProductEditor}
                onToggleFavorite={toggleFavorite}
                onToggleCartItem={selectOrConfigure}
              />
            )}

            {currentView === 'product-list' && (
              <ProductListScreen
                key="product-list"
                products={products}
                cart={cart}
                favorites={favorites}
                activeRecCategory={activeRecCategory}
                {...commonProps}
                onSetCategory={setActiveRecCategory}
                onProductClick={handleProductClick}
                onEditProduct={openProductEditor}
                onToggleFavorite={toggleFavorite}
                onToggleCartItem={selectOrConfigure}
              />
            )}

            {currentView === 'product-details' && selectedProduct && (
              <ProductDetailScreen
                key="product-details"
                product={selectedProduct}
                onEditProduct={editingCartItem ? undefined : openProductEditor}
                cart={cart}
                favorites={favorites}
                onAddToCart={addToCart}
                onUpdateCartItem={updateCartItem}
                editingItem={editingCartItem}
                onToggleFavorite={toggleFavorite}
                onNavigate={handleNavigate}
                onBack={() => {
                  setEditingCartItem(null);
                  handleNavigate(previousView);
                }}
              />
            )}

            {currentView === 'cart' && (
              <CartScreen
                key="cart"
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onEditItem={handleEditCartItem}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'settings' && (
              <SettingsScreen
                key="settings"
                mode="about"
                {...commonProps}
              />
            )}

            {currentView === 'contact' && (
              <SettingsScreen
                key="contact"
                mode="contact"
                {...commonProps}
              />
            )}

            {currentView === 'categories-list' && (
              <CategoriesScreen
                key="categories"
                activeCategory={activeRecCategory}
                onSetCategory={setActiveRecCategory}
                {...commonProps}
              />
            )}

            {currentView === 'saved' && (
              <SavedScreen
                key="saved"
                products={products}
                cart={cart}
                favorites={favorites}
                onProductClick={handleProductClick}
                onEditProduct={openProductEditor}
                onToggleFavorite={toggleFavorite}
                onToggleCartItem={selectOrConfigure}
                {...commonProps}
              />
            )}
          </AnimatePresence>
        </main>

        {panel && (panel.type === 'login' || session) && (
          <StoreDialog title={panel.type === 'editor' ? (panel.id ? 'Editar produto' : 'Novo produto') : panelTitles[panel.type]} onClose={closePanel}>
            <Suspense fallback={<p role="status">A carregar…</p>}>
              {panel.type === 'login' && <AccountForm
                initialRecovery={entryPanel() === 'login' && new URLSearchParams(window.location.search).get('recuperar') === '1'}
                callback={recoveryCallback}
                onLogin={handleLogin}
                onRecoveryComplete={() => setRecoveryCallback(null)}
              />}
              {panel.type === 'catalog' && session && <>
                {notice && <p role="status" className="mb-4 font-semibold text-primary">{notice}</p>}
                <CatalogManagement
                  token={session.token}
                  onNew={() => setPanel({ type: 'editor', fromCatalog: true })}
                  onEdit={id => setPanel({ type: 'editor', id, fromCatalog: true })}
                />
              </>}
              {panel.type === 'editor' && session && <CatalogEditor
                key={panel.id ?? 'new'}
                productId={panel.id}
                token={session.token}
                onCancel={leaveEditor}
                onChanged={onCatalogChanged}
              />}
              {panel.type === 'pricing' && session && <PricingScreen />}
            </Suspense>
          </StoreDialog>
        )}

        {notice && !panel && (
          <div role="status" className="fixed bottom-28 left-1/2 z-[90] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-primary/15 bg-porcelain px-4 py-2 text-sm font-semibold text-primary shadow-lg">
            {notice}
            <button type="button" onClick={() => setNotice('')} aria-label="Dispensar aviso" className="p-2 text-lg leading-none">×</button>
          </div>
        )}

        <FloatingCart
          cart={cart}
          cartTotal={cartTotal}
          onNavigate={handleNavigate}
          isVisible={currentView !== 'cart' && currentView !== 'welcome' && currentView !== 'product-details'}
        />

        <AnimatePresence>
          {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-screen-xl px-6 z-[100] flex justify-center pointer-events-none"
            >
              <div className="bg-primary text-cream px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md">
                <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center text-primary"><Plus size={14} /></div>
                <span className="font-headline font-bold text-[11px] tracking-wide">Adicionado ao carrinho</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
