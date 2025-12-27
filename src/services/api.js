/**
 * GearGuard - API Service Layer
 * 
 * This module provides a clean service layer for all API operations.
 * Connects to Flask backend at http://localhost:5000
 */

// ============================================
// API CONFIGURATION
// ============================================
const API_BASE_URL = '/api'; // Uses Vite proxy

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// ============================================
// LOCAL STORAGE KEYS (for auth)
// ============================================
const STORAGE_KEYS = {
  CURRENT_USER: 'gearguard_current_user'
};

// ============================================
// STATIC DATA (Categories, Departments, Locations)
// ============================================
export const equipmentCategories = [
  { id: 1, name: 'Production Machinery', icon: 'Factory' },
  { id: 2, name: 'HVAC Systems', icon: 'Wind' },
  { id: 3, name: 'Electrical Systems', icon: 'Zap' },
  { id: 4, name: 'IT Equipment', icon: 'Monitor' },
  { id: 5, name: 'Safety Equipment', icon: 'Shield' },
  { id: 6, name: 'Material Handling', icon: 'Package' }
];

export const departments = [
  { id: 1, name: 'Production' },
  { id: 2, name: 'Warehouse' },
  { id: 3, name: 'Administration' },
  { id: 4, name: 'R&D' },
  { id: 5, name: 'Quality Control' }
];

export const locations = [
  { id: 1, name: 'Building A - Floor 1' },
  { id: 2, name: 'Building A - Floor 2' },
  { id: 3, name: 'Building B - Floor 1' },
  { id: 4, name: 'Warehouse' },
  { id: 5, name: 'Server Room' }
];

// Mock users for authentication (in production, use backend auth)
const users = [
  {
    id: 1,
    email: 'admin@gearguard.com',
    password: 'admin123',
    name: 'Neel Patel',
    role: 'admin',
    department: 'Management',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    email: 'manager@gearguard.com',
    password: 'manager123',
    name: 'Sarah Manager',
    role: 'manager',
    department: 'Operations',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 3,
    email: 'tech1@gearguard.com',
    password: 'tech123',
    name: 'Mike Technician',
    role: 'technician',
    department: 'Maintenance',
    teamId: 1,
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 4,
    email: 'tech2@gearguard.com',
    password: 'tech123',
    name: 'Emily Chen',
    role: 'technician',
    department: 'Maintenance',
    teamId: 2,
    createdAt: '2024-02-15T00:00:00Z'
  },
  {
    id: 5,
    email: 'tech3@gearguard.com',
    password: 'tech123',
    name: 'David Wilson',
    role: 'technician',
    department: 'Maintenance',
    teamId: 3,
    createdAt: '2024-03-01T00:00:00Z'
  }
];

// Mock teams (these should match your database)
const teams = [
  {
    id: 1,
    name: 'Mechanical Team',
    description: 'Handles all mechanical equipment maintenance',
    color: '#3b82f6',
    leaderId: 3,
    memberIds: [3]
  },
  {
    id: 2,
    name: 'Electrical Team',
    description: 'Manages electrical systems and wiring',
    color: '#f59e0b',
    leaderId: 4,
    memberIds: [4]
  },
  {
    id: 3,
    name: 'IT & Automation',
    description: 'Handles IT infrastructure and automation',
    color: '#10b981',
    leaderId: 5,
    memberIds: [5]
  }
];

// ============================================
// HELPER FUNCTION
// ============================================
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// ============================================
// AUTHENTICATION SERVICE
// ============================================
export const authService = {
  async login(email, password) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const { password: _, ...safeUser } = user;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    return safeUser;
  },

  getCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getRolePermissions(role) {
    const permissions = {
      admin: {
        canManageUsers: true,
        canManageTeams: true,
        canManageEquipment: true,
        canManageAllRequests: true,
        canAssignTechnicians: true,
        canDeleteRequests: true,
        canViewDashboard: true,
        canScrapEquipment: true,
        canCreateRequests: true
      },
      manager: {
        canManageUsers: false,
        canManageTeams: true,
        canManageEquipment: true,
        canManageAllRequests: true,
        canAssignTechnicians: true,
        canDeleteRequests: true,
        canViewDashboard: true,
        canScrapEquipment: true,
        canCreateRequests: true
      },
      technician: {
        canManageUsers: false,
        canManageTeams: false,
        canManageEquipment: false,
        canManageAllRequests: false,
        canAssignTechnicians: false,
        canDeleteRequests: false,
        canViewDashboard: true,
        canScrapEquipment: false,
        canPickTasks: true,
        canUpdateAssignedTasks: true,
        canCreateRequests: true
      },
      user: {
        canManageUsers: false,
        canManageTeams: false,
        canManageEquipment: false,
        canManageAllRequests: false,
        canAssignTechnicians: false,
        canDeleteRequests: false,
        canViewDashboard: false,
        canScrapEquipment: false,
        canCreateRequests: true
      }
    };
    return permissions[role] || {};
  }
};

