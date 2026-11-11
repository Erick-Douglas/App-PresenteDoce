import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { useCart } from './features/cart/useCart';
import { useCatalog } from './features/products/useCatalog';
import { useFavorites } from './features/products/useFavorites';

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
  const [homeBgConfig] = useState({ type: 'color' as 'color' | 'image', value: '#800000' });

  const { cart, cartTotal, showSuccessToast, addToCart, updateQuantity, toggleCartItem, updateCartItem } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const { products, status, reload } = useCatalog();

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
        />

        {status !== 'ready' && (
          <div className="flex items-center justify-center gap-3 bg-amber-50 p-3 text-sm text-stone-800" role="status">
            {status === 'loading' ? 'A carregar o catálogo…' : 'Catálogo temporariamente indisponível.'}
            {status === 'error' && <button type="button" onClick={reload} className="font-bold text-primary underline">Tentar novamente</button>}
          </div>
        )}
        <main className="min-h-screen flex flex-col">
          <AnimatePresence mode="wait">
            {currentView === 'welcome' && <WelcomeScreen key="welcome" onNavigate={handleNavigate} />}

            {currentView === 'home' && (
              <HomeScreen
                key="home"
                products={products}
                cart={cart}
                favorites={favorites}
                homeBgConfig={homeBgConfig}
                {...commonProps}
                onSetCategory={setActiveRecCategory}
                onProductClick={handleProductClick}
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
                onToggleFavorite={toggleFavorite}
                onToggleCartItem={selectOrConfigure}
              />
            )}

            {currentView === 'product-details' && selectedProduct && (
              <ProductDetailScreen
                key="product-details"
                product={selectedProduct}
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
                onToggleFavorite={toggleFavorite}
                onToggleCartItem={selectOrConfigure}
                {...commonProps}
              />
            )}
          </AnimatePresence>
        </main>

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
