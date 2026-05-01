import React, { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { useCart } from './features/cart/useCart';
import { useCheckout } from './features/checkout/useCheckout';
import { useFavorites } from './features/products/useFavorites';
import { useGoogleMaps } from './services/maps/useGoogleMaps';

import { BUSINESS_INFO } from './config/constants';
import { Product, View, CartItem } from './config/types';
import { generateWhatsAppOrderLink } from './services/whatsapp/whatsappService';

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
import { ExitIntentModal } from './components/ExitIntentModal';

const EMPTY_ADDRESS = {
  address: '',
  apartment: '',
  city: '',
  postal_code: '',
  reference: '',
  lat: null as null,
  lng: null as null,
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('welcome');
  const [previousView, setPreviousView] = useState<View>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [activeRecCategory, setActiveRecCategory] = useState('Caseiros');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [homeBgConfig] = useState({ type: 'color' as 'color' | 'image', value: '#800000' });

  const historyStack = useRef<View[]>(['welcome']);
  const isInternalNavigation = useRef(false);

  const { cart, cartTotal, showSuccessToast, addToCart, removeFromCart, updateQuantity, toggleCartItem, clearCart, updateCartItem } = useCart();
  const { isGoogleLoaded } = useGoogleMaps();
  const { favorites, toggleFavorite } = useFavorites();
  const checkout = useCheckout(isGoogleLoaded);

  const grandTotal = cartTotal + checkout.currentDeliveryFee;

  const [showExitModal, setShowExitModal] = useState(false);
  const hasTrappedExit = useRef(false);
  const currentViewRef = useRef(currentView);

  React.useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  // Handle browser back button natively & Exit Intent
  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.exitIntent) {
        if (!hasTrappedExit.current) {
          hasTrappedExit.current = true;
          window.history.pushState({ view: currentViewRef.current }, '', `#${currentViewRef.current}`);
          setShowExitModal(true);
        } else {
          window.history.back();
        }
        return;
      }
      const view = e.state?.view || window.location.hash.replace('#', '') || 'welcome';
      setCurrentView(view as View);
    };
    window.addEventListener('popstate', handlePopState);

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasTrappedExit.current) {
        hasTrappedExit.current = true;
        setShowExitModal(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    // Initialize state
    if (!window.history.state) {
      window.history.replaceState({ exitIntent: true }, '');
      window.history.pushState({ view: 'welcome' }, '', '#welcome');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Custom navigation that updates history
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

  const resetCheckoutState = () => {
    checkout.setGuestCustomer({ name: '', phone: '' });
    checkout.setDeliveryMethod(null);
    checkout.setPaymentMethod(null);
    checkout.setNeedsChange(false);
    checkout.setChangeAmount('');
    checkout.setAddress(EMPTY_ADDRESS);
    checkout.setIsAddressEditing(true);
    checkout.setShowAddressError(false);
    checkout.setSaveAddressAsDefault(false);
  };

  const handleFinalCheckout = () => {
    const customerName = checkout.guestCustomer.name.trim();
    const customerPhone = checkout.guestCustomer.phone.trim();

    if (!customerName) {
      alert('Por favor, informe o seu nome.');
      return;
    }

    if (!customerPhone) {
      alert('Por favor, informe o seu telefone.');
      return;
    }

    if (!checkout.deliveryMethod) {
      alert('Por favor, selecione o método de entrega.');
      return;
    }

    if (checkout.deliveryMethod === 'delivery' && !checkout.address.address.trim()) {
      checkout.setShowAddressError(true);
      return;
    }

    if (!checkout.paymentMethod) {
      alert('Por favor, selecione uma forma de pagamento.');
      return;
    }

    const waUrl = generateWhatsAppOrderLink({
      customerName,
      customerPhone,
      deliveryMethod: checkout.deliveryMethod,
      address: checkout.address,
      paymentMethod: checkout.paymentMethod,
      needsChange: checkout.needsChange,
      changeAmount: checkout.changeAmount,
      currentDeliveryFee: checkout.currentDeliveryFee,
      cart,
      grandTotal
    });

    window.open(waUrl, '_blank');

    clearCart();
    resetCheckoutState();
    handleNavigate('home');
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

        <ExitIntentModal 
          isOpen={showExitModal} 
          onClose={() => setShowExitModal(false)}
          onConfirmExit={() => {
            setShowExitModal(false);
            window.history.back();
          }} 
        />

        <main className="min-h-screen flex flex-col">
          <AnimatePresence mode="wait">
            {currentView === 'welcome' && <WelcomeScreen key="welcome" onNavigate={handleNavigate} />}

            {currentView === 'home' && (
              <HomeScreen
                key="home"
                cart={cart}
                favorites={favorites}
                homeBgConfig={homeBgConfig}
                {...commonProps}
                onSetCategory={setActiveRecCategory}
                onProductClick={handleProductClick}
                onToggleFavorite={toggleFavorite}
                onToggleCartItem={toggleCartItem}
              />
            )}

            {currentView === 'product-list' && (
              <ProductListScreen
                key="product-list"
                cart={cart}
                favorites={favorites}
                activeRecCategory={activeRecCategory}
                {...commonProps}
                onSetCategory={setActiveRecCategory}
                onProductClick={handleProductClick}
                onToggleFavorite={toggleFavorite}
                onToggleCartItem={toggleCartItem}
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
                {...checkout}
                cart={cart}
                cartTotal={cartTotal}
                grandTotal={grandTotal}
                isGoogleLoaded={isGoogleLoaded}
                onUpdateQuantity={updateQuantity}
                onRemoveFromCart={removeFromCart}
                onEditItem={handleEditCartItem}
                onCheckout={handleFinalCheckout}
                onNavigate={handleNavigate}
                onSetDeliveryMethod={checkout.setDeliveryMethod}
                onSetPaymentMethod={checkout.setPaymentMethod}
                onSetGuestCustomer={checkout.setGuestCustomer}
                onSetAddress={checkout.setAddress}
                onSetNeedsChange={checkout.setNeedsChange}
                onSetChangeAmount={checkout.setChangeAmount}
                onSetAddressEditing={checkout.setIsAddressEditing}
                onSetShowAddressError={checkout.setShowAddressError}
                onSetSaveAddressAsDefault={checkout.setSaveAddressAsDefault}
                onLocate={checkout.handleLocate}
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
                cart={cart}
                favorites={favorites}
                onProductClick={handleProductClick}
                onToggleFavorite={toggleFavorite}
                onToggleCartItem={toggleCartItem}
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
