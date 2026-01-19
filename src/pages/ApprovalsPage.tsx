import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockEvents } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

export default function ApprovalsPage() {
  const { toast } = useToast();
  const pendingEvents = mockEvents.filter(e => e.status === 'pending');

  const handleApprove = (eventId: string, eventTitle: string) => {
    toast({
      title: "Event Approved",
      description: `"${eventTitle}" has been approved and is now visible to students.`,
    });
  };

  const handleReject = (eventId: string, eventTitle: string) => {
    toast({
      title: "Event Rejected",
      description: `"${eventTitle}" has been rejected.`,
      variant: "destructive",
    });
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold"
            >
              Pending Approvals
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground mt-1"
            >
              {pendingEvents.length} events awaiting review
            </motion.p>
          </div>
        </div>

        {/* Pending Events List */}
        <div className="space-y-4">
          {pendingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl border border-warning/20 p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-warning/10 text-warning border-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending Review
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {event.category}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{event.title}</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Submitted by {event.organizerName}
                  </p>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                    <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                    <span>🕐 {event.time}</span>
                    <span>📍 {event.venue}</span>
                    <span>👥 Capacity: {event.capacity}</span>
                  </div>
                </div>

                <div className="flex gap-3 flex-shrink-0">
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => handleReject(event.id, event.title)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="gradient-success text-white"
                    onClick={() => handleApprove(event.id, event.title)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {pendingEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">No events pending approval</p>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
