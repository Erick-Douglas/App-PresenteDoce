import React, { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { useCart } from './hooks/useCart';
import { useCheckout } from './hooks/useCheckout';
import { useFavorites } from './hooks/useFavorites';
import { useGoogleMaps } from './hooks/useGoogleMaps';

import { BUSINESS_INFO } from './constants';
import { Product, View, CartItem } from './types';

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

  // Handle browser back button natively
  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const view = e.state?.view || window.location.hash.replace('#', '') || 'welcome';
      setCurrentView(view as View);
    };
    window.addEventListener('popstate', handlePopState);
    
    // Initialize state
    if (!window.history.state?.view) {
      window.history.replaceState({ view: 'welcome' }, '', '#welcome');
    }
    return () => window.removeEventListener('popstate', handlePopState);
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

    const deliveryInfo = checkout.deliveryMethod === 'delivery'
      ? `\nEndereço: ${checkout.address.address}${checkout.address.apartment ? `, ${checkout.address.apartment}` : ''}${checkout.address.city ? ` (${checkout.address.city})` : ''}\nCEP: ${checkout.address.postal_code || '-'}\nEntrega: € ${checkout.currentDeliveryFee.toFixed(2)}`
      : `\nRecolha no local: ${BUSINESS_INFO.address}`;

    const labels: Record<string, string> = { cash: 'Dinheiro', mbway: 'MB WAY', wise: 'Wise' };
    const paymentLabel = checkout.paymentMethod === 'cash' && checkout.needsChange
      ? `${labels.cash} (Troco para € ${checkout.changeAmount})`
      : labels[checkout.paymentMethod];

    const itemsList = cart
      .map((item) => {
        let line = `- ${item.quantity}x ${item.name} (€ ${(item.price * item.quantity).toFixed(2)})`;
        if (item.tamanho) line += `\n  📏 Tamanho: ${item.tamanho}`;
        if (item.massa) line += `\n  🍰 Massa: ${item.massa}`;
        if (item.recheio1) line += `\n  🍫 Recheio 1: ${item.recheio1}`;
        if (item.recheio2 && item.recheio2 !== item.recheio1) line += `\n  🍫 Recheio 2: ${item.recheio2}`;
        if (item.tema) line += `\n  🎨 Tema: ${item.tema}`;
        if (item.category === 'Brigadeiros') {
          if (item.variant) line += `\n  📦 ${item.variant}`;
          if (item.selectedFlavors && item.selectedFlavors.length > 0) line += `\n  🍬 Sabores: ${item.selectedFlavors.join(', ')}`;
        }
        if (item.observations) line += `\n  📝 Obs: ${item.observations}`;
        return line;
      })
      .join('\n\n');

    const text = `🛒 *NOVO PEDIDO*\n\n👤 *Cliente:* ${customerName}\n📱 *Contato:* ${customerPhone}\n\n*ITENS:*\n${itemsList}\n${deliveryInfo}\n\n💳 *Pagamento:* ${paymentLabel}\n💰 *Total da Encomenda: € ${grandTotal.toFixed(2)}*`;

    const encodedText = encodeURIComponent(text);
    const waUrl = `https://wa.me/${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}?text=${encodedText}`;
    
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
