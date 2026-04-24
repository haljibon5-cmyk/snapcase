import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Search, Menu } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { CartDrawer } from "./CartDrawer";
import { NavDrawer } from "./NavDrawer";
import { supabase } from "../lib/supabase";

export function Navbar() {
  const totalItems = useCartStore((state) => state.totalItems());
  const { user, profile } = useAuthStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerLogoImage, setHeaderLogoImage] = useState<string | null>(null);
  const [headerLogoText, setHeaderLogoText] = useState("SnapCase");
  const [headerLogoFontSize, setHeaderLogoFontSize] = useState("text-2xl");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("id", "store_settings")
          .single();
        if (data && data.description) {
          const parsed = JSON.parse(data.description);
          if (parsed.headerLogoImage) {
            setHeaderLogoImage(parsed.headerLogoImage);
          } else if (parsed.headerLogoImage === "") {
            setHeaderLogoImage(null);
          }
          if (parsed.headerLogoText !== undefined) {
            setHeaderLogoText(parsed.headerLogoText);
          }
          if (parsed.headerLogoFontSize !== undefined) {
            setHeaderLogoFontSize(parsed.headerLogoFontSize);
          }
        }
      } catch (e) {
        console.error("Error loading navbar settings:", e);
      }
    };
    fetchSettings();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-black/5">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-[70px]">
            {/* Hamburger Nav (Left) */}
            <div className="flex justify-start w-1/3">
              <button
                onClick={() => setIsNavOpen(true)}
                className="text-gray-900 hover:text-gray-500 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 stroke-[1.5] text-[#86bfbf]" />
              </button>
            </div>

            {/* Logo */}
            <div className="flex justify-center w-1/3">
              <Link to="/" className="flex items-center">
                {headerLogoImage ? (
                  <img
                    src={headerLogoImage}
                    alt={headerLogoText || "SnapCase"}
                    className="h-[30px] object-contain"
                  />
                ) : (
                  <span
                    className={`font-serif tracking-wider text-[#86bfbf] ${headerLogoFontSize}`}
                  >
                    {headerLogoText}
                  </span>
                )}
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-6 w-1/3">
              <form
                onSubmit={handleSearch}
                className="hidden sm:flex items-center relative"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item code or name..."
                  className="pl-3 pr-8 py-1.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#86bfbf] focus:ring-1 focus:ring-[#86bfbf] transition-shadow w-48 text-gray-700"
                />
                <button
                  type="submit"
                  className="absolute right-2 text-[#86bfbf] hover:text-gray-500 transition-colors"
                >
                  <Search className="w-4 h-4 stroke-[1.5]" />
                </button>
              </form>

              {user ? (
                <Link
                  to={profile?.role === "admin" ? "/admin" : "/dashboard"}
                  className="text-[#86bfbf] hover:text-gray-500 transition-colors"
                >
                  <User className="w-5 h-5 stroke-[1.5]" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="text-[#86bfbf] hover:text-gray-500 transition-colors"
                >
                  <User className="w-5 h-5 stroke-[1.5]" />
                </Link>
              )}

              <button
                onClick={() => setIsCartOpen(true)}
                className="text-[#86bfbf] hover:text-gray-500 transition-colors relative flex items-center gap-2"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                {totalItems > 0 && (
                  <span className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#86bfbf] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <NavDrawer isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
