import { Link } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useState } from 'react';
import { CartDrawer } from './CartDrawer';

export function Navbar() {
  const totalItems = useCartStore((state) => state.totalItems());
  const { user, profile } = useAuthStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-black/5">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex items-center justify-between h-[50px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bold text-[18px] tracking-[-0.5px] text-primary uppercase">SnapCase</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-[30px]">
              <Link to="/" className="text-[12px] font-medium text-text-main opacity-80 hover:opacity-100 transition-opacity">Home</Link>
              <Link to="/products" className="text-[12px] font-medium text-text-main opacity-80 hover:opacity-100 transition-opacity">Products</Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-[20px]">
              <button className="w-8 h-8 rounded-full bg-[#eee] flex items-center justify-center text-text-main hover:bg-gray-200 transition-colors hidden sm:flex">
                <Search className="w-4 h-4" />
              </button>
              
              {user ? (
                <Link to={profile?.role === 'admin' ? '/admin' : '/dashboard'} className="w-8 h-8 rounded-full bg-[#eee] flex items-center justify-center text-text-main hover:bg-gray-200 transition-colors">
                  <User className="w-4 h-4" />
                </Link>
              ) : (
                <Link to="/login" className="hidden sm:flex items-center justify-center px-4 h-8 rounded-full bg-primary text-white text-[12px] font-medium hover:bg-primary-hover transition-colors">
                  Sign In
                </Link>
              )}
              
              {!user && (
                <Link to="/login" className="w-8 h-8 rounded-full bg-[#eee] flex items-center justify-center text-text-main hover:bg-gray-200 transition-colors sm:hidden">
                  <User className="w-4 h-4" />
                </Link>
              )}
              
              <button 
                onClick={() => setIsCartOpen(true)}
                className="w-8 h-8 rounded-full bg-[#eee] flex items-center justify-center text-text-main hover:bg-gray-200 transition-colors relative"
              >
                <ShoppingBag className="w-4 h-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              <button className="w-8 h-8 rounded-full bg-[#eee] flex items-center justify-center text-text-main hover:bg-gray-200 transition-colors md:hidden">
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
