import React, { useState, useEffect } from "react";
import { X, Instagram, Search, Facebook, Twitter, Youtube } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavDrawer({ isOpen, onClose }: NavDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuItems, setMenuItems] = useState<{ name: string; path: string }[]>([
    { name: "HOME", path: "/" },
    { name: "NEW!", path: "/products" },
    { name: "MAGSAFE", path: "/products?category=Magsafe" },
    { name: "CLOTHING", path: "/products?category=Clothing" },
    { name: "TOUGH CASES", path: "/products?category=Tough Cases" },
    { name: "COLLEGE CASES", path: "/products?category=College Cases" },
    { name: "SWIM", path: "/products?category=Swim" },
    { name: "ACCESSORIES", path: "/products?category=Accessories" },
    { name: "PRINTS", path: "/products?category=Prints" },
  ]);
  const [socialLinks, setSocialLinks] = useState<
    { platform: string; url: string }[]
  >([
    { platform: "pinterest", url: "#" },
    { platform: "instagram", url: "#" },
    { platform: "tiktok", url: "#" },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("id", "store_settings")
          .single();
        if (data && data.description) {
          const parsed = JSON.parse(data.description);
          if (
            parsed.menuItems &&
            Array.isArray(parsed.menuItems) &&
            parsed.menuItems.length > 0
          ) {
            setMenuItems(parsed.menuItems);
          }
          if (parsed.socialLinks && Array.isArray(parsed.socialLinks)) {
            setSocialLinks(parsed.socialLinks);
          }
        }
      } catch (e) {
        console.error("Error loading menu:", e);
      }
    };
    fetchMenu();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return <Instagram className="w-5 h-5 stroke-[1.5]" />;
      case "facebook":
        return <Facebook className="w-5 h-5 stroke-[1.5]" />;
      case "twitter":
        return <Twitter className="w-5 h-5 stroke-[1.5]" />;
      case "youtube":
        return <Youtube className="w-5 h-5 stroke-[1.5]" />;
      case "tiktok":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
          </svg>
        );
      case "pinterest":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
            className="w-5 h-5"
          >
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.105 0 7.302 2.933 7.302 6.845 0 4.092-2.579 7.391-6.161 7.391-1.203 0-2.336-.625-2.723-1.363l-.743 2.831c-.269 1.039-1.002 2.34-1.493 3.136 1.153.351 2.378.539 3.636.539 6.621 0 11.988-5.367 11.988-11.987C24.004 5.367 18.638 0 12.017 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatUrl = (url: string) => {
    if (!url || url === "#") return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[300px] bg-[#eaf5f5] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-start p-6">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition-colors"
          >
            <X className="w-6 h-6 stroke-[1.5]" />
          </button>
        </div>

        <div className="px-6 mb-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item code..."
              className="w-full pl-3 pr-10 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#86bfbf] focus:ring-1 focus:ring-[#86bfbf]"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        <nav className="flex-1 overflow-y-auto pt-2 pb-6 flex flex-col items-center">
          <ul className="flex flex-col w-full text-center">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className="block px-8 py-4 text-sm tracking-widest text-gray-500 hover:text-black transition-colors hover:bg-black/5 uppercase"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-8 flex items-center flex-wrap gap-6 text-gray-500">
          {socialLinks.map((link, idx) => (
            <a
              key={idx}
              href={formatUrl(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
            >
              {getSocialIcon(link.platform)}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
