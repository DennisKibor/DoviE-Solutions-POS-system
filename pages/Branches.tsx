
import React, { useState, useMemo } from 'react';
import { Plus, Building2, MapPin, Phone, Edit2, Trash2, X, Check, Search, Globe, ChevronRight, TrendingUp, ShoppingCart, DollarSign, UserPlus } from 'lucide-react';
import { Branch, Sale } from '../types';

interface BranchesProps {
  branches: Branch[];
  activeBranchId: string;
  sales: Sale[];
  onUpdateBranches: (branches: Branch[]) => void;
  onSelectBranch: (id: string) => void;
  onAuthRedirect: () => void;
}

const Branches: React.FC<BranchesProps> = ({ branches, activeBranchId, sales, onUpdateBranches, onSelectBranch, onAuthRedirect }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    code: ''
  });

  const branchMetrics = useMemo(() => {
    const metrics: Record<string, { total: number, count: number }> = {};
    branches.forEach(b => {
      const branchSales = sales.filter(s => s.branchId === b.id && s.status === 'completed');
      metrics[b.id] = {
        total: branchSales.reduce((acc, s) => acc + s.total, 0),
        count: branchSales.length
      };
    });
    return metrics;
  }, [branches, sales]);

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        location: branch.location,
        phone: branch.phone,
        code: branch.code
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        location: '',
        phone: '',
        code: `BR-${Date.now().toString().slice(-4)}`
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newBranch: Branch = {
      id: editingBranch?.id || `BR-${Date.now()}`,
      name: formData.name,
      location: formData.location,
      phone: formData.phone,
      code: formData.code,
      isActive: editingBranch ? editingBranch.isActive : true
    };

    if (editingBranch) {
      onUpdateBranches(branches.map(b => b.id === editingBranch.id ? newBranch : b));
    } else {
      onUpdateBranches([...branches, newBranch]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (branches.length <= 1) {
      alert("At least one branch must exist.");
      return;
    }
    if (confirm("Delete this branch? All associated local data for this branch may be inaccessible.")) {
      onUpdateBranches(branches.filter(b => b.id !== id));
      if (activeBranchId === id) onSelectBranch(branches.find(b => b.id !== id)?.id || '');
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Network Management</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Synchronize and monitor multi-location business performance.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
        >
          <Plus size={18} /> New Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map(branch => {
          const isActive = branch.id === activeBranchId;
          const stats = branchMetrics[branch.id] || { total: 0, count: 0 };
          return (
            <div 
              key={branch.id} 
              className={`bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border-2 transition-all group relative overflow-hidden ${
                isActive ? 'border-blue-500 shadow-2xl shadow-blue-500/10' : 'border-slate-100 dark:border-slate-700 hover:border-blue-300'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-1.5 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Check size={12} /> Live Station
                </div>
              )}
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-3xl ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:text-blue-500'} transition-all`}>
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{branch.name}</h3>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{branch.code}</p>
                    </div>
                  </div>
                  <button 
                    onClick={onAuthRedirect}
                    className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl hover:scale-110 transition-transform shadow-sm"
                    title="Sign up new staff to this branch"
                  >
                    <UserPlus size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                       <DollarSign size={12} />
                       <span className="text-[9px] font-black uppercase tracking-widest">Revenue</span>
                    </div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">KSh {stats.total.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                       <ShoppingCart size={12} />
                       <span className="text-[9px] font-black uppercase tracking-widest">Orders</span>
                    </div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{stats.count}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <MapPin size={14} className="shrink-0" />
                    <p className="text-[10px] font-bold truncate">{branch.location || 'Address Pending'}</p>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Phone size={14} className="shrink-0" />
                    <p className="text-[10px] font-bold">{branch.phone || 'No Contact'}</p>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <button 
                    onClick={() => onSelectBranch(branch.id)}
                    disabled={isActive}
                    className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      isActive ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {isActive ? 'Station Active' : 'Switch Terminal'}
                  </button>
                  <button onClick={() => handleOpenModal(branch)} className="p-3 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 dark:border-slate-600"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(branch.id)} className="p-3 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-rose-600 rounded-2xl transition-all border border-slate-100 dark:border-slate-600"><Trash2 size={16} /></button>
                </div>
              </div>

              <Building2 size={120} className="absolute -bottom-10 -right-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:rotate-12 transition-transform duration-700" />
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Building2 size={24} /></div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingBranch ? 'Edit Node' : 'New Node'}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full dark:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Location Name</label>
                  <input 
                    type="text" required placeholder="Branch Identifier"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Network Code</label>
                  <input 
                    type="text" required placeholder="LOC-00X"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-mono font-bold"
                    value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Physical Address</label>
                  <textarea 
                    rows={2} placeholder="Street, Building, Unit"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold resize-none"
                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 hover:bg-slate-100 rounded-2xl text-[10px] uppercase tracking-widest transition-colors">Abort</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest">Sync Config</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
