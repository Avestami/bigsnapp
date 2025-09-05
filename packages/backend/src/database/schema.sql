-- Snapp Clone Database Schema
-- Full normalized schema for ride-hailing and delivery application

-- Create wallet table first (referenced by user table)
CREATE TABLE IF NOT EXISTS wallet (
    wallet_id SERIAL PRIMARY KEY,
    user_id INT,
    balance_rial BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user table
CREATE TABLE IF NOT EXISTS "user" (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    password_hash TEXT,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_type VARCHAR(10) CHECK (user_type IN ('driver', 'rider', 'admin')),
    phone_number VARCHAR(15) UNIQUE,
    wallet_id INT UNIQUE REFERENCES wallet(wallet_id)
);

-- Add foreign key constraint to wallet table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_wallet_user') THEN
        ALTER TABLE wallet ADD CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES "user"(user_id);
    END IF;
END $$;

-- Create driver table
CREATE TABLE IF NOT EXISTS driver (
    driver_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES "user"(user_id),
    license_number VARCHAR(50) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE
);

-- Create vehicle_type table
CREATE TABLE IF NOT EXISTS vehicle_type (
    type_id SERIAL PRIMARY KEY,
    max_weight FLOAT,
    name VARCHAR(50),
    passenger_capacity INT,
    has_cargo_box BOOLEAN
);

-- Create vehiclemodel table
CREATE TABLE IF NOT EXISTS vehiclemodel (
    model_id SERIAL PRIMARY KEY,
    brand VARCHAR(50),
    model_name VARCHAR(50)
);

-- Create vehicle table
CREATE TABLE IF NOT EXISTS vehicle (
    vehicle_id SERIAL PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE,
    driver_id INT REFERENCES driver(driver_id),
    color VARCHAR(30),
    model_id INT REFERENCES vehiclemodel(model_id),
    vehicle_type_id INT REFERENCES vehicle_type(type_id)
);

-- Create location table
CREATE TABLE IF NOT EXISTS location (
    location_id SERIAL PRIMARY KEY,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- Create ride table
CREATE TABLE IF NOT EXISTS ride (
    ride_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES "user"(user_id),
    driver_id INT REFERENCES driver(driver_id),
    fare BIGINT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    pickup_location_id INT REFERENCES location(location_id),
    drop_off_location INT REFERENCES location(location_id),
    status VARCHAR(20) DEFAULT 'pending'
);

-- Create ride_review table
CREATE TABLE IF NOT EXISTS ride_review (
    review_id SERIAL PRIMARY KEY,
    target_driver_id INT REFERENCES driver(driver_id),
    ride_id INT REFERENCES ride(ride_id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewer_id INT REFERENCES "user"(user_id),
    comment TEXT
);

-- Create payment_method table
CREATE TABLE IF NOT EXISTS payment_method (
    method_id SERIAL PRIMARY KEY,
    type VARCHAR(20)
);

-- Create payment table
CREATE TABLE IF NOT EXISTS payment (
    payment_id SERIAL PRIMARY KEY,
    ride_id INT REFERENCES ride(ride_id),
    user_id INT REFERENCES "user"(user_id),
    amount BIGINT,
    status VARCHAR(20),
    payment_method_id INT REFERENCES payment_method(method_id),
    paid_at TIMESTAMP
);

-- Create user_device table
CREATE TABLE IF NOT EXISTS user_device (
    device_id SERIAL PRIMARY KEY,
    device_type VARCHAR(50),
    user_id INT REFERENCES "user"(user_id),
    token TEXT
);

-- Create favorite_location table
CREATE TABLE IF NOT EXISTS favorite_location (
    fav_id SERIAL PRIMARY KEY,
    location_id INT REFERENCES location(location_id),
    user_id INT REFERENCES "user"(user_id),
    name VARCHAR(50)
);

-- Create log table
CREATE TABLE IF NOT EXISTS log (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES "user"(user_id),
    action TEXT,
    time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create delivery_request table
CREATE TABLE IF NOT EXISTS delivery_request (
    delivery_id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES "user"(user_id),
    receiver_id INT REFERENCES "user"(user_id),
    weight_kg FLOAT,
    pickup_location_id INT REFERENCES location(location_id),
    drop_off_location_id INT REFERENCES location(location_id),
    vehicle_type_id INT REFERENCES vehicle_type(type_id),
    value_rial BIGINT,
    status VARCHAR(30),
    scheduled_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create delivery_review table
CREATE TABLE IF NOT EXISTS delivery_review (
    review_id SERIAL PRIMARY KEY,
    delivery_id INT REFERENCES delivery_request(delivery_id),
    reviewer_id INT REFERENCES "user"(user_id),
    target_driver_id INT REFERENCES driver(driver_id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT
);

-- Create delivery_assignment table
CREATE TABLE IF NOT EXISTS delivery_assignment (
    delivery_id INT PRIMARY KEY REFERENCES delivery_request(delivery_id),
    driver_id INT REFERENCES driver(driver_id),
    assigned_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    delivered_at TIMESTAMP
);

-- Create delivery_status_history table
CREATE TABLE IF NOT EXISTS delivery_status_history (
    delivery_id INT REFERENCES delivery_request(delivery_id),
    status_time TIMESTAMP,
    status TEXT,
    PRIMARY KEY (delivery_id, status_time)
);

-- Create wallet_transaction table
CREATE TABLE IF NOT EXISTS wallet_transaction (
    transaction_id SERIAL PRIMARY KEY,
    wallet_id INT REFERENCES wallet(wallet_id),
    amount_rial BIGINT,
    description TEXT,
    type VARCHAR(20) CHECK (type IN ('topup', 'payment', 'payout', 'refund', 'penalty')),
    reference_type VARCHAR(20) CHECK (reference_type IN ('ride', 'delivery', 'topup')),
    reference_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'failed'))
);

-- Create topup_request table
CREATE TABLE IF NOT EXISTS topup_request (
    topup_id SERIAL PRIMARY KEY,
    wallet_id INT REFERENCES wallet(wallet_id),
    amount_rial BIGINT,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);

-- Create admin_action_log table
CREATE TABLE IF NOT EXISTS admin_action_log (
    action_id SERIAL PRIMARY KEY,
    admin_id INT REFERENCES "user"(user_id),
    action_type VARCHAR(50),
    target_user INT REFERENCES "user"(user_id),
    target_vehicle_id INT REFERENCES vehicle(vehicle_id),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_phone ON "user"(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_type ON "user"(user_type);
CREATE INDEX IF NOT EXISTS idx_ride_user ON ride(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_driver ON ride(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_status ON ride(status);
CREATE INDEX IF NOT EXISTS idx_delivery_sender ON delivery_request(sender_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON delivery_request(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transaction_wallet ON wallet_transaction(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transaction_type ON wallet_transaction(type);
CREATE INDEX IF NOT EXISTS idx_location_coordinates ON location(latitude, longitude);