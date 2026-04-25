import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCartStore } from "../store/useCartStore";
import {
  Star,
  ChevronRight,
  Share,
  Check,
  Info,
  ShieldCheck,
} from "lucide-react";
import { mockProducts } from "../lib/mockData";
import { useCurrencyStore } from "../store/useCurrencyStore";

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const { formatPrice } = useCurrencyStore();

  const [selectedCaseTypeId, setSelectedCaseTypeId] = useState("single");
  const [selectedModelId, setSelectedModelId] = useState("ip17pm");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<{
    name: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        let finalProduct = data;
        if (error || !data) {
          const mockProduct = mockProducts.find((p) => p.id === id);
          if (mockProduct) {
            finalProduct = mockProduct;
          } else {
            navigate("/");
            return;
          }
        }

        setProduct(finalProduct);

        // initialize color
        try {
          const metaStr = finalProduct.description || "";
          const meta = metaStr.startsWith("{") ? JSON.parse(metaStr) : {};
          const initColors = meta.colors || [];
          if (initColors.length > 0) {
            setSelectedColor(initColors[0]);
          } else {
            setSelectedColor(null);
          }
        } catch (e) {}
      } catch (error) {
        console.error("Error fetching product:", error);
        const mockProduct = mockProducts.find((p) => p.id === id);
        if (mockProduct) setProduct(mockProduct);
        else navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  // Calculate dynamic variables safely
  let currentPrice = 0;
  let originalPrice = 0;
  let selectedModelInfo = null;
  let selectedCaseTypeInfo = null;

  // Main gallery fallback if undefined
  let mainImgSrc = null;
  let galleryImages = [];
  let descriptionText = "";
  let soldCount = 350;
  let ratingValue = 5.0;
  let discountPercent = 17;
  let promo1 = "Free shipping";
  let promo2 = "$5.00 Credit for delay";
  let colorName = "Standard Pattern";
  let availableColors: { name: string; url: string }[] = [];
  let caseTypes = [];
  let phoneModels = [];
  let stockLeft = 100;
  let itemCode = "";

  if (product) {
    mainImgSrc = product.image_url || product.imageUrl;
    const parseMeta = (desc: string) => {
      try {
        if (desc && desc.startsWith("{")) return JSON.parse(desc);
      } catch (e) {}
      return { text: desc || "" };
    };

    const meta = parseMeta(product.description || "");
    descriptionText = meta.text;
    galleryImages =
      meta.gallery && meta.gallery.length > 0 ? meta.gallery : [mainImgSrc];
    soldCount = meta.sold ?? 350;
    ratingValue = meta.rating ?? 5.0;
    discountPercent = meta.discountPercent ?? 17;
    promo1 = meta.promoText1 || "Free shipping";
    promo2 = meta.promoText2 || "$5.00 Credit for delay";
    colorName = meta.colorName || "Standard Pattern";
    itemCode = meta.itemCode || "";

    availableColors = meta.colors || [];

    const casePrices = {
      single: meta.casePrices?.single || 20,
      dual: meta.casePrices?.dual || 25,
      magsafe: meta.casePrices?.magsafe || 30,
    };

    caseTypes = [
      {
        id: "single",
        name: "Single Layer Case",
        priceOffset: casePrices.single,
      },
      { id: "dual", name: "Dual Layer Case", priceOffset: casePrices.dual },
      { id: "magsafe", name: "Magsafe Case", priceOffset: casePrices.magsafe },
    ];

    selectedCaseTypeInfo =
      caseTypes.find((c) => c.id === selectedCaseTypeId) || caseTypes[0];

    const allPhoneModels = [
      {
        id: "ip17pm",
        name: "iPhone 17 Pro Max",
        priceOffset: 0,
        brand: "apple",
      },
      { id: "ip17p", name: "iPhone 17 Pro", priceOffset: 0, brand: "apple" },
      { id: "ip17a", name: "iPhone 17 Air", priceOffset: 0, brand: "apple" },
      {
        id: "ip16pm",
        name: "iPhone 16 Pro Max",
        priceOffset: 0,
        brand: "apple",
      },
      { id: "ip16p", name: "iPhone 16 Pro", priceOffset: 0, brand: "apple" },
      { id: "ip16pl", name: "iPhone 16 Plus", priceOffset: 0, brand: "apple" },
      { id: "ip16", name: "iPhone 16", priceOffset: 0, brand: "apple" },
      {
        id: "ip15pm",
        name: "iPhone 15 Pro Max",
        priceOffset: 0,
        brand: "apple",
      },
      { id: "ip14", name: "iPhone 14", priceOffset: 0, brand: "apple" },
      {
        id: "s24u",
        name: "Galaxy S24 Ultra",
        priceOffset: 0,
        brand: "samsung",
      },
      { id: "s23", name: "Galaxy S23", priceOffset: 0, brand: "samsung" },
    ];

    if (meta.models && Array.isArray(meta.models) && meta.models.length > 0) {
      phoneModels = meta.models.map((m: any) => {
        let name = "";
        let stock = 100;
        let brand = "custom";

        if (typeof m === "string") {
          name = m;
        } else {
          name = m.name;
          if (m.stock !== undefined) stock = m.stock;
        }

        const nameLower = name.toLowerCase();
        if (nameLower.includes("iphone") || nameLower.includes("apple")) {
          brand = "apple";
        } else if (
          nameLower.includes("galaxy") ||
          nameLower.includes("samsung")
        ) {
          brand = "samsung";
        }

        return {
          id: name,
          name: name,
          priceOffset: 0,
          brand: brand,
          stock: stock,
        };
      });
    } else {
      const categoryStr = (product.category || "").toLowerCase();
      if (categoryStr.includes("iphone") || categoryStr.includes("apple")) {
        phoneModels = allPhoneModels.filter((m) => m.brand === "apple");
      } else if (
        categoryStr.includes("galaxy") ||
        categoryStr.includes("samsung")
      ) {
        phoneModels = allPhoneModels.filter((m) => m.brand === "samsung");
      } else if (categoryStr.includes("mi") || categoryStr.includes("xiaomi")) {
        phoneModels = allPhoneModels.filter((m) => m.brand === "mi");
      } else {
        phoneModels = allPhoneModels;
      }
    }

    selectedModelInfo =
      phoneModels.find(
        (m) =>
          m.id === selectedModelId && (m.stock === undefined || m.stock > 0),
      ) ||
      phoneModels.find((m) => m.stock === undefined || m.stock > 0) ||
      phoneModels[0];

    // Ensure selectedModelId matches the found info
    if (selectedModelInfo && selectedModelInfo.id !== selectedModelId) {
      setTimeout(() => setSelectedModelId(selectedModelInfo.id), 0);
    }

    // Fallback logic for stock
    if (selectedModelInfo && selectedModelInfo.stock !== undefined) {
      stockLeft = selectedModelInfo.stock;
    } else {
      stockLeft =
        meta.stock !== undefined && meta.stock !== null
          ? meta.stock
          : product.stock || 0;
    }

    currentPrice =
      product.price +
      (selectedModelInfo?.priceOffset || 0) +
      (selectedCaseTypeInfo?.priceOffset || 0);
    originalPrice =
      discountPercent > 0
        ? currentPrice / (1 - discountPercent / 100)
        : currentPrice;
  }

  const handleAddToCart = () => {
    if (product && selectedModelInfo && selectedCaseTypeInfo) {
      addItem({
        productId: `${product.id}-${selectedModelInfo.id}-${selectedCaseTypeInfo.id}-${selectedColor ? selectedColor.name.replace(/\s+/g, "-") : "default"}`,
        baseProductId: product.id,
        name: `${product.name} (${selectedColor ? selectedColor.name : "Standard Pattern"} - ${selectedModelInfo.name} - ${selectedCaseTypeInfo.name})`,
        price: currentPrice,
        imageUrl: selectedColor?.url || product.image_url || product.imageUrl,
        quantity: 1,
        itemCode,
        caseType: selectedCaseTypeInfo.name,
        phoneModel: selectedModelInfo.name,
        color: selectedColor ? selectedColor.name : colorName,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto animate-pulse">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-24 space-y-4 flex flex-col hidden md:flex">
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
          </div>
          <div className="flex-[2] aspect-square bg-gray-100 rounded"></div>
          <div className="flex-[3] space-y-6">
            <div className="h-8 bg-gray-100 rounded w-full"></div>
            <div className="h-10 bg-gray-100 rounded w-1/4"></div>
            <div className="h-32 bg-gray-100 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-white font-sans">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-[12px] text-gray-500 mb-6 py-2 overflow-x-auto whitespace-nowrap hidden md:flex">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 mx-1" />
          <Link to="/products" className="hover:underline">
            Cell Phones & Accessories
          </Link>
          <ChevronRight className="w-3 h-3 mx-1" />
          <Link to="/products" className="hover:underline">
            Cases, Holsters & Sleeves
          </Link>
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className="text-gray-900 truncate max-w-sm">
            {product.name}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Gallery (Temu Style: vertical thumbs on left, large right) */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Desktop Thumbnails */}
            <div className="hidden md:flex flex-col gap-2 w-[60px] overflow-y-auto no-scrollbar max-h-[600px]">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onMouseEnter={() => {
                    setActiveImageIndex(i);
                    // Clear selected color so it doesn't override the active gallery image
                    // Wait, we don't want to clear the selected color, just change the main display image.
                    // Instead of using selectedColor.url directly in src, let's use a local state.
                  }}
                  className={`w-[60px] h-[60px] border-2 rounded ${activeImageIndex === i ? "border-black" : "border-transparent"} overflow-hidden transition-colors flex-shrink-0 bg-white`}
                >
                  <img
                    src={img}
                    className="w-full h-full object-contain"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 bg-gray-50 flex items-center justify-center rounded">
              <img
                src={
                  selectedColor && activeImageIndex === 0
                    ? selectedColor.url
                    : galleryImages?.[activeImageIndex]
                }
                alt={product.name}
                className="w-full h-auto max-h-[70vh] object-contain p-4"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Mobile Thumbs (Horizontal) */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-2">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`w-16 h-16 border-2 rounded ${activeImageIndex === i ? "border-black" : "border-transparent"} overflow-hidden flex-shrink-0 bg-white`}
                >
                  <img
                    src={img}
                    className="w-full h-full object-contain"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Product Content */}
          <div className="flex-1 min-w-0 flex flex-col pt-2 md:pt-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-[20px] leading-snug text-[#222] font-semibold break-words flex-1">
                {product.name}
              </h1>
              <button className="text-gray-500 hover:text-black">
                <Share className="w-5 h-5" />
              </button>
            </div>

            {/* Description Snippet */}
            {descriptionText && (
              <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                {descriptionText}
              </div>
            )}

            {product &&
              (() => {
                const parseMeta = (desc: string) => {
                  try {
                    if (desc && desc.startsWith("{")) return JSON.parse(desc);
                  } catch (e) {}
                  return { text: desc || "" };
                };
                const meta = parseMeta(product.description || "");
                if (meta.itemCode) {
                  return (
                    <div className="text-xs text-gray-500 mb-4 bg-gray-100 italic px-2 py-1 rounded inline-block w-fit">
                      Item Code:{" "}
                      <span className="font-semibold text-gray-700">
                        {meta.itemCode}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

            {/* Sales & Rating */}
            <div className="flex items-center text-[13px] text-gray-600 mb-5 gap-3">
              <div className="flex items-center text-sm font-semibold">
                {ratingValue.toFixed(1)}
                <div className="flex items-center text-[#ff6a00] ml-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </div>

            {/* Price section */}
            <div className="mb-6">
              <div className="flex items-end gap-2 flex-wrap">
                <span className="text-[32px] font-bold text-[#fb7701] leading-none tracking-tight">
                  {formatPrice(currentPrice)}
                </span>
                {discountPercent > 0 && (
                  <>
                    <div className="text-gray-500 line-through text-[14px] mb-1">
                      {formatPrice(originalPrice)}
                    </div>
                    <div className="bg-[#feeadd] text-[#fb7701] text-[12px] font-bold px-1.5 py-0.5 rounded ml-1 mb-1.5 flex items-center gap-1 border border-[#fdd1b5]">
                      <span>{discountPercent}% OFF</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-[12px]">
                <span className="text-[#fb7701] font-semibold border border-[#fb7701] rounded-[3px] px-1 text-[10px] uppercase leading-tight mt-0.5">
                  LAST FEW
                </span>
                <span className="text-gray-500 ml-1">
                  Temu prices cover taxes, no additional payment required.
                </span>
              </div>
            </div>

            {/* Promos Banner */}
            <div className="flex items-center gap-4 bg-[#fff8e1] border border-[#f5e6af] rounded py-2 px-3 mb-6 text-[13px]">
              <div className="flex items-center gap-1 font-semibold text-[#cf4c05]">
                <Check className="w-4 h-4" /> {promo1}
              </div>
              <div className="w-[1px] h-3 bg-[#e8cd88]"></div>
              <div className="flex items-center gap-1 font-semibold text-[#cf4c05]">
                <Check className="w-4 h-4" /> {promo2}
              </div>
            </div>

            {/* Color section */}
            {availableColors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[14px] text-[#222] font-semibold mb-3">
                  Color:{" "}
                  <span className="font-normal text-gray-600">
                    {selectedColor ? selectedColor.name : colorName}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color, idx) => {
                    const isSelected = selectedColor?.name === color.name;
                    return (
                      <div key={idx} className="flex flex-col items-center">
                        {color.url ? (
                          <>
                            <div
                              onClick={() => {
                                setSelectedColor(color);
                                setActiveImageIndex(0);
                              }}
                              className={`w-14 h-14 border-2 rounded p-0.5 relative hover:opacity-90 cursor-pointer ${isSelected ? "border-black" : "border-transparent"}`}
                            >
                              <img
                                src={color.url}
                                className="w-full h-full object-cover rounded-[2px]"
                                alt={color.name}
                                referrerPolicy="no-referrer"
                              />
                              {isSelected && (
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
                                  <Check className="w-3.5 h-3.5 text-black bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <span
                              className="text-[11px] text-gray-600 mt-1 max-w-[56px] text-center truncate"
                              title={color.name}
                            >
                              {color.name}
                            </span>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedColor(color);
                              setActiveImageIndex(0);
                            }}
                            className={`px-3 py-1.5 border rounded-[100px] text-[13px] min-h-[36px] flex items-center justify-center ${isSelected ? "border-[#222] text-[#222] font-bold bg-white" : "border-[#e0e0e0] text-[#222] bg-white hover:border-[#b0b0b0]"}`}
                          >
                            {color.name}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Case Type Selection */}
            <div className="mb-6">
              <h3 className="text-[14px] text-[#222] font-semibold mb-3 flex items-center justify-between">
                Case Type
              </h3>
              <div className="w-full">
                <select
                  value={selectedCaseTypeId}
                  onChange={(e) => setSelectedCaseTypeId(e.target.value)}
                  className="w-full p-3 border border-[#e0e0e0] rounded-lg text-[14px] bg-white outline-none focus:border-[#222] transition-colors"
                >
                  {caseTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Model Selection */}
            <div className="mb-8">
              <h3 className="text-[14px] text-[#222] font-semibold mb-3 flex items-center justify-between">
                Compatible Model
              </h3>
              <div className="w-full">
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full p-3 border border-[#e0e0e0] rounded-lg text-[14px] bg-white outline-none focus:border-[#222] transition-colors"
                >
                  {(() => {
                    const brands = Array.from(
                      new Set(phoneModels.map((m) => m.brand)),
                    );

                    if (brands.length > 1) {
                      return brands.map((brand) => (
                        <optgroup
                          key={brand}
                          label={
                            brand === "apple"
                              ? "Apple iPhone"
                              : brand === "samsung"
                                ? "Samsung Galaxy"
                                : brand.toUpperCase()
                          }
                        >
                          {phoneModels
                            .filter((m) => m.brand === brand)
                            .map((model) => (
                              <option
                                key={model.id}
                                value={model.id}
                                disabled={model.stock <= 0}
                              >
                                {model.name}{" "}
                                {model.stock !== undefined
                                  ? `(${model.stock})`
                                  : ""}{" "}
                                {model.stock <= 0 ? "- Out of Stock" : ""}
                              </option>
                            ))}
                        </optgroup>
                      ));
                    } else {
                      return phoneModels.map((model) => (
                        <option
                          key={model.id}
                          value={model.id}
                          disabled={model.stock <= 0}
                        >
                          {model.name}{" "}
                          {model.stock !== undefined ? `(${model.stock})` : ""}{" "}
                          {model.stock <= 0 ? "- Out of Stock" : ""}
                        </option>
                      ));
                    }
                  })()}
                </select>
              </div>
            </div>

            {/* Add to cart / Action buttons */}
            <div className="mt-auto space-y-4 pt-4 relative">
              <button
                onClick={handleAddToCart}
                disabled={stockLeft <= 0}
                className={`w-full active:scale-[0.99] transition-transform text-white rounded-[100px] py-[15px] text-[18px] font-bold tracking-wide uppercase flex flex-col items-center justify-center leading-none shadow-sm ${stockLeft <= 0 ? "bg-gray-400 cursor-not-allowed" : "bg-[#fb7701] hover:bg-[#eb6a01] shadow-[0_4px_10px_rgba(251,119,1,0.3)]"}`}
              >
                <span>
                  {stockLeft <= 0 ? "OUT OF STOCK" : "ADD NOW! LAST FEW!"}
                </span>
              </button>
            </div>

            {/* Full Description Section */}
            {descriptionText && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-[15px] font-semibold text-[#222] mb-3">
                  Product Description
                </h3>
                <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {descriptionText}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
