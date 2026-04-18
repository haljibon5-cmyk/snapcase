import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const code = fs.readFileSync('src/lib/supabase.ts', 'utf8');
const urlMatch = code.match(/supabaseUrl = ['"]([^'"]+)['"]/);
const keyMatch = code.match(/supabaseAnonKey = ['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  (async () => {
    try {
      const {data, error} = await supabase.from('products').select('*').limit(1);
      console.log("Products result Error:", error);
      console.log("Products result Data:", data);
    } catch(e) {
      console.error("Caught:", e);
    }
  })();
}
