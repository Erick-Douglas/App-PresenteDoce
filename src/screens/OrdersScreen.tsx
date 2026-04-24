import React from 'react';
import { motion } from 'motion/react';
import { Menu, Package } from 'lucide-react';
import { View, CartItem } from '../types';

interface OrdersScreenProps {
  cart: CartItem[];
  cartTotal: number;
  orders: any[];
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({ cart, cartTotal, orders, onOpenMenu, onNavigate }) => {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen pb-32 bg-white">
      <header className="px-6 py-4 flex items-center sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-primary/5 shadow-sm">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary"><Menu size={20} /></button>
        <h1 className="font-headline font-black text-sm text-primary flex-1 text-center pr-8 tracking-widest uppercase">Meus Pedidos</h1>
      </header>
      <main className="max-w-lg mx-auto p-4 space-y-4">
        {orders.length > 0 ? orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl p-5 shadow-lg border border-primary/5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-black/40 tracking-wider mb-1">Cód: {order.id}</p>
                <p className="font-headline font-bold text-xs text-black">{new Date(order.created_at).toLocaleDateString('pt-PT')}</p>
              </div>
              <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-1 rounded-full capitalize">{order.status || 'Pendente'}</span>
            </div>
            <div className="py-3 border-y border-black/[0.03]">
              {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs font-medium">
                  <span className="text-black/60">{item.quantity}x {item.name}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <p className="font-headline font-black text-sm text-primary">€ {Number(order.total).toFixed(2)}</p>
              <span className="text-[10px] font-bold text-black/40 border border-primary/10 px-3 py-1 rounded-lg">
                {order.delivery_method === 'delivery' ? 'Entrega' : 'Recolha'}
              </span>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
            <Package size={48} className="text-primary/10" />
            <p className="font-headline font-bold text-black/40">Nenhum pedido encontrado</p>
          </div>
        )}
      </main>
    </motion.div>
  );
}
