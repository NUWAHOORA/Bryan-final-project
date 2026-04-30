import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/stat-card';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents, useUpdateEventStatus } from '@/hooks/useEvents';
import { useAnalytics } from '@/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function DashboardPage() {
  const { profile, role } = useAuth();
  const { data: events, isLoading: loadingEvents } = useEvents();
  const { data: analytics, isLoading: loadingAnalytics } = useAnalytics();
  const updateStatusMutation = useUpdateEventStatus();
  
  const approvedEvents = events?.filter(e => e.status === 'approved') || [];
  const pendingEvents = events?.filter(e => e.status === 'pending') || [];
  const upcomingEvents = approvedEvents.slice(0, 3);

  const isLoading = loadingEvents || loadingAnalytics;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleApprove = async (eventId: string) => {
    await updateStatusMutation.mutateAsync({ id: eventId, status: 'approved' });
  };

  const handleReject = async (eventId: string) => {
    await updateStatusMutation.mutateAsync({ id: eventId, status: 'rejected' });
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-primary mb-2"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">{greeting()}</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold"
          >
            Welcome back, {profile?.name?.split(' ')[0] || 'User'}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mt-1"
          >
            Here's what's happening with your events today.
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Events"
            value={analytics?.totalEvents || 0}
            icon={Calendar}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Total Registrations"
            value={(analytics?.totalRegistrations || 0).toLocaleString()}
            icon={Users}
            variant="success"
            delay={0.1}
          />
          <StatCard
            title="Attendance Rate"
            value={`${analytics?.attendanceRate || 0}%`}
            icon={TrendingUp}
            variant="accent"
            delay={0.2}
          />
          <StatCard
            title="Pending Approvals"
            value={pendingEvents.length}
            icon={Clock}
            variant="warning"
            delay={0.3}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Monthly Registrations</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics?.monthlyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="registrations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Events Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics?.monthlyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="events" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Quick Actions & Pending */}
        {role === 'admin' && pendingEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                <h2 className="text-xl font-semibold">Pending Approvals</h2>
              </div>
              <Link to="/approvals">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingEvents.slice(0, 4).map((event) => (
                <div key={event.id} className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.organizer_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(event.id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      className="gradient-success text-white"
                      onClick={() => handleApprove(event.id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            <Link to="/events">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, index) => (
                <EventCard 
                  key={event.id} 
                  event={{
                    id: event.id,
                    title: event.title,
                    description: event.description || '',
                    date: event.date,
                    time: event.time,
                    venue: event.venue,
                    category: event.category,
                    capacity: event.capacity,
                    registeredCount: event.registered_count,
                    attendedCount: event.attended_count,
                    status: event.status,
                    organizerId: event.organizer_id,
                    organizerName: event.organizer_name || 'Unknown',
                    imageUrl: event.image_url || undefined,
                    qrCode: event.qr_code || undefined,
                    createdAt: event.created_at
                  }} 
                  index={index} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming events yet
            </div>
          )}
        </motion.div>

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-card rounded-2xl border border-border p-6"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            System-wide Activity
          </h2>
          <div className="space-y-4">
            {analytics?.popularEvents.slice(0, 3).map((event, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New registrations for <span className="text-primary">{event.name}</span></p>
                    <p className="text-xs text-muted-foreground">Recent peak in participation</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-success/10 text-success px-2 py-1 rounded-full">
                  +{event.registrations} total
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
