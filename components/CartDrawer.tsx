import React from 'react';
import { useCart } from '../contexts/CartContext';
import { X, Trash2, Send, Minus, Plus, ShoppingBag, FileText, Package } from 'lucide-react';
import { storeService } from '../services/storeService';

export const CartDrawer: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, updateNotes, submitOrder, isCartOpen, setIsCartOpen, totalItems, totalWeight } = useCart();
  const user = storeService.getCurrentUser();

  if (!isCartOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleBackdropClick}>
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-stone-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-stone-200">
        
        {/* Enterprise Header */}
        <div className="p-5 bg-white border-b border-stone-200 flex justify-between items-center z-10">
            <div>
                <h2 className="font-sans text-lg font-bold text-stone-900 flex items-center gap-2">
                    <FileText size={18} className="text-gold-600" /> Purchase Order
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500 uppercase font-bold tracking-wider">Draft</span>
                    <span className="text-xs text-stone-400">• {user?.name || 'Guest User'}</span>
                </div>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-md transition">
                <X size={20} />
            </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/50">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                    <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center">
                        <ShoppingBag size={24} className="text-stone-400" />
                    </div>
                    <p className="font-medium text-sm">Order queue is empty.</p>
                    <button onClick={() => setIsCartOpen(false)} className="text-gold-600 text-xs font-bold uppercase tracking-widest hover:underline">
                        Return to Catalog
                    </button>
                </div>
            ) : (
                cart.map((item) => (
                    <div key={item.product.id} className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm hover:border-gold-300 transition-colors group">
                        <div className="flex gap-3">
                            <div className="w-16 h-16 bg-stone-100 rounded-md overflow-hidden shrink-0 border border-stone-100">
                                <img src={item.product.thumbnails[0] || item.product.images[0]} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-semibold text-stone-900 text-sm truncate">{item.product.title}</h4>
                                    <button onClick={() => removeFromCart(item.product.id)} className="text-stone-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className="text-[10px] font-mono text-stone-500">ID: {item.product.id.slice(-6)}</p>
                                    <p className="text-xs font-bold text-stone-900">{(item.product.weight * item.quantity).toFixed(2)}g</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-100">
                             <div className="flex items-center h-8 bg-stone-50 rounded border border-stone-200">
                                <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-full flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:text-stone-900 border-r border-stone-200"><Minus size={12}/></button>
                                <span className="w-8 text-center text-xs font-bold text-stone-900">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-full flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:text-stone-900 border-l border-stone-200"><Plus size={12}/></button>
                             </div>
                             <input 
                                type="text" 
                                placeholder="Add notes (Size, Polish...)" 
                                value={item.notes || ''}
                                onChange={(e) => updateNotes(item.product.id, e.target.value)}
                                className="flex-1 h-8 text-xs bg-stone-50 px-3 rounded border border-stone-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 outline-none transition-all"
                             />
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Enterprise Footer */}
        {cart.length > 0 && (
            <div className="bg-white border-t border-stone-200 z-10">
                <div className="p-4 bg-stone-50/50 border-b border-stone-100">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-stone-500 font-medium uppercase tracking-wide">Total Units</span>
                        <strong className="text-sm text-stone-900 font-bold">{totalItems}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-stone-500 font-medium uppercase tracking-wide">Gross Weight</span>
                        <strong className="text-lg text-gold-600 font-bold">{totalWeight.toFixed(2)}g</strong>
                    </div>
                </div>
                <div className="p-4">
                    <button 
                        onClick={submitOrder}
                        className="w-full py-3.5 bg-stone-900 text-white rounded-lg font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-gold-600 transition-all shadow-md active:scale-[0.98]"
                    >
                        <Send size={16} /> Submit Order Request
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};