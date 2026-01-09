
import React, { useEffect, useState } from 'react';
import { storeService } from '../services/storeService';
import { User, Order, OrderStatus, ItemStatus } from '../types';
import { 
    User as UserIcon, Phone, MapPin, Lock, Save, Edit2, 
    Package, Loader2, Clock, CheckCircle, XCircle, 
    ArrowRight, Box, AlertTriangle, Truck, History
} from 'lucide-react';

export const CustomerProfile: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [addressForm, setAddressForm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const currentUser = storeService.getCurrentUser();
            if (!currentUser) return;

            // Refresh user profile from server to get latest address
            if (currentUser.phone) {
                const refreshedUser = await storeService.refreshUserProfile(currentUser.phone);
                if (refreshedUser) {
                    setUser(refreshedUser);
                    setAddressForm(refreshedUser.address || '');
                } else {
                    setUser(currentUser);
                    setAddressForm(currentUser.address || '');
                }
            }

            // Fetch user specific orders
            const userOrders = await storeService.getOrders(currentUser.id);
            setOrders(userOrders);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const handleSaveAddress = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await storeService.updateCustomerProfile(user.id, { address: addressForm });
            setUser(prev => prev ? ({ ...prev, address: addressForm }) : null);
            setIsEditingAddress(false);
        } catch (e) {
            alert("Failed to update address.");
        } finally {
            setIsSaving(false);
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
                <Loader2 className="animate-spin text-gold-600 mb-4" size={32} />
                <p className="text-stone-400 text-xs uppercase tracking-widest font-bold">Loading Profile...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-stone-50 pb-24 md:pt-20 animate-in fade-in slide-in-from-bottom-4">
            <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-serif text-2xl md:text-3xl text-stone-900 font-bold">My Account</h1>
                        <p className="text-stone-500 text-sm mt-1">Manage your details and track orders.</p>
                    </div>
                    <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center text-gold-700 font-serif font-bold text-xl shadow-sm border border-gold-200">
                        {user.name.charAt(0)}
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <UserIcon size={120} />
                    </div>
                    
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Lock size={14} /> Personal Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Full Name</label>
                                <div className="flex items-center gap-2 text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
                                    <UserIcon size={16} />
                                    <span className="font-medium">{user.name}</span>
                                    <Lock size={12} className="ml-auto text-stone-300" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Mobile / WhatsApp</label>
                                <div className="flex items-center gap-2 text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
                                    <Phone size={16} />
                                    <span className="font-mono">{user.phone}</span>
                                    <Lock size={12} className="ml-auto text-stone-300" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Postal Code</label>
                                <div className="flex items-center gap-2 text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
                                    <MapPin size={16} />
                                    <span className="font-mono">{user.pincode}</span>
                                    <Lock size={12} className="ml-auto text-stone-300" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-bold text-stone-400 uppercase">Billing & Shipping Address</label>
                                {!isEditingAddress && (
                                    <button onClick={() => setIsEditingAddress(true)} className="text-gold-600 text-xs font-bold hover:underline flex items-center gap-1">
                                        <Edit2 size={12} /> Edit
                                    </button>
                                )}
                            </div>
                            {isEditingAddress ? (
                                <div className="animate-in fade-in">
                                    <textarea 
                                        value={addressForm}
                                        onChange={(e) => setAddressForm(e.target.value)}
                                        className="w-full h-32 p-3 text-sm border border-gold-300 rounded-xl focus:ring-2 focus:ring-gold-200 outline-none resize-none bg-white"
                                        placeholder="Enter your full address..."
                                    />
                                    <div className="flex gap-2 mt-3 justify-end">
                                        <button 
                                            onClick={() => { setIsEditingAddress(false); setAddressForm(user.address || ''); }}
                                            className="px-4 py-2 text-xs font-bold text-stone-500 hover:bg-stone-100 rounded-lg transition"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSaveAddress}
                                            disabled={isSaving}
                                            className="px-6 py-2 bg-stone-900 text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-gold-600 transition disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save Address
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-32 p-4 text-sm text-stone-600 bg-stone-50 rounded-xl border border-stone-100 overflow-y-auto leading-relaxed">
                                    {user.address ? user.address : <span className="text-stone-400 italic">No address provided yet.</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order History */}
                <div>
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <History size={16} /> Order History
                    </h3>
                    
                    {orders.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 border-dashed">
                            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                                <Package size={32} />
                            </div>
                            <p className="text-stone-500 font-medium">No orders placed yet.</p>
                            <p className="text-xs text-stone-400 mt-1">Visit the catalog to start your collection.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {orders.map(order => (
                                <div 
                                    key={order.id} 
                                    onClick={() => setSelectedOrder(order)}
                                    className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${getStatusColor(order.status).replace('bg-', 'bg-opacity-20 border-')}`}>
                                            <Package size={20} className="opacity-70" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-stone-800 text-sm">Order #{order.id.slice(0,6).toUpperCase()}</h4>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                <Clock size={10} className="inline mr-1" />
                                                {new Date(order.createdAt).toLocaleDateString()} • {order.totalItems} Items • {order.totalWeight}g
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-stone-300 group-hover:text-gold-500 transition-colors">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in zoom-in-95">
                        <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50 rounded-t-2xl">
                            <div>
                                <h3 className="font-serif text-xl font-bold text-stone-800">Order Details</h3>
                                <p className="text-xs text-stone-500">#{selectedOrder.id.slice(0,8).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-stone-200 rounded-full transition text-stone-500">
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Delivery Info */}
                            {selectedOrder.status === 'dispatched' || selectedOrder.status === 'delivered' ? (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
                                    <Truck className="text-green-600 mt-0.5" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-green-800">Dispatch Details</p>
                                        <p className="text-xs text-green-700 mt-1">
                                            Via: <span className="font-bold">{selectedOrder.deliveryDetails?.mode.toUpperCase()}</span>
                                            {selectedOrder.deliveryDetails?.trackingNumber && ` • Tracking: ${selectedOrder.deliveryDetails.trackingNumber}`}
                                        </p>
                                        {selectedOrder.deliveryDetails?.notes && (
                                            <p className="text-xs text-green-600 mt-1 italic">"{selectedOrder.deliveryDetails.notes}"</p>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            <div className="space-y-3">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-3 border border-stone-100 rounded-xl bg-white">
                                        <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-100">
                                            <img src={item.product.thumbnails[0] || item.product.images[0]} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-stone-800 text-sm truncate">{item.product.title}</h4>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(item.status || 'pending')}`}>
                                                    {item.status || 'Pending'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500 mt-1">Qty: {item.quantity} • {item.product.weight}g</p>
                                            
                                            {item.rejectionReason && (
                                                <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex items-start gap-1">
                                                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                                    <span>{item.rejectionReason}</span>
                                                </div>
                                            )}
                                            
                                            {item.status === 'moved' && (
                                                <div className="mt-2 text-xs text-purple-600 italic">
                                                    Moved to Custom Order list for bespoke processing.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 border-t border-stone-100 bg-stone-50 rounded-b-2xl">
                            <div className="flex justify-between items-center text-sm font-bold text-stone-800">
                                <span>Total Weight</span>
                                <span>{selectedOrder.totalWeight}g</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
