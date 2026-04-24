import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function Returns() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    orderNumber: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        id: `return_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: `${formData.firstName} ${formData.lastName}`.trim() || 'Anonymous',
        description: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          orderNumber: formData.orderNumber,
          reason: formData.reason,
          status: 'new'
        }),
        price: 0,
        category: 'return_request',
        stock: 0
      };

      const { error: dbError } = await supabase
        .from('products')
        .insert([payload]);

      if (dbError) {
        throw dbError;
      }
      
      setSuccess(true);
      setFormData({ firstName: '', lastName: '', email: '', orderNumber: '', reason: '' });
    } catch (err: any) {
      console.error('Error submitting return request:', err);
      setError(err.message || 'Failed to submit return request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-16 px-6 max-w-3xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Returns/Exchanges</h1>
      <p className="text-center text-gray-600 mb-8">Complete this form to submit a return/exchange inquiry.</p>
      
      {success ? (
        <div className="bg-green-50 text-green-800 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2">Thank you!</h2>
          <p>Your return/exchange request has been received. We’ll follow up with you shortly.</p>
          <Button 
            className="mt-6 bg-[#222222] text-white hover:bg-black"
            onClick={() => setSuccess(false)}
          >
            Submit Another Request
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Input
                label=""
                placeholder="First name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-white border-gray-300 rounded-md"
              />
            </div>
            <div>
              <Input
                label=""
                placeholder="Last name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-white border-gray-300 rounded-md"
              />
            </div>
            <div>
              <Input
                label=""
                placeholder="Email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white border-gray-300 rounded-md"
              />
            </div>
            <div>
              <Input
                label=""
                placeholder="Order Number"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                className="w-full bg-white border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div>
            <textarea
              name="reason"
              placeholder="Please explain the reason for your return/exchange in as much detail as possible."
              rows={5}
              value={formData.reason}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-white resize-y"
            ></textarea>
          </div>
          
          <div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#222222] hover:bg-black text-white px-8 py-3 rounded-md font-medium transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
          <p className="text-xs text-center text-gray-500 mt-4 leading-relaxed">
            By signing up, you agree to receive marketing emails. View our privacy policy and terms of service for more info.
          </p>
        </form>
      )}
    </div>
  );
}
