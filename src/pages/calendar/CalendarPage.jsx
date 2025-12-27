/**
 * GearGuard - Calendar Page
 * 
 * Calendar view for scheduled maintenance using FullCalendar.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
  Plus,
  Calendar as CalendarIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { requestService, teamService, equipmentService } from '../../services/api';
import { Button, Badge, Modal, Select, Skeleton } from '../../components/ui';

function CalendarPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const { error } = useToast();
  const calendarRef = useRef(null);

  const [requests, setRequests] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filters
  const [filters, setFilters] = useState({
    teamId: '',
    type: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requestsData, teamsData, equipmentData] = await Promise.all([
        requestService.getAll(),
        teamService.getAll(),
        equipmentService.getAll()
      ]);

      // Enrich with equipment data
      const enriched = requestsData
        .filter(r => r.scheduledDate) // Only show scheduled requests
        .map(req => ({
          ...req,
          equipment: equipmentData.find(e => e.id === req.equipmentId),
          team: teamsData.find(t => t.id === req.teamId)
        }));

      setRequests(enriched);
      setTeams(teamsData);
    } catch (err) {
      error('Failed to load data', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Convert requests to calendar events
  const getCalendarEvents = () => {
    return requests
      .filter(req => {
        if (filters.teamId && req.teamId !== filters.teamId) return false;
        if (filters.type && req.type !== filters.type) return false;
        if (filters.status && req.status !== filters.status) return false;
        return true;
      })
      .map(req => {
        const isOverdue = new Date(req.scheduledDate) < new Date() && 
          req.status !== 'repaired' && req.status !== 'scrap';
        
        let backgroundColor, borderColor;
        
        if (req.status === 'repaired') {
          backgroundColor = '#10b981';
          borderColor = '#059669';
        } else if (req.status === 'scrap') {
          backgroundColor = '#6b7280';
          borderColor = '#4b5563';
        } else if (isOverdue) {
          backgroundColor = '#ef4444';
          borderColor = '#dc2626';
        } else if (req.status === 'in_progress') {
          backgroundColor = '#f59e0b';
          borderColor = '#d97706';
        } else if (req.type === 'preventive') {
          backgroundColor = '#3b82f6';
          borderColor = '#2563eb';
        } else {
          backgroundColor = '#8b5cf6';
          borderColor = '#7c3aed';
        }

        return {
          id: req.id,
          title: req.subject,
          start: req.scheduledDate,
          end: req.scheduledDate,
          allDay: true,
          backgroundColor,
          borderColor,
          extendedProps: {
            ...req,
            isOverdue
          }
        };
      });
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event.extendedProps);
  };

  const handleDateClick = (info) => {
    // Navigate to create request with pre-filled date
    if (can('canCreateRequests')) {
      navigate(`/requests/new?date=${info.dateStr}`);
    }
  };

  const handleDatesSet = (info) => {
    setCurrentDate(info.start);
  };

  const navigateCalendar = (direction) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      if (direction === 'prev') api.prev();
      else if (direction === 'next') api.next();
      else api.today();
    }
  };

  const changeView = (view) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(view);
      setCurrentView(view);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      new: { variant: 'info', label: 'New', icon: Clock },
      in_progress: { variant: 'warning', label: 'In Progress', icon: AlertTriangle },
      repaired: { variant: 'success', label: 'Repaired', icon: CheckCircle },
      scrap: { variant: 'default', label: 'Scrap', icon: null }
    };
    const { variant, label } = config[status] || { variant: 'default', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">
            View and manage scheduled maintenance activities
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {(filters.teamId || filters.type || filters.status) && (
              <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                {[filters.teamId, filters.type, filters.status].filter(Boolean).length}
              </span>
            )}
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
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: 'new', label: 'New' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'repaired', label: 'Repaired' },
                { value: 'scrap', label: 'Scrap' }
              ]}
              placeholder="All Statuses"
            />
          </div>
          {(filters.teamId || filters.type || filters.status) && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ teamId: '', type: '', status: '' })}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronLeft}
              onClick={() => navigateCalendar('prev')}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateCalendar('today')}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronRight}
              onClick={() => navigateCalendar('next')}
            />
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => changeView('dayGridMonth')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                currentView === 'dayGridMonth'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => changeView('timeGridWeek')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                currentView === 'timeGridWeek'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => changeView('listWeek')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                currentView === 'listWeek'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600">Preventive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-gray-600">Corrective</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">Overdue</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          events={getCalendarEvents()}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          height="100%"
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventClassNames="cursor-pointer"
        />
      </div>

      {/* Event Detail Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Maintenance Request"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
            <Button onClick={() => navigate(`/requests/${selectedEvent?.id}`)}>
              View Details
            </Button>
          </div>
        }
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{selectedEvent.subject}</h3>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(selectedEvent.status)}
                <Badge variant={selectedEvent.type === 'preventive' ? 'primary' : 'warning'}>
                  {selectedEvent.type === 'preventive' ? 'Preventive' : 'Corrective'}
                </Badge>
                {selectedEvent.isOverdue && (
                  <Badge variant="danger">Overdue</Badge>
                )}
              </div>
            </div>

            {selectedEvent.description && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{selectedEvent.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Equipment</p>
                <p className="text-gray-700">{selectedEvent.equipment?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Team</p>
                <p className="text-gray-700">{selectedEvent.team?.name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Scheduled Date</p>
                <p className="text-gray-700">
                  {format(new Date(selectedEvent.scheduledDate), 'MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Priority</p>
                <Badge
                  variant={
                    selectedEvent.priority === 'high' ? 'danger' :
                    selectedEvent.priority === 'medium' ? 'warning' : 'success'
                  }
                >
                  {selectedEvent.priority}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CalendarPage;
