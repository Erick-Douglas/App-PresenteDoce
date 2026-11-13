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
import { Header } from './components/Header';
import { ContactAssistant } from './components/ContactAssistant';
import { StoreDialog } from './components/StoreDialog';

const AccountForm = lazy(() => import('./pages/AccountForm'));
const CatalogManagement = lazy(() => import('./pages/CatalogManagement'));
const CatalogEditor = lazy(() => import('./pages/AdminScreen').then(module => ({ default: module.CatalogEditor })));
const CategoryEditor = lazy(() => import('./pages/CategoryEditor').then(module => ({ default: module.CategoryEditor })));
const PricingScreen = lazy(() => import('./pages/PricingScreen'));
const StorePresentationEditor = lazy(() => import('./pages/StorePresentationEditor'));

type EditorPanel = { type: 'editor'; id?: string } | { type: 'category'; id: string };
type StorePanel = { type: 'login' } | { type: 'pricing' } | { type: 'presentation' } | EditorPanel;

const panelTitles = { login: 'Entrar na Presente Doce', pricing: 'Precificação de receitas', presentation: 'Textos da loja' };

function entryPanel() {
  const path = window.location.pathname.replace(/\/$/, '');
  if (path === '/admin') return 'login';
  if (path === '/precificacao') return 'pricing';
  return null;
}

