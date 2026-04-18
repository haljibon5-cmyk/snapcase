import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-gray-200/50 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
                S
              </div>
              <span className="font-semibold text-xl tracking-tight">SnapCase</span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed">
              Premium phone case designs. Experience quality, protection, and elegance in every detail.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Shop</h3>
            <ul className="space-y-3 text-sm text-text-muted">
              <li><Link to="/products" className="hover:text-primary transition-colors">All Cases</Link></li>
              <li><Link to="/categories/silicone" className="hover:text-primary transition-colors">Silicone Cases</Link></li>
              <li><Link to="/categories/leather" className="hover:text-primary transition-colors">Leather Cases</Link></li>
              <li><Link to="/categories/clear" className="hover:text-primary transition-colors">Clear Cases</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-text-muted">
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link to="/shipping" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/track" className="hover:text-primary transition-colors">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3 text-sm text-text-muted">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} SnapCase. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-text-muted">
            <span>United States</span>
            <span>English</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
