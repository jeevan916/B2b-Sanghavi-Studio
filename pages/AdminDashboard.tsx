
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeService } from '../services/storeService';
import { Product, AnalyticsEvent, User, Order, OrderStatus, DeliveryDetails, CartItem, ItemStatus, AppConfig, CustomOrder } from '../types';
import { 
  Loader2, Settings, Folder, Trash2, Edit2, Plus, Search, 
  Grid, List as ListIcon, Lock, CheckCircle, X, 
  LayoutDashboard, FolderOpen, UserCheck, HardDrive, Database, RefreshCw, TrendingUp, BrainCircuit, MapPin, DollarSign, Smartphone, MessageCircle, Save, AlertTriangle, Package, Truck, Archive, CheckSquare, Clock, ShieldCheck, Key, UserPlus, FileText, ArrowLeft, Printer, Calendar, Eye, Unlock, Share2, FolderInput, Copy, EyeOff, MoreHorizontal, ArrowRight, XCircle, Wrench, ShieldAlert
} from 'lucide-react';
import { ImageViewer } from '../components/ImageViewer';

interface AdminDashboardProps {
  onNavigate?: (tab: string) => void;
}

type ViewMode = 'overview' | 'orders' | 'files' | 'leads' | 'trends' | 'intelligence';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewMode>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [healthInfo, setHealthInfo] = useState<{mode?: string, healthy: boolean}>({healthy: false});
  const [intelligence, setIntelligence] = useState<any>(null);

  // Vault / Files State
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Vault Actions State
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTarget, setMoveTarget] = useState({ category: '', subCategory: '' });
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Order Management State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); 
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchDetails, setDispatchDetails] = useState<DeliveryDetails>({ mode: 'logistics' });
  const [dispatchLoading, setDispatchLoading] = useState(false);
  
  // Order Item Processing State
  const [processingItem, setProcessingItem] = useState<{ orderId: string, item: CartItem } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [customOrderDetails, setCustomOrderDetails] = useState({ requirements: '', date: '' });

  // Customer Management State
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [accessDuration, setAccessDuration] = useState(7); // Days

  // Image Zoom State
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const refreshData = async (background = false) => {
    if (!background) setLoading(true);
    else setIsSyncing(true);
    try {
        const h = await storeService.checkServerHealth();
        setHealthInfo(h);
        
        if (h.healthy) {
            const [p, a, c, o, intel, conf] = await Promise.all([
              storeService.getProducts(1, 1000, { publicOnly: false }).then(res => res.items), 
              storeService.getAnalytics(),
              storeService.getCustomers(),
              storeService.getOrders(),
              storeService.getBusinessIntelligence(),
              storeService.getConfig()
            ]);
            setProducts(p);
            setAnalytics(a);
            setCustomers(c);
            setOrders(o);
            setIntelligence(intel);
            setConfig(conf);
            
            if (selectedOrder) {
                const updated = o.find(ord => ord.id === selectedOrder.id);
                if (updated) setSelectedOrder(updated);
            }
        }
    } catch (e) {
        console.error("Dashboard Sync Failed", e);
    }
    setLoading(false);
    setIsSyncing(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => refreshData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // --- HELPERS ---
  const getViolationUrl = (userId: string) => {
      const violation = analytics.find(a => a.userId === userId && a.type === 'security_block');
      return violation?.meta?.violationUrl || 'Unknown Location';
  };

  // --- FILTERS ---
  const folders = useMemo(() => {
      const cats = new Set(products.map(p => p.category));
      return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
      return products.filter(p => {
          const matchFolder = selectedFolder === 'All' || p.category === selectedFolder;
          const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery);
          return matchFolder && matchSearch;
      });
  }, [products, selectedFolder, searchQuery]);

  // --- VAULT MANAGEMENT ACTIONS ---

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const selectAll = () => {
      if (selectedIds.size === filteredProducts.length) setSelectedIds(new Set());
      else setSelectedIds(new Set(filteredProducts.map(p => p.id)));
  };

  const handleBulkDelete = async () => {
      if (!window.confirm(`Permanently delete ${selectedIds.size} items?`)) return;
      setActionLoading(true);
      try {
          for (const id of selectedIds) {
              await storeService.deleteProduct(id);
          }
          setSelectedIds(new Set());
          refreshData(true);
      } catch (e) { alert("Delete failed"); }
      setActionLoading(false);
  };

  const handleBulkVisibility = async (hide: boolean) => {
      setActionLoading(true);
      try {
          const itemsToUpdate = products.filter(p => selectedIds.has(p.id));
          for (const p of itemsToUpdate) {
              if (p.isHidden !== hide) {
                  await storeService.updateProduct({ ...p, isHidden: hide });
              }
          }
          setSelectedIds(new Set());
          refreshData(true);
      } catch (e) { alert("Update failed"); }
      setActionLoading(false);
  };

  const handleBulkMove = async () => {
      if (!moveTarget.category) return;
      setActionLoading(true);
      try {
          const itemsToUpdate = products.filter(p => selectedIds.has(p.id));
          for (const p of itemsToUpdate) {
              await storeService.updateProduct({ 
                  ...p, 
                  category: moveTarget.category,
                  subCategory: moveTarget.subCategory 
              });
          }
          setShowMoveModal(false);
          setSelectedIds(new Set());
          refreshData(true);
      } catch (e) { alert("Move failed"); }
      setActionLoading(false);
  };

  const handleSharePrivate = async () => {
      if (selectedIds.size !== 1) return;
      const id = Array.from(selectedIds)[0];
      try {
          const link = await storeService.createSharedLink(id, 'product');
          setShareLink(link);
      } catch (e) { alert("Failed to generate link"); }
  };

  // --- ORDER ACTIONS ---
  const handleDispatch = async () => {
      if (!selectedOrder) return;
      setDispatchLoading(true);
      await storeService.updateOrderStatus(selectedOrder.id, 'dispatched', dispatchDetails);
      setShowDispatchModal(false);
      setDispatchLoading(false);
      refreshData(true);
  };

  const handleGrantAccess = async () => {
      if (!selectedCustomer) return;
      await storeService.grantAccess(selectedCustomer.id, accessDuration);
      setShowAccessModal(false);
      refreshData(true);
  };

  const handleUnblock = async () => {
      if (!selectedCustomer) return;
      await storeService.unblockCustomer(selectedCustomer.id);
      setShowAccessModal(false);
      refreshData(true);
  };

  // --- ITEM PROCESSING ACTIONS ---
  const handleItemAction = (item: CartItem, action: 'confirm' | 'reject' | 'custom') => {
      if (!selectedOrder) return;
      setProcessingItem({ orderId: selectedOrder.id, item });
      
      if (action === 'confirm') {
          storeService.updateOrderItemStatus(selectedOrder.id, item.product.id, 'confirmed')
              .then(() => refreshData(true));
      } else if (action === 'reject') {
          setRejectReason('');
          setShowRejectModal(true);
      } else if (action === 'custom') {
          setCustomOrderDetails({ requirements: item.notes || '', date: '' });
          setShowCustomModal(true);
      }
  };

  const confirmReject = async () => {
      if (!processingItem || !rejectReason) return;
      await storeService.updateOrderItemStatus(processingItem.orderId, processingItem.item.product.id, 'rejected', rejectReason);
      setShowRejectModal(false);
      setProcessingItem(null);
      refreshData(true);
  };

  const confirmCustomOrder = async () => {
      if (!processingItem || !selectedOrder) return;
      
      const customOrder: Partial<CustomOrder> = {
          originalOrderId: selectedOrder.id,
          productId: processingItem.item.product.id,
          productTitle: processingItem.item.product.title,
          productImage: processingItem.item.product.images[0],
          customerName: selectedOrder.customerName,
          requirements: customOrderDetails.requirements,
          deliveryDate: customOrderDetails.date
      };

      await storeService.moveItemToCustomOrder(customOrder);
      await storeService.updateOrderItemStatus(selectedOrder.id, processingItem.item.product.id, 'moved', 'Moved to Custom Order');
      
      setShowCustomModal(false);
      setProcessingItem(null);
      refreshData(true);
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="font-mono text-sm">INITIALIZING COMMAND CENTER...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 md:pl-20">
       {/* Sidebar / Navigation would be handled by parent layout or assumed here */}
       <div className="p-6">
           <div className="flex justify-between items-center mb-8">
               <div>
                   <h1 className="text-2xl font-bold text-white mb-1">Command Center</h1>
                   <p className="text-xs text-slate-500 font-mono uppercase">System Status: {healthInfo.healthy ? 'ONLINE' : 'OFFLINE'} • Sync: {isSyncing ? 'Active' : 'Idle'}</p>
               </div>
               <div className="flex gap-2">
                   <button onClick={() => refreshData()} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"><RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} /></button>
                   <button onClick={() => navigate('/admin/settings')} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"><Settings size={18} /></button>
               </div>
           </div>

           {/* View Tabs */}
           <div className="flex gap-4 mb-8 overflow-x-auto pb-2 border-b border-slate-800">
               {[
                   { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                   { id: 'orders', icon: Package, label: 'Orders' },
                   { id: 'files', icon: HardDrive, label: 'Vault' },
                   { id: 'leads', icon: UserCheck, label: 'Clients' },
                   { id: 'intelligence', icon: BrainCircuit, label: 'Intel' }
               ].map(tab => (
                   <button 
                       key={tab.id}
                       onClick={() => setActiveView(tab.id as ViewMode)}
                       className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${activeView === tab.id ? 'bg-teal-500/10 text-teal-500' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                       <tab.icon size={16} /> {tab.label}
                   </button>
               ))}
           </div>

           {/* CONTENT AREA */}
           <div className="animate-in fade-in slide-in-from-bottom-4">
               
               {/* OVERVIEW */}
               {activeView === 'overview' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                           <div className="flex justify-between items-start mb-4">
                               <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Package size={24}/></div>
                               <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">PENDING</span>
                           </div>
                           <h3 className="text-3xl font-bold text-white mb-1">{orders.filter(o => o.status === 'pending').length}</h3>
                           <p className="text-xs text-slate-500">New Orders</p>
                       </div>
                       <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                           <div className="flex justify-between items-start mb-4">
                               <div className="p-3 bg-teal-500/10 rounded-xl text-teal-500"><UserCheck size={24}/></div>
                               <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">ACTIVE</span>
                           </div>
                           <h3 className="text-3xl font-bold text-white mb-1">{customers.length}</h3>
                           <p className="text-xs text-slate-500">Registered Clients</p>
                       </div>
                       <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                           <div className="flex justify-between items-start mb-4">
                               <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><TrendingUp size={24}/></div>
                               <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">VIEWS</span>
                           </div>
                           <h3 className="text-3xl font-bold text-white mb-1">{analytics.filter(a => a.type === 'view').length}</h3>
                           <p className="text-xs text-slate-500">Catalog Interactions</p>
                       </div>
                       <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                           <div className="flex justify-between items-start mb-4">
                               <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><HardDrive size={24}/></div>
                               <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">ASSETS</span>
                           </div>
                           <h3 className="text-3xl font-bold text-white mb-1">{products.length}</h3>
                           <p className="text-xs text-slate-500">Vault Items</p>
                       </div>
                   </div>
               )}

               {/* FILES / VAULT */}
               {activeView === 'files' && (
                   <div className="space-y-6">
                       {/* Toolbar */}
                       <div className="flex gap-4 items-center bg-slate-900 p-4 rounded-xl border border-slate-800 flex-wrap">
                           <div className="relative flex-1 min-w-[200px]">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                               <input 
                                   type="text" 
                                   placeholder="Search vault..." 
                                   value={searchQuery}
                                   onChange={(e) => setSearchQuery(e.target.value)}
                                   className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-teal-500 outline-none"
                               />
                           </div>
                           <select 
                               value={selectedFolder}
                               onChange={(e) => setSelectedFolder(e.target.value)}
                               className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:border-teal-500 outline-none"
                           >
                               {folders.map(f => <option key={f} value={f}>{f}</option>)}
                           </select>
                           <button onClick={selectAll} className="p-2 text-slate-400 hover:text-white border border-slate-800 rounded-lg" title="Select All">
                               <CheckSquare size={20} className={selectedIds.size === filteredProducts.length ? 'text-teal-500' : ''}/>
                           </button>
                           <button onClick={() => setViewStyle(viewStyle === 'grid' ? 'list' : 'grid')} className="p-2 text-slate-400 hover:text-white border border-slate-800 rounded-lg">
                               {viewStyle === 'grid' ? <ListIcon size={20} /> : <Grid size={20} />}
                           </button>
                           <button onClick={() => navigate('/admin/upload')} className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                               <Plus size={16} /> Upload
                           </button>
                       </div>

                       {/* Products Grid/List */}
                       <div className={viewStyle === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-24" : "space-y-2 pb-24"}>
                           {filteredProducts.map(product => {
                               const isSelected = selectedIds.has(product.id);
                               return (
                                   <div 
                                      key={product.id} 
                                      onClick={() => toggleSelection(product.id)}
                                      className={`
                                        bg-slate-900 border rounded-xl overflow-hidden group transition-all cursor-pointer relative
                                        ${isSelected ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-800 hover:border-slate-600'}
                                        ${viewStyle === 'list' ? 'flex items-center gap-4 p-2' : ''}
                                      `}
                                   >
                                       {/* Selection Indicator */}
                                       <div className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-full border border-white/50 flex items-center justify-center transition-colors ${isSelected ? 'bg-teal-500 border-teal-500' : 'bg-black/40'}`}>
                                           {isSelected && <CheckCircle size={14} className="text-white" />}
                                       </div>

                                       <div className={`${viewStyle === 'grid' ? 'aspect-square w-full' : 'w-12 h-12 shrink-0'} bg-slate-950 relative`}>
                                           <img src={product.thumbnails[0] || product.images[0]} className="w-full h-full object-cover" />
                                           {product.isHidden && (
                                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                  <EyeOff className="text-red-400" size={24}/>
                                              </div>
                                           )}
                                       </div>
                                       
                                       <div className={`p-3 ${viewStyle === 'list' ? 'flex-1 flex justify-between items-center' : ''}`}>
                                           <div>
                                               <h4 className="text-sm font-bold text-slate-200 truncate">{product.title}</h4>
                                               <p className="text-[10px] text-slate-500 font-mono">{product.category} • {product.weight}g</p>
                                           </div>
                                       </div>
                                   </div>
                               );
                           })}
                       </div>

                       {/* Batch Actions Bar - Floating Bottom */}
                       {selectedIds.size > 0 && (
                           <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl border border-slate-700 flex items-center gap-4 z-40 animate-in slide-in-from-bottom-10">
                               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-600 pr-4">{selectedIds.size} Selected</span>
                               
                               <button onClick={() => setShowMoveModal(true)} className="flex flex-col items-center gap-1 group">
                                   <div className="p-2 bg-slate-700 rounded-full group-hover:bg-blue-600 transition"><FolderInput size={18}/></div>
                                   <span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-white">Move</span>
                               </button>

                               <button onClick={() => handleBulkVisibility(true)} className="flex flex-col items-center gap-1 group">
                                   <div className="p-2 bg-slate-700 rounded-full group-hover:bg-slate-600 transition"><EyeOff size={18}/></div>
                                   <span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-white">Hide</span>
                               </button>

                               <button onClick={() => handleBulkVisibility(false)} className="flex flex-col items-center gap-1 group">
                                   <div className="p-2 bg-slate-700 rounded-full group-hover:bg-slate-600 transition"><Eye size={18}/></div>
                                   <span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-white">Unhide</span>
                               </button>

                               <button onClick={handleBulkDelete} className="flex flex-col items-center gap-1 group">
                                   <div className="p-2 bg-slate-700 rounded-full group-hover:bg-red-600 transition"><Trash2 size={18}/></div>
                                   <span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-white">Delete</span>
                               </button>

                               {selectedIds.size === 1 && (
                                   <div className="border-l border-slate-600 pl-4 ml-2">
                                       <button onClick={handleSharePrivate} className="flex flex-col items-center gap-1 group">
                                           <div className="p-2 bg-slate-700 rounded-full group-hover:bg-gold-600 transition"><Share2 size={18}/></div>
                                           <span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-white">Share</span>
                                       </button>
                                   </div>
                               )}
                           </div>
                       )}
                   </div>
               )}

               {/* LEADS / CLIENTS */}
               {activeView === 'leads' && (
                   <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                       <div className="overflow-x-auto">
                           <table className="w-full text-left text-sm text-slate-400">
                               <thead className="bg-slate-950 uppercase font-bold text-xs tracking-wider">
                                   <tr>
                                       <th className="p-4">Client</th>
                                       <th className="p-4">Contact</th>
                                       <th className="p-4">Status</th>
                                       <th className="p-4">Access</th>
                                       <th className="p-4">Actions</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-800">
                                   {customers.map(c => (
                                       <tr key={c.id} className={`hover:bg-slate-800/50 ${c.isBlocked ? 'bg-red-950/10' : ''}`}>
                                           <td className="p-4">
                                               <div className="font-medium text-white">{c.name}</div>
                                               {c.isBlocked && (
                                                   <div className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                                                       <ShieldAlert size={10} /> Violation Detected
                                                   </div>
                                               )}
                                           </td>
                                           <td className="p-4 font-mono">{c.phone}</td>
                                           <td className="p-4">
                                               {c.isBlocked ? <span className="text-red-400 font-bold flex items-center gap-1"><ShieldCheck size={12}/> BLOCKED</span> :
                                                c.isVerified ? <span className="text-teal-400 font-bold flex items-center gap-1"><CheckCircle size={12}/> VERIFIED</span> :
                                                <span className="text-yellow-500 font-bold">PENDING</span>}
                                           </td>
                                           <td className="p-4 text-xs">
                                               {c.accessExpiresAt ? new Date(c.accessExpiresAt).toLocaleDateString() : '-'}
                                           </td>
                                           <td className="p-4">
                                               <button 
                                                   onClick={() => { setSelectedCustomer(c); setShowAccessModal(true); }}
                                                   className="px-3 py-1 bg-teal-500/10 text-teal-500 rounded hover:bg-teal-500 hover:text-white transition text-xs font-bold uppercase"
                                               >
                                                   Manage
                                               </button>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   </div>
               )}

               {/* ORDERS */}
               {activeView === 'orders' && (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                       {/* Order List */}
                       <div className="lg:col-span-1 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                           {orders.map(order => (
                               <div 
                                   key={order.id} 
                                   onClick={() => setSelectedOrder(order)}
                                   className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder?.id === order.id ? 'bg-teal-500/10 border-teal-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                               >
                                   <div className="flex justify-between items-start mb-2">
                                       <span className="font-mono text-xs text-slate-500">#{order.id.slice(0,6)}</span>
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>{order.status}</span>
                                   </div>
                                   <h4 className="font-bold text-white">{order.customerName}</h4>
                                   <p className="text-xs text-slate-400">{order.totalItems} Items • {new Date(order.createdAt).toLocaleDateString()}</p>
                               </div>
                           ))}
                       </div>
                       
                       {/* Order Detail View */}
                       <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 min-h-[500px]">
                           {selectedOrder ? (
                               <div className="space-y-6">
                                   <div className="flex justify-between items-center pb-6 border-b border-slate-800">
                                       <div>
                                           <h2 className="text-xl font-bold text-white">Order #{selectedOrder.id.slice(0,8)}</h2>
                                           <p className="text-sm text-slate-400">{selectedOrder.customerName} • {selectedOrder.customerPhone}</p>
                                       </div>
                                       <div className="flex gap-2">
                                           {selectedOrder.status !== 'dispatched' && selectedOrder.status !== 'delivered' && (
                                               <button onClick={() => setShowDispatchModal(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold text-sm hover:bg-teal-500 transition">
                                                   Dispatch All
                                               </button>
                                           )}
                                            {selectedOrder.status === 'pending' && (
                                               <button onClick={() => storeService.updateOrderStatus(selectedOrder.id, 'confirmed').then(() => refreshData(true))} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-500 transition">
                                                   Confirm Order
                                               </button>
                                           )}
                                       </div>
                                   </div>

                                   <div className="space-y-4">
                                       {selectedOrder.items.map((item, idx) => {
                                           const isItemProcessed = ['confirmed', 'rejected', 'moved'].includes(item.status || '');
                                           return (
                                               <div key={idx} className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border ${item.status === 'rejected' ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-950 border-slate-800'}`}>
                                                   <img src={item.product.thumbnails[0] || item.product.images[0]} className="w-16 h-16 rounded-lg object-cover bg-slate-800" />
                                                   <div className="flex-1">
                                                       <div className="flex justify-between items-start">
                                                           <div>
                                                               <h4 className="font-bold text-white">{item.product.title}</h4>
                                                               <p className="text-xs text-slate-500">ID: {item.product.id.slice(-6)} • {item.product.category}</p>
                                                           </div>
                                                           <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                               item.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                                               item.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                               item.status === 'moved' ? 'bg-purple-500/20 text-purple-400' :
                                                               'bg-yellow-500/10 text-yellow-500'
                                                           }`}>
                                                               {item.status || 'Pending'}
                                                           </span>
                                                       </div>
                                                       <div className="mt-2 text-xs text-slate-400 flex flex-wrap gap-4">
                                                           <span>Qty: <b>{item.quantity}</b></span>
                                                           <span>Wt: <b>{item.product.weight}g</b></span>
                                                           <span>Total: <b>{(item.product.weight * item.quantity).toFixed(2)}g</b></span>
                                                       </div>
                                                       {item.notes && <p className="text-xs text-amber-500 mt-2 bg-amber-950/20 p-2 rounded border border-amber-900/50">Note: {item.notes}</p>}
                                                       {item.rejectionReason && <p className="text-xs text-red-400 mt-2">Reason: {item.rejectionReason}</p>}
                                                   </div>
                                                   
                                                   {/* Item Actions */}
                                                   <div className="flex sm:flex-col gap-2 justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                                                       <button 
                                                           onClick={() => handleItemAction(item, 'confirm')}
                                                           className="p-2 bg-slate-800 hover:bg-green-600 text-slate-400 hover:text-white rounded-lg transition"
                                                           title="Confirm Item"
                                                       >
                                                           <CheckCircle size={18} />
                                                       </button>
                                                       <button 
                                                           onClick={() => handleItemAction(item, 'custom')}
                                                           className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition"
                                                           title="Move to Custom Order"
                                                       >
                                                           <Wrench size={18} />
                                                       </button>
                                                       <button 
                                                           onClick={() => handleItemAction(item, 'reject')}
                                                           className="p-2 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg transition"
                                                           title="Reject Item"
                                                       >
                                                           <XCircle size={18} />
                                                       </button>
                                                   </div>
                                               </div>
                                           );
                                       })}
                                   </div>
                               </div>
                           ) : (
                               <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                   <Package size={48} className="mb-4 opacity-50" />
                                   <p>Select an order to process details</p>
                               </div>
                           )}
                       </div>
                   </div>
               )}

               {/* INTEL / ANALYTICS */}
               {activeView === 'intelligence' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                           <h3 className="font-bold text-white mb-4 flex items-center gap-2"><MapPin size={18}/> Regional Demand</h3>
                           <div className="space-y-3">
                               {intelligence?.regionalDemand?.slice(0, 5).map((d: any, i: number) => (
                                   <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                                       <div>
                                           <p className="font-bold text-white">{d.pincode}</p>
                                           <p className="text-xs text-slate-500">{d.category}</p>
                                       </div>
                                       <div className="text-right">
                                           <p className="font-bold text-teal-500">{d.demand_score}</p>
                                           <p className="text-[10px] text-slate-600 uppercase">Interest Score</p>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                       <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                           <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Smartphone size={18}/> Engagement Metrics</h3>
                           <div className="space-y-3">
                               {intelligence?.engagement?.slice(0, 5).map((e: any, i: number) => (
                                   <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                                       <div className="truncate flex-1 pr-4">
                                           <p className="font-bold text-white truncate">{e.productTitle}</p>
                                       </div>
                                       <div className="text-right shrink-0">
                                           <p className="font-bold text-purple-400">{Math.round(e.avg_time_seconds)}s</p>
                                           <p className="text-[10px] text-slate-600 uppercase">Avg View Time</p>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   </div>
               )}
           </div>
       </div>

       {/* --- MODALS --- */}

       {/* Reject Modal */}
       {showRejectModal && (
           <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
               <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-md">
                   <h3 className="text-xl font-bold text-white mb-2">Reject Item</h3>
                   <p className="text-slate-400 text-sm mb-4">Please provide a reason for unavailability.</p>
                   <textarea 
                       value={rejectReason}
                       onChange={e => setRejectReason(e.target.value)}
                       className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white mb-4 outline-none focus:border-red-500"
                       placeholder="E.g., Out of stock, Discontinued..."
                   />
                   <div className="flex gap-2">
                       <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                       <button onClick={confirmReject} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Confirm Rejection</button>
                   </div>
               </div>
           </div>
       )}

       {/* Custom Order Modal */}
       {showCustomModal && (
           <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
               <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-md">
                   <h3 className="text-xl font-bold text-white mb-2">Move to Custom Order</h3>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Requirements</label>
                           <textarea 
                               value={customOrderDetails.requirements}
                               onChange={e => setCustomOrderDetails({...customOrderDetails, requirements: e.target.value})}
                               className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                               placeholder="Adjustments needed..."
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Est. Delivery Date</label>
                           <input 
                               type="date"
                               value={customOrderDetails.date}
                               onChange={e => setCustomOrderDetails({...customOrderDetails, date: e.target.value})}
                               className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                           />
                       </div>
                       <div className="flex gap-2 pt-2">
                           <button onClick={() => setShowCustomModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                           <button onClick={confirmCustomOrder} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Create Order</button>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* Move/Category Modal */}
       {showMoveModal && (
           <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
               <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-md">
                   <h3 className="text-xl font-bold text-white mb-4">Relocate Assets</h3>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Category</label>
                           <select 
                               value={moveTarget.category}
                               onChange={e => setMoveTarget({...moveTarget, category: e.target.value, subCategory: ''})}
                               className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
                           >
                               <option value="">Select Category</option>
                               {config?.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Sub-Category</label>
                           <select 
                               value={moveTarget.subCategory}
                               onChange={e => setMoveTarget({...moveTarget, subCategory: e.target.value})}
                               disabled={!moveTarget.category}
                               className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white disabled:opacity-50"
                           >
                               <option value="">Select Sub-Category</option>
                               {config?.categories.find(c => c.name === moveTarget.category)?.subCategories.map(s => (
                                   <option key={s} value={s}>{s}</option>
                               ))}
                           </select>
                       </div>
                       <div className="flex gap-2 pt-4">
                           <button onClick={() => setShowMoveModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                           <button onClick={handleBulkMove} disabled={actionLoading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">
                               {actionLoading ? 'Moving...' : 'Move Assets'}
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* Share Private Link Modal */}
       {shareLink && (
           <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
               <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-md text-center">
                   <div className="w-16 h-16 bg-teal-500/10 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Lock size={32}/>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Secure Link Generated</h3>
                   <p className="text-slate-400 text-sm mb-6">This private link grants 24-hour access to the specific product for unregistered clients.</p>
                   
                   <div className="bg-black/50 p-4 rounded-xl border border-slate-700 flex items-center gap-3 mb-6">
                       <p className="text-xs text-slate-300 font-mono truncate flex-1">{shareLink}</p>
                       <button onClick={() => navigator.clipboard.writeText(shareLink)} className="text-teal-500 hover:text-white"><Copy size={16}/></button>
                   </div>

                   <button onClick={() => setShareLink(null)} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700">Close</button>
               </div>
           </div>
       )}

       {/* Access Modal */}
       {showAccessModal && selectedCustomer && (
           <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
               <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-md">
                   <h3 className="text-xl font-bold text-white mb-4">Manage Access: {selectedCustomer.name}</h3>
                   
                   {selectedCustomer.isBlocked && (
                       <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded-xl">
                           <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                               <ShieldAlert size={18} /> Account Blocked
                           </div>
                           <p className="text-xs text-red-300 mb-2">
                               Reason: {getViolationUrl(selectedCustomer.id) !== 'Unknown Location' ? 'Security Violation' : 'Manual Block'}
                           </p>
                           <p className="text-[10px] font-mono text-slate-400 bg-black/40 p-2 rounded truncate">
                               Location: {getViolationUrl(selectedCustomer.id)}
                           </p>
                       </div>
                   )}

                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Access Duration</label>
                           <div className="flex gap-2">
                               {[1, 3, 7, 30].map(d => (
                                   <button 
                                       key={d}
                                       onClick={() => setAccessDuration(d)}
                                       className={`flex-1 py-2 rounded-lg text-sm font-bold border ${accessDuration === d ? 'bg-teal-500 text-white border-teal-500' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                   >
                                       {d} Days
                                   </button>
                               ))}
                           </div>
                       </div>
                       <div className="flex gap-2 pt-4">
                           <button onClick={() => setShowAccessModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                           {selectedCustomer.isBlocked ? (
                               <button onClick={handleUnblock} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold">Unblock User</button>
                           ) : (
                               <button onClick={handleGrantAccess} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold">Grant Access</button>
                           )}
                       </div>
                       {!selectedCustomer.isBlocked && (
                           <div className="pt-2 border-t border-slate-800">
                               <button onClick={() => { storeService.blockCustomer(selectedCustomer.id).then(() => { setShowAccessModal(false); refreshData(true); }) }} className="w-full py-3 text-red-400 hover:bg-red-950/30 rounded-xl font-bold flex items-center justify-center gap-2">
                                   <ShieldCheck size={18}/> Block User Manually
                               </button>
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}

       {/* Dispatch Modal */}
       {showDispatchModal && (
           <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
               <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-md">
                   <h3 className="text-xl font-bold text-white mb-4">Confirm Dispatch</h3>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mode</label>
                           <select 
                               value={dispatchDetails.mode} 
                               onChange={e => setDispatchDetails({...dispatchDetails, mode: e.target.value as any})}
                               className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                           >
                               <option value="logistics">Logistics / Courier</option>
                               <option value="hand_to_hand">Hand-to-Hand</option>
                               <option value="vpp">VPP</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tracking / Reference</label>
                           <input 
                               value={dispatchDetails.trackingNumber || ''} 
                               onChange={e => setDispatchDetails({...dispatchDetails, trackingNumber: e.target.value})}
                               className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                               placeholder="AWB or Ref Number"
                           />
                       </div>
                       <div className="flex gap-2 pt-4">
                           <button onClick={() => setShowDispatchModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold">Cancel</button>
                           <button onClick={handleDispatch} disabled={dispatchLoading} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold">
                               {dispatchLoading ? 'Processing...' : 'Mark Dispatched'}
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
