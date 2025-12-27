/**
 * GearGuard - Request Detail Page
 * 
 * Detailed view of a maintenance request with status management.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  User,
  Calendar,
  Server,
  Users,
  FileText,
  ChevronRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { requestService, equipmentService, teamService, userService } from '../../services/api';
import { Button, Card, Badge, Avatar, Modal, Select, Skeleton, EmptyState } from '../../components/ui';

function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const { success, error } = useToast();

  const [request, setRequest] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [team, setTeam] = useState(null);
  const [technician, setTechnician] = useState(null);
  const [requester, setRequester] = useState(null);
  const [teamTechnicians, setTeamTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [deleteModal, setDeleteModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [completeModal, setCompleteModal] = useState(false);
  const [durationHours, setDurationHours] = useState('');

  const canManage = can('canManageAllRequests');
  const canAssign = can('canAssignTechnicians');
  const canUpdateOwn = can('canUpdateAssignedTasks') && request?.technicianId === user?.id;

  useEffect(() => {
    loadRequestData();
  }, [id]);

  const loadRequestData = async () => {
    try {
      const requestData = await requestService.getById(id);
      if (!requestData) {
        error('Request not found');
        navigate('/requests');
        return;
      }

      setRequest(requestData);

      // Load related data
      const [equipmentData, teamData] = await Promise.all([
        requestData.equipmentId ? equipmentService.getById(requestData.equipmentId) : null,
        requestData.teamId ? teamService.getById(requestData.teamId) : null
      ]);

      if (equipmentData) {
        const categories = equipmentService.getCategories();
        const locations = equipmentService.getLocations();
        setEquipment({
          ...equipmentData,
          category: categories.find(c => c.id === equipmentData.categoryId),
          location: locations.find(l => l.id === equipmentData.locationId)
        });
      }

      setTeam(teamData);

      // Load technician and requester
      if (requestData.technicianId) {
        const techData = await userService.getById(requestData.technicianId);
        setTechnician(techData);
      }
      if (requestData.requesterId) {
        const requesterData = await userService.getById(requestData.requesterId);
        setRequester(requesterData);
      }

      // Load team technicians for assignment
      if (teamData) {
        const techs = await userService.getByTeamId(teamData.id);
        setTeamTechnicians(techs);
      }
    } catch (err) {
      error('Failed to load request', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await requestService.updateStatus(id, newStatus, user.id);
      setRequest(prev => ({ 
        ...prev, 
        status: newStatus,
        completedDate: newStatus === 'repaired' ? new Date().toISOString() : prev.completedDate
      }));
      success('Status Updated', `Request marked as ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      error('Failed to update status', err.message);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) return;
    
    try {
      await requestService.assignTechnician(id, selectedTechnician, user.id);
      const techData = await userService.getById(selectedTechnician);
      setTechnician(techData);
      setRequest(prev => ({ ...prev, technicianId: selectedTechnician }));
      success('Technician Assigned', `${techData.name} has been assigned to this request.`);
      setAssignModal(false);
    } catch (err) {
      error('Failed to assign', err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await requestService.delete(id, user.id);
      success('Request Deleted', 'The maintenance request has been removed.');
      navigate('/requests');
    } catch (err) {
      error('Failed to delete', err.message);
    }
  };

  const handleCompleteRequest = async () => {
    if (!durationHours || parseFloat(durationHours) <= 0) {
      error('Invalid Duration', 'Please enter valid duration hours');
      return;
    }
    
    try {
      await requestService.complete(id, parseFloat(durationHours));
      setRequest(prev => ({ 
        ...prev, 
        status: 'repaired',
        durationHours: parseFloat(durationHours),
        completedDate: new Date().toISOString()
      }));
      success('Request Completed', 'The maintenance request has been marked as repaired.');
      setCompleteModal(false);
      setDurationHours('');
    } catch (err) {
      error('Failed to complete request', err.message);
    }
  };

  // Status helpers
  const getStatusBadge = (status) => {
    const config = {
      new: { variant: 'info', label: 'New', icon: Clock },
      in_progress: { variant: 'warning', label: 'In Progress', icon: AlertTriangle },
      repaired: { variant: 'success', label: 'Repaired', icon: CheckCircle },
      scrap: { variant: 'default', label: 'Scrap', icon: null }
    };
    const { variant, label, icon: Icon } = config[status] || { variant: 'default', label: status };
    return (
      <Badge variant={variant} size="lg">
        {Icon && <Icon className="w-4 h-4 mr-1" />}
        {label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = {
      low: { variant: 'success', label: 'Low Priority' },
      medium: { variant: 'warning', label: 'Medium Priority' },
      high: { variant: 'danger', label: 'High Priority' }
    };
    const { variant, label } = config[priority] || { variant: 'default', label: priority };
    return <Badge variant={variant}>{label}</Badge>;
  };

  // Valid status transitions
  const getAvailableTransitions = (currentStatus) => {
    const transitions = {
      new: ['in_progress', 'scrap'],
      in_progress: ['repaired', 'scrap'],
      repaired: ['scrap'],
      scrap: []
    };
    return transitions[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton.Card />
          </div>
          <Skeleton.Card />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title="Request not found"
          description="The request you're looking for doesn't exist."
          actionLabel="Back to Requests"
          onAction={() => navigate('/requests')}
        />
      </Card>
    );
  }

  const isOverdue = request.scheduledDate && 
    new Date(request.scheduledDate) < new Date() && 
    request.status !== 'repaired' && 
    request.status !== 'scrap';

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/requests')}
          />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{request.subject}</h1>
              {getStatusBadge(request.status)}
              {isOverdue && <Badge variant="danger">Overdue</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <Badge variant={request.type === 'preventive' ? 'primary' : 'warning'}>
                {request.type === 'preventive' ? 'Preventive' : 'Corrective'}
              </Badge>
              {getPriorityBadge(request.priority)}
              <span>•</span>
              <span>Created {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        
        {(canManage || canUpdateOwn) && request.status !== 'scrap' && (
          <div className="flex items-center gap-2">
            {canManage && (
              <Button
                variant="secondary"
                icon={Edit}
                onClick={() => navigate(`/requests/${id}/edit`)}
              >
                Edit
              </Button>
            )}
            {canManage && (
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => setDeleteModal(true)}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <Card.Header>
              <Card.Title>Description</Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-gray-700 whitespace-pre-wrap">
                {request.description || 'No description provided.'}
              </p>
              {request.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-2">Additional Notes</p>
                  <p className="text-gray-700">{request.notes}</p>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Equipment Info */}
          {equipment && (
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title>Equipment</Card.Title>
                  <Link 
                    to={`/equipment/${equipment.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    View Details <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Server className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{equipment.name}</h4>
                    <p className="text-sm text-gray-500">{equipment.serialNumber}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant={equipment.status === 'active' ? 'success' : 'warning'}>
                        {equipment.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {equipment.category?.name} • {equipment.location?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Timeline / History would go here */}
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Status Actions */}
          {(canManage || canUpdateOwn) && request.status !== 'scrap' && (
            <Card>
              <Card.Header>
                <Card.Title>Actions</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-3">
                {getAvailableTransitions(request.status).map(status => (
                  <Button
                    key={status}
                    variant={status === 'repaired' ? 'success' : status === 'in_progress' ? 'primary' : 'secondary'}
                    className="w-full"
                    icon={status === 'in_progress' ? Play : status === 'repaired' ? CheckCircle : AlertTriangle}
                    onClick={() => {
                      if (status === 'repaired') {
                        setCompleteModal(true);
                      } else {
                        handleStatusChange(status);
                      }
                    }}
                  >
                    {status === 'in_progress' ? 'Start Work' : 
                     status === 'repaired' ? 'Complete Request' : 
                     'Mark as Scrap'}
                  </Button>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Assignment */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>Assignment</Card.Title>
                {canAssign && request.status !== 'repaired' && request.status !== 'scrap' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedTechnician(request.technicianId || '');
                      setAssignModal(true);
                    }}
                  >
                    {technician ? 'Reassign' : 'Assign'}
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Content className="space-y-4">
              {/* Team */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Team</p>
                  <p className="font-medium">{team?.name || 'Unassigned'}</p>
                </div>
              </div>

              {/* Technician */}
              <div className="flex items-center gap-3">
                {technician ? (
                  <>
                    <Avatar name={technician.name} size="md" />
                    <div>
                      <p className="text-sm text-gray-500">Technician</p>
                      <p className="font-medium">{technician.name}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Technician</p>
                      <p className="text-gray-400">Unassigned</p>
                    </div>
                  </>
                )}
              </div>

              {/* Requester */}
              {requester && (
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <Avatar name={requester.name} size="sm" />
                  <div>
                    <p className="text-sm text-gray-500">Requested by</p>
                    <p className="font-medium text-sm">{requester.name}</p>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Schedule Info */}
          <Card>
            <Card.Header>
              <Card.Title>Schedule</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-3">
              {request.scheduledDate && (
                <div className="flex items-center gap-3">
                  <Calendar className={`w-5 h-5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm text-gray-500">Scheduled Date</p>
                    <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      {format(new Date(request.scheduledDate), 'MMMM d, yyyy')}
                      {isOverdue && ' (Overdue)'}
                    </p>
                  </div>
                </div>
              )}
              
              {request.duration && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Estimated Duration</p>
                    <p className="font-medium">{request.duration} hours</p>
                  </div>
                </div>
              )}

              {request.completedDate && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="font-medium">
                      {format(new Date(request.completedDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Created: {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
                <p className="text-xs text-gray-400">
                  Updated: {format(new Date(request.updatedAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Assign Technician Modal */}
      <Modal
        isOpen={assignModal}
        onClose={() => setAssignModal(false)}
        title="Assign Technician"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAssignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTechnician} disabled={!selectedTechnician}>
              Assign
            </Button>
          </div>
        }
      >
        <Select
          label="Select Technician"
          value={selectedTechnician}
          onChange={(e) => setSelectedTechnician(e.target.value)}
          options={teamTechnicians.map(t => ({ value: t.id, label: t.name }))}
          placeholder="Choose a technician"
          helperText={`Showing technicians from ${team?.name || 'the assigned team'}`}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Request"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete this maintenance request? This action cannot be undone.
        </p>
      </Modal>

      {/* Complete Request Modal */}
      <Modal
        isOpen={completeModal}
        onClose={() => {
          setCompleteModal(false);
          setDurationHours('');
        }}
        title="Complete Request"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => {
              setCompleteModal(false);
              setDurationHours('');
            }}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleCompleteRequest}
              disabled={!durationHours || parseFloat(durationHours) <= 0}
            >
              Complete
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Enter the total hours spent on this maintenance request before marking it as completed.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (hours) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 2.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the total time spent including diagnosis and repair
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RequestDetailPage;
