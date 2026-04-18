import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Package, Users, ShoppingCart, LogOut, Check, Trash2, Edit2, ExternalLink } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  stock: z.number().min(0, "Stock must be a positive number"),
  is_featured: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export function Admin() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users' | 'coupons' | 'settings'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [bankDetails, setBankDetails] = useState('bKash / Nagad: 01700-000000');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(productSchema)
  });

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false }),
      ]);

      if (productsRes.data) {
         setProducts(productsRes.data.filter(p => p.id !== 'store_settings' && !p.id.startsWith('coupon_')));
         const settings = productsRes.data.find(p => p.id === 'store_settings');
         if (settings && settings.description) setBankDetails(settings.description);
         // Treat products with ID starting with 'coupon_' as coupons for this quick implementation
         setCoupons(productsRes.data.filter(p => p.id.startsWith('coupon_')));
      }
      if (ordersRes.data) {
        setOrders((ordersRes.data).map(doc => {
          let parsedAddress: any = null;
          let parsedItems: any = [];
          
          try {
            if (doc.shipping_address && doc.shipping_address.startsWith('{')) {
              parsedAddress = JSON.parse(doc.shipping_address);
            }
          } catch(e) { console.error("Error parsing address for order", doc.id); }

          try {
            if (typeof doc.items === 'string') {
              parsedItems = JSON.parse(doc.items);
            } else {
              parsedItems = doc.items || [];
            }
          } catch(e) { console.error("Error parsing items for order", doc.id); }
          
          return { 
            ...doc,
            items: parsedItems,
            customer_details: parsedAddress || doc.customer_details,
            payment_proof_url: parsedAddress?.payment_proof_url || doc.payment_proof_url
          };
        }));
      }
      if (usersRes.data) setUsers(usersRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
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
        useWebWorker: true
      };
      const compressedFile = await imageCompression(selectedImage, options);
      
      const filePath = `${productId}_${compressedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      const payload: any = {
        id: productId,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        stock: data.stock,
        is_featured: !!data.is_featured,
        image_url: publicUrl,
        imageUrl: publicUrl,
        rating: 5.0,
        created_at: new Date().toISOString()
      };

      let { error: insertError } = await supabase.from('products').insert(payload);
      
      // If it fails because imageUrl / is_featured / stock columns don't exist, we try a stripped-down fallback
      if (insertError && insertError.message && insertError.message.includes('Could not find')) {
        console.warn("Retrying with stripped down payload due to missing columns...", insertError);
        const strippedPayload = {
          id: productId,
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          image_url: publicUrl,
          created_at: new Date().toISOString()
        };
        const fallbackRes = await supabase.from('products').insert(strippedPayload);
        insertError = fallbackRes.error;
      }
      
      if (insertError) {
         console.error("Supabase Insert Error:", insertError);
         throw new Error(insertError.message || JSON.stringify(insertError));
      }
      
      setIsAddingProduct(false);
      reset();
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      fetchData();
      
    } catch (error: any) {
      console.error("Upload Error:", error);
      alert("Error saving product: " + (error.message || "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase.from('orders').delete().eq('id', orderId).select();
      if (error) throw error;
      
      // If data is empty, it means RLS prevented deletion (0 rows deleted)
      if (!data || data.length === 0) {
        alert("Action blocked by database. Please run the RLS Delete Policy in SQL editor.");
        return;
      }
      
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase.from('products').delete().eq('id', productId).select();
      if (error) throw error;
      
      if (data && data.length > 0) {
        setProducts(products.filter(p => p.id !== productId));
      }
    } catch (error) {
       console.error("Error deleting product:", error);
    }
  };

  const saveProductPrice = async (productId: string) => {
    try {
      await supabase.from('products').update({ price: editPrice }).eq('id', productId);
      setProducts(products.map(p => p.id === productId ? { ...p, price: editPrice } : p));
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
        description: 'Discount Coupon',
        price: newCoupon.discountPercent, // Store discount percent as price for easy retrieval
        category: 'coupon',
        stock: 9999,
        image_url: 'coupon',
        imageUrl: 'coupon',
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('products').insert([payload]);
      if (error) {
         // Fallback if schema doesn't match
         await supabase.from('products').insert([{
           id: couponId,
           name: newCoupon.code.toUpperCase(),
           description: 'Discount Coupon',
           price: newCoupon.discountPercent,
           category: 'coupon',
           image_url: 'coupon',
           created_at: new Date().toISOString()
         }]);
      }
      
      setNewCoupon({ code: '', discountPercent: 0 });
      setIsAddingCoupon(false);
      fetchData(); // Refresh the list
    } catch (err) {
      console.error(err);
      alert("Could not add coupon.");
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      await supabase.from('products').delete().eq('id', couponId);
      setCoupons(coupons.filter(c => c.id !== couponId));
    } catch (error) {
       console.error("Error deleting coupon:", error);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await supabase.from('users').delete().eq('id', userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
       console.error("Error deleting user:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!user) return null;

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 border-b border-gray-100">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight shrink-0 mr-4">SnapCase Admin</h1>
          <div className="flex gap-2 shrink-0">
             <Button variant={activeTab === 'products' ? 'primary' : 'outline'} onClick={() => setActiveTab('products')}>
               Products
            </Button>
            <Button variant={activeTab === 'orders' ? 'primary' : 'outline'} onClick={() => setActiveTab('orders')}>
               Orders
            </Button>
             <Button variant={activeTab === 'users' ? 'primary' : 'outline'} onClick={() => setActiveTab('users')}>
               Users
            </Button>
            <Button variant={activeTab === 'coupons' ? 'primary' : 'outline'} onClick={() => setActiveTab('coupons')}>
               Coupons
            </Button>
             <Button variant={activeTab === 'settings' ? 'primary' : 'outline'} onClick={() => setActiveTab('settings')}>
               Settings
            </Button>
            <Button variant="outline" onClick={handleLogout} className="text-red-500">
               Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface p-6 rounded-3xl shadow-premium flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex flex-shrink-0 items-center justify-center"><Package /></div>
            <div>
              <p className="text-text-muted text-sm">Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-3xl shadow-premium flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex flex-shrink-0 items-center justify-center"><ShoppingCart /></div>
            <div>
              <p className="text-text-muted text-sm">Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-3xl shadow-premium flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex flex-shrink-0 items-center justify-center"><Users /></div>
            <div>
              <p className="text-text-muted text-sm">Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>

        {activeTab === 'products' && (
          <div className="bg-surface p-6 rounded-3xl shadow-premium">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Manage Products</h2>
              <Button onClick={() => setIsAddingProduct(!isAddingProduct)}>
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </div>

            {isAddingProduct && (
              <form onSubmit={handleSubmit(onAddProduct)} className="mb-8 p-6 bg-gray-50 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Name" {...register('name')} error={errors.name?.message} />
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-text-main mb-1.5">Category</label>
                    <select 
                      {...register('category')}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Select Category</option>
                      <option value="Apple">Apple</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Mi">Mi</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>}
                  </div>
                  <Input label="Price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} error={errors.price?.message} />
                  <Input label="Stock" type="number" {...register('stock', { valueAsNumber: true })} error={errors.stock?.message} />
                  
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="is_featured" {...register('is_featured')} className="w-4 h-4 text-primary" />
                    <label htmlFor="is_featured" className="text-sm font-medium">Show in Hero Section (Featured)</label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-main mb-1.5">Product Image (Required)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-main mb-1.5">Description</label>
                    <textarea 
                      {...register('description')} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      rows={3}
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsAddingProduct(false)} disabled={isUploading}>Cancel</Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Save Product'}
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
                  {products.map(product => (
                    <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="py-4 flex items-center gap-3">
                        <img src={product.image_url || product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-contain bg-white border border-gray-100" />
                        <span className="font-medium text-sm">{product.name}</span>
                      </td>
                      <td className="py-4 text-sm text-text-muted">{product.category}</td>
                      <td className="py-4 text-sm text-text-muted">{product.is_featured ? 'Yes' : 'No'}</td>
                      <td className="py-4 text-sm font-medium">
                        {editingProductId === product.id ? (
                           <input 
                             type="number" 
                             value={editPrice} 
                             onChange={(e) => setEditPrice(Number(e.target.value))}
                             className="w-20 px-2 py-1 border rounded"
                             autoFocus
                           />
                        ) : (
                          `$${product.price.toFixed(2)}`
                        )}
                      </td>
                      <td className="py-4 text-right">
                         <div className="flex justify-end gap-2">
                           {editingProductId === product.id ? (
                              <button onClick={() => saveProductPrice(product.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Save Price">
                                <Check className="w-4 h-4" />
                              </button>
                           ) : (
                              <button onClick={() => { setEditingProductId(product.id); setEditPrice(product.price); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit Price">
                                <Edit2 className="w-4 h-4" />
                              </button>
                           )}
                           <button onClick={() => deleteProduct(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
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

        {activeTab === 'orders' && (
          <div className="bg-surface p-6 rounded-3xl shadow-premium">
            <h2 className="text-xl font-semibold mb-6">Manage Orders (Manual Checkout & Tracking)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 text-text-muted text-sm">
                    <th className="pb-3 font-medium">Order details</th>
                    <th className="pb-3 font-medium">Customer Details</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Payment Proof</th>
                    <th className="pb-3 font-medium tracking-tight text-right">Status & Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="py-4">
                        <div className="text-sm font-medium">#{order.id}</div>
                        <div className="text-xs text-text-muted">{new Date(order.created_at).toLocaleDateString()}</div>
                        <div className="text-xs mt-1 max-w-[200px] truncate text-primary font-medium" title={Array.isArray(order.items) ? order.items.map((i: any) => i.name).join(', ') : 'Items hidden'}>
                          {Array.isArray(order.items) ? `${order.items.length} items (Hover)` : 'View Details'}
                        </div>
                      </td>
                      <td className="py-4">
                         <div className="text-sm font-medium">{order.customer_details?.name || 'N/A'}</div>
                         <div className="text-xs text-text-muted max-w-[250px]">{order.customer_details?.phone || 'No phone'}</div>
                         <div className="text-[10px] text-gray-400 mt-1 max-w-[200px] truncate" title={order.customer_details?.address || order.shipping_address}>
                           {order.customer_details?.address || order.shipping_address}
                         </div>
                         {order.customer_details?.coupon && <div className="text-[10px] mt-1 bg-green-100 text-green-700 px-2 rounded-full inline-block">Coupon: {order.customer_details.coupon}</div>}
                      </td>
                      <td className="py-4 text-sm font-bold text-green-600">${(order.total_amount || 0).toFixed(2)}</td>
                      <td className="py-4">
                         {order.payment_proof_url ? (
                           <div className="flex flex-col gap-2">
                             <a href={order.payment_proof_url} target="_blank" rel="noreferrer" className="block max-w-[80px] rounded-lg overflow-hidden border border-gray-200">
                               <img src={order.payment_proof_url} alt="Proof" className="w-full h-auto object-cover max-h-[60px]" />
                             </a>
                             <a href={order.payment_proof_url} target="_blank" rel="noreferrer" className="flex items-center text-[10px] gap-1 text-blue-600 hover:text-blue-800 font-medium">
                               <ExternalLink className="w-3 h-3" /> View full
                             </a>
                           </div>
                         ) : (
                           <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-1 rounded-md">Not uploaded</span>
                         )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:border-primary font-medium w-[140px]"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Payment Approved">Payment Approved</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                          <button onClick={() => deleteOrder(order.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete Order">
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

        {activeTab === 'users' && (
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
                    {users.map(u => (
                       <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                         <td className="py-4">
                           <div className="flex items-center gap-3">
                              <img src={u.photo_url || `https://ui-avatars.com/api/?name=${u.display_name || u.email}&background=random`} alt="user" className="w-10 h-10 rounded-full" />
                              <div>
                                 <p className="text-sm font-bold">{u.display_name || 'No Name'}</p>
                                 <p className="text-xs text-text-muted">{u.email}</p>
                              </div>
                           </div>
                         </td>
                         <td className="py-4 capitalize font-medium text-sm">
                           <span className={u.role === 'admin' ? 'text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md' : 'text-gray-600'}>
                             {u.role}
                           </span>
                         </td>
                         <td className="py-4 text-xs text-text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                         <td className="py-4 text-right">
                            {u.email !== 'haljibon5@gmail.com' && (
                               <Button variant="outline" size="sm" onClick={() => deleteUser(u.id)} className="text-red-500 hover:bg-red-50">
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

        {activeTab === 'coupons' && (
          <div className="bg-surface p-6 rounded-3xl shadow-premium">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Manage Coupons</h2>
              <Button onClick={() => setIsAddingCoupon(!isAddingCoupon)}>
                <Plus className="w-4 h-4 mr-2" /> Add Coupon
              </Button>
            </div>

            {isAddingCoupon && (
              <form onSubmit={handleAddCoupon} className="mb-8 p-6 bg-gray-50 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Coupon Code (e.g. PROMO50)" 
                    value={newCoupon.code} 
                    onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                    placeholder="SUMMER20"
                    required
                  />
                  <Input 
                    label="Discount Percentage (%)" 
                    type="number" 
                    value={newCoupon.discountPercent} 
                    onChange={e => setNewCoupon({...newCoupon, discountPercent: Number(e.target.value)})}
                    placeholder="15"
                    min="1"
                    max="100"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsAddingCoupon(false)}>Cancel</Button>
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
                    <tr><td colSpan={4} className="py-8 text-center text-text-muted">No coupons configured yet. Add one above.</td></tr>
                  ) : coupons.map(coupon => (
                    <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50/50">
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
                         <button onClick={() => deleteCoupon(coupon.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                           <Trash2 className="w-5 h-5" />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
           <div className="bg-surface p-6 rounded-3xl shadow-premium">
             <h2 className="text-xl font-semibold mb-4">Store Settings</h2>
             
             <div className="max-w-2xl">
               <div className="mb-8">
                 <h3 className="text-lg font-medium mb-3">Bank / Manual Payment Instructions</h3>
                 <p className="text-sm text-text-muted mb-4">These instructions will be shown to users during the checkout process.</p>
                 <textarea 
                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary min-h-[150px]"
                   value={bankDetails}
                   onChange={(e) => setBankDetails(e.target.value)}
                   placeholder="e.g. Please transfer to bKash 01700-000000"
                 />
                 <Button 
                   className="mt-4"
                   onClick={async () => {
                     try {
                        const payload = {
                          id: 'store_settings',
                          name: 'System Internal Settings',
                          description: bankDetails,
                          price: 0,
                          category: 'system',
                          stock: 0,
                          image_url: 'system',
                          imageUrl: 'system',
                          created_at: new Date().toISOString()
                        };
                        const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
                        
                        if (error && error.message.includes('Could not find')) {
                           await supabase.from('products').upsert({
                             id: 'store_settings',
                             name: 'System Internal Settings',
                             description: bankDetails,
                             price: 0,
                             category: 'system',
                             image_url: 'system',
                             created_at: new Date().toISOString()
                           }, { onConflict: 'id' });
                        }
                        alert('Settings saved successfully!');
                     } catch (e) {
                        alert('Error saving settings');
                     }
                   }}
                 >
                   Save Payment Instructions
                 </Button>
               </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
