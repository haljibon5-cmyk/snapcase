import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/useCartStore';
import { Button } from '../components/Button';
import { Star, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { mockProducts } from '../lib/mockData';

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  const phoneModels = [
    { id: 'ip13', name: 'iPhone 13', priceOffset: 0 },
    { id: 'ip14', name: 'iPhone 14', priceOffset: 0 },
    { id: 'ip14p', name: 'iPhone 14 Pro', priceOffset: 5 },
    { id: 'ip15', name: 'iPhone 15', priceOffset: 5 },
    { id: 'ip15pm', name: 'iPhone 15 Pro Max', priceOffset: 10 },
    { id: 's23', name: 'Galaxy S23', priceOffset: 0 },
    { id: 's24u', name: 'Galaxy S24 Ultra', priceOffset: 10 },
  ];
  
  const [selectedModel, setSelectedModel] = useState(phoneModels[0]);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          // Fallback to mock data if not found in Supabase
          const mockProduct = mockProducts.find(p => p.id === id);
          if (mockProduct) {
            setProduct(mockProduct);
          } else {
            navigate('/');
          }
        } else {
          setProduct(data);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        // Fallback to mock data on error
        const mockProduct = mockProducts.find(p => p.id === id);
        if (mockProduct) {
          setProduct(mockProduct);
        } else {
          navigate('/');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const currentPrice = product ? product.price + selectedModel.priceOffset : 0;

  const handleAddToCart = () => {
    if (product) {
      addItem({
        productId: `${product.id}-${selectedModel.id}`,
        name: `${product.name} (${selectedModel.name})`,
        price: currentPrice,
        imageUrl: product.image_url || product.imageUrl,
        quantity: 1,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto animate-pulse">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1 aspect-square bg-gray-100 rounded-3xl"></div>
          <div className="flex-1 space-y-6">
            <div className="h-10 bg-gray-100 rounded w-3/4"></div>
            <div className="h-6 bg-gray-100 rounded w-1/4"></div>
            <div className="h-32 bg-gray-100 rounded w-full"></div>
            <div className="h-12 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
          {/* Image Gallery */}
          <div className="flex-1">
            <div className="aspect-square rounded-3xl bg-surface p-8 shadow-premium flex items-center justify-center">
              <img 
                src={product.image_url || product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 flex flex-col">
            <div className="mb-2 text-sm font-medium text-primary uppercase tracking-wider">
              {product.category}
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-text-main font-medium ml-1">{product.rating?.toFixed(1) || '5.0'}</span>
              </div>
              <span className="text-text-muted text-sm">(128 reviews)</span>
            </div>

            <div className="text-3xl font-bold mb-6">${currentPrice.toFixed(2)}</div>

            <div className="mb-8">
              <h3 className="text-sm font-medium text-text-main mb-3">Select Phone Model</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {phoneModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      selectedModel.id === model.id
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-gray-200 text-text-muted hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-text-muted leading-relaxed mb-8">
              {product.description}
            </p>

            <div className="mt-auto space-y-6">
              <Button size="lg" className="w-full sm:w-auto" onClick={handleAddToCart}>
                Add to Cart
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-gray-200/50">
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <Truck className="w-5 h-5 text-primary" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <RotateCcw className="w-5 h-5 text-primary" />
                  <span>30 Days Return</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>2 Year Warranty</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
