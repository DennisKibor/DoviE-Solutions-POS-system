
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Menu, X, Bell, User, AlertCircle, ChevronLeft, ChevronRight, LogOut, ShieldCheck, WifiOff, CheckCircle2, Info, AlertTriangle, FileText, History as HistoryIcon, Lock, Unlock, Database, Download, RefreshCw, Layers, Moon, Sun, MapPin, UserPlus, Fingerprint, Building2, Monitor, Plus, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { Product, Sale, Expense, Employee, StockAdjustment, UserRole, AuditEntry, Branch } from './types';
import { NAV_ITEMS, INITIAL_PRODUCTS, INITIAL_EMPLOYEES, NavItem } from './constants';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import History from './pages/History';
import AIInsights from './pages/AIInsights';
import Accounting from './pages/Accounting';
import HRTeam from './pages/HRTeam';
import AuditLogs from './pages/AuditLogs';
import Branches from './pages/Branches';

const IDLE_TIMEOUT = 5 * 60 * 1000;

type ThemeMode = 'light' | 'dark' | 'system';

// Color Palette Variables - Strict adherence to user Color System
const COLORS = {
  primary: '#1E3A8A', // Primary Blue
  secondary: '#3B82F6', // Secondary Blue
  white: '#FFFFFF', // White
  lightGray: '#F3F4F6', // Light Gray
  darkGray: '#374151' // Dark Gray
};

