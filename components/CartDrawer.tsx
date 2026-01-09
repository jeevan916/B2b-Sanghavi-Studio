
import React from 'react';
import { useCart } from '../contexts/CartContext';
import { X, Trash2, Send, Minus, Plus, ShoppingBag } from 'lucide-react';
import { storeService } from '../services/storeService';

export const CartDrawer: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, updateNotes, submitOrder, isCartOpen, setIsCartOpen, totalItems, totalWeight } = useCart();
  const user = storeService.getCurrentUser();

  if (!isCartOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={handleBackdropClick}>
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-stone-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 bg-white border-b border-stone-200 flex justify-between items-center shadow-sm z-10">
            <div>
                <h2 className="font-serif text-xl font-bold text-stone-800 flex items-center gap-2">
                    <ShoppingBag size={20} className="text-gold-600" /> B2B Purchase Order
                </h2>
                <p className="text-xs text-stone-500 mt-1">Client: {user?.name || 'Guest'}</p>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="p-2 text-stone-400 hover:text-stone-800 bg-stone-100 rounded-full transition">
                <X size={20} />
            </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                    <ShoppingBag size={48} className="opacity-20" />
                    <p className="font-medium text-sm">Your order list is empty.</p>
                    <button onClick={() => setIsCartOpen(false)} className="text-gold-600 text-xs font-bold uppercase tracking-widest hover:underline">
                        Browse Catalog
                    </button>
                </div>
            ) : (
                cart.map((item) => (
                    <div key={item.product.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex gap-3">
                        <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                            <img src={item.product.thumbnails[0] || item.product.images[0]} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-stone-800 text-sm truncate pr-2">{item.product.title}</h4>
                                    <button onClick={() => removeFromCart(item.product.id)} className="text-stone-300 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-stone-500 uppercase tracking-wide font-medium">{item.product.category} • {item.product.weight}g</p>
                            </div>
                            
                            <div className="flex justify-between items-end mt-2">
                                <div className="flex items-center bg-stone-100 rounded-lg border border-stone-200">
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 text-stone-500 hover:bg-white rounded-l-lg transition"><Minus size={14}/></button>
                                    <span className="w-8 text-center text-xs font-bold text-stone-800">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 text-stone-500 hover:bg-white rounded-r-lg transition"><Plus size={14}/></button>
                                </div>
                                <p className="text-xs font-bold text-gold-600">{(item.product.weight * item.quantity).toFixed(2)}g</p>
                            </div>
                        </div>
                        <div className="w-full mt-2 pt-2 border-t border-stone-100">
                             <input 
                                type="text" 
                                placeholder="Notes (Size, Color, etc.)" 
                                value={item.notes || ''}
                                onChange={(e) => updateNotes(item.product.id, e.target.value)}
                                className="w-full text-xs bg-stone-50 p-2 rounded border border-stone-100 focus:border-gold-300 outline-none"
                             />
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
            <div className="p-5 bg-white border-t border-stone-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
                <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="text-stone-500">Total Items: <strong className="text-stone-800">{totalItems}</strong></span>
                    <span className="text-stone-500">Est. Weight: <strong className="text-stone-800">{totalWeight.toFixed(2)}g</strong></span>
                </div>
                <button 
                    onClick={submitOrder}
                    className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-gold-600 transition-all shadow-lg active:scale-[0.98]"
                >
                    <Send size={16} /> Submit Order to Admin
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
