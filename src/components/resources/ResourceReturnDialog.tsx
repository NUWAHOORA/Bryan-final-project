import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Loader2, RotateCcw, CheckCircle, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import { useEventResources, useReturnResource, type ResourceCondition } from '@/hooks/useResources';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResourceReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
}

const conditionConfig: Record<ResourceCondition, { label: string; icon: React.ElementType; color: string }> = {
  good: { label: 'Good', icon: CheckCircle, color: 'text-success' },
  damaged: { label: 'Damaged', icon: AlertTriangle, color: 'text-warning' },
  needs_repair: { label: 'Needs Repair', icon: Wrench, color: 'text-orange-500' },
  lost: { label: 'Lost', icon: XCircle, color: 'text-destructive' },
};

export function ResourceReturnDialog({ open, onOpenChange, eventId, eventTitle }: ResourceReturnDialogProps) {
  const { data: eventResources, isLoading } = useEventResources(eventId);
  const returnMutation = useReturnResource();

  const [selectedAllocation, setSelectedAllocation] = useState<string | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [condition, setCondition] = useState<ResourceCondition>('good');
  const [notes, setNotes] = useState('');

  const unreturned = eventResources?.filter(r => !r.returned) || [];
  const returned = eventResources?.filter(r => r.returned) || [];
  const selected = unreturned.find(r => r.id === selectedAllocation);

  const handleReturn = async () => {
    if (!selected) return;
    await returnMutation.mutateAsync({
      allocationId: selected.id,
      resourceTypeId: selected.resource_type_id,
      returnedQuantity: returnQuantity,
      condition,
      eventId,
      notes: notes || undefined,
    });
    setSelectedAllocation(null);
    setReturnQuantity(1);
    setCondition('good');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Return Resources
          </DialogTitle>
          <DialogDescription>
            Record resource returns for "{eventTitle}"
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 pr-4">
              {/* Unreturned Resources */}
              {unreturned.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Awaiting Return</h4>
                  <div className="space-y-2">
                    {unreturned.map(allocation => (
                      <div
                        key={allocation.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedAllocation === allocation.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedAllocation(selectedAllocation === allocation.id ? null : allocation.id);
                          setReturnQuantity(allocation.quantity);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium">{allocation.resource_type?.name}</p>
                            <p className="text-sm text-muted-foreground">{allocation.quantity} allocated</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-warning border-warning">Pending Return</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
                  <p className="font-medium">All resources returned</p>
                  <p className="text-sm text-muted-foreground">No pending returns for this event</p>
                </div>
              )}

              {/* Return Form */}
              {selected && (
                <div className="p-4 bg-muted/50 rounded-xl border space-y-4">
                  <h4 className="font-medium">Return {selected.resource_type?.name}</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity Returning</Label>
                      <Input
                        type="number"
                        min={1}
                        max={selected.quantity}
                        value={returnQuantity}
                        onChange={e => setReturnQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Condition</Label>
                      <Select value={condition} onValueChange={v => setCondition(v as ResourceCondition)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(conditionConfig).map(([key, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                                  {cfg.label}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {condition !== 'good' && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-warning">
                      <AlertTriangle className="w-4 h-4 inline mr-2" />
                      {condition === 'lost'
                        ? 'Lost items will NOT be returned to stock and will be flagged for replacement.'
                        : 'Damaged/repair items will NOT be returned to available stock and will be flagged.'}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Add notes about the condition or return..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Already Returned */}
              {returned.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Already Returned</h4>
                  <div className="space-y-2">
                    {returned.map(allocation => {
                      const cfg = conditionConfig[allocation.condition as ResourceCondition] || conditionConfig.good;
                      const CondIcon = cfg.icon;
                      return (
                        <div key={allocation.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                              <Package className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium">{allocation.resource_type?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {allocation.returned_quantity} returned
                                {allocation.returned_at && ` • ${new Date(allocation.returned_at).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <Badge className={`border-0 ${cfg.color} bg-transparent`}>
                            <CondIcon className="w-3 h-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {selected && (
            <Button
              onClick={handleReturn}
              disabled={returnMutation.isPending}
              className="gradient-primary text-white"
            >
              {returnMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <RotateCcw className="w-4 h-4 mr-2" />
              Confirm Return
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
