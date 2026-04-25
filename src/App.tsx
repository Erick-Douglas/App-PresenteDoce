/**
 * App.tsx — Router principal (thin orchestrator)
 * Todo o estado está organizado em hooks dedicados.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { useOrders } from './hooks/useOrders';
import { useCheckout } from './hooks/useCheckout';
import { useFavorites } from './hooks/useFavorites';
import { useGoogleMaps } from './hooks/useGoogleMaps';

import { supabase } from './lib/supabase';
import { BUSINESS_INFO } from './constants';
import { Product, View } from './types';

import { AdminDashboard } from './components/AdminDashboard';

import { WelcomeScreen } from './screens/WelcomeScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProductListScreen } from './screens/ProductListScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { CartScreen } from './screens/CartScreen';
import { SavedScreen } from './screens/SavedScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { AddressEditorScreen } from './screens/AddressEditorScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { AuthScreen } from './screens/AuthScreen';

import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { FloatingCart } from './components/FloatingCart';
import { Plus } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('welcome');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRecCategory, setActiveRecCategory] = useState('Bolos');
  const [orderCounter, setOrderCounter] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [homeBgConfig, setHomeBgConfig] = useState({ type: 'color' as 'color' | 'image', value: '#800000' });
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);

  const { user, isAuthLoading, fetchUserProfile, handleSignIn, handleSignUp, handleSignOut, persistDefaultAddress, handleProfilePicUpload } = useAuth();
  const { cart, cartTotal, showSuccessToast, addToCart, removeFromCart, updateQuantity, toggleCartItem, clearCart } = useCart();
  const { orders, fetchUserOrders } = useOrders();
  const { isGoogleLoaded } = useGoogleMaps();
  const { favorites, toggleFavorite } = useFavorites();
  const checkout = useCheckout(isGoogleLoaded);

  const grandTotal = cartTotal + checkout.currentDeliveryFee;

  // Scroll logic for BottomNav
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setHasScrolledOnce(true);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load user orders when user changes
  useEffect(() => {
    if (user?.id) fetchUserOrders(user.id);
  }, [user?.id, fetchUserOrders]);

  // Pre-fill address from profile when entering cart
  useEffect(() => {
    if (currentView === 'cart' && user) {
      checkout.prefillAddress(user);
    }
  }, [currentView, user]);

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product-details');
  }, []);

  const handleFinalCheckout = () => {
    if (!checkout.deliveryMethod) { alert('Por favor, selecione o método de entrega.'); return; }
    if (checkout.deliveryMethod === 'delivery' && !checkout.address.address) {
      checkout.setShowAddressError(true);
      return;
    }
    if (!checkout.paymentMethod) { alert('Por favor, selecione uma forma de pagamento.'); return; }

    const deliveryInfo = checkout.deliveryMethod === 'delivery'
      ? `\n📍 Endereço: ${checkout.address.address}${checkout.address.apartment ? `, ${checkout.address.apartment}` : ''} (${checkout.address.city})\nCEP: ${checkout.address.postal_code}\n🚚 Entrega: € ${checkout.currentDeliveryFee.toFixed(2)}`
      : '\n🏪 Recolha no Local: Rua Miguel Ângelo, 21, 1 A';

    const labels = { cash: 'Dinheiro', mbway: 'MB WAY', wise: 'Wise' };
    const payStr = checkout.paymentMethod === 'cash' && checkout.needsChange
      ? `${labels.cash} (Troco para € ${checkout.changeAmount})`
      : labels[checkout.paymentMethod!];

    const orderId = String(orderCounter).padStart(4, '0');
    const message = `*Pedido #${orderId} - Presente Doce*\n\n*Cliente:* ${user?.name || 'Visitante'}\n*Telemóvel:* ${user?.phone || '-'}\n\n*Método:* ${checkout.deliveryMethod === 'delivery' ? 'Entrega' : 'Recolha'}${deliveryInfo}\n*Pagamento:* ${payStr}\n\n*Artigos:*\n${cart.map(i => `• ${i.quantity}x ${i.name} (€ ${(i.price * i.quantity).toFixed(2)})`).join('\n')}\n\n*Total:* € ${grandTotal.toFixed(2)}`;

    setOrderCounter(p => p + 1);

    supabase.from('orders').insert({
      user_id: user?.id ?? null,
      guest_name: user ? null : 'Visitante',
      items: cart,
      total: grandTotal,
      status: 'pending',
      delivery_method: checkout.deliveryMethod,
      payment_method: checkout.paymentMethod,
      delivery_address: checkout.address.address,
      delivery_city: checkout.address.city,
      delivery_postal_code: checkout.address.postal_code,
    }).then(async ({ error }) => {
      if (error) { console.error('Erro ao guardar pedido:', error); return; }
      if (user) await fetchUserOrders(user.id);
      if (user && checkout.deliveryMethod === 'delivery' && checkout.saveAddressAsDefault && checkout.address.address) {
        await persistDefaultAddress(checkout.address);
      }
    });

    window.open(`https://wa.me/${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    clearCart();
    checkout.setSaveAddressAsDefault(false);
    setCurrentView('home');
  };

  // Redirecionar se já estiver logado e tentar acessar 'register' ou 'welcome'
  useEffect(() => {
    if (!isAuthLoading && user && (currentView === 'register' || currentView === 'welcome')) {
      setCurrentView('home');
    }
  }, [user, isAuthLoading, currentView]);

  const commonProps = { onNavigate: setCurrentView, onOpenMenu: () => setIsMenuOpen(true) };

  if (isAuthLoading && currentView === 'welcome') {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <div className="w-full min-h-screen relative">
        <Sidebar
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          user={user}
          onNavigate={setCurrentView}
          onSignOut={handleSignOut}
        />

        <main className="min-h-screen flex flex-col">
          <AnimatePresence mode="wait">
            {currentView === 'welcome' && <WelcomeScreen key="welcome" onNavigate={setCurrentView} />}

            {currentView === 'home' && (
              <HomeScreen key="home" cart={cart} cartTotal={cartTotal} user={user} favorites={favorites}
                activeRecCategory={activeRecCategory} homeBgConfig={homeBgConfig}
                {...commonProps}
                onSetCategory={setActiveRecCategory}
                onProductClick={handleProductClick}
                onToggleFavorite={toggleFavorite}
                onToggleCartItem={toggleCartItem}
              />
            )}

            {currentView === 'product-list' && (
              <ProductListScreen key="product-list" cart={cart} cartTotal={cartTotal} favorites={favorites}
                activeRecCategory={activeRecCategory} {...commonProps}
                onSetCategory={setActiveRecCategory}
                onProductClick={handleProductClick}
                onToggleFavorite={toggleFavorite}
                onToggleCartItem={toggleCartItem}
              />
            )}

            {currentView === 'product-details' && selectedProduct && (
              <ProductDetailScreen key="product-details" product={selectedProduct} cart={cart} favorites={favorites}
                onAddToCart={addToCart} onToggleFavorite={toggleFavorite} onNavigate={setCurrentView}
              />
            )}

            {currentView === 'cart' && (
              <CartScreen
                key="cart"
                {...checkout}
                cart={cart} cartTotal={cartTotal} grandTotal={grandTotal}
                isGoogleLoaded={isGoogleLoaded} user={user}
                onUpdateQuantity={updateQuantity} onRemoveFromCart={removeFromCart}
                onCheckout={handleFinalCheckout} onNavigate={setCurrentView}
                onSetDeliveryMethod={checkout.setDeliveryMethod}
                onSetPaymentMethod={checkout.setPaymentMethod}
                onSetAddress={checkout.setAddress}
                onSetNeedsChange={checkout.setNeedsChange}
                onSetChangeAmount={checkout.setChangeAmount}
                onSetAddressEditing={checkout.setIsAddressEditing}
                onSetShowAddressError={checkout.setShowAddressError}
                onSetSaveAddressAsDefault={checkout.setSaveAddressAsDefault}
                onLocate={checkout.handleLocate}
              />
            )}

            {currentView === 'profile' && (
              <ProfileScreen key="profile" cart={cart} cartTotal={cartTotal} user={user}
                onProfilePicUpload={handleProfilePicUpload} {...commonProps}
              />
            )}

            {currentView === 'orders' && (
              <OrdersScreen key="orders" cart={cart} cartTotal={cartTotal} orders={orders}
                {...commonProps}
              />
            )}

            {currentView === 'address-editor' && (
              <AddressEditorScreen key="address-editor" cart={cart} cartTotal={cartTotal} user={user}
                address={checkout.address} isGoogleLoaded={isGoogleLoaded}
                onSetAddress={checkout.setAddress}
                onSave={() => { if (user) persistDefaultAddress(checkout.address).then(() => setCurrentView('profile')); }}
                {...commonProps}
              />
            )}

            {currentView === 'settings' && (
              <SettingsScreen key="settings" cart={cart} cartTotal={cartTotal} user={user}
                onSignOut={handleSignOut} {...commonProps}
              />
            )}

            {currentView === 'categories-list' && (
              <CategoriesScreen key="categories" cart={cart} cartTotal={cartTotal}
                activeCategory={activeRecCategory} onSetCategory={setActiveRecCategory}
                {...commonProps}
              />
            )}

            {currentView === 'saved' && (
              <SavedScreen key="saved" cart={cart} cartTotal={cartTotal} favorites={favorites}
                onProductClick={handleProductClick} onToggleFavorite={toggleFavorite}
                onToggleCartItem={toggleCartItem} {...commonProps}
              />
            )}

            {currentView === 'register' && (
              <AuthScreen key="auth"
                onSignIn={handleSignIn}
                onSignUp={handleSignUp}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'admin' && user?.is_admin && (
              <AdminDashboard
                key="admin"
                onBack={() => setCurrentView('home')}
                onNavigate={setCurrentView}
                homeBgConfig={homeBgConfig}
                onSetHomeBgConfig={setHomeBgConfig}
              />
            )}
          </AnimatePresence>
        </main>

        <FloatingCart
          cart={cart}
          cartTotal={cartTotal}
          onNavigate={setCurrentView}
          isVisible={currentView !== 'cart' && currentView !== 'welcome' && currentView !== 'register' && currentView !== 'product-details'}
        />

        <AnimatePresence>
          {showSuccessToast && (
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: -20 }} exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-screen-xl px-6 z-[100] flex justify-center pointer-events-none">
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
