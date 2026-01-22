import { createClient } from '@supabase/supabase-js';

// Configuration for the Verification Supabase (User Records)
const verificationSupabaseUrl = 'https://tmojdzbbqqzlevyzfgiw.supabase.co';
const verificationSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtb2pkemJicXF6bGV2eXpmZ2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODk2OTUsImV4cCI6MjA4NDU2NTY5NX0.BHuGqZmywumT0wCQQZwryKmhljAxWT4ml-nHnjz2MRU';

const verificationSupabase = createClient(verificationSupabaseUrl, verificationSupabaseAnonKey);

async function testVerification(studentId) {
    console.log(`Testing verification for ID: ${studentId}`);

    try {
        const { data: users, error } = await verificationSupabase
            .from('user_details')
            .select('name, email')
            .ilike('email', `${studentId}@%`)
            .limit(1);

        if (error) {
            console.error('Error:', error);
            return;
        }

        if (users && users.length > 0) {
            console.log('✅ Found User:', users[0]);
        } else {
            console.log('❌ User not found');
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

async function main() {
    // Test with a likely valid ID (from previous `student.csv` view)
    // e.g., np01cp4a250150
    await testVerification('np01cp4a250150');

    // Test with an invalid ID
    await testVerification('np999999');
}

main();
