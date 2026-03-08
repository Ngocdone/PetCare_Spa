-- =====================================================
-- PetCare Spa Database - SQL CREATE TABLES
-- Converted from MongoDB Mongoose Schemas to MySQL
-- =====================================================

-- Drop tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS faqs;
DROP TABLE IF EXISTS team;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS newsletter;
DROP TABLE IF EXISTS gallery;
DROP TABLE IF EXISTS categories;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) DEFAULT '',
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    tier ENUM('bronze', 'silver', 'gold', 'vip') DEFAULT 'bronze',
    address TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    old_price DECIMAL(10, 2),
    category VARCHAR(100) DEFAULT 'cham-soc',
    pet_type ENUM('cho', 'meo', 'both') DEFAULT 'both',
    image VARCHAR(500) DEFAULT '',
    rating DECIMAL(3, 2) DEFAULT 4.50,
    best_seller BOOLEAN DEFAULT FALSE,
    description TEXT DEFAULT '',
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- SERVICES TABLE
-- =====================================================
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT DEFAULT '',
    price_dog DECIMAL(10, 2) NOT NULL,
    price_cat DECIMAL(10, 2) NOT NULL,
    duration INT DEFAULT 60,
    unit VARCHAR(20) DEFAULT 'phút',
    image VARCHAR(500) DEFAULT '',
    featured BOOLEAN DEFAULT TRUE,
    category VARCHAR(100) DEFAULT 'grooming',
    pet_type ENUM('cho', 'meo', 'both') DEFAULT 'both',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id VARCHAR(100) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_price DECIMAL(10, 2) NOT NULL,
    pet_type ENUM('dog', 'cat') NOT NULL,
    pet_weight VARCHAR(50) NOT NULL,
    pet_name VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(50) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_address TEXT NOT NULL,
    note TEXT DEFAULT '',
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    items JSON,
    total DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tier_amount DECIMAL(10, 2) DEFAULT 0,
    tier VARCHAR(50) DEFAULT '',
    promo_code VARCHAR(50) DEFAULT '',
    promo_amount DECIMAL(10, 2) DEFAULT 0,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    payment VARCHAR(50) DEFAULT 'cod',
    carrier VARCHAR(100) DEFAULT 'PetCare Express',
    carrier_phone VARCHAR(50) DEFAULT '1900 1234',
    status ENUM('pending', 'confirmed', 'shipping', 'delivered', 'cancelled') DEFAULT 'pending',
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT DEFAULT 1,
    image VARCHAR(500) DEFAULT '',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_str VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    category_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- GALLERY TABLE
-- =====================================================
CREATE TABLE gallery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    src VARCHAR(500) NOT NULL,
    title VARCHAR(255) DEFAULT '',
    category VARCHAR(100) DEFAULT 'gallery',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- NEWSLETTER TABLE
-- =====================================================
CREATE TABLE newsletter (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- BRANDS TABLE
-- =====================================================
CREATE TABLE brands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    brand_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- TEAM TABLE
-- =====================================================
CREATE TABLE team (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    experience VARCHAR(500) DEFAULT '',
    image VARCHAR(500) DEFAULT '',
    team_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- FAQS TABLE
-- =====================================================
CREATE TABLE faqs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    q VARCHAR(500) NOT NULL,
    a TEXT NOT NULL,
    faq_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- TESTIMONIALS TABLE
-- =====================================================
CREATE TABLE testimonials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    author VARCHAR(255) NOT NULL,
    pet VARCHAR(255) DEFAULT '',
    pet_image VARCHAR(500) DEFAULT '',
    text TEXT NOT NULL,
    rating INT DEFAULT 5,
    testimonial_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_best_seller ON products(best_seller);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_newsletter_email ON newsletter(email);

