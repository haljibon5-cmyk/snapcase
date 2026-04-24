import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrencyStore, rates, CurrencyCode } from '../store/useCurrencyStore';

export function Footer() {
  const [quickLinks, setQuickLinks] = useState([{ name: 'Contact Us', url: '/contact' }, { name: 'Returns', url: '/returns' }]);
  const [policies, setPolicies] = useState([{ name: 'Refund Policy', url: '/refunds' }, { name: 'Returns/Exchanges', url: '/returns' }]);
  const [footerLogoText, setFooterLogoText] = useState('SnapCase');
  const [footerLogoImage, setFooterLogoImage] = useState('');
  const [footerDescription, setFooterDescription] = useState('Premium phone case designs. Experience quality, protection, and elegance in every detail.');
  
  const { currency, setCurrency } = useCurrencyStore();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('description')
          .eq('id', 'store_settings')
          .single();
          
        if (data && !error && data.description) {
          try {
            const parsed = JSON.parse(data.description);
            if (parsed.quickLinks && Array.isArray(parsed.quickLinks)) {
              setQuickLinks(parsed.quickLinks);
            }
            if (parsed.policies && Array.isArray(parsed.policies)) {
              setPolicies(parsed.policies);
            }
            if (parsed.footerLogoText !== undefined) setFooterLogoText(parsed.footerLogoText);
            if (parsed.footerLogoImage !== undefined) setFooterLogoImage(parsed.footerLogoImage);
            if (parsed.footerDescription !== undefined) setFooterDescription(parsed.footerDescription);
          } catch(e) {}
        }
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-[#faf9f6] pt-16 pb-8 mt-auto border-t border-black/10">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 text-center md:text-left">
          <div className="col-span-1">
            <Link to="/" className="inline-block mb-6">
              {footerLogoImage ? (
                <img src={footerLogoImage} alt={footerLogoText || 'SnapCase'} className="h-10 w-auto object-contain max-w-[200px]" />
              ) : (
                <span className="font-serif text-2xl tracking-wider text-black">{footerLogoText || 'SnapCase'}</span>
              )}
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed tracking-wide max-w-sm mx-auto md:mx-0 whitespace-pre-wrap">
              {footerDescription}
            </p>
          </div>
          
          <div className="md:flex md:flex-col md:items-center">
            <div className="text-center">
              <h3 className="text-sm font-semibold tracking-widest uppercase mb-6 text-black">Quick Links</h3>
              <ul className="space-y-4 text-sm text-gray-500">
                {quickLinks.map((link, idx) => (
                  <li key={idx}>
                    <Link to={link.url} className="hover:text-black transition-colors">{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:flex md:flex-col md:items-end">
            <div className="md:text-right">
              <h3 className="text-sm font-semibold tracking-widest uppercase mb-6 text-black">Policies</h3>
              <ul className="space-y-4 text-sm text-gray-500">
                {policies.map((policy, idx) => (
                  <li key={idx}>
                    <Link to={policy.url} className="hover:text-black transition-colors">{policy.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-4 text-xs tracking-widest relative group">
            <select 
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="appearance-none bg-transparent hover:text-black cursor-pointer transition-colors text-gray-500 uppercase outline-none focus:ring-0"
            >
              {Object.keys(rates).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-[-15px] top-[2px] text-gray-500 group-hover:text-black">
              ▼
            </span>
          </div>
          <p className="text-xs text-gray-500 tracking-widest">
            © {new Date().getFullYear()} SnapCase
          </p>
        </div>
      </div>
    </footer>
  );
}
