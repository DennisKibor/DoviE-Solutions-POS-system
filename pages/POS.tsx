
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, 
  X, Camera, ShoppingBag, ChevronUp, ChevronDown, Keyboard, 
  MousePointer2, User, MapPin, CheckCircle2, DollarSign, 
  Smartphone, CreditCard as CardIcon, Tag, Percent, CreditCard as PaymentIcon
} from 'lucide-react';
import { Product, CartItem, Sale, PaymentMethod } from '../types';
import { TAX_RATE } from '../constants';

interface POSProps {
  products: Product[];
  onCompleteSale: (sale: Sale) => void;
  onUpdateProducts: (products: Product[]) => void;
  currentCashier?: string;
  currentBranch?: string;
}

const POS: React.FC<POSProps> = ({ 
  products, 
  onCompleteSale, 
  onUpdateProducts, 
  currentCashier = "System Admin",
  currentBranch = "Main Branch"
}) => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const taxInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCartMobileOpen, setIsCartMobileOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isScanning, setIsScanning] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Tax and Discount states
  const [taxPercent, setTaxPercent] = useState((TAX_RATE * 100).toString());
  const [discountPercent, setDiscountPercent] = useState("0");

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Financial Calculations
  const discountRate = (parseFloat(discountPercent) || 0) / 100;
  const discountValue = subtotal * discountRate;
  
  const taxableAmount = subtotal - discountValue;
  const currentTaxRate = (parseFloat(taxPercent) || 0) / 100;
  const currentTaxValue = taxableAmount * currentTaxRate;
  
  const total = taxableAmount + currentTaxValue;

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchTerm));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = audioCtx.currentTime;
      playTone(880, now, 0.4); 
      playTone(1046.50, now + 0.1, 0.5);
    } catch (e) {
      console.warn('Audio feedback blocked by browser');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        const methods: PaymentMethod[] = ['Cash', 'M-Pesa', 'Card'];
        const nextIdx = (methods.indexOf(paymentMethod) + 1) % methods.length;
        setPaymentMethod(methods[nextIdx]);
      } else if (e.key === 'F3') {
        e.preventDefault();
        taxInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        discountInputRef.current?.focus();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        handleCheckout();
      } else if (e.key === 'Escape') {
        if (cart.length > 0 && confirm("Clear current tray?")) {
          setCart([]);
          setSearchTerm('');
        }
        setIsCartMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, total, paymentMethod]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    if (window.navigator.vibrate) window.navigator.vibrate(10);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    playSuccessChime();
    const newSale: Sale = {
      id: `SALE-${Date.now()}`,
      items: [...cart],
      subtotal,
      tax: currentTaxValue,
      discount: discountValue,
      total,
      paymentMethod,
      timestamp: Date.now(),
      status: 'completed',
      cashierName: currentCashier,
      branch: currentBranch
    };
    onCompleteSale(newSale);
    setCart([]);
    navigate('/history');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={20} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search products (F1)..." 
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] shadow-sm text-lg font-medium outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 transition-all dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex gap-1">
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-600">F1</kbd>
              </div>
            </div>
            <button 
              onClick={() => setIsScanning(true)}
              className="px-6 bg-blue-600 text-white rounded-[1.5rem] shadow-lg shadow-blue-100 dark:shadow-blue-900/20 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Camera size={24} />
            </button>
            <button 
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="px-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-slate-400 hover:text-blue-500 transition-all"
            >
              <Keyboard size={24} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 rounded-full text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                  selectedCategory === cat 
                    ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-xl scale-105' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-12">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className="group bg-white dark:bg-slate-800 p-3 rounded-[2rem] border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-2xl transition-all text-left flex flex-col relative active:scale-95 touch-manipulation"
              >
                <div className="aspect-square rounded-[1.5rem] overflow-hidden mb-3 bg-slate-50 dark:bg-slate-700 relative">
                  <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  {product.stock <= 5 && (
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-rose-600/90 backdrop-blur-md text-[8px] font-black text-white uppercase text-center rounded-lg shadow-lg">
                      Low Stock: {product.stock}
                    </div>
                  )}
                </div>
                <div className="px-1">
                  <h4 className="font-black text-slate-900 dark:text-white text-sm line-clamp-1 mb-1">{product.name}</h4>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-blue-600 dark:text-blue-400 font-black text-base">KSh {product.price.toLocaleString()}</p>
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-[400px] flex-col bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="px-8 py-3 bg-slate-900 text-white flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <User size={12} className="text-blue-400" />
            <span>{currentCashier}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-emerald-400" />
            <span>{currentBranch}</span>
          </div>
        </div>

        <div className="p-8 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 dark:shadow-blue-900/30">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-lg">Active Order</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">{cart.length} Items</p>
            </div>
          </div>
          <button onClick={() => setCart([])} className="p-3 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"><Trash2 size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
               <MousePointer2 size={64} className="mb-4 text-slate-300 dark:text-slate-600" strokeWidth={1} />
               <p className="text-sm font-bold text-slate-400 dark:text-slate-600">Select products to begin an order</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 animate-in slide-in-from-right duration-200">
              <img src={item.image} className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-sm" alt="" />
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 dark:text-white text-sm truncate">{item.name}</h4>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">KSh {item.price.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-blue-600 dark:text-blue-400"><ChevronUp size={16} /></button>
                <span className="text-sm font-black text-slate-900 dark:text-white px-1">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-400 dark:text-slate-500"><ChevronDown size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-900/30 border-t dark:border-slate-700 space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Subtotal</span>
              <span className="text-slate-700 dark:text-slate-400">KSh {subtotal.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-500">
              <div className="flex items-center gap-2">
                <Tag size={12} />
                <span>Discount (%) (F4)</span>
                <input 
                  ref={discountInputRef}
                  type="number" 
                  className="w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-center font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <span>- KSh {discountValue.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-2">
                <Percent size={12} />
                <span>Tax (%) (F3)</span>
                <input 
                  ref={taxInputRef}
                  type="number" 
                  className="w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-center font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <span className="text-slate-900 dark:text-slate-300">KSh {currentTaxValue.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-xl font-black text-slate-900 dark:text-white pt-2 border-t dark:border-slate-700">
              <span className="uppercase tracking-tighter">Grand Total</span>
              <span className="text-blue-600 dark:text-blue-400">KSh {total.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {(['Cash', 'M-Pesa', 'Card'] as PaymentMethod[]).map(m => (
              <button 
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                  paymentMethod === m ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {m === 'Cash' && <DollarSign size={12} className="inline mr-1" />}
                {m === 'M-Pesa' && <Smartphone size={12} className="inline mr-1" />}
                {m === 'Card' && <CardIcon size={12} className="inline mr-1" />}
                {m}
              </button>
            ))}
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
          >
            <CreditCard size={20} />
            Charge {paymentMethod} (Ctrl+Enter)
          </button>
        </div>
      </div>

      {showShortcuts && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-xl font-black mb-6 text-slate-900 dark:text-white flex items-center gap-2">
              <Keyboard className="text-blue-600" /> Terminal Hotkeys
            </h2>
            <div className="space-y-4">
              {[
                { k: 'F1', d: 'Focus product search' },
                { k: 'F2', d: 'Cycle payment methods' },
                { k: 'F3', d: 'Focus tax percentage' },
                { k: 'F4', d: 'Focus discount percentage' },
                { k: 'Ctrl + Enter', d: 'Finalize order' },
                { k: 'Esc', d: 'Reset cart / Dismiss menus' }
              ].map(s => (
                <div key={s.k} className="flex items-center justify-between py-2 border-b dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{s.d}</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 text-[10px] font-black text-slate-700 dark:text-white uppercase">{s.k}</kbd>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShortcuts(false)} className="w-full mt-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-black rounded-2xl uppercase tracking-widest text-[10px]">Close Panel</button>
          </div>
        </div>
      )}

      {/* Mobile Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex items-center justify-between gap-4 z-40 transition-colors">
        <button 
          onClick={() => setIsCartMobileOpen(true)}
          className="relative p-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl"
        >
          <ShoppingCart size={24} />
          {cart.length > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800">{cart.length}</span>}
        </button>
        <button 
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 dark:shadow-blue-900/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
        >
          Pay KSh {total.toLocaleString()}
        </button>
      </div>

      {/* Mobile Cart Bottom Sheet */}
      {isCartMobileOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCartMobileOpen(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-[3rem] p-8 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Your Tray</h2>
                <div className="flex gap-4 mt-1 opacity-60">
                   <span className="text-[8px] font-black uppercase flex items-center gap-1"><User size={8}/> {currentCashier}</span>
                   <span className="text-[8px] font-black uppercase flex items-center gap-1"><MapPin size={8}/> {currentBranch}</span>
                </div>
              </div>
              <button onClick={() => setIsCartMobileOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full dark:text-white"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar mb-6">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                  <img src={item.image} className="w-20 h-20 rounded-2xl object-cover" alt="" />
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">{item.name}</h4>
                    <p className="text-blue-600 dark:text-blue-400 font-bold">KSh {item.price.toLocaleString()}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm dark:text-white"><Minus size={14} /></button>
                      <span className="font-black dark:text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm dark:text-white"><Plus size={14} /></button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-500"><Trash2 size={20} /></button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
               <div className="space-y-2 px-2 border-b dark:border-slate-700 pb-4">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                   <span>Subtotal</span>
                   <span>KSh {subtotal.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-500">
                   <div className="flex items-center gap-2">
                     <span>Discount (%)</span>
                     <input 
                      type="number" 
                      className="w-12 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 text-center font-bold text-emerald-600 outline-none"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                    />
                   </div>
                   <span>- KSh {discountValue.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                   <div className="flex items-center gap-2">
                     <span>Tax (%)</span>
                     <input 
                      type="number" 
                      className="w-12 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 text-center font-bold text-slate-900 dark:text-white outline-none"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                    />
                   </div>
                   <span>KSh {currentTaxValue.toLocaleString()}</span>
                 </div>
               </div>

               {/* New Payment Method Dropdown Option for Mobile */}
               <div className="px-2 py-2">
                 <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <PaymentIcon size={12} className="text-blue-500" />
                   Payment Mode
                 </label>
                 <div className="relative group">
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm font-black text-slate-900 dark:text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="Cash">💵 Cash Settlement</option>
                      <option value="M-Pesa">📱 M-Pesa Mobile</option>
                      <option value="Card">💳 Credit / Debit Card</option>
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      {paymentMethod === 'Cash' && <DollarSign size={14} className="text-emerald-500" />}
                      {paymentMethod === 'M-Pesa' && <Smartphone size={14} className="text-emerald-500" />}
                      {paymentMethod === 'Card' && <CardIcon size={14} className="text-indigo-500" />}
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown size={14} className="text-slate-400" />
                    </div>
                 </div>
               </div>
               
               <div className="flex justify-between items-center text-2xl font-black text-slate-900 dark:text-white px-2">
                 <span>TOTAL</span>
                 <span className="text-blue-600 dark:text-blue-400">KSh {total.toLocaleString()}</span>
               </div>
               <button 
                onClick={handleCheckout} 
                className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-3xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                 Confirm {paymentMethod} Payment
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
