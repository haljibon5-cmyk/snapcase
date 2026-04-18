import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have an active session (Supabase automatically handles the hash in the URL)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      }
    });
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      // Sign out the user so they have to log in with their new password
      await supabase.auth.signOut();
      
      setMessage('Password updated successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-3xl shadow-premium">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-text-muted mt-2">Enter your new password below.</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6">{error}</div>}
        {message && <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm mb-6">{message}</div>}

        <form onSubmit={handleReset} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Confirm
          </Button>
        </form>
      </div>
    </div>
  );
}
