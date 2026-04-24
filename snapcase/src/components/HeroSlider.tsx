import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { mockProducts } from '../lib/mockData';
import { useCartStore } from '../store/useCartStore';
import { useCurrencyStore } from '../store/useCurrencyStore';

const defaultProducts = mockProducts.slice(0, 4);

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 400 : -400,
    opacity: 0,
    scale: 0.8,
    rotateY: direction > 0 ? 45 : -45,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 400 : -400,
    opacity: 0,
    scale: 0.8,
    rotateY: direction < 0 ? 45 : -45,
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

interface HeroSliderProps {
  products?: any[];
}

export function HeroSlider({ products: propProducts }: HeroSliderProps) {
  const [items, setItems] = useState<any[]>(defaultProducts);
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { formatPrice } = useCurrencyStore();
  
  useEffect(() => {
    if (propProducts && propProducts.length > 0) {
      setItems(propProducts);
    }
  }, [propProducts]);

  const [[page, direction], setPage] = useState([0, 0]);

  if (!items || items.length === 0) return null;

  const currentIndex = Math.abs(page % items.length);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const goToSlide = (index: number) => {
    const currentNormalized = Math.abs(page % items.length);
    const diff = index - currentNormalized;
    if (diff === 0) return;
    setPage([page + diff, diff > 0 ? 1 : -1]);
  };

  const handleBuyNow = (product: any) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url || product.imageUrl,
      quantity: 1,
    });
    navigate('/checkout');
  };

  return (
    <section className="relative w-full h-[600px] md:h-[700px] bg-white overflow-hidden flex items-center justify-center">
      {/* Soft background gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,77,141,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto px-4 h-full flex flex-col items-center justify-center">
        
        {/* Slider Container */}
        <div className="relative w-full max-w-2xl h-[450px] flex items-center justify-center perspective-[1000px]">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 },
                scale: { duration: 0.5 },
                rotateY: { duration: 0.5 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="absolute w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
            >
              {/* Floating Product Image */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-8"
              >
                <img
                  src={items[currentIndex].image_url || items[currentIndex].imageUrl}
                  alt={items[currentIndex].name}
                  className="w-full h-full object-contain drop-shadow-2xl mix-blend-multiply"
                  draggable="false"
                  referrerPolicy="no-referrer"
                />
                {/* Smooth shadow below for depth */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/10 blur-xl rounded-[100%]" />
              </motion.div>

              {/* Product Info */}
              <div className="text-center space-y-3">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-text-main line-clamp-2">
                  {items[currentIndex].name}
                </h2>
                <Button 
                  className="mt-6 bg-gradient-to-r from-[#ff4d8d] to-[#ff75a6] hover:from-[#e63976] hover:to-[#ff4d8d] shadow-[0_10px_20px_rgba(255,77,141,0.2)] border-0"
                  onClick={() => handleBuyNow(items[currentIndex])}
                >
                  Buy Now - {formatPrice(items[currentIndex].price)}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <button
          className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md shadow-premium flex items-center justify-center text-text-main hover:text-primary transition-colors z-10"
          onClick={() => paginate(-1)}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md shadow-premium flex items-center justify-center text-text-main hover:text-primary transition-colors z-10"
          onClick={() => paginate(1)}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10 overflow-x-auto max-w-full px-4">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-300 flex-shrink-0 ${
                index === currentIndex 
                  ? 'bg-primary w-8' 
                  : 'bg-gray-300 hover:bg-gray-400 w-2.5'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