// ============================================
// USER SERVICE
// ============================================
export const userService = {
  async getAll() {
    return users.map(({ password, ...user }) => user);
  },

  async getById(id) {
    const user = users.find(u => u.id === id);
    if (user) {
      const { password, ...safeUser } = user;
      return safeUser;
    }
    return null;
  },

  async getByTeamId(teamId) {
    return users
      .filter(u => u.teamId === teamId)
      .map(({ password, ...user }) => user);
  },

  async getTechnicians() {
    return users
      .filter(u => u.role === 'technician')
      .map(({ password, ...user }) => user);
  }
};

// ============================================
// TEAM SERVICE
// ============================================
export const teamService = {
  async getAll() {
    try {
      const data = await apiCall('/teams');
      return data.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description || '',
        color: team.color || '#3b82f6',
        leaderId: team.leader_id,
        memberIds: team.member_ids || []
      }));
    } catch (error) {
      // Fallback to mock data
      return [
        {
          id: 1,
          name: 'Mechanical Team',
          description: 'Handles all mechanical equipment maintenance',
          color: '#3b82f6',
          leaderId: 3,
          memberIds: [3]
        },
        {
          id: 2,
          name: 'Electrical Team',
          description: 'Manages electrical systems and wiring',
          color: '#f59e0b',
          leaderId: 4,
          memberIds: [4]
        },
        {
          id: 3,
          name: 'IT & Automation',
          description: 'Handles IT infrastructure and automation',
          color: '#10b981',
          leaderId: 5,
          memberIds: [5]
        }
      ];
    }
  },

  async getById(id) {
    const teams = await this.getAll();
    return teams.find(t => t.id === parseInt(id)) || null;
  },

  async getWithMembers() {
    const teamsData = await this.getAll();
    return teamsData.map(team => ({
      ...team,
      members: users
        .filter(u => team.memberIds.includes(u.id))
        .map(({ password, ...user }) => user),
      leader: users.find(u => u.id === team.leaderId)
    }));
  }
};

