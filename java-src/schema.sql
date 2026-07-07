-- =========================================================
-- DATABASE SCHEMA: SMARTLAB AI
-- TARGET DATABASE: MySQL / MariaDB (Supports college projects)
-- =========================================================

-- 1. Create Database if it doesn't exist
CREATE DATABASE IF NOT EXISTS smartlab_db;
USE smartlab_db;

-- 2. Drop existing tables if they exist (to clean-build)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS maintenance_alerts;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 3. Users Table (Students & Lab Admins)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Equipment / Lab Systems Table
CREATE TABLE equipment (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lab_name VARCHAR(100) NOT NULL,
    total_usage_hours INT DEFAULT 0,
    last_maintenance_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Available' CHECK (status IN ('Available', 'In Use', 'Maintenance Required')),
    usage_threshold INT DEFAULT 50,
    maintenance_limit_days INT DEFAULT 30,
    specification TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bookings Table (Student schedules)
CREATE TABLE bookings (
    id VARCHAR(50) PRIMARY KEY,
    system_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
    duration_hours INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (system_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. AI-Generated Maintenance Alerts Table
CREATE TABLE maintenance_alerts (
    id VARCHAR(50) PRIMARY KEY,
    system_id VARCHAR(50) NOT NULL,
    trigger_reason VARCHAR(255) NOT NULL,
    prediction_date DATE NOT NULL,
    severity VARCHAR(20) DEFAULT 'Medium' CHECK (severity IN ('High', 'Medium')),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (system_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- 7. Add Indexing for Performance Optimization
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_booking_date_slot ON bookings(booking_date, time_slot);
CREATE INDEX idx_alert_resolved ON maintenance_alerts(is_resolved);

-- 8. Seed Sample Data for Testing
INSERT INTO users (id, username, password_hash, role, full_name, department) VALUES
('std01', 'student1', 'student', 'student', 'Susmitha Govind', 'Computer Science'),
('std02', 'student2', 'student', 'student', 'John Doe', 'Electronics Engineering'),
('admin', 'admin', 'admin', 'admin', 'Prof. Raghavan', 'Lab Administration');

INSERT INTO equipment (id, name, lab_name, total_usage_hours, last_maintenance_date, status, usage_threshold, maintenance_limit_days, specification) VALUES
('SYS-01', 'High-Performance Workstation - PC 1', 'Advanced Computing Lab', 52, '2026-06-15', 'Maintenance Required', 50, 30, 'Intel Xeon 16-Core, 64GB RAM, RTX 4090 GPU'),
('SYS-02', 'High-Performance Workstation - PC 2', 'Advanced Computing Lab', 24, '2026-06-20', 'Available', 50, 30, 'Intel Xeon 16-Core, 64GB RAM, RTX 4090 GPU'),
('SYS-03', 'Digital Storage Oscilloscope', 'Electronics & Embedded Lab', 12, '2026-05-10', 'Maintenance Required', 40, 45, '4 Channels, 200 MHz, 2 GSa/s Sample Rate'),
('SYS-04', 'Industrial IoT Starter Kit', 'Robotics & IoT Lab', 8, '2026-06-25', 'Available', 60, 60, 'Raspberry Pi 4, Arduino Mega, Sensor Pack, ESP32 Modules'),
('SYS-05', 'High-Precision 3D Printer', 'Robotics & IoT Lab', 41, '2026-06-10', 'Available', 45, 30, 'FDM Dual Extruder, Build volume 300x300x400mm');

INSERT INTO bookings (id, system_id, student_id, booking_date, time_slot, purpose, status, duration_hours) VALUES
('B-1001', 'SYS-02', 'std01', '2026-07-04', '11:00 AM - 01:00 PM', 'Deep Learning Model Training', 'Active', 2),
('B-1002', 'SYS-04', 'std02', '2026-07-04', '02:00 PM - 04:00 PM', 'ESP32 MQTT Broker Integration Practice', 'Active', 2);
