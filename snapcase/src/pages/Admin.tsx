import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Package,
  Users,
  ShoppingCart,
  LogOut,
  Check,
  Trash2,
  Edit2,
  ExternalLink,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const fonts = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Courier New",
  "Comic Sans MS",
  "Impact",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Oswald",
  "Raleway",
  "PT Sans",
  "Merriweather",
  "Nunito",
  "Playfair Display",
  "Lora",
  "Rubik",
  "Work Sans",
  "Fira Sans",
  "Quicksand",
  "Barlow",
  "Inconsolata",
  "Josefin Sans",
  "Anton",
  "Dosis",
  "Cairo",
  "Oxygen",
  "Hind",
  "Cabin",
  "Fjalla One",
  "Arimo",
  "Signika",
  "Titillium Web",
  "Ubuntu",
  "Poppins",
  "Inter",
  "Noto Sans",
  "Noto Serif",
  "Bitter",
  "Crimson Text",
  "Brush Script MT",
];

// Register the fonts to work with inline styles
const fontSizes = Array.from({ length: 93 }, (_, i) => `${i + 8}px`);

if (Quill) {
  const FontStyle = Quill.import("attributors/style/font");
  if (FontStyle) {
    FontStyle.whitelist = fonts;
    Quill.register(FontStyle, true);
  }

  const SizeStyle = Quill.import("attributors/style/size");
  if (SizeStyle) {
    SizeStyle.whitelist = fontSizes;
    Quill.register(SizeStyle, true);
  }

  const AlignStyle = Quill.import("attributors/style/align");
  if (AlignStyle) {
    Quill.register(AlignStyle, true);
  }
}

const pickerStyles =
  fonts
    .map(
      (font) => `
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="${font}"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="${font}"]::before {
    content: '${font}';
    font-family: '${font}', sans-serif;
  }
`,
    )
    .join("") +
  "\n" +
  fontSizes
    .map(
      (size) => `
  .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="${size}"]::before,
  .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="${size}"]::before {
    content: '${size}';
  }
`,
    )
    .join("") +
  `
  .ql-snow .ql-picker.ql-size .ql-picker-label::before,
  .ql-snow .ql-picker.ql-size .ql-picker-item::before {
    content: '14px'; /* Default size */
  }
`;

const APPLE_MODELS = [
  "iPhone 16 Pro Max",
  "iPhone 16 Pro",
  "iPhone 16 Plus",
  "iPhone 16",
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone 15 Plus",
  "iPhone 15",
  "iPhone 14 Pro Max",
  "iPhone 14 Pro",
  "iPhone 14 Plus",
  "iPhone 14",
  "iPhone 13 Pro Max",
  "iPhone 13 Pro",
  "iPhone 13 mini",
  "iPhone 13",
  "iPhone 12 Pro Max",
  "iPhone 12 Pro",
  "iPhone 12 mini",
  "iPhone 12",
  "iPhone 11 Pro Max",
  "iPhone 11 Pro",
  "iPhone 11",
  "iPhone XS Max",
  "iPhone XS",
  "iPhone XR",
  "iPhone X",
];

