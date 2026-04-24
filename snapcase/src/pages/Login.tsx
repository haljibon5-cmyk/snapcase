import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [emailForOtp, setEmailForOtp] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');
    setMessage('');
    
    const { email, password } = formData;

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) {
          console.error(error.message);
          throw error;
        }
        
        // Removed email OTP wait
        
        const user = data?.user;
        if (user?.email === 'haljibon5@gmail.com') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          console.error(error.message);
          throw error;
        }
        
        const user = data?.user;
        if (user?.email === 'haljibon5@gmail.com') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = watch('email');
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage('Password reset link sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1]; // Take last char if pasted
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const token = otp.join('');
    if (token.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailForOtp,
        token,
        type: 'recovery'
      });
      if (error) throw error;
      
      navigate('/reset-password');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
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
          <h1 className="text-2xl font-bold tracking-tight">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-text-muted mt-2">
            {isSignUp ? 'Sign up to start shopping' : 'Enter your details to sign in'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm mb-6">
            {message}
          </div>
        )}

        {awaitingOtp ? (
          <div className="space-y-6">
            <p className="text-center text-sm text-text-muted mb-4">
              Please enter the 6-digit verification code sent to <br/>
              <span className="font-medium text-text-main">{emailForOtp}</span>
            </p>
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => otpRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              ))}
            </div>
            <Button onClick={handleVerifyOtp} className="w-full" size="lg" isLoading={isLoading}>
              Verify & Reset Password
            </Button>
            <button 
              type="button"
              onClick={() => { setAwaitingOtp(false); setError(''); setMessage(''); setOtp(['','','','','','']); }}
              className="w-full text-sm text-text-muted hover:text-primary transition-colors mt-4"
            >
              Back to Sign In
            </button>
          </div>
        ) : isForgotPassword ? (
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Button onClick={handleForgotPassword} className="w-full" size="lg" isLoading={isLoading}>
              Send Reset Link
            </Button>
            <button 
              type="button"
              onClick={() => { setIsForgotPassword(false); setError(''); setMessage(''); }}
              className="w-full text-sm text-text-muted hover:text-primary transition-colors mt-4"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                error={errors.email?.message}
              />
              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                />
                {!isSignUp && (
                  <div className="flex justify-end mt-2">
                    <button 
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(''); setMessage(''); }}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-text-muted">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-medium hover:underline"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
