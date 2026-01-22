
import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, History, Sparkles, Calculator, Users, Building2 } from 'lucide-react';

export const TAX_RATE = 0.08; // 8% tax

export interface NavItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
  category: 'Overview' | 'Operations' | 'Management' | 'Intelligence';
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/', category: 'Overview' },
  { id: 'pos', name: 'POS Terminal', icon: <ShoppingCart size={20} />, path: '/pos', category: 'Operations' },
  { id: 'history', name: 'Sales History', icon: <History size={20} />, path: '/history', category: 'Operations' },
  { id: 'inventory', name: 'Inventory', icon: <Package size={20} />, path: '/inventory', category: 'Management' },
  { id: 'accounting', name: 'Accounting', icon: <Calculator size={20} />, path: '/accounting', category: 'Management' },
  { id: 'hr', name: 'HR & Team', icon: <Users size={20} />, path: '/hr', category: 'Management' },
  { id: 'branches', name: 'Branches', icon: <Building2 size={20} />, path: '/branches', category: 'Management' },
  { id: 'insights', name: 'AI Insights', icon: <Sparkles size={20} />, path: '/insights', category: 'Intelligence' },
];

export const INITIAL_PRODUCTS: any[] = [
  { id: '1', name: 'Classic Espresso', category: 'Coffee', price: 350.00, stock: 50, image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=500&auto=format&fit=crop', description: 'Rich and smooth single origin espresso.', barcode: '123456789012' },
  { id: '2', name: 'Organic Matcha', category: 'Tea', price: 475.00, stock: 12, image: 'https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=500&auto=format&fit=crop', description: 'Ceremonial grade organic matcha green tea.', barcode: '098765432109' },
  { id: '3', name: 'Blueberry Muffin', category: 'Pastry', price: 325.00, stock: 5, image: 'https://images.unsplash.com/photo-1607958674115-05b934f8bd3c?q=80&w=500&auto=format&fit=crop', description: 'Freshly baked muffin with real blueberries.', barcode: '112233445566' },
  { id: '4', name: 'Avocado Toast', category: 'Food', price: 1200.00, stock: 20, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=500&auto=format&fit=crop', description: 'Sourdough bread topped with mashed avocado and sea salt.', barcode: '998877665544' },
];

export const INITIAL_EMPLOYEES: any[] = [
  { id: 'EMP-1', name: 'Admin User', role: 'Store Manager', email: 'admin@dovie.com', phone: '0700123456', status: 'active', avatar: 'https://i.pravatar.cc/150?u=EMP-1', joinedDate: Date.now() - 31536000000, pin: '1234' },
  { id: 'EMP-2', name: 'Jane Smith', role: 'Head Barista', email: 'jane@dovie.com', phone: '0711222333', status: 'on-break', avatar: 'https://i.pravatar.cc/150?u=EMP-2', joinedDate: Date.now() - 15768000000, pin: '1234' },
  { id: 'EMP-3', name: 'John Doe', role: 'Cashier', email: 'john@dovie.com', phone: '0722333444', status: 'clocked-out', avatar: 'https://i.pravatar.cc/150?u=EMP-3', joinedDate: Date.now() - 7884000000, pin: '1234' },
];
