/**
 * GearGuard - Equipment Form Page
 * 
 * Create and edit equipment form.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Server } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { equipmentService, teamService } from '../../services/api';
import { Button, Card, Input, Select, Textarea, Skeleton } from '../../components/ui';

function EquipmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    categoryId: '',
    departmentId: '',
    locationId: '',
    purchaseDate: '',
    warrantyExpiry: '',
    teamId: '',
    status: 'active',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Get static data
  const categories = equipmentService.getCategories();
  const departments = equipmentService.getDepartments();
  const locations = equipmentService.getLocations();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      // Load teams
      const teamsData = await teamService.getAll();
      setTeams(teamsData);

      // Load existing equipment if editing
      if (isEditing) {
        const equipment = await equipmentService.getById(id);
        if (equipment) {
          setFormData({
            name: equipment.name || '',
            serialNumber: equipment.serialNumber || '',
            categoryId: equipment.categoryId || '',
            departmentId: equipment.departmentId || '',
            locationId: equipment.locationId || '',
            purchaseDate: equipment.purchaseDate || '',
            warrantyExpiry: equipment.warrantyExpiry || '',
            teamId: equipment.teamId || '',
            status: equipment.status || 'active',
            notes: equipment.notes || ''
          });
        } else {
          error('Equipment not found');
          navigate('/equipment');
        }
      }
    } catch (err) {
      error('Failed to load data', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Equipment name is required';
    }
    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    if (!formData.departmentId) {
      newErrors.departmentId = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSaving(true);
    try {
      if (isEditing) {
        await equipmentService.update(id, formData, user.id);
        success('Equipment Updated', 'The equipment has been updated successfully.');
      } else {
        const newEquipment = await equipmentService.create(formData, user.id);
        success('Equipment Created', 'The equipment has been added successfully.');
        navigate(`/equipment/${newEquipment.id}`);
        return;
      }
      navigate(`/equipment/${id}`);
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
          onClick={() => navigate(isEditing ? `/equipment/${id}` : '/equipment')}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Equipment' : 'Add Equipment'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Update equipment information' : 'Add new equipment to the system'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <Card.Header>
            <Card.Title>Equipment Information</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Equipment Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter equipment name"
                error={errors.name}
                required
              />
              <Input
                label="Serial Number"
                value={formData.serialNumber}
                onChange={(e) => handleChange('serialNumber', e.target.value)}
                placeholder="Enter serial number"
                error={errors.serialNumber}
                required
              />
            </div>

            {/* Category & Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category"
                value={formData.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Select category"
                error={errors.categoryId}
                required
              />
              <Select
                label="Department"
                value={formData.departmentId}
                onChange={(e) => handleChange('departmentId', e.target.value)}
                options={departments.map(d => ({ value: d.id, label: d.name }))}
                placeholder="Select department"
                error={errors.departmentId}
                required
              />
            </div>

            {/* Location & Team */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Location"
                value={formData.locationId}
                onChange={(e) => handleChange('locationId', e.target.value)}
                options={locations.map(l => ({ value: l.id, label: l.name }))}
                placeholder="Select location"
              />
              <Select
                label="Assigned Maintenance Team"
                value={formData.teamId}
                onChange={(e) => handleChange('teamId', e.target.value)}
                options={teams.map(t => ({ value: t.id, label: t.name }))}
                placeholder="Select team"
                helperText="Team responsible for maintaining this equipment"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Purchase Date"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleChange('purchaseDate', e.target.value)}
              />
              <Input
                label="Warranty Expiry"
                type="date"
                value={formData.warrantyExpiry}
                onChange={(e) => handleChange('warrantyExpiry', e.target.value)}
              />
            </div>

            {/* Status (only for editing) */}
            {isEditing && (
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'under_maintenance', label: 'Under Maintenance' },
                  { value: 'scrapped', label: 'Scrapped' }
                ]}
              />
            )}

            {/* Notes */}
            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about this equipment..."
              rows={3}
            />
          </Card.Content>
          <Card.Footer>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(isEditing ? `/equipment/${id}` : '/equipment')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                icon={Save}
                loading={saving}
              >
                {isEditing ? 'Save Changes' : 'Create Equipment'}
              </Button>
            </div>
          </Card.Footer>
        </Card>
      </form>
    </div>
  );
}

export default EquipmentFormPage;
