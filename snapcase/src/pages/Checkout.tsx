import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import imageCompression from 'browser-image-compression';
import { UploadCloud, CheckCircle, Landmark, ShoppingBag, X } from 'lucide-react';

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Phone number is required"),
  address: z.string().min(5, "Address is required"),
  coupon: z.string().optional()
});

type FormData = z.infer<typeof schema>;

export function Checkout() {
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const couponCode = watch('coupon');
  const basePrice = totalPrice();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('products').select('description').eq('id', 'store_settings').single();
      if (data && data.description) {
        setBankDetails(data.description);
      }
    };
    fetchSettings();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'coupon')
        .eq('name', couponCode.toUpperCase())
        .single();
        
      if (error || !data) {
         setDiscountAmount(0);
         setCouponError('Invalid coupon code');
      } else {
         const discountPercent = data.price || 0; // Using price column to store discount percent
         const discount = basePrice * (discountPercent / 100);
         setDiscountAmount(discount);
         setCouponError('');
      }
    } catch (e) {
      setDiscountAmount(0);
      setCouponError('Error verifying coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const finalPrice = Math.max(0, basePrice - discountAmount);

  if (successOrderId) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-background">
        <div className="text-center bg-white p-10 rounded-[30px] shadow-premium max-w-md w-full mx-4">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Order Successfully</h2>
          <p className="text-gray-500 font-medium mb-2">Order #{successOrderId}</p>
          <p className="text-text-muted mb-8">We have received your order and payment proof. We'll verify it shortly.</p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Go Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-background">
        <div className="text-center bg-white p-10 rounded-[30px] shadow-premium max-w-md w-full mx-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-text-muted" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Cart is Empty</h2>
          <p className="text-text-muted mb-8">Add some items before proceeding to checkout.</p>
          <Button onClick={() => navigate('/products')} className="w-full">Continue Shopping</Button>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedImage(e.dataTransfer.files[0]);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedImage) {
      alert("Please upload payment screenshot to confirm manual payment.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("User not found");

      const orderId = `ord_${Date.now()}`;

      // 🔥 upload image
      const compressedFile = await imageCompression(selectedImage, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024
      });

      const filePath = `payment_${orderId}`;

      const { error: uploadError } = await supabase.storage
        .from('payments')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: storageData } = supabase.storage
        .from('payments')
        .getPublicUrl(filePath);

      const imageUrl = storageData.publicUrl;

      // Prepare order details
      const customerDetails = {
        name: data.fullName,
        phone: data.phone,
        address: data.address,
        coupon: discountAmount > 0 ? data.coupon : null,
        payment_proof_url: imageUrl
      };

      // 🔥 insert order
      const { error } = await supabase.from('orders').insert({
        id: orderId,
        user_id: authUser.id,
        items: items,
        total_amount: finalPrice,
        status: 'Pending',
        payment_method: 'manual',
        payment_proof_url: imageUrl,
        shipping_address: JSON.stringify(customerDetails)
      });

      if (error) throw error;

      clearCart();
      setSuccessOrderId(orderId);
    } catch (err: any) {
      alert(err.message || "An error occurred during checkout.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="text-text-muted mt-2">Complete your order details and payment.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form & Payment */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Shipping Details */}
            <div className="bg-surface p-6 sm:p-8 rounded-[30px] shadow-premium">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                Shipping Details
              </h2>
              <div className="space-y-4">
                <Input label="Full Name" {...register('fullName')} error={errors.fullName?.message} placeholder="John Doe" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Phone Number" {...register('phone')} error={errors.phone?.message} placeholder="+1 234 567 890" />
                  <Input label="Email" value={user?.email || ''} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                   <label className="block text-sm font-medium text-text-main">Full Address</label>
                   <textarea 
                     {...register('address')} 
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px]"
                     placeholder="Street address, city, state, zip code"
                   />
                   {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
                </div>
              </div>
            </div>

            {/* Payment Verification */}
            <div className="bg-surface p-6 sm:p-8 rounded-[30px] shadow-premium">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
                Manual Payment Setup
              </h2>
              
              <div className="mb-6 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                  <Landmark className="w-5 h-5 text-blue-600" />
                  Bank Transfer Instructions
                </h3>
                <div className="text-sm text-blue-800 space-y-2 whitespace-pre-wrap">
                  {bankDetails || 'Please transfer the total amount to bKash/Nagad: 01700-000000'}
                </div>
                <p className="text-sm text-blue-800 mt-4 font-medium">
                  After payment, upload the screenshot/receipt below.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-3">Upload Payment Proof</label>
                
                {!selectedImage ? (
                  <div 
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors group-hover:scale-110 duration-300">
                      <UploadCloud className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="font-medium mb-1">Click to upload or drag & drop</p>
                    <p className="text-sm text-text-muted">SVG, PNG, JPG or GIF (max. 5MB)</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white border border-gray-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm line-clamp-1 max-w-[200px]">{selectedImage.name}</span>
                        <span className="text-xs text-text-muted">{(selectedImage.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSelectedImage(null)}
                      className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 relative">
            <div className="bg-surface p-6 sm:p-8 rounded-[30px] shadow-premium sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-semibold text-sm">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-6 mb-6">
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="Coupon code (Optional)" 
                    {...register('coupon')} 
                    className="mb-0"
                  />
                  <Button type="button" variant="secondary" onClick={handleApplyCoupon} isLoading={isApplyingCoupon} className="whitespace-nowrap rounded-xl">
                    Apply
                  </Button>
                </div>
                {couponError && <p className="text-sm text-red-500 mb-2">{couponError}</p>}
                {discountAmount > 0 && <p className="text-sm text-green-600 mb-2 font-medium">Coupon applied successfully!</p>}
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-100 mb-8">
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Subtotal</span>
                  <span>${basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Shipping</span>
                  <span>Calculated at next step</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-4 border-t border-gray-100">
                  <span>Total</span>
                  <span>${finalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full" 
                isLoading={isLoading}
              >
                Place Order (${finalPrice.toFixed(2)})
              </Button>
              
              <p className="text-xs text-text-muted text-center mt-4 flex items-center justify-center gap-1">
                🔒 Secure checkout provided by Supabase
              </p>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}