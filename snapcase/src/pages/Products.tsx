import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { supabase } from '../lib/supabase';

export function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (categoryFilter) {
          query = query.ilike('category', `%${categoryFilter}%`);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data) {
          const realProducts = data.filter(p => !p.id.startsWith('coupon_') && p.id !== 'store_settings');
          setProducts(realProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [categoryFilter]);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          {categoryFilter ? `${categoryFilter} Products` : 'All Products'}
        </h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-surface rounded-3xl p-4 h-[360px] animate-pulse">
                <div className="w-full aspect-square bg-gray-100 rounded-2xl mb-4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-100 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-100 rounded w-1/4 mt-auto"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-muted bg-surface rounded-3xl">
            No products available yet. Check back soon!
          </div>
        )}
      </div>
    </div>
  );
}
