
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Sparkles, Image as ImageIcon, Loader2, Upload, Info, Barcode as BarcodeIcon, Printer, Wand2, UploadCloud, X, Check, FileImage, AlertCircle, AlertTriangle, Zap, Settings, History, Calendar, Package } from 'lucide-react';
import { Product, StockAdjustment } from '../types';
import { generateProductDescription, generateProductImage } from '../services/geminiService';
import Barcode from '../components/Barcode';
import { format, isBefore, addDays, parseISO } from 'date-fns';

interface InventoryProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  lowStockThreshold: number;
  onUpdateThreshold: (threshold: number) => void;
}

interface StagedImage {
  id: string;
  file: File;
  preview: string;
  matchedProductId: string | null;
}

const Inventory: React.FC<InventoryProps> = ({ products, onUpdateProducts, lowStockThreshold, onUpdateThreshold }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImageModalOpen, setIsBulkImageModalOpen] = useState(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [tempThreshold, setTempThreshold] = useState(lowStockThreshold);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkImageInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    image: 'https://picsum.photos/seed/new/200',
    barcode: '',
    batchNumber: '',
    expiryDate: ''
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const generateRandomBarcode = () => {
    return Math.floor(Math.random() * 900000000000 + 100000000000).toString();
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        stock: product.stock.toString(),
        description: product.description,
        image: product.image,
        barcode: product.barcode || '',
        batchNumber: product.batchNumber || '',
        expiryDate: product.expiryDate || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        price: '',
        stock: '',
        description: '',
        image: 'https://picsum.photos/seed/new/200',
        barcode: generateRandomBarcode(),
        batchNumber: `BN-${Date.now().toString().slice(-6)}`,
        expiryDate: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenHistory = (product: Product) => {
    setHistoryProduct(product);
    setIsHistoryModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.category) {
      alert("Name and Category are required");
      return;
    }

    const newStockVal = parseInt(formData.stock) || 0;
    const prevStockVal = editingProduct?.stock || 0;
    
    let updatedHistory = [...(editingProduct?.history || [])];
    
    // Auto-generate history for manual stock adjustments
    if (editingProduct && newStockVal !== prevStockVal) {
      const adjustment: StockAdjustment = {
        id: `ADJ-${Date.now()}`,
        type: newStockVal > prevStockVal ? 'restock' : 'correction',
        quantity: newStockVal - prevStockVal,
        previousStock: prevStockVal,
        newStock: newStockVal,
        timestamp: Date.now(),
        user: 'Admin User',
        note: 'Manual inventory update'
      };
      updatedHistory = [adjustment, ...updatedHistory];
    }

    const productData: Product = {
      id: editingProduct?.id || `PROD-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      stock: newStockVal,
      description: formData.description,
      image: formData.image,
      barcode: formData.barcode || generateRandomBarcode(),
      batchNumber: formData.batchNumber,
      expiryDate: formData.expiryDate,
      history: updatedHistory
    };

    if (editingProduct) {
      onUpdateProducts(products.map(p => p.id === editingProduct.id ? productData : p));
    } else {
      onUpdateProducts([...products, productData]);
    }
    setIsModalOpen(false);
  };

  const handleAIDescription = async () => {
    if (!formData.name || !formData.category) {
      alert("Please provide product name and category first");
      return;
    }
    setIsLoadingAI(true);
    try {
      const desc = await generateProductDescription(formData.name, formData.category);
      setFormData(prev => ({ ...prev, description: desc }));
    } catch (error) {
      console.error(error);
      alert("Failed to generate description");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAIImage = async () => {
    if (!formData.name) {
      alert("Please provide product name first");
      return;
    }
    setIsLoadingAI(true);
    try {
      const img = await generateProductImage(formData.name);
      setFormData(prev => ({ ...prev, image: img }));
    } catch (error) {
      console.error(error);
      alert("Failed to generate image");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const expiry = parseISO(dateStr);
    const soon = addDays(new Date(), 30); // 30 days notice
    return isBefore(expiry, soon);
  };

  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return isBefore(parseISO(dateStr), new Date());
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newProducts: Product[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [name, category, price, stock, description, image, barcode, batch, expiry] = line.split(',').map(s => s?.trim());
        if (name && category) {
          newProducts.push({
            id: `PROD-BULK-${Date.now()}-${i}`,
            name,
            category,
            price: parseFloat(price) || 0,
            stock: parseInt(stock) || 0,
            description: description || '',
            image: image || `https://picsum.photos/seed/${name}/200`,
            barcode: barcode || generateRandomBarcode(),
            batchNumber: batch || `BN-${Date.now()}`,
            expiryDate: expiry || '',
            history: [{
              id: `ADJ-INIT-${Date.now()}`,
              type: 'restock',
              quantity: parseInt(stock) || 0,
              previousStock: 0,
              newStock: parseInt(stock) || 0,
              timestamp: Date.now(),
              user: 'System (Bulk Import)',
              note: 'Initial import'
            }]
          });
        }
      }
      if (newProducts.length > 0) {
        onUpdateProducts([...products, ...newProducts]);
        alert(`Successfully imported ${newProducts.length} products!`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      const id = Math.random().toString(36).substr(2, 9);
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        const filename = file.name.split('.')[0].toLowerCase();
        const matched = products.find(p => p.name.toLowerCase() === filename || p.id.toLowerCase() === filename);
        setStagedImages(prev => [
          ...prev, 
          { id, file, preview, matchedProductId: matched ? matched.id : null }
        ]);
      };
      reader.readAsDataURL(file);
    });
  }, [products]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleApplyBulkImages = () => {
    const updates = stagedImages.filter(img => img.matchedProductId);
    if (updates.length === 0) {
      alert("No products matched.");
      return;
    }
    const updatedProducts = products.map(p => {
      const match = stagedImages.find(img => img.matchedProductId === p.id);
      return match ? { ...p, image: match.preview } : p;
    });
    onUpdateProducts(updatedProducts);
    setStagedImages([]);
    setIsBulkImageModalOpen(false);
    alert(`Successfully updated images for ${updates.length} products!`);
  };

  const productsMissingBarcodes = products.filter(p => !p.barcode).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory Intelligence</h1>
          <p className="text-slate-500">Real-time stock tracking with audit history.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsThresholdModalOpen(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"><Settings size={18} />Stock Settings</button>
          <button onClick={() => setIsBulkImageModalOpen(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"><ImageIcon size={18} className="text-blue-500" />Bulk Images</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"><Upload size={18} />CSV Import</button>
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCSVUpload}/>
          <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all"><Plus size={18} />Add Product</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by name, category, or barcode..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">Batch/Expiry</th>
                <th className="px-6 py-4 text-center">Stock Level</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => {
                const expiringSoon = isExpiringSoon(product.expiryDate);
                const expired = isExpired(product.expiryDate);
                return (
                  <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${product.stock < lowStockThreshold ? 'bg-rose-50/20' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100">
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{product.barcode || 'NO BARCODE'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">#{product.batchNumber || 'N/A'}</p>
                        {product.expiryDate ? (
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${expired ? 'text-rose-600' : expiringSoon ? 'text-amber-600' : 'text-slate-500'}`}>
                            <Calendar size={12} />
                            {format(parseISO(product.expiryDate), 'MMM dd, yyyy')}
                            {expired && <span className="text-[8px] bg-rose-100 px-1.5 py-0.5 rounded-full">EXPIRED</span>}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-300 italic">No expiry set</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 ${
                          product.stock < lowStockThreshold 
                            ? 'bg-rose-100 text-rose-600 border border-rose-200' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {product.stock < lowStockThreshold && <AlertTriangle size={12} className="animate-bounce" />}
                          {product.stock} Units
                        </div>
                        {product.history && product.history.length > 0 && (
                          <p className="text-[9px] text-slate-400 mt-1">Last change: {formatDistanceToNowShort(product.history[0].timestamp)} ago</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">
                      KSh {product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenHistory(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Audit History"><History size={16} /></button>
                        <button onClick={() => handleOpenModal(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Audit History Modal */}
      {isHistoryModalOpen && historyProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg"><History size={20} /></div>
                <div>
                  <h2 className="text-xl font-bold">Inventory History</h2>
                  <p className="text-xs text-slate-500">{historyProduct.name} (Batch: {historyProduct.batchNumber})</p>
                </div>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {(!historyProduct.history || historyProduct.history.length === 0) ? (
                <div className="py-12 text-center text-slate-400 italic">No history recorded for this product.</div>
              ) : (
                <div className="space-y-4">
                  {historyProduct.history.map((adj) => (
                    <div key={adj.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                        adj.type === 'restock' ? 'bg-emerald-100 text-emerald-600' :
                        adj.type === 'sale' ? 'bg-blue-100 text-blue-600' :
                        'bg-rose-100 text-rose-600'
                      }`}>
                        {adj.type === 'restock' ? <Plus size={16} /> : 
                         adj.type === 'sale' ? <Package size={16} /> : 
                         <AlertTriangle size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-slate-800 text-sm uppercase tracking-tight">{adj.type.replace('_', ' ')}</p>
                          <span className="text-[10px] text-slate-400 font-bold">{format(adj.timestamp, 'MMM dd, HH:mm:ss')}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">{adj.note || 'Manual Adjustment'}</p>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Change</p>
                            <p className={`text-sm font-black ${adj.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {adj.quantity > 0 ? '+' : ''}{adj.quantity}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Stock Levels</p>
                            <p className="text-sm font-bold text-slate-500">{adj.previousStock} → <span className="text-slate-800">{adj.newStock}</span></p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Authorized By</p>
                            <p className="text-sm font-bold text-slate-700">{adj.user}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t"><button onClick={() => setIsHistoryModalOpen(false)} className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all">Close History</button></div>
          </div>
        </div>
      )}

      {/* Stock Threshold Modal */}
      {isThresholdModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2"><Settings size={18} className="text-slate-500" /><h2 className="text-xl font-bold">Stock Settings</h2></div>
              <button onClick={() => setIsThresholdModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Low Stock Threshold</label>
                <div className="flex items-center gap-3">
                  <input type="number" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={tempThreshold} onChange={(e) => setTempThreshold(parseInt(e.target.value) || 0)}/>
                  <span className="text-sm font-medium text-slate-500">Units</span>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button onClick={() => setIsThresholdModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl">Cancel</button>
              <button onClick={() => { onUpdateThreshold(tempThreshold); setIsThresholdModalOpen(false); }} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal Enhanced with Batch/Expiry */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold">{editingProduct ? 'Update Product Details' : 'Add New Inventory Item'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><Plus size={24} className="rotate-45" /></button>
            </div>
            
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Product Name</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Price (KSh)</label>
                      <input type="number" step="0.01" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})}/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Initial Stock</label>
                      <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})}/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Batch Number</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" value={formData.batchNumber} onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Expiry Date</label>
                      <input type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option value="">Select Category</option>
                      <option value="Coffee">Coffee</option><option value="Tea">Tea</option><option value="Pastry">Pastry</option><option value="Food">Food</option><option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="relative group">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Product Image</label>
                    <div className="aspect-video rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group-hover:bg-slate-200 transition-colors">
                      {formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={48} />}
                      {isLoadingAI && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}
                    </div>
                    <button onClick={handleAIImage} disabled={isLoadingAI} className="mt-3 w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"><Sparkles size={14} className="text-amber-500" />AI Generate Image</button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description (AI Assisted)</label>
                    <textarea 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm h-24 resize-none" 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Brief product summary..."
                    />
                    <button onClick={handleAIDescription} disabled={isLoadingAI} className="mt-2 text-xs font-bold text-blue-600 flex items-center gap-2 hover:underline disabled:opacity-50">
                      <Sparkles size={12} /> Auto-write description
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all">Discard Changes</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Complete Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for relative time in audit logs
function formatDistanceToNowShort(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (mins > 0) return `${mins}m`;
  return 'just now';
}

export default Inventory;
