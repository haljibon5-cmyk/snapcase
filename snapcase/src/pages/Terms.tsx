import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import 'react-quill-new/dist/quill.snow.css';

export function Terms() {
  const [termsContent, setTermsContent] = useState('');

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('description')
          .eq('id', 'store_settings')
          .single();
          
        if (data && !error && data.description) {
          try {
            const parsed = JSON.parse(data.description);
            if (parsed.termsContent) {
              setTermsContent(parsed.termsContent);
            }
          } catch(e) {}
        }
      } catch (err) {}
    };
    fetchTerms();
  }, []);

  return (
    <div className="pt-24 pb-16 px-6 max-w-4xl mx-auto min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Terms of Service</h1>
        <div className="max-w-2xl mx-auto">
          <p className="text-lg text-gray-600 leading-relaxed">
            Please read these terms carefully before using our services.
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <div className="p-8 md:p-12 quill-content">
          <div className="ql-snow">
            <div 
              className="ql-editor p-0"
              dangerouslySetInnerHTML={{ 
                __html: termsContent || '<p class="text-center text-gray-500">No terms of service configured yet. Please update from the admin panel.</p>' 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


