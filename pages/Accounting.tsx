
import React, { useState, useMemo } from 'react';
import { 
  Calculator, Plus, Minus, Receipt, Wallet, ArrowUpCircle, 
  ArrowDownCircle, Trash2, Calendar, Tag, DollarSign, X, Filter, RotateCcw, 
  Settings, PlusCircle, Download, FileText, Share2, Smartphone, Banknote, CreditCard,
  TrendingUp, PieChart as PieChartIcon
} from 'lucide-react';
import { Sale, Expense, PaymentMethod } from '../types';
import { format, isWithinInterval, startOfDay, endOfDay, isSameDay } from 'date-fns';

interface AccountingProps {
  sales: Sale[];
  expenses: Expense[];
  expenseCategories: string[];
  onAddExpense: (expense: Expense) => void;
  onRemoveExpense: (id: string) => void;
  onUpdateCategories: (categories: string[]) => void;
}

const Accounting: React.FC<AccountingProps> = ({ 
  sales, 
  expenses, 
  expenseCategories,
  onAddExpense, 
  onRemoveExpense,
  onUpdateCategories
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: expenseCategories[0] || 'Other',
    amount: ''
  });

  // Filter states
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Calculations for current selection
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (!filterStartDate && !filterEndDate) return true;
      const start = filterStartDate ? startOfDay(new Date(filterStartDate)) : new Date(0);
      const end = filterEndDate ? endOfDay(new Date(filterEndDate)) : new Date(8640000000000000);
      return isWithinInterval(new Date(s.timestamp), { start, end });
    });
  }, [sales, filterStartDate, filterEndDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesCategory = filterCategory === 'All' || e.category === filterCategory;
      let matchesDate = true;
      if (filterStartDate || filterEndDate) {
        const start = filterStartDate ? startOfDay(new Date(filterStartDate)) : new Date(0);
        const end = filterEndDate ? endOfDay(new Date(filterEndDate)) : new Date(8640000000000000);
        matchesDate = isWithinInterval(new Date(e.timestamp), { start, end });
      }
      return matchesCategory && matchesDate;
    });
  }, [expenses, filterCategory, filterStartDate, filterEndDate]);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Payment Reconciliation
  const paymentBreakdown = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      const method = sale.paymentMethod || 'Cash';
      acc[method] = (acc[method] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredSales]);

  // Today's Performance (Daily Closing)
  const todayStats = useMemo(() => {
    const today = new Date();
    const todaySales = sales.filter(s => isSameDay(new Date(s.timestamp), today));
    const todayExpenses = expenses.filter(e => isSameDay(new Date(e.timestamp), today));
    
    return {
      revenue: todaySales.reduce((acc, s) => acc + s.total, 0),
      expenses: todayExpenses.reduce((acc, e) => acc + e.amount, 0),
      count: todaySales.length
    };
  }, [sales, expenses]);

  // Combined Ledger
  const ledger = useMemo(() => {
    const combined = [
      ...filteredSales.map(s => ({
        id: s.id,
        type: 'income' as const,
        description: `Order #${s.id.slice(-6)}`,
        category: 'Sales',
        amount: s.total,
        timestamp: s.timestamp,
        method: s.paymentMethod
      })),
      ...filteredExpenses.map(e => ({
        id: e.id,
        type: 'expense' as const,
        description: e.description,
        category: e.category,
        amount: e.amount,
        timestamp: e.timestamp,
        method: undefined
      }))
    ];
    return combined.sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredSales, filteredExpenses]);

  const handleExportCSV = () => {
    const headers = ['Date', 'ID', 'Description', 'Category', 'Type', 'Method', 'Amount'];
    const rows = ledger.map(item => [
      format(item.timestamp, 'yyyy-MM-dd HH:mm'),
      item.id,
      item.description,
      item.category,
      item.type.toUpperCase(),
      item.method || '-',
      item.amount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_ledger_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportHtml = `
      <html>
        <head>
          <title>Financial Report - Dovie Solutions</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
            .title { font-size: 24px; font-weight: bold; color: #1e293b; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-box { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .stat-label { font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; }
            .stat-value { font-size: 20px; font-weight: bold; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f1f5f9; padding: 12px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
            .income { color: #10b981; }
            .expense { color: #ef4444; }
            .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">FINANCIAL STATEMENT</div>
              <div style="font-size: 12px; color: #64748b;">Report Generated: ${format(new Date(), 'PPPP')}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; color: #3b82f6;">DOVIE-SOLUTIONS POS</div>
              <div style="font-size: 10px;">Accounting Module v2.0</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="stat-box"><div class="stat-label">Total Revenue</div><div class="stat-value">KSh ${totalRevenue.toLocaleString()}</div></div>
            <div class="stat-box"><div class="stat-label">Total Expenses</div><div class="stat-value">KSh ${totalExpenses.toLocaleString()}</div></div>
            <div class="stat-box"><div class="stat-label">Net Profit</div><div class="stat-value ${netProfit >= 0 ? '' : 'expense'}">KSh ${netProfit.toLocaleString()}</div></div>
          </div>

          <div style="margin-bottom: 30px;">
            <div class="stat-label" style="margin-bottom: 10px;">Payment Reconciliation</div>
            <div style="display: flex; gap: 20px;">
              ${Object.entries(paymentBreakdown).map(([m, v]) => `
                <div style="background: white; border: 1px solid #e2e8f0; padding: 10px 20px; border-radius: 8px;">
                  <span style="font-size: 11px; color: #64748b;">${m}:</span> 
                  <span style="font-weight: bold;">KSh ${v.toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Method</th>
                <th style="text-align: right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${ledger.map(item => `
                <tr>
                  <td>${format(item.timestamp, 'MMM dd, HH:mm')}</td>
                  <td>${item.description}</td>
                  <td>${item.category}</td>
                  <td>${item.method || '-'}</td>
                  <td style="text-align: right; font-weight: bold;" class="${item.type}">
                    ${item.type === 'income' ? '+' : '-'} KSh ${item.amount.toLocaleString()}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            &copy; ${new Date().getFullYear()} Dovie-Solutions. All rights reserved. Professional POS Accounting Ledger.
          </div>

          <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;

    onAddExpense({
      id: `EXP-${Date.now()}`,
      description: expenseForm.description,
      category: expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      timestamp: Date.now()
    });

    setExpenseForm({ 
      description: '', 
      category: expenseCategories[0] || 'Other', 
      amount: '' 
    });
    setIsModalOpen(false);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (expenseCategories.includes(newCategoryName.trim())) {
      alert("Category already exists");
      return;
    }
    onUpdateCategories([...expenseCategories, newCategoryName.trim()]);
    setNewCategoryName('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (confirm(`Are you sure you want to delete the category "${cat}"?`)) {
      onUpdateCategories(expenseCategories.filter(c => c !== cat));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Accounting & Finances</h1>
          <p className="text-slate-500">Professional financial tracking and reporting.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 text-slate-700 text-sm font-bold flex items-center gap-2 hover:bg-slate-50 border-r"
            >
              <Download size={16} className="text-blue-500" />
              CSV
            </button>
            <button 
              onClick={handleExportPDF}
              className="px-4 py-2 text-slate-700 text-sm font-bold flex items-center gap-2 hover:bg-slate-50"
            >
              <FileText size={16} className="text-rose-500" />
              PDF Report
            </button>
          </div>
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Settings size={18} />
            Settings
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
          >
            <Minus size={18} />
            New Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Stats */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-blue-500 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet size={20} />
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Revenue</p>
            </div>
            <h3 className="text-3xl font-black text-slate-800">KSh {totalRevenue.toLocaleString()}</h3>
            <p className="text-xs text-emerald-500 mt-2 font-bold flex items-center gap-1">
              <ArrowUpCircle size={14} /> Selected Period
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-rose-500 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt size={20} />
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Expenses</p>
            </div>
            <h3 className="text-3xl font-black text-slate-800">KSh {totalExpenses.toLocaleString()}</h3>
            <p className="text-xs text-rose-500 mt-2 font-bold flex items-center gap-1">
              <ArrowDownCircle size={14} /> Operational Costs
            </p>
          </div>

          <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group transition-all ${netProfit >= 0 ? 'hover:border-emerald-500' : 'hover:border-rose-500'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <TrendingUp size={20} />
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Net Profit</p>
            </div>
            <h3 className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              KSh {netProfit.toLocaleString()}
            </h3>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-400 font-bold uppercase">{profitMargin.toFixed(1)}% Margin</p>
              <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${netProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Closing Quick Summary */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon size={20} className="text-blue-400" />
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-400">Daily Closing</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Today's Revenue</p>
                <p className="text-xl font-black">KSh {todayStats.revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Orders Today</p>
                <p className="text-xl font-black">{todayStats.count}</p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Estimated Daily Profit</p>
                <p className={`text-xl font-black ${todayStats.revenue - todayStats.expenses >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  KSh {(todayStats.revenue - todayStats.expenses).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-6 font-mono">Last Sync: {format(new Date(), 'HH:mm:ss')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ledger */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <Receipt size={18} className="text-blue-600" />
              Financial Ledger
            </h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                <Filter size={14} className="text-slate-400" />
                <select 
                  className="text-xs font-bold outline-none bg-transparent"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {['All', 'Sales', ...expenseCategories].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                <Calendar size={14} className="text-slate-400" />
                <input 
                  type="date" 
                  className="text-xs font-bold outline-none bg-transparent"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
                <span className="text-slate-300">-</span>
                <input 
                  type="date" 
                  className="text-xs font-bold outline-none bg-transparent"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>

              {(filterCategory !== 'All' || filterStartDate || filterEndDate) && (
                <button onClick={() => { setFilterCategory('All'); setFilterStartDate(''); setFilterEndDate(''); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl">
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Transaction</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{format(item.timestamp, 'MMM dd')}</p>
                      <p className="text-xs font-bold text-slate-600">{format(item.timestamp, 'HH:mm')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{item.description}</p>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">{item.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.method ? (
                        <div className="flex items-center gap-1.5">
                          {item.method === 'Cash' && <Banknote size={14} className="text-blue-500" />}
                          {item.method === 'M-Pesa' && <Smartphone size={14} className="text-emerald-500" />}
                          {item.method === 'Card' && <CreditCard size={14} className="text-indigo-500" />}
                          <span className="text-xs font-bold text-slate-500">{item.method}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">Expense</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-right font-black ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.type === 'income' ? '+' : '-'} {item.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.type === 'expense' && (
                        <button onClick={() => onRemoveExpense(item.id)} className="p-2 text-slate-300 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method Split Cards */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
              <PieChartIcon size={16} className="text-blue-500" />
              Revenue Recon
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Banknote className="text-blue-600" size={24} />
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase">Cash In Hand</p>
                    <p className="text-lg font-black text-blue-700">KSh {(paymentBreakdown['Cash'] || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="text-emerald-600" size={24} />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase">M-Pesa Ledger</p>
                    <p className="text-lg font-black text-emerald-700">KSh {(paymentBreakdown['M-Pesa'] || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-indigo-600" size={24} />
                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Card Settlements</p>
                    <p className="text-lg font-black text-indigo-700">KSh {(paymentBreakdown['Card'] || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm font-black text-slate-800">
                <span className="uppercase tracking-widest text-slate-400">Total Selection</span>
                <span>KSh {totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold">Manage Expense Categories</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="New category name..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button onClick={handleAddCategory} className="p-2 bg-blue-600 text-white rounded-xl shadow-md"><Plus size={20} /></button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {expenseCategories.map(cat => (
                  <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">{cat}</span>
                    <button onClick={() => handleRemoveCategory(cat)} className="text-slate-300 hover:text-rose-600"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold">Record Business Expense</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Expense Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Monthly Rent, Electricity Bill"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-bold" 
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount (KSh)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-black" 
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Category</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-bold"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-600 hover:bg-slate-50 rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
