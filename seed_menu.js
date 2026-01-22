
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file manually to avoid adding dotenv dependency
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const menuData = [
    // BEVERAGES
    "Soft Drink — 50",
    "Watermelon Juice — 100",
    "Local Tea (Black) — 20",
    "Milk Tea — 35",
    "Instant Coffee Black — 30",
    "Instant Coffee Milk — 35",
    "Hot Lemon — 25",
    "Lemon Tea — 25",
    "Hot Lemon with Honey — 65",
    "Hot Milk — 40",
    "Plain Lassi — 120",
    "Banana Lassi — 150",

    // BREAKFAST
    "Chana — 40",
    "Aloo — 40",
    "Tarkari — 40",
    "Dalbh — 45",
    "Garlic Bread (2pc) — 30",
    "Butter Toast — 30",
    "Jam Toast — 20",
    "Bread Toast — 20",
    "Boiled Egg — 30",
    "Single Masala Omelet — 40",
    "Double Masala Omelet — 80",
    "Plain Single Omelet — 40",
    "Plain Double Omelet — 75",
    "Samosa — 30",
    "Chicken Sausage (1pc) — 50",
    "Mixed Fruits — 160",
    "Breakfast Set (Egg, Aloo, Dal, Roti, Tea/Coffee) — 175",

    // SNACKS
    "Potato Wedges — 100",
    "French Fries — 110",
    "Paneer Chilly — 240",
    "Chips Chilly — 130",
    "Chicken Chilly — 240",
    "Sausage Chilly — 220",
    "Egg Chilli Fry — 120",

    // WAI-WAI
    "Wai-Wai Sadheko — 60",
    "Veg Wai-Wai Fry/Soup — 75",
    "Egg Wai-Wai Fry/Soup — 100",
    "Mixed Wai-Wai Fry/Soup — 120",
    "Chicken Wai-Wai Fry/Soup — 150",
    "ING Fried Rice — 250",

    // FRIED RICE & NOODLES
    "Veg Fried Rice — 100",
    "Egg Fried Rice — 125",
    "Chicken Fried Rice — 150",
    "Mixed Fried Rice — 175",

    // MO:MO
    "Veg Momo Steam — 100",
    "Veg Momo Fried — 140",
    "Veg Momo Jhol — 150",
    "Veg C-Momo — 175",
    "Veg Momo Chilli — 185",
    "Buff Momo Steam — 140",
    "Buff Momo Fried — 160",
    "Buff Momo Jhol — 170",
    "Buff C-Momo — 185",
    "Buff Momo Chilli — 195",
    "Chicken Momo Steam — 150",
    "Chicken Momo Fried — 170",
    "Chicken Momo Jhol — 180",
    "Chicken C-Momo — 195",
    "Chicken Momo Chilli — 205",

    // SANDWICH & BURGER
    "Veg Sandwich — 140",
    "Cheese Sandwich — 190",
    "Chicken Sandwich — 240",
    "Club Sandwich — 350",

    // SOUP & THUKPA
    "Veg Soup — 100",
    "Chicken Soup — 120",
    "Veg Thukpa — 125",
    "Egg Thukpa — 150",
    "Chicken Thukpa — 170",
    "Mixed Thukpa — 180",

    // RICE THALI
    "Veg Thali — 160",
    "Chicken Thali — 210",
    "Paneer Thali — 210",

    // DAY SPECIAL MENU
    "Chicken Tandoori — 300",
    "Chicken Butter Masala — 300",
    "Chicken Curry — 280",
    "Paneer Butter Masala — 280",
    "Chicken Sekuwa — 300"
];

async function seed() {
    console.log('Start seeding...');

    // Transform data to fit the expected "Name - Price" format or just use the raw string if that's preferred.
    // The user input uses "—" (em dash), let's keep it or normalize it. 
    // Given the current app only shows 'name', putting the price in the name is the best way to show it.

    const items = menuData.map(itemStr => {
        return { name: itemStr };
    });

    // Optional: Clear existing items?
    // await supabase.from('food_items').delete().neq('id', 0); 
    // Let's just insert for now.

    const { data, error } = await supabase
        .from('food_items')
        .insert(items)
        .select();

    if (error) {
        console.error('Error seeding data:', error);
    } else {
        console.log(`Successfully added ${data.length} items!`);
    }
}

seed();
