/**
 * GearGuard - Equipment List Page
 * 
 * Displays all equipment with filtering, searching, and grouping options.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Server,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Wrench,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { equipmentService } from '../../services/api';
import { Button, Card, Badge, Input, Select, Modal, EmptyState, Skeleton } from '../../components/ui';

// Status badge component
function StatusBadge({ status }) {
  const config = {
    active: { variant: 'success', label: 'Active' },
    under_maintenance: { variant: 'warning', label: 'Under Maintenance' },
    scrapped: { variant: 'default', label: 'Scrapped' }
  };
  const { variant, label } = config[status] || { variant: 'default', label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

// Equipment row component
function EquipmentRow({ equipment, onEdit, onDelete, canManage }) {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <tr 
      className="table-row-hover cursor-pointer"
      onClick={() => navigate(`/equipment/${equipment.id}`)}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Server className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{equipment.name}</p>
            <p className="text-sm text-gray-500">{equipment.serialNumber}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">
        {equipment.category?.name || '-'}
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">
        {equipment.department?.name || '-'}
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">
        {equipment.location?.name || '-'}
      </td>
      <td className="px-4 py-4 text-sm">
        {equipment.team?.name || '-'}
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={equipment.status} />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {equipment.openRequestsCount > 0 && (
            <Badge variant="warning" size="sm">
              <Wrench className="w-3 h-3 mr-1" />
              {equipment.openRequestsCount}
            </Badge>
          )}
        </div>
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
                      onEdit(equipment);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(equipment);
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

function EquipmentListPage() {
  const { can, user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, equipment: null });

  const canManage = can('canManageEquipment');
  const categories = equipmentService.getCategories();
  const departments = equipmentService.getDepartments();

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await equipmentService.getWithDetails();
      setEquipment(data);
    } catch (err) {
      error('Failed to load equipment', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter equipment
  const filteredEquipment = useMemo(() => {
    return equipment.filter(eq => {
      const matchesSearch = !searchQuery || 
        eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || eq.status === statusFilter;
      const matchesDepartment = !departmentFilter || eq.departmentId === departmentFilter;
      const matchesCategory = !categoryFilter || eq.categoryId === categoryFilter;
      return matchesSearch && matchesStatus && matchesDepartment && matchesCategory;
    });
  }, [equipment, searchQuery, statusFilter, departmentFilter, categoryFilter]);

  const handleDelete = async () => {
    if (!deleteModal.equipment) return;
    
    try {
      await equipmentService.delete(deleteModal.equipment.id, user.id);
      setEquipment(prev => prev.filter(e => e.id !== deleteModal.equipment.id));
      success('Equipment Deleted', `${deleteModal.equipment.name} has been removed.`);
    } catch (err) {
      error('Failed to delete', err.message);
    } finally {
      setDeleteModal({ open: false, equipment: null });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton.Table rows={8} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
          <p className="text-gray-600">Manage your equipment and assets</p>
        </div>
        {canManage && (
          <Button icon={Plus} onClick={() => navigate('/equipment/new')}>
            Add Equipment
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search equipment..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'under_maintenance', label: 'Under Maintenance' },
              { value: 'scrapped', label: 'Scrapped' }
            ]}
            placeholder="All Statuses"
            className="w-full md:w-48"
          />
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={departments.map(d => ({ value: d.id, label: d.name }))}
            placeholder="All Departments"
            className="w-full md:w-48"
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            placeholder="All Categories"
            className="w-full md:w-48"
          />
        </div>
      </Card>

      {/* Equipment Table */}
      {filteredEquipment.length > 0 ? (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requests</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEquipment.map(eq => (
                  <EquipmentRow
                    key={eq.id}
                    equipment={eq}
                    onEdit={(e) => navigate(`/equipment/${e.id}/edit`)}
                    onDelete={(e) => setDeleteModal({ open: true, equipment: e })}
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
            icon={Server}
            title="No equipment found"
            description={searchQuery || statusFilter || departmentFilter || categoryFilter
              ? "Try adjusting your filters"
              : "Get started by adding your first piece of equipment"
            }
            actionLabel="Add Equipment"
            onAction={canManage ? () => navigate('/equipment/new') : null}
          />
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, equipment: null })}
        title="Delete Equipment"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, equipment: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-gray-900">
              Are you sure you want to delete <strong>{deleteModal.equipment?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-1">
              This action cannot be undone. All related maintenance requests will be orphaned.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default EquipmentListPage;