const SAMSUNG_MODELS = [
  "Galaxy S24 Ultra",
  "Galaxy S24+",
  "Galaxy S24",
  "Galaxy S23 Ultra",
  "Galaxy S23+",
  "Galaxy S23",
  "Galaxy S23 FE",
  "Galaxy S22 Ultra",
  "Galaxy S22+",
  "Galaxy S22",
  "Galaxy S21 Ultra",
  "Galaxy S21+",
  "Galaxy S21",
  "Galaxy S21 FE",
  "Galaxy Z Fold5",
  "Galaxy Z Flip5",
  "Galaxy Z Fold4",
  "Galaxy Z Flip4",
  "Galaxy Z Fold3",
  "Galaxy Z Flip3",
  "Galaxy A55",
  "Galaxy A54",
  "Galaxy A53",
  "Galaxy A35",
  "Galaxy A34",
  "Galaxy A33",
];

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  stock: z.number().optional().default(0),
  is_featured: z.boolean().optional(),

  // New customization fields
  itemCode: z.string().optional(),
  sold: z.number().optional(),
  rating: z.number().optional(),
  discountPercent: z.number().optional(),
  promoText1: z.string().optional(),
  promoText2: z.string().optional(),
  colorName: z.string().optional(),
  priceSingle: z.number().optional(),
  priceDual: z.number().optional(),
  priceMagsafe: z.number().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export function Admin() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    | "products"
    | "orders"
    | "users"
    | "coupons"
    | "settings"
    | "messages"
    | "returns"
    | "menu"
  >("products");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", discountPercent: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isEditingProductForm, setIsEditingProductForm] = useState(false);
  const [editProductData, setEditProductData] = useState<any>(null);
  const [compatibleModels, setCompatibleModels] = useState<any[]>([]);
  const [editCompatibleModels, setEditCompatibleModels] = useState<any[]>([]);
  const [modelInput, setModelInput] = useState("");
  const [modelStockInput, setModelStockInput] = useState<number>(0);
  const [appleModelSelect, setAppleModelSelect] = useState("");
  const [samsungModelSelect, setSamsungModelSelect] = useState("");
  const [editModelInput, setEditModelInput] = useState("");
  const [editModelStockInput, setEditModelStockInput] = useState<number>(0);
  const [editAppleModelSelect, setEditAppleModelSelect] = useState("");
  const [editSamsungModelSelect, setEditSamsungModelSelect] = useState("");

  const [editPrice, setEditPrice] = useState<number>(0);
  const [bankDetails, setBankDetails] = useState("bKash / Nagad: 01700-000000");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
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

  // Header Logo Setting
  const [headerLogoImage, setHeaderLogoImage] = useState("");
  const [headerLogoImageFile, setHeaderLogoImageFile] = useState<File | null>(
    null,
  );
  const [headerLogoText, setHeaderLogoText] = useState("SnapCase");
  const [headerLogoFontSize, setHeaderLogoFontSize] = useState("text-2xl");

  // Home Page Settings State
  const [homeHeroImage, setHomeHeroImage] = useState(
    "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=2128",
  );
  const [homeHeroImageFile, setHomeHeroImageFile] = useState<File | null>(null);
  const [homeTitle, setHomeTitle] = useState("SnapCase");
  const [homeSubtitle, setHomeSubtitle] = useState(
    "Premium phone cases and accessories",
  );
  const [homeHeroLink, setHomeHeroLink] = useState("/products");
  const [homeAnnouncementText, setHomeAnnouncementText] = useState(
    "wanna see yourself on our site? possibly as the cover? click here to apply for i&o social.",
  );
  const [homeAnnouncementLink, setHomeAnnouncementLink] = useState("/contact");
  const [promoImage1, setPromoImage1] = useState(
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200",
  );
  const [promoImage1File, setPromoImage1File] = useState<File | null>(null);
  const [promoLink1, setPromoLink1] = useState("/products");
  const [promoImage2, setPromoImage2] = useState(
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=1200",
  );
  const [promoImage2File, setPromoImage2File] = useState<File | null>(null);
  const [promoLink2, setPromoLink2] = useState("/products");
  const [promoImage3, setPromoImage3] = useState(
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200",
  );
  const [promoImage3File, setPromoImage3File] = useState<File | null>(null);
  const [promoLink3, setPromoLink3] = useState("/products");

  const [promoImage4, setPromoImage4] = useState(
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200",
  );
  const [promoImage4File, setPromoImage4File] = useState<File | null>(null);
  const [promoLink4, setPromoLink4] = useState("/products");

  const [igHandle, setIgHandle] = useState("@shopinsidenout");
  const [igLink, setIgLink] = useState("https://instagram.com");
  const [igImages, setIgImages] = useState(
    [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=800",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800",
      "https://images.unsplash.com/photo-1588661601004-97210e3ce183?q=80&w=800",
      "https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?q=80&w=800",
      "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=800",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800",
    ].join("\n"),
  );
  const [igFiles, setIgFiles] = useState<FileList | null>(null);

  const [bannerImages, setBannerImages] = useState(
    [
      "https://images.unsplash.com/photo-1549298240-0d8e60513026?q=80&w=800",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
      "https://images.unsplash.com/photo-1588661601004-97210e3ce183?q=80&w=800",
      "https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?q=80&w=800",
    ].join("\n"),
  );
  const [bannerFiles, setBannerFiles] = useState<FileList | null>(null);

  const [bottomBannerImages, setBottomBannerImages] = useState(
    [
      "https://images.unsplash.com/photo-1549298240-0d8e60513026?q=80&w=800",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
      "https://images.unsplash.com/photo-1588661601004-97210e3ce183?q=80&w=800",
      "https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?q=80&w=800",
    ].join("\n"),
  );
  const [bottomBannerFiles, setBottomBannerFiles] = useState<FileList | null>(
    null,
  );
  const [bottomBannerLink, setBottomBannerLink] = useState("/products");

  const [preTestimonialBannerImages, setPreTestimonialBannerImages] = useState(
    [
      "https://images.unsplash.com/photo-1549298240-0d8e60513026?q=80&w=800",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
      "https://images.unsplash.com/photo-1588661601004-97210e3ce183?q=80&w=800",
      "https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?q=80&w=800",
    ].join("\n"),
  );
  const [preTestimonialBannerFiles, setPreTestimonialBannerFiles] =
    useState<FileList | null>(null);
  const [preTestimonialBannerLink, setPreTestimonialBannerLink] =
    useState("/products");

  const [largeMiddleImage, setLargeMiddleImage] = useState(
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2128",
  );
  const [largeMiddleImageFile, setLargeMiddleImageFile] = useState<File | null>(
    null,
  );
  const [largeMiddleImageLink, setLargeMiddleImageLink] = useState("/products");

  const [largeBottomImage, setLargeBottomImage] = useState(
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2128",
  );
  const [largeBottomImageFile, setLargeBottomImageFile] = useState<File | null>(
    null,
  );
  const [largeBottomImageLink, setLargeBottomImageLink] = useState("/products");

  const [quickLinks, setQuickLinks] = useState<{ name: string; url: string }[]>(
    [
      { name: "Contact Us", url: "/contact" },
      { name: "Returns", url: "/returns" },
    ],
  );
  const DEFAULT_TERMS = `<p>Before using our website or services, please review these Terms carefully. By accessing or using SnapCase, you agree to comply with all rules, policies, and conditions mentioned here. If you do not agree, please do not use our platform.</p><h2><strong>1. Overview</strong></h2><p>This website is operated by <strong>SnapCase</strong>. Throughout the site, the terms “we,” “us,” and “our” refer to SnapCase. By visiting our platform or purchasing from us, you engage with our services and accept all terms, conditions, and policies stated here.</p><p>These terms apply to all users, including visitors, customers, vendors, and contributors.</p><h2><strong>2. General Conditions</strong></h2><p>By agreeing to these terms, you confirm that:</p><ul><li>You are legally eligible to use this service in your region</li><li>You will not use SnapCase for any unlawful or unauthorized activity</li><li>You will not transmit harmful code such as viruses</li></ul><p>Violation of any rule may result in immediate suspension or termination of your access.</p><p>We reserve the right to:</p><ul><li>Limit or terminate access at any time</li><li>Modify or discontinue services without notice</li><li>Remove or refuse any content</li></ul><h2><strong>3. Account Registration</strong></h2><p>When you create an account on SnapCase:</p><ul><li>You must provide accurate and up-to-date information</li><li>You are responsible for maintaining account security</li><li>Any activity under your account is your responsibility</li></ul><p>SnapCase is not liable for unauthorized access caused by negligence.</p><h2><strong>4. User Conduct</strong></h2><p>You agree not to:</p><ul><li>Upload illegal, abusive, or harmful content</li><li>Impersonate others or misrepresent identity</li><li>Violate copyrights or intellectual property</li><li>Send spam or malicious software</li><li>Disrupt platform operations</li></ul><p>SnapCase reserves the right to remove content that violates these rules.</p><h2><strong>5. Content Responsibility</strong></h2><p>All content shared on SnapCase is the responsibility of the user who posted it. We do not guarantee accuracy or reliability of user-generated content.</p><h2><strong>6. Intellectual Property</strong></h2><p>All branding, logos, and materials on SnapCase belong to us or our licensors. You may not copy, modify, distribute, or exploit any content without written permission.</p><h2><strong>7. Service Modifications</strong></h2><p>We may update, modify, or discontinue any part of the service at any time without prior notice.</p><h2><strong>8. Termination</strong></h2><p>SnapCase may suspend or terminate your account if:</p><ul><li>You violate any terms</li><li>There are security or technical issues</li><li>Fraudulent or illegal activities are detected</li></ul><p>Termination may result in deletion of all account data.</p><h2><strong>9. Third-Party Links</strong></h2><p>Our site may contain links to external websites. SnapCase is not responsible for their content, services, or policies.</p><h2><strong>10. Disclaimer of Warranties</strong></h2><p>SnapCase services are provided “as is” and “as available.” We do not guarantee:</p><ul><li>Error-free operation</li><li>Continuous availability</li><li>Accuracy of results</li></ul><p>Use the service at your own risk.</p><h2><strong>11. Limitation of Liability</strong></h2><p>SnapCase will not be liable for:</p><ul><li>Loss of data, profits, or business</li><li>Indirect or consequential damages</li><li>Unauthorized access to your data</li></ul><h2><strong>12. Governing Law</strong></h2><p>These Terms are governed by applicable laws, and any disputes will be handled in the appropriate legal jurisdiction.</p><h2><strong>13. Changes to Terms</strong></h2><p>We may update these Terms at any time. Continued use of the platform means you accept those changes.</p>`;

  const [policies, setPolicies] = useState<{ name: string; url: string }[]>([
    { name: "Refund Policy", url: "/refunds" },
    { name: "Returns/Exchanges", url: "/returns" },
  ]);
  const [footerLogoText, setFooterLogoText] = useState("SnapCase");
  const [footerLogoImage, setFooterLogoImage] = useState("");
  const [footerLogoImageFile, setFooterLogoImageFile] = useState<File | null>(
    null,
  );
  const [footerDescription, setFooterDescription] = useState(
    "Premium phone case designs. Experience quality, protection, and elegance in every detail.",
  );
  const [termsContent, setTermsContent] = useState(DEFAULT_TERMS);

  const [colorVariants, setColorVariants] = useState<
    { id: string; name: string; file: File | null; url: string }[]
  >([]);
  const [editColorVariants, setEditColorVariants] = useState<
    { id: string; name: string; file: File | null; url: string }[]
  >([]);
  const [editExistingGallery, setEditExistingGallery] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const editGalleryInputRef = useRef<HTMLInputElement>(null);

  // Helper to parse description
  const parseMeta = (desc: string) => {
    try {
      if (desc && desc.startsWith("{")) return JSON.parse(desc);
    } catch (e) {}
    return { text: desc || "" };
  };

  const addColorVariant = () =>
    setColorVariants([
      ...colorVariants,
      { id: Date.now().toString(), name: "", file: null, url: "" },
    ]);
  const removeColorVariant = (id: string) =>
    setColorVariants(colorVariants.filter((v) => v.id !== id));

  const addEditColorVariant = () =>
    setEditColorVariants([
      ...editColorVariants,
      { id: Date.now().toString(), name: "", file: null, url: "" },
    ]);
  const removeEditColorVariant = (id: string) =>
    setEditColorVariants(editColorVariants.filter((v) => v.id !== id));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(productSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit },
  } = useForm<any>({
    resolver: zodResolver(productSchema),
  });

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (productsRes.data) {
        setProducts(
          productsRes.data.filter(
            (p) =>
              !p.id.startsWith("coupon_") &&
              !p.id.startsWith("contact_") &&
              !p.id.startsWith("return_") &&
              p.category !== "deleted_message" &&
              p.category !== "deleted_request" &&
              p.id !== "store_settings",
          ),
        );

        const loadedMessages = productsRes.data
          .filter((p) => p.category === "contact_message")
          .map((p) => {
            let msg = {};
            try {
              msg = JSON.parse(p.description || "{}");
            } catch (e) {}
            return { id: p.id, created_at: p.created_at, name: p.name, ...msg };
          });
        setMessages(loadedMessages);

        const loadedReturns = productsRes.data
          .filter((p) => p.category === "return_request")
          .map((p) => {
            let req = {};
            try {
              req = JSON.parse(p.description || "{}");
            } catch (e) {}
            return { id: p.id, created_at: p.created_at, name: p.name, ...req };
          });
        setReturnRequests(loadedReturns);

        const settings = productsRes.data.find(
          (p) => p.id === "store_settings",
        );
        if (settings && settings.description) {
          try {
            const parsed = JSON.parse(settings.description);
            if (parsed.bankDetails) setBankDetails(parsed.bankDetails);
            if (parsed.telegramBotToken) setTelegramBotToken(parsed.telegramBotToken);
            if (parsed.telegramChatId) setTelegramChatId(parsed.telegramChatId);
            if (parsed.menuItems) setMenuItems(parsed.menuItems);
            if (parsed.socialLinks) setSocialLinks(parsed.socialLinks);
            if (parsed.headerLogoImage !== undefined)
              setHeaderLogoImage(parsed.headerLogoImage);
            if (parsed.headerLogoText !== undefined)
              setHeaderLogoText(parsed.headerLogoText);
            if (parsed.headerLogoFontSize !== undefined)
              setHeaderLogoFontSize(parsed.headerLogoFontSize);
            if (parsed.homeHeroImage) setHomeHeroImage(parsed.homeHeroImage);
            if (parsed.homeTitle) setHomeTitle(parsed.homeTitle);
            if (parsed.homeSubtitle) setHomeSubtitle(parsed.homeSubtitle);
            if (parsed.homeHeroLink !== undefined)
              setHomeHeroLink(parsed.homeHeroLink);
            if (parsed.homeAnnouncementText !== undefined)
              setHomeAnnouncementText(parsed.homeAnnouncementText);
            if (parsed.homeAnnouncementLink !== undefined)
              setHomeAnnouncementLink(parsed.homeAnnouncementLink);
            if (parsed.promoImage1 !== undefined)
              setPromoImage1(parsed.promoImage1);
            if (parsed.promoLink1 !== undefined)
              setPromoLink1(parsed.promoLink1);
            if (parsed.promoImage2 !== undefined)
              setPromoImage2(parsed.promoImage2);
            if (parsed.promoLink2 !== undefined)
              setPromoLink2(parsed.promoLink2);
            if (parsed.promoImage3 !== undefined)
              setPromoImage3(parsed.promoImage3);
            if (parsed.promoLink3 !== undefined)
              setPromoLink3(parsed.promoLink3);
            if (parsed.promoImage4 !== undefined)
              setPromoImage4(parsed.promoImage4);
            if (parsed.promoLink4 !== undefined)
              setPromoLink4(parsed.promoLink4);
            if (parsed.igHandle) setIgHandle(parsed.igHandle);
            if (parsed.igLink) setIgLink(parsed.igLink);
            if (parsed.igImages) setIgImages(parsed.igImages);

            if (parsed.bannerImages) {
              const imagesArr = Array.isArray(parsed.bannerImages)
                ? parsed.bannerImages
                : [];
              if (imagesArr.length > 0) {
                setBannerImages(imagesArr.join("\n"));
              }
            }

            if (parsed.bottomBannerImages) {
              const imagesArr = Array.isArray(parsed.bottomBannerImages)
                ? parsed.bottomBannerImages
                : [];
              if (imagesArr.length > 0) {
                setBottomBannerImages(imagesArr.join("\n"));
              }
            }
            if (parsed.bottomBannerLink !== undefined)
              setBottomBannerLink(parsed.bottomBannerLink);

            if (parsed.preTestimonialBannerImages) {
              const imagesArr = Array.isArray(parsed.preTestimonialBannerImages)
                ? parsed.preTestimonialBannerImages
                : [];
              if (imagesArr.length > 0) {
                setPreTestimonialBannerImages(imagesArr.join("\n"));
              }
            }
            if (parsed.preTestimonialBannerLink !== undefined)
              setPreTestimonialBannerLink(parsed.preTestimonialBannerLink);

            if (parsed.largeMiddleImage)
              setLargeMiddleImage(parsed.largeMiddleImage);
            if (parsed.largeMiddleImageLink !== undefined)
              setLargeMiddleImageLink(parsed.largeMiddleImageLink);

            if (parsed.largeBottomImage)
              setLargeBottomImage(parsed.largeBottomImage);
            if (parsed.largeBottomImageLink !== undefined)
              setLargeBottomImageLink(parsed.largeBottomImageLink);

            if (parsed.quickLinks && Array.isArray(parsed.quickLinks)) {
              setQuickLinks(parsed.quickLinks);
            }
            if (parsed.policies && Array.isArray(parsed.policies)) {
              setPolicies(parsed.policies);
            }
            if (parsed.footerLogoText !== undefined)
              setFooterLogoText(parsed.footerLogoText);
            if (parsed.footerLogoImage !== undefined)
              setFooterLogoImage(parsed.footerLogoImage);
            if (parsed.footerDescription !== undefined)
              setFooterDescription(parsed.footerDescription);
          } catch (e) {
            setBankDetails(settings.description); // fallback for older plain text
          }
        }
        // Treat products with ID starting with 'coupon_' as coupons for this quick implementation
        if (settings && settings.description) {
          try {
            const parsed = JSON.parse(settings.description);
            if (
              parsed.termsContent !== undefined &&
              parsed.termsContent !== ""
            ) {
              setTermsContent(parsed.termsContent);
            }
          } catch (e) {}
        }
        setCoupons(productsRes.data.filter((p) => p.id.startsWith("coupon_")));
      }
      if (ordersRes.data) {
        setOrders(
          ordersRes.data.map((doc) => {
            let parsedAddress: any = null;
            let parsedItems: any = [];

            try {
              if (
                doc.shipping_address &&
                doc.shipping_address.startsWith("{")
              ) {
                parsedAddress = JSON.parse(doc.shipping_address);
              }
            } catch (e) {
              console.error("Error parsing address for order", doc.id);
            }

            try {
              if (typeof doc.items === "string") {
                parsedItems = JSON.parse(doc.items);
              } else {
                parsedItems = doc.items || [];
              }
            } catch (e) {
              console.error("Error parsing items for order", doc.id);
            }

            return {
              ...doc,
              items: parsedItems,
              customer_details: parsedAddress || doc.customer_details,
              payment_proof_url:
                parsedAddress?.payment_proof_url || doc.payment_proof_url,
            };
          }),
        );
      }
      if (usersRes.data) setUsers(usersRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || profile?.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [user, profile, navigate]);

  const onAddProduct = async (data: any) => {
    if (!selectedImage) {
      alert("Please select an image");
      return;
    }

    setIsUploading(true);
    try {
      const productId = `prod_${Date.now()}`;

      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(selectedImage, options);

      const filePath = `${productId}_${compressedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("products").getPublicUrl(filePath);

      let finalGalleryUrls: string[] = [];
      if (galleryFiles && galleryFiles.length > 0) {
        const fileArray = Array.from(galleryFiles).slice(0, 10);
        for (let file of fileArray) {
          const compressed = await imageCompression(file as File, options);
          const p = `${productId}_gallery_${Date.now()}_${compressed.name}`;
          await supabase.storage.from("products").upload(p, compressed);
          const {
            data: { publicUrl: url },
          } = supabase.storage.from("products").getPublicUrl(p);
          finalGalleryUrls.push(url);
        }
      }

      let finalColors: { name: string; url: string }[] = [];
      for (let cv of colorVariants) {
        if (cv.name.trim()) {
          let cvUrl = cv.url;
          if (cv.file) {
            const compressed = await imageCompression(cv.file, options);
            const p = `${productId}_color_${Date.now()}_${compressed.name}`;
            await supabase.storage.from("products").upload(p, compressed);
            const {
              data: { publicUrl: url },
            } = supabase.storage.from("products").getPublicUrl(p);
            cvUrl = url;
          }
          finalColors.push({ name: cv.name.trim(), url: cvUrl || "" }); // removed fallback to main if no image provided
        }
      }

      const meta = {
        text: data.description || "",
        itemCode: data.itemCode || "",
        sold: data.sold || 350,
        rating: data.rating || 5.0,
        discountPercent: data.discountPercent || 17,
        promoText1: data.promoText1 || "Free shipping",
        promoText2: data.promoText2 || "$5.00 Credit for delay",
        colorName: data.colorName || "Standard Pattern",
        colors: finalColors.length > 0 ? finalColors : [],
        models: compatibleModels,
        casePrices: {
          single: data.priceSingle || 0,
          dual: data.priceDual || 0,
          magsafe: data.priceMagsafe || 0,
        },
        gallery: finalGalleryUrls,
        stock: data.stock !== undefined && data.stock !== null ? data.stock : 0,
      };

      const payload: any = {
        id: productId,
        name: data.name,
        description: JSON.stringify(meta),
        price: data.price,
        category: data.category,
        stock: data.stock,
        is_featured: !!data.is_featured,
        image_url: publicUrl,
        imageUrl: publicUrl,
        rating: meta.rating,
        created_at: new Date().toISOString(),
      };

      let { error: insertError } = await supabase
        .from("products")
        .insert(payload);

      // If it fails because imageUrl / is_featured / stock columns don't exist, we try a stripped-down fallback
      if (
        insertError &&
        insertError.message &&
        insertError.message.includes("Could not find")
      ) {
        console.warn(
          "Retrying with stripped down payload due to missing columns...",
          insertError,
        );
        const strippedPayload = {
          id: productId,
          name: data.name,
          description: JSON.stringify(meta),
          price: data.price,
          category: data.category,
          image_url: publicUrl,
          created_at: new Date().toISOString(),
        };
        const fallbackRes = await supabase
          .from("products")
          .insert(strippedPayload);
        insertError = fallbackRes.error;
      }

      if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        throw new Error(insertError.message || JSON.stringify(insertError));
      }

      setIsAddingProduct(false);
      reset();
      setSelectedImage(null);
      setGalleryFiles(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";

      fetchData();
    } catch (error: any) {
      console.error("Upload Error:", error);
      alert("Error saving product: " + (error.message || "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };

  const onEditProductSubmit = async (data: any) => {
    setIsUploading(true);
    try {
      let finalImageUrl = editProductData.image_url || editProductData.imageUrl;
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      if (selectedImage) {
        const compressedFile = await imageCompression(selectedImage, options);
        const filePath = `${editProductData.id}_${Date.now()}_${compressedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, compressedFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("products").getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      let finalGalleryUrls: string[] = [...editExistingGallery];
      if (galleryFiles && galleryFiles.length > 0) {
        const fileArray = Array.from(galleryFiles).slice(0, 10);
        for (let file of fileArray) {
          const compressed = await imageCompression(file as File, options);
          const p = `${editProductData.id}_gallery_${Date.now()}_${compressed.name}`;
          await supabase.storage.from("products").upload(p, compressed);
          const {
            data: { publicUrl: url },
          } = supabase.storage.from("products").getPublicUrl(p);
          finalGalleryUrls.push(url);
        }
      }

      let finalColors: { name: string; url: string }[] = [];
      for (let cv of editColorVariants) {
        if (cv.name.trim()) {
          let cvUrl = cv.url;
          if (cv.file) {
            const compressed = await imageCompression(cv.file, options);
            const p = `${editProductData.id}_color_${Date.now()}_${compressed.name}`;
            await supabase.storage.from("products").upload(p, compressed);
            const {
              data: { publicUrl: url },
            } = supabase.storage.from("products").getPublicUrl(p);
            cvUrl = url;
          }
          finalColors.push({
            name: cv.name.trim(),
            url: cvUrl || "",
          });
        }
      }

      const meta = {
        text: data.description || "",
        itemCode: data.itemCode || "",
        sold: data.sold ?? 350,
        rating: data.rating ?? 5.0,
        discountPercent: data.discountPercent ?? 17,
        promoText1: data.promoText1 || "Free shipping",
        promoText2: data.promoText2 || "$5.00 Credit for delay",
        colorName: data.colorName || "Standard Pattern",
        colors: finalColors.length > 0 ? finalColors : [],
        models: editCompatibleModels,
        casePrices: {
          single: data.priceSingle || 0,
          dual: data.priceDual || 0,
          magsafe: data.priceMagsafe || 0,
        },
        gallery: finalGalleryUrls,
        stock: data.stock !== undefined && data.stock !== null ? data.stock : 0,
      };

      const payload: any = {
        name: data.name,
        description: JSON.stringify(meta),
        price: data.price,
        category: data.category,
        stock: data.stock,
        is_featured: !!data.is_featured,
        image_url: finalImageUrl,
        imageUrl: finalImageUrl,
      };

      let { error: updateError } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editProductData.id);

      if (
        updateError &&
        updateError.message &&
        updateError.message.includes("Could not find")
      ) {
        console.warn(
          "Retrying with stripped down payload due to missing columns...",
          updateError,
        );
        const strippedPayload = {
          name: data.name,
          description: JSON.stringify(meta),
          price: data.price,
          category: data.category,
          image_url: finalImageUrl,
        };
        const fallbackRes = await supabase
          .from("products")
          .update(strippedPayload)
          .eq("id", editProductData.id);
        updateError = fallbackRes.error;
      }

      if (updateError) {
        console.error("Supabase Update Error:", updateError);
        throw new Error(updateError.message || JSON.stringify(updateError));
      }

      setIsEditingProductForm(false);
      setEditProductData(null);
      resetEdit();
      setSelectedImage(null);
      setGalleryFiles(null);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      if (editGalleryInputRef.current) editGalleryInputRef.current.value = "";

      fetchData();
    } catch (error: any) {
      console.error("Update Error:", error);
      alert("Error saving product: " + (error.message || "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);
      if (error) throw error;
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId)
        .select();
      if (error) throw error;

      // If data is empty, it means RLS prevented deletion (0 rows deleted)
      if (!data || data.length === 0) {
        alert(
          "Action blocked by database. Please run the RLS Delete Policy in SQL editor.",
        );
        return;
      }

      setOrders(orders.filter((o) => o.id !== orderId));
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)
        .select();
      if (error) throw error;

      if (data && data.length > 0) {
        setProducts(products.filter((p) => p.id !== productId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const saveProductPrice = async (productId: string) => {
    try {
      await supabase
        .from("products")
        .update({ price: editPrice })
        .eq("id", productId);
      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, price: editPrice } : p,
        ),
      );
      setEditingProductId(null);
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || newCoupon.discountPercent <= 0) {
      alert("Please enter a valid coupon code and discount percentage (> 0)");
      return;
    }

    try {
      const couponId = `coupon_${Date.now()}`;
      const payload = {
        id: couponId,
        name: newCoupon.code.toUpperCase(), // Store code as name
        description: "Discount Coupon",
        price: newCoupon.discountPercent, // Store discount percent as price for easy retrieval
        category: "coupon",
        stock: 9999,
        image_url: "coupon",
        imageUrl: "coupon",
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("products").insert([payload]);
      if (error) {
        // Fallback if schema doesn't match
        await supabase.from("products").insert([
          {
            id: couponId,
            name: newCoupon.code.toUpperCase(),
            description: "Discount Coupon",
            price: newCoupon.discountPercent,
            category: "coupon",
            image_url: "coupon",
            created_at: new Date().toISOString(),
          },
        ]);
      }

      setNewCoupon({ code: "", discountPercent: 0 });
      setIsAddingCoupon(false);
      fetchData(); // Refresh the list
    } catch (err) {
      console.error(err);
      alert("Could not add coupon.");
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      await supabase.from("products").delete().eq("id", couponId);
      setCoupons(coupons.filter((c) => c.id !== couponId));
    } catch (error) {
      console.error("Error deleting coupon:", error);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await supabase.from("users").delete().eq("id", userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const updateMessageStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "new" ? "read" : "new";
      const msg = messages.find((m) => m.id === id);
      if (!msg) return;

      const payload = { ...msg, status: newStatus };
      delete payload.id;
      delete payload.created_at;
      delete payload.name;

      const { error } = await supabase
        .from("products")
        .update({ description: JSON.stringify(payload) })
        .eq("id", id);
      if (error) throw error;
      setMessages(
        messages.map((m) => (m.id === id ? { ...m, status: newStatus } : m)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)
        .select();
      if (error) throw error;

      if (!data || data.length === 0) {
        // Fallback to soft delete
        await supabase
          .from("products")
          .update({ category: "deleted_message" })
          .eq("id", id);
      }

      setMessages(messages.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const updateReturnStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "new" ? "read" : "new";
      const req = returnRequests.find((r) => r.id === id);
      if (!req) return;

      const payload = { ...req, status: newStatus };
      delete payload.id;
      delete payload.created_at;
      delete payload.name;

      const { error } = await supabase
        .from("products")
        .update({ description: JSON.stringify(payload) })
        .eq("id", id);
      if (error) throw error;
      setReturnRequests(
        returnRequests.map((r) =>
          r.id === id ? { ...r, status: newStatus } : r,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReturnRequest = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)
        .select();
      if (error) throw error;

      if (!data || data.length === 0) {
        // Fallback to soft delete
        await supabase
          .from("products")
          .update({ category: "deleted_request" })
          .eq("id", id);
      }

      setReturnRequests(returnRequests.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return null;

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 border-b border-gray-100">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight shrink-0 mr-4">
            SnapCase Admin
          </h1>
          <div className="flex gap-2 shrink-0">
            <Button
              variant={activeTab === "products" ? "primary" : "outline"}
              onClick={() => setActiveTab("products")}
            >
              Products
            </Button>
            <Button
              variant={activeTab === "orders" ? "primary" : "outline"}
              onClick={() => setActiveTab("orders")}
            >
              Orders
            </Button>
            <Button
              variant={activeTab === "users" ? "primary" : "outline"}
              onClick={() => setActiveTab("users")}
            >
              Users
            </Button>
            <Button
              variant={activeTab === "coupons" ? "primary" : "outline"}
              onClick={() => setActiveTab("coupons")}
            >
              Coupons
            </Button>
            <Button
              variant={activeTab === "messages" ? "primary" : "outline"}
              onClick={() => setActiveTab("messages")}
            >
              Messages
            </Button>
            <Button
              variant={activeTab === "returns" ? "primary" : "outline"}
              onClick={() => setActiveTab("returns")}
            >
              Returns
            </Button>
            <Button
              variant={activeTab === "menu" ? "primary" : "outline"}
              onClick={() => setActiveTab("menu")}
            >
              Menu
            </Button>
            <Button
              variant={activeTab === "settings" ? "primary" : "outline"}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-red-500"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface p-6 rounded-3xl shadow-premium flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex flex-shrink-0 items-center justify-center">
              <Package />
            </div>
            <div>
              <p className="text-text-muted text-sm">Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-3xl shadow-premium flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex flex-shrink-0 items-center justify-center">
              <ShoppingCart />
            </div>
            <div>
              <p className="text-text-muted text-sm">Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-3xl shadow-premium flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex flex-shrink-0 items-center justify-center">
              <Users />
            </div>
            <div>
              <p className="text-text-muted text-sm">Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>

        {activeTab === "products" && (
          <div className="bg-surface p-6 rounded-3xl shadow-premium">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Manage Products</h2>
              <Button
                onClick={() => {
                  setIsAddingProduct(!isAddingProduct);
                  setIsEditingProductForm(false);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </div>

            {isEditingProductForm && (
              <form
                onSubmit={handleSubmitEdit(onEditProductSubmit)}
                className="mb-8 p-6 bg-blue-50 rounded-2xl space-y-4"
              >
                <h3 className="font-semibold text-lg mb-2 text-blue-800">
                  Edit Product
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    {...registerEdit("name")}
                    error={errorsEdit.name?.message}
                  />
                  <Input
                    label="Category"
                    placeholder="e.g. Samsung, Apple, Accessories"
                    {...registerEdit("category")}
                    error={errorsEdit.category?.message}
                  />
                  <Input
                    label="Price"
                    type="number"
                    step="0.01"
                    {...registerEdit("price", { valueAsNumber: true })}
                    error={errorsEdit.price?.message}
                  />

                  <div className="md:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_is_featured"
                      {...registerEdit("is_featured")}
                      className="w-4 h-4 text-primary"
                    />
                    <label
                      htmlFor="edit_is_featured"
                      className="text-sm font-medium"
                    >
                      Show in Hero Section (Featured)
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-main mb-1.5">
                      Product Image (Leave empty to keep current image)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={editFileInputRef}
                      onChange={(e) =>
                        setSelectedImage(e.target.files?.[0] || null)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface"
                    />
                    {editProductData?.image_url && (
                      <img
                        src={editProductData.image_url}
                        alt="Current"
                        className="mt-2 h-16 rounded object-contain bg-white border border-gray-200"
                      />
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-main mb-1.5">
                      Description
                    </label>
                    <textarea
                      {...registerEdit("description")}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      rows={3}
                    />
                    {errorsEdit.description && (
                      <p className="mt-1 text-sm text-red-500">
                        {errorsEdit.description.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 pt-4 border-t border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-blue-800">
                        Color Variants
                      </h4>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addEditColorVariant}
                        variant="outline"
                        className="py-1 px-3 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Variant
                      </Button>
                    </div>
                    {editColorVariants.map((cv, index) => (
                      <div
                        key={cv.id}
                        className="flex flex-wrap items-end gap-3 mb-3 p-3 bg-white border border-blue-100 rounded-lg"
                      >
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-xs font-medium text-text-main mb-1">
                            Variant Name
                          </label>
                          <input
                            type="text"
                            value={cv.name}
                            onChange={(e) => {
                              const newVariants = [...editColorVariants];
                              newVariants[index].name = e.target.value;
                              setEditColorVariants(newVariants);
                            }}
                            className="w-full px-3 py-1.5 text-sm rounded border border-gray-200"
                            placeholder="e.g. Matte Black"
                          />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-xs font-medium text-text-main mb-1">
                            Image (Optional)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              const newVariants = [...editColorVariants];
                              newVariants[index].file = file;
                              setEditColorVariants(newVariants);
                            }}
                            className="w-full text-sm"
                          />
                        </div>
                        {cv.url && !cv.file && (
                          <img
                            src={cv.url}
                            alt={cv.name}
                            className="h-10 w-10 object-cover rounded border"
                          />
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="text-red-500 hover:text-red-600 px-2.5 py-1.5 h-auto text-xs"
                          onClick={() => removeEditColorVariant(cv.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    {editColorVariants.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        No color variants added. System will only show the main
                        product image and no color selection.
                      </p>
                    )}
                  </div>

                  {/* Extra Meta Configs */}
                  <div className="md:col-span-2 pt-4 border-t border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-4">
                      Product Page Overrides
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Input
                        label="Item Code (e.g. 10038)"
                        placeholder="10038"
                        {...registerEdit("itemCode")}
                      />
                      <Input
                        label="Sold Count"
                        type="number"
                        {...registerEdit("sold", { valueAsNumber: true })}
                      />
                      <Input
                        label="Rating (e.g. 5.0)"
                        type="number"
                        step="0.1"
                        {...registerEdit("rating", { valueAsNumber: true })}
                      />
                      <Input
                        label="Discount Percent Off"
                        type="number"
                        {...registerEdit("discountPercent", {
                          valueAsNumber: true,
                        })}
                      />

                      <Input
                        label="Promo Text 1"
                        placeholder="Free shipping"
                        {...registerEdit("promoText1")}
                      />
                      <Input
                        label="Promo Text 2"
                        placeholder="$5.00 Credit for delay"
                        {...registerEdit("promoText2")}
                      />

                      <Input
                        label="Color Name"
                        placeholder="Standard Pattern"
                        {...registerEdit("colorName")}
                      />

                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-text-main mb-1.5">
                          Compatible Models
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <select
                            className="px-3 py-2 rounded-xl border border-gray-200 bg-surface flex-1 min-w-[140px]"
                            value={editAppleModelSelect}
                            onChange={(e) =>
                              setEditAppleModelSelect(e.target.value)
                            }
                          >
                            <option value="">Apple Models</option>
                            {APPLE_MODELS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>

                          <select
                            className="px-3 py-2 rounded-xl border border-gray-200 bg-surface flex-1 min-w-[140px]"
                            value={editSamsungModelSelect}
                            onChange={(e) =>
                              setEditSamsungModelSelect(e.target.value)
                            }
                          >
                            <option value="">Samsung Models</option>
                            {SAMSUNG_MODELS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            className="flex-[2] px-4 py-2 rounded-xl border border-gray-200 bg-surface min-w-[150px]"
                            placeholder="Custom Model"
                            value={editModelInput}
                            onChange={(e) => setEditModelInput(e.target.value)}
                          />
                          <input
                            type="number"
                            className="w-24 px-4 py-2 rounded-xl border border-gray-200 bg-surface"
                            placeholder="Stock"
                            value={editModelStockInput}
                            onChange={(e) =>
                              setEditModelStockInput(
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const toAdd =
                                editAppleModelSelect ||
                                editSamsungModelSelect ||
                                editModelInput.trim();
                              if (
                                toAdd &&
                                !editCompatibleModels.some(
                                  (m) => (m.name || m) === toAdd,
                                )
                              ) {
                                setEditCompatibleModels([
                                  ...editCompatibleModels,
                                  {
                                    name: toAdd,
                                    stock: editModelStockInput,
                                  },
                                ]);
                                setEditModelInput("");
                                setEditAppleModelSelect("");
                                setEditSamsungModelSelect("");
                                setEditModelStockInput(0);
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {editCompatibleModels.map((model, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm"
                            >
                              <span>
                                {model.name || model} (
                                {model.stock !== undefined ? model.stock : 100})
                              </span>
                              <button
                                type="button"
                                className="text-gray-500 hover:text-red-500 font-bold ml-1"
                                onClick={() =>
                                  setEditCompatibleModels(
                                    editCompatibleModels.filter(
                                      (m) =>
                                        (m.name || m) !== (model.name || model),
                                    ),
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Input
                        label="Base Price (Single Layer)"
                        type="number"
                        step="0.01"
                        {...registerEdit("priceSingle", {
                          valueAsNumber: true,
                        })}
                      />
                      <Input
                        label="Base Price (Dual Layer)"
                        type="number"
                        step="0.01"
                        {...registerEdit("priceDual", { valueAsNumber: true })}
                      />
                      <Input
                        label="Base Price (Magsafe)"
                        type="number"
                        step="0.01"
                        {...registerEdit("priceMagsafe", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <label className="block text-sm font-medium text-text-main mb-1.5">
                      Gallery Images
                    </label>
                    {editExistingGallery.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {editExistingGallery.map((imgUrl, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={imgUrl}
                              className="w-16 h-16 object-cover rounded border"
                              alt=""
                            />
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full shadow hover:bg-red-50"
                              onClick={() =>
                                setEditExistingGallery(
                                  editExistingGallery.filter(
                                    (_, i) => i !== idx,
                                  ),
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4 p-0.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Add new ones (will be appended):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={editGalleryInputRef}
                      onChange={(e) => setGalleryFiles(e.target.files)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditingProductForm(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Saving..." : "Update Product"}
                  </Button>
                </div>
              </form>
            )}

            {isAddingProduct && (
              <form
                onSubmit={handleSubmit(onAddProduct)}
                className="mb-8 p-6 bg-gray-50 rounded-2xl space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    {...register("name")}
                    error={errors.name?.message}
                  />
                  <Input
                    label="Category"
                    placeholder="e.g. Samsung, Apple, Accessories"
                    {...register("category")}
                    error={errors.category?.message}
                  />
                  <Input
                    label="Price"
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    error={errors.price?.message}
                  />

                  <div className="md:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      {...register("is_featured")}
                      className="w-4 h-4 text-primary"
                    />
                    <label
                      htmlFor="is_featured"
                      className="text-sm font-medium"
                    >
                      Show in Hero Section (Featured)
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-main mb-1.5">
                      Product Image (Required)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) =>
                        setSelectedImage(e.target.files?.[0] || null)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-main mb-1.5">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      rows={3}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-800">
                        Color Variants
                      </h4>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addColorVariant}
                        variant="outline"
                        className="py-1 px-3 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Variant
                      </Button>
                    </div>
                    {colorVariants.map((cv, index) => (
                      <div
                        key={cv.id}
                        className="flex flex-wrap items-end gap-3 mb-3 p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-xs font-medium text-text-main mb-1">
                            Variant Name
                          </label>
                          <input
                            type="text"
                            value={cv.name}
                            onChange={(e) => {
                              const newVariants = [...colorVariants];
                              newVariants[index].name = e.target.value;
                              setColorVariants(newVariants);
                            }}
                            className="w-full px-3 py-1.5 text-sm rounded border border-gray-200"
                            placeholder="e.g. Matte Black"
                          />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-xs font-medium text-text-main mb-1">
                            Image (Optional)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              const newVariants = [...colorVariants];
                              newVariants[index].file = file;
                              setColorVariants(newVariants);
                            }}
                            className="w-full text-sm"
                          />
                        </div>
                        {cv.url && !cv.file && (
                          <img
                            src={cv.url}
                            alt={cv.name}
                            className="h-10 w-10 object-cover rounded border"
                          />
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="text-red-500 hover:text-red-600 px-2.5 py-1.5 h-auto text-xs"
                          onClick={() => removeColorVariant(cv.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    {colorVariants.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        No color variants added. System will only show the main
                        product image and no color selection.
                      </p>
                    )}
                  </div>

                  {/* Extra Meta Configs */}
                  <div className="md:col-span-2 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">
                      Product Page Overrides
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Input
                        label="Item Code (e.g. 10038)"
                        placeholder="10038"
                        {...register("itemCode")}
                      />
                      <Input
                        label="Sold Count"
                        type="number"
                        {...register("sold", { valueAsNumber: true })}
                        defaultValue={350}
                      />
                      <Input
                        label="Rating (e.g. 5.0)"
                        type="number"
                        step="0.1"
                        {...register("rating", { valueAsNumber: true })}
                        defaultValue={5.0}
                      />
                      <Input
                        label="Discount Percent Off"
                        type="number"
                        {...register("discountPercent", {
                          valueAsNumber: true,
                        })}
                        defaultValue={17}
                      />

                      <Input
                        label="Promo Text 1"
                        placeholder="Free shipping"
                        {...register("promoText1")}
                        defaultValue="Free shipping"
                      />
                      <Input
                        label="Promo Text 2"
                        placeholder="$5.00 Credit for delay"
                        {...register("promoText2")}
                        defaultValue="$5.00 Credit for delay"
                      />

                      {/* Color Option configuration */}
                      <Input
                        label="Color Name"
                        placeholder="Standard Pattern"
                        {...register("colorName")}
                        defaultValue="Standard Pattern"
                      />

                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-text-main mb-1.5">
                          Compatible Models
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <select
                            className="px-3 py-2 rounded-xl border border-gray-200 bg-surface flex-1 min-w-[140px]"
                            value={appleModelSelect}
                            onChange={(e) =>
                              setAppleModelSelect(e.target.value)
                            }
                          >
                            <option value="">Apple Models</option>
                            {APPLE_MODELS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>

                          <select
                            className="px-3 py-2 rounded-xl border border-gray-200 bg-surface flex-1 min-w-[140px]"
                            value={samsungModelSelect}
                            onChange={(e) =>
                              setSamsungModelSelect(e.target.value)
                            }
                          >
                            <option value="">Samsung Models</option>
                            {SAMSUNG_MODELS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            className="flex-[2] px-4 py-2 rounded-xl border border-gray-200 bg-surface min-w-[150px]"
                            placeholder="Custom Model"
                            value={modelInput}
                            onChange={(e) => setModelInput(e.target.value)}
                          />
                          <input
                            type="number"
                            className="w-24 px-4 py-2 rounded-xl border border-gray-200 bg-surface"
                            placeholder="Stock"
                            value={modelStockInput}
                            onChange={(e) =>
                              setModelStockInput(parseInt(e.target.value) || 0)
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const toAdd =
                                appleModelSelect ||
                                samsungModelSelect ||
                                modelInput.trim();
                              if (
                                toAdd &&
                                !compatibleModels.some(
                                  (m) => (m.name || m) === toAdd,
                                )
                              ) {
                                setCompatibleModels([
                                  ...compatibleModels,
                                  {
                                    name: toAdd,
                                    stock: modelStockInput,
                                  },
                                ]);
                                setModelInput("");
                                setAppleModelSelect("");
                                setSamsungModelSelect("");
                                setModelStockInput(0);
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {compatibleModels.map((model, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm"
                            >
                              <span>
                                {model.name || model} (
                                {model.stock !== undefined ? model.stock : 100})
                              </span>
                              <button
                                type="button"
                                className="text-gray-500 hover:text-red-500 font-bold ml-1"
                                onClick={() =>
                                  setCompatibleModels(
                                    compatibleModels.filter(
                                      (m) =>
                                        (m.name || m) !== (model.name || model),
                                    ),
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Input
                        label="Base Price (Single Layer)"
                        type="number"
                        step="0.01"
                        {...register("priceSingle", { valueAsNumber: true })}
                        defaultValue={0}
                      />
                      <Input
                        label="Base Price (Dual Layer)"
                        type="number"
                        step="0.01"
                        {...register("priceDual", { valueAsNumber: true })}
                        defaultValue={0}
                      />
                      <Input
                        label="Base Price (Magsafe)"
                        type="number"
                        step="0.01"
                        {...register("priceMagsafe", { valueAsNumber: true })}
                        defaultValue={0}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <label className="block text-sm font-medium text-text-main mb-1.5">
                      Gallery Images (Upload up to 10 images for left side
                      thumbnails)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={galleryInputRef}
                      onChange={(e) => setGalleryFiles(e.target.files)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddingProduct(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Save Product"}
                  </Button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 text-text-muted text-sm">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Hero / Featured</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const meta = parseMeta(product.description);
                    const stockToShow =
                      meta.stock !== undefined && meta.stock !== null
                        ? meta.stock
                        : product.stock || 0;
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                      >
                        <td className="py-4 flex items-center gap-3">
                          <img
                            src={product.image_url || product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-contain bg-white border border-gray-100"
                          />
                          <span className="font-medium text-sm">
                            {product.name}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-text-muted">
                          {product.category}
                        </td>
                        <td className="py-4 text-sm text-text-muted">
                          {product.is_featured ? "Yes" : "No"}
                        </td>
                        <td className="py-4 text-sm font-medium">
                          ${(product.price || 0).toFixed(2)}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setIsEditingProductForm(true);
                                setIsAddingProduct(false);
                                setEditProductData(product);
                                setSelectedImage(null);
                                let initialColors = meta.colors || [];
                                setEditColorVariants(
                                  initialColors.map((c: any, i: number) => ({
                                    id: i.toString(),
                                    name: c.name,
                                    file: null,
                                    url: c.url,
                                  })),
                                );
                                setEditCompatibleModels(meta.models || []);
                                setEditExistingGallery(meta.gallery || []);

                                resetEdit({
                                  name: product.name,
                                  description: meta.text,
                                  itemCode: meta.itemCode || "",
                                  price: product.price,
                                  category: product.category,
                                  stock: stockToShow,
                                  is_featured: product.is_featured || false,
                                  sold: meta.sold ?? 350,
                                  rating: meta.rating ?? 5.0,
                                  discountPercent: meta.discountPercent ?? 17,
                                  promoText1:
                                    meta.promoText1 || "Free shipping",
                                  promoText2:
                                    meta.promoText2 || "$5.00 Credit for delay",
                                  colorName:
                                    meta.colorName || "Standard Pattern",
                                  priceSingle: meta.casePrices?.single || 0,
                                  priceDual: meta.casePrices?.dual || 0,
                                  priceMagsafe: meta.casePrices?.magsafe || 0,
                                });
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-surface p-6 rounded-3xl shadow-premium">
            <h2 className="text-xl font-semibold mb-6">
              Manage Orders (Manual Checkout & Tracking)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 text-text-muted text-sm">
                    <th className="pb-3 font-medium">Order details</th>
                    <th className="pb-3 font-medium">Customer Details</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Payment Proof</th>
                    <th className="pb-3 font-medium tracking-tight text-right">
                      Status & Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                    >
                      <td className="py-4 align-top">
                        <div className="text-sm font-medium mb-1">
                          #{order.id}
                        </div>
                        <div className="text-xs text-text-muted mb-3">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        {Array.isArray(order.items) ? (
                          <div className="flex flex-col gap-3">
                            {order.items.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-gray-50 border border-gray-100 p-2 rounded-lg text-xs"
                              >
                                <div className="font-semibold text-gray-800 break-words mb-1">
                                  {item.name}
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-gray-600">
                                  <div>
                                    <span className="text-gray-400">Qty:</span>{" "}
                                    {item.quantity}
                                  </div>
                                  <div>
                                    <span className="text-gray-400">
                                      Price:
                                    </span>{" "}
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </div>
                                  {item.itemCode && (
                                    <div>
                                      <span className="text-gray-400">
                                        Code:
                                      </span>{" "}
                                      {item.itemCode}
                                    </div>
                                  )}
                                  {item.phoneModel && (
                                    <div>
                                      <span className="text-gray-400">
                                        Model:
                                      </span>{" "}
                                      {item.phoneModel}
                                    </div>
                                  )}
                                  {item.caseType && (
                                    <div>
                                      <span className="text-gray-400">
                                        Case:
                                      </span>{" "}
                                      {item.caseType}
                                    </div>
                                  )}
                                  {item.color && (
                                    <div>
                                      <span className="text-gray-400">
                                        Color:
                                      </span>{" "}
                                      {item.color}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            Items hidden
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="text-sm font-medium">
                          {order.customer_details?.name || "N/A"}
                        </div>
                        <div className="text-xs text-text-muted max-w-[250px]">
                          {order.customer_details?.phone || "No phone"}
                        </div>
                        <div
                          className="text-[10px] text-gray-400 mt-1 max-w-[200px] truncate"
                          title={
                            order.customer_details?.address ||
                            order.shipping_address
                          }
                        >
                          {order.customer_details?.address ||
                            order.shipping_address}
                        </div>
                        {order.customer_details?.coupon && (
                          <div className="text-[10px] mt-1 bg-green-100 text-green-700 px-2 rounded-full inline-block">
                            Coupon: {order.customer_details.coupon}
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-sm font-bold text-green-600">
                        ${(order.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="py-4">
                        {order.payment_proof_url ? (
                          <div className="flex flex-col gap-2">
                            <a
                              href={order.payment_proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block max-w-[80px] rounded-lg overflow-hidden border border-gray-200"
                            >
                              <img
                                src={order.payment_proof_url}
                                alt="Proof"
                                className="w-full h-auto object-cover max-h-[60px]"
                              />
                            </a>
                            <a
                              href={order.payment_proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center text-[10px] gap-1 text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <ExternalLink className="w-3 h-3" /> View full
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-1 rounded-md">
                            Not uploaded
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              updateOrderStatus(order.id, e.target.value)
                            }
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:border-primary font-medium w-[140px]"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Payment Approved">
                              Payment Approved
                            </option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-surface p-6 rounded-3xl shadow-premium">
            <h2 className="text-xl font-semibold mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-text-muted text-sm">
                    <th className="pb-3 font-medium">User Profile</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Joined date</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              u.photo_url ||
                              `https://ui-avatars.com/api/?name=${u.display_name || u.email}&background=random`
                            }
                            alt="user"
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-bold">
                              {u.display_name || "No Name"}
                            </p>
                            <p className="text-xs text-text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 capitalize font-medium text-sm">
                        <span
                          className={
                            u.role === "admin"
                              ? "text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md"
                              : "text-gray-600"
                          }
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-text-muted">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        {u.email !== "haljibon5@gmail.com" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteUser(u.id)}
                            className="text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "coupons" && (
          <div className="bg-surface p-6 rounded-3xl shadow-premium">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Manage Coupons</h2>
              <Button onClick={() => setIsAddingCoupon(!isAddingCoupon)}>
                <Plus className="w-4 h-4 mr-2" /> Add Coupon
              </Button>
            </div>

            {isAddingCoupon && (
              <form
                onSubmit={handleAddCoupon}
                className="mb-8 p-6 bg-gray-50 rounded-2xl space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Coupon Code (e.g. PROMO50)"
                    value={newCoupon.code}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="SUMMER20"
                    required
                  />
                  <Input
                    label="Discount Percentage (%)"
                    type="number"
                    value={newCoupon.discountPercent}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        discountPercent: Number(e.target.value),
                      })
                    }
                    placeholder="15"
                    min="1"
                    max="100"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddingCoupon(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Coupon</Button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-text-muted text-sm">
                    <th className="pb-3 font-medium">Coupon Code</th>
                    <th className="pb-3 font-medium">Discount</th>
                    <th className="pb-3 font-medium">Created Date</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-text-muted"
                      >
                        No coupons configured yet. Add one above.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((coupon) => (
                      <tr
                        key={coupon.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50"
                      >
                        <td className="py-4">
                          <span className="font-bold text-primary tracking-widest bg-primary/10 px-3 py-1 rounded-lg">
                            {coupon.name}
                          </span>
                        </td>
                        <td className="py-4 font-medium text-green-600">
                          {coupon.price}% OFF
                        </td>
                        <td className="py-4 text-sm text-text-muted">
                          {new Date(coupon.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => deleteCoupon(coupon.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="bg-surface p-6 rounded-3xl shadow-premium">
            <h2 className="text-xl font-semibold mb-6">Contact Messages</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-text-muted text-sm">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium w-1/3">Message</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-text-muted"
                      >
                        No messages received yet.
                      </td>
                    </tr>
                  ) : (
                    messages.map((msg) => (
                      <tr
                        key={msg.id}
                        className={`border-b border-gray-50 ${msg.status === "new" ? "bg-amber-50/50" : "hover:bg-gray-50/50"}`}
                      >
                        <td className="py-4 text-sm align-top whitespace-nowrap">
                          {new Date(msg.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 font-medium align-top">
                          {msg.name}
                          {msg.phone && (
                            <div className="text-xs text-text-muted mt-1">
                              {msg.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-4 align-top">
                          <a
                            href={`mailto:${msg.email}`}
                            className="text-primary hover:underline"
                          >
                            {msg.email}
                          </a>
                        </td>
                        <td className="py-4 text-sm align-top">
                          <div className="whitespace-pre-wrap max-w-md">
                            {msg.comment}
                          </div>
                        </td>
                        <td className="py-4 align-top">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${msg.status === "new" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"}`}
                          >
                            {msg.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 text-right align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                updateMessageStatus(msg.id, msg.status)
                              }
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title={
                                msg.status === "new"
                                  ? "Mark as read"
                                  : "Mark as new"
                              }
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "returns" && (
          <div className="bg-surface p-6 rounded-3xl shadow-premium">
            <h2 className="text-xl font-semibold mb-6">Return Requests</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-text-muted text-sm">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Order Number</th>
                    <th className="pb-3 font-medium w-1/3">Reason</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returnRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-text-muted"
                      >
                        No return requests received yet.
                      </td>
                    </tr>
                  ) : (
                    returnRequests.map((req) => (
                      <tr
                        key={req.id}
                        className={`border-b border-gray-50 ${req.status === "new" ? "bg-amber-50/50" : "hover:bg-gray-50/50"}`}
                      >
                        <td className="py-4 text-sm align-top whitespace-nowrap">
                          {new Date(req.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 font-medium align-top">
                          {req.name}
                          {req.email && (
                            <div className="text-xs text-text-muted mt-1">
                              <a
                                href={`mailto:${req.email}`}
                                className="text-primary hover:underline"
                              >
                                {req.email}
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="py-4 align-top">
                          {req.orderNumber || "-"}
                        </td>
                        <td className="py-4 text-sm align-top">
                          <div className="whitespace-pre-wrap max-w-md">
                            {req.reason}
                          </div>
                        </td>
                        <td className="py-4 align-top">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${req.status === "new" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"}`}
                          >
                            {req.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 text-right align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                updateReturnStatus(req.id, req.status)
                              }
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title={
                                req.status === "new"
                                  ? "Mark as read"
                                  : "Mark as new"
                              }
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteReturnRequest(req.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "menu" && (
          <div className="bg-surface p-6 rounded-3xl shadow-premium">
            <h2 className="text-xl font-semibold mb-6">Menu Management</h2>
            <div className="max-w-2xl">
              {menuItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 mb-4 items-center">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 mb-1">
                      Menu Name
                    </label>
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...menuItems];
                        newItems[idx].name = e.target.value;
                        setMenuItems(newItems);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 mb-1">
                      Menu Link
                    </label>
                    <Input
                      value={item.path}
                      onChange={(e) => {
                        const newItems = [...menuItems];
                        newItems[idx].path = e.target.value;
                        setMenuItems(newItems);
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newItems = menuItems.filter((_, i) => i !== idx);
                      setMenuItems(newItems);
                    }}
                    className="text-red-500 p-2 mt-5 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <Button
                type="button"
                onClick={() =>
                  setMenuItems([...menuItems, { name: "NEW MENU", path: "/" }])
                }
                className="mb-6 mr-4"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Menu Item
              </Button>

              <div className="mt-8 mb-4 border-t pt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Social Media Icons
                </h3>
                {socialLinks.map((item, idx) => (
                  <div
                    key={`social-${idx}`}
                    className="flex gap-4 mb-4 items-center"
                  >
                    <div className="flex-1">
                      <label className="block text-sm text-gray-500 mb-1">
                        Platform
                      </label>
                      <select
                        className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-black focus:border-black block p-2.5 outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                        value={item.platform}
                        onChange={(e) => {
                          const newLinks = [...socialLinks];
                          newLinks[idx].platform = e.target.value;
                          setSocialLinks(newLinks);
                        }}
                      >
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="pinterest">Pinterest</option>
                        <option value="youtube">YouTube</option>
                        <option value="twitter">Twitter / X</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-500 mb-1">
                        URL / Link
                      </label>
                      <Input
                        value={item.url}
                        onChange={(e) => {
                          const newLinks = [...socialLinks];
                          newLinks[idx].url = e.target.value;
                          setSocialLinks(newLinks);
                        }}
                        placeholder="https://"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newLinks = socialLinks.filter(
                          (_, i) => i !== idx,
                        );
                        setSocialLinks(newLinks);
                      }}
                      className="text-red-500 p-2 mt-5 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() =>
                    setSocialLinks([
                      ...socialLinks,
                      { platform: "instagram", url: "#" },
                    ])
                  }
                  className="mb-6 mr-4"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Social Icon
                </Button>
              </div>

              <div className="mt-8 mb-8 border-t pt-8">
                <h3 className="text-lg font-semibold mb-4">Header Logo</h3>
                <p className="text-sm text-gray-500 mb-6">
                  If you want to use text, clear the Logo URL. If a Logo URL
                  exists, it will replace the text.
                </p>

                <div className="grid grid-cols-2 gap-6 items-end mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Header Text (Fallback)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                      value={headerLogoText}
                      onChange={(e) => setHeaderLogoText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Text Size
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                      value={headerLogoFontSize}
                      onChange={(e) => setHeaderLogoFontSize(e.target.value)}
                    >
                      <option value="text-xl">Small (text-xl)</option>
                      <option value="text-2xl">Medium (text-2xl)</option>
                      <option value="text-3xl">Large (text-3xl)</option>
                      <option value="text-4xl">Extra Large (text-4xl)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Current Logo URL{" "}
                      <span className="text-gray-400 text-xs text-normal">
                        (Clear to use text)
                      </span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                      value={headerLogoImage}
                      onChange={(e) => setHeaderLogoImage(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Upload New Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setHeaderLogoImageFile(file);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
                {headerLogoImageFile && (
                  <p className="text-sm text-green-600 mt-2">
                    File selected: {headerLogoImageFile.name}. It will be
                    uploaded when you save.
                  </p>
                )}
                {headerLogoImage && !headerLogoImageFile && (
                  <div className="mt-4 bg-gray-100 p-4 rounded-xl inline-block max-h-32">
                    <img
                      src={headerLogoImage}
                      alt="Header Logo"
                      className="h-12 object-contain"
                    />
                  </div>
                )}
              </div>

              <Button
                type="button"
                onClick={async () => {
                  let finalHeaderLogo = headerLogoImage;
                  if (headerLogoImageFile) {
                    const options = {
                      maxSizeMB: 0.8,
                      maxWidthOrHeight: 1024,
                      useWebWorker: true,
                    };
                    const compressed = await imageCompression(
                      headerLogoImageFile,
                      options,
                    );
                    const p = `headerLogo_${Date.now()}_${compressed.name}`;
                    await supabase.storage
                      .from("products")
                      .upload(p, compressed);
                    const {
                      data: { publicUrl },
                    } = supabase.storage.from("products").getPublicUrl(p);
                    finalHeaderLogo = publicUrl;
                    setHeaderLogoImage(finalHeaderLogo);
                  }

                  const { data } = await supabase
                    .from("products")
                    .select("*")
                    .eq("id", "store_settings")
                    .single();
                  let currentSettings: any = {};
                  if (data && data.description) {
                    try {
                      currentSettings = JSON.parse(data.description);
                    } catch (e) {}
                  }
                  currentSettings.menuItems = menuItems;
                  currentSettings.socialLinks = socialLinks;
                  currentSettings.headerLogoImage = finalHeaderLogo;
                  currentSettings.headerLogoText = headerLogoText;
                  currentSettings.headerLogoFontSize = headerLogoFontSize;
                  await supabase.from("products").upsert(
                    {
                      id: "store_settings",
                      name: "System Internal Settings",
                      description: JSON.stringify(currentSettings),
                      price: 0,
                      category: "system",
                      stock: 0,
                      image_url: "system",
                    },
                    { onConflict: "id" },
                  );
                  alert("Menu settings saved!");
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Save Menu Settings
              </Button>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-surface p-6 rounded-3xl shadow-premium">
            <h2 className="text-xl font-semibold mb-4">Store Settings</h2>

            <div className="max-w-2xl">
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-3">
                  Bank / Manual Payment Instructions
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  These instructions will be shown to users during the checkout
                  process.
                </p>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary min-h-[150px]"
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  placeholder="e.g. Please transfer to bKash 01700-000000"
                />

                <h3 className="text-lg font-medium mb-3 mt-6 border-t pt-6">
                  Telegram Auto Notifications
                </h3>
                <p className="text-sm text-text-muted mb-4">
                  Configure Telegram bot token and chat ID to receive new order notifications.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Bot Token</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="e.g. 123456789:ABCdefGHIjklMNO..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Chat ID</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="e.g. -100123456789 or 123456789"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-medium mb-3 mt-6 border-t pt-6">
                  Home Page Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Hero Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-surface mb-2"
                      onChange={(e) =>
                        setHomeHeroImageFile(e.target.files?.[0] || null)
                      }
                    />
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200"
                      placeholder="Or specify URL..."
                      value={homeHeroImage}
                      onChange={(e) => setHomeHeroImage(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Hero Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200"
                      value={homeTitle}
                      onChange={(e) => setHomeTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Hero Subtitle
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200"
                      value={homeSubtitle}
                      onChange={(e) => setHomeSubtitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Hero Image Link (where the image redirects when clicked)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200"
                      value={homeHeroLink}
                      onChange={(e) => setHomeHeroLink(e.target.value)}
                    />
                  </div>

                  <h4 className="font-semibold mt-6 mb-2">Announcement Bar</h4>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Announcement Text
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200"
                      value={homeAnnouncementText}
                      onChange={(e) => setHomeAnnouncementText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Announcement Link
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200"
                      value={homeAnnouncementLink}
                      onChange={(e) => setHomeAnnouncementLink(e.target.value)}
                    />
                  </div>

                  <h4 className="font-semibold mt-6 mb-2">
                    Featured Products Promo 1
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Left Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-surface mb-2 text-sm"
                        onChange={(e) =>
                          setPromoImage1File(e.target.files?.[0] || null)
                        }
                      />
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
                        placeholder="Or specify URL..."
                        value={promoImage1}
                        onChange={(e) => setPromoImage1(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Image Link
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={promoLink1}
                        onChange={(e) => setPromoLink1(e.target.value)}
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-2">
                    Featured Products Promo 2
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Left Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-surface mb-2 text-sm"
                        onChange={(e) =>
                          setPromoImage2File(e.target.files?.[0] || null)
                        }
                      />
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
                        placeholder="Or specify URL..."
                        value={promoImage2}
                        onChange={(e) => setPromoImage2(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Image Link
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={promoLink2}
                        onChange={(e) => setPromoLink2(e.target.value)}
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-2">
                    Featured Products Promo 3
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Promo Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-surface mb-2 text-sm"
                        onChange={(e) =>
                          setPromoImage3File(e.target.files?.[0] || null)
                        }
                      />
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
                        placeholder="Or specify URL..."
                        value={promoImage3}
                        onChange={(e) => setPromoImage3(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Image Link
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={promoLink3}
                        onChange={(e) => setPromoLink3(e.target.value)}
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-2">
                    Featured Products Promo 4 (Above Testimonials)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Promo Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-surface mb-2 text-sm"
                        onChange={(e) =>
                          setPromoImage4File(e.target.files?.[0] || null)
                        }
                      />
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
                        placeholder="Or specify URL..."
                        value={promoImage4}
                        onChange={(e) => setPromoImage4(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Image Link
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={promoLink4}
                        onChange={(e) => setPromoLink4(e.target.value)}
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-2">Shop IG Section</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        IG Handle
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={igHandle}
                        onChange={(e) => setIgHandle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        IG Link
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={igLink}
                        onChange={(e) => setIgLink(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Upload New Images (Max 6, replaces URLs below)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setIgFiles(e.target.files)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If you upload fewer than 6, the remaining slots will use
                        the URLs below.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        IG Images (one URL per line, exactly 6 recommended)
                      </label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary min-h-[100px] text-xs"
                        value={igImages}
                        onChange={(e) => setIgImages(e.target.value)}
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-2 border-t border-gray-200 pt-6">
                    Banner Strip (Homepage)
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Upload New Images (Max 5, replaces URLs below)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setBannerFiles(e.target.files)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If you upload fewer than 5, the remaining slots will use
                        the URLs below.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Banner Image URLs (one per line, 5 recommended)
                      </label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary min-h-[120px] text-xs"
                        value={bannerImages}
                        onChange={(e) => setBannerImages(e.target.value)}
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-2 border-t border-gray-200 pt-6">
                    Bottom Banner Strip (Above Testimonials)
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Upload New Images (Max 5, replaces URLs below)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setBottomBannerFiles(e.target.files)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If you upload fewer than 5, the remaining slots will use
                        the URLs below.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Banner Link (Clicking any image goes where?)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={bottomBannerLink}
                        onChange={(e) => setBottomBannerLink(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Bottom Banner Image URLs (one per line, 5 recommended)
                      </label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary min-h-[120px] text-xs"
                        value={bottomBannerImages}
                        onChange={(e) => setBottomBannerImages(e.target.value)}
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-2 border-t border-gray-200 pt-6">
                    Pre-Testimonial Banner Strip (Right Above Testimonials)
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Upload New Images (Max 5, replaces URLs below)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) =>
                          setPreTestimonialBannerFiles(e.target.files)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If you upload fewer than 5, the remaining slots will use
                        the URLs below.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Banner Link (Clicking any image goes where?)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={preTestimonialBannerLink}
                        onChange={(e) =>
                          setPreTestimonialBannerLink(e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Banner Image URLs (one per line, 5 recommended)
                      </label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary min-h-[120px] text-xs"
                        value={preTestimonialBannerImages}
                        onChange={(e) =>
                          setPreTestimonialBannerImages(e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-2 border-t border-gray-200 pt-6">
                    Large Image (Middle of Homepage)
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Upload New Large Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setLargeMiddleImageFile(e.target.files?.[0] || null)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Image Link (Clicking it goes where?)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={largeMiddleImageLink}
                        onChange={(e) =>
                          setLargeMiddleImageLink(e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Current Image URL (from upload or external)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={largeMiddleImage}
                        onChange={(e) => setLargeMiddleImage(e.target.value)}
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-2 border-t border-gray-200 pt-6">
                    Large Image (Just Above Testimonials)
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Upload New Large Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setLargeBottomImageFile(e.target.files?.[0] || null)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Image Link (Clicking it goes where?)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={largeBottomImageLink}
                        onChange={(e) =>
                          setLargeBottomImageLink(e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Current Image URL (from upload or external)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200"
                        value={largeBottomImage}
                        onChange={(e) => setLargeBottomImage(e.target.value)}
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-2 border-t border-gray-200 pt-6">
                    Footer Settings
                  </h4>

                  <div className="space-y-6">
                    <div>
                      <h5 className="font-medium text-sm mb-2">
                        Footer Logo / Text
                      </h5>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Upload Logo Image (optional, replaces text)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setFooterLogoImageFile(
                                e.target.files?.[0] || null,
                              )
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Current Logo Image URL
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                            value={footerLogoImage}
                            onChange={(e) => setFooterLogoImage(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Logo Text (shows if no image is used)
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                            value={footerLogoText}
                            onChange={(e) => setFooterLogoText(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Footer Description Under Logo
                          </label>
                          <textarea
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                            rows={3}
                            value={footerDescription}
                            onChange={(e) =>
                              setFooterDescription(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Quick Links</h5>
                      {quickLinks.map((link, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            className="w-1/2 px-3 py-2 rounded border border-gray-200 text-sm"
                            placeholder="Link Name"
                            value={link.name}
                            onChange={(e) => {
                              const newLinks = [...quickLinks];
                              newLinks[idx].name = e.target.value;
                              setQuickLinks(newLinks);
                            }}
                          />
                          <input
                            type="text"
                            className="w-1/2 px-3 py-2 rounded border border-gray-200 text-sm"
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...quickLinks];
                              newLinks[idx].url = e.target.value;
                              setQuickLinks(newLinks);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setQuickLinks(
                                quickLinks.filter((_, i) => i !== idx),
                              )
                            }
                            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setQuickLinks([...quickLinks, { name: "", url: "" }])
                        }
                        className="text-sm text-primary hover:underline"
                      >
                        + Add Quick Link
                      </button>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Policies</h5>
                      {policies.map((policy, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            className="w-1/2 px-3 py-2 rounded border border-gray-200 text-sm"
                            placeholder="Policy Name"
                            value={policy.name}
                            onChange={(e) => {
                              const newPolicies = [...policies];
                              newPolicies[idx].name = e.target.value;
                              setPolicies(newPolicies);
                            }}
                          />
                          <input
                            type="text"
                            className="w-1/2 px-3 py-2 rounded border border-gray-200 text-sm"
                            placeholder="URL"
                            value={policy.url}
                            onChange={(e) => {
                              const newPolicies = [...policies];
                              newPolicies[idx].url = e.target.value;
                              setPolicies(newPolicies);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPolicies(policies.filter((_, i) => i !== idx))
                            }
                            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setPolicies([...policies, { name: "", url: "" }])
                        }
                        className="text-sm text-primary hover:underline"
                      >
                        + Add Policy
                      </button>
                    </div>

                    <div className="md:col-span-2 mb-4">
                      <style>{pickerStyles}</style>
                      <h5 className="font-medium text-sm mb-2">
                        Terms of Service Content
                      </h5>
                      <div
                        className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
                        style={{ height: "400px" }}
                      >
                        <ReactQuill
                          theme="snow"
                          modules={{
                            toolbar: [
                              [{ font: fonts }, { size: fontSizes }],
                              [{ header: [1, 2, 3, 4, 5, 6, false] }],
                              [
                                "bold",
                                "italic",
                                "underline",
                                "strike",
                                "blockquote",
                              ],
                              [{ color: [] }, { background: [] }],
                              [{ align: [] }],
                              [
                                { list: "ordered" },
                                { list: "bullet" },
                                { indent: "-1" },
                                { indent: "+1" },
                              ],
                              ["link", "image", "video", "clean"],
                            ],
                          }}
                          value={termsContent}
                          onChange={setTermsContent}
                          placeholder="Enter your terms of service content here..."
                          style={{ height: "100%", paddingBottom: "42px" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-6"
                  disabled={isUploading}
                  onClick={async () => {
                    setIsUploading(true);
                    try {
                      let finalHeroImage = homeHeroImage;
                      let finalPromo1 = promoImage1;
                      let finalPromo2 = promoImage2;

                      const uploadHelper = async (
                        file: File,
                        prefix: string,
                      ) => {
                        const options = {
                          maxSizeMB: 0.8,
                          maxWidthOrHeight: 1920,
                          useWebWorker: true,
                        };
                        const compressed = await imageCompression(
                          file,
                          options,
                        );
                        const p = `${prefix}_${Date.now()}_${compressed.name}`;
                        await supabase.storage
                          .from("products")
                          .upload(p, compressed);
                        const {
                          data: { publicUrl },
                        } = supabase.storage.from("products").getPublicUrl(p);
                        return publicUrl;
                      };

                      if (homeHeroImageFile)
                        finalHeroImage = await uploadHelper(
                          homeHeroImageFile,
                          "hero",
                        );
                      if (promoImage1File)
                        finalPromo1 = await uploadHelper(
                          promoImage1File,
                          "promo1",
                        );
                      if (promoImage2File)
                        finalPromo2 = await uploadHelper(
                          promoImage2File,
                          "promo2",
                        );

                      let finalPromo3 = promoImage3;
                      if (promoImage3File)
                        finalPromo3 = await uploadHelper(
                          promoImage3File,
                          "promo3",
                        );

                      let finalPromo4 = promoImage4;
                      if (promoImage4File)
                        finalPromo4 = await uploadHelper(
                          promoImage4File,
                          "promo4",
                        );

                      let finalBannerUrls = bannerImages
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean);

                      if (bannerFiles && bannerFiles.length > 0) {
                        const fileArray = Array.from(bannerFiles).slice(0, 5); // Max 5 images
                        const uploadedUrls = [];
                        for (let file of fileArray) {
                          const options = {
                            maxSizeMB: 0.5,
                            maxWidthOrHeight: 1024,
                            useWebWorker: true,
                          };
                          const compressed = await imageCompression(
                            file as File,
                            options,
                          );
                          const p = `banner_${Date.now()}_${compressed.name}`;
                          await supabase.storage
                            .from("products")
                            .upload(p, compressed);
                          const {
                            data: { publicUrl },
                          } = supabase.storage.from("products").getPublicUrl(p);
                          uploadedUrls.push(publicUrl);
                        }

                        // Merge uploaded images, keep the rest from the urls if we didn't upload 5
                        for (let i = 0; i < uploadedUrls.length; i++) {
                          if (i < 5) finalBannerUrls[i] = uploadedUrls[i];
                        }

                        setBannerImages(finalBannerUrls.join("\n"));
                      }

                      let finalIgUrls = igImages
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (igFiles && igFiles.length > 0) {
                        const fileArray = Array.from(igFiles).slice(0, 6); // Max 6 images
                        const uploadedUrls = [];
                        for (let file of fileArray) {
                          const options = {
                            maxSizeMB: 0.5,
                            maxWidthOrHeight: 1024,
                            useWebWorker: true,
                          };
                          const compressed = await imageCompression(
                            file as File,
                            options,
                          );
                          const p = `ig_${Date.now()}_${compressed.name}`;
                          await supabase.storage
                            .from("products")
                            .upload(p, compressed);
                          const {
                            data: { publicUrl },
                          } = supabase.storage.from("products").getPublicUrl(p);
                          uploadedUrls.push(publicUrl);
                        }

                        for (let i = 0; i < uploadedUrls.length; i++) {
                          if (i < 6) finalIgUrls[i] = uploadedUrls[i];
                        }

                        setIgImages(finalIgUrls.join("\n"));
                      }

                      let finalBottomBannerUrls = bottomBannerImages
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean);

                      if (bottomBannerFiles && bottomBannerFiles.length > 0) {
                        const fileArray = Array.from(bottomBannerFiles).slice(
                          0,
                          5,
                        ); // Max 5 images
                        const uploadedUrls = [];
                        for (let file of fileArray) {
                          const options = {
                            maxSizeMB: 0.5,
                            maxWidthOrHeight: 1024,
                            useWebWorker: true,
                          };
                          const compressed = await imageCompression(
                            file as File,
                            options,
                          );
                          const p = `bottom_banner_${Date.now()}_${compressed.name}`;
                          await supabase.storage
                            .from("products")
                            .upload(p, compressed);
                          const {
                            data: { publicUrl },
                          } = supabase.storage.from("products").getPublicUrl(p);
                          uploadedUrls.push(publicUrl);
                        }

                        // Merge uploaded images, keep the rest from the urls if we didn't upload 5
                        for (let i = 0; i < uploadedUrls.length; i++) {
                          if (i < 5) finalBottomBannerUrls[i] = uploadedUrls[i];
                        }

                        setBottomBannerImages(finalBottomBannerUrls.join("\n"));
                      }

                      let finalPreTestimonialBannerUrls =
                        preTestimonialBannerImages
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean);

                      if (
                        preTestimonialBannerFiles &&
                        preTestimonialBannerFiles.length > 0
                      ) {
                        const fileArray = Array.from(
                          preTestimonialBannerFiles,
                        ).slice(0, 5); // Max 5 images
                        const uploadedUrls = [];
                        for (let file of fileArray) {
                          const options = {
                            maxSizeMB: 0.5,
                            maxWidthOrHeight: 1024,
                            useWebWorker: true,
                          };
                          const compressed = await imageCompression(
                            file as File,
                            options,
                          );
                          const p = `pre_testimonial_banner_${Date.now()}_${compressed.name}`;
                          await supabase.storage
                            .from("products")
                            .upload(p, compressed);
                          const {
                            data: { publicUrl },
                          } = supabase.storage.from("products").getPublicUrl(p);
                          uploadedUrls.push(publicUrl);
                        }

                        // Merge uploaded images, keep the rest from the urls if we didn't upload 5
                        for (let i = 0; i < uploadedUrls.length; i++) {
                          if (i < 5)
                            finalPreTestimonialBannerUrls[i] = uploadedUrls[i];
                        }

                        setPreTestimonialBannerImages(
                          finalPreTestimonialBannerUrls.join("\n"),
                        );
                      }

                      let finalLargeMiddleImage = largeMiddleImage;
                      if (largeMiddleImageFile) {
                        finalLargeMiddleImage = await uploadHelper(
                          largeMiddleImageFile,
                          "largeMiddle",
                        );
                        setLargeMiddleImage(finalLargeMiddleImage);
                      }

                      let finalLargeBottomImage = largeBottomImage;
                      if (largeBottomImageFile) {
                        finalLargeBottomImage = await uploadHelper(
                          largeBottomImageFile,
                          "largeBottom",
                        );
                        setLargeBottomImage(finalLargeBottomImage);
                      }

                      let finalFooterLogoImage = footerLogoImage;
                      if (footerLogoImageFile) {
                        finalFooterLogoImage = await uploadHelper(
                          footerLogoImageFile,
                          "footerLogo",
                        );
                        setFooterLogoImage(finalFooterLogoImage);
                      }

                      let finalHeaderLogoImage = headerLogoImage;
                      if (headerLogoImageFile) {
                        finalHeaderLogoImage = await uploadHelper(
                          headerLogoImageFile,
                          "headerLogo",
                        );
                        setHeaderLogoImage(finalHeaderLogoImage);
                      }

                      const settingsData = {
                        bankDetails,
                        telegramBotToken,
                        telegramChatId,
                        menuItems,
                        socialLinks,
                        headerLogoImage: finalHeaderLogoImage,
                        headerLogoText,
                        headerLogoFontSize,
                        homeHeroImage: finalHeroImage,
                        homeTitle,
                        homeSubtitle,
                        homeHeroLink,
                        homeAnnouncementText,
                        homeAnnouncementLink,
                        promoImage1: finalPromo1,
                        promoLink1,
                        promoImage2: finalPromo2,
                        promoLink2,
                        promoImage3: finalPromo3,
                        promoLink3,
                        promoImage4: finalPromo4,
                        promoLink4,
                        igHandle,
                        igLink,
                        igImages: finalIgUrls.join("\n"),
                        bannerImages: finalBannerUrls,
                        bottomBannerImages: finalBottomBannerUrls,
                        bottomBannerLink,
                        preTestimonialBannerImages:
                          finalPreTestimonialBannerUrls,
                        preTestimonialBannerLink,
                        largeMiddleImage: finalLargeMiddleImage,
                        largeMiddleImageLink,
                        largeBottomImage: finalLargeBottomImage,
                        largeBottomImageLink,
                        quickLinks,
                        policies,
                        footerLogoText,
                        footerLogoImage: finalFooterLogoImage,
                        footerDescription,
                        termsContent,
                      };

                      setHomeHeroImage(finalHeroImage);
                      setPromoImage1(finalPromo1);
                      setPromoImage2(finalPromo2);
                      setPromoImage3(finalPromo3);
                      const payload = {
                        id: "store_settings",
                        name: "System Internal Settings",
                        description: JSON.stringify(settingsData),
                        price: 0,
                        category: "system",
                        stock: 0,
                        image_url: "system",
                        created_at: new Date().toISOString(),
                      };
                      const { error } = await supabase
                        .from("products")
                        .upsert(payload, { onConflict: "id" });

                      if (error) {
                        throw error;
                      }

                      alert("✅ Settings saved successfully!");
                    } catch (e: any) {
                      alert("❌ Error saving settings: " + (e.message || e));
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                >
                  {isUploading ? "Saving..." : "Save All Settings"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
