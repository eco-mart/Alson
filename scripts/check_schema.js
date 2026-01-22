import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log("Checking food_items table structure...");

    // We can't query information_schema directly with anon key usually, 
    // but we can try to fetch one row and check the types of keys.
    const { data, error } = await supabase.from('food_items').select('*').limit(1);

    if (error) {
        console.error("Error fetching food_items:", error);
    } else if (data.length > 0) {
        const item = data[0];
        console.log("Sample Item ID:", item.id, "Type:", typeof item.id);
        console.log("Sample Item Price:", item.price, "Type:", typeof item.price);
    } else {
        console.log("No items in food_items table.");
    }
}

checkSchema();
