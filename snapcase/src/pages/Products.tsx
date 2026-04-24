import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { supabase } from '../lib/supabase';

export function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const searchFilter = searchParams.get('search');

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
          let realProducts = data.filter(p => !p.id.startsWith('coupon_') && !p.id.startsWith('contact_') && !p.id.startsWith('return_') && p.id !== 'store_settings');
          
          if (searchFilter) {
            const sq = searchFilter.toLowerCase();
            realProducts = realProducts.filter(p => {
              const nameMatch = p.name?.toLowerCase().includes(sq);
              const descMatch = p.description?.toLowerCase().includes(sq);
              return nameMatch || descMatch;
            });
          }
          
          setProducts(realProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [categoryFilter, searchFilter]);

  let title = 'All Accessories';
  if (searchFilter) title = `Search Results for "${searchFilter}"`;
  else if (categoryFilter) title = `${categoryFilter}`;

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#faf9f6]">
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col items-center text-center mb-10">
          <h1 className="text-3xl font-serif tracking-wide text-gray-900 mb-4">
            {title}
          </h1>
          <div className="w-16 h-[1px] bg-gray-900"></div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-3 gap-y-6 md:gap-x-4 md:gap-y-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full aspect-square bg-gray-200 mb-4"></div>
                <div className="h-4 bg-gray-200 w-2/3 mb-2 mx-auto"></div>
                <div className="h-4 bg-gray-200 w-1/3 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-3 gap-y-6 md:gap-x-4 md:gap-y-8">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No products available yet. Check back soon!
          </div>
        )}
      </div>
    </div>
  );
}
