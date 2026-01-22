
import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Employee } from '../types';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { 
  Receipt, Calendar, User, Printer, Eye, FileText, X, 
  Search, Filter, LayoutGrid, List, ChevronDown, 
  ArrowUpDown, Smartphone, Banknote, CreditCard, 
  Package, ShoppingBag, Clock, CheckCircle2, RotateCcw, Ban, RefreshCcw,
  Info, Loader2, ShieldCheck, ShieldAlert, MapPin, UserCheck
} from 'lucide-react';

interface HistoryProps {
  sales: Sale[];
  onUpdateSaleStatus: (saleId: string, newStatus: Sale['status']) => void;
  onToast: (message: string, type: 'success' | 'info' | 'error') => void;
  employees: Employee[];
  activeUser: Employee | null;
}

const PINConfirmation: React.FC<{ 
  onConfirm: () => void; 
  onCancel: () => void; 
  employees: Employee[]; 
  title: string;
  description: string;
}> = ({ onConfirm, onCancel, employees, title, description }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKey = (n: string) => {
    if (pin.length < 4) {
      const next = pin + n;
      setPin(next);
      if (next.length === 4) {
        // Verify against any Manager/Admin PIN
        const authorized = employees.some(e => 
          (e.role === 'Store Manager' || e.role === 'Head Barista') && e.pin === next
        );
        if (authorized) onConfirm();
        else {
          setError(true);
          setTimeout(() => { setPin(''); setError(false); }, 1000);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/80 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center animate-in zoom-in duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className={`p-4 rounded-2xl ${error ? 'bg-rose-100 text-rose-600 animate-shake' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
            {error ? <ShieldAlert size={32} /> : <ShieldCheck size={32} />}
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 px-4">{description}</p>
        </div>
        <div className="flex justify-center gap-3">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full ${pin.length > i ? 'bg-blue-600 scale-125' : 'bg-slate-200 dark:bg-slate-700'} transition-all`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6,7,8,9,0].map(n => (
            <button key={n} onClick={() => handleKey(n.toString())} className="h-14 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all">{n}</button>
          ))}
          <button onClick={onCancel} className="col-span-2 h-14 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-black uppercase text-xs rounded-2xl">Cancel</button>
        </div>
      </div>
    </div>
  );
};

const History: React.FC<HistoryProps> = ({ sales, onUpdateSaleStatus, onToast, employees, activeUser }) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'All' | 'Today' | 'This Week' | 'Cash' | 'M-Pesa' | 'Card'>('All');
  const [itemsToShow, setItemsToShow] = useState(25);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [securityAction, setSecurityAction] = useState<{ type: Sale['status'], saleId: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const processedSales = useMemo(() => {
    let result = [...sales];
    if (searchTerm) result = result.filter(s => s.id.toLowerCase().includes(searchTerm.toLowerCase()) || s.cashierName?.toLowerCase().includes(searchTerm.toLowerCase()));
    const now = new Date();
    if (filterMode === 'Today') result = result.filter(s => isSameDay(new Date(s.timestamp), now));
    else if (filterMode === 'This Week') result = result.filter(s => isWithinInterval(new Date(s.timestamp), { start: startOfWeek(now), end: endOfWeek(now) }));
    else if (['Cash', 'M-Pesa', 'Card'].includes(filterMode)) result = result.filter(s => s.paymentMethod === filterMode);
    result.sort((a, b) => b.timestamp - a.timestamp);
    return result;
  }, [sales, searchTerm, filterMode]);

  const paginatedSales = processedSales.slice(0, itemsToShow);

  const handleSecurityConfirm = () => {
    if (securityAction) {
      onUpdateSaleStatus(securityAction.saleId, securityAction.type);
      setSecurityAction(null);
      setSelectedSale(null);
    }
  };

  const handlePrintReceipt = (sale: Sale) => {
    onToast(`Printing Receipt for ${sale.id.slice(-8)}...`, 'info');
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    const receiptHtml = `
      <html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;padding:20px;font-size:12px;max-width:300px;margin:0 auto;color:#000}.text-center{text-align:center}.header{margin-bottom:20px;border-bottom:1px dashed #000}.table{width:100%;margin-bottom:10px}.totals{border-top:1px dashed #000;padding-top:10px}.flex{display:flex;justify-content:space-between}.meta{font-size:10px;color:#555;margin-bottom:10px}</style></head>
      <body><div class="text-center header"><strong>DOVIE SOLUTIONS</strong><br>${sale.branch || 'Main Branch'}</div>
      <div class="meta">ID: ${sale.id}<br>Date: ${format(sale.timestamp, 'yyyy-MM-dd HH:mm')}<br>Cashier: ${sale.cashierName || 'Admin'}<br>Status: ${sale.status.toUpperCase()}</div>
      <table class="table" width="100%">${sale.items.map(i => `<tr><td>${i.name}</td><td>x${i.quantity}</td><td align="right">${(i.price*i.quantity).toFixed(2)}</td></tr>`).join('')}</table>
      <div class="totals"><div class="flex"><span>Subtotal</span><span>${sale.subtotal.toLocaleString()}</span></div><div class="flex"><span>VAT</span><span>${sale.tax.toLocaleString()}</span></div><div class="flex"><strong>TOTAL</strong><strong>${sale.total.toLocaleString()}</strong></div></div>
      <div class="text-center" style="margin-top:20px">--- Thank You! ---</div><script>window.onload=()=>{window.print();window.close();}</script></body></html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {securityAction && (
        <PINConfirmation 
          title="Manager Required"
          description={`Please verify Management credentials to confirm ${securityAction.type} status.`}
          employees={employees}
          onConfirm={handleSecurityConfirm}
          onCancel={() => setSecurityAction(null)}
        />
      )}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div><h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sales Ledger</h1><p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Full historical audit with cashier attribution.</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"><FileText size={18} />Report Engine</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <div className="relative col-span-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search ID or Cashier..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide col-span-3">
          {['All', 'Today', 'This Week', 'Cash', 'M-Pesa', 'Card'].map(m => (
            <button key={m} onClick={() => setFilterMode(m as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterMode === m ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'}`}>{m}</button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase border-b dark:border-slate-700">
              <tr><th className="px-6 py-4">Receipt</th><th className="px-6 py-4">Cashier / Branch</th><th className="px-6 py-4">Method</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {paginatedSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className={`font-mono text-xs font-black ${sale.status === 'completed' ? 'text-slate-700 dark:text-slate-300' : 'text-rose-400 line-through'}`}>{sale.id.slice(-8)}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{format(sale.timestamp, 'HH:mm')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} className="text-blue-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{sale.cashierName || 'Admin'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-60">
                      <MapPin size={10} className="text-slate-400" />
                      <span className="text-[9px] font-black uppercase text-slate-400">{sale.branch || 'Downtown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-[10px] font-black text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded uppercase">{sale.paymentMethod}</span></td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">KSh {sale.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${sale.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                      {sale.status === 'completed' ? <CheckCircle2 size={10} /> : <Ban size={10} />} {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setSelectedSale(sale)} className="p-2 text-slate-400 hover:text-blue-600"><Eye size={16} /></button>
                      <button onClick={() => handlePrintReceipt(sale)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Printer size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-4"><div className={`p-3 rounded-2xl shadow-xl ${selectedSale.status === 'completed' ? 'bg-blue-600 shadow-blue-100' : 'bg-rose-600 shadow-rose-100'} text-white`}><Receipt size={24} /></div><h2 className="text-xl font-black text-slate-900 dark:text-white">Order Details #{selectedSale.id.slice(-6)}</h2></div>
              <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full dark:text-white"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-700"><p className="text-[10px] text-slate-400 font-bold uppercase">Time</p><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{format(selectedSale.timestamp, 'HH:mm')}</p></div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-700"><p className="text-[10px] text-slate-400 font-bold uppercase">Cashier</p><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedSale.cashierName || 'N/A'}</p></div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-700"><p className="text-[10px] text-slate-400 font-bold uppercase">Method</p><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedSale.paymentMethod}</p></div>
                <div className="bg-slate-900 dark:bg-black p-4 rounded-3xl"><p className="text-[10px] text-blue-400 font-bold uppercase">Total</p><p className="text-lg font-black text-white">KSh {selectedSale.total.toLocaleString()}</p></div>
              </div>
              <div className="rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left"><thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 border-b dark:border-slate-700"><tr><th className="px-4 py-2">Item</th><th className="px-4 py-2 text-center">Qty</th><th className="px-4 py-2 text-right">Price</th></tr></thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">{selectedSale.items.map((i,idx) => <tr key={idx}><td className="px-4 py-2 text-sm font-bold dark:text-slate-300">{i.name}</td><td className="px-4 py-2 text-center text-sm dark:text-slate-400">{i.quantity}</td><td className="px-4 py-2 text-right text-sm font-black dark:text-white">KSh {i.price.toLocaleString()}</td></tr>)}</tbody></table>
              </div>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-900/20 border-t dark:border-slate-700 flex flex-wrap gap-4">
              {selectedSale.status === 'completed' && (
                <>
                  <button onClick={() => setSecurityAction({ type: 'refunded', saleId: selectedSale.id })} className="flex-1 py-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-black rounded-2xl border border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"><RotateCcw size={16} /> Refund</button>
                  <button onClick={() => setSecurityAction({ type: 'voided', saleId: selectedSale.id })} className="flex-1 py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-black rounded-2xl border border-rose-200 dark:border-rose-900/30 hover:bg-rose-100 transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"><Ban size={16} /> Void</button>
                </>
              )}
              <button onClick={() => handlePrintReceipt(selectedSale)} className="flex-1 py-4 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest"><Printer size={20} /> Re-Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
