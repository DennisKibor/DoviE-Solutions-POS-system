
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
// Added MapPin and RefreshCw to imports from lucide-react
import { TrendingUp, DollarSign, ShoppingBag, AlertTriangle, Plus, ShoppingCart, Package, Upload, ChevronRight, FileText, Download, RefreshCcw, Building2, Layers, MapPin, RefreshCw } from 'lucide-react';
import { Sale, Product } from '../types';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  lowStockThreshold: number;
  activeBranchId: string;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; subValue?: string; isLoading?: boolean }> = ({ 
  title, value, icon, color, subValue, isLoading 
}) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 group hover:border-blue-500 transition-all">
    {isLoading ? (
       <div className="w-full flex items-center gap-4 animate-pulse">
         <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700" />
         <div className="flex-1 space-y-2">
           <div className="w-16 h-3 bg-slate-100 dark:bg-slate-700 rounded" />
           <div className="w-24 h-6 bg-slate-100 dark:bg-slate-700 rounded" />
         </div>
       </div>
    ) : (
      <>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">{title}</p>
          <h3 className="text-2xl font-bold mt-1 dark:text-white">{value}</h3>
          {subValue && <p className="text-xs text-green-500 mt-1 font-medium">{subValue}</p>}
        </div>
      </>
    )}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ sales, products, lowStockThreshold, activeBranchId }) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [viewScope, setViewScope] = useState<'branch' | 'enterprise'>('branch');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const scopedSales = useMemo(() => {
    return viewScope === 'branch' 
      ? sales.filter(s => s.branchId === activeBranchId)
      : sales;
  }, [sales, viewScope, activeBranchId]);

  const totalRevenue = scopedSales.reduce((acc, sale) => acc + (sale.status === 'completed' ? sale.total : 0), 0);
  const totalSalesCount = scopedSales.filter(s => s.status === 'completed').length;
  const lowStockProducts = products.filter(p => p.stock < lowStockThreshold);
  const lowStockCount = lowStockProducts.length;
  const avgOrderValue = totalSalesCount > 0 ? (totalRevenue / totalSalesCount).toFixed(2) : '0.00';

  // Branch Comparison Data
  const branchPerformanceData = useMemo(() => {
    const branchMap = new Map();
    sales.forEach(sale => {
      if (sale.status === 'completed') {
        const branchName = sale.branch || 'Unknown';
        branchMap.set(branchName, (branchMap.get(branchName) || 0) + sale.total);
      }
    });
    return Array.from(branchMap.entries()).map(([name, total]) => ({ name, total }));
  }, [sales]);

  const chartData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
  ];

  const categoryData = [
    { name: 'Coffee', value: 400 },
    { name: 'Tea', value: 300 },
    { name: 'Pastry', value: 300 },
    { name: 'Food', value: 200 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const handleDownloadReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportHtml = `
      <html>
        <head>
          <title>Executive Business Report - Dovie Solutions</title>
          <style>
            body { font-family: 'Inter', 'Helvetica', sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
            .header { border-bottom: 4px solid #3b82f6; padding-bottom: 24px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
            .brand { font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; color: #1e293b; }
            .report-title { font-size: 14px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 2px; }
            .meta { font-size: 11px; color: #64748b; font-weight: 600; }
            .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 48px; }
            .stat-box { background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; }
            .stat-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .stat-value { font-size: 24px; font-weight: 900; color: #0f172a; }
            .section-title { font-size: 16px; font-weight: 800; color: #1e293b; margin-bottom: 20px; text-transform: uppercase; display: flex; align-items: center; border-left: 4px solid #3b82f6; padding-left: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; background: #f1f5f9; padding: 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
            td { padding: 14px; border-bottom: 1px solid #f1f5f9; font-size: 12px; font-weight: 500; }
            .critical { color: #ef4444; font-weight: 800; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; font-weight: 600; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="report-title">Monthly Business Insight</div>
              <div class="brand">Dovie-Solutions POS</div>
            </div>
            <div style="text-align: right;">
              <div class="meta">Generated: ${format(new Date(), 'PPPP p')}</div>
              <div class="meta">Scope: ${viewScope.toUpperCase()}</div>
            </div>
          </div>

          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-label">Gross Revenue</div>
              <div class="stat-value">KSh ${totalRevenue.toLocaleString()}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Total Transactions</div>
              <div class="stat-value">${totalSalesCount.toLocaleString()}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Critical Stock Alerts</div>
              <div class="stat-value ${lowStockCount > 0 ? 'critical' : ''}">${lowStockCount} Items</div>
            </div>
          </div>

          <div class="section-title">Critical Inventory Replenishment</div>
          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th>Category</th>
                <th>Batch #</th>
                <th style="text-align: right">Current Stock</th>
              </tr>
            </thead>
            <tbody>
              ${lowStockProducts.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 40px;">No critical stock issues detected at this time.</td></tr>' : 
                lowStockProducts.map(p => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.category}</td>
                  <td>${p.batchNumber || 'N/A'}</td>
                  <td style="text-align: right;" class="${p.stock < 5 ? 'critical' : ''}">${p.stock} units</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Report created for Dovie-Solutions Management. Internal System Reference: ${Math.random().toString(36).substring(7).toUpperCase()}
          </div>

          <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Business Intelligence</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {viewScope === 'branch' ? 'Performance for active station' : 'Enterprise-wide network analysis'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center">
            <button 
              onClick={() => setViewScope('branch')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewScope === 'branch' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <MapPin size={14} className="inline mr-2" /> Branch
            </button>
            <button 
              onClick={() => setViewScope('enterprise')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewScope === 'enterprise' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Layers size={14} className="inline mr-2" /> Enterprise
            </button>
          </div>
          <button 
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 dark:text-white"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          isLoading={isInitialLoading}
          title={`${viewScope === 'branch' ? 'Branch' : 'Total'} Revenue`} 
          value={`KSh ${totalRevenue.toLocaleString()}`} 
          icon={<DollarSign className="text-blue-600" size={24} />} 
          color="bg-blue-50 dark:bg-blue-900/20"
          subValue="+12.5% vs Network Avg"
        />
        <StatCard 
          isLoading={isInitialLoading}
          title="Total Orders" 
          value={totalSalesCount.toString()} 
          icon={<ShoppingBag className="text-emerald-600" size={24} />} 
          color="bg-emerald-50 dark:bg-emerald-900/20"
          subValue="+8% vs Last Period"
        />
        <StatCard 
          isLoading={isInitialLoading}
          title="Avg. Order" 
          value={`KSh ${Number(avgOrderValue).toLocaleString()}`} 
          icon={<TrendingUp className="text-amber-600" size={24} />} 
          color="bg-amber-50 dark:bg-amber-900/20"
        />
        <StatCard 
          isLoading={isInitialLoading}
          title="Stock Alerts" 
          value={lowStockCount.toString()} 
          icon={<AlertTriangle className="text-rose-600" size={24} />} 
          color="bg-rose-50 dark:bg-rose-900/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold dark:text-white uppercase tracking-tighter">Network Performance Comparison</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Revenue by Branch (KSh)</p>
            </div>
            <Building2 size={24} className="text-slate-300" />
          </div>
          {isInitialLoading ? (
            <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-700/50 rounded-2xl animate-pulse" />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `KSh ${val/1000}k`} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc', fontWeight: 800}}
                    formatter={(val: number) => `KSh ${val.toLocaleString()}`}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-6 dark:text-white uppercase tracking-tighter">Category Concentration</h3>
          <div className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
             {categoryData.map((cat, i) => (
               <div key={cat.name} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                 <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{cat.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold mb-6 dark:text-white uppercase tracking-tighter">Growth Trends</h3>
            {isInitialLoading ? (
              <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-700/50 rounded-xl animate-pulse" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip 
                      formatter={(value: number) => [`KSh ${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc', fontWeight: 800}} 
                    />
                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-black mb-6 dark:text-white uppercase tracking-widest text-blue-600">Quick Operations</h3>
            <div className="space-y-3">
              <button onClick={() => navigate('/inventory')} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Plus size={20} /></div>
                <div className="text-left"><p className="font-bold text-sm leading-tight">Add Product</p><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Inventory</p></div>
              </button>
              <button onClick={() => navigate('/pos')} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><ShoppingCart size={20} /></div>
                <div className="text-left"><p className="font-bold text-sm leading-tight">New Sale</p><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Terminal</p></div>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2 text-indigo-200">System Sync</h3>
              <p className="text-xl font-bold leading-tight mb-4">Network Connected</p>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl w-fit backdrop-blur-md border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-widest">Real-time Node</span>
              </div>
            </div>
            <RefreshCw size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:rotate-180 transition-transform duration-1000" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
