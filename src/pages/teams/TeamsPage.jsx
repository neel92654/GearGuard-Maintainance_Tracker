/**
 * GearGuard - Teams Page
 * 
 * Displays maintenance teams with member management.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  Edit,
  Trash2,
  UserPlus,
  MoreVertical,
  Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { teamService, userService } from '../../services/api';
import { Button, Card, Badge, Avatar, Modal, Input, Select, EmptyState, Skeleton } from '../../components/ui';

// Team Card Component
function TeamCard({ team, onEdit, onDelete, canManage }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card className="relative">
      {/* Team Color Stripe */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: team.color }}
      />
      
      <div className="pt-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{team.description}</p>
          </div>
          {canManage && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0" 
                    onClick={() => setShowMenu(false)} 
                  />
                  <div className="dropdown-menu">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(team);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Team
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(team);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Team
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Team Leader */}
        {team.leader && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-yellow-50 rounded-lg">
            <Crown className="w-4 h-4 text-yellow-600" />
            <Avatar name={team.leader.name} size="xs" />
            <span className="text-sm font-medium text-yellow-800">{team.leader.name}</span>
            <Badge variant="warning" size="sm">Leader</Badge>
          </div>
        )}

        {/* Members */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Team Members ({team.members?.length || 0})
          </p>
          {team.members && team.members.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {team.members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-full"
                >
                  <Avatar name={member.name} size="xs" />
                  <span className="text-sm text-gray-700">{member.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No members assigned</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{team.members?.length || 0} members</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Team Form Modal
function TeamFormModal({ isOpen, onClose, team, technicians, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    leaderId: '',
    memberIds: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        description: team.description || '',
        color: team.color || '#3b82f6',
        leaderId: team.leaderId || '',
        memberIds: team.memberIds || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6',
        leaderId: '',
        memberIds: []
      });
    }
  }, [team, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggleMember = (memberId) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter(id => id !== memberId)
        : [...prev.memberIds, memberId]
    }));
  };

  const colorOptions = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={team ? 'Edit Team' : 'Create Team'}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {team ? 'Save Changes' : 'Create Team'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Team Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter team name"
          required
        />
        
        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the team"
        />

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Team Color</label>
          <div className="flex gap-2">
            {colorOptions.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color }))}
                className={`w-8 h-8 rounded-full transition-transform ${
                  formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Team Leader */}
        <Select
          label="Team Leader"
          value={formData.leaderId}
          onChange={(e) => setFormData(prev => ({ ...prev, leaderId: e.target.value }))}
          options={technicians.map(t => ({ value: t.id, label: t.name }))}
          placeholder="Select team leader"
        />

        {/* Members */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Members
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {technicians.map(tech => (
              <label
                key={tech.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.memberIds.includes(tech.id)}
                  onChange={() => toggleMember(tech.id)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <Avatar name={tech.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{tech.name}</p>
                  <p className="text-xs text-gray-500">{tech.email}</p>
                </div>
              </label>
            ))}
            {technicians.length === 0 && (
              <p className="p-4 text-sm text-gray-500 text-center">
                No technicians available
              </p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}

function TeamsPage() {
  const { can, user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState({ open: false, team: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, team: null });

  const canManage = can('canManageTeams');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamsData, techsData] = await Promise.all([
        teamService.getWithMembers(),
        userService.getTechnicians()
      ]);
      setTeams(teamsData);
      setTechnicians(techsData);
    } catch (err) {
      error('Failed to load teams', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeam = async (formData) => {
    try {
      if (formModal.team) {
        // Update existing team
        await teamService.update(formModal.team.id, formData);
        success('Team Updated', 'The team has been updated successfully.');
      } else {
        // Create new team
        await teamService.create(formData);
        success('Team Created', 'The team has been created successfully.');
      }
      loadData(); // Reload to get fresh data
    } catch (err) {
      error('Failed to save team', err.message);
      throw err;
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteModal.team) return;
    
    try {
      await teamService.delete(deleteModal.team.id);
      setTeams(prev => prev.filter(t => t.id !== deleteModal.team.id));
      success('Team Deleted', 'The team has been removed.');
    } catch (err) {
      error('Failed to delete', err.message);
    } finally {
      setDeleteModal({ open: false, team: null });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton.Card key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Teams</h1>
          <p className="text-gray-600">Manage your maintenance teams and technicians</p>
        </div>
        {canManage && (
          <Button 
            icon={Plus} 
            onClick={() => setFormModal({ open: true, team: null })}
          >
            Add Team
          </Button>
        )}
      </div>

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={(t) => setFormModal({ open: true, team: t })}
              onDelete={(t) => setDeleteModal({ open: true, team: t })}
              canManage={canManage}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Users}
            title="No teams yet"
            description="Create your first maintenance team to organize technicians"
            actionLabel="Create Team"
            onAction={canManage ? () => setFormModal({ open: true, team: null }) : null}
          />
        </Card>
      )}

      {/* Team Form Modal */}
      <TeamFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, team: null })}
        team={formModal.team}
        technicians={technicians}
        onSave={handleSaveTeam}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, team: null })}
        title="Delete Team"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setDeleteModal({ open: false, team: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTeam}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{deleteModal.team?.name}</strong>? 
          Team members will be unassigned but not deleted.
        </p>
      </Modal>
    </div>
  );
}

export default TeamsPage;