// ============================================
// EQUIPMENT SERVICE - Connected to Flask Backend
// ============================================
export const equipmentService = {
  async getAll() {
    try {
      const data = await apiCall('/equipment');
      return data;
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
      return [];
    }
  },

  async getById(id) {
    try {
      const data = await apiCall(`/equipment/${id}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
      return null;
    }
  },

  async getWithDetails() {
    try {
      const equipmentList = await this.getAll();
      
      return equipmentList.map(eq => {
        const team = teams.find(t => t.id === eq.maintenance_team_id);
        const category = equipmentCategories.find(c => c.id === eq.category_id);
        const department = departments.find(d => d.id === eq.department_id);
        const location = locations.find(l => l.id === eq.location_id);
        
        return {
          id: eq.id,
          name: eq.name,
          serialNumber: eq.serial_number || '',
          description: eq.description || '',
          status: eq.is_scrapped ? 'scrapped' : 'active',
          teamId: eq.maintenance_team_id,
          categoryId: eq.category_id,
          departmentId: eq.department_id,
          locationId: eq.location_id,
          defaultTechnicianId: eq.default_technician_id,
          team,
          category,
          department,
          location,
          openRequestsCount: 0
        };
      });
    } catch (error) {
      console.error('Failed to fetch equipment with details:', error);
      return [];
    }
  },

  async getEquipmentRequests(equipmentId) {
    try {
      const data = await apiCall(`/equipment/${equipmentId}/requests`);
      return data.map(req => this._mapRequest(req));
    } catch (error) {
      console.error('Failed to fetch equipment requests:', error);
      return [];
    }
  },

  _mapRequest(req) {
    return {
      id: req.id,
      subject: req.subject,
      type: req.request_type,
      status: req.stage || 'new',
      scheduledDate: req.scheduled_date,
      durationHours: req.duration_hours,
      equipmentId: req.equipment_id,
      technicianId: req.assigned_technician_id,
      teamId: req.maintenance_team_id,
      createdAt: req.created_at || new Date().toISOString()
    };
  },

  getCategories() {
    return equipmentCategories;
  },

  getDepartments() {
    return departments;
  },

  getLocations() {
    return locations;
  }
};

// ============================================
// MAINTENANCE REQUEST SERVICE - Connected to Flask Backend
// ============================================
export const requestService = {
  async getAll() {
    try {
      const kanban = await apiCall('/requests/kanban');
      const allRequests = [
        ...kanban.new.map(r => ({ ...r, status: 'new', stage: 'new' })),
        ...kanban.in_progress.map(r => ({ ...r, status: 'in_progress', stage: 'in_progress' })),
        ...kanban.repaired.map(r => ({ ...r, status: 'repaired', stage: 'repaired' })),
        ...kanban.scrap.map(r => ({ ...r, status: 'scrap', stage: 'scrap' }))
      ];
      return allRequests;
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      return [];
    }
  },

  async getById(id) {
    try {
      const allRequests = await this.getAll();
      return allRequests.find(r => r.id === parseInt(id)) || null;
    } catch (error) {
      console.error('Failed to fetch request:', error);
      return null;
    }
  },

  async getWithDetails() {
    try {
      const requests = await this.getAll();
      const equipmentList = await equipmentService.getAll();
      
      return requests.map(req => {
        const equipment = equipmentList.find(e => e.id === req.equipment_id);
        const technician = users.find(u => u.name === req.technician || u.id === req.assigned_technician_id);
        const team = teams.find(t => t.id === req.maintenance_team_id);
        
        const isOverdue = req.scheduled_date && 
          new Date(req.scheduled_date) < new Date() && 
          req.status !== 'repaired' && 
          req.status !== 'scrap';
        
        return {
          id: req.id,
          subject: req.subject,
          type: req.request_type || 'corrective',
          status: req.stage || req.status || 'new',
          priority: req.priority || 'medium',
          scheduledDate: req.scheduled_date,
          equipmentId: req.equipment_id,
          technicianId: req.assigned_technician_id,
          teamId: req.maintenance_team_id,
          durationHours: req.duration_hours,
          createdAt: req.created_at || new Date().toISOString(),
          equipment: equipment ? {
            id: equipment.id,
            name: equipment.name,
            serialNumber: equipment.serial_number || '',
            status: equipment.is_scrapped ? 'scrapped' : 'active'
          } : null,
          team: team ? { id: team.id, name: team.name, color: team.color } : null,
          technician: technician ? {
            id: technician.id,
            name: technician.name,
            avatar: technician.avatar
          } : (req.technician ? { id: 0, name: req.technician } : null),
          isOverdue
        };
      });
    } catch (error) {
      console.error('Failed to fetch requests with details:', error);
      return [];
    }
  },

  async getKanbanData() {
    try {
      const kanban = await apiCall('/requests/kanban');
      const equipmentList = await equipmentService.getAll();
      
      const mapItems = (items, status) => items.map(r => {
        const equipment = equipmentList.find(e => e.id === r.equipment_id);
        const technician = users.find(u => u.name === r.technician || u.id === r.assigned_technician_id);
        const team = teams.find(t => t.id === r.maintenance_team_id);
        
        return {
          id: r.id,
          subject: r.subject,
          type: r.request_type || 'corrective',
          status: status,
          priority: r.priority || 'medium',
          scheduledDate: r.scheduled_date,
          equipment: equipment ? { id: equipment.id, name: equipment.name } : null,
          team: team ? { id: team.id, name: team.name, color: team.color } : null,
          technician: technician ? { id: technician.id, name: technician.name } : 
            (r.technician ? { id: 0, name: r.technician } : null)
        };
      });
      
      return {
        new: mapItems(kanban.new || [], 'new'),
        in_progress: mapItems(kanban.in_progress || [], 'in_progress'),
        repaired: mapItems(kanban.repaired || [], 'repaired'),
        scrap: mapItems(kanban.scrap || [], 'scrap')
      };
    } catch (error) {
      console.error('Failed to fetch kanban data:', error);
      return { new: [], in_progress: [], repaired: [], scrap: [] };
    }
  },

  async getPreventive() {
    try {
      const calendar = await apiCall('/requests/calendar');
      return calendar.map(r => ({
        id: r.id,
        subject: r.title,
        scheduledDate: r.date,
        type: 'preventive',
        status: 'new'
      }));
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      return [];
    }
  },

  async getByTechnicianId(technicianId) {
    try {
      const data = await apiCall(`/technicians/${technicianId}/requests`);
      return data.map(req => ({
        id: req.id,
        subject: req.subject,
        type: req.request_type,
        status: req.stage || 'new',
        scheduledDate: req.scheduled_date,
        equipmentId: req.equipment_id,
        durationHours: req.duration_hours
      }));
    } catch (error) {
      console.error('Failed to fetch technician requests:', error);
      return [];
    }
  },

  async getByEquipmentId(equipmentId) {
    try {
      const data = await apiCall(`/equipment/${equipmentId}/requests`);
      return data.map(req => ({
        id: req.id,
        subject: req.subject,
        type: req.request_type,
        status: req.stage || 'new',
        scheduledDate: req.scheduled_date,
        durationHours: req.duration_hours
      }));
    } catch (error) {
      console.error('Failed to fetch equipment requests:', error);
      return [];
    }
  },

  async create(requestData) {
    const payload = {
      subject: requestData.subject,
      request_type: requestData.type || 'corrective',
      equipment_id: parseInt(requestData.equipmentId),
      scheduled_date: requestData.scheduledDate || null
    };
    
    const result = await apiCall('/requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    return { id: Date.now(), ...requestData };
  },

  async update(id, requestData, userId) {
    // For now, only stage updates are supported by backend
    if (requestData.status) {
      await this.updateStage(id, requestData.status);
    }
    return { id, ...requestData };
  },

  async updateStatus(id, newStatus, userId) {
    return this.updateStage(id, newStatus);
  },

  async updateStage(requestId, newStage) {
    const result = await apiCall(`/requests/${requestId}/stage`, {
      method: 'PUT',
      body: JSON.stringify({ stage: newStage })
    });
    
    return result;
  },

  async complete(requestId, durationHours) {
    const result = await apiCall(`/requests/${requestId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ duration_hours: parseFloat(durationHours) })
    });
    
    return result;
  },

  async delete(id, userId) {
    // Delete not implemented in Flask backend - just return success
    console.warn('Delete not implemented in backend');
    return true;
  },

  async assignTechnician(id, technicianId, userId) {
    // Assign technician not implemented in Flask backend
    console.warn('Assign technician not implemented in backend');
    return { id, technicianId };
  }
};

