import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsData {
  totalEvents: number;
  totalRegistrations: number;
  totalAttendance: number;
  attendanceRate: number;
  popularEvents: { name: string; registrations: number }[];
  departmentParticipation: { department: string; count: number }[];
  monthlyTrends: { month: string; registrations: number; events: number }[];
  resourceUsage: { name: string; allocated: number; total: number }[];
  conditionDistribution: { condition: string; count: number }[];
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      // ... existing code ...
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      const { count: totalRegistrations } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });

      const { count: totalAttendance } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('attended', true);

      const { data: popularEventsData } = await supabase
        .from('events')
        .select('title, registered_count')
        .order('registered_count', { ascending: false })
        .limit(5);

      const popularEvents = (popularEventsData || []).map(e => ({
        name: e.title,
        registrations: e.registered_count || 0
      }));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('department');
      
      const deptCounts: Record<string, number> = {};
      profiles?.forEach(p => {
        const dept = p.department || 'Other';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });

      const departmentParticipation = Object.entries(deptCounts).map(([department, count]) => ({
        department,
        count
      }));

      const { data: regsData } = await supabase
        .from('registrations')
        .select('registered_at');
      
      const { data: eventsData } = await supabase
        .from('events')
        .select('created_at');

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const last6Months = [];
      
      for (let i = 5; i >= 0; i--) {
        const m = (currentMonth - i + 12) % 12;
      last6Months.push(months[m]);
      }

      const monthlyTrends = last6Months.map(monthName => {
        const regCount = regsData?.filter(r => {
          const d = new Date(r.registered_at);
          return months[d.getMonth()] === monthName;
        }).length || 0;

        const eventCount = eventsData?.filter(e => {
          const d = new Date(e.created_at);
          return months[d.getMonth()] === monthName;
        }).length || 0;

        return {
          month: monthName,
          registrations: regCount,
          events: eventCount
        };
      });

      // NEW: Resource Usage
      const { data: resources } = await supabase
        .from('resource_types')
        .select('name, total_quantity, available_quantity');
      
      const resourceUsage = (resources || []).map(r => ({
        name: r.name,
        allocated: r.total_quantity - r.available_quantity,
        total: r.total_quantity
      }));

      // NEW: Condition Distribution from audit log
      const { data: auditLog } = await supabase
        .from('resource_audit_log')
        .select('condition')
        .eq('action', 'returned');
      
      const conditionCounts: Record<string, number> = {
        good: 0,
        damaged: 0,
        needs_repair: 0,
        lost: 0
      };

      auditLog?.forEach(entry => {
        if (entry.condition) {
          conditionCounts[entry.condition] = (conditionCounts[entry.condition] || 0) + 1;
        }
      });

      const conditionDistribution = Object.entries(conditionCounts).map(([condition, count]) => ({
        condition,
        count
      }));

      return {
        totalEvents: totalEvents || 0,
        totalRegistrations: totalRegistrations || 0,
        totalAttendance: totalAttendance || 0,
        attendanceRate: totalRegistrations ? Math.round((totalAttendance || 0) / totalRegistrations * 100) : 0,
        popularEvents,
        departmentParticipation,
        monthlyTrends,
        resourceUsage,
        conditionDistribution
      };
    }
  });
}
