import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmojdzbbqqzlevyzfgiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtb2pkemJicXF6bGV2eXpmZ2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODk2OTUsImV4cCI6MjA4NDU2NTY5NX0.BHuGqZmywumT0wCQQZwryKmhljAxWT4ml-nHnjz2MRU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { count, error } = await supabase
        .from('user_details')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting user_details:', error);
    } else {
        console.log(`Total users in DB: ${count}`);
    }
}

check();
