import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Loader2, Package, AlertTriangle, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEvents, useUpdateEventStatus } from '@/hooks/useEvents';
import { useEventResources } from '@/hooks/useResources';
import { useResourceRequests } from '@/hooks/useResourceRequests';
import { ResourceAllocationDialog } from '@/components/resources/ResourceAllocationDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ─── Per-event card with resource gate ──────────────────────────────────────
function EventApprovalCard({
  event,
  index,
  onApprove,
  onReject,
  onAllocate,
  isSubmitting,
}: {
  event: any;
  index: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAllocate: (id: string, title: string) => void;
  isSubmitting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  // What the organizer requested
  const { data: requests = [] } = useResourceRequests(event.id);
  // What the admin has actually allocated
  const { data: allocations = [] } = useEventResources(event.id);

  // Build a Set of allocated resource_type_ids
  const allocatedTypeIds = new Set(allocations.map((a: any) => a.resource_type_id));

  // Count how many requested resource types are fully allocated
  const fulfilledRequests = requests.filter(r => allocatedTypeIds.has(r.resource_type_id));
  const totalRequests = requests.length;
  const allAllocated = totalRequests > 0 && fulfilledRequests.length === totalRequests;
  const progressPct = totalRequests > 0 ? Math.round((fulfilledRequests.length / totalRequests) * 100) : 0;

  return (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn(
        "bg-card rounded-2xl border p-6 transition-all",
        allAllocated ? "border-success/30" : "border-warning/30"
      )}
    >
      {/* Top row: event info + action buttons */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className="bg-warning/10 text-warning border-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Pending Review
            </Badge>
            <Badge variant="outline" className="capitalize">{event.category}</Badge>
            {allAllocated ? (
              <Badge className="bg-success/10 text-success border-0 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Resources Ready ({fulfilledRequests.length}/{totalRequests})
              </Badge>
            ) : (
              <Badge className="bg-destructive/10 text-destructive border-0 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {fulfilledRequests.length}/{totalRequests} Resources Allocated
              </Badge>
            )}
          </div>

          <h3 className="text-xl font-semibold mb-1">{event.title}</h3>
          <p className="text-muted-foreground text-sm mb-2">Submitted by {event.organizer_name}</p>
          <p className="text-muted-foreground text-sm line-clamp-2">{event.description}</p>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            <span>📅 {new Date(event.date).toLocaleDateString()}</span>
            <span>🕐 {event.time}</span>
            <span>📍 {event.venue}</span>
            {event.capacity && <span>👥 Capacity: {event.capacity}</span>}
          </div>

          {/* Resource allocation progress bar */}
          {totalRequests > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1 text-xs text-muted-foreground">
                <span>Resource allocation progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    allAllocated ? "bg-success" : "bg-warning"
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-shrink-0 flex-wrap items-start">
          <Button
            variant="outline"
            onClick={() => onAllocate(event.id, event.title)}
          >
            <Package className="w-4 h-4 mr-2" />
            Allocate Resources
          </Button>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => onReject(event.id)}
            disabled={isSubmitting}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            className={cn(
              "min-w-32",
              allAllocated
                ? "gradient-success text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            onClick={() => allAllocated && onApprove(event.id)}
            disabled={isSubmitting || !allAllocated}
            title={!allAllocated ? "Allocate all requested resources before approving" : "Approve this event"}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : !allAllocated ? (
              <Lock className="w-4 h-4 mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {allAllocated ? 'Approve' : 'Locked'}
          </Button>
        </div>
      </div>

      {/* Expandable: Resource Requests Detail */}
      {totalRequests > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            View requested resources ({totalRequests})
          </button>
          {expanded && (
            <div className="mt-3 space-y-2">
              {requests.map(req => {
                const isAllocated = allocatedTypeIds.has(req.resource_type_id);
                const allocation = allocations.find((a: any) => a.resource_type_id === req.resource_type_id);
                return (
                  <div
                    key={req.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-4 py-2 text-sm",
                      isAllocated ? "bg-success/5 border border-success/20" : "bg-destructive/5 border border-destructive/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isAllocated
                        ? <CheckCircle className="w-4 h-4 text-success" />
                        : <AlertTriangle className="w-4 h-4 text-destructive" />}
                      <span className="font-medium">{req.resource_name}</span>
                      <span className="text-muted-foreground">— requested: {req.requested_quantity}</span>
                    </div>
                    {isAllocated ? (
                      <span className="text-success font-medium">Allocated: {allocation?.quantity}</span>
                    ) : (
                      <span className="text-destructive font-medium">Not yet allocated</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Warning banner if no resources requested */}
      {totalRequests === 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          This event has no resource requests. Allocate resources before approving.
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const { data: events, isLoading } = useEvents();
  const updateStatusMutation = useUpdateEventStatus();
  const pendingEvents = events?.filter(e => e.status === 'pending') || [];
  const { toast } = useToast();

  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string } | null>(null);

  const handleApprove = async (eventId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: eventId, status: 'approved' });
      toast({ title: 'Event approved', description: 'The event has been approved successfully.' });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleReject = async (eventId: string) => {
    await updateStatusMutation.mutateAsync({ id: eventId, status: 'rejected' });
    toast({ title: 'Event rejected', description: 'The event has been rejected.' });
  };

  const openResourceDialog = (eventId: string, eventTitle: string) => {
    setSelectedEvent({ id: eventId, title: eventTitle });
    setResourceDialogOpen(true);
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
              {pendingEvents.length} events awaiting review — allocate resources before approving
            </motion.p>
          </div>
        </div>

        {/* Workflow Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8"
        >
          <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-primary">Approval Workflow</p>
            <p className="text-muted-foreground mt-0.5">
              You must allocate all requested resources for an event before the <strong>Approve</strong> button becomes active. 
              Click <strong>"Allocate Resources"</strong> to assign inventory, then approve once all resources are ready.
            </p>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Pending Events List */}
        {!isLoading && (
          <div className="space-y-4">
            {pendingEvents.map((event, index) => (
              <EventApprovalCard
                key={event.id}
                event={event}
                index={index}
                onApprove={handleApprove}
                onReject={handleReject}
                onAllocate={openResourceDialog}
                isSubmitting={updateStatusMutation.isPending}
              />
            ))}
          </div>
        )}

        {!isLoading && pendingEvents.length === 0 && (
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

      {/* Resource Allocation Dialog */}
      {selectedEvent && (
        <ResourceAllocationDialog
          open={resourceDialogOpen}
          onOpenChange={setResourceDialogOpen}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
        />
      )}
    </MainLayout>
  );
}
