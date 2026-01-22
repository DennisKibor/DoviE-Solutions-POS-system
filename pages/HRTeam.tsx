
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Mail, Phone, Users, UserPlus, Clock, X, Check, Shield, LogIn, LogOut, Coffee, ArrowUpDown, Briefcase, User, MoreHorizontal, Calendar, Lock, MapPin, Building2 } from 'lucide-react';
import { Employee, Branch } from '../types';
import { format, formatDistanceToNow } from 'date-fns';

interface HRTeamProps {
  employees: Employee[];
  branches: Branch[];
  onUpdateEmployees: (employees: Employee[]) => void;
}

type SortOption = 'name' | 'role' | 'status' | 'joinedDate' | 'branch';

const HRTeam: React.FC<HRTeamProps> = ({ employees, branches, onUpdateEmployees }) => {
  const [nameSearch, setNameSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    status: 'clocked-out' as Employee['status'],
    avatar: '',
    pin: '',
    branchId: branches[0]?.id || ''
  });

  const sortedAndFilteredEmployees = useMemo(() => {
    const filtered = employees.filter(emp => 
      emp.name.toLowerCase().includes(nameSearch.toLowerCase()) &&
      (branchFilter === 'All' || emp.homeBranchId === branchFilter)
    );
    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'role') return a.role.localeCompare(b.role);
      if (sortBy === 'branch') {
         const bA = branches.find(x => x.id === a.homeBranchId)?.name || '';
         const bB = branches.find(x => x.id === b.homeBranchId)?.name || '';
         return bA.localeCompare(bB);
      }
      if (sortBy === 'status') {
        const order = { 'active': 0, 'on-break': 1, 'clocked-out': 2 };
        return order[a.status] - order[b.status];
      }
      return b.joinedDate - a.joinedDate;
    });
  }, [employees, nameSearch, branchFilter, sortBy, branches]);

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        role: employee.role,
        email: employee.email,
        phone: employee.phone,
        status: employee.status,
        avatar: employee.avatar,
        pin: employee.pin || '',
        branchId: employee.homeBranchId || branches[0]?.id || ''
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        role: '',
        email: '',
        phone: '',
        status: 'clocked-out',
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
        pin: '',
        branchId: branches[0]?.id || ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Employee = {
      id: editingEmployee?.id || `EMP-${Date.now()}`,
      name: formData.name,
      role: formData.role || 'Staff',
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      avatar: formData.avatar,
      pin: formData.pin || '1234',
      joinedDate: editingEmployee?.joinedDate || Date.now(),
      lastStatusChange: editingEmployee?.lastStatusChange,
      homeBranchId: formData.branchId
    };
    if (editingEmployee) onUpdateEmployees(employees.map(emp => emp.id === editingEmployee.id ? data : emp));
    else onUpdateEmployees([...employees, data]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Staff Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Coordinate teams across your branch network.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-3">
          <UserPlus size={18} /> Enroll Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search by name..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={nameSearch} onChange={(e) => setNameSearch(e.target.value)}/></div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-1.5 border border-transparent">
          <MapPin size={16} className="text-slate-400" />
          <select className="bg-transparent text-sm font-bold outline-none flex-1 py-1 dark:text-white" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
            <option value="All">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-1.5 border border-transparent">
          <ArrowUpDown size={16} className="text-slate-400" />
          <select className="bg-transparent text-sm font-bold outline-none flex-1 py-1 dark:text-white" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="name">Sort by Name</option>
            <option value="branch">Sort by Branch</option>
            <option value="role">Sort by Role</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase border-b dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 tracking-widest">Operator Info</th>
                <th className="px-6 py-4 tracking-widest">Station</th>
                <th className="px-6 py-4 tracking-widest">Role</th>
                <th className="px-6 py-4 tracking-widest text-center">Security</th>
                <th className="px-6 py-4 tracking-widest">Status</th>
                <th className="px-6 py-4 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sortedAndFilteredEmployees.map(emp => {
                const branch = branches.find(b => b.id === emp.homeBranchId);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={emp.avatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-white/10" alt="" />
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-sm">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{emp.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                          {/* Fixed: Added missing import for Building2 */}
                          <Building2 size={12} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{branch?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded uppercase tracking-widest">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {emp.pin ? (
                        <div className="flex flex-col items-center gap-1">
                          <Shield className="text-emerald-500" size={16} />
                          <span className="text-[8px] font-black text-emerald-600 uppercase">PIN Active</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 opacity-20">
                          <Shield className="text-slate-400" size={16} />
                          <span className="text-[8px] font-black text-slate-400 uppercase">No Shield</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                        emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                        emp.status === 'on-break' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(emp)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => onUpdateEmployees(employees.filter(e => e.id !== emp.id))} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><UserPlus size={24} /></div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingEmployee ? 'Update Profile' : 'Staff Enrollment'}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full dark:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Full Legal Name</label>
                    <input type="text" required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Role Title</label>
                    <input type="text" required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Assigned Station</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold appearance-none" value={formData.branchId} onChange={(e) => setFormData({...formData, branchId: e.target.value})}>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest flex items-center gap-1.5"><Lock size={10} className="text-blue-500" /> Security PIN</label>
                    <input type="password" maxLength={4} required placeholder="4-digit PIN" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-black tracking-[0.4em] text-center" value={formData.pin} onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})}/>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Phone Contact</label>
                    <input type="tel" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Email Address</label>
                    <input type="email" required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}/>
                  </div>
                </div>
              </div>
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 hover:bg-slate-100 rounded-2xl text-[10px] uppercase tracking-widest transition-colors">Discard</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest">Commit Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRTeam;
