
import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, Search, Filter, Plus, Minus, Trash2, X, 
  CreditCard, ChevronRight, CheckCircle2, ShoppingBag, 
  ArrowLeft, Info, Banknote, Smartphone
} from 'lucide-react';
import { Product, CartItem, Sale, PaymentMethod } from '../types';
import { TAX_RATE } from '../constants';

interface SalesOrdersProps {
  products: Product[];
  onCompleteSale: (sale: Sale) => void;
}

const SalesOrders: React.FC<SalesOrdersProps> = ({ products, onCompleteSale }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Fixed: Added paymentMethod state to satisfy Sale interface requirements
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          alert(`Insufficient stock. Only ${product.stock} available.`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > item.stock) {
          alert("Exceeds available stock.");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Fixed: Added missing properties (discount, status, paymentMethod) required by Sale interface
    const newSale: Sale = {
      id: `ORD-${Date.now()}`,
      items: [...cart],
      subtotal,
      tax,
      discount: 0,
      total,
      paymentMethod,
      timestamp: Date.now(),
      status: 'completed'
    };

    onCompleteSale(newSale);
    setCart([]);
    setIsCartOpen(false);
    setShowSuccess(true);
    setPaymentMethod('Cash'); // Reset to default
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="relative min-h-full pb-20">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sales Catalog</h1>
            <p className="text-slate-500">Browse items and build customer orders.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105' 
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div 
            key={product.id} 
            className={`bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col ${
              product.stock === 0 ? 'opacity-60 grayscale-[0.5]' : ''
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase text-slate-600 tracking-wider shadow-sm">
                  {product.category}
                </span>
              </div>
              {product.stock < 10 && product.stock > 0 && (
                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-[10px] font-bold uppercase shadow-lg animate-pulse">
                    Low Stock
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <span className="text-blue-600 font-extrabold whitespace-nowrap">
                  KSh {product.price.toLocaleString()}
                </span>
              </div>
              
              <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
                {product.description}
              </p>
              
              <button
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 ${
                  product.stock === 0 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-blue-600 shadow-md hover:shadow-blue-200'
                }`}
              >
                {product.stock === 0 ? (
                  'Out of Stock'
                ) : (
                  <>
                    <Plus size={18} />
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-300 flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all z-40 animate-in fade-in zoom-in duration-300"
      >
        <ShoppingCart size={28} />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center border-4 border-slate-50 shadow-lg">
            {cart.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Cart Sidebar Drawer */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isCartOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsCartOpen(false)}
        />
        
        {/* Drawer Content */}
        <div className={`absolute right-0 inset-y-0 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 border-b flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Review Order</h2>
                <p className="text-xs text-slate-500 font-mono">ORDER ID: {Date.now().toString().slice(-6)}</p>
              </div>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <ShoppingCart size={48} strokeWidth={1} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Your cart is empty</h3>
                  <p className="text-sm text-slate-500 max-w-[200px]">Add items from the catalog to start an order.</p>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2 border border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors"
                >
                  Browse Items
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 group animate-in slide-in-from-right duration-300">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white shadow-sm shrink-0">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 leading-tight">{item.name}</h4>
                      <p className="text-sm font-bold text-blue-600">KSh {item.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-xs font-black text-slate-700 w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Subtotal</span>
                <span>KSh {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Tax (8%)</span>
                <span>KSh {tax.toLocaleString()}</span>
              </div>

              {/* Added Payment Method Selector to handle Sale interface requirement */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setPaymentMethod('Cash')}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${
                      paymentMethod === 'Cash' 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400'
                    }`}
                  >
                    <Banknote size={16} className="mb-1" />
                    <span className="text-[10px] font-bold">Cash</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('M-Pesa')}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${
                      paymentMethod === 'M-Pesa' 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-400'
                    }`}
                  >
                    <Smartphone size={16} className="mb-1" />
                    <span className="text-[10px] font-bold">M-Pesa</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('Card')}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${
                      paymentMethod === 'Card' 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400'
                    }`}
                  >
                    <CreditCard size={16} className="mb-1" />
                    <span className="text-[10px] font-bold">Card</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center border-t border-slate-200">
                <span className="font-bold text-slate-800">Total Amount</span>
                <span className="text-2xl font-black text-blue-600">KSh {total.toLocaleString()}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                paymentMethod === 'Cash' ? 'bg-blue-600 shadow-blue-100 hover:bg-blue-700' :
                paymentMethod === 'M-Pesa' ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700' :
                'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'
              } disabled:opacity-50 disabled:shadow-none`}
            >
              <CreditCard size={20} />
              Finalize via {paymentMethod}
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification overlay */}
      {showSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
          <div className="bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border-4 border-white">
            <CheckCircle2 size={24} />
            <div>
              <p className="font-bold">Order Confirmed!</p>
              <p className="text-xs opacity-90">Stock updated and sale recorded.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;
