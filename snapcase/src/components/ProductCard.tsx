import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { useCurrencyStore } from '../store/useCurrencyStore';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  image_url?: string;
  category: string;
  rating?: number;
  description?: string;
}

export function ProductCard({ id, name, price, imageUrl, image_url, description, rating = 5 }: ProductCardProps) {
  const { formatPrice } = useCurrencyStore();
  const imgSrc = image_url || imageUrl || 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=400';
  
  let soldCount = 350;
  let discountPercent = 17;
  let actualRating = rating;

  if (description) {
    try {
      if (description.startsWith('{')) {
        const meta = JSON.parse(description);
        if (meta.sold !== undefined) soldCount = meta.sold;
        if (meta.discountPercent !== undefined) discountPercent = meta.discountPercent;
        if (meta.rating !== undefined) actualRating = meta.rating;
        // Notice we do NOT show meta.itemCode on the card anymore
      }
    } catch(e) {}
  }

  // Fallback calculations for original price
  const originalPrice = discountPercent > 0 ? price / (1 - (discountPercent / 100)) : price;

  return (
    <Link to={`/product/${id}`} className="group block text-center bg-transparent transition-transform hover:-translate-y-1 duration-300">
      <div className="relative mb-4 overflow-hidden bg-gray-50 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
        <img 
          src={imgSrc} 
          alt={name} 
          className="w-full h-auto object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <div className="flex flex-col items-center px-1">
        <h3 className="text-[12px] md:text-[13px] text-gray-800 mb-1 line-clamp-1 font-light tracking-wider" title={name}>
          {name}
        </h3>
        
        <div className="flex items-center justify-center gap-2 w-full">
          <span className="text-[12px] md:text-[13px] text-gray-500 font-light tracking-wider">
            {formatPrice(price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
