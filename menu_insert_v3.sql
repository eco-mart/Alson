
-- 1. Add price column if it doesn't exist (and category if not exists)
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS price NUMERIC;

-- 2. Clear existing entries to start fresh with structured data
DELETE FROM food_items;

-- 3. Insert items with separated Category, Name, and Price
INSERT INTO food_items (category, name, price) VALUES
-- BEVERAGES
('Beverages', 'Soft Drink', 50),
('Beverages', 'Watermelon Juice', 100),
('Beverages', 'Local Tea (Black)', 20),
('Beverages', 'Milk Tea', 35),
('Beverages', 'Instant Coffee Black', 30),
('Beverages', 'Instant Coffee Milk', 35),
('Beverages', 'Hot Lemon', 25),
('Beverages', 'Lemon Tea', 25),
('Beverages', 'Hot Lemon with Honey', 65),
('Beverages', 'Hot Milk', 40),
('Beverages', 'Plain Lassi', 120),
('Beverages', 'Banana Lassi', 150),

-- BREAKFAST
('Breakfast', 'Chana', 40),
('Breakfast', 'Aloo', 40),
('Breakfast', 'Tarkari', 40),
('Breakfast', 'Dalbh', 45),
('Breakfast', 'Garlic Bread (2pc)', 30),
('Breakfast', 'Butter Toast', 30),
('Breakfast', 'Jam Toast', 20),
('Breakfast', 'Bread Toast', 20),
('Breakfast', 'Boiled Egg', 30),
('Breakfast', 'Single Masala Omelet', 40),
('Breakfast', 'Double Masala Omelet', 80),
('Breakfast', 'Plain Single Omelet', 40),
('Breakfast', 'Plain Double Omelet', 75),
('Breakfast', 'Samosa', 30),
('Breakfast', 'Chicken Sausage (1pc)', 50),
('Breakfast', 'Mixed Fruits', 160),
('Breakfast', 'Breakfast Set (Egg, Aloo, Dal, Roti, Tea/Coffee)', 175),

-- SNACKS
('Snacks', 'Potato Wedges', 100),
('Snacks', 'French Fries', 110),
('Snacks', 'Paneer Chilly', 240),
('Snacks', 'Chips Chilly', 130),
('Snacks', 'Chicken Chilly', 240),
('Snacks', 'Sausage Chilly', 220),
('Snacks', 'Egg Chilli Fry', 120),

-- WAI-WAI
('Wai-Wai', 'Wai-Wai Sadheko', 60),
('Wai-Wai', 'Veg Wai-Wai Fry/Soup', 75),
('Wai-Wai', 'Egg Wai-Wai Fry/Soup', 100),
('Wai-Wai', 'Mixed Wai-Wai Fry/Soup', 120),
('Wai-Wai', 'Chicken Wai-Wai Fry/Soup', 150),
('Wai-Wai', 'ING Fried Rice', 250),

-- FRIED RICE & NOODLES
('Fried Rice & Noodles', 'Veg Fried Rice', 100),
('Fried Rice & Noodles', 'Egg Fried Rice', 125),
('Fried Rice & Noodles', 'Chicken Fried Rice', 150),
('Fried Rice & Noodles', 'Mixed Fried Rice', 175),

-- MO:MO
('Momo', 'Veg Momo Steam', 100),
('Momo', 'Veg Momo Fried', 140),
('Momo', 'Veg Momo Jhol', 150),
('Momo', 'Veg C-Momo', 175),
('Momo', 'Veg Momo Chilli', 185),
('Momo', 'Buff Momo Steam', 140),
('Momo', 'Buff Momo Fried', 160),
('Momo', 'Buff Momo Jhol', 170),
('Momo', 'Buff C-Momo', 185),
('Momo', 'Buff Momo Chilli', 195),
('Momo', 'Chicken Momo Steam', 150),
('Momo', 'Chicken Momo Fried', 170),
('Momo', 'Chicken Momo Jhol', 180),
('Momo', 'Chicken C-Momo', 195),
('Momo', 'Chicken Momo Chilli', 205),

-- SANDWICH & BURGER
('Sandwich & Burger', 'Veg Sandwich', 140),
('Sandwich & Burger', 'Cheese Sandwich', 190),
('Sandwich & Burger', 'Chicken Sandwich', 240),
('Sandwich & Burger', 'Club Sandwich', 350),

-- SOUP & THUKPA
('Soup & Thukpa', 'Veg Soup', 100),
('Soup & Thukpa', 'Chicken Soup', 120),
('Soup & Thukpa', 'Veg Thukpa', 125),
('Soup & Thukpa', 'Egg Thukpa', 150),
('Soup & Thukpa', 'Chicken Thukpa', 170),
('Soup & Thukpa', 'Mixed Thukpa', 180),

-- RICE THALI
('Rice Thali', 'Veg Thali', 160),
('Rice Thali', 'Chicken Thali', 210),
('Rice Thali', 'Paneer Thali', 210),

-- DAY SPECIAL MENU
('Day Special Menu', 'Chicken Tandoori', 300),
('Day Special Menu', 'Chicken Butter Masala', 300),
('Day Special Menu', 'Chicken Curry', 280),
('Day Special Menu', 'Paneer Butter Masala', 280),
('Day Special Menu', 'Chicken Sekuwa', 300);
