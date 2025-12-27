-- ============================================
-- GearGuard - Database Schema
-- MySQL Database Setup Script
-- ============================================

-- Create the database
CREATE DATABASE IF NOT EXISTS gearguard;
USE gearguard;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role ENUM('admin', 'manager', 'technician', 'user') DEFAULT 'user',
    department VARCHAR(100),
    team_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- MAINTENANCE TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    leader_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add foreign key for team in users table
ALTER TABLE users ADD CONSTRAINT fk_user_team FOREIGN KEY (team_id) REFERENCES maintenance_teams(id) ON DELETE SET NULL;

-- ============================================
-- EQUIPMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    serial_number VARCHAR(100),
    description TEXT,
    category_id INT,
    department_id INT,
    location_id INT,
    maintenance_team_id INT,
    default_technician_id INT,
    purchase_date DATE,
    warranty_expiry DATE,
    is_scrapped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (maintenance_team_id) REFERENCES maintenance_teams(id) ON DELETE SET NULL,
    FOREIGN KEY (default_technician_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- MAINTENANCE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    request_type ENUM('corrective', 'preventive') DEFAULT 'corrective',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    stage ENUM('new', 'in_progress', 'repaired', 'scrap') DEFAULT 'new',
    equipment_id INT,
    maintenance_team_id INT,
    assigned_technician_id INT,
    requester_id INT,
    scheduled_date DATE,
    completed_date DATETIME,
    duration_hours DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (maintenance_team_id) REFERENCES maintenance_teams(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert sample users
INSERT INTO users (name, email, password_hash, role, department) VALUES
('Neel Patel', 'admin@gearguard.com', 'admin123', 'admin', 'Management'),
('Sarah Manager', 'manager@gearguard.com', 'manager123', 'manager', 'Operations'),
('Mike Technician', 'tech1@gearguard.com', 'tech123', 'technician', 'Maintenance'),
('Emily Chen', 'tech2@gearguard.com', 'tech123', 'technician', 'Maintenance'),
('David Wilson', 'tech3@gearguard.com', 'tech123', 'technician', 'Maintenance'),
('Alice User', 'user@gearguard.com', 'user123', 'user', 'Production');

-- Insert sample maintenance teams
INSERT INTO maintenance_teams (name, description, color, leader_id) VALUES
('Mechanical Team', 'Handles all mechanical equipment maintenance including motors, pumps, and conveyors', '#3b82f6', 3),
('Electrical Team', 'Manages electrical systems, wiring, PLCs, and control panels', '#f59e0b', 4),
('IT & Automation', 'Handles IT infrastructure, SCADA systems, and automation equipment', '#10b981', 5);

-- Update users with team assignments
UPDATE users SET team_id = 1 WHERE id = 3;
UPDATE users SET team_id = 2 WHERE id = 4;
UPDATE users SET team_id = 3 WHERE id = 5;

-- Insert sample equipment
INSERT INTO equipment (name, serial_number, description, category_id, department_id, location_id, maintenance_team_id, default_technician_id, purchase_date, warranty_expiry) VALUES
('CNC Milling Machine #1', 'CNC-2024-001', 'Primary milling machine for precision parts', 1, 1, 1, 1, 3, '2022-03-15', '2025-03-15'),
('Industrial Conveyor Belt', 'CONV-2023-045', 'Main assembly line conveyor', 6, 2, 5, 1, 3, '2023-06-20', '2026-06-20'),
('HVAC Central Unit', 'HVAC-2022-012', 'Main building climate control system', 2, 3, 3, 2, 4, '2021-11-10', '2024-11-10'),
('PLC Control Panel', 'PLC-2023-089', 'Production line automation controller', 3, 1, 1, 3, 5, '2023-01-25', '2026-01-25'),
('Fire Suppression System', 'FIRE-2021-033', 'Building-wide fire safety system', 5, 4, 3, 2, 4, '2020-08-15', '2025-08-15'),
('Forklift #1', 'FORK-2022-007', 'Electric warehouse forklift', 6, 2, 5, 1, 3, '2022-05-10', '2025-05-10'),
('Server Rack A', 'SRV-2023-001', 'Main data center server infrastructure', 4, 3, 5, 3, 5, '2023-02-28', '2026-02-28'),
('Packaging Machine', 'PKG-2021-022', 'Automated product packaging system', 1, 1, 2, 1, 3, '2021-09-12', '2024-09-12');

-- Insert sample maintenance requests
INSERT INTO maintenance_requests (subject, description, request_type, priority, stage, equipment_id, maintenance_team_id, assigned_technician_id, scheduled_date) VALUES
('Replace worn bearings', 'Unusual noise detected from main spindle bearings', 'corrective', 'high', 'new', 1, 1, 3, NULL),
('Quarterly conveyor inspection', 'Regular preventive maintenance check', 'preventive', 'medium', 'in_progress', 2, 1, 3, '2025-01-15'),
('Filter replacement', 'Scheduled filter change for HVAC system', 'preventive', 'low', 'new', 3, 2, 4, '2025-01-20'),
('PLC firmware update', 'Security patch and firmware upgrade', 'preventive', 'medium', 'repaired', 4, 3, 5, '2025-01-10'),
('Annual fire system test', 'Required annual safety certification test', 'preventive', 'high', 'new', 5, 2, 4, '2025-02-01'),
('Forklift battery replacement', 'Battery no longer holding charge', 'corrective', 'high', 'in_progress', 6, 1, 3, NULL),
('Server cooling issue', 'Temperature alerts from server room', 'corrective', 'high', 'new', 7, 3, 5, NULL),
('Packaging line calibration', 'Weekly calibration check', 'preventive', 'medium', 'repaired', 8, 1, 3, '2025-01-05');

-- ============================================
-- VIEWS FOR EASY QUERYING
-- ============================================

-- View for equipment with team names
CREATE OR REPLACE VIEW v_equipment_details AS
SELECT 
    e.*,
    t.name AS team_name,
    t.color AS team_color,
    u.name AS technician_name
FROM equipment e
LEFT JOIN maintenance_teams t ON e.maintenance_team_id = t.id
LEFT JOIN users u ON e.default_technician_id = u.id;

-- View for requests with all details
CREATE OR REPLACE VIEW v_request_details AS
SELECT 
    r.*,
    e.name AS equipment_name,
    e.serial_number AS equipment_serial,
    t.name AS team_name,
    u.name AS technician_name
FROM maintenance_requests r
LEFT JOIN equipment e ON r.equipment_id = e.id
LEFT JOIN maintenance_teams t ON r.maintenance_team_id = t.id
LEFT JOIN users u ON r.assigned_technician_id = u.id;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_equipment_team ON equipment(maintenance_team_id);
CREATE INDEX idx_equipment_scrapped ON equipment(is_scrapped);
CREATE INDEX idx_requests_stage ON maintenance_requests(stage);
CREATE INDEX idx_requests_equipment ON maintenance_requests(equipment_id);
CREATE INDEX idx_requests_technician ON maintenance_requests(assigned_technician_id);
CREATE INDEX idx_requests_scheduled ON maintenance_requests(scheduled_date);

-- ============================================
-- END OF SCHEMA
-- ============================================
