import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/Button';
import { Package, LogOut, Settings, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export function Dashboard() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const fetchedOrders = (data || []).map(doc => {
          let parsedItems = [];
          try {
            if (typeof doc.items === 'string') {
              parsedItems = JSON.parse(doc.items);
            } else {
              parsedItems = doc.items || [];
            }
          } catch(e) { console.error("Parse error dashboard", e); }
          return {
            id: doc.id,
            ...doc,
            items: parsedItems
          };
        });

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchOrders();

    // Set up Realtime subscription for orders
    const channel = supabase.channel('dashboard_orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => {
          // Re-fetch on any change (insert, update, delete)
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // 🔥 loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 🔥 not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => navigate('/login')}>Login First</Button>
      </div>
    );
  }

  // 🔥 profile loading
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <div className="w-full md:w-64">
            <div className="bg-surface p-6 rounded-3xl shadow-premium sticky top-24">

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl">
                  {profile.display_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{profile.display_name || 'User'}</h3>
                  <p className="text-sm text-text-muted">{profile.email}</p>
                </div>
              </div>

              <button onClick={handleLogout} className="text-red-500">
                <LogOut /> Logout
              </button>

            </div>
          </div>

          {/* Main */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-8">Order History</h1>

            {orders.length === 0 ? (
              <div className="text-center">
                No orders yet
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="mb-6 border p-4 rounded-xl">

                  <div className="flex justify-between mb-4">
                    <div>
                      <p>Order #{order.id}</p>
                      <p>{format(new Date(order.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <span>{order.status}</span>
                      <p>${order.total_amount}</p>
                    </div>
                  </div>

                  {order.items.map((item: any) => (
                    <div key={item.productId} className="flex gap-4 mb-2">
                      <img src={item.imageUrl} className="w-12 h-12" />
                      <div>
                        <p>{item.name}</p>
                        <p>Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}

                </div>
              ))
            )}

          </div>

        </div>

      </div>
    </div>
  );
}