import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Share2, Plus, ChevronLeft, ChevronRight, Maximize2, Heart, ShoppingBag, Eye } from 'lucide-react';
import { storeService } from '../services/storeService';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isAdmin, onClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const isGuest = !storeService.getCurrentUser();
  const { addToCart } = useCart();

  useEffect(() => {
    const likes = storeService.getLikes();
    setIsLiked(likes.includes(product.id));
  }, [product.id]);

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(10);
    const liked = storeService.toggleLike(product.id);
    setIsLiked(liked);
    if (liked) storeService.logEvent('like', product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const displayImage = getImageUrl(product.thumbnails[currentImageIndex] || product.images[0]);

  return (
    <div 
        className="bg-white rounded-lg overflow-hidden shadow-sm border border-stone-200 group flex flex-col h-full cursor-pointer select-none hover:shadow-md hover:border-gold-300 transition-all duration-300 transform" 
        onClick={() => { if(navigator.vibrate) navigator.vibrate(5); onClick?.(); }}
    >
      <div className="relative aspect-square overflow-hidden bg-stone-100 border-b border-stone-100">
        <img 
            src={displayImage} 
            alt={product.title} 
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105" 
            loading="lazy" 
        />
        
        {/* CRITICAL: High-priority tap overlay to ensure 'button not working' is fixed */}
        <div className="absolute inset-0 z-10 bg-transparent active:bg-black/5 transition-colors duration-100" />

        <div className="absolute top-2 left-2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
             <button onClick={handleToggleLike} className={`p-1.5 rounded-md backdrop-blur shadow-sm border border-black/5 ${isLiked ? 'bg-red-50 text-red-600' : 'bg-white/90 text-stone-500 hover:text-stone-900'}`}>
                <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
            </button>
        </div>

        {isGuest && product.images.length > 1 && (
             <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-stone-900/90 backdrop-blur rounded text-[8px] font-bold text-white uppercase tracking-wider pointer-events-none z-20 shadow-sm border border-white/10">
                 +{product.images.length - 1} Locked
             </div>
        )}
      </div>
      
      <div className="p-3 flex flex-col flex-grow relative z-20">
        <div className="mb-2">
            <h3 className="font-sans font-semibold text-sm text-stone-900 leading-snug truncate">{product.title}</h3>
            <p className="text-[10px] text-stone-500 font-medium">{product.id.slice(-6).toUpperCase()}</p>
        </div>
        
        <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 mb-3 border-t border-dashed border-stone-200 pt-2">
          <span>{product.category}</span>
          <span className="font-bold text-stone-900">{product.weight}g</span>
        </div>
        
        <div className="flex gap-2 mt-auto">
          <button onClick={handleAddToCart} className="flex-1 bg-stone-900 text-white text-[10px] py-2 rounded-md hover:bg-gold-600 transition-colors flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider shadow-sm">
            <ShoppingBag size={12} /> Add
          </button>
          <button onClick={(e) => { e.stopPropagation(); navigator.share?.({ title: product.title, url: window.location.href }); }} className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-50 border border-stone-200 rounded-md transition-colors">
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};