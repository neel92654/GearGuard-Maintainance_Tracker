/**
 * GearGuard - Equipment Detail Page
 * 
 * Detailed view of equipment with maintenance history and smart buttons.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Server,
  Calendar,
  MapPin,
  Building,
  Users,
  Shield,
  AlertCircle,
  Wrench,
  Plus,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { equipmentService, requestService, teamService } from '../../services/api';
import { Button, Card, Badge, Modal, Skeleton, EmptyState } from '../../components/ui';

function EquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can, user } = useAuth();
  const { success, error } = useToast();

  const [equipment, setEquipment] = useState(null);
  const [team, setTeam] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [scrapModal, setScrapModal] = useState(false);

  const canManage = can('canManageEquipment');
  const canScrap = can('canScrapEquipment');

  useEffect(() => {
    loadEquipmentData();
  }, [id]);

  const loadEquipmentData = async () => {
    try {
      const [equipmentData, requestsData] = await Promise.all([
        equipmentService.getById(id),
        requestService.getByEquipmentId(id)
      ]);

      if (!equipmentData) {
        error('Equipment not found');
        navigate('/equipment');
        return;
      }

      // Get additional details
      const categories = equipmentService.getCategories();
      const departments = equipmentService.getDepartments();
      const locations = equipmentService.getLocations();

      const enrichedEquipment = {
        ...equipmentData,
        category: categories.find(c => c.id === equipmentData.categoryId),
        department: departments.find(d => d.id === equipmentData.departmentId),
        location: locations.find(l => l.id === equipmentData.locationId)
      };

      setEquipment(enrichedEquipment);
      setRequests(requestsData);

      // Get team details
      if (equipmentData.teamId) {
        const teamData = await teamService.getById(equipmentData.teamId);
        setTeam(teamData);
      }
    } catch (err) {
      error('Failed to load equipment', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await equipmentService.delete(id, user.id);
      success('Equipment Deleted', 'The equipment has been removed.');
      navigate('/equipment');
    } catch (err) {
      error('Failed to delete', err.message);
    }
  };

  const handleScrap = async () => {
    try {
      await equipmentService.scrap(id, user.id);
      setEquipment(prev => ({ ...prev, status: 'scrapped' }));
      success('Equipment Scrapped', 'The equipment has been marked as scrapped.');
      setScrapModal(false);
    } catch (err) {
      error('Failed to scrap', err.message);
    }
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const config = {
      active: { variant: 'success', label: 'Active' },
      under_maintenance: { variant: 'warning', label: 'Under Maintenance' },
      scrapped: { variant: 'default', label: 'Scrapped' }
    };
    const { variant, label } = config[status] || { variant: 'default', label: status };
    return <Badge variant={variant} size="lg">{label}</Badge>;
  };

  // Check warranty status
  const isWarrantyExpired = equipment?.warrantyExpiry && new Date(equipment.warrantyExpiry) < new Date();
  const isWarrantyExpiringSoon = equipment?.warrantyExpiry && 
    new Date(equipment.warrantyExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
    !isWarrantyExpired;

  // Stats
  const openRequests = requests.filter(r => r.status === 'new' || r.status === 'in_progress');
  const completedRequests = requests.filter(r => r.status === 'repaired');

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

  if (!equipment) {
    return (
      <Card>
        <EmptyState
          icon={Server}
          title="Equipment not found"
          description="The equipment you're looking for doesn't exist."
          actionLabel="Back to Equipment"
          onAction={() => navigate('/equipment')}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/equipment')}
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
              {getStatusBadge(equipment.status)}
            </div>
            <p className="text-gray-500">{equipment.serialNumber}</p>
          </div>
        </div>
        
        {canManage && equipment.status !== 'scrapped' && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={Edit}
              onClick={() => navigate(`/equipment/${id}/edit`)}
            >
              Edit
            </Button>
            {canScrap && (
              <Button
                variant="warning"
                icon={AlertCircle}
                onClick={() => setScrapModal(true)}
              >
                Scrap
              </Button>
            )}
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => setDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Equipment Details */}
          <Card>
            <Card.Header>
              <Card.Title>Equipment Details</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Server className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{equipment.category?.name || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium">{equipment.department?.name || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{equipment.location?.name || '-'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Purchase Date</p>
                      <p className="font-medium">
                        {equipment.purchaseDate 
                          ? format(new Date(equipment.purchaseDate), 'MMM d, yyyy')
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isWarrantyExpired ? 'bg-red-100' : isWarrantyExpiringSoon ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <Shield className={`w-5 h-5 ${
                        isWarrantyExpired ? 'text-red-600' : isWarrantyExpiringSoon ? 'text-yellow-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Warranty Expiry</p>
                      <p className={`font-medium ${isWarrantyExpired ? 'text-red-600' : ''}`}>
                        {equipment.warrantyExpiry 
                          ? format(new Date(equipment.warrantyExpiry), 'MMM d, yyyy')
                          : '-'
                        }
                        {isWarrantyExpired && <span className="text-sm text-red-500 ml-2">(Expired)</span>}
                        {isWarrantyExpiringSoon && <span className="text-sm text-yellow-600 ml-2">(Expiring Soon)</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assigned Team</p>
                      <p className="font-medium">{team?.name || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {equipment.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-gray-700">{equipment.notes}</p>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Maintenance History */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <Card.Title>Maintenance History</Card.Title>
                  <Card.Description>{requests.length} total requests</Card.Description>
                </div>
                {equipment.status !== 'scrapped' && (
                  <Button
                    size="sm"
                    icon={Plus}
                    onClick={() => navigate(`/requests/new?equipmentId=${equipment.id}`)}
                  >
                    New Request
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Content>
              {requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.map(request => (
                    <Link
                      key={request.id}
                      to={`/requests/${request.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{request.subject}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {format(new Date(request.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={request.priority === 'high' ? 'danger' : request.priority === 'medium' ? 'warning' : 'success'}
                            size="sm"
                          >
                            {request.priority}
                          </Badge>
                          <Badge 
                            variant={
                              request.status === 'new' ? 'info' :
                              request.status === 'in_progress' ? 'warning' :
                              request.status === 'repaired' ? 'success' : 'default'
                            }
                            size="sm"
                          >
                            {request.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Wrench}
                  title="No maintenance history"
                  description="This equipment has no maintenance requests yet."
                />
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Right Column - Stats & Quick Actions */}
        <div className="space-y-6">
          {/* Smart Button - Maintenance Count */}
          <Card 
            hover 
            className="cursor-pointer"
            onClick={() => navigate(`/requests?equipmentId=${equipment.id}`)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900">{openRequests.length}</p>
                <p className="text-sm text-gray-500">Open Requests</p>
              </div>
              <Badge variant={openRequests.length > 0 ? 'warning' : 'success'}>
                {openRequests.length > 0 ? 'Active' : 'Clear'}
              </Badge>
            </div>
          </Card>

          {/* Stats */}
          <Card>
            <Card.Header>
              <Card.Title>Statistics</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Total Requests</span>
                </div>
                <span className="font-semibold">{requests.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600">Open</span>
                </div>
                <span className="font-semibold">{openRequests.length}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Completed</span>
                </div>
                <span className="font-semibold">{completedRequests.length}</span>
              </div>
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          {equipment.status !== 'scrapped' && (
            <Card>
              <Card.Header>
                <Card.Title>Quick Actions</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  icon={Plus}
                  onClick={() => navigate(`/requests/new?equipmentId=${equipment.id}`)}
                >
                  Create Maintenance Request
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  icon={Calendar}
                  onClick={() => navigate(`/requests/new?equipmentId=${equipment.id}&type=preventive`)}
                >
                  Schedule Preventive Maintenance
                </Button>
              </Card.Content>
            </Card>
          )}

          {/* Scrap Warning */}
          {equipment.status === 'scrapped' && (
            <Card className="border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Equipment Scrapped</p>
                  <p className="text-sm text-red-600 mt-1">
                    This equipment has been scrapped. No new maintenance requests can be created.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Equipment"
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
          Are you sure you want to delete <strong>{equipment.name}</strong>? 
          This action cannot be undone.
        </p>
      </Modal>

      {/* Scrap Modal */}
      <Modal
        isOpen={scrapModal}
        onClose={() => setScrapModal(false)}
        title="Scrap Equipment"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setScrapModal(false)}>
              Cancel
            </Button>
            <Button variant="warning" onClick={handleScrap}>
              Confirm Scrap
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-gray-900">
              Mark <strong>{equipment.name}</strong> as scrapped?
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Scrapped equipment cannot receive new maintenance requests. This action can be undone by editing the equipment.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default EquipmentDetailPage;
