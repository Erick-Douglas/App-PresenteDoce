import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { useCart } from './features/cart/useCart';
import { useCatalog } from './features/products/useCatalog';
import { useAdminCatalog } from './features/products/useAdminCatalog';
import { useFavorites } from './features/products/useFavorites';
import { catalogEnabled, getStorePresentation, signOut, toProduct, type AdminCategoryRow, type CatalogRow, type CatalogSession } from './features/products/catalogApi';
import { defaultStorePresentation, type StorePresentation } from './features/products/storePresentation';
import type { CategoryChange } from './pages/CategoryEditor';
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
import { AdminPage } from './components/AdminPage';
import { ContactAssistant } from './components/ContactAssistant';
import { StoreDialog } from './components/StoreDialog';
import { useAppInstall } from './features/install/useAppInstall';

const AccountForm = lazy(() => import('./pages/AccountForm'));
const CatalogManagement = lazy(() => import('./pages/CatalogManagement'));
const CatalogEditor = lazy(() => import('./pages/AdminScreen').then(module => ({ default: module.CatalogEditor })));
const CategoryEditor = lazy(() => import('./pages/CategoryEditor').then(module => ({ default: module.CategoryEditor })));
const PricingScreen = lazy(() => import('./pages/PricingScreen'));
const StorePresentationEditor = lazy(() => import('./pages/StorePresentationEditor'));

type Route = { view: View; id?: string };
type ReturnRoute = { view: View; scroll: number };
const adminViews = ['catalog-admin', 'product-editor', 'category-editor', 'pricing', 'store-texts'] as const;
const views: View[] = ['welcome', 'home', 'product-list', 'product-details', 'cart', 'saved', 'categories-list', 'settings', 'contact', ...adminViews];

function entryPath() {
  return window.location.pathname.replace(/\/$/, '');
}

