import { AccountProvider } from "./features/account/AccountProvider";
import { useAppearance } from "./features/appearance/AppearanceProvider";
import { hasPurchaseOptions } from "./features/products/options";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ManagementNav } from "./components/ManagementNav";
import { LiveEditingProvider } from "./features/platform/LiveEditing";
import { storePath, useStore } from "./features/platform/StoreProvider";
import { useOperations } from "./features/platform/useOperations";

import { useCart } from "./features/cart/useCart";
import { readRecoveryCallback } from "./features/products/adminLink";
import {
  catalogEnabled,
  getStorePresentation,
  signOut,
  toProduct,
  type AdminCategoryRow,
  type CatalogRow,
  type CatalogSession,
} from "./features/products/catalogApi";
import {
  defaultStorePresentation,
  type StorePresentation,
} from "./features/products/storePresentation";
import { useAdminCatalog } from "./features/products/useAdminCatalog";
import { useCatalog } from "./features/products/useCatalog";
import { useFavorites } from "./features/products/useFavorites";
import type { CategoryChange } from "./pages/CategoryEditor";

import { CartItem, Product, View } from "./config/types";

import { CartScreen } from "./pages/CartScreen";
import { newCheckoutDraft } from "./features/checkout/draft";
import { CategoriesScreen } from "./pages/CategoriesScreen";
import { HomeScreen } from "./pages/HomeScreen";
import { ProductDetailScreen } from "./pages/ProductDetailScreen";
import { ProductListScreen } from "./pages/ProductListScreen";
import { SavedScreen } from "./pages/SavedScreen";
import { SettingsScreen } from "./pages/SettingsScreen";
import { WelcomeScreen } from "./pages/WelcomeScreen";

import { AdminPage } from "./components/AdminPage";
import { ContactAssistant } from "./components/ContactAssistant";
import { FloatingCart } from "./components/FloatingCart";
import { Sidebar } from "./components/Sidebar";
import { StoreDialog } from "./components/StoreDialog";
import { useAppInstall } from "./features/install/useAppInstall";
import { useCatalogSession } from "./features/products/useCatalogSession";

const OperationsScreen = lazy(() => import("./pages/OperationsScreen"));
const operationViews: View[] = [
  "dashboard",
  "orders",
  "agenda",
  "finance",
  "customers",
  "inventory",
  "ingredients",
  "store-settings",
];
const operationTitles: Partial<Record<View, string>> = {
  dashboard: "Visão geral",
  orders: "Encomendas",
  agenda: "Agenda e produção",
  finance: "Financeiro",
  customers: "Clientes",
  inventory: "Pronta entrega",
  ingredients: "Ingredientes",
  "store-settings": "Configurações da loja",
};
const AccountForm = lazy(() => import("./pages/AccountForm"));
const CatalogManagement = lazy(() => import("./pages/CatalogManagement"));
const CatalogEditor = lazy(() =>
  import("./pages/AdminScreen").then((module) => ({
    default: module.CatalogEditor,
  })),
);
const CategoryEditor = lazy(() =>
  import("./pages/CategoryEditor").then((module) => ({
    default: module.CategoryEditor,
  })),
);
const PricingScreen = lazy(() => import("./pages/PricingScreen"));
const StorePresentationEditor = lazy(
  () => import("./pages/StorePresentationEditor"),
);

type Route = { view: View; id?: string };
type ReturnRoute = { view: View; scroll: number };
const adminViews = [
  "catalog-admin",
  "product-editor",
  "category-editor",
  "pricing",
  "store-texts",
  ...operationViews,
] as const;
const views: View[] = [
  "welcome",
  "home",
  "product-list",
  "product-details",
  "cart",
  "saved",
  "categories-list",
  "settings",
  "contact",
  ...adminViews,
];

function entryPath() {
  return window.location.pathname.replace(/\/$/, "");
}

