/**
 * GearGuard - Kanban Board Page
 * 
 * Drag-and-drop Kanban board for visual workflow management.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Server,
  User,
  Calendar,
  Plus,
  Filter,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { requestService, equipmentService, teamService } from '../../services/api';
import { Button, Badge, Avatar, Select, Skeleton } from '../../components/ui';

// Kanban Column Component
function KanbanColumn({ id, title, icon: Icon, color, items, children }) {
  const count = items.length;
  
  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      <div className={`flex items-center gap-2 px-4 py-3 bg-${color}-50 rounded-t-lg border-t-4 border-${color}-500`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <span className={`ml-auto bg-${color}-100 text-${color}-700 text-sm font-medium px-2 py-0.5 rounded-full`}>
          {count}
        </span>
      </div>
      <div className="flex-1 bg-gray-50 p-3 space-y-3 min-h-[calc(100vh-300px)] rounded-b-lg border border-gray-200 border-t-0 overflow-y-auto">
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </div>
    </div>
  );
}

// Kanban Card Component
function KanbanCard({ item, isDragging }) {
  const navigate = useNavigate();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = item.scheduledDate && 
    new Date(item.scheduledDate) < new Date() && 
    item.status !== 'repaired' && 
    item.status !== 'scrap';

  const getPriorityStyle = () => {
    switch (item.priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-blue-500';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow border-l-4 ${getPriorityStyle()}
        ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}
      `}
      onClick={() => navigate(`/requests/${item.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.subject}</h4>
        {isOverdue && (
          <Badge variant="danger" size="sm">Overdue</Badge>
        )}
      </div>

      {/* Equipment */}
      {item.equipment && (
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-600 truncate">{item.equipment.name}</span>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
        <div className="flex items-center gap-2">
          {item.technician ? (
            <div className="flex items-center gap-1" title={item.technician.name}>
              <Avatar name={item.technician.name} size="xs" />
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <User className="w-3 h-3" />
              <span>Unassigned</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={item.type === 'preventive' ? 'info' : 'warning'} size="sm">
            {item.type === 'preventive' ? 'PM' : 'CM'}
          </Badge>
          {item.scheduledDate && (
            <span className={isOverdue ? 'text-red-500' : ''}>
              {format(new Date(item.scheduledDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Overlay card during drag
function DragOverlayCard({ item }) {
  if (!item) return null;
  
  return (
    <div className="bg-white rounded-lg border-2 border-blue-500 p-3 shadow-xl w-80">
      <h4 className="font-medium text-gray-900 text-sm">{item.subject}</h4>
      {item.equipment && (
        <div className="flex items-center gap-2 mt-2">
          <Server className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-600">{item.equipment.name}</span>
        </div>
      )}
    </div>
  );
}

function KanbanPage() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const { success, error } = useToast();

  const [requests, setRequests] = useState([]);
  const [teams, setTeams] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    teamId: '',
    type: '',
    priority: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [kanbanData, teamsData, equipmentData] = await Promise.all([
        requestService.getKanbanData(),
        teamService.getAll(),
        equipmentService.getAll()
      ]);

      // Combine all requests from kanban columns
      const allRequests = [
        ...kanbanData.new,
        ...kanbanData.in_progress,
        ...kanbanData.repaired,
        ...kanbanData.scrap
      ];

      setRequests(allRequests);
      setTeams(teamsData);
      setEquipment(equipmentData);
    } catch (err) {
      error('Failed to load data', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      if (filters.teamId && req.teamId !== filters.teamId) return false;
      if (filters.type && req.type !== filters.type) return false;
      if (filters.priority && req.priority !== filters.priority) return false;
      return true;
    });
  }, [requests, filters]);

  // Group by status
  const columns = useMemo(() => ({
    new: filteredRequests.filter(r => r.status === 'new'),
    in_progress: filteredRequests.filter(r => r.status === 'in_progress'),
    repaired: filteredRequests.filter(r => r.status === 'repaired'),
    scrap: filteredRequests.filter(r => r.status === 'scrap')
  }), [filteredRequests]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeRequest = requests.find(r => r.id === active.id);
    if (!activeRequest) {
      setActiveId(null);
      return;
    }

    // Determine target status from drop location
    let targetStatus = null;
    
    // Check if dropped on a column
    if (['new', 'in_progress', 'repaired', 'scrap'].includes(over.id)) {
      targetStatus = over.id;
    } else {
      // Dropped on another card - find which column it belongs to
      const targetRequest = requests.find(r => r.id === over.id);
      if (targetRequest) {
        targetStatus = targetRequest.status;
      }
    }

    if (targetStatus && targetStatus !== activeRequest.status) {
      // Check valid transitions
      const validTransitions = {
        new: ['in_progress', 'scrap'],
        in_progress: ['new', 'repaired', 'scrap'],
        repaired: [],
        scrap: []
      };

      if (!validTransitions[activeRequest.status]?.includes(targetStatus)) {
        error('Invalid Transition', `Cannot move from ${activeRequest.status} to ${targetStatus}`);
        setActiveId(null);
        return;
      }

      try {
        await requestService.updateStatus(activeRequest.id, targetStatus, user.id);
        
        setRequests(prev => prev.map(r => 
          r.id === activeRequest.id 
            ? { 
                ...r, 
                status: targetStatus,
                completedDate: targetStatus === 'repaired' ? new Date().toISOString() : r.completedDate
              }
            : r
        ));
        
        success('Status Updated', `Request moved to ${targetStatus.replace('_', ' ')}`);
      } catch (err) {
        error('Failed to update', err.message);
      }
    }
    
    setActiveId(null);
  };

  const activeItem = activeId ? requests.find(r => r.id === activeId) : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-80 flex-shrink-0">
              <Skeleton className="h-12 rounded-t-lg" />
              <div className="bg-gray-50 p-3 space-y-3 min-h-[400px] rounded-b-lg">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-500 text-sm mt-1">
            Drag and drop requests to update their status
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {(filters.teamId || filters.type || filters.priority) && (
              <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                {[filters.teamId, filters.type, filters.priority].filter(Boolean).length}
              </span>
            )}
          </Button>
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={loadData}
          >
            Refresh
          </Button>
          {can('canCreateRequests') && (
            <Button
              icon={Plus}
              onClick={() => navigate('/requests/new')}
            >
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 slide-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Team"
              value={filters.teamId}
              onChange={(e) => setFilters(prev => ({ ...prev, teamId: e.target.value }))}
              options={teams.map(t => ({ value: t.id, label: t.name }))}
              placeholder="All Teams"
            />
            <Select
              label="Type"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              options={[
                { value: 'corrective', label: 'Corrective' },
                { value: 'preventive', label: 'Preventive' }
              ]}
              placeholder="All Types"
            />
            <Select
              label="Priority"
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              options={[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
              placeholder="All Priorities"
            />
          </div>
          {(filters.teamId || filters.type || filters.priority) && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ teamId: '', type: '', priority: '' })}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
          {/* New Column */}
          <KanbanColumn
            id="new"
            title="New"
            icon={Clock}
            color="blue"
            items={columns.new}
          >
            {columns.new.map(item => (
              <KanbanCard key={item.id} item={item} isDragging={activeId === item.id} />
            ))}
          </KanbanColumn>

          {/* In Progress Column */}
          <KanbanColumn
            id="in_progress"
            title="In Progress"
            icon={AlertTriangle}
            color="yellow"
            items={columns.in_progress}
          >
            {columns.in_progress.map(item => (
              <KanbanCard key={item.id} item={item} isDragging={activeId === item.id} />
            ))}
          </KanbanColumn>

          {/* Repaired Column */}
          <KanbanColumn
            id="repaired"
            title="Repaired"
            icon={CheckCircle}
            color="green"
            items={columns.repaired}
          >
            {columns.repaired.map(item => (
              <KanbanCard key={item.id} item={item} isDragging={activeId === item.id} />
            ))}
          </KanbanColumn>

          {/* Scrap Column */}
          <KanbanColumn
            id="scrap"
            title="Scrap"
            icon={Trash2}
            color="gray"
            items={columns.scrap}
          >
            {columns.scrap.map(item => (
              <KanbanCard key={item.id} item={item} isDragging={activeId === item.id} />
            ))}
          </KanbanColumn>
        </div>

        <DragOverlay>
          <DragOverlayCard item={activeItem} />
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default KanbanPage;
