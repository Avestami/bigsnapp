-- Drop existing tables if they exist
DROP TABLE IF EXISTS admin_action_log CASCADE;
DROP TABLE IF EXISTS topup_request CASCADE;
DROP TABLE IF EXISTS wallet_transaction CASCADE;
DROP TABLE IF EXISTS delivery_status_history CASCADE;
DROP TABLE IF EXISTS delivery_assignment CASCADE;
DROP TABLE IF EXISTS delivery_review CASCADE;
DROP TABLE IF EXISTS delivery_request CASCADE;
DROP TABLE IF EXISTS log CASCADE;
DROP TABLE IF EXISTS favorite_location CASCADE;
DROP TABLE IF EXISTS user_device CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS payment_method CASCADE;
DROP TABLE IF EXISTS ride_review CASCADE;
DROP TABLE IF EXISTS ride CASCADE;
DROP TABLE IF EXISTS location CASCADE;
DROP TABLE IF EXISTS vehicle CASCADE;
DROP TABLE IF EXISTS vehiclemodel CASCADE;
DROP TABLE IF EXISTS vehicle_type CASCADE;
DROP TABLE IF EXISTS driver CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS wallet CASCADE;

-- Create tables
CREATE TABLE wallet (
    wallet_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE,
    balance_rial BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    password_hash TEXT,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_type VARCHAR(10) CHECK (user_type IN ('driver', 'rider', 'admin')),
    phone_number VARCHAR(15) UNIQUE,
    wallet_id INT UNIQUE REFERENCES wallet(wallet_id),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(6),
    verification_expiry TIMESTAMP,
    last_login TIMESTAMP,
    profile_image_url TEXT
);

-- Add foreign key constraint after user table is created
ALTER TABLE wallet ADD CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES "user"(user_id);

CREATE TABLE driver (
    driver_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES "user"(user_id),
    license_number VARCHAR(50) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT FALSE,
    current_location_lat DOUBLE PRECISION,
    current_location_lng DOUBLE PRECISION,
    rating DECIMAL(3,2) DEFAULT 0,
    total_trips INT DEFAULT 0,
    total_deliveries INT DEFAULT 0,
    earnings_today BIGINT DEFAULT 0,
    last_location_update TIMESTAMP
);

CREATE TABLE vehicle_type (
    type_id SERIAL PRIMARY KEY,
    max_weight FLOAT,
    name VARCHAR(50),
    passenger_capacity INT,
    has_cargo_box BOOLEAN,
    base_fare BIGINT,
    per_km_fare BIGINT,
    per_minute_fare BIGINT,
    minimum_fare BIGINT
);

CREATE TABLE vehiclemodel (
    model_id SERIAL PRIMARY KEY,
    brand VARCHAR(50),
    model_name VARCHAR(50),
    year INT
);

CREATE TABLE vehicle (
    vehicle_id SERIAL PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE,
    driver_id INT REFERENCES driver(driver_id),
    color VARCHAR(30),
    model_id INT REFERENCES vehiclemodel(model_id),
    vehicle_type_id INT REFERENCES vehicle_type(type_id),
    is_approved BOOLEAN DEFAULT FALSE,
    inspection_date DATE,
    insurance_expiry DATE
);

CREATE TABLE location (
    location_id SERIAL PRIMARY KEY,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    city VARCHAR(100),
    district VARCHAR(100),
    postal_code VARCHAR(20)
);

