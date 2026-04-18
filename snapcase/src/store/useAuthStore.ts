import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  photo_url?: string;
  role: 'user' | 'admin';
  created_at: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAuthReady: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setAuthReady: (ready: boolean) => void;
}

const store = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isAuthReady: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
}));

export const useAuthStore = store;

// Initialize auth state
const initAuth = async () => {
  try {
    // Add a timeout to prevent infinite hanging
    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => resolve({ timeout: true }), 5000)
    );
    
    const sessionPromise = supabase.auth.getSession();
    
    const result = await Promise.race([
      sessionPromise,
      timeoutPromise
    ]) as any;
    
    if (result.timeout) {
      console.warn("Auth initialization timed out. Proceeding without auth.");
      store.getState().setAuthReady(true);
      return;
    }
    
    const { data: { session }, error } = result;
    
    if (error) throw error;
    
    const user = session?.user || null;
    store.getState().setUser(user);
    
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (!profileError && profile) {
        store.getState().setProfile(profile as UserProfile);
      } else if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const role = user.email === 'haljibon5@gmail.com' ? 'admin' : 'user';
        const newProfile = {
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          photo_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          role: role,
          created_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase.from('users').insert(newProfile);
        if (!insertError) {
          store.getState().setProfile(newProfile as UserProfile);
        } else {
          console.error("Error creating user profile in initAuth:", insertError);
          // Fallback to a local profile so the app doesn't break
          store.getState().setProfile(newProfile as UserProfile);
        }
      } else {
        console.error("Error fetching profile in initAuth:", profileError);
        // Fallback to a local profile so the app doesn't break
        const fallbackProfile = {
          id: user.id,
          email: user.email || '',
          role: user.email === 'haljibon5@gmail.com' ? 'admin' : 'user',
          created_at: new Date().toISOString()
        };
        store.getState().setProfile(fallbackProfile as UserProfile);
      }
    }
  } catch (err) {
    console.error("Auth initialization error:", err);
  } finally {
    store.getState().setAuthReady(true);
  }
};

initAuth();

// Listen for auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  const user = session?.user || null;
  store.getState().setUser(user);
  
  if (user) {
    try {
      // Add timeout to prevent hanging on auth state change
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ timeout: true }), 3000)
      );
      
      const profilePromise = supabase.from('users').select('*').eq('id', user.id).single();
      
      const result = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      if (result.timeout) {
        // Just silently use the fallback if it times out
        const fallbackProfile = {
          id: user.id,
          email: user.email || '',
          role: user.email === 'haljibon5@gmail.com' ? 'admin' : 'user',
          created_at: new Date().toISOString()
        };
        store.getState().setProfile(fallbackProfile as UserProfile);
        return;
      }
      
      const { data: profile, error } = result;
        
      if (!error && profile) {
        store.getState().setProfile(profile as UserProfile);
      } else if (error && error.code === 'PGRST116') {
        const role = user.email === 'haljibon5@gmail.com' ? 'admin' : 'user';
        const newProfile = {
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          photo_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          role: role,
          created_at: new Date().toISOString()
        };
        
        try {
          const insertResult = await Promise.race([
            supabase.from('users').insert(newProfile),
            new Promise(r => setTimeout(() => r({ timeout: true }), 3000))
          ]) as any;
          
          store.getState().setProfile(newProfile as UserProfile);
        } catch (e) {
          store.getState().setProfile(newProfile as UserProfile);
        }
      } else {
        // Fallback for other errors without logging to avoid console noise
        const fallbackProfile = {
          id: user.id,
          email: user.email || '',
          role: user.email === 'haljibon5@gmail.com' ? 'admin' : 'user',
          created_at: new Date().toISOString()
        };
        store.getState().setProfile(fallbackProfile as UserProfile);
      }
    } catch (err) {
      // Force fallback profile if there's a user
      const fallbackProfile = {
        id: user.id,
        email: user.email || '',
        role: user.email === 'haljibon5@gmail.com' ? 'admin' : 'user',
        created_at: new Date().toISOString()
      };
      store.getState().setProfile(fallbackProfile as UserProfile);
    }
  } else {
    store.getState().setProfile(null);
  }
});
