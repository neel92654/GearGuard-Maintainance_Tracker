/**
 * GearGuard - Enterprise Maintenance Management System
 * Mock Data Store
 * 
 * This file contains all mock data for the application.
 * In production, this would be replaced with actual API calls.
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================
// USER DATA - Authentication & Authorization
// ============================================
export const users = [
  {
    id: 'user-1',
    email: 'admin@gearguard.com',
    password: 'admin123',
    name: 'Neel Patel',
    role: 'admin',
    avatar: null,
    department: 'Management',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user-2',
    email: 'manager@gearguard.com',
    password: 'manager123',
    name: 'Sarah Manager',
    role: 'manager',
    avatar: null,
    department: 'Operations',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'user-3',
    email: 'tech1@gearguard.com',
    password: 'tech123',
    name: 'Mike Technician',
    role: 'technician',
    avatar: null,
    department: 'Maintenance',
    teamId: 'team-1',
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 'user-4',
    email: 'tech2@gearguard.com',
    password: 'tech123',
    name: 'Emily Chen',
    role: 'technician',
    avatar: null,
    department: 'Maintenance',
    teamId: 'team-2',
    createdAt: '2024-02-15T00:00:00Z'
  },
  {
    id: 'user-5',
    email: 'tech3@gearguard.com',
    password: 'tech123',
    name: 'David Wilson',
    role: 'technician',
    avatar: null,
    department: 'Maintenance',
    teamId: 'team-3',
    createdAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 'user-6',
    email: 'user@gearguard.com',
    password: 'user123',
    name: 'Alice User',
    role: 'user',
    avatar: null,
    department: 'Production',
    createdAt: '2024-03-15T00:00:00Z'
  },
  {
    id: 'user-7',
    email: 'tech4@gearguard.com',
    password: 'tech123',
    name: 'James Brown',
    role: 'technician',
    avatar: null,
    department: 'Maintenance',
    teamId: 'team-1',
    createdAt: '2024-04-01T00:00:00Z'
  },
  {
    id: 'user-8',
    email: 'tech5@gearguard.com',
    password: 'tech123',
    name: 'Lisa Park',
    role: 'technician',
    avatar: null,
    department: 'Maintenance',
    teamId: 'team-2',
    createdAt: '2024-04-15T00:00:00Z'
  }
];

// ============================================
// MAINTENANCE TEAMS
// ============================================
export const teams = [
  {
    id: 'team-1',
    name: 'Mechanical Team',
    description: 'Handles all mechanical equipment maintenance including motors, pumps, and conveyors',
    color: '#3b82f6',
    leaderId: 'user-3',
    memberIds: ['user-3', 'user-7'],
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'team-2',
    name: 'Electrical Team',
    description: 'Manages electrical systems, wiring, PLCs, and control panels',
    color: '#f59e0b',
    leaderId: 'user-4',
    memberIds: ['user-4', 'user-8'],
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'team-3',
    name: 'IT & Automation',
    description: 'Handles IT infrastructure, SCADA systems, and automation equipment',
    color: '#10b981',
    leaderId: 'user-5',
    memberIds: ['user-5'],
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// ============================================
// EQUIPMENT CATEGORIES
// ============================================
export const equipmentCategories = [
  { id: 'cat-1', name: 'Production Machinery', icon: 'Factory' },
  { id: 'cat-2', name: 'HVAC Systems', icon: 'Wind' },
  { id: 'cat-3', name: 'Electrical Systems', icon: 'Zap' },
  { id: 'cat-4', name: 'IT Equipment', icon: 'Monitor' },
  { id: 'cat-5', name: 'Safety Equipment', icon: 'Shield' },
  { id: 'cat-6', name: 'Material Handling', icon: 'Package' }
];

// ============================================
// DEPARTMENTS
// ============================================
export const departments = [
  { id: 'dept-1', name: 'Production' },
  { id: 'dept-2', name: 'Warehouse' },
  { id: 'dept-3', name: 'Quality Control' },
  { id: 'dept-4', name: 'Administration' },
  { id: 'dept-5', name: 'Research & Development' }
];

// ============================================
// LOCATIONS
// ============================================
export const locations = [
  { id: 'loc-1', name: 'Building A - Floor 1' },
  { id: 'loc-2', name: 'Building A - Floor 2' },
  { id: 'loc-3', name: 'Building B - Ground' },
  { id: 'loc-4', name: 'Building B - Basement' },
  { id: 'loc-5', name: 'Warehouse Zone 1' },
  { id: 'loc-6', name: 'Warehouse Zone 2' },
  { id: 'loc-7', name: 'External - Yard' }
];

// ============================================
// EQUIPMENT
// ============================================
export const equipment = [
  {
    id: 'eq-1',
    name: 'CNC Milling Machine #1',
    serialNumber: 'CNC-2024-001',
    categoryId: 'cat-1',
    departmentId: 'dept-1',
    locationId: 'loc-1',
    purchaseDate: '2022-03-15',
    warrantyExpiry: '2025-03-15',
    teamId: 'team-1',
    status: 'active',
    notes: 'Primary milling machine for precision parts',
    createdAt: '2022-03-15T00:00:00Z'
  },
  {
    id: 'eq-2',
    name: 'Industrial Conveyor Belt',
    serialNumber: 'CONV-2023-045',
    categoryId: 'cat-6',
    departmentId: 'dept-2',
    locationId: 'loc-5',
    purchaseDate: '2023-06-20',
    warrantyExpiry: '2026-06-20',
    teamId: 'team-1',
    status: 'active',
    notes: 'Main assembly line conveyor',
    createdAt: '2023-06-20T00:00:00Z'
  },
  {
    id: 'eq-3',
    name: 'Central HVAC Unit',
    serialNumber: 'HVAC-2021-012',
    categoryId: 'cat-2',
    departmentId: 'dept-1',
    locationId: 'loc-3',
    purchaseDate: '2021-01-10',
    warrantyExpiry: '2024-01-10',
    teamId: 'team-2',
    status: 'under_maintenance',
    notes: 'Serves Building B - scheduled for filter replacement',
    createdAt: '2021-01-10T00:00:00Z'
  },
  {
    id: 'eq-4',
    name: 'Server Rack #1',
    serialNumber: 'SRV-2024-001',
    categoryId: 'cat-4',
    departmentId: 'dept-4',
    locationId: 'loc-4',
    purchaseDate: '2024-01-05',
    warrantyExpiry: '2027-01-05',
    teamId: 'team-3',
    status: 'active',
    notes: 'Primary data center rack',
    createdAt: '2024-01-05T00:00:00Z'
  },
  {
    id: 'eq-5',
    name: 'Fire Suppression System',
    serialNumber: 'FIRE-2020-003',
    categoryId: 'cat-5',
    departmentId: 'dept-1',
    locationId: 'loc-1',
    purchaseDate: '2020-08-15',
    warrantyExpiry: '2025-08-15',
    teamId: 'team-2',
    status: 'active',
    notes: 'Annual inspection required',
    createdAt: '2020-08-15T00:00:00Z'
  },
  {
    id: 'eq-6',
    name: 'Hydraulic Press #2',
    serialNumber: 'HYD-2019-007',
    categoryId: 'cat-1',
    departmentId: 'dept-1',
    locationId: 'loc-2',
    purchaseDate: '2019-04-22',
    warrantyExpiry: '2022-04-22',
    teamId: 'team-1',
    status: 'active',
    notes: 'High-capacity press for metal forming',
    createdAt: '2019-04-22T00:00:00Z'
  },
  {
    id: 'eq-7',
    name: 'Forklift Electric #3',
    serialNumber: 'FORK-2023-003',
    categoryId: 'cat-6',
    departmentId: 'dept-2',
    locationId: 'loc-6',
    purchaseDate: '2023-09-01',
    warrantyExpiry: '2026-09-01',
    teamId: 'team-1',
    status: 'active',
    notes: 'Electric forklift for warehouse operations',
    createdAt: '2023-09-01T00:00:00Z'
  },
  {
    id: 'eq-8',
    name: 'UPS Backup System',
    serialNumber: 'UPS-2022-001',
    categoryId: 'cat-3',
    departmentId: 'dept-4',
    locationId: 'loc-4',
    purchaseDate: '2022-11-30',
    warrantyExpiry: '2025-11-30',
    teamId: 'team-2',
    status: 'active',
    notes: '50kVA UPS for server room',
    createdAt: '2022-11-30T00:00:00Z'
  },
  {
    id: 'eq-9',
    name: 'CNC Lathe Machine',
    serialNumber: 'CNC-2018-002',
    categoryId: 'cat-1',
    departmentId: 'dept-1',
    locationId: 'loc-1',
    purchaseDate: '2018-02-14',
    warrantyExpiry: '2021-02-14',
    teamId: 'team-1',
    status: 'scrapped',
    notes: 'Decommissioned due to obsolescence',
    createdAt: '2018-02-14T00:00:00Z'
  },
  {
    id: 'eq-10',
    name: 'Industrial Robot Arm',
    serialNumber: 'ROB-2024-001',
    categoryId: 'cat-1',
    departmentId: 'dept-5',
    locationId: 'loc-2',
    purchaseDate: '2024-06-01',
    warrantyExpiry: '2027-06-01',
    teamId: 'team-3',
    status: 'active',
    notes: 'R&D automation prototype',
    createdAt: '2024-06-01T00:00:00Z'
  }
];

// ============================================
// MAINTENANCE REQUESTS
// ============================================
export const maintenanceRequests = [
  {
    id: 'req-1',
    subject: 'Unusual vibration during operation',
    description: 'CNC machine producing excessive vibration when running at high speeds. Needs immediate inspection.',
    type: 'corrective',
    equipmentId: 'eq-1',
    teamId: 'team-1',
    technicianId: 'user-3',
    requesterId: 'user-6',
    scheduledDate: null,
    completedDate: null,
    duration: null,
    priority: 'high',
    status: 'in_progress',
    notes: 'Initial inspection completed. Waiting for spare parts.',
    createdAt: '2024-12-20T09:30:00Z',
    updatedAt: '2024-12-21T14:00:00Z'
  },
  {
    id: 'req-2',
    subject: 'Quarterly HVAC filter replacement',
    description: 'Scheduled quarterly maintenance for HVAC filter replacement and system check.',
    type: 'preventive',
    equipmentId: 'eq-3',
    teamId: 'team-2',
    technicianId: 'user-4',
    requesterId: 'user-2',
    scheduledDate: '2024-12-28',
    completedDate: null,
    duration: 4,
    priority: 'medium',
    status: 'new',
    notes: 'Standard quarterly maintenance',
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z'
  },
  {
    id: 'req-3',
    subject: 'Conveyor belt misalignment',
    description: 'Belt has shifted and is rubbing against the side guards. Products falling off.',
    type: 'corrective',
    equipmentId: 'eq-2',
    teamId: 'team-1',
    technicianId: 'user-7',
    requesterId: 'user-6',
    scheduledDate: null,
    completedDate: '2024-12-22T16:30:00Z',
    duration: 2.5,
    priority: 'high',
    status: 'repaired',
    notes: 'Belt realigned and tensioned. Running tests successful.',
    createdAt: '2024-12-22T08:00:00Z',
    updatedAt: '2024-12-22T16:30:00Z'
  },
  {
    id: 'req-4',
    subject: 'Annual fire suppression inspection',
    description: 'Yearly inspection and testing of fire suppression system as per safety regulations.',
    type: 'preventive',
    equipmentId: 'eq-5',
    teamId: 'team-2',
    technicianId: null,
    requesterId: 'user-2',
    scheduledDate: '2025-01-15',
    completedDate: null,
    duration: 6,
    priority: 'medium',
    status: 'new',
    notes: 'Coordination with external fire safety inspector required.',
    createdAt: '2024-12-01T09:00:00Z',
    updatedAt: '2024-12-01T09:00:00Z'
  },
  {
    id: 'req-5',
    subject: 'Server room UPS battery check',
    description: 'Monthly UPS battery health check and load testing.',
    type: 'preventive',
    equipmentId: 'eq-8',
    teamId: 'team-2',
    technicianId: 'user-8',
    requesterId: 'user-2',
    scheduledDate: '2024-12-30',
    completedDate: null,
    duration: 2,
    priority: 'low',
    status: 'new',
    notes: '',
    createdAt: '2024-12-10T11:00:00Z',
    updatedAt: '2024-12-10T11:00:00Z'
  },
  {
    id: 'req-6',
    subject: 'Hydraulic fluid leak',
    description: 'Small hydraulic fluid leak detected at the main cylinder seal.',
    type: 'corrective',
    equipmentId: 'eq-6',
    teamId: 'team-1',
    technicianId: 'user-3',
    requesterId: 'user-6',
    scheduledDate: null,
    completedDate: null,
    duration: null,
    priority: 'medium',
    status: 'new',
    notes: 'Leak is minor but needs attention before it worsens.',
    createdAt: '2024-12-25T07:45:00Z',
    updatedAt: '2024-12-25T07:45:00Z'
  },
  {
    id: 'req-7',
    subject: 'Robot arm calibration',
    description: 'Monthly calibration and accuracy check for the robot arm.',
    type: 'preventive',
    equipmentId: 'eq-10',
    teamId: 'team-3',
    technicianId: 'user-5',
    requesterId: 'user-2',
    scheduledDate: '2025-01-05',
    completedDate: null,
    duration: 3,
    priority: 'low',
    status: 'new',
    notes: 'Part of R&D equipment maintenance schedule.',
    createdAt: '2024-12-18T14:30:00Z',
    updatedAt: '2024-12-18T14:30:00Z'
  },
  {
    id: 'req-8',
    subject: 'Forklift battery replacement',
    description: 'Battery cells showing degraded performance. Complete battery pack replacement needed.',
    type: 'corrective',
    equipmentId: 'eq-7',
    teamId: 'team-1',
    technicianId: 'user-7',
    requesterId: 'user-6',
    scheduledDate: null,
    completedDate: null,
    duration: null,
    priority: 'high',
    status: 'in_progress',
    notes: 'New battery pack ordered. Expected delivery Dec 28.',
    createdAt: '2024-12-23T10:00:00Z',
    updatedAt: '2024-12-24T09:00:00Z'
  },
  {
    id: 'req-9',
    subject: 'Server rack cleaning',
    description: 'Quarterly dust cleaning and cable management for server rack.',
    type: 'preventive',
    equipmentId: 'eq-4',
    teamId: 'team-3',
    technicianId: 'user-5',
    requesterId: 'user-2',
    scheduledDate: '2024-12-20',
    completedDate: '2024-12-20T17:00:00Z',
    duration: 2,
    priority: 'low',
    status: 'repaired',
    notes: 'Completed. Airflow improved after cleaning.',
    createdAt: '2024-12-05T08:00:00Z',
    updatedAt: '2024-12-20T17:00:00Z'
  },
  {
    id: 'req-10',
    subject: 'Emergency motor failure',
    description: 'Main drive motor on CNC machine stopped working. Production halted.',
    type: 'corrective',
    equipmentId: 'eq-1',
    teamId: 'team-1',
    technicianId: 'user-3',
    requesterId: 'user-6',
    scheduledDate: null,
    completedDate: '2024-12-10T14:00:00Z',
    duration: 8,
    priority: 'high',
    status: 'repaired',
    notes: 'Motor rewound and reinstalled. Running within spec.',
    createdAt: '2024-12-09T06:00:00Z',
    updatedAt: '2024-12-10T14:00:00Z'
  }
];

// ============================================
// ACTIVITY LOG
// ============================================
export const activityLog = [
  {
    id: 'log-1',
    type: 'request_created',
    userId: 'user-6',
    entityType: 'request',
    entityId: 'req-6',
    description: 'Created maintenance request: Hydraulic fluid leak',
    createdAt: '2024-12-25T07:45:00Z'
  },
  {
    id: 'log-2',
    type: 'status_change',
    userId: 'user-3',
    entityType: 'request',
    entityId: 'req-1',
    description: 'Changed status from New to In Progress',
    createdAt: '2024-12-21T14:00:00Z'
  },
  {
    id: 'log-3',
    type: 'request_completed',
    userId: 'user-7',
    entityType: 'request',
    entityId: 'req-3',
    description: 'Marked request as Repaired: Conveyor belt misalignment',
    createdAt: '2024-12-22T16:30:00Z'
  }
];

// ============================================
// HELPER FUNCTION TO GENERATE IDS
// ============================================
export const generateId = () => uuidv4();

// ============================================
// STATUS & PRIORITY OPTIONS
// ============================================
export const requestStatuses = [
  { id: 'new', label: 'New', color: 'blue' },
  { id: 'in_progress', label: 'In Progress', color: 'yellow' },
  { id: 'repaired', label: 'Repaired', color: 'green' },
  { id: 'scrap', label: 'Scrap', color: 'gray' }
];

export const equipmentStatuses = [
  { id: 'active', label: 'Active', color: 'green' },
  { id: 'under_maintenance', label: 'Under Maintenance', color: 'yellow' },
  { id: 'scrapped', label: 'Scrapped', color: 'gray' }
];

export const priorities = [
  { id: 'low', label: 'Low', color: 'green' },
  { id: 'medium', label: 'Medium', color: 'yellow' },
  { id: 'high', label: 'High', color: 'red' }
];

export const requestTypes = [
  { id: 'corrective', label: 'Corrective (Breakdown)' },
  { id: 'preventive', label: 'Preventive (Scheduled)' }
];
