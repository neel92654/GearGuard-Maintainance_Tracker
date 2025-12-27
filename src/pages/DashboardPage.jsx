/**
 * GearGuard - Dashboard Page
 * 
 * Main dashboard with KPIs, charts, and analytics.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  ClipboardList,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ArrowRight,
  Wrench
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { analyticsService, requestService } from '../services/api';
import { Card, Badge, Avatar, Skeleton } from '../components/ui';

// KPI Card Component
function KPICard({ title, value, icon: Icon, color, trend, link }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {link && (
        <Link 
          to={link}
          className="absolute bottom-0 left-0 right-0 py-2 px-4 bg-gray-50 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
        >
          View Details <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </Card>
  );
}

// Recent Activity Item
function ActivityItem({ request }) {
  const statusColors = {
    new: 'blue',
    in_progress: 'yellow',
    repaired: 'green',
    scrap: 'default'
  };

  const statusLabels = {
    new: 'New',
    in_progress: 'In Progress',
    repaired: 'Repaired',
    scrap: 'Scrapped'
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center
        ${request.priority === 'high' ? 'bg-red-100' : request.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'}
      `}>
        <Wrench className={`w-5 h-5 ${request.priority === 'high' ? 'text-red-600' : request.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{request.subject}</p>
        <p className="text-xs text-gray-500">{request.equipment?.name || 'Unknown Equipment'}</p>
      </div>
      <Badge variant={statusColors[request.status]} size="sm">
        {statusLabels[request.status]}
      </Badge>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [requestsByTeam, setRequestsByTeam] = useState([]);
  const [requestsByCategory, setRequestsByCategory] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, teamData, categoryData, trendData, requestsData] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getRequestsByTeam(),
        analyticsService.getRequestsByCategory(),
        analyticsService.getMonthlyTrend(),
        requestService.getWithDetails()
      ]);

      setStats(statsData);
      setRequestsByTeam(teamData);
      setRequestsByCategory(categoryData.filter(c => c.total > 0));
      setMonthlyTrend(trendData);
      setRecentRequests(requestsData.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart colors
  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton.Stats />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton.Card />
          <Skeleton.Card />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}! Here's your maintenance overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Equipment"
          value={stats?.totalEquipment || 0}
          icon={Server}
          color="blue"
          link="/equipment"
        />
        <KPICard
          title="Open Requests"
          value={stats?.openRequests || 0}
          icon={ClipboardList}
          color="yellow"
          link="/requests"
        />
        <KPICard
          title="Overdue Requests"
          value={stats?.overdueRequests || 0}
          icon={AlertTriangle}
          color="red"
          link="/requests?filter=overdue"
        />
        <KPICard
          title="Scheduled Preventive"
          value={stats?.preventiveScheduled || 0}
          icon={Calendar}
          color="green"
          link="/calendar"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by Team */}
        <Card>
          <Card.Header>
            <Card.Title>Requests by Team</Card.Title>
            <Card.Description>Distribution of maintenance requests across teams</Card.Description>
          </Card.Header>
          <Card.Content className="pt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestsByTeam}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="open" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Open" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Requests by Category */}
        <Card>
          <Card.Header>
            <Card.Title>Requests by Category</Card.Title>
            <Card.Description>Equipment categories with most maintenance requests</Card.Description>
          </Card.Header>
          <Card.Content className="pt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={requestsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {requestsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Monthly Maintenance Trend</Card.Title>
            <Card.Description>Request volume over the past 6 months</Card.Description>
          </Card.Header>
          <Card.Content className="pt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="corrective" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Corrective"
                    dot={{ fill: '#ef4444' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="preventive" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Preventive"
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Recent Requests */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Recent Requests</Card.Title>
              <Link 
                to="/requests" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
          </Card.Header>
          <Card.Content>
            {recentRequests.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentRequests.map(request => (
                  <ActivityItem key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No recent requests</p>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Equipment Status Summary */}
      <Card>
        <Card.Header>
          <Card.Title>Equipment Status Overview</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-3xl font-bold text-green-600">{stats?.equipmentByStatus?.active || 0}</p>
              <p className="text-sm text-green-700 mt-1">Active</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-3xl font-bold text-yellow-600">{stats?.equipmentByStatus?.underMaintenance || 0}</p>
              <p className="text-sm text-yellow-700 mt-1">Under Maintenance</p>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-xl">
              <p className="text-3xl font-bold text-gray-600">{stats?.equipmentByStatus?.scrapped || 0}</p>
              <p className="text-sm text-gray-700 mt-1">Scrapped</p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

export default DashboardPage;
