
import { createClient } from '@supabase/supabase-js';

// Configuration for the Verification Supabase (User Records)
const verificationSupabaseUrl = 'https://tmojdzbbqqzlevyzfgiw.supabase.co';
const verificationSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtb2pkemJicXF6bGV2eXpmZ2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODk2OTUsImV4cCI6MjA4NDU2NTY5NX0.BHuGqZmywumT0wCQQZwryKmhljAxWT4ml-nHnjz2MRU';

export const verificationSupabase = createClient(verificationSupabaseUrl, verificationSupabaseAnonKey);