function readRoute(productOpen = false): Route {
  if (entryPath() === '/precificacao') return { view: 'pricing' };
  const [hash, id, extra] = window.location.hash.slice(1).split('/');
  const view = hash as View;
  if (extra !== undefined || !views.includes(view) || (view === 'product-details' && !productOpen)) return { view: 'home' };
  if (id && (view === 'product-editor' || view === 'category-editor')) {
    try { return { view, id: decodeURIComponent(id) }; } catch { return { view: 'catalog-admin' }; }
  }
  return { view };
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const currentView = route.view;
  const [previousView, setPreviousView] = useState<View>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [activeRecCategory, setActiveRecCategory] = useState('all');
  const [homeSearch, setHomeSearch] = useState('');
  const [homeSelection, setHomeSelection] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<CatalogSession | null>(null);
  const [recoveryCallback, setRecoveryCallback] = useState(() => readRecoveryCallback(new URL(window.location.href)));
  const [loginOpen, setLoginOpen] = useState(() => entryPath() === '/admin' || entryPath() === '/precificacao' || !!recoveryCallback);
  const [notice, setNotice] = useState('');
  const [presentation, setPresentation] = useState(defaultStorePresentation);
  const [presentationError, setPresentationError] = useState(false);
  const [presentationAttempt, setPresentationAttempt] = useState(0);
  const { installed, canPrompt, appleMobile, showInstructions, closeInstructions, install } = useAppInstall();

  useEffect(() => {
    if (!catalogEnabled) return;
    const controller = new AbortController();
    getStorePresentation(controller.signal).then(value => {
      if (!controller.signal.aborted) {
        setPresentation(current => value.revision >= current.revision ? value : current);
        setPresentationError(false);
      }
    }).catch(() => {
      if (!controller.signal.aborted) setPresentationError(true);
    });
    return () => controller.abort();
  }, [presentationAttempt]);

  const { cart, cartTotal, showSuccessToast, addToCart, updateQuantity, toggleCartItem, updateCartItem } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const { products, categories, status, reload, applyChange } = useCatalog();
  const adminCatalog = useAdminCatalog(session?.token);
  const lockedScroll = useRef<number | null>(null);
  const returnScroll = useRef<number | null>(null);
  const adminView = adminViews.some(view => view === currentView);
  const overlayOpen = isMenuOpen || loginOpen || showInstructions;

  useEffect(() => {
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    const colors = getComputedStyle(root);
    const brand = colors.getPropertyValue('--pd-color-brand').trim();
    const canvas = colors.getPropertyValue('--pd-color-canvas').trim();
    const masthead = currentView === 'home' || currentView === 'welcome' || currentView === 'categories-list' || adminView;
    function updateStatusArea() {
      const showBrand = masthead && (lockedScroll.current ?? window.scrollY) < 8;
      const state = String(showBrand);
      if (root.dataset.brandStatus === state) return;
      root.dataset.brandStatus = state;
      meta?.setAttribute('content', showBrand ? brand : canvas);
    }
    updateStatusArea();
    window.addEventListener('scroll', updateStatusArea, { passive: true });
    return () => window.removeEventListener('scroll', updateStatusArea);
  }, [currentView, adminView]);

  useLayoutEffect(() => {
    if (!overlayOpen) return;
    const { style } = document.body;
    const { position, top, width } = style;
    lockedScroll.current = window.scrollY;
    style.position = 'fixed';
    style.top = -lockedScroll.current + 'px';
    style.width = document.documentElement.clientWidth + 'px';
    return () => {
      Object.assign(style, { position, top, width });
      window.scrollTo({ top: lockedScroll.current ?? 0, behavior: 'instant' });
      lockedScroll.current = null;
    };
  }, [overlayOpen]);

  useLayoutEffect(() => {
    if (recoveryCallback) window.history.replaceState(window.history.state, '', '/admin?recuperar=1');
  }, [recoveryCallback]);

  useEffect(() => {
    if (!session) return;
    const timeout = window.setTimeout(() => {
      setSession(null);
      setLoginOpen(false);
      setNotice('A sessão terminou. Entre novamente pelo menu.');
    }, Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [session]);

  useEffect(() => {
    if (!notice || loginOpen) return;
    const timeout = window.setTimeout(() => setNotice(''), 6500);
    return () => window.clearTimeout(timeout);
  }, [notice, loginOpen]);

  useEffect(() => {
    const syncLocation = () => setRoute(readRoute(!!selectedProduct));
    window.addEventListener('popstate', syncLocation);
    window.addEventListener('hashchange', syncLocation);
    return () => {
      window.removeEventListener('popstate', syncLocation);
      window.removeEventListener('hashchange', syncLocation);
    };
  }, [selectedProduct]);
  useLayoutEffect(() => {
    if (returnScroll.current === null) return;
    const scroll = returnScroll.current;
    returnScroll.current = null;
    const frame = requestAnimationFrame(() => window.scrollTo({ top: scroll, behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, [currentView]);

  const handleNavigate = useCallback((view: View, id?: string, returnTo?: View) => {
    if (view !== currentView || id !== route.id) {
      const suffix = id ? '/' + encodeURIComponent(id) : '';
      const origin = returnTo ? { view: returnTo, scroll: lockedScroll.current ?? window.scrollY } satisfies ReturnRoute : undefined;
      window.history.pushState({ origin }, '', '/#' + view + suffix);
      setRoute({ view, id });
      setNotice('');
    }
    if (lockedScroll.current !== null) lockedScroll.current = 0;
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView, route.id]);

  function closePanel() {
    if (recoveryCallback && 'token' in recoveryCallback) void signOut(recoveryCallback.token).catch(() => {});
    setRecoveryCallback(null);
    if (entryPath() === '/admin' || entryPath() === '/precificacao') {
      window.history.replaceState(window.history.state, '', '/#' + currentView);
    }
    setLoginOpen(false);
  }

  function handleLogin(next: CatalogSession) {
    setSession(next);
    closePanel();
    setNotice('');
  }

  function handleLogout() {
    if (session) void signOut(session.token).catch(() => {});
    setSession(null);
    setLoginOpen(false);
    if (adminView) handleNavigate('home');
    setNotice('Sessão encerrada.');
  }

  const openLogin = () => { setNotice(''); setLoginOpen(true); };
  const openProductEditor = session ? (id: string) => openEditor('product-editor', id) : undefined;
  const openCategoryEditor = session ? (id: string) => openEditor('category-editor', id) : undefined;

  function openEditor(view: 'product-editor' | 'category-editor', id: string) {
    handleNavigate(view, id, currentView);
  }

  function leaveEditor() {
    const origin = window.history.state?.origin as ReturnRoute | undefined;
    if (origin && (origin.view !== 'product-details' || selectedProduct)) {
      returnScroll.current = origin.scroll;
      window.history.back();
      return;
    }
    handleNavigate('catalog-admin');
  }

  function onCategoryCreated(category: AdminCategoryRow) {
    adminCatalog.applyCategory(category);
    adminCatalog.reload();
    reload();
  }

  function onCategoryChanged(change: CategoryChange) {
    if (change.saved) adminCatalog.applyCategory(change.saved);
    adminCatalog.reload();
    reload();
    if (activeRecCategory === change.previous.name) {
      setActiveRecCategory(change.saved?.name ?? change.destination?.name ?? 'all');
    }
  }

  function onCatalogChanged(id: string, row: CatalogRow | null) {
    applyChange(id, row);
    adminCatalog.reload();
    const removedFromDetails = selectedProduct?.id === id && !editingCartItem && !row?.published &&
      window.history.state?.origin?.view === 'product-details';
    if (selectedProduct?.id === id && !editingCartItem) {
      if (row?.published) setSelectedProduct(toProduct(row));
      else {
        setSelectedProduct(null);
      }
    }
    if (removedFromDetails) handleNavigate(previousView);
    else leaveEditor();
    setNotice(row ? (row.published ? 'Produto guardado no catálogo.' : 'Rascunho guardado.') : 'Produto excluído.');
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
  const catalogNotice = status !== 'ready' && (
    <div className={'flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-surface ' +
      (currentView === 'home' ? 'mx-auto max-w-6xl px-4 py-2 sm:px-6' : 'justify-center bg-amber-50 p-3')} role="status">
      {status === 'loading' ? 'A carregar o catálogo…' : 'Catálogo temporariamente indisponível.'}
      {status === 'error' && <button type="button" onClick={reload} className="font-bold text-primary underline">Tentar novamente</button>}
    </div>
  );
  const adminTitle = currentView === 'catalog-admin' ? 'Gerir catálogo' :
    currentView === 'pricing' ? 'Precificação' : currentView === 'store-texts' ? 'Textos da loja' :
    currentView === 'category-editor' ? 'Editar categoria' : route.id ? 'Editar produto' : 'Novo produto';
  const adminStatus = adminCatalog.error ? (
    <div role="alert" className="space-y-2 text-sm text-primary">
      <p>{adminCatalog.error}</p>
      <button type="button" className="min-h-11 underline" onClick={adminCatalog.reload}>Tentar novamente</button>
    </div>
  ) : <p role="status">A carregar catálogo…</p>;

  function editorContent() {
    if (!session) return null;
    if (!adminCatalog.data) return adminStatus;
    const data = adminCatalog.data;
    if (currentView === 'product-editor') return (
      <CatalogEditor key={route.id ?? 'new'} productId={route.id} token={session.token} categories={data.categories}
        rows={data.rows} onCategoryCreated={onCategoryCreated} onCategoryChanged={onCategoryChanged}
        onCancel={leaveEditor} onChanged={onCatalogChanged} />
    );
    const category = data.categories.find(item => item.id === route.id);
    if (!category) return <p role="alert">Esta categoria já não está disponível.</p>;
    return <CategoryEditor key={category.id} category={category} categories={data.categories} rows={data.rows} token={session.token}
      onBack={leaveEditor} onChanged={change => {
        onCategoryChanged(change);
        leaveEditor();
        setNotice(change.saved ? 'Categoria guardada.' : 'Categoria excluída.');
      }} />;
  }

  function presentationEditor() {
    if (!session) return null;
    if (!presentation.revision) return presentationError ? (
      <div role="alert" className="space-y-2">
        <p>Não foi possível carregar os textos da loja.</p>
        <button type="button" className="ui-secondary" onClick={() => {
          setPresentationError(false);
          setPresentationAttempt(value => value + 1);
        }}>Tentar novamente</button>
      </div>
    ) : <p role="status">A carregar os textos…</p>;
    return <StorePresentationEditor current={presentation} token={session.token} onSave={(value: StorePresentation) => {
      setPresentation(value);
      setNotice('Textos da loja guardados.');
    }} />;
  }

  return (
    <div className="app-theme relative min-h-screen overflow-x-clip bg-porcelain font-sans text-base font-normal text-on-surface">
      <div className="w-full min-h-screen relative">
        <Sidebar
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onNavigate={view => handleNavigate(view, undefined, view === 'catalog-admin' || !adminViews.some(item => item === view) ? undefined : currentView)}
          isAdmin={!!session}
          onLogin={openLogin}
          onLogout={handleLogout}
          onInstall={installed ? undefined : install}
          canInstallDirectly={canPrompt}
        />

        {currentView !== 'home' && !adminView && catalogNotice}
        <main className="min-h-screen flex flex-col">
          <AnimatePresence mode="wait">
            {currentView === 'welcome' && <WelcomeScreen key="welcome" {...commonProps} />}

            {currentView === 'home' && (
              <HomeScreen
                key="home"
                products={products}
                categories={categories}
                cart={cart}
                isAdmin={!!session}
                catalogNotice={catalogNotice}
                presentation={presentation}
                search={homeSearch}
                selection={homeSelection}
                onSearch={setHomeSearch}
                onSelect={setHomeSelection}
                {...commonProps}
                onProductClick={handleProductClick}
                onEditProduct={openProductEditor}
                onEditCategory={openCategoryEditor}
                onToggleCartItem={selectOrConfigure}
              />
            )}

            {currentView === 'product-list' && (
              <ProductListScreen
                key="product-list"
                products={products}
                categories={categories}
                cart={cart}
                activeRecCategory={activeRecCategory}
                {...commonProps}
                onSetCategory={setActiveRecCategory}
                onProductClick={handleProductClick}
                onEditProduct={openProductEditor}
                onEditCategory={openCategoryEditor}
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
                aboutText={presentation.about_text}
                {...commonProps}
              />
            )}

            {currentView === 'contact' && (
              <SettingsScreen
                key="contact"
                mode="contact"
                aboutText={presentation.about_text}
                {...commonProps}
              />
            )}

            {currentView === 'categories-list' && (
              <CategoriesScreen
                key="categories"
                categories={categories}
                overview={session && !adminCatalog.error ? adminCatalog.data : undefined}
                products={products}
                cart={cart}
                onProductClick={handleProductClick}
                onEditProduct={openProductEditor}
                onEditCategory={openCategoryEditor}
                onToggleCartItem={selectOrConfigure}
                onNavigate={handleNavigate}
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
                onToggleCartItem={selectOrConfigure}
                {...commonProps}
              />
            )}
            {adminView && (
              <AdminPage key={currentView + (route.id ?? '')} title={adminTitle} wide={currentView === 'catalog-admin'}
                onMenu={commonProps.onOpenMenu} onBack={currentView === 'catalog-admin' || !session ? () => handleNavigate('home') : leaveEditor}>
                {session ? (
                  <Suspense fallback={<p role="status">A carregar…</p>}>
                    {currentView === 'catalog-admin' && (
                      <>
                        {(!adminCatalog.data || adminCatalog.error) && adminStatus}
                        {adminCatalog.data && <CatalogManagement categories={adminCatalog.data.categories} rows={adminCatalog.data.rows} token={session.token}
                          onNew={() => handleNavigate('product-editor', undefined, currentView)}
                          onEdit={id => openEditor('product-editor', id)}
                          onEditCategory={id => openEditor('category-editor', id)} onCategoryCreated={onCategoryCreated} />}
                      </>
                    )}
                    {currentView === 'pricing' && <PricingScreen />}
                    {currentView === 'store-texts' && presentationEditor()}
                    {(currentView === 'product-editor' || currentView === 'category-editor') && editorContent()}
                  </Suspense>
                ) : (
                  <section className="ui-glass-panel space-y-3">
                    <p className="text-sm text-muted">Entre com a conta da confeitaria para usar este módulo.</p>
                    <button type="button" className="ui-primary" onClick={openLogin}>Entrar</button>
                  </section>
                )}
              </AdminPage>
            )}
          </AnimatePresence>
        </main>

        {loginOpen && (
          <StoreDialog title="Entrar na Presente Doce" onClose={closePanel}>
            <Suspense fallback={<p role="status">A carregar…</p>}>
              <AccountForm
                initialRecovery={entryPath() === '/admin' && new URLSearchParams(window.location.search).get('recuperar') === '1'}
                callback={recoveryCallback}
                onLogin={handleLogin}
                onRecoveryComplete={() => setRecoveryCallback(null)}
              />
            </Suspense>
          </StoreDialog>
        )}
        {showInstructions && (
          <StoreDialog title="Como instalar a Presente Doce" onClose={closeInstructions}>
            <div className="flex items-start gap-3">
              <img src="/apple-touch-icon.png" alt="" width={44} height={44} className="rounded-xl" />
              <div className="space-y-2 text-sm text-muted">
                {appleMobile ? <p>No Safari, toque em <strong>Partilhar → Adicionar ao ecrã principal</strong>. Ative <strong>Abrir como app</strong> se aparecer e toque em <strong>Adicionar</strong>.</p> :
                  <p>No menu do navegador, escolha <strong>Instalar app</strong> ou <strong>Adicionar ao ecrã principal</strong>, quando disponível.</p>}
                <p>O ícone Presente Doce fica no ecrã principal.</p>
              </div>
            </div>
          </StoreDialog>
        )}

        {notice && !loginOpen && (
          <div role="status" className="fixed bottom-28 left-1/2 z-[90] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-primary/15 bg-porcelain px-4 py-2 text-sm font-bold text-primary shadow-lg">
            {notice}
            <button type="button" onClick={() => setNotice('')} aria-label="Dispensar aviso" className="p-2 text-lg leading-none">×</button>
          </div>
        )}

        <FloatingCart
          cart={cart}
          cartTotal={cartTotal}
          onNavigate={handleNavigate}
          isVisible={!adminView && currentView !== 'cart' && currentView !== 'welcome' && currentView !== 'product-details'}
        />
        {!session && <ContactAssistant visible={!overlayOpen && ['home', 'categories-list', 'product-list', 'product-details', 'saved'].includes(currentView)}
          aboveOrder={cart.length > 0 || currentView === 'product-details'} />}

        <AnimatePresence>
          {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-screen-xl px-6 z-[100] flex justify-center pointer-events-none"
            >
              <div className="bg-primary text-on-primary px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-surface/10 backdrop-blur-md">
                <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center text-primary"><Plus size={14} /></div>
                <span className="font-bold text-xs tracking-wide">Adicionado ao carrinho</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