CREATE TABLE ride (
    ride_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES "user"(user_id),
    driver_id INT REFERENCES driver(driver_id),
    vehicle_id INT REFERENCES vehicle(vehicle_id),
    fare BIGINT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    pickup_location_id INT REFERENCES location(location_id),
    drop_off_location_id INT REFERENCES location(location_id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled')),
    distance_km FLOAT,
    duration_minutes INT,
    payment_method VARCHAR(20) DEFAULT 'wallet',
    cancellation_reason TEXT,
    cancelled_by VARCHAR(10) CHECK (cancelled_by IN ('rider', 'driver', 'system')),
    estimated_fare BIGINT,
    surge_multiplier DECIMAL(3,2) DEFAULT 1.0
);

CREATE TABLE ride_review (
    review_id SERIAL PRIMARY KEY,
    target_driver_id INT REFERENCES driver(driver_id),
    ride_id INT UNIQUE REFERENCES ride(ride_id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewer_id INT REFERENCES "user"(user_id),
    comment TEXT
);

CREATE TABLE payment_method (
    method_id SERIAL PRIMARY KEY,
    type VARCHAR(20) UNIQUE
);

-- Insert default payment methods
INSERT INTO payment_method (type) VALUES ('wallet'), ('cash'), ('card');

CREATE TABLE payment (
    payment_id SERIAL PRIMARY KEY,
    ride_id INT REFERENCES ride(ride_id),
    user_id INT REFERENCES "user"(user_id),
    amount BIGINT,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method_id INT REFERENCES payment_method(method_id),
    paid_at TIMESTAMP,
    transaction_reference VARCHAR(100)
);

CREATE TABLE user_device (
    device_id SERIAL PRIMARY KEY,
    device_type VARCHAR(50),
    user_id INT REFERENCES "user"(user_id),
    token TEXT,
    platform VARCHAR(20) CHECK (platform IN ('ios', 'android', 'web')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favorite_location (
    fav_id SERIAL PRIMARY KEY,
    location_id INT REFERENCES location(location_id),
    user_id INT REFERENCES "user"(user_id),
    name VARCHAR(50),
    icon VARCHAR(50)
);

CREATE TABLE log (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES "user"(user_id),
    action TEXT,
    time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE TABLE delivery_request (
    delivery_id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES "user"(user_id),
    receiver_id INT REFERENCES "user"(user_id),
    weight_kg FLOAT,
    pickup_location_id INT REFERENCES location(location_id),
    drop_off_location_id INT REFERENCES location(location_id),
    vehicle_type_id INT REFERENCES vehicle_type(type_id),
    value_rial BIGINT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'picking_up', 'in_transit', 'delivered', 'cancelled', 'returned')),
    scheduled_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    package_description TEXT,
    receiver_phone VARCHAR(15),
    receiver_name VARCHAR(100),
    delivery_instructions TEXT,
    photo_url TEXT,
    delivery_code VARCHAR(6),
    estimated_fare BIGINT
);

CREATE TABLE delivery_review (
    review_id SERIAL PRIMARY KEY,
    delivery_id INT UNIQUE REFERENCES delivery_request(delivery_id),
    reviewer_id INT REFERENCES "user"(user_id),
    target_driver_id INT REFERENCES driver(driver_id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE delivery_assignment (
    delivery_id INT PRIMARY KEY REFERENCES delivery_request(delivery_id),
    driver_id INT REFERENCES driver(driver_id),
    vehicle_id INT REFERENCES vehicle(vehicle_id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    picked_up_at TIMESTAMP,
    delivered_at TIMESTAMP,
    delivery_proof_url TEXT,
    recipient_signature_url TEXT
);

CREATE TABLE delivery_status_history (
    delivery_id INT REFERENCES delivery_request(delivery_id),
    status_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    notes TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    PRIMARY KEY (delivery_id, status_time)
);

CREATE TABLE wallet_transaction (
    transaction_id SERIAL PRIMARY KEY,
    wallet_id INT REFERENCES wallet(wallet_id),
    amount_rial BIGINT,
    description TEXT,
    type VARCHAR(20) CHECK (type IN ('topup', 'payment', 'payout', 'refund', 'penalty', 'earning')),
    reference_type VARCHAR(20) CHECK (reference_type IN ('ride', 'delivery', 'topup', 'manual')),
    reference_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'failed')) DEFAULT 'pending',
    balance_after BIGINT
);

CREATE TABLE topup_request (
    topup_id SERIAL PRIMARY KEY,
    wallet_id INT REFERENCES wallet(wallet_id),
    amount_rial BIGINT,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    payment_gateway VARCHAR(50),
    gateway_reference VARCHAR(100),
    failure_reason TEXT
);

CREATE TABLE admin_action_log (
    action_id SERIAL PRIMARY KEY,
    admin_id INT REFERENCES "user"(user_id),
    action_type VARCHAR(50),
    target_user_id INT REFERENCES "user"(user_id),
    target_vehicle_id INT REFERENCES vehicle(vehicle_id),
    target_ride_id INT REFERENCES ride(ride_id),
    target_delivery_id INT REFERENCES delivery_request(delivery_id),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_user_phone ON "user"(phone_number);
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_driver_available ON driver(is_available, is_verified);
CREATE INDEX idx_driver_location ON driver(current_location_lat, current_location_lng);
CREATE INDEX idx_ride_status ON ride(status);
CREATE INDEX idx_ride_user ON ride(user_id);
CREATE INDEX idx_ride_driver ON ride(driver_id);
CREATE INDEX idx_delivery_status ON delivery_request(status);
CREATE INDEX idx_delivery_sender ON delivery_request(sender_id);
CREATE INDEX idx_wallet_user ON wallet(user_id);
CREATE INDEX idx_transaction_wallet ON wallet_transaction(wallet_id);
CREATE INDEX idx_location_coords ON location(latitude, longitude);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallet_updated_at BEFORE UPDATE ON wallet
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 