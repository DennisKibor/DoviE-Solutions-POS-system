
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, TrendingUp, Lightbulb, Target, ArrowRight, ShoppingBag, AlertTriangle, Package, BarChart3, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { Sale, Product } from '../types';
import { generateComprehensiveIntelligence } from '../services/geminiService';

interface AIInsightsProps {
  sales: Sale[];
  products: Product[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ sales, products }) => {
  const [intel, setIntel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchIntel = async () => {
    if (sales.length === 0) return;
    setIsLoading(true);
    try {
      const result = await generateComprehensiveIntelligence(sales, products);
      setIntel(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntel();
  }, [sales.length]);

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center space-y-4 max-w-4xl mx-auto mt-10">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
          <Target size={40} />
        </div>
        <div>
          <h3 className="text-lg font-bold">Insufficient Data for AI</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Complete at least one transaction to unlock the Intelligence Suite.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
            <Sparkles size={14} />
            Gemini Intelligence Engine
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Intelligence</h1>
          <p className="text-slate-500">Predictive analytics and strategic growth recommendations.</p>
        </div>
        <button 
          onClick={fetchIntel}
          disabled={isLoading}
          className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
          Refresh Models
        </button>
      </div>

      {isLoading && !intel ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <Sparkles className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={32} />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800">Processing Data...</h3>
            <p className="text-slate-500">Training predictive models on your latest transactions.</p>
          </div>
        </div>
      ) : intel ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Main Sales Summary & Trends */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <BarChart3 size={160} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-500/20 rounded-2xl backdrop-blur-md">
                    <TrendingUp size={24} className="text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-widest text-blue-400">Today's Executive Summary</h2>
                </div>
                <p className="text-2xl font-medium leading-relaxed text-slate-100 mb-8">
                  "{intel.salesSummary}"
                </p>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Performance Trend</h3>
                  <p className="text-sm text-slate-300 italic">"{intel.trend}"</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Selling Products */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <ShoppingBag size={20} />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Best Sellers</h3>
                </div>
                <div className="space-y-3">
                  {intel.topProducts?.map((p: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[10px]">{i + 1}</span>
                      <span className="font-bold text-slate-700 text-sm">{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock Depletion Alerts (Next 7 Days) */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                    <AlertTriangle size={20} />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">7-Day Runout Risk</h3>
                </div>
                <div className="space-y-3">
                  {intel.lowStockPrediction?.length > 0 ? intel.lowStockPrediction.map((p: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-rose-50/50 rounded-2xl border border-rose-100">
                      <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-black text-[10px] animate-pulse">!</span>
                      <span className="font-bold text-slate-700 text-sm">{p}</span>
                    </div>
                  )) : (
                    <div className="py-6 text-center text-slate-400 text-sm italic">No immediate runout risks predicted.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Restock Strategy Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Restock Strategy</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Optimized via AI</p>
                </div>
              </div>
              
              <div className="space-y-6 flex-1">
                {intel.restockSuggestions?.map((item: any, i: number) => (
                  <div key={i} className="relative pl-6 border-l-2 border-slate-100 hover:border-blue-500 transition-colors">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-blue-500 shadow-sm" />
                    <div className="mb-1 flex justify-between items-start">
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.name}</h4>
                      <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">+{item.suggestedQty}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-2">"{item.reason}"</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="p-4 bg-blue-600 rounded-2xl text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={16} className="text-blue-200" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Growth Tip</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">Consider a bundled discount for your top 3 sellers this weekend to boost average order value by ~12%.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400">Failed to load intelligence metrics. Try refreshing.</div>
      )}
    </div>
  );
};

export default AIInsights;
