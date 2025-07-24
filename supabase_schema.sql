-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create drivers table
CREATE TABLE drivers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    vehicle_info JSONB DEFAULT '{}',
    current_location JSONB DEFAULT NULL,
    is_available BOOLEAN DEFAULT true,
    current_order_id UUID DEFAULT NULL,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID DEFAULT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    restaurant_id UUID DEFAULT NULL,
    restaurant_name VARCHAR(255) NOT NULL,
    restaurant_location JSONB NOT NULL,
    delivery_location JSONB NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled')),
    driver_id UUID DEFAULT NULL REFERENCES drivers(id),
    eta TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    actual_delivery_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create driver_locations table for location history
CREATE TABLE driver_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(5,2) DEFAULT NULL,
    speed DECIMAL(5,2) DEFAULT NULL,
    heading DECIMAL(5,2) DEFAULT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_tracking table for tracking history
CREATE TABLE order_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    location JSONB DEFAULT NULL,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_drivers_available ON drivers(is_available) WHERE is_available = true;
CREATE INDEX idx_drivers_location ON drivers USING GIN(current_location);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_driver ON orders(driver_id);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_driver_locations_driver_time ON driver_locations(driver_id, timestamp);
CREATE INDEX idx_order_tracking_order_time ON order_tracking(order_id, timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Drivers can view their own data
CREATE POLICY "Drivers can view own data" ON drivers
    FOR SELECT USING (auth.uid()::text = id::text);

-- Drivers can update their own location and availability
CREATE POLICY "Drivers can update own data" ON drivers
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Anyone can view available drivers
CREATE POLICY "Anyone can view available drivers" ON drivers
    FOR SELECT USING (is_available = true);

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders" ON orders
    FOR SELECT USING (auth.uid()::text = customer_id::text);

-- Drivers can view assigned orders
CREATE POLICY "Drivers can view assigned orders" ON orders
    FOR SELECT USING (auth.uid()::text = driver_id::text);

-- Anyone can create orders
CREATE POLICY "Anyone can create orders" ON orders
    FOR INSERT WITH CHECK (true);

-- Drivers can update assigned orders
CREATE POLICY "Drivers can update assigned orders" ON orders
    FOR UPDATE USING (auth.uid()::text = driver_id::text);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL,
    lon1 DECIMAL,
    lat2 DECIMAL,
    lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        6371 * acos(
            cos(radians(lat1)) * cos(radians(lat2)) *
            cos(radians(lon2) - radians(lon1)) +
            sin(radians(lat1)) * sin(radians(lat2))
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to find nearest available driver
CREATE OR REPLACE FUNCTION find_nearest_driver(
    target_lat DECIMAL,
    target_lon DECIMAL,
    max_distance DECIMAL DEFAULT 10
) RETURNS TABLE (
    driver_id UUID,
    distance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        calculate_distance(target_lat, target_lon, 
                         (d.current_location->>'lat')::DECIMAL, 
                         (d.current_location->>'lng')::DECIMAL) as distance
    FROM drivers d
    WHERE d.is_available = true 
    AND d.current_location IS NOT NULL
    AND calculate_distance(target_lat, target_lon, 
                          (d.current_location->>'lat')::DECIMAL, 
                          (d.current_location->>'lng')::DECIMAL) <= max_distance
    ORDER BY distance
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Enable real-time for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE order_tracking;

-- Insert sample data
INSERT INTO drivers (name, phone, email, vehicle_info, current_location, is_available) VALUES
('John Smith', '+1234567890', 'john@example.com', '{"vehicle_type": "motorcycle", "plate_number": "ABC123"}', '{"lat": 40.7128, "lng": -74.0060}', true),
('Sarah Johnson', '+1234567891', 'sarah@example.com', '{"vehicle_type": "car", "plate_number": "XYZ789"}', '{"lat": 40.7589, "lng": -73.9851}', true),
('Mike Wilson', '+1234567892', 'mike@example.com', '{"vehicle_type": "bicycle", "plate_number": null}', '{"lat": 40.7505, "lng": -73.9934}', true);

INSERT INTO orders (customer_name, customer_phone, restaurant_name, restaurant_location, delivery_location, items, total_amount, status) VALUES
('Alice Brown', '+1987654321', 'Pizza Palace', '{"lat": 40.7128, "lng": -74.0060}', '{"lat": 40.7589, "lng": -73.9851}', '[{"name": "Margherita Pizza", "quantity": 1, "price": 15.99}]', 15.99, 'pending'),
('Bob Davis', '+1987654322', 'Burger Joint', '{"lat": 40.7505, "lng": -73.9934}', '{"lat": 40.7128, "lng": -74.0060}', '[{"name": "Cheeseburger", "quantity": 2, "price": 12.50}]', 25.00, 'confirmed');