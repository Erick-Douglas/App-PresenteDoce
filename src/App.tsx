import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { useCart } from './hooks/useCart';
import { useCheckout } from './hooks/useCheckout';
import { useFavorites } from './hooks/useFavorites';
import { useGoogleMaps } from './hooks/useGoogleMaps';

import { BUSINESS_INFO } from './constants';
import { Product, View } from './types';

import { WelcomeScreen } from './screens/WelcomeScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProductListScreen } from './screens/ProductListScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { CartScreen } from './screens/CartScreen';
import { SavedScreen } from './screens/SavedScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';

import { Sidebar } from './components/Sidebar';
import { FloatingCart } from './components/FloatingCart';

const EMPTY_ADDRESS = {
  address: '',
  apartment: '',
  city: '',
  postal_code: '',
  reference: '',
  lat: null,
  lng: null,
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('welcome');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRecCategory, setActiveRecCategory] = useState('Bolos');
  const [orderCounter, setOrderCounter] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [homeBgConfig, setHomeBgConfig] = useState({ type: 'color' as 'color' | 'image', value: '#800000' });
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const historyStack = useRef<View[]>(['welcome']);
  const isInternalNavigation = useRef(false);

  const { cart, cartTotal, showSuccessToast, addToCart, removeFromCart, updateQuantity, toggleCartItem, clearCart } = useCart();
  const { isGoogleLoaded } = useGoogleMaps();
  const { favorites, toggleFavorite } = useFavorites();
  const checkout = useCheckout(isGoogleLoaded);

  const grandTotal = cartTotal + checkout.currentDeliveryFee;

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isInternalNavigation.current) {
        isInternalNavigation.current = false;
        return;
      }
      
      // Prevent going back beyond the first page
      if (historyStack.current.length > 1) {
        e.preventDefault();
        historyStack.current.pop(); // Remove current view
        const previousView = historyStack.current[historyStack.current.length - 1];
        setCurrentView(previousView);
      } else {
        // Allow natural back behavior on first page
        historyStack.current = ['welcome'];
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Custom navigation that updates history
  const handleNavigate = useCallback((view: View) => {
    // Don't add duplicate consecutive views
    if (view !== currentView) {
      historyStack.current.push(view);
      isInternalNavigation.current = true;
      window.history.pushState({ view }, '', `#${view}`);
    }
    setCurrentView(view);
  }, [currentView]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setHasScrolledOnce(true);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product-details');
  }, []);

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
      alert('Por favor, selecione o metodo de entrega.');
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

    const deliveryInfo = checkout.deliveryMethod === 'delivery'
      ? `\nEndereco: ${checkout.address.address}${checkout.address.apartment ? `, ${checkout.address.apartment}` : ''}${checkout.address.city ? ` (${checkout.address.city})` : ''}\nCEP: ${checkout.address.postal_code || '-'}\nEntrega: € ${checkout.currentDeliveryFee.toFixed(2)}`
      : `\nRecolha no local: ${BUSINESS_INFO.address}`;

    const labels = { cash: 'Dinheiro', mbway: 'MB WAY', wise: 'Wise' };
    const paymentLabel = checkout.paymentMethod === 'cash' && checkout.needsChange
      ? `${labels.cash} (Troco para € ${checkout.changeAmount})`
      : labels[checkout.paymentMethod];

    const orderId = String(orderCounter).padStart(4, '0');
    const itemsList = cart
      .map((item) => `- ${item.quantity}x ${item.name} (€ ${(item.price * item.quantity).toFixed(2)})`)
      .join('\n');

    const message = `*Pedido #${orderId} - Presente Doce*\n\n*Cliente:* ${customerName}\n*Telemovel:* ${customerPhone}\n\n*Metodo:* ${checkout.deliveryMethod === 'delivery' ? 'Entrega' : 'Recolha'}${deliveryInfo}\n*Pagamento:* ${paymentLabel}\n\n*Artigos:*\n${itemsList}\n\n*Total:* € ${grandTotal.toFixed(2)}`;

    setOrderCounter((prev) => prev + 1);
    window.open(`https://wa.me/${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');

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

        <main className="min-h-screen flex flex-col">
          <AnimatePresence mode="wait">
            {currentView === 'welcome' && <WelcomeScreen key="welcome" onNavigate={handleNavigate} />}

            {currentView === 'home' && (
              <HomeScreen
                key="home"
                cart={cart}
                cartTotal={cartTotal}
                favorites={favorites}
                activeRecCategory={activeRecCategory}
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
                cartTotal={cartTotal}
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
                onToggleFavorite={toggleFavorite}
                onNavigate={setCurrentView}
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
                onCheckout={handleFinalCheckout}
                onNavigate={setCurrentView}
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
                cart={cart}
                cartTotal={cartTotal}
                mode="about"
                {...commonProps}
              />
            )}

            {currentView === 'contact' && (
              <SettingsScreen
                key="contact"
                cart={cart}
                cartTotal={cartTotal}
                mode="contact"
                {...commonProps}
              />
            )}

            {currentView === 'categories-list' && (
              <CategoriesScreen
                key="categories"
                cart={cart}
                cartTotal={cartTotal}
                activeCategory={activeRecCategory}
                onSetCategory={setActiveRecCategory}
                {...commonProps}
              />
            )}

            {currentView === 'saved' && (
              <SavedScreen
                key="saved"
                cart={cart}
                cartTotal={cartTotal}
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
