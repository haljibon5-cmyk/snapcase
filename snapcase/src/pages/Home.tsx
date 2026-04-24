import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowRight, Star, Instagram } from 'lucide-react';

export function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [homeHeroImage, setHomeHeroImage] = useState('https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=2128');
  const [homeTitle, setHomeTitle] = useState('SnapCase');
  const [homeSubtitle, setHomeSubtitle] = useState('Premium phone cases and accessories');
  const [igHandle, setIgHandle] = useState('@snapcase');
  const [igLink, setIgLink] = useState('https://instagram.com');
  const [igImages, setIgImages] = useState([
    "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=800",
    "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800",
    "https://images.unsplash.com/photo-1588661601004-97210e3ce183?q=80&w=800",
    "https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?q=80&w=800",
    "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=800",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800"
  ]);
  const [homeAnnouncementText, setHomeAnnouncementText] = useState('wanna see yourself on our site? possibly as the cover? click here to apply for i&o social.');
  const [homeAnnouncementLink, setHomeAnnouncementLink] = useState('/contact');
  const [homeHeroLink, setHomeHeroLink] = useState('/products');
  const [promoImage1, setPromoImage1] = useState('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200');
  const [promoLink1, setPromoLink1] = useState('/products');
  const [promoImage2, setPromoImage2] = useState('https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=1200');
  const [promoLink2, setPromoLink2] = useState('/products');
  const [promoImage3, setPromoImage3] = useState('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200');
  const [promoLink3, setPromoLink3] = useState('/products');
  const [promoImage4, setPromoImage4] = useState('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200');
  const [promoLink4, setPromoLink4] = useState('/products');
  const [preTestimonialBannerImages, setPreTestimonialBannerImages] = useState([
    "https://images.unsplash.com/photo-1549298240-0d8e60513026?q=80&w=800",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
    "https://images.unsplash.com/photo-1588661601004-97210e3ce183?q=80&w=800",
    "https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?q=80&w=800"
  ]);
  const [preTestimonialBannerLink, setPreTestimonialBannerLink] = useState('/products');
  const [bannerImages, setBannerImages] = useState([
    "https://images.unsplash.com/photo-1549298240-0d8e60513026?q=80&w=800",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
    "https://images.unsplash.com/photo-1588661601004-97210e3ce183?q=80&w=800",
    "https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?q=80&w=800"
  ]);
  const [bottomBannerImages, setBottomBannerImages] = useState([
    "https://images.unsplash.com/photo-1549298240-0d8e60513026?q=80&w=800",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
    "https://images.unsplash.com/photo-1588661601004-97210e3ce183?q=80&w=800",
    "https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?q=80&w=800"
  ]);
  const [bottomBannerLink, setBottomBannerLink] = useState('/products');
  const [largeMiddleImage, setLargeMiddleImage] = useState('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2128');
  const [largeMiddleImageLink, setLargeMiddleImageLink] = useState('/products');
  const [largeBottomImage, setLargeBottomImage] = useState('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2128');
  const [largeBottomImageLink, setLargeBottomImageLink] = useState('/products');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const settings = data.find(p => p.id === 'store_settings');
          if (settings && settings.description) {
            try {
              const parsed = JSON.parse(settings.description);
              if (parsed.homeHeroImage) setHomeHeroImage(parsed.homeHeroImage);
              if (parsed.homeTitle) setHomeTitle(parsed.homeTitle);
              if (parsed.homeSubtitle) setHomeSubtitle(parsed.homeSubtitle);
              if (parsed.igHandle) setIgHandle(parsed.igHandle);
              if (parsed.igLink) setIgLink(parsed.igLink);
              if (parsed.igImages) {
                 const arr = parsed.igImages.split('\n').map((s: string) => s.trim()).filter(Boolean);
                 if (arr.length > 0) setIgImages(arr);
              }
              if (parsed.homeAnnouncementText !== undefined) setHomeAnnouncementText(parsed.homeAnnouncementText);
              if (parsed.homeAnnouncementLink !== undefined) setHomeAnnouncementLink(parsed.homeAnnouncementLink);
              if (parsed.homeHeroLink !== undefined) setHomeHeroLink(parsed.homeHeroLink);
              if (parsed.promoImage1 !== undefined) setPromoImage1(parsed.promoImage1);
              if (parsed.promoLink1 !== undefined) setPromoLink1(parsed.promoLink1);
              if (parsed.promoImage2 !== undefined) setPromoImage2(parsed.promoImage2);
              if (parsed.promoLink2 !== undefined) setPromoLink2(parsed.promoLink2);
              if (parsed.promoImage3 !== undefined) setPromoImage3(parsed.promoImage3);
              if (parsed.promoLink3 !== undefined) setPromoLink3(parsed.promoLink3);
              if (parsed.promoImage4 !== undefined) setPromoImage4(parsed.promoImage4);
              if (parsed.promoLink4 !== undefined) setPromoLink4(parsed.promoLink4);
              if (parsed.bannerImages && Array.isArray(parsed.bannerImages) && parsed.bannerImages.length > 0) {
                setBannerImages(parsed.bannerImages);
              }
              if (parsed.bottomBannerImages && Array.isArray(parsed.bottomBannerImages) && parsed.bottomBannerImages.length > 0) {
                setBottomBannerImages(parsed.bottomBannerImages);
              }
              if (parsed.bottomBannerLink !== undefined) setBottomBannerLink(parsed.bottomBannerLink);
              if (parsed.preTestimonialBannerImages && Array.isArray(parsed.preTestimonialBannerImages) && parsed.preTestimonialBannerImages.length > 0) {
                setPreTestimonialBannerImages(parsed.preTestimonialBannerImages);
              }
              if (parsed.preTestimonialBannerLink !== undefined) setPreTestimonialBannerLink(parsed.preTestimonialBannerLink);
              if (parsed.largeMiddleImage) setLargeMiddleImage(parsed.largeMiddleImage);
              if (parsed.largeMiddleImageLink !== undefined) setLargeMiddleImageLink(parsed.largeMiddleImageLink);
              if (parsed.largeBottomImage) setLargeBottomImage(parsed.largeBottomImage);
              if (parsed.largeBottomImageLink !== undefined) setLargeBottomImageLink(parsed.largeBottomImageLink);
            } catch(e) {}
          }
          
          const realProducts = data.filter((p: any) => !p.id.startsWith('coupon_') && !p.id.startsWith('contact_') && !p.id.startsWith('return_') && p.id !== 'store_settings');
          setFeaturedProducts(realProducts.slice(0, 16));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      {/* Hero Section */}
      <section className="w-full">
        {homeHeroLink ? (
          <Link to={homeHeroLink} className="block w-full">
            <img src={homeHeroImage} alt={homeTitle} className="w-full h-auto block" />
          </Link>
        ) : (
          <div className="w-full">
            <img src={homeHeroImage} alt={homeTitle} className="w-full h-auto block" />
          </div>
        )}
      </section>

      {/* Announcement Bar */}
      {homeAnnouncementText && (
        <div className="w-full py-3 px-4 text-center border-b border-gray-200 bg-white">
          {homeAnnouncementLink ? (
            <Link to={homeAnnouncementLink} className="text-sm font-medium hover:underline text-black">{homeAnnouncementText}</Link>
          ) : (
            <span className="text-sm font-medium text-black">{homeAnnouncementText}</span>
          )}
        </div>
      )}

      {/* Featured Products */}
      <section className="py-10 md:py-14 px-4 md:px-8 bg-[#faf9f6] w-full max-w-7xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-3 gap-y-6 md:gap-x-4 md:gap-y-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full aspect-square bg-gray-200 mb-4"></div>
                <div className="h-4 bg-gray-200 w-2/3 mb-2 mx-auto"></div>
                <div className="h-4 bg-gray-200 w-1/3 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="flex flex-col gap-10 lg:gap-16">
            
            {/* Promo Group 1 */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-16">
              {/* Left Promo Image */}
              <div className="w-full lg:w-1/2">
                <Link to={promoLink1} className="block w-full">
                  <img 
                    src={promoImage1} 
                    className="w-full h-auto object-cover block" 
                    alt="Collection Promo 1" 
                  />
                </Link>
              </div>
              {/* Right Products - 2x2 grid */}
              <div className="w-full lg:w-1/2 grid grid-cols-2 gap-x-6 gap-y-8 md:gap-x-12 md:gap-y-12 content-center">
                {[0,1,2,3].map(offset => featuredProducts[offset % featuredProducts.length]).map((product, idx) => (
                  <ProductCard key={`${product.id}-${idx}`} {...product} />
                ))}
              </div>
            </div>

            {/* Promo Group 2 */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-16">
              {/* Left Promo Image */}
              <div className="w-full lg:w-1/2">
                <Link to={promoLink2} className="block w-full">
                  <img 
                    src={promoImage2} 
                    className="w-full h-auto object-cover block" 
                    alt="Collection Promo 2" 
                  />
                </Link>
              </div>
              {/* Right Products - 2x2 grid */}
              <div className="w-full lg:w-1/2 grid grid-cols-2 gap-x-6 gap-y-8 md:gap-x-12 md:gap-y-12 content-center">
                {[4,5,6,7].map(offset => featuredProducts[offset % featuredProducts.length]).map((product, idx) => (
                  <ProductCard key={`${product.id}-${idx}`} {...product} />
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No products available yet. Check back soon!
          </div>
        )}
      </section>

      {/* 5-Image Continuous Banner Strip */}
      <section className="w-full my-6 md:my-10 cursor-pointer hover:opacity-95 transition-opacity overflow-hidden">
        <Link to="/products" className="grid grid-cols-5 w-full h-full">
          {bannerImages.map((img, idx) => (
             <div key={idx} className="aspect-[3/4] md:aspect-[4/5] overflow-hidden relative">
               <img src={img} className="w-full h-full object-cover" alt={`Lifestyle ${idx + 1}`} referrerPolicy="no-referrer" />
             </div>
          ))}
        </Link>
      </section>

      {/* Large Middle Image Section */}
      <section className="w-full my-6 md:my-10">
        {largeMiddleImageLink ? (
          <Link to={largeMiddleImageLink} className="block w-full">
            <img 
              src={largeMiddleImage} 
              alt="Middle Promotion" 
              className="w-full h-auto block" 
              referrerPolicy="no-referrer"
            />
          </Link>
        ) : (
          <div className="w-full">
            <img 
              src={largeMiddleImage} 
              alt="Middle Promotion" 
              className="w-full h-auto block" 
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </section>

      {/* Promo Group 3 */}
      {featuredProducts.length > 0 && (
        <section className="py-6 md:py-10 px-4 md:px-8 bg-[#faf9f6] w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-16">
            {/* Left Promo Image */}
            <div className="w-full lg:w-1/2">
              <Link to={promoLink3} className="block w-full">
                <img 
                  src={promoImage3} 
                  className="w-full h-auto object-cover block" 
                  alt="Collection Promo 3" 
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>
            {/* Right Products - 2x2 grid */}
            <div className="w-full lg:w-1/2 grid grid-cols-2 gap-x-6 gap-y-8 md:gap-x-12 md:gap-y-12 content-center">
              {[8,9,10,11].map(offset => featuredProducts[offset % featuredProducts.length]).map((product, idx) => (
                <ProductCard key={`${product.id}-${idx}`} {...product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Large Bottom Image Section */}
      <section className="w-full my-6 md:my-10">
        {largeBottomImageLink ? (
          <Link to={largeBottomImageLink} className="block w-full">
            <img 
              src={largeBottomImage} 
              alt="Bottom Promotion" 
              className="w-full h-auto block" 
              referrerPolicy="no-referrer"
            />
          </Link>
        ) : (
          <div className="w-full">
            <img 
              src={largeBottomImage} 
              alt="Bottom Promotion" 
              className="w-full h-auto block" 
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </section>

      {/* 5-Image Bottom Banner Strip */}
      <section className="w-full my-6 md:my-10 cursor-pointer hover:opacity-95 transition-opacity overflow-hidden">
        <Link to={bottomBannerLink} className="grid grid-cols-5 w-full h-full">
          {bottomBannerImages.map((img, idx) => (
             <div key={idx} className="aspect-[3/4] md:aspect-[4/5] overflow-hidden relative">
               <img src={img} className="w-full h-full object-cover" alt={`Lifestyle Bottom ${idx + 1}`} referrerPolicy="no-referrer" />
             </div>
          ))}
        </Link>
      </section>

      {/* Promo Group 4 */}
      {featuredProducts.length > 0 && (
        <section className="py-6 md:py-10 px-4 md:px-8 bg-[#faf9f6] w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-16">
            {/* Left Promo Image */}
            <div className="w-full lg:w-1/2">
              <Link to={promoLink4} className="block w-full">
                <img 
                  src={promoImage4} 
                  className="w-full h-auto object-cover block" 
                  alt="Collection Promo 4" 
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>
            {/* Right Products - 2x2 grid */}
            <div className="w-full lg:w-1/2 grid grid-cols-2 gap-x-6 gap-y-8 md:gap-x-12 md:gap-y-12 content-center">
              {[12,13,14,15].map(offset => featuredProducts[offset % featuredProducts.length]).map((product, idx) => (
                <ProductCard key={`${product.id}-${idx}`} {...product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5-Image Pre-Testimonial Strip */}
      <section className="w-full my-6 md:my-10 cursor-pointer hover:opacity-95 transition-opacity overflow-hidden">
        <Link to={preTestimonialBannerLink} className="grid grid-cols-5 w-full h-full">
          {preTestimonialBannerImages.map((img, idx) => (
             <div key={idx} className="aspect-[3/4] md:aspect-[4/5] overflow-hidden relative">
               <img src={img} className="w-full h-full object-cover" alt={`Pre-Testimonial ${idx + 1}`} referrerPolicy="no-referrer" />
             </div>
          ))}
        </Link>
      </section>

      {/* SHOP IG */}
      <section className="py-12 md:py-20 px-4 md:px-8 bg-white w-full max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-8 md:mb-12">
          <h2 className="text-3xl font-serif tracking-wide text-gray-900 mb-2">SHOP IG</h2>
          <a href={igLink} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-800 transition-colors">
            {igHandle}
          </a>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {igImages.slice(0, 6).map((img, i) => (
            <a href={igLink} key={i} target="_blank" rel="noreferrer" className="group relative aspect-[4/5] overflow-hidden bg-gray-100 block">
              <img 
                src={img} 
                alt={`Instagram feed ${i + 1}`} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </a>
          ))}
        </div>
      </section>

      {/* Let customers speak for us - Testimonials */}
      <section className="py-16 bg-white px-6 md:px-12 w-full">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-3xl font-serif tracking-wide text-gray-900 mb-4">Let customers speak for us</h2>
            <div className="w-16 h-[1px] bg-gray-900"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { text: "Absolutely stunning craftsmanship. I get compliments every time I use my new phone case.", author: "Sarah M." },
              { text: "Beautiful accessories that truly stand out from the crowd. The attention to detail is incredible.", author: "Jessica T." },
              { text: "So unique and elegant. I've bought three different items and love them all!", author: "Amanda R." }
            ].map((review, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8 bg-[#faf9f6]">
                <div className="flex text-black mb-6">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-600 italic mb-8 flex-grow tracking-wide leading-relaxed">"{review.text}"</p>
                <span className="font-medium tracking-wider text-sm uppercase">— {review.author}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
