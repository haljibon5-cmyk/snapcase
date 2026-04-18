import { Link } from 'react-router-dom';
import { Star, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  image_url?: string;
  category: string;
  rating?: number;
}

export function ProductCard({ id, name, price, imageUrl, image_url, category, rating = 5 }: ProductCardProps) {
  const imgSrc = image_url || imageUrl || 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=400';
  
  return (
    <Link to={`/product/${id}`} className="group block relative">
      <div className="bg-white rounded-[20px] p-4 shadow-premium transition-transform duration-300 hover:-translate-y-1 h-full flex flex-col relative">
        <div className="relative h-[140px] rounded-xl overflow-hidden bg-[#f5f5f7] mb-3 flex items-center justify-center">
          <img 
            src={imgSrc} 
            alt={name} 
            className="w-full h-full object-contain object-center mix-blend-multiply transition-transform duration-500 group-hover:scale-105 p-2"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="flex flex-col flex-1">
          <h3 className="text-[14px] font-semibold text-text-main mb-1 line-clamp-2">
            {name}
          </h3>
          <p className="text-[16px] font-bold text-text-main mt-auto">
            ${price.toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  );
}