const Toast: React.FC<{ message: string; type: 'success' | 'info' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
    error: <AlertTriangle className="text-rose-500" size={20} />
  };

  return (
    <div className="fixed bottom-24 lg:bottom-8 right-8 z-[100] animate-in slide-in-from-right duration-300">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-[1.5rem] p-4 flex items-center gap-3 pr-10 relative overflow-hidden backdrop-blur-xl bg-opacity-95">
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: COLORS.secondary }} />
        {icons[type]}
        <p className="text-sm font-bold text-slate-900 dark:text-white">{message}</p>
        <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const AuthScreen: React.FC<{ 
  employees: Employee[], 
  branches: Branch[],
  activeUser: Employee | null,
  onAuthenticate: (employee: Employee) => void,
  onRegister: (employee: Employee, newBranch?: Branch) => void
}> = ({ employees, branches, activeUser, onAuthenticate, onRegister }) => {
  const [view, setView] = useState<'profiles' | 'pin' | 'signup'>(activeUser ? 'pin' : 'profiles');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(activeUser);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const [signupData, setSignupData] = useState({
    name: '',
    role: 'Cashier',
    email: '',
    pin: '',
    confirmPin: '',
    branchId: branches[0]?.id || '',
    isCreatingBranch: false,
    newBranchName: '',
    newBranchLocation: '',
    newBranchPhone: ''
  });

  useEffect(() => {
    if (activeUser) {
      setSelectedEmp(activeUser);
      setView('pin');
    }
  }, [activeUser]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (selectedEmp && selectedEmp.pin === newPin) {
          onAuthenticate(selectedEmp);
        } else {
          setError(true);
          if (window.navigator.vibrate) window.navigator.vibrate(200);
          setTimeout(() => { setPin(''); setError(false); }, 500);
        }
      }
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.pin.length !== 4) return alert("PIN must be 4 digits");
    if (signupData.pin !== signupData.confirmPin) return alert("PINs do not match");
    if (signupData.isCreatingBranch && !signupData.newBranchName) return alert("Branch name is required");
    
    let targetBranchId = signupData.branchId;
    let newBranchObj: Branch | undefined;

    if (signupData.isCreatingBranch) {
      targetBranchId = `BR-${Date.now()}`;
      newBranchObj = {
        id: targetBranchId,
        name: signupData.newBranchName,
        location: signupData.newBranchLocation || 'General Business District',
        phone: signupData.newBranchPhone || 'N/A',
        code: `NET-${targetBranchId.slice(-4)}`,
        isActive: true
      };
    }

    const newEmployee: Employee = {
      id: `EMP-${Date.now()}`,
      name: signupData.name,
      role: signupData.role,
      email: signupData.email,
      phone: '',
      status: 'active',
      avatar: `https://i.pravatar.cc/150?u=${signupData.name}`,
      joinedDate: Date.now(),
      pin: signupData.pin,
      homeBranchId: targetBranchId
    };

    onRegister(newEmployee, newBranchObj);
    setSelectedEmp(newEmployee);
    setSignupData({ 
      name: '', role: 'Cashier', email: '', pin: '', confirmPin: '', 
      branchId: branches[0]?.id || '', isCreatingBranch: false, 
      newBranchName: '', newBranchLocation: '', newBranchPhone: '' 
    });
    setView('pin');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'pin') return;
      if (/^[0-9]$/.test(e.key)) handleKeyPress(e.key);
      else if (e.key === 'Backspace') setPin(prev => prev.slice(0, -1));
      else if (e.key === 'Escape' && !activeUser) {
        setView('profiles');
        setPin('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, selectedEmp, pin, activeUser]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-sm relative z-10 space-y-6 sm:space-y-8">
        <div className="text-center space-y-4">
          <div 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-white shadow-2xl mx-auto transform hover:scale-105 transition-all"
            style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
          >
            {view === 'signup' ? <UserPlus size={32} /> : view === 'pin' ? <Lock size={32} /> : <Unlock size={32} />}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase">
              {view === 'signup' ? 'System Setup' : activeUser ? 'Station Locked' : 'DoviE-Solutions POS system'}
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              {view === 'signup' ? 'Branch & Staff Enrollment' : selectedEmp ? `Verifying ${selectedEmp.name}` : 'Professional Terminal Access'}
            </p>
          </div>
        </div>

        {view === 'profiles' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-bottom duration-500 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
              {employees.map(emp => {
                const branch = branches.find(b => b.id === emp.homeBranchId);
                return (
                  <button 
                    key={emp.id} 
                    onClick={() => { setSelectedEmp(emp); setView('pin'); }}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-[1.5rem] hover:bg-white/10 transition-all border border-white/5 group"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <img src={emp.avatar} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10" alt="" />
                    <div className="text-left flex-1">
                      <p className="font-black text-white text-sm group-hover:text-blue-400 transition-colors">{emp.name}</p>
                      <div className="flex items-center gap-1.5 opacity-60">
                        <MapPin size={8} className="text-blue-400" />
                        <p className="text-[8px] text-slate-400 uppercase tracking-widest font-black">{branch?.name || 'Main Office'}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => setView('signup')}
              className="w-full py-4 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl uppercase text-xs tracking-widest"
              style={{ backgroundColor: COLORS.primary }}
            >
              <UserPlus size={18} /> Enroll Branch or Staff
            </button>
          </div>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4 bg-white p-5 sm:p-6 rounded-[2rem] border border-white/10 shadow-2xl animate-in zoom-in duration-300 max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2" style={{ color: COLORS.darkGray }}>Personal Identity</label>
                <input 
                  type="text" required placeholder="Staff Full Name"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 text-sm font-bold"
                  style={{ focusRingColor: COLORS.secondary }}
                  value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-2">
                  <label className="text-[10px] font-black uppercase text-slate-400" style={{ color: COLORS.darkGray }}>Assignment</label>
                  <button 
                    type="button"
                    onClick={() => setSignupData({...signupData, isCreatingBranch: !signupData.isCreatingBranch})}
                    className="text-[9px] font-black uppercase flex items-center gap-1 hover:underline transition-colors"
                    style={{ color: COLORS.secondary }}
                  >
                    {signupData.isCreatingBranch ? <><ChevronLeft size={10} /> Use Existing</> : <><Plus size={10} /> Add New Branch</>}
                  </button>
                </div>
                
                {!signupData.isCreatingBranch ? (
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 text-sm font-bold appearance-none"
                    value={signupData.branchId} onChange={e => setSignupData({...signupData, branchId: e.target.value})}
                  >
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                ) : (
                  <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <input 
                      type="text" required placeholder="New Branch Name"
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 outline-none text-xs font-bold"
                      value={signupData.newBranchName} onChange={e => setSignupData({...signupData, newBranchName: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                        <input 
                          type="text" placeholder="Location"
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-8 pr-2 py-2.5 outline-none text-[10px] font-bold"
                          value={signupData.newBranchLocation} onChange={e => setSignupData({...signupData, newBranchLocation: e.target.value})}
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                        <input 
                          type="tel" placeholder="Phone"
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-8 pr-2 py-2.5 outline-none text-[10px] font-bold"
                          value={signupData.newBranchPhone} onChange={e => setSignupData({...signupData, newBranchPhone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2" style={{ color: COLORS.darkGray }}>Access Level</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 text-sm font-bold appearance-none"
                    value={signupData.role} onChange={e => setSignupData({...signupData, role: e.target.value})}
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Head Barista">Manager</option>
                    <option value="Store Manager">Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2" style={{ color: COLORS.darkGray }}>Security PIN</label>
                  <input 
                    type="password" required maxLength={4} placeholder="0000"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 text-sm font-black text-center tracking-widest"
                    value={signupData.pin} onChange={e => setSignupData({...signupData, pin: e.target.value.replace(/\D/g, '')})}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2" style={{ color: COLORS.darkGray }}>Confirm PIN</label>
                <input 
                  type="password" required maxLength={4} placeholder="0000"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 text-sm font-black text-center tracking-widest"
                  value={signupData.confirmPin} onChange={e => setSignupData({...signupData, confirmPin: e.target.value.replace(/\D/g, '')})}
                />
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <button 
                type="submit" 
                className="w-full py-4 text-white font-black rounded-xl transition-all shadow-lg uppercase text-xs tracking-widest"
                style={{ backgroundColor: COLORS.secondary }}
              >
                Sync Registration
              </button>
              <button type="button" onClick={() => setView('profiles')} className="w-full py-2 text-slate-400 hover:text-slate-900 font-black uppercase text-[10px] tracking-widest">Cancel</button>
            </div>
          </form>
        )}

        {view === 'pin' && (
          <div className="space-y-8 animate-in zoom-in duration-300">
            {!activeUser && (
              <button 
                onClick={() => { setView('profiles'); setPin(''); }} 
                className="mx-auto text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-blue-400 flex items-center justify-center gap-2 group"
              >
                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Switch Terminal
              </button>
            )}
            
            <div className="flex justify-center gap-5">
              {[0,1,2,3].map(i => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    pin.length > i 
                      ? 'bg-blue-500 border-blue-400 scale-125 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                      : 'bg-transparent border-slate-800'
                  } ${error ? 'border-rose-500 bg-rose-500 animate-shake' : ''}`} 
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 px-4">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button 
                  key={n} 
                  onClick={() => handleKeyPress(n.toString())} 
                  className="h-16 bg-white/5 text-white text-xl font-black rounded-[1.5rem] hover:bg-white/10 active:scale-90 transition-all border border-white/5"
                >
                  {n}
                </button>
              ))}
              <div />
              <button 
                onClick={() => handleKeyPress('0')} 
                className="h-16 bg-white/5 text-white text-xl font-black rounded-[1.5rem] hover:bg-white/10 active:scale-90 transition-all border border-white/5"
              >
                0
              </button>
              <button 
                onClick={() => setPin('')} 
                className="h-16 flex items-center justify-center text-rose-500 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-2xl active:scale-90 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Sidebar: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  lowStockCount: number; 
  isCollapsed: boolean; 
  onToggleCollapse: () => void; 
  userRole: UserRole; 
  currentUserName: string; 
  onLogout: () => void; 
  theme: ThemeMode; 
  onSetTheme: (theme: ThemeMode) => void; 
}> = ({ isOpen, onClose, lowStockCount, isCollapsed, onToggleCollapse, userRole, currentUserName, onLogout, theme, onSetTheme }) => {
  const location = useLocation();

  const groupedItems = useMemo(() => {
    return NAV_ITEMS.reduce((acc, item) => {
      if (userRole === 'Cashier' && ['Management', 'Intelligence', 'Overview'].includes(item.category) && item.id !== 'pos') {
         if (item.id !== 'history' && item.id !== 'dashboard') return acc;
      }
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, NavItem[]>);
  }, [userRole]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-[45] bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-black text-slate-900 dark:text-white border-r border-slate-100 dark:border-white/5 transform transition-all duration-500 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-24' : 'w-72'}`}>
        <div className="flex items-center justify-between h-20 px-6 relative">
          <div className={`flex items-center gap-3 transition-all duration-500 ${isCollapsed ? 'opacity-0 invisible w-0' : 'opacity-100 visible'}`}>
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-lg"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Layers size={24} />
            </div>
            <div className="overflow-hidden">
               <span className="font-black text-sm tracking-tighter uppercase whitespace-nowrap" style={{ color: COLORS.primary }}>DoviE-Solutions</span>
               <p className="text-[8px] font-bold uppercase text-slate-400 -mt-1 tracking-widest">POS System</p>
            </div>
          </div>
          {isCollapsed && <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-2xl" style={{ backgroundColor: COLORS.primary }}>D</div></div>}
          <button onClick={onToggleCollapse} className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-white rounded-full items-center justify-center border-4 border-white dark:border-black hover:scale-110 transition-all z-10 shadow-lg" style={{ backgroundColor: COLORS.secondary }}>{isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
        </div>
        
        <nav className="mt-8 px-4 space-y-8 overflow-y-auto max-h-[calc(100vh-450px)] no-scrollbar">
          {(['Overview', 'Operations', 'Management', 'Intelligence'] as const).map((cat) => {
            const items = groupedItems[cat];
            if (!items || items.length === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                {!isCollapsed && <p className="px-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">{cat}</p>}
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link key={item.id} to={item.path} onClick={() => onClose()} className={`flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all relative group ${isActive ? 'text-white shadow-2xl' : 'text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-white/5'}`} style={isActive ? { backgroundColor: COLORS.secondary, boxShadow: `0 10px 25px -5px ${COLORS.secondary}40` } : {}}>
                        <div className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</div>
                        {!isCollapsed && <span className="font-bold text-sm tracking-tight">{item.name}</span>}
                        {item.id === 'inventory' && lowStockCount > 0 && <span className="flex items-center justify-center bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full ring-4 ring-white dark:ring-black animate-pulse">{lowStockCount}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 dark:border-white/5 space-y-3 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
          <div className={`flex bg-slate-100 dark:bg-white/5 rounded-2xl p-1 gap-1 ${isCollapsed ? 'flex-col' : 'flex-row'}`}>
            {[
              { id: 'light', icon: <Sun size={14} />, label: 'Light' },
              { id: 'dark', icon: <Moon size={14} />, label: 'Dark' },
              { id: 'system', icon: <Monitor size={14} />, label: 'Auto' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => onSetTheme(t.id as ThemeMode)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${theme === t.id ? 'text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                title={t.label}
                style={theme === t.id ? { backgroundColor: COLORS.primary } : {}}
              >
                {t.icon}
                {!isCollapsed && <span>{t.label}</span>}
              </button>
            ))}
          </div>

          <div className={`flex items-center gap-4 p-2 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer group ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-slate-100 dark:ring-white/10 group-hover:ring-blue-500/50 transition-all">
              <img src={`https://i.pravatar.cc/150?u=${currentUserName}`} alt="" className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black truncate text-slate-900 dark:text-white">{currentUserName}</p>
                <div className="flex items-center gap-1.5 opacity-60">
                  <ShieldCheck size={8} style={{ color: COLORS.secondary }} />
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{userRole}</p>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-4 px-5 py-2 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>}
          </button>

          <div className="text-center pt-1 border-t border-slate-100 dark:border-white/5">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
              @DoviE-Solutions
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('novapos_sidebar_collapsed') === 'true');
  const [isLocked, setIsLocked] = useState(false);
  
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (localStorage.getItem('dovie_theme') as ThemeMode) || 'system');
  
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('novapos_branches');
    if (saved) return JSON.parse(saved);
    return [{ id: 'BR-MAIN', name: 'Downtown Central Branch', location: '123 Main St, City Center', phone: '+254 700 000 001', code: 'HQ-01', isActive: true }];
  });
  
  const [activeBranchId, setActiveBranchId] = useState(() => {
    const saved = localStorage.getItem('novapos_active_branch_id');
    return saved || 'BR-MAIN';
  });

  const activeBranch = useMemo(() => {
    return branches.find(b => b.id === activeBranchId) || branches[0];
  }, [branches, activeBranchId]);
  
  const [activeUser, setActiveUser] = useState<Employee | null>(() => {
    const saved = localStorage.getItem('novapos_active_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);
  const lastActivityRef = useRef(Date.now());

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('novapos_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('novapos_sales');
    return saved ? JSON.parse(saved) : [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('novapos_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('novapos_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('novapos_expense_categories');
    return saved ? JSON.parse(saved) : ['Rent', 'Utilities', 'Supplies', 'Marketing', 'Wages', 'Tax', 'Other'];
  });
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('novapos_low_stock_threshold');
    return saved ? parseInt(saved) : 10;
  });
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(() => {
    const saved = localStorage.getItem('novapos_audit');
    return saved ? JSON.parse(saved) : [];
  });

  const lowStockCount = useMemo(() => products.filter(p => p.stock < lowStockThreshold).length, [products, lowStockThreshold]);

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
      
      localStorage.setItem('dovie_theme', themeMode);
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('novapos_products', JSON.stringify(products));
    localStorage.setItem('novapos_sales', JSON.stringify(sales));
    localStorage.setItem('novapos_expenses', JSON.stringify(expenses));
    localStorage.setItem('novapos_employees', JSON.stringify(employees));
    localStorage.setItem('novapos_branches', JSON.stringify(branches));
    localStorage.setItem('novapos_active_branch_id', activeBranchId);
    localStorage.setItem('novapos_expense_categories', JSON.stringify(expenseCategories));
    localStorage.setItem('novapos_low_stock_threshold', lowStockThreshold.toString());
    localStorage.setItem('novapos_sidebar_collapsed', sidebarCollapsed.toString());
    localStorage.setItem('novapos_audit', JSON.stringify(auditLogs));
    
    if (activeUser) localStorage.setItem('novapos_active_user', JSON.stringify(activeUser));
    else localStorage.removeItem('novapos_active_user');
  }, [products, sales, expenses, employees, branches, activeBranchId, expenseCategories, lowStockThreshold, sidebarCollapsed, auditLogs, activeUser]);

  useEffect(() => {
    const handleActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    const interval = setInterval(() => {
      if (activeUser && Date.now() - lastActivityRef.current > IDLE_TIMEOUT && !isLocked) {
        setIsLocked(true);
        addAudit('Session Lock', 'System locked due to inactivity');
      }
    }, 10000);
    return () => {
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      clearInterval(interval);
    };
  }, [isLocked, activeUser]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); addToast('Network connected.', 'success'); };
    const handleOffline = () => { setIsOnline(false); addToast('Local mode active.', 'info'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToasts(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), message, type }]);
  };

  const addAudit = (action: string, details: string) => {
    const entry: AuditEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: Date.now(),
      user: activeUser?.name || 'Unknown',
      role: (activeUser?.role as UserRole) || 'Cashier',
      action,
      details
    };
    setAuditLogs(prev => [entry, ...prev].slice(0, 1000));
  };

  const handleLogout = () => {
    addAudit('Session Logout', `${activeUser?.name} logged out`);
    setActiveUser(null);
    setIsLocked(false);
    addToast('Session ended.', 'info');
  };

  const handleRegister = (newEmp: Employee, newBranch?: Branch) => {
    if (newBranch) {
      setBranches(prev => [...prev, newBranch]);
      addAudit('Network Expansion', `New branch created: ${newBranch.name} at ${newBranch.location}`);
    }
    setEmployees(prev => [...prev, newEmp]);
    addAudit('User Registration', `New user registered: ${newEmp.name} (${newEmp.role}) to branch: ${newEmp.homeBranchId}`);
    addToast(`Account created for ${newEmp.name}!`, 'success');
  };

  const addSale = (sale: Sale) => {
    const attributedSale = { 
      ...sale, 
      cashierName: activeUser?.name || 'Operator',
      branch: activeBranch.name,
      branchId: activeBranch.id
    };
    setSales(prev => [...prev, attributedSale]);
    addAudit('Sale Completed', `Order ${sale.id} at ${activeBranch.name}`);
    addToast(`Transaction successful!`, 'success');
    
    setProducts(prev => prev.map(p => {
      const soldItem = sale.items.find(item => item.id === p.id);
      if (soldItem) {
        const previousStock = p.stock;
        const newStock = Math.max(0, p.stock - soldItem.quantity);
        return { 
          ...p, 
          stock: newStock,
          history: [{
            id: `ADJ-${Date.now()}-${p.id}`,
            type: 'sale',
            quantity: -soldItem.quantity,
            previousStock,
            newStock,
            timestamp: Date.now(),
            user: activeUser?.name || 'System',
            note: `Order ${sale.id} (${activeBranch.name})`
          }, ...(p.history || [])]
        };
      }
      return p;
    }));
  };

  const handleUpdateSaleStatus = (saleId: string, newStatus: Sale['status']) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    addAudit(`Order ${newStatus.toUpperCase()}`, `Order ID: ${saleId}`);
    addToast(`Order status updated to ${newStatus}.`, 'info');
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: newStatus } : s));
  };

  const handleAddExpense = (expense: Expense) => {
    const taggedExpense = { ...expense, branchId: activeBranch.id };
    setExpenses(p => [...p, taggedExpense]);
    addAudit('Expense Recorded', `${expense.description} - KSh ${expense.amount} (${activeBranch.name})`);
  };

  const checkAccess = (allowed: string[]) => {
    const roleMap: Record<string, string> = { 'Store Manager': 'Admin', 'Head Barista': 'Manager', 'Barista': 'Cashier', 'Cashier': 'Cashier' };
    const effectiveRole = activeUser ? (roleMap[activeUser.role] || 'Cashier') : 'Cashier';
    return allowed.includes(effectiveRole);
  };

  if (!activeUser || isLocked) {
    return (
      <AuthScreen 
        employees={employees} 
        branches={branches}
        activeUser={activeUser}
        onAuthenticate={(emp) => { 
          setActiveUser(emp); 
          setIsLocked(false); 
          lastActivityRef.current = Date.now(); 
          addAudit(activeUser ? 'Session Unlock' : 'Session Login', `${emp.name} authenticated`); 
        }}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex overflow-hidden transition-colors duration-400" style={{ backgroundColor: COLORS.lightGray }}>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          lowStockCount={lowStockCount}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={(activeUser?.role === 'Store Manager' ? 'Admin' : activeUser?.role === 'Head Barista' ? 'Manager' : 'Cashier') as UserRole}
          currentUserName={activeUser?.name || 'Unknown'}
          onLogout={handleLogout}
          theme={themeMode}
          onSetTheme={setThemeMode}
        />
        
        <main className={`flex-1 flex flex-col min-h-screen transition-all duration-500 overflow-hidden ${sidebarCollapsed ? 'lg:ml-24' : 'lg:ml-72'}`}>
          <header className="h-20 bg-white/95 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm transition-colors">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-900 dark:text-white transition-all hover:bg-slate-200"><Menu size={24} /></button>
              <div className="hidden lg:flex items-center gap-2">
                 <button onClick={() => setIsLocked(true)} className="p-3 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-rose-600 rounded-2xl transition-all" title="Secure Lock"><Lock size={20} /></button>
              </div>
              <div className="h-10 w-[1px] bg-slate-200 dark:bg-white/10 mx-2"></div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MapPin size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">{activeBranch.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-900/30 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck size={16} /> Secure Node
              </div>
              <div className="h-10 w-[1px] bg-slate-200 dark:bg-white/10 mx-2"></div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operational</span>
              </div>
            </div>
          </header>

          <div className="p-6 flex-1 overflow-auto no-scrollbar">
            <Routes>
              <Route path="/" element={checkAccess(['Admin', 'Manager']) ? <Dashboard sales={sales} products={products} lowStockThreshold={lowStockThreshold} activeBranchId={activeBranchId} /> : <Navigate to="/pos" />} />
              <Route path="/inventory" element={checkAccess(['Admin', 'Manager']) ? <Inventory products={products} onUpdateProducts={setProducts} lowStockThreshold={lowStockThreshold} onUpdateThreshold={setLowStockThreshold} /> : <Navigate to="/pos" />} />
              <Route path="/pos" element={<POS products={products} onCompleteSale={addSale} onUpdateProducts={setProducts} currentCashier={activeUser?.name} currentBranch={activeBranch.name} />} />
              <Route path="/history" element={<History sales={sales} onUpdateSaleStatus={handleUpdateSaleStatus} onToast={addToast} employees={employees} activeUser={activeUser} activeBranchId={activeBranchId} />} />
              <Route path="/hr" element={checkAccess(['Admin']) ? <HRTeam employees={employees} branches={branches} onUpdateEmployees={setEmployees} /> : <Navigate to="/pos" />} />
              <Route path="/branches" element={checkAccess(['Admin', 'Manager']) ? <Branches branches={branches} activeBranchId={activeBranchId} sales={sales} onUpdateBranches={setBranches} onSelectBranch={setActiveBranchId} onAuthRedirect={() => setIsLocked(true)} /> : <Navigate to="/pos" />} />
              <Route path="/accounting" element={checkAccess(['Admin', 'Manager']) ? <Accounting sales={sales} expenses={expenses} expenseCategories={expenseCategories} activeBranchId={activeBranchId} onAddExpense={handleAddExpense} onRemoveExpense={id => setExpenses(p => p.filter(x => x.id !== id))} onUpdateCategories={setExpenseCategories} /> : <Navigate to="/pos" />} />
              <Route path="/insights" element={checkAccess(['Admin', 'Manager']) ? <AIInsights sales={sales} products={products} /> : <Navigate to="/pos" />} />
              <Route path="/audit" element={checkAccess(['Admin']) ? <AuditLogs logs={auditLogs} /> : <Navigate to="/pos" />} />
            </Routes>
          </div>
        </main>
      </div>
      <div className="fixed bottom-0 right-0 p-6 space-y-3 z-[100]">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>
    </HashRouter>
  );
};

export default App;
