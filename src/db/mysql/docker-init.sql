-- Kayak Travel Booking System - MySQL Database Schema
-- Auto-executed by Docker on container initialization

-- Create database (if not exists via env vars)
CREATE DATABASE IF NOT EXISTS kayak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kayak;

-- Drop tables if they exist (for clean initialization)
DROP TABLE IF EXISTS flight_booking_details;
DROP TABLE IF EXISTS hotel_amenities;
DROP TABLE IF EXISTS hotel_rooms;
DROP TABLE IF EXISTS billing;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS credit_cards;
DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS hotels;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS admin;
DROP TABLE IF EXISTS users;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    user_id VARCHAR(11) PRIMARY KEY COMMENT 'SSN format: XXX-XX-XXXX',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state CHAR(2) COMMENT 'US state abbreviation',
    zip_code VARCHAR(10) COMMENT 'Format: ##### or #####-####',
    profile_image_id VARCHAR(50) COMMENT 'Reference to MongoDB images collection',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    
    INDEX idx_email (email),
    INDEX idx_city_state (city, state),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. CREDIT CARDS TABLE
-- ============================================
CREATE TABLE credit_cards (
    card_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(11) NOT NULL,
    card_number_encrypted VARCHAR(255) NOT NULL,
    card_holder_name VARCHAR(200) NOT NULL,
    expiry_month TINYINT NOT NULL,
    expiry_year SMALLINT NOT NULL,
    cvv_encrypted VARCHAR(255) NOT NULL,
    card_type ENUM('visa', 'mastercard', 'amex', 'discover') NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 3. FLIGHTS TABLE
-- ============================================
CREATE TABLE flights (
    flight_id VARCHAR(10) PRIMARY KEY COMMENT 'e.g., AA123',
    airline_name VARCHAR(100) NOT NULL,
    departure_airport CHAR(3) NOT NULL COMMENT 'IATA code',
    arrival_airport CHAR(3) NOT NULL COMMENT 'IATA code',
    departure_datetime DATETIME NOT NULL,
    arrival_datetime DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    flight_class ENUM('economy', 'business', 'first') NOT NULL,
    price_per_ticket DECIMAL(10, 2) NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    status ENUM('scheduled', 'cancelled', 'delayed', 'completed') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_route (departure_airport, arrival_airport),
    INDEX idx_departure_date (departure_datetime),
    INDEX idx_price (price_per_ticket),
    INDEX idx_class (flight_class),
    INDEX idx_airline (airline_name),
    INDEX idx_available_seats (available_seats),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 4. HOTELS TABLE
-- ============================================
CREATE TABLE hotels (
    hotel_id VARCHAR(20) PRIMARY KEY,
    hotel_name VARCHAR(200) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state CHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    star_rating TINYINT CHECK (star_rating BETWEEN 1 AND 5),
    description TEXT,
    total_rooms INT NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    
    INDEX idx_city_state (city, state),
    INDEX idx_star_rating (star_rating),
    INDEX idx_rating (rating),
    FULLTEXT idx_name_description (hotel_name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 5. HOTEL ROOMS TABLE
-- ============================================
CREATE TABLE hotel_rooms (
    room_id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id VARCHAR(20) NOT NULL,
    room_type ENUM('single', 'double', 'suite', 'deluxe', 'penthouse') NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL,
    max_guests TINYINT NOT NULL,
    total_rooms INT NOT NULL,
    available_rooms INT NOT NULL,
    description TEXT,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_price (price_per_night),
    INDEX idx_room_type (room_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 6. HOTEL AMENITIES TABLE
-- ============================================
CREATE TABLE hotel_amenities (
    amenity_id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id VARCHAR(20) NOT NULL,
    amenity_name VARCHAR(100) NOT NULL COMMENT 'e.g., WiFi, Pool, Parking, Breakfast',
    is_free BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_amenity_name (amenity_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 7. CARS TABLE
-- ============================================
CREATE TABLE cars (
    car_id VARCHAR(20) PRIMARY KEY,
    car_type ENUM('suv', 'sedan', 'compact', 'luxury', 'van', 'truck') NOT NULL,
    company_name VARCHAR(100) NOT NULL COMMENT 'e.g., Enterprise, Hertz',
    model VARCHAR(100) NOT NULL,
    year YEAR NOT NULL,
    transmission ENUM('automatic', 'manual') NOT NULL,
    seats TINYINT NOT NULL,
    daily_rate DECIMAL(10, 2) NOT NULL,
    location VARCHAR(200) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_location (location),
    INDEX idx_car_type (car_type),
    INDEX idx_daily_rate (daily_rate),
    INDEX idx_company (company_name),
    INDEX idx_available (available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 8. BOOKINGS TABLE
-- ============================================
CREATE TABLE bookings (
    booking_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(11) NOT NULL,
    booking_type ENUM('flight', 'hotel', 'car') NOT NULL,
    booking_reference VARCHAR(50) NOT NULL COMMENT 'flight_id, hotel_id, or car_id',
    confirmation_code VARCHAR(20) UNIQUE NOT NULL,
    status ENUM('confirmed', 'cancelled', 'completed', 'pending') DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date DATE NOT NULL,
    end_date DATE,
    guests INT DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_booking_type (booking_type),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_confirmation_code (confirmation_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 9. FLIGHT BOOKING DETAILS TABLE
-- ============================================
CREATE TABLE flight_booking_details (
    detail_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id VARCHAR(20) NOT NULL,
    flight_id VARCHAR(10) NOT NULL,
    passenger_first_name VARCHAR(100) NOT NULL,
    passenger_last_name VARCHAR(100) NOT NULL,
    passenger_dob DATE NOT NULL,
    passport_number VARCHAR(50),
    seat_number VARCHAR(10),
    
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    INDEX idx_booking_id (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 10. BILLING TABLE
-- ============================================
CREATE TABLE billing (
    billing_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(11) NOT NULL,
    booking_id VARCHAR(20) NOT NULL,
    booking_type ENUM('flight', 'hotel', 'car') NOT NULL,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'apple_pay') NOT NULL,
    transaction_status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invoice_id VARCHAR(50),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    INDEX idx_user_id (user_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_transaction_status (transaction_status),
    INDEX idx_amount (total_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 11. ADMIN TABLE
-- ============================================
CREATE TABLE admin (
    admin_id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state CHAR(2),
    zip_code VARCHAR(10),
    role ENUM('super_admin', 'admin', 'analyst', 'support') DEFAULT 'admin',
    access_level INT DEFAULT 1 COMMENT '1=basic, 5=full access',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SEED DATA: Insert sample records for testing
-- ============================================

-- Insert test admin user
INSERT INTO admin (admin_id, first_name, last_name, email, password_hash, role, access_level, status) 
VALUES 
('ADM001', 'Admin', 'User', 'admin@kayak.com', '$2a$10$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS', 'super_admin', 5, 'active');
-- Password is: admin123

-- Insert test users (5 samples)
INSERT INTO users (user_id, first_name, last_name, email, password_hash, phone, address, city, state, zip_code, status) 
VALUES 
('123-45-6789', 'John', 'Doe', 'john.doe@example.com', '$2a$10$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS', '408-555-0001', '123 Main St', 'San Jose', 'CA', '95123', 'active'),
('234-56-7890', 'Jane', 'Smith', 'jane.smith@example.com', '$2a$10$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS', '408-555-0002', '456 Oak Ave', 'San Francisco', 'CA', '94102', 'active'),
('345-67-8901', 'Bob', 'Johnson', 'bob.johnson@example.com', '$2a$10$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS', '408-555-0003', '789 Pine St', 'Los Angeles', 'CA', '90001', 'active'),
('456-78-9012', 'Alice', 'Williams', 'alice.w@example.com', '$2a$10$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS', '212-555-0004', '101 Broadway', 'New York', 'NY', '10001', 'active'),
('567-89-0123', 'Charlie', 'Brown', 'charlie.b@example.com', '$2a$10$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS', '312-555-0005', '202 Michigan Ave', 'Chicago', 'IL', '60601', 'active');
-- Password for all test users: password123

-- Insert sample flights (10 samples)
INSERT INTO flights (flight_id, airline_name, departure_airport, arrival_airport, departure_datetime, arrival_datetime, duration_minutes, flight_class, price_per_ticket, total_seats, available_seats, rating, reviews_count, status) 
VALUES 
('AA100', 'American Airlines', 'SFO', 'JFK', '2025-12-10 08:00:00', '2025-12-10 16:30:00', 330, 'economy', 299.99, 180, 145, 4.2, 89, 'scheduled'),
('UA200', 'United Airlines', 'LAX', 'ORD', '2025-12-11 09:00:00', '2025-12-11 15:00:00', 240, 'economy', 249.99, 160, 120, 4.0, 56, 'scheduled'),
('DL300', 'Delta Airlines', 'JFK', 'MIA', '2025-12-12 10:00:00', '2025-12-12 13:00:00', 180, 'business', 599.99, 40, 25, 4.5, 34, 'scheduled'),
('SW400', 'Southwest Airlines', 'SFO', 'LAS', '2025-12-13 07:00:00', '2025-12-13 08:30:00', 90, 'economy', 89.99, 143, 100, 3.8, 67, 'scheduled'),
('AA101', 'American Airlines', 'ORD', 'LAX', '2025-12-14 11:00:00', '2025-12-14 13:30:00', 270, 'first', 899.99, 20, 15, 4.8, 12, 'scheduled'),
('UA201', 'United Airlines', 'SFO', 'SEA', '2025-12-15 06:00:00', '2025-12-15 08:00:00', 120, 'economy', 149.99, 150, 130, 4.1, 45, 'scheduled'),
('DL301', 'Delta Airlines', 'ATL', 'BOS', '2025-12-16 12:00:00', '2025-12-16 14:30:00', 150, 'economy', 199.99, 170, 140, 4.3, 78, 'scheduled'),
('SW401', 'Southwest Airlines', 'LAX', 'PHX', '2025-12-17 14:00:00', '2025-12-17 15:30:00', 90, 'economy', 79.99, 143, 110, 3.9, 34, 'scheduled'),
('AA102', 'American Airlines', 'DFW', 'MIA', '2025-12-18 15:00:00', '2025-12-18 18:30:00', 210, 'business', 499.99, 50, 40, 4.4, 23, 'scheduled'),
('UA202', 'United Airlines', 'SFO', 'DEN', '2025-12-19 16:00:00', '2025-12-19 19:00:00', 180, 'economy', 179.99, 160, 125, 4.0, 56, 'scheduled');

-- Insert sample hotels (10 samples)
INSERT INTO hotels (hotel_id, hotel_name, address, city, state, zip_code, star_rating, description, total_rooms, rating, reviews_count, latitude, longitude, status) 
VALUES 
('HT001', 'Grand Plaza Hotel', '100 Market St', 'San Jose', 'CA', '95113', 4, 'Luxurious hotel in downtown San Jose with modern amenities', 200, 4.5, 342, 37.334789, -121.888138, 'active'),
('HT002', 'Beachside Resort', '500 Ocean Blvd', 'San Diego', 'CA', '92101', 5, 'Oceanfront resort with stunning views and beach access', 150, 4.8, 521, 32.715736, -117.161087, 'active'),
('HT003', 'Downtown Suites', '250 Broadway', 'New York', 'NY', '10007', 4, 'Modern suites in the heart of Manhattan', 180, 4.3, 289, 40.712776, -74.005974, 'active'),
('HT004', 'Mountain View Lodge', '1000 Pine Ridge Rd', 'Denver', 'CO', '80202', 3, 'Cozy lodge with mountain views and ski access', 80, 4.1, 156, 39.739235, -104.990250, 'active'),
('HT005', 'City Center Inn', '300 Main St', 'Chicago', 'IL', '60601', 3, 'Convenient location near shopping and dining', 120, 3.9, 234, 41.878113, -87.629799, 'active'),
('HT006', 'Lakefront Hotel', '400 Lake Shore Dr', 'Chicago', 'IL', '60611', 4, 'Elegant hotel with lake views', 160, 4.4, 312, 41.890251, -87.621681, 'active'),
('HT007', 'Airport Comfort Suites', '800 Airport Blvd', 'Los Angeles', 'CA', '90045', 3, 'Convenient airport hotel with shuttle service', 140, 3.8, 189, 33.942791, -118.408529, 'active'),
('HT008', 'Historic District Hotel', '150 Beacon St', 'Boston', 'MA', '02116', 4, 'Charming hotel in historic neighborhood', 90, 4.6, 267, 42.360081, -71.058884, 'active'),
('HT009', 'Desert Oasis Resort', '2000 Desert Rd', 'Phoenix', 'AZ', '85001', 5, 'Luxury resort with spa and golf course', 250, 4.7, 445, 33.448376, -112.074036, 'active'),
('HT010', 'Waterfront Inn', '600 Harbor Dr', 'Seattle', 'WA', '98101', 3, 'Budget-friendly hotel near waterfront', 100, 3.7, 178, 47.606209, -122.332069, 'active');

-- Insert hotel rooms for each hotel
INSERT INTO hotel_rooms (hotel_id, room_type, price_per_night, max_guests, total_rooms, available_rooms, description) 
VALUES 
-- HT001 rooms
('HT001', 'single', 120.00, 1, 50, 45, 'Cozy single room with city view'),
('HT001', 'double', 180.00, 2, 100, 85, 'Spacious double room with modern amenities'),
('HT001', 'suite', 350.00, 4, 50, 40, 'Luxurious suite with separate living area'),
-- HT002 rooms
('HT002', 'double', 250.00, 2, 80, 70, 'Ocean view double room'),
('HT002', 'suite', 500.00, 4, 50, 42, 'Premium suite with balcony'),
('HT002', 'penthouse', 1200.00, 6, 20, 18, 'Exclusive penthouse with private terrace'),
-- HT003 rooms
('HT003', 'single', 150.00, 1, 60, 50, 'Compact single in Manhattan'),
('HT003', 'double', 220.00, 2, 100, 80, 'Comfortable double room'),
('HT003', 'suite', 400.00, 3, 20, 15, 'Executive suite'),
-- HT004 rooms
('HT004', 'double', 130.00, 2, 60, 55, 'Mountain view double'),
('HT004', 'deluxe', 200.00, 4, 20, 18, 'Deluxe room with fireplace');

-- Insert hotel amenities
INSERT INTO hotel_amenities (hotel_id, amenity_name, is_free) 
VALUES 
('HT001', 'WiFi', TRUE),
('HT001', 'Parking', FALSE),
('HT001', 'Breakfast', FALSE),
('HT001', 'Gym', TRUE),
('HT001', 'Pool', TRUE),
('HT002', 'WiFi', TRUE),
('HT002', 'Beach Access', TRUE),
('HT002', 'Spa', FALSE),
('HT002', 'Restaurant', FALSE),
('HT002', 'Pool', TRUE),
('HT003', 'WiFi', TRUE),
('HT003', 'Parking', FALSE),
('HT003', 'Business Center', TRUE),
('HT004', 'WiFi', TRUE),
('HT004', 'Ski Storage', TRUE),
('HT004', 'Hot Tub', TRUE);

-- Insert sample cars (10 samples)
INSERT INTO cars (car_id, car_type, company_name, model, year, transmission, seats, daily_rate, location, rating, reviews_count, available) 
VALUES 
('CAR001', 'sedan', 'Enterprise', 'Toyota Camry', 2024, 'automatic', 5, 45.99, 'San Jose, CA', 4.3, 89, TRUE),
('CAR002', 'suv', 'Hertz', 'Toyota RAV4', 2024, 'automatic', 5, 65.99, 'San Jose, CA', 4.5, 112, TRUE),
('CAR003', 'compact', 'Budget', 'Honda Civic', 2023, 'automatic', 5, 35.99, 'Los Angeles, CA', 4.0, 67, TRUE),
('CAR004', 'luxury', 'Avis', 'BMW 5 Series', 2024, 'automatic', 5, 120.99, 'Los Angeles, CA', 4.8, 34, TRUE),
('CAR005', 'van', 'Enterprise', 'Honda Odyssey', 2024, 'automatic', 8, 85.99, 'San Francisco, CA', 4.2, 45, TRUE),
('CAR006', 'suv', 'National', 'Ford Explorer', 2024, 'automatic', 7, 75.99, 'San Diego, CA', 4.4, 78, TRUE),
('CAR007', 'compact', 'Thrifty', 'Hyundai Accent', 2023, 'manual', 5, 29.99, 'Phoenix, AZ', 3.8, 56, TRUE),
('CAR008', 'sedan', 'Dollar', 'Nissan Altima', 2024, 'automatic', 5, 42.99, 'Seattle, WA', 4.1, 67, TRUE),
('CAR009', 'truck', 'Enterprise', 'Ford F-150', 2024, 'automatic', 6, 95.99, 'Denver, CO', 4.6, 23, TRUE),
('CAR010', 'luxury', 'Hertz', 'Mercedes E-Class', 2024, 'automatic', 5, 150.99, 'New York, NY', 4.9, 12, TRUE);

-- Success message
SELECT 'Database schema created successfully! Tables: users, flights, hotels, hotel_rooms, hotel_amenities, cars, bookings, flight_booking_details, billing, admin, credit_cards' AS status;
SELECT 'Sample data inserted: 5 users, 1 admin, 10 flights, 10 hotels, 11 hotel rooms, 16 amenities, 10 cars' AS seed_status;

