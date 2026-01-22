import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || 'https://wiyycwcjqbpsoksueomb.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpeXljd2NqcWJwc29rc3Vlb21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzIwMDEsImV4cCI6MjA4NDQ0ODAwMX0.7PGZEsQf5rINI8QXGpbFPXncW3sTspAaFco5F900_Vw';

const supabase = createClient(url, key);

async function check() {
    console.log('Checking public.users in Original Supabase...');
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Table exists. Data:', data);
    }
}

check();
