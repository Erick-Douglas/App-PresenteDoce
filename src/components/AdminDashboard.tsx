import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Check, Package, CreditCard, Truck, X, Clock } from 'lucide-react';
import { View } from '../types';

interface AdminDashboardProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
  homeBgConfig: { type: 'color' | 'image'; value: string };
  onSetHomeBgConfig: (config: { type: 'color' | 'image'; value: string }) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, homeBgConfig, onSetHomeBgConfig }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
    
    // Set up realtime subscription
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        fetchOrders(); // Refresh on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (
          name,
          phone,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      alert('Erro ao atualizar o status do pedido: ' + error.message);
    } else {
      fetchOrders();
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dispatched': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'dispatched': return 'Saiu p/ Entrega';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary pt-12 pb-6 px-4 shadow-md sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-bold text-xl font-headline">Painel do Administrador</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'pending', 'confirmed', 'dispatched', 'delivered'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === status 
                  ? 'bg-gold text-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {status === 'all' ? 'Todos' : getStatusText(status)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Layout Settings Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="font-headline font-black text-lg text-gray-900 border-b pb-4">Configurações de Layout (Admin)</h2>
          
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-700">Tipo de Background</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="bgType" 
                  checked={homeBgConfig.type === 'color'} 
                  onChange={() => onSetHomeBgConfig({ ...homeBgConfig, type: 'color' })}
                  className="w-4 h-4 accent-primary" 
                />
                <span className="text-sm text-gray-600">Cor sólida</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="bgType" 
                  checked={homeBgConfig.type === 'image'} 
                  onChange={() => onSetHomeBgConfig({ ...homeBgConfig, type: 'image' })}
                  className="w-4 h-4 accent-primary" 
                />
                <span className="text-sm text-gray-600">Imagem</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {homeBgConfig.type === 'color' ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cor do Background</p>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={homeBgConfig.value}
                      onChange={(e) => onSetHomeBgConfig({ ...homeBgConfig, value: e.target.value })}
                      className="w-12 h-12 rounded-lg border-0 p-0 cursor-pointer overflow-hidden"
                    />
                    <input 
                      type="text" 
                      value={homeBgConfig.value.toUpperCase()}
                      onChange={(e) => onSetHomeBgConfig({ ...homeBgConfig, value: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-mono text-sm uppercase"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upload de Imagem</p>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/20 transition-colors cursor-pointer bg-gray-50/50">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <Truck size={24} className="text-gray-400 rotate-[-90deg]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-primary">Clique para fazer upload</p>
                      <p className="text-[10px] text-gray-400 mt-1">JPG, PNG ou WebP (Máx. 5MB)</p>
                    </div>
                  </div>
                </div>
              )}

              <button className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all">
                Salvar Alterações
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preview</p>
              <div 
                className="aspect-video rounded-2xl shadow-inner border border-gray-100 flex items-center justify-center"
                style={{ 
                  backgroundColor: homeBgConfig.type === 'color' ? homeBgConfig.value : undefined,
                  backgroundImage: homeBgConfig.type === 'image' ? `url(${homeBgConfig.value})` : undefined,
                  backgroundSize: 'cover'
                }}
              >
                <img src="/logo.png" className="h-16 w-auto object-contain drop-shadow-lg" />
              </div>
            </div>
          </div>
        </div>

        <div className="h-8"></div>
        <h2 className="font-headline font-black text-lg text-gray-900 px-2">Gestão de Pedidos</h2>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Order Header */}
                <div className="border-b border-gray-50 p-4 flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(order.created_at).toLocaleString('pt-PT')}
                    </p>
                    <h3 className="font-bold text-lg text-gray-900">
                      {order.profiles?.name || order.guest_name || 'Visitante'}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      {order.profiles?.phone || order.guest_phone || 'Sem telefone'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                {/* Order Details */}
                <div className="p-4 bg-gray-50/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Método:</span>
                    <span className="text-sm font-bold flex items-center gap-1">
                      {order.delivery_method === 'delivery' ? (
                        <><Truck size={14} className="text-primary"/> Entrega</>
                      ) : (
                        <><Package size={14} className="text-gold"/> Recolha</>
                      )}
                    </span>
                  </div>

                  {order.delivery_method === 'delivery' && (
                    <div className="mb-3 text-sm text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                      <span className="font-bold block text-xs text-gray-400 mb-1">ENDEREÇO</span>
                      {order.delivery_address}
                      {order.delivery_city && `, ${order.delivery_city}`}
                      {order.delivery_postal_code && <><br/>CEP: {order.delivery_postal_code}</>}
                    </div>
                  )}

                  <div className="mb-3 text-sm text-gray-700 border-t border-gray-200/60 pt-3">
                    <span className="font-bold block text-xs text-gray-400 mb-2">ITENS DO PEDIDO</span>
                    <ul className="space-y-2">
                      {order.items.map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between text-sm">
                          <span><span className="font-bold">{item.quantity}x</span> {item.name}</span>
                          <span className="text-gray-500">{formatCurrency(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200/60">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-primary text-lg">{formatCurrency(order.total)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">Pagamento:</span>
                    <span className="text-xs font-medium text-gray-700 bg-gray-200 px-2 py-0.5 rounded">
                      {order.payment_method === 'cash' ? 'Dinheiro' : order.payment_method === 'mbway' ? 'MB Way' : 'Wise'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 flex gap-2 flex-wrap bg-white">
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="flex-1 min-w-[120px] bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-1"
                    >
                      <Check size={16} /> Confirmar
                    </button>
                  )}
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="flex-1 min-w-[120px] bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-1"
                    >
                      <X size={16} /> Cancelar
                    </button>
                  )}
                  {order.status === 'confirmed' && order.delivery_method === 'delivery' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'dispatched')}
                      className="flex-1 min-w-[120px] bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-1"
                    >
                      <Truck size={16} /> Saiu p/ Entrega
                    </button>
                  )}
                  {(order.status === 'confirmed' || order.status === 'dispatched') && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="flex-1 min-w-[120px] bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-1"
                    >
                      <Check size={16} /> Entregue
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
