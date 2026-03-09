import { Badge } from '@/components/ui/badge';
import { useResourceAuditLog } from '@/hooks/useResources';
import { Loader2, FileText, ArrowUpRight, ArrowDownLeft, RotateCcw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResourceAuditLogProps {
  eventId?: string;
}

const actionConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  allocated: { icon: ArrowUpRight, color: 'text-primary bg-primary/10', label: 'Allocated' },
  deallocated: { icon: ArrowDownLeft, color: 'text-warning bg-warning/10', label: 'Deallocated' },
  returned: { icon: RotateCcw, color: 'text-success bg-success/10', label: 'Returned' },
};

export function ResourceAuditLog({ eventId }: ResourceAuditLogProps) {
  const { data: logs, isLoading } = useResourceAuditLog(eventId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No audit log entries</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[500px]">
      <div className="space-y-3 pr-4">
        {logs.map(entry => {
          const cfg = actionConfig[entry.action] || actionConfig.allocated;
          const ActionIcon = cfg.icon;
          return (
            <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                <ActionIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                  {entry.condition && entry.condition !== 'good' && (
                    <Badge variant="outline" className="text-xs capitalize text-warning border-warning">
                      {entry.condition.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm mt-1">
                  <span className="font-medium">{entry.performer_name}</span>
                  {' '}{entry.action}{' '}
                  <span className="font-medium">{entry.quantity}x {entry.resource_type_name}</span>
                  {!eventId && (
                    <> for <span className="font-medium">{entry.event_title}</span></>
                  )}
                </p>
                {entry.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
