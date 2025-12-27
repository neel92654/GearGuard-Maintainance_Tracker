/**
 * GearGuard - Maintenance Request Form Page
 * 
 * Create and edit maintenance requests with smart auto-fill logic.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Wrench, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { requestService, equipmentService, teamService, userService } from '../../services/api';
import { Button, Card, Input, Select, Textarea, Skeleton, Badge } from '../../components/ui';

function RequestFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Reference data
  const [equipmentList, setEquipmentList] = useState([]);
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    type: searchParams.get('type') || 'corrective',
    equipmentId: searchParams.get('equipmentId') || '',
    teamId: '',
    technicianId: '',
    scheduledDate: '',
    duration: '',
    priority: 'medium',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  // When equipment changes, auto-fill team
  useEffect(() => {
    if (formData.equipmentId && !isEditing) {
      const equipment = equipmentList.find(e => e.id === formData.equipmentId);
      if (equipment && equipment.teamId) {
        setFormData(prev => ({ ...prev, teamId: equipment.teamId }));
        setSelectedEquipment(equipment);
        loadTeamTechnicians(equipment.teamId);
      }
    }
  }, [formData.equipmentId, equipmentList, isEditing]);

  // When team changes, load technicians
  useEffect(() => {
    if (formData.teamId) {
      loadTeamTechnicians(formData.teamId);
    }
  }, [formData.teamId]);

  const loadData = async () => {
    try {
      const [equipmentData, teamsData] = await Promise.all([
        equipmentService.getWithDetails(),
        teamService.getAll()
      ]);

      // Filter out scrapped equipment for new requests
      const availableEquipment = equipmentData.filter(e => e.status !== 'scrapped');
      setEquipmentList(availableEquipment);
      setTeams(teamsData);

      // Load existing request if editing
      if (isEditing) {
        const request = await requestService.getById(id);
        if (request) {
          setFormData({
            subject: request.subject || '',
            description: request.description || '',
            type: request.type || 'corrective',
            equipmentId: request.equipmentId || '',
            teamId: request.teamId || '',
            technicianId: request.technicianId || '',
            scheduledDate: request.scheduledDate || '',
            duration: request.duration?.toString() || '',
            priority: request.priority || 'medium',
            notes: request.notes || ''
          });
          
          // Load technicians for the team
          if (request.teamId) {
            await loadTeamTechnicians(request.teamId);
          }
          
          // Set selected equipment for display
          const eq = equipmentData.find(e => e.id === request.equipmentId);
          setSelectedEquipment(eq);
        } else {
          error('Request not found');
          navigate('/requests');
        }
      } else if (searchParams.get('equipmentId')) {
        // Pre-fill equipment from URL
        const eq = availableEquipment.find(e => e.id === searchParams.get('equipmentId'));
        if (eq) {
          setFormData(prev => ({ 
            ...prev, 
            equipmentId: eq.id,
            teamId: eq.teamId || ''
          }));
          setSelectedEquipment(eq);
          if (eq.teamId) {
            await loadTeamTechnicians(eq.teamId);
          }
        }
      }
    } catch (err) {
      error('Failed to load data', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamTechnicians = async (teamId) => {
    try {
      const techs = await userService.getByTeamId(teamId);
      setTechnicians(techs);
      
      // Clear technician if they don't belong to new team
      if (formData.technicianId) {
        const techBelongsToTeam = techs.some(t => t.id === formData.technicianId);
        if (!techBelongsToTeam) {
          setFormData(prev => ({ ...prev, technicianId: '' }));
        }
      }
    } catch (err) {
      console.error('Failed to load technicians:', err);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.equipmentId) {
      newErrors.equipmentId = 'Please select equipment';
    }
    if (!formData.teamId) {
      newErrors.teamId = 'Please select a maintenance team';
    }
    if (formData.type === 'preventive' && !formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required for preventive maintenance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSaving(true);
    try {
      const requestData = {
        ...formData,
        duration: formData.duration ? parseFloat(formData.duration) : null
      };

      if (isEditing) {
        await requestService.update(id, requestData, user.id);
        success('Request Updated', 'The maintenance request has been updated.');
        navigate(`/requests/${id}`);
      } else {
        const newRequest = await requestService.create(requestData, user.id);
        success('Request Created', 'The maintenance request has been created.');
        navigate(`/requests/${newRequest.id}`);
      }
    } catch (err) {
      error('Failed to save', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton.Card />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate(isEditing ? `/requests/${id}` : '/requests')}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Request' : 'New Maintenance Request'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Update request details' : 'Create a new maintenance work order'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <Card.Header>
            <Card.Title>Request Details</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-6">
            {/* Request Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className={`
                  flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors
                  ${formData.type === 'corrective' 
                    ? 'border-orange-300 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <input
                    type="radio"
                    name="type"
                    value="corrective"
                    checked={formData.type === 'corrective'}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Corrective (Breakdown)</p>
                    <p className="text-sm text-gray-500">Equipment has failed or needs urgent repair</p>
                  </div>
                </label>
                <label className={`
                  flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors
                  ${formData.type === 'preventive' 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <input
                    type="radio"
                    name="type"
                    value="preventive"
                    checked={formData.type === 'preventive'}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Preventive (Scheduled)</p>
                    <p className="text-sm text-gray-500">Regular maintenance or inspection</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Subject */}
            <Input
              label="Subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Brief description of the issue or task"
              error={errors.subject}
              required
            />

            {/* Description */}
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description of the maintenance request..."
              rows={4}
            />

            {/* Equipment Selection */}
            <div>
              <Select
                label="Equipment"
                value={formData.equipmentId}
                onChange={(e) => handleChange('equipmentId', e.target.value)}
                options={equipmentList.map(eq => ({
                  value: eq.id,
                  label: `${eq.name} (${eq.serialNumber})`
                }))}
                placeholder="Select equipment"
                error={errors.equipmentId}
                required
              />
              {selectedEquipment && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={selectedEquipment.status === 'active' ? 'success' : 'warning'}>
                      {selectedEquipment.status}
                    </Badge>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-600">{selectedEquipment.location?.name}</span>
                  </div>
                  {selectedEquipment.team && (
                    <p className="text-gray-500">
                      Assigned Team: <span className="font-medium text-gray-700">{selectedEquipment.team.name}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Team & Technician */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Maintenance Team"
                value={formData.teamId}
                onChange={(e) => handleChange('teamId', e.target.value)}
                options={teams.map(t => ({ value: t.id, label: t.name }))}
                placeholder="Select team"
                error={errors.teamId}
                required
                helperText="Auto-filled from equipment assignment"
              />
              <Select
                label="Assign Technician"
                value={formData.technicianId}
                onChange={(e) => handleChange('technicianId', e.target.value)}
                options={technicians.map(t => ({ value: t.id, label: t.name }))}
                placeholder="Select technician (optional)"
                helperText={technicians.length === 0 ? 'Select a team first' : 'Only team members shown'}
              />
            </div>

            {/* Scheduled Date (for preventive) */}
            {formData.type === 'preventive' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Scheduled Date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleChange('scheduledDate', e.target.value)}
                  error={errors.scheduledDate}
                  required
                />
                <Input
                  label="Estimated Duration (hours)"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  placeholder="e.g., 2.5"
                />
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="flex gap-3">
                {[
                  { value: 'low', label: 'Low', color: 'green' },
                  { value: 'medium', label: 'Medium', color: 'yellow' },
                  { value: 'high', label: 'High', color: 'red' }
                ].map(p => (
                  <label
                    key={p.value}
                    className={`
                      flex-1 text-center py-2 px-4 border rounded-lg cursor-pointer transition-all
                      ${formData.priority === p.value
                        ? `border-${p.color}-300 bg-${p.color}-50 text-${p.color}-700`
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={p.value}
                      checked={formData.priority === p.value}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      className="sr-only"
                    />
                    <span className={`font-medium ${
                      formData.priority === p.value
                        ? p.value === 'high' ? 'text-red-700' 
                          : p.value === 'medium' ? 'text-yellow-700' 
                          : 'text-green-700'
                        : 'text-gray-700'
                    }`}>
                      {p.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <Textarea
              label="Additional Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information..."
              rows={2}
            />
          </Card.Content>
          <Card.Footer>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(isEditing ? `/requests/${id}` : '/requests')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                icon={Save}
                loading={saving}
              >
                {isEditing ? 'Save Changes' : 'Create Request'}
              </Button>
            </div>
          </Card.Footer>
        </Card>
      </form>
    </div>
  );
}

export default RequestFormPage;