function readRoute(productOpen = false): Route {
  if (entryPath() === "/precificacao") return { view: "pricing" };
  const [hash, id, extra] = window.location.hash.slice(1).split("/");
  const view = hash as View;
  if (
    extra !== undefined ||
    !views.includes(view) ||
    (view === "product-details" && !productOpen)
  )
    return { view: "home" };
  if (id && (view === "product-editor" || view === "category-editor")) {
    try {
      return { view, id: decodeURIComponent(id) };
    } catch {
      return { view: "catalog-admin" };
    }
  }
  return { view };
}

export default function App() {
  const { resolved: appearance } = useAppearance();
  const [profileOpen, setProfileOpen] = useState(false);
  const { store, reload: reloadStore } = useStore();
  const [preview, setPreview] = useState(false);
  const [checkoutDraft, setCheckoutDraft] = useState(newCheckoutDraft);
  const [route, setRoute] = useState(readRoute);
  const currentView = route.view;
  const [previousView, setPreviousView] = useState<View>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [activeRecCategory, setActiveRecCategory] = useState("all");
  const [homeSearch, setHomeSearch] = useState("");
  const [homeSelection, setHomeSelection] = useState<string | null>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    session,
    restoring: restoringSession,
    error: sessionError,
    retry: retrySession,
    accept: acceptSession,
    logout: logoutSession,
  } = useCatalogSession();
  const [recoveryCallback, setRecoveryCallback] = useState(() =>
    readRecoveryCallback(new URL(window.location.href)),
  );
  const [loginOpen, setLoginOpen] = useState(
    () =>
      entryPath() === "/admin" ||
      entryPath() === "/precificacao" ||
      !!recoveryCallback,
  );
  const [notice, setNotice] = useState("");
  const [presentation, setPresentation] = useState(() =>
    store.slug === "presente-doce"
      ? defaultStorePresentation
      : {
          ...defaultStorePresentation,
          admin_name: store.name,
          home_description: "Conheça o nosso catálogo.",
          about_text: store.name,
        },
  );
  const [presentationError, setPresentationError] = useState(false);
  const [presentationAttempt, setPresentationAttempt] = useState(0);
  const {
    installed,
    canPrompt,
    appleMobile,
    showInstructions,
    closeInstructions,
    install,
  } = useAppInstall();

  useEffect(() => {
    if (!catalogEnabled) return;
    const controller = new AbortController();
    getStorePresentation(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setPresentation((current) =>
            value.revision >= current.revision ? value : current,
          );
          setPresentationError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setPresentationError(true);
      });
    return () => controller.abort();
  }, [presentationAttempt]);

  const {
    cart,
    cartTotal,
    showSuccessToast,
    addToCart,
    updateQuantity,
    updateCartItem,
  } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const { products, categories, status, reload, applyChange } = useCatalog();
  const managing = !!session && !preview;
  const adminCatalog = useAdminCatalog(managing ? session?.token : undefined);
  const operations = useOperations(managing ? session?.token : undefined);
  useEffect(() => {
    if (managing && operationViews.includes(currentView))
      void operations.reload();
  }, [currentView, managing, operations.reload]);
  const lockedScroll = useRef<number | null>(null);
  const returnScroll = useRef<number | null>(null);
  const adminView = adminViews.some((view) => view === currentView);
  const recoveringAccess =
    !!recoveryCallback ||
    (entryPath() === "/admin" &&
      new URLSearchParams(window.location.search).get("recuperar") === "1");
  const overlayOpen =
    profileOpen ||
    isMenuOpen ||
    (loginOpen && (!session || recoveringAccess) && !restoringSession) ||
    showInstructions;

  useEffect(() => {
    if (session && !recoveringAccess) setLoginOpen(false);
  }, [session, recoveringAccess]);

  useEffect(() => {
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    const colors = getComputedStyle(root);
    const brand = colors.getPropertyValue("--pd-color-brand").trim();
    const canvas = colors.getPropertyValue("--pd-color-canvas").trim();
    const masthead =
      currentView === "home" ||
      currentView === "welcome" ||
      currentView === "categories-list" ||
      adminView;
    function updateStatusArea() {
      const showBrand =
        masthead && (lockedScroll.current ?? window.scrollY) < 8;
      const state = String(showBrand);
      if (root.dataset.brandStatus === state) return;
      root.dataset.brandStatus = state;
      meta?.setAttribute("content", showBrand ? brand : canvas);
    }
    updateStatusArea();
    window.addEventListener("scroll", updateStatusArea, { passive: true });
    return () => window.removeEventListener("scroll", updateStatusArea);
  }, [currentView, adminView, appearance]);

  useLayoutEffect(() => {
    if (!overlayOpen) return;
    const { style } = document.body;
    const { position, top, width } = style;
    lockedScroll.current = window.scrollY;
    style.position = "fixed";
    style.top = -lockedScroll.current + "px";
    style.width = document.documentElement.clientWidth + "px";
    return () => {
      Object.assign(style, { position, top, width });
      window.scrollTo({ top: lockedScroll.current ?? 0, behavior: "instant" });
      lockedScroll.current = null;
    };
  }, [overlayOpen]);

  useLayoutEffect(() => {
    if (recoveryCallback)
      window.history.replaceState(
        window.history.state,
        "",
        "/admin?recuperar=1",
      );
  }, [recoveryCallback]);

  useEffect(() => {
    if (!notice || loginOpen) return;
    const timeout = window.setTimeout(() => setNotice(""), 6500);
    return () => window.clearTimeout(timeout);
  }, [notice, loginOpen]);

  useEffect(() => {
    const syncLocation = () => setRoute(readRoute(!!selectedProduct));
    window.addEventListener("popstate", syncLocation);
    window.addEventListener("hashchange", syncLocation);
    return () => {
      window.removeEventListener("popstate", syncLocation);
      window.removeEventListener("hashchange", syncLocation);
    };
  }, [selectedProduct]);
  useLayoutEffect(() => {
    if (returnScroll.current === null) return;
    const scroll = returnScroll.current;
    returnScroll.current = null;
    const frame = requestAnimationFrame(() =>
      window.scrollTo({ top: scroll, behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [currentView]);

  const handleNavigate = useCallback(
    (view: View, id?: string, returnTo?: View) => {
      if (view !== currentView || id !== route.id) {
        const suffix = id ? "/" + encodeURIComponent(id) : "";
        const origin = returnTo
          ? ({
              view: returnTo,
              scroll: lockedScroll.current ?? window.scrollY,
            } satisfies ReturnRoute)
          : undefined;
        window.history.pushState(
          { origin },
          "",
          (storePath() || "/") +
            (view === "product-editor" && !id ? window.location.search : "") +
            "#" +
            view +
            suffix,
        );
        setRoute({ view, id });
        setNotice("");
      }
      if (lockedScroll.current !== null) lockedScroll.current = 0;
      else window.scrollTo({ top: 0, behavior: "instant" });
    },
    [currentView, route.id],
  );

  function closePanel() {
    if (recoveryCallback && "token" in recoveryCallback)
      void signOut(recoveryCallback.token).catch(() => {});
    setRecoveryCallback(null);
    if (entryPath() === "/admin" || entryPath() === "/precificacao") {
      window.history.replaceState(window.history.state, "", "/#" + currentView);
    }
    setLoginOpen(false);
  }

  function handleLogin(next: CatalogSession) {
    acceptSession(next);
    closePanel();
    setNotice("");
  }

  function handleLogout() {
    logoutSession();
    setPreview(false);
    setLoginOpen(false);
    if (adminView) handleNavigate("home");
    setNotice("Sessão encerrada.");
  }

  const openLogin = () => {
    setNotice("");
    setLoginOpen(true);
  };
  const openProductEditor = managing
    ? (id: string) => openEditor("product-editor", id)
    : undefined;
  const openCategoryEditor = managing
    ? (id: string) => openEditor("category-editor", id)
    : undefined;

  function openEditor(view: "product-editor" | "category-editor", id: string) {
    handleNavigate(view, id, currentView);
  }

  function leaveEditor() {
    const origin = window.history.state?.origin as ReturnRoute | undefined;
    if (origin && (origin.view !== "product-details" || selectedProduct)) {
      returnScroll.current = origin.scroll;
      window.history.back();
      return;
    }
    handleNavigate("catalog-admin");
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
      setActiveRecCategory(
        change.saved?.name ?? change.destination?.name ?? "all",
      );
    }
  }

  function onCatalogChanged(id: string, row: CatalogRow | null) {
    applyChange(id, row);
    adminCatalog.reload();
    const removedFromDetails =
      selectedProduct?.id === id &&
      !editingCartItem &&
      !row?.published &&
      window.history.state?.origin?.view === "product-details";
    if (selectedProduct?.id === id && !editingCartItem) {
      if (row?.published) setSelectedProduct(toProduct(row));
      else {
        setSelectedProduct(null);
      }
    }
    if (removedFromDetails) handleNavigate(previousView);
    else leaveEditor();
    setNotice(
      row
        ? row.published
          ? "Produto guardado no catálogo."
          : "Rascunho guardado."
        : "Produto excluído.",
    );
  }

  const handleProductClick = useCallback(
    (product: Product) => {
      setPreviousView(currentView);
      setSelectedProduct(product);
      setEditingCartItem(
        [...cart].reverse().find((item) => item.id === product.id) ?? null,
      );
      handleNavigate("product-details");
    },
    [currentView, handleNavigate, cart],
  );

  const handleEditCartItem = useCallback(
    (item: CartItem) => {
      setPreviousView(currentView);
      setSelectedProduct(
        products.find((p) => p.id === item.id) ?? {
          ...item,
          price: item.basePrice ?? item.price,
        },
      );
      setEditingCartItem(item);
      handleNavigate("product-details");
    },
    [currentView, handleNavigate, products],
  );

  const selectOrConfigure = (product: Product, event?: React.MouseEvent) => {
    if (hasPurchaseOptions(product)) {
      event?.stopPropagation();
      handleProductClick(product);
      return;
    }
    event?.stopPropagation();
    addToCart(product, { quantity: 1, mode: "preorder" });
  };

  const commonProps = {
    onNavigate: handleNavigate,
    onOpenMenu: () => setIsMenuOpen(true),
  };
  const catalogNotice = status !== "ready" && (
    <div
      className={
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-surface " +
        (currentView === "home"
          ? "mx-auto max-w-6xl px-4 py-2 sm:px-6"
          : "justify-center bg-amber-50 p-3")
      }
      role="status"
    >
      {status === "loading"
        ? "A carregar o catálogo…"
        : "Catálogo temporariamente indisponível."}
      {status === "error" && (
        <button
          type="button"
          onClick={reload}
          className="font-bold text-primary underline"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
  const adminTitle =
    operationTitles[currentView] ??
    (currentView === "catalog-admin"
      ? "Gerir catálogo"
      : currentView === "pricing"
        ? "Precificação"
        : currentView === "store-texts"
          ? "Textos da loja"
          : currentView === "category-editor"
            ? "Editar categoria"
            : route.id
              ? "Editar produto"
              : "Novo produto");
  const adminStatus = adminCatalog.error ? (
    <div role="alert" className="space-y-2 text-sm text-primary">
      <p>{adminCatalog.error}</p>
      <button
        type="button"
        className="min-h-11 underline"
        onClick={adminCatalog.reload}
      >
        Tentar novamente
      </button>
    </div>
  ) : (
    <p role="status">A carregar catálogo…</p>
  );

  function editorContent() {
    if (!session) return null;
    if (!adminCatalog.data) return adminStatus;
    const data = adminCatalog.data;
    if (currentView === "product-editor")
      return (
        <CatalogEditor
          key={route.id ?? "new"}
          productId={route.id}
          token={session.token}
          categories={data.categories}
          rows={data.rows}
          onCategoryCreated={onCategoryCreated}
          onCategoryChanged={onCategoryChanged}
          onCancel={leaveEditor}
          onChanged={onCatalogChanged}
        />
      );
    const category = data.categories.find((item) => item.id === route.id);
    if (!category)
      return <p role="alert">Esta categoria já não está disponível.</p>;
    return (
      <CategoryEditor
        key={category.id}
        category={category}
        categories={data.categories}
        rows={data.rows}
        token={session.token}
        onBack={leaveEditor}
        onNewProduct={() => {
          window.history.replaceState(
            window.history.state,
            "",
            (storePath() || "/") +
              "?categoria=" +
              category.id +
              "#category-editor/" +
              category.id,
          );
          handleNavigate("product-editor");
        }}
        onChanged={(change) => {
          onCategoryChanged(change);
          leaveEditor();
          setNotice(
            change.saved ? "Categoria guardada." : "Categoria excluída.",
          );
        }}
      />
    );
  }

  function presentationEditor() {
    if (!session) return null;
    if (!presentation.revision)
      return presentationError ? (
        <div role="alert" className="space-y-2">
          <p>Não foi possível carregar os textos da loja.</p>
          <button
            type="button"
            className="ui-secondary"
            onClick={() => {
              setPresentationError(false);
              setPresentationAttempt((value) => value + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <p role="status">A carregar os textos…</p>
      );
    return (
      <StorePresentationEditor
        current={presentation}
        token={session.token}
        onSave={(value: StorePresentation) => {
          setPresentation(value);
          setNotice("Textos da loja guardados.");
        }}
      />
    );
  }

  return (
    <AccountProvider
      token={session?.token}
      open={profileOpen}
      onOpenChange={setProfileOpen}
      onLogin={openLogin}
    >
      <LiveEditingProvider
        value={
          managing && session
            ? {
                token: session.token,
                reload: async () => {
                  reload();
                  adminCatalog.reload();
                  await Promise.all([operations.reload(), reloadStore()]);
                },
              }
            : null
        }
      >
        <div
          className={
            "app-theme " +
            (session
              ? preview
                ? "preview-management "
                : "with-management "
              : "") +
            "relative min-h-screen overflow-x-clip bg-porcelain font-sans text-base font-normal text-on-surface"
          }
        >
          {session && (
            <ManagementNav
              current={currentView}
              onNavigate={handleNavigate}
              onMenu={() => setIsMenuOpen(true)}
              preview={preview}
              onPreview={() => {
                setPreview((p) => !p);
                handleNavigate("home");
              }}
            />
          )}
          <div className="w-full min-h-screen relative">
            <Sidebar
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              onNavigate={(view) =>
                handleNavigate(
                  view,
                  undefined,
                  view === "catalog-admin" ||
                    !adminViews.some((item) => item === view)
                    ? undefined
                    : currentView,
                )
              }
              isAdmin={managing}
              onPreview={
                managing
                  ? () => {
                      setPreview(true);
                      handleNavigate("home");
                    }
                  : undefined
              }
              onLogin={openLogin}
              onLogout={handleLogout}
              onInstall={installed ? undefined : install}
              canInstallDirectly={canPrompt}
            />

            {currentView !== "home" && !adminView && catalogNotice}
            {sessionError && (
              <div
                role="status"
                className="page-width flex flex-wrap items-center gap-2 py-2 text-sm text-primary"
              >
                <p>{sessionError}</p>
                <button
                  type="button"
                  className="ui-quiet-action"
                  onClick={() => void retrySession()}
                >
                  Tentar novamente
                </button>
              </div>
            )}
            {managing &&
              operationViews.includes(currentView) &&
              operations.error &&
              operations.data && (
                <div
                  role="status"
                  className="page-width py-3 text-sm text-primary"
                >
                  Não foi possível atualizar. A última lista carregada continua
                  disponível. Use Atualizar para tentar novamente.
                </div>
              )}
            <main className="min-h-screen flex flex-col">
              <AnimatePresence mode="wait">
                {currentView === "welcome" && (
                  <WelcomeScreen key="welcome" {...commonProps} />
                )}

                {currentView === "home" && (
                  <HomeScreen
                    key="home"
                    products={products}
                    categories={categories}
                    cart={cart}
                    isAdmin={managing}
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

                {currentView === "product-list" && (
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

                {currentView === "product-details" && selectedProduct && (
                  <ProductDetailScreen
                    key="product-details"
                    product={selectedProduct}
                    categoryId={
                      categories.find(
                        (c) => c.name === selectedProduct.category,
                      )?.id
                    }
                    onEditProduct={
                      editingCartItem ? undefined : openProductEditor
                    }
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

                {currentView === "cart" && (
                  <CartScreen
                    key="cart"
                    draft={checkoutDraft}
                    setDraft={setCheckoutDraft}
                    cart={cart}
                    onUpdateQuantity={updateQuantity}
                    onEditItem={handleEditCartItem}
                    onNavigate={handleNavigate}
                  />
                )}

                {currentView === "settings" && (
                  <SettingsScreen
                    key="settings"
                    mode="about"
                    aboutText={presentation.about_text}
                    {...commonProps}
                  />
                )}

                {currentView === "contact" && (
                  <SettingsScreen
                    key="contact"
                    mode="contact"
                    aboutText={presentation.about_text}
                    {...commonProps}
                  />
                )}

                {currentView === "categories-list" && (
                  <CategoriesScreen
                    key="categories"
                    categories={categories}
                    overview={
                      managing && !adminCatalog.error
                        ? adminCatalog.data
                        : undefined
                    }
                    products={products}
                    cart={cart}
                    onProductClick={handleProductClick}
                    onEditProduct={openProductEditor}
                    onEditCategory={openCategoryEditor}
                    onToggleCartItem={selectOrConfigure}
                    onNavigate={handleNavigate}
                  />
                )}

                {currentView === "saved" && (
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
                  <AdminPage
                    key={currentView + (route.id ?? "")}
                    title={adminTitle}
                    onRefresh={
                      operationViews.includes(currentView) && managing
                        ? () => void operations.reload()
                        : undefined
                    }
                    refreshing={operations.loading}
                    wide={
                      currentView === "catalog-admin" ||
                      operationViews.includes(currentView)
                    }
                    onMenu={commonProps.onOpenMenu}
                    onBack={
                      operationViews.includes(currentView) ||
                      currentView === "catalog-admin" ||
                      !session
                        ? () => handleNavigate("home")
                        : leaveEditor
                    }
                  >
                    {managing && session ? (
                      <Suspense fallback={<p role="status">A carregar…</p>}>
                        {operationViews.includes(currentView) &&
                          (operations.error && !operations.data ? (
                            <div role="alert" className="module-error">
                              {operations.error}
                              <button
                                className="ui-secondary"
                                onClick={() => void operations.reload()}
                              >
                                Tentar novamente
                              </button>
                            </div>
                          ) : operations.data && adminCatalog.data ? (
                            <OperationsScreen
                              key={currentView}
                              view={currentView}
                              data={operations.data}
                              token={session.token}
                              rows={adminCatalog.data.rows}
                              onNavigate={handleNavigate}
                              reload={async () => {
                                await operations.reload();
                                await reloadStore();
                              }}
                            />
                          ) : (
                            <p role="status">A carregar a gestão…</p>
                          ))}
                        {currentView === "catalog-admin" && (
                          <>
                            {(!adminCatalog.data || adminCatalog.error) &&
                              adminStatus}
                            {adminCatalog.data && (
                              <CatalogManagement
                                categories={adminCatalog.data.categories}
                                rows={adminCatalog.data.rows}
                                token={session.token}
                                onNew={() =>
                                  handleNavigate(
                                    "product-editor",
                                    undefined,
                                    currentView,
                                  )
                                }
                                onEdit={(id) =>
                                  openEditor("product-editor", id)
                                }
                                onEditCategory={(id) =>
                                  openEditor("category-editor", id)
                                }
                                onCategoryCreated={onCategoryCreated}
                              />
                            )}
                          </>
                        )}
                        {currentView === "pricing" &&
                          (adminCatalog.data ? (
                            <PricingScreen
                              ingredients={operations.data?.ingredients || []}
                              rows={adminCatalog.data.rows}
                              token={session.token}
                              onProductChanged={(row) => {
                                applyChange(row.id, row);
                                adminCatalog.reload();
                              }}
                            />
                          ) : (
                            adminStatus
                          ))}
                        {currentView === "store-texts" && presentationEditor()}
                        {(currentView === "product-editor" ||
                          currentView === "category-editor") &&
                          editorContent()}
                      </Suspense>
                    ) : (
                      <section className="ui-glass-panel space-y-3">
                        <p className="text-sm text-muted">
                          {restoringSession
                            ? "A restaurar o acesso…"
                            : "Entre com a conta da confeitaria para usar este módulo."}
                        </p>
                        <button
                          type="button"
                          className="ui-primary"
                          onClick={openLogin}
                        >
                          Entrar
                        </button>
                      </section>
                    )}
                  </AdminPage>
                )}
              </AnimatePresence>
            </main>

            {loginOpen &&
              !restoringSession &&
              (!session || recoveringAccess) && (
                <StoreDialog
                  title="Entrar na Presente Doce"
                  onClose={closePanel}
                >
                  <Suspense fallback={<p role="status">A carregar…</p>}>
                    <AccountForm
                      initialRecovery={
                        entryPath() === "/admin" &&
                        new URLSearchParams(window.location.search).get(
                          "recuperar",
                        ) === "1"
                      }
                      callback={recoveryCallback}
                      onLogin={handleLogin}
                      onRecoveryComplete={() => {
                        logoutSession();
                        setRecoveryCallback(null);
                      }}
                    />
                  </Suspense>
                </StoreDialog>
              )}
            {showInstructions && (
              <StoreDialog
                title="Como instalar a Presente Doce"
                onClose={closeInstructions}
              >
                <div className="flex items-start gap-3">
                  <img
                    src="/apple-touch-icon.png"
                    alt=""
                    width={44}
                    height={44}
                    className="rounded-xl"
                  />
                  <div className="space-y-2 text-sm text-muted">
                    {appleMobile ? (
                      <p>
                        No Safari, toque em{" "}
                        <strong>Partilhar → Adicionar ao ecrã principal</strong>
                        . Ative <strong>Abrir como app</strong> se aparecer e
                        toque em <strong>Adicionar</strong>.
                      </p>
                    ) : (
                      <p>
                        No menu do navegador, escolha{" "}
                        <strong>Instalar app</strong> ou{" "}
                        <strong>Adicionar ao ecrã principal</strong>, quando
                        disponível.
                      </p>
                    )}
                    <p>O ícone Presente Doce fica no ecrã principal.</p>
                  </div>
                </div>
              </StoreDialog>
            )}

            {notice && !loginOpen && (
              <div
                role="status"
                className="fixed bottom-28 left-1/2 z-[90] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-primary/15 bg-porcelain px-4 py-2 text-sm font-bold text-primary shadow-lg"
              >
                {notice}
                <button
                  type="button"
                  onClick={() => setNotice("")}
                  aria-label="Dispensar aviso"
                  className="p-2 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            )}

            <FloatingCart
              added={showSuccessToast}
              cart={cart}
              cartTotal={cartTotal}
              onNavigate={handleNavigate}
              isVisible={
                !adminView &&
                currentView !== "cart" &&
                currentView !== "welcome" &&
                currentView !== "product-details"
              }
            />
            {!managing && (
              <ContactAssistant
                visible={
                  !overlayOpen &&
                  [
                    "home",
                    "categories-list",
                    "product-list",
                    "product-details",
                    "saved",
                  ].includes(currentView)
                }
                aboveOrder={
                  cart.length > 0 || currentView === "product-details"
                }
              />
            )}

            <AnimatePresence></AnimatePresence>
          </div>
        </div>
      </LiveEditingProvider>
    </AccountProvider>
  );
}
