import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { Button } from './Button';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[400px] bg-surface shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Your Cart
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-muted space-y-4">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p>Your cart is empty.</p>
              <Button variant="outline" onClick={onClose}>Continue Shopping</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                      <button 
                        onClick={() => removeItem(item.productId)}
                        className="text-text-muted hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="font-semibold">${item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1 border border-gray-100">
                        <button 
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-full transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-full transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex justify-between mb-4">
              <span className="text-text-muted">Subtotal</span>
              <span className="font-semibold">${totalPrice().toFixed(2)}</span>
            </div>
            <Button className="w-full" size="lg" onClick={handleCheckout}>
              Checkout
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
