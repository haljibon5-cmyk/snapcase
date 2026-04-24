import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    comment: ''
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
        id: `contact_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: formData.name || 'Anonymous',
        description: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          comment: formData.comment,
          status: 'new'
        }),
        price: 0,
        category: 'contact_message',
        stock: 0
      };

      const { error: dbError } = await supabase
        .from('products')
        .insert([payload]);

      if (dbError) {
        throw dbError;
      }
      
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', comment: '' });
    } catch (err: any) {
      console.error('Error submitting contact form:', err);
      // Wait, what if table doesn't exist? Error will be logged.
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-16 px-6 max-w-3xl mx-auto min-h-screen">
      <h1 className="text-4xl font-serif text-[#8a3359] mb-8 text-center">Contact</h1>
      
      {success ? (
        <div className="bg-green-50 text-green-800 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2">Thank you!</h2>
          <p>Your message has been sent successfully. We will get back to you soon.</p>
          <Button 
            className="mt-6 bg-[#ebccd8] text-white hover:bg-[#d9b3c4]"
            onClick={() => setSuccess(false)}
          >
            Send Another Message
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label=""
                placeholder="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white border-gray-300"
              />
            </div>
            <div>
              <Input
                label=""
                placeholder="Email *"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white border-gray-300"
              />
            </div>
          </div>
          
          <div>
            <Input
              label=""
              placeholder="Phone number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-white border-gray-300"
            />
          </div>
          
          <div>
            <textarea
              name="comment"
              placeholder="Comment"
              rows={5}
              value={formData.comment}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#ebccd8] focus:border-[#ebccd8] transition-all bg-white resize-y"
            ></textarea>
          </div>
          
          <div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#ebccd8] hover:bg-[#d9b3c4] text-white px-8 py-3 rounded-full font-medium transition-colors"
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
