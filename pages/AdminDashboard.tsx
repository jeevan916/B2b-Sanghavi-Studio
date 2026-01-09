
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeService } from '../services/storeService';
import { Product, AnalyticsEvent, User, Order, OrderStatus, DeliveryDetails, CartItem, ItemStatus } from '../types';
import { 
  Loader2, Settings, Folder, Trash2, Edit2, Plus, Search, 
  Grid, List as ListIcon, Lock, CheckCircle, X, 
  LayoutDashboard, FolderOpen, UserCheck, HardDrive, Database, RefreshCw, TrendingUp, BrainCircuit, MapPin, DollarSign, Smartphone, MessageCircle, Save, AlertTriangle, Package, Truck, Archive, CheckSquare, Clock, ShieldCheck, Key, UserPlus, FileText, ArrowLeft, Printer, Calendar
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [healthInfo, setHealthInfo] = useState<{mode?: string, healthy: boolean}>({healthy: false});
  const [intelligence, setIntelligence] = useState<any>(null);

  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Order Management State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // For Master-Detail view
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchDetails, setDispatchDetails] = useState<DeliveryDetails>({ mode: 'logistics' });
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  // Item Discard State
  const [itemToDiscard, setItemToDiscard] = useState<CartItem | null>(null);
  const [discardReason, setDiscardReason] = useState('');
  const [customOrderSpecs, setCustomOrderSpecs] = useState('');
  const [customOrderDate, setCustomOrderDate] = useState('');

  // Customer Management State
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [editCustomerData, setEditCustomerData] = useState<Partial<User>>({});
  const [accessDuration, setAccessDuration] = useState(7); // Days

  const refreshData = async (background = false) => {
    if (!background) setLoading(true);
    else setIsSyncing(true);
    try {
        const h = await storeService.checkServerHealth();
        setHealthInfo(h);
        
        if (h.healthy) {
            const [p, a, c, o, intel] = await Promise.all([
              storeService.getProducts(1, 1000, { publicOnly: false }).then(res => res.items), 
              storeService.getAnalytics(),
              storeService.getCustomers(),
              storeService.getOrders(),
              storeService.getBusinessIntelligence()
            ]);
            setProducts(p);
            setAnalytics(a);
            setCustomers(c);
            setOrders(o);
            setIntelligence(intel);
            
            // If viewing specific order, refresh it
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

  const folders = useMemo(() => {
      const cats = new Set(products.map(p => p.category));
      return ['All', 'Private', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
      return products.filter(p => {
          const matchesFolder = 
            selectedFolder === 'All' ? true :
            selectedFolder === 'Private' ? p.isHidden :
            p.category === selectedFolder;
          const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery);
          return matchesFolder && matchesSearch;
      });
  }, [products, selectedFolder, searchQuery]);

  const recentInquiries = useMemo(() => analytics.filter(e => e.type === 'inquiry').slice(0, 10), [analytics]);

  const handleGrantAccess = async () => {
      if (!selectedCustomer) return;
      await storeService.grantAccess(selectedCustomer.id, accessDuration);
      setShowAccessModal(false);
      refreshData(true);
  };

  const handleSaveCustomerEdit = async () => {
      if (!selectedCustomer || !editCustomerData) return;
      try {
          await storeService.updateCustomerProfile(selectedCustomer.id, editCustomerData);
          setShowEditCustomerModal(false);
          refreshData(true);
      } catch (e) {
          alert("Failed to update profile.");
      }
  };

  const openCustomerEdit = (customer: User) => {
      setSelectedCustomer(customer);
      setEditCustomerData({
          name: customer.name,
          phone: customer.phone,
          pincode: customer.pincode,
          address: customer.address || ''
      });
      setShowEditCustomerModal(true);
  };

  // --- Order Item Actions ---

  const handleConfirmItem = async (item: CartItem) => {
      if (!selectedOrder) return;
      await storeService.updateOrderItemStatus(selectedOrder.id, item.product.id, 'confirmed');
      refreshData(true);
  };

  const handleDiscardItem = async () => {
      if (!selectedOrder || !itemToDiscard || !discardReason) return;
      
      const isMoved = discardReason === 'Placed Order as per Requirement';
      
      // Update Status in Main Order
      await storeService.updateOrderItemStatus(
          selectedOrder.id, 
          itemToDiscard.product.id, 
          isMoved ? 'moved' : 'rejected', 
          discardReason
      );

      // If moved, create Custom Order entry and Print PDF
      if (isMoved) {
          await storeService.moveItemToCustomOrder({
              originalOrderId: selectedOrder.id,
              productId: itemToDiscard.product.id,
              productTitle: itemToDiscard.product.title,
              productImage: itemToDiscard.product.images[0],
              customerName: selectedOrder.customerName,
              requirements: customOrderSpecs,
              deliveryDate: customOrderDate || new Date().toISOString().split('T')[0]
          });
          
          printCustomOrderJobSheet(itemToDiscard, customOrderSpecs, customOrderDate, selectedOrder.customerName);
      }

      setItemToDiscard(null);
      setDiscardReason('');
      setCustomOrderSpecs('');
      setCustomOrderDate('');
      refreshData(true);
  };

  const printCustomOrderJobSheet = (item: CartItem, specs: string, date: string, customer: string) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const html = `
        <html>
        <head>
            <title>Custom Job Sheet - ${item.product.title}</title>
            <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #b0773f; padding-bottom: 20px; margin-bottom: 40px; }
                .logo { font-size: 24px; font-weight: bold; color: #b0773f; text-transform: uppercase; letter-spacing: 2px; }
                .meta { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 14px; }
                .content { display: flex; gap: 40px; }
                .image { width: 40%; }
                .image img { width: 100%; border: 1px solid #eee; border-radius: 8px; }
                .details { flex: 1; }
                .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #888; margin-bottom: 4px; }
                .value { font-size: 16px; margin-bottom: 20px; font-weight: 500; }
                .specs { background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee; }
                .footer { margin-top: 60px; font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                @media print { body { padding: 20px; } button { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">Sanghavi Jewel Studio</div>
                <div>Bespoke Order Worksheet</div>
            </div>
            <div class="meta">
                <div>
                    <div class="label">Customer</div>
                    <div class="value">${customer}</div>
                </div>
                <div>
                    <div class="label">Order Ref</div>
                    <div class="value">#${item.product.id.slice(-6).toUpperCase()}</div>
                </div>
                <div>
                    <div class="label">Due Date</div>
                    <div class="value">${date}</div>
                </div>
            </div>
            <div class="content">
                <div class="image">
                    <img src="${item.product.images[0]}" />
                </div>
                <div class="details">
                    <div class="label">Base Design</div>
                    <div class="value">${item.product.title}</div>
                    
                    <div class="label">Category</div>
                    <div class="value">${item.product.category} / ${item.product.subCategory}</div>

                    <div class="label">Approx Weight</div>
                    <div class="value">${item.product.weight}g</div>

                    <div class="specs">
                        <div class="label">Custom Requirements</div>
                        <p>${specs.replace(/\n/g, '<br/>')}</p>
                    </div>
                </div>
            </div>
            <div class="footer">Generated on ${new Date().toLocaleString()} • Sanghavi Admin System</div>
            <script>window.print();</script>
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
  };

  // --- Order Global Actions ---
  const updateOrderStatus = async (orderId: string, status: OrderStatus, details?: DeliveryDetails) => {
      setDispatchLoading(true);
      try {
          await storeService.updateOrderStatus(orderId, status, details);
          await refreshData(true); 
          setShowDispatchModal(false);
          setIsOrderDetailOpen(false); // Return to list view on complete dispatch
      } catch (e) {
          alert('Failed to update order status');
      } finally {
          setDispatchLoading(false);
      }
  };

  const getStatusColor = (status: OrderStatus | ItemStatus | undefined) => {
      switch(status) {
          case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
          case 'dispatched': return 'bg-green-100 text-green-800 border-green-200';
          case 'delivered': return 'bg-teal-100 text-teal-800 border-teal-200';
          case 'cancelled': 
          case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
          case 'moved': return 'bg-purple-100 text-purple-800 border-purple-200';
          default: return 'bg-stone-100 text-stone-800';
      }
  };

  if (loading && products.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-gold-500 mb-4" size={32} />
        <p className="text-stone-400 text-xs uppercase tracking-widest">Connecting to Vault...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 md:pt-24 pb-24 min-h-screen flex flex-col">
      <header className="flex-none mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex justify-between items-start w-full md:w-auto">
           <div>
              <h2 className="font-serif text-3xl text-stone-900">Vault Administration</h2>
              <div className="flex items-center gap-2 mt-1">
                 <div className={`w-2 h-2 rounded-full ${healthInfo.healthy ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                 <p className="text-stone-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                    {healthInfo.healthy ? 'Live SQL Synchronized' : 'DB Disconnected - Retrying...'}
                    {isSyncing && <RefreshCw size={10} className="animate-spin text-gold-500" />}
                 </p>
                 {!healthInfo.healthy && (
                     <button onClick={() => refreshData()} className="ml-2 text-[10px] text-red-500 hover:text-red-700 font-bold underline flex items-center gap-1">
                         <RefreshCw size={10} /> Force Reconnect
                     </button>
                 )}
              </div>
           </div>
        </div>
        
        <div className="flex bg-stone-100 p-1 rounded-xl items-center overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
              { id: 'orders', icon: Package, label: 'Orders' },
              { id: 'files', icon: FolderOpen, label: 'Assets' },
              { id: 'leads', icon: UserCheck, label: 'Leads' },
              { id: 'trends', icon: TrendingUp, label: 'Trends' },
              { id: 'intelligence', icon: BrainCircuit, label: 'AI Intel' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveView(tab.id as ViewMode); setIsOrderDetailOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeView === tab.id ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
              >
                  <tab.icon size={16} /> {tab.label}
              </button>
            ))}
            <button onClick={() => onNavigate?.('settings')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-700 transition-all whitespace-nowrap">
                <Settings size={16} /> Settings
            </button>
        </div>
      </header>

      {!healthInfo.healthy && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertTriangle size={20} />
              <div>
                  <p className="font-bold text-sm">Connection Lost</p>
                  <p className="text-xs">The application cannot reach the MySQL database. We are attempting to reconnect automatically. If this persists, please check your network or server logs.</p>
              </div>
          </div>
      )}

      {/* OVERVIEW */}
      {activeView === 'overview' && (
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package size={24} /></div>
                    <div><p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Active Orders</p><p className="text-2xl font-bold text-stone-800">{orders.filter(o => o.status !== 'cancelled').length}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><HardDrive size={24} /></div>
                    <div><p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Inventory</p><p className="text-2xl font-bold text-stone-800">{products.length}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl"><UserCheck size={24} /></div>
                    <div><p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Leads</p><p className="text-2xl font-bold text-stone-800">{customers.length}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
                    <div className="p-3 bg-gold-50 text-gold-600 rounded-xl"><TrendingUp size={24} /></div>
                    <div><p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Inquiries</p><p className="text-2xl font-bold text-stone-800">{recentInquiries.length}</p></div>
                </div>
            </div>
          </div>
      )}

      {/* ORDERS VIEW */}
      {activeView === 'orders' && (
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
              {isOrderDetailOpen && selectedOrder ? (
                  // ORDER DETAIL VIEW
                  <div className="flex flex-col h-full">
                      <div className="p-6 bg-stone-50 border-b border-stone-200 flex justify-between items-start">
                          <div>
                              <button onClick={() => setIsOrderDetailOpen(false)} className="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-2 text-xs font-bold uppercase tracking-widest">
                                  <ArrowLeft size={16} /> Back to List
                              </button>
                              <h3 className="font-serif text-2xl text-stone-800 font-bold flex items-center gap-3">
                                  Order #{selectedOrder.id.slice(0,8).toUpperCase()}
                                  <span className={`px-3 py-1 rounded-full text-xs border font-sans ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                              </h3>
                              <p className="text-stone-500 text-sm mt-1">{selectedOrder.customerName} • +{selectedOrder.customerPhone} • {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                          </div>
                          
                          <div className="flex gap-2">
                              {selectedOrder.status !== 'dispatched' && selectedOrder.status !== 'delivered' && (
                                  <button onClick={() => setShowDispatchModal(true)} className="bg-stone-900 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gold-600 transition shadow-lg">
                                      <Truck size={18} /> Dispatch Order
                                  </button>
                              )}
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6">
                          <div className="grid grid-cols-1 gap-4">
                              {selectedOrder.items.map((item, idx) => (
                                  <div key={idx} className="flex gap-4 p-4 border border-stone-100 rounded-xl hover:shadow-md transition-shadow bg-white">
                                      <div className="w-24 h-24 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                                          <img src={item.product.thumbnails[0] || item.product.images[0]} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-start">
                                              <div>
                                                  <h4 className="font-bold text-stone-800 text-lg">{item.product.title}</h4>
                                                  <p className="text-xs text-stone-500 font-mono">#{item.product.id.slice(-6).toUpperCase()}</p>
                                              </div>
                                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(item.status || 'pending')}`}>
                                                  {item.status || 'Pending'}
                                              </span>
                                          </div>
                                          
                                          <div className="flex gap-6 mt-2 text-sm text-stone-600">
                                              <span>Qty: <b>{item.quantity}</b></span>
                                              <span>Weight: <b>{item.product.weight}g</b></span>
                                              {item.notes && <span className="bg-yellow-50 px-2 rounded text-yellow-700 border border-yellow-100">Note: {item.notes}</span>}
                                          </div>

                                          {item.rejectionReason && (
                                              <p className="mt-2 text-xs text-red-500 font-bold bg-red-50 p-2 rounded">Reason: {item.rejectionReason}</p>
                                          )}
                                      </div>

                                      <div className="flex flex-col gap-2 justify-center border-l border-stone-100 pl-4">
                                          {(!item.status || item.status === 'pending') && (
                                              <>
                                                  <button onClick={() => handleConfirmItem(item)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition" title="Confirm Item">
                                                      <CheckCircle size={20} />
                                                  </button>
                                                  <button onClick={() => setItemToDiscard(item)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Discard/Reject">
                                                      <X size={20} />
                                                  </button>
                                              </>
                                          )}
                                          {item.status === 'moved' && (
                                              <button onClick={() => {}} className="p-2 bg-purple-50 text-purple-600 rounded-lg" title="Moved to Custom Order" disabled>
                                                  <FileText size={20} />
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              ) : (
                  // ORDER LIST VIEW
                  <>
                    <div className="p-6 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-serif text-2xl text-stone-800 flex items-center gap-2"><Package className="text-gold-600" /> Order Management</h3>
                            <p className="text-stone-500 text-sm mt-1">Track, confirm, and dispatch B2B orders.</p>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold tracking-[0.2em] border-b border-stone-200">
                                <tr>
                                    <th className="p-4">ID & Date</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Summary</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => { setSelectedOrder(order); setIsOrderDetailOpen(true); }}>
                                        <td className="p-4">
                                            <p className="font-mono font-bold text-stone-700">#{order.id.slice(0,6)}</p>
                                            <p className="text-xs text-stone-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-stone-800">{order.customerName}</p>
                                            <p className="text-xs text-stone-500">{order.customerPhone}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-stone-800 font-medium">{order.totalItems} Items</p>
                                            <p className="text-xs text-stone-500">{order.totalWeight}g Total</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-gold-600 font-bold text-xs uppercase tracking-wider hover:underline">View Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </>
              )}
          </div>
      )}

      {/* LEADS VIEW - kept as is */}
      {activeView === 'leads' && (
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
              <div className="p-6 bg-stone-50 border-b border-stone-200">
                  <h3 className="font-serif text-2xl text-stone-800 flex items-center gap-2"><UserCheck className="text-gold-600" /> B2B Access Control</h3>
                  <p className="text-stone-500 text-sm mt-1">Manage catalog access duration and verify new accounts.</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold tracking-[0.2em] border-b border-stone-200">
                          <tr>
                              <th className="p-6">Profile</th>
                              <th className="p-6">Contact</th>
                              <th className="p-6">Access Status</th>
                              <th className="p-6 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                          {customers.map(customer => {
                              const isExpired = customer.accessExpiresAt && new Date(customer.accessExpiresAt) < new Date();
                              return (
                                  <tr key={customer.id} className="hover:bg-gold-50/20">
                                      <td className="p-6 flex items-center gap-4">
                                          <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center font-bold text-gold-700 text-lg">{customer.name.charAt(0)}</div>
                                          <div>
                                              <p className="font-bold text-stone-800">{customer.name}</p>
                                              <p className="text-xs text-stone-400">{customer.pincode || 'No Location'}</p>
                                          </div>
                                      </td>
                                      <td className="p-6 font-mono text-stone-600">+{customer.phone}</td>
                                      <td className="p-6">
                                          {!customer.isVerified ? (
                                              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-yellow-200">Pending</span>
                                          ) : isExpired ? (
                                              <div className="flex flex-col gap-1">
                                                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-red-200 w-fit">Expired</span>
                                                  <span className="text-[10px] text-stone-400">Ended {new Date(customer.accessExpiresAt!).toLocaleDateString()}</span>
                                              </div>
                                          ) : (
                                              <div className="flex flex-col gap-1">
                                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-green-200 w-fit">Active</span>
                                                  <span className="text-[10px] text-stone-400">Valid until {new Date(customer.accessExpiresAt!).toLocaleDateString()}</span>
                                              </div>
                                          )}
                                      </td>
                                      <td className="p-6 text-right flex gap-2 justify-end">
                                          <button onClick={() => openCustomerEdit(customer)} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition" title="Edit Profile">
                                              <Edit2 size={16} />
                                          </button>
                                          <button onClick={() => storeService.chatWithLead(customer)} className="text-stone-400 hover:text-green-600 p-2 rounded-full hover:bg-green-50 transition" title="Chat on WhatsApp">
                                              <MessageCircle size={18} />
                                          </button>
                                          <button 
                                              onClick={() => { setSelectedCustomer(customer); setShowAccessModal(true); }} 
                                              className="bg-stone-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gold-600 transition flex items-center gap-2"
                                          >
                                              <ShieldCheck size={14} /> {customer.isVerified ? 'Renew' : 'Approve'}
                                          </button>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Discard Item Modal */}
      {itemToDiscard && (
          <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 bg-red-50 border-b border-red-100">
                      <h3 className="font-serif text-xl font-bold text-red-800">Reject Item</h3>
                      <p className="text-xs text-red-500 mt-1">Select reason for discarding this item.</p>
                  </div>
                  <div className="p-6 space-y-4">
                      {['Not Available', 'Order Specifications Rejected', 'Placed Order as per Requirement'].map(reason => (
                          <label key={reason} className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition">
                              <input 
                                  type="radio" 
                                  name="discardReason" 
                                  checked={discardReason === reason} 
                                  onChange={() => setDiscardReason(reason)}
                                  className="accent-red-600 w-4 h-4"
                              />
                              <span className="text-sm font-medium text-stone-700">{reason}</span>
                          </label>
                      ))}

                      {discardReason === 'Placed Order as per Requirement' && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 pt-2">
                              <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Custom Specs</label>
                                  <textarea 
                                      value={customOrderSpecs} 
                                      onChange={e => setCustomOrderSpecs(e.target.value)}
                                      className="w-full p-2 border border-stone-200 rounded-lg text-sm h-20"
                                      placeholder="Enter requirements..."
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Delivery Date</label>
                                  <input 
                                      type="date"
                                      value={customOrderDate}
                                      onChange={e => setCustomOrderDate(e.target.value)}
                                      className="w-full p-2 border border-stone-200 rounded-lg text-sm"
                                  />
                              </div>
                              <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 flex items-center gap-2">
                                  <Printer size={16} /> 
                                  <span>Job Sheet PDF will generate automatically.</span>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-stone-100 flex gap-3 justify-end">
                      <button onClick={() => setItemToDiscard(null)} className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg text-sm font-bold">Cancel</button>
                      <button 
                          onClick={handleDiscardItem}
                          disabled={!discardReason || (discardReason === 'Placed Order as per Requirement' && (!customOrderSpecs || !customOrderDate))} 
                          className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition disabled:opacity-50"
                      >
                          Confirm Rejection
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Edit Customer Profile Modal - kept as is */}
      {showEditCustomerModal && selectedCustomer && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                      <h3 className="font-serif text-xl font-bold text-stone-800">Edit Customer Profile</h3>
                      <button onClick={() => setShowEditCustomerModal(false)}><X size={20} className="text-stone-400" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Full Name</label>
                          <input 
                              value={editCustomerData.name || ''} 
                              onChange={e => setEditCustomerData({...editCustomerData, name: e.target.value})}
                              className="w-full p-3 border border-stone-200 rounded-xl text-sm"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase mb-1">WhatsApp Number</label>
                          <input 
                              value={editCustomerData.phone || ''} 
                              onChange={e => setEditCustomerData({...editCustomerData, phone: e.target.value})}
                              className="w-full p-3 border border-stone-200 rounded-xl text-sm font-mono"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Pincode</label>
                              <input 
                                  value={editCustomerData.pincode || ''} 
                                  onChange={e => setEditCustomerData({...editCustomerData, pincode: e.target.value})}
                                  className="w-full p-3 border border-stone-200 rounded-xl text-sm"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Full Address</label>
                          <textarea 
                              value={editCustomerData.address || ''} 
                              onChange={e => setEditCustomerData({...editCustomerData, address: e.target.value})}
                              className="w-full p-3 border border-stone-200 rounded-xl text-sm h-24"
                              placeholder="Street, City, State..."
                          />
                      </div>
                  </div>
                  <div className="p-4 border-t border-stone-100 flex gap-3 justify-end">
                      <button onClick={() => setShowEditCustomerModal(false)} className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg text-sm font-bold">Cancel</button>
                      <button onClick={handleSaveCustomerEdit} className="px-6 py-2 bg-stone-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gold-600 transition">
                          <Save size={16} /> Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Grant Access Modal - kept as is */}
      {showAccessModal && selectedCustomer && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 bg-stone-50 border-b border-stone-100">
                      <h3 className="font-serif text-xl font-bold text-stone-800">Grant Catalog Access</h3>
                      <p className="text-xs text-stone-500 mt-1">For: {selectedCustomer.name}</p>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Access Duration</label>
                          <div className="grid grid-cols-3 gap-2">
                              {[3, 7, 14, 30, 60, 90].map(days => (
                                  <button 
                                    key={days} 
                                    onClick={() => setAccessDuration(days)}
                                    className={`py-2 rounded-lg text-xs font-bold transition-all ${accessDuration === days ? 'bg-gold-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                                  >
                                      {days} Days
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                          <Clock size={16} className="shrink-0 mt-0.5" />
                          <p>User will have full access to browse and order. After expiry, they can only view previously purchased items.</p>
                      </div>
                  </div>
                  <div className="p-4 border-t border-stone-100 flex gap-3 justify-end">
                      <button onClick={() => setShowAccessModal(false)} className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg text-sm font-bold">Cancel</button>
                      <button onClick={handleGrantAccess} className="px-6 py-2 bg-stone-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gold-600 transition">
                          <Key size={16} /> Grant Access
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* DISPATCH MODAL */}
      {showDispatchModal && selectedOrder && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 bg-stone-50 border-b border-stone-100">
                      <h3 className="font-serif text-xl font-bold text-stone-800">Dispatch Order</h3>
                      <p className="text-xs text-stone-500 mt-1">Order #{selectedOrder.id.slice(0,8)}</p>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Delivery Mode</label>
                          <select 
                             value={dispatchDetails.mode} 
                             onChange={e => setDispatchDetails({...dispatchDetails, mode: e.target.value as any})}
                             className="w-full p-3 border border-stone-200 rounded-xl text-sm"
                          >
                              <option value="logistics">Courier / Logistics</option>
                              <option value="hand_to_hand">Hand-to-Hand Delivery</option>
                              <option value="vpp">VPP (Value Payable Post)</option>
                          </select>
                      </div>

                      {dispatchDetails.mode === 'logistics' && (
                          <>
                            <div>
                                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Courier Service</label>
                                <input 
                                    value={dispatchDetails.courierName || ''}
                                    onChange={e => setDispatchDetails({...dispatchDetails, courierName: e.target.value})}
                                    placeholder="e.g. BlueDart, BVC"
                                    className="w-full p-3 border border-stone-200 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Tracking Number / AWB</label>
                                <input 
                                    value={dispatchDetails.trackingNumber || ''}
                                    onChange={e => setDispatchDetails({...dispatchDetails, trackingNumber: e.target.value})}
                                    placeholder="Tracking ID"
                                    className="w-full p-3 border border-stone-200 rounded-xl text-sm font-mono"
                                />
                            </div>
                          </>
                      )}
                      
                      <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Internal Notes</label>
                          <textarea 
                             value={dispatchDetails.notes || ''}
                             onChange={e => setDispatchDetails({...dispatchDetails, notes: e.target.value})}
                             placeholder="Any remarks regarding packaging or insurance..."
                             className="w-full p-3 border border-stone-200 rounded-xl text-sm h-20"
                          />
                      </div>
                  </div>
                  <div className="p-4 border-t border-stone-100 flex gap-3 justify-end">
                      <button onClick={() => setShowDispatchModal(false)} className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg text-sm font-bold">Cancel</button>
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.id, 'dispatched', dispatchDetails)}
                        disabled={dispatchLoading}
                        className="px-6 py-2 bg-stone-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gold-600 transition"
                      >
                          {dispatchLoading ? <Loader2 className="animate-spin" size={16}/> : <Truck size={16}/>} Mark Dispatched
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
