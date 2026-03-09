import { Package, CheckCircle, AlertTriangle, Wrench, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEventResources } from '@/hooks/useResources';
import { Loader2 } from 'lucide-react';

interface EventResourceSummaryProps {
  eventId: string;
}

const conditionIcons: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  good: { icon: CheckCircle, color: 'text-success', label: 'Good' },
  damaged: { icon: AlertTriangle, color: 'text-warning', label: 'Damaged' },
  needs_repair: { icon: Wrench, color: 'text-orange-500', label: 'Needs Repair' },
  lost: { icon: XCircle, color: 'text-destructive', label: 'Lost' },
};

export function EventResourceSummary({ eventId }: EventResourceSummaryProps) {
  const { data: resources, isLoading } = useEventResources(eventId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No resources allocated to this event
      </div>
    );
  }

  const totalAllocated = resources.reduce((sum, r) => sum + r.quantity, 0);
  const totalReturned = resources.filter(r => r.returned).reduce((sum, r) => sum + r.returned_quantity, 0);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-2xl font-bold text-primary">{resources.length}</p>
          <p className="text-xs text-muted-foreground">Resource Types</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-2xl font-bold text-primary">{totalAllocated}</p>
          <p className="text-xs text-muted-foreground">Total Allocated</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-success/5 border border-success/10">
          <p className="text-2xl font-bold text-success">{totalReturned}</p>
          <p className="text-xs text-muted-foreground">Total Returned</p>
        </div>
      </div>

      {/* Resource list */}
      <div className="space-y-2">
        {resources.map(resource => {
          const condCfg = conditionIcons[resource.condition] || conditionIcons.good;
          const CondIcon = condCfg.icon;
          return (
            <div key={resource.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{resource.resource_type?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {resource.quantity} allocated
                    {resource.resource_type && ` of ${resource.resource_type.total_quantity} total`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {resource.returned ? (
                  <Badge className="border-0 bg-success/10 text-success text-xs">
                    <CondIcon className={`w-3 h-3 mr-1 ${condCfg.color}`} />
                    Returned ({condCfg.label})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-warning border-warning text-xs">
                    Pending Return
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