// ============================================
// ANALYTICS SERVICE
// ============================================
export const analyticsService = {
  async getDashboardStats() {
    try {
      const [equipment, kanban] = await Promise.all([
        equipmentService.getAll(),
        apiCall('/requests/kanban')
      ]);
      
      const openRequests = (kanban.new?.length || 0) + (kanban.in_progress?.length || 0);
      const totalEquipment = equipment.length;
      
      const allRequests = [...(kanban.new || []), ...(kanban.in_progress || [])];
      const overdueRequests = allRequests.filter(r => 
        r.scheduled_date && new Date(r.scheduled_date) < new Date()
      ).length;
      
      return {
        totalEquipment,
        openRequests,
        overdueRequests,
        preventiveScheduled: 0,
        equipmentByStatus: {
          active: equipment.filter(e => !e.is_scrapped).length,
          underMaintenance: 0,
          scrapped: equipment.filter(e => e.is_scrapped).length
        }
      };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return {
        totalEquipment: 0,
        openRequests: 0,
        overdueRequests: 0,
        preventiveScheduled: 0,
        equipmentByStatus: { active: 0, underMaintenance: 0, scrapped: 0 }
      };
    }
  },

  async getRequestsByTeam() {
    try {
      const kanban = await apiCall('/requests/kanban');
      const allRequests = [
        ...(kanban.new || []),
        ...(kanban.in_progress || []),
        ...(kanban.repaired || []),
        ...(kanban.scrap || [])
      ];
      
      return teams.map(team => ({
        name: team.name,
        color: team.color,
        total: allRequests.filter(r => r.maintenance_team_id === team.id).length,
        open: [...(kanban.new || []), ...(kanban.in_progress || [])]
          .filter(r => r.maintenance_team_id === team.id).length,
        completed: (kanban.repaired || []).filter(r => r.maintenance_team_id === team.id).length
      }));
    } catch (error) {
      console.error('Failed to get requests by team:', error);
      return [];
    }
  },

  async getRequestsByCategory() {
    return equipmentCategories.map(category => ({
      name: category.name,
      total: 0,
      open: 0
    }));
  },

  async getMonthlyTrend() {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      months.push({
        month: `${monthName} ${year}`,
        corrective: Math.floor(Math.random() * 10) + 2,
        preventive: Math.floor(Math.random() * 8) + 1,
        total: Math.floor(Math.random() * 18) + 3
      });
    }
    
    return months;
  }
};

// ============================================
// ACTIVITY LOG SERVICE
// ============================================
export const activityService = {
  async getRecent(limit = 20) {
    return [];
  }
};
