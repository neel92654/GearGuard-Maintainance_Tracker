/**
 * GearGuard - Maintenance Requests List Page
 * 
 * Displays all maintenance requests with filtering and status management.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { requestService, teamService } from '../../services/api';
import { Button, Card, Badge, Avatar, Input, Select, Modal, EmptyState, Skeleton } from '../../components/ui';

// Priority badge helper
function PriorityBadge({ priority }) {
  const config = {
    low: { variant: 'success', label: 'Low' },
    medium: { variant: 'warning', label: 'Medium' },
    high: { variant: 'danger', label: 'High' }
  };
  const { variant, label } = config[priority] || { variant: 'default', label: priority };
  return <Badge variant={variant} size="sm">{label}</Badge>;
}

// Status badge helper
function StatusBadge({ status }) {
  const config = {
    new: { variant: 'info', label: 'New', icon: Clock },
    in_progress: { variant: 'warning', label: 'In Progress', icon: AlertTriangle },
    repaired: { variant: 'success', label: 'Repaired', icon: CheckCircle },
    scrap: { variant: 'default', label: 'Scrap', icon: null }
  };
  const { variant, label } = config[status] || { variant: 'default', label: status };
  return <Badge variant={variant} size="sm">{label}</Badge>;
}

// Request Row Component
function RequestRow({ request, onView, onEdit, onDelete, canManage }) {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <tr 
      className="table-row-hover cursor-pointer"
      onClick={() => navigate(`/requests/${request.id}`)}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            request.type === 'preventive' ? 'bg-blue-100' : 'bg-orange-100'
          }`}>
            <ClipboardList className={`w-5 h-5 ${
              request.type === 'preventive' ? 'text-blue-600' : 'text-orange-600'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{request.subject}</p>
              {request.isOverdue && (
                <Badge variant="danger" size="sm">Overdue</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">{request.equipment?.name || 'Unknown Equipment'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <Badge variant={request.type === 'preventive' ? 'primary' : 'warning'} size="sm">
          {request.type === 'preventive' ? 'Preventive' : 'Corrective'}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <PriorityBadge priority={request.priority} />
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={request.status} />
      </td>
      <td className="px-4 py-4">
        {request.technician ? (
          <div className="flex items-center gap-2">
            <Avatar name={request.technician.name} size="sm" />
            <span className="text-sm text-gray-600">{request.technician.name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        )}
      </td>
      <td className="px-4 py-4 text-sm text-gray-500">
        {request.scheduledDate 
          ? format(new Date(request.scheduledDate), 'MMM d, yyyy')
          : '-'
        }
      </td>
      <td className="px-4 py-4 text-sm text-gray-500">
        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
      </td>
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
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
                      navigate(`/requests/${request.id}`);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate(`/requests/${request.id}/edit`);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(request);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function RequestsListPage() {
  const { can, user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [requests, setRequests] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, request: null });

  const canManage = can('canManageAllRequests');
  const canCreate = can('canCreateRequests') || canManage;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requestsData, teamsData] = await Promise.all([
        requestService.getWithDetails(),
        teamService.getAll()
      ]);
      
      // Filter based on user role
      let filteredRequests = requestsData;
      if (user.role === 'technician') {
        // Technicians see only their team's requests
        filteredRequests = requestsData.filter(r => r.teamId === user.teamId);
      } else if (user.role === 'user') {
        // Regular users see only their own requests
        filteredRequests = requestsData.filter(r => r.requesterId === user.id);
      }
      
      setRequests(filteredRequests);
      setTeams(teamsData);
    } catch (err) {
      error('Failed to load requests', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = !searchQuery || 
        req.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.equipment?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || req.status === statusFilter;
      const matchesType = !typeFilter || req.type === typeFilter;
      const matchesPriority = !priorityFilter || req.priority === priorityFilter;
      const matchesTeam = !teamFilter || req.teamId === teamFilter;
      
      // Special filter for overdue
      if (searchParams.get('filter') === 'overdue') {
        return matchesSearch && req.isOverdue;
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesTeam;
    });
  }, [requests, searchQuery, statusFilter, typeFilter, priorityFilter, teamFilter, searchParams]);

  const handleDelete = async () => {
    if (!deleteModal.request) return;
    
    try {
      await requestService.delete(deleteModal.request.id, user.id);
      setRequests(prev => prev.filter(r => r.id !== deleteModal.request.id));
      success('Request Deleted', 'The maintenance request has been removed.');
    } catch (err) {
      error('Failed to delete', err.message);
    } finally {
      setDeleteModal({ open: false, request: null });
    }
  };

  // Summary stats
  const stats = useMemo(() => ({
    total: requests.length,
    open: requests.filter(r => r.status === 'new' || r.status === 'in_progress').length,
    overdue: requests.filter(r => r.isOverdue).length,
    completed: requests.filter(r => r.status === 'repaired').length
  }), [requests]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton.Stats />
        <Skeleton.Table rows={8} columns={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-600">Track and manage all maintenance work orders</p>
        </div>
        {canCreate && (
          <Button icon={Plus} onClick={() => navigate('/requests/new')}>
            New Request
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Requests</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-yellow-600">{stats.open}</p>
          <p className="text-sm text-gray-500">Open</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
          <p className="text-sm text-gray-500">Overdue</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-sm text-gray-500">Completed</p>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search requests..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'new', label: 'New' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'repaired', label: 'Repaired' },
              { value: 'scrap', label: 'Scrap' }
            ]}
            placeholder="All Statuses"
            className="w-full lg:w-40"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'corrective', label: 'Corrective' },
              { value: 'preventive', label: 'Preventive' }
            ]}
            placeholder="All Types"
            className="w-full lg:w-40"
          />
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }
            ]}
            placeholder="All Priorities"
            className="w-full lg:w-40"
          />
          <Select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            options={teams.map(t => ({ value: t.id, label: t.name }))}
            placeholder="All Teams"
            className="w-full lg:w-40"
          />
        </div>
      </Card>

      {/* Requests Table */}
      {filteredRequests.length > 0 ? (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Request</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Technician</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map(request => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    onDelete={(r) => setDeleteModal({ open: true, request: r })}
                    canManage={canManage}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No requests found"
            description={searchQuery || statusFilter || typeFilter || priorityFilter
              ? "Try adjusting your filters"
              : "Create your first maintenance request to get started"
            }
            actionLabel="New Request"
            onAction={canCreate ? () => navigate('/requests/new') : null}
          />
        </Card>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, request: null })}
        title="Delete Request"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, request: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete this request? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

export default RequestsListPage;
