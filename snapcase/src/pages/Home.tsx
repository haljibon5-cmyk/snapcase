import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Link, useNavigate } from 'react-router-dom';
import { HeroSlider } from '../components/HeroSlider';
import { supabase } from '../lib/supabase';
import { Smartphone, MonitorPlay, Watch, Headphones } from 'lucide-react';

export function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [heroProducts, setHeroProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Filter out coupons and settings
          const realProducts = data.filter(p => !p.id.startsWith('coupon_') && p.id !== 'store_settings');
          
          setFeaturedProducts(realProducts.slice(0, 8));
          
          const heroProd = realProducts.filter(p => p.is_featured);
          setHeroProducts(heroProd.length > 0 ? heroProd.slice(0, 4) : realProducts.slice(0, 4));
        } else {
          setFeaturedProducts([]);
          setHeroProducts([]);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const categories = [
    { name: 'Apple', icon: <Smartphone className="w-6 h-6" /> },
    { name: 'Samsung', icon: <Smartphone className="w-6 h-6" /> },
    { name: 'Mi', icon: <Smartphone className="w-6 h-6" /> },
    { name: 'Accessories', icon: <Headphones className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen pt-[50px] flex flex-col">
      <HeroSlider products={heroProducts} />

      {/* Categories Section */}
      <section className="py-12 bg-surface">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-[20px] sm:text-[24px] font-bold tracking-[-0.5px]">Top Brands</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => navigate(`/products?category=${cat.name}`)}
                className="flex flex-col items-center justify-center p-6 bg-background rounded-3xl hover:shadow-premium transition-all group border border-transparent hover:border-primary/10"
              >
                <div className="w-16 h-16 bg-gray-50 group-hover:bg-primary/10 rounded-full flex items-center justify-center text-text-muted group-hover:text-primary transition-colors mb-3">
                  {cat.icon}
                </div>
                <span className="font-semibold text-text-main">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-[24px] font-bold tracking-[-0.5px]">Trending Now</h2>
            <Link to="/products" className="hidden sm:flex items-center text-[14px] text-primary font-medium hover:text-primary-hover transition-colors">
              View all collections &rarr;
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-surface rounded-3xl p-4 h-[360px] animate-pulse">
                  <div className="w-full aspect-square bg-gray-100 rounded-2xl mb-4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-gray-100 rounded w-3/4 mb-4"></div>
                  <div className="h-6 bg-gray-100 rounded w-1/4 mt-auto"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted bg-surface rounded-3xl">
              No products available yet. Check back soon!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