const views: View[] = ['welcome', 'home', 'product-list', 'product-details', 'cart', 'saved', 'categories-list', 'settings', 'contact', 'catalog-admin'];

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
  const [presentation, setPresentation] = useState(defaultStorePresentation);
  const [presentationError, setPresentationError] = useState(false);
  const [presentationAttempt, setPresentationAttempt] = useState(0);

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
  const adminScroll = useRef(0);
  const editor = panel?.type === 'editor' || panel?.type === 'category' ? panel : null;
  const pageEditor = currentView === 'catalog-admin' && !!panel && panel.type !== 'login';
  const overlayOpen = isMenuOpen || (!!panel && !pageEditor);

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
      const next = view === 'product-details' && selectedProduct ? view : locationView();
      if (currentView === 'catalog-admin' && next !== currentView) setPanel(null);
      setCurrentView(next);
    };
    window.addEventListener('popstate', syncLocation);
    window.addEventListener('hashchange', syncLocation);
    return () => {
      window.removeEventListener('popstate', syncLocation);
      window.removeEventListener('hashchange', syncLocation);
    };
  }, [selectedProduct, currentView]);
  const handleNavigate = useCallback((view: View) => {
    if (view !== currentView) {
      window.history.pushState({ view }, '', `#${view}`);
      if (currentView === 'catalog-admin') setPanel(null);
    }
    setCurrentView(view);
    if (lockedScroll.current !== null) lockedScroll.current = 0;
    else window.scrollTo({ top: 0, behavior: 'instant' });
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
    if (currentView !== 'catalog-admin') handleNavigate('home');
    setNotice('');
  }

  function handleLogout() {
    if (session) void signOut(session.token).catch(() => {});
    setSession(null);
    setPanel(null);
    setNotice('Sessão encerrada.');
  }

  const openLogin = () => { setNotice(''); setPanel({ type: 'login' }); };
  const openProductEditor = session ? (id: string) => openEditor({ type: 'editor', id }) : undefined;
  const openCategoryEditor = session ? (id: string) => openEditor({ type: 'category', id }) : undefined;

  function openEditor(next: Exclude<StorePanel, { type: 'login' }>) {
    setNotice('');
    if (currentView === 'catalog-admin') {
      adminScroll.current = lockedScroll.current ?? window.scrollY;
      if (lockedScroll.current !== null) lockedScroll.current = 0;
      else window.scrollTo({ top: 0, behavior: 'instant' });
    }
    setPanel(next);
  }

  function leaveEditor() {
    closePanel();
    if (pageEditor) requestAnimationFrame(() => window.scrollTo({ top: adminScroll.current, behavior: 'instant' }));
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
  const catalogNotice = status !== 'ready' && (
    <div className={'flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-surface ' +
      (currentView === 'home' ? 'mx-auto max-w-6xl px-4 py-2 sm:px-6' : 'justify-center bg-amber-50 p-3')} role="status">
      {status === 'loading' ? 'A carregar o catálogo…' : 'Catálogo temporariamente indisponível.'}
      {status === 'error' && <button type="button" onClick={reload} className="font-bold text-primary underline">Tentar novamente</button>}
    </div>
  );
  const editorTitle = editor?.type === 'category' ? 'Editar categoria' : editor?.id ? 'Editar produto' : 'Novo produto';
  const adminTitle = panel?.type === 'pricing' || panel?.type === 'presentation' ? panelTitles[panel.type] : editorTitle;
  const adminStatus = adminCatalog.error ? (
    <div role="alert" className="space-y-2 text-sm text-primary">
      <p>{adminCatalog.error}</p>
      <button type="button" className="min-h-11 underline" onClick={adminCatalog.reload}>Tentar novamente</button>
    </div>
  ) : <p role="status">A carregar catálogo…</p>;

  function editorContent() {
    if (!session || !editor) return null;
    if (!adminCatalog.data) return adminStatus;
    const data = adminCatalog.data;
    if (editor.type === 'editor') return (
      <CatalogEditor key={editor.id ?? 'new'} productId={editor.id} token={session.token} categories={data.categories}
        rows={data.rows} onCategoryCreated={onCategoryCreated} onCategoryChanged={onCategoryChanged}
        onCancel={leaveEditor} onChanged={onCatalogChanged} />
    );
    const category = data.categories.find(item => item.id === editor.id);
    if (!category) return <p role="alert">Esta categoria já não está disponível.</p>;
    return <CategoryEditor key={category.id} category={category} categories={data.categories} rows={data.rows} token={session.token}
      onBack={leaveEditor} onChanged={change => {
        onCategoryChanged(change);
        setNotice(change.saved ? 'Categoria guardada.' : 'Categoria excluída.');
        leaveEditor();
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
      leaveEditor();
    }} />;
  }

  return (
    <div className="app-theme relative min-h-screen overflow-x-hidden bg-porcelain font-sans text-base font-normal text-on-surface">
      <div className="w-full min-h-screen relative">
        <Sidebar
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onNavigate={handleNavigate}
          isAdmin={!!session}
          onLogin={openLogin}
          onLogout={handleLogout}
          onManage={() => { setNotice(''); setPanel(null); handleNavigate('catalog-admin'); }}
          onNewProduct={() => openEditor({ type: 'editor' })}
          onPricing={() => openEditor({ type: 'pricing' })}
          onPresentation={() => openEditor({ type: 'presentation' })}
        />

        {currentView !== 'home' && currentView !== 'catalog-admin' && catalogNotice}
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
            {currentView === 'catalog-admin' && (
              <motion.div key="catalog-admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="min-h-screen bg-porcelain text-on-surface">
                <div className="store-masthead"><Header onOpenMenu={commonProps.onOpenMenu} showShare={false} /></div>
                <div className="page-width space-y-4 pt-5 pb-28 sm:pt-7">
                  {session ? adminCatalog.data ? (
                    <Suspense fallback={<p role="status">A carregar catálogo…</p>}>
                      {adminCatalog.error && adminStatus}
                      <div hidden={!!pageEditor}>
                        <nav aria-label="Gestão da loja" className="mb-4 flex flex-wrap gap-2">
                          <button type="button" className="ui-secondary text-primary" onClick={() => openEditor({ type: 'presentation' })}>Textos da loja</button>
                          <button type="button" className="ui-secondary text-primary" onClick={() => openEditor({ type: 'pricing' })}>Precificação</button>
                        </nav>
                        <CatalogManagement categories={adminCatalog.data.categories} rows={adminCatalog.data.rows} token={session.token}
                          onNew={() => openEditor({ type: 'editor' })}
                          onEdit={id => openEditor({ type: 'editor', id })}
                          onEditCategory={id => openEditor({ type: 'category', id })} onCategoryCreated={onCategoryCreated} />
                      </div>
                      {pageEditor && (
                        <section className="max-w-3xl space-y-4">
                          <div>
                            <button type="button" className="ui-quiet-action" onClick={leaveEditor}>Voltar ao catálogo</button>
                            <h1 className="type-module text-primary">{adminTitle}</h1>
                          </div>
                          {panel?.type === 'pricing' ? <PricingScreen /> : panel?.type === 'presentation' ? presentationEditor() : editorContent()}
                        </section>
                      )}
                    </Suspense>
                  ) : adminStatus : (
                    <section className="space-y-3">
                      <h1 className="type-module text-primary">Gerir catálogo</h1>
                      <button type="button" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-on-strong"
                        onClick={openLogin}>Entrar para gerir o catálogo</button>
                    </section>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {panel && !pageEditor && (panel.type === 'login' || session) && (
          <StoreDialog title={panel.type === 'login' ? panelTitles.login : adminTitle} onClose={closePanel}>
            <Suspense fallback={<p role="status">A carregar…</p>}>
              {panel.type === 'login' && <AccountForm
                initialRecovery={entryPanel() === 'login' && new URLSearchParams(window.location.search).get('recuperar') === '1'}
                callback={recoveryCallback}
                onLogin={handleLogin}
                onRecoveryComplete={() => setRecoveryCallback(null)}
              />}
              {editor && editorContent()}
              {panel.type === 'pricing' && session && <PricingScreen />}
              {panel.type === 'presentation' && presentationEditor()}
            </Suspense>
          </StoreDialog>
        )}

        {notice && !panel && (
          <div role="status" className="fixed bottom-28 left-1/2 z-[90] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-primary/15 bg-porcelain px-4 py-2 text-sm font-bold text-primary shadow-lg">
            {notice}
            <button type="button" onClick={() => setNotice('')} aria-label="Dispensar aviso" className="p-2 text-lg leading-none">×</button>
          </div>
        )}

        <FloatingCart
          cart={cart}
          cartTotal={cartTotal}
          onNavigate={handleNavigate}
          isVisible={currentView !== 'cart' && currentView !== 'welcome' && currentView !== 'product-details' && currentView !== 'catalog-admin'}
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
