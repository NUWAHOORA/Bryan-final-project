import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Plus, Settings, Monitor, Music, Armchair, Presentation, Mic, Speaker, 
  ClipboardList, Box, Loader2, FileText, RotateCcw, ArrowUpRight
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { useResourceTypes, useCreateResourceType, useAllAllocations } from '@/hooks/useResources';
import { ResourceAuditLog } from '@/components/resources/ResourceAuditLog';
import { ResourceReturnDialog } from '@/components/resources/ResourceReturnDialog';

const resourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Chairs': Armchair, 'Computers': Monitor, 'Music Instruments': Music,
  'Projectors': Presentation, 'Microphones': Mic, 'Speakers': Speaker,
  'Whiteboards': ClipboardList, 'Tables': Box,
};

export default function ResourcesPage() {
  const { data: resources, isLoading } = useResourceTypes();
  const { data: allAllocations, isLoading: loadingAllocations } = useAllAllocations();
  const createMutation = useCreateResourceType();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<{ id: string, eventId: string, eventTitle: string } | null>(null);
  const [newResource, setNewResource] = useState({ name: '', description: '', total_quantity: 0 });

  const getIcon = (name: string) => resourceIcons[name] || Package;

  const handleCreate = async () => {
    await createMutation.mutateAsync(newResource);
    setIsDialogOpen(false);
    setNewResource({ name: '', description: '', total_quantity: 0 });
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold">
              Resource Management
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground mt-1">
              Manage inventory, allocations, and track resource conditions
            </motion.p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Resource Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Resource Type</DialogTitle>
                <DialogDescription>Create a new type of resource that can be allocated to events</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Resource Name</Label>
                  <Input id="name" placeholder="e.g., Projectors" value={newResource.name} onChange={e => setNewResource(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description" value={newResource.description} onChange={e => setNewResource(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Total Quantity</Label>
                  <Input id="quantity" type="number" min={0} value={newResource.total_quantity} onChange={e => setNewResource(prev => ({ ...prev, total_quantity: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending || !newResource.name || newResource.total_quantity <= 0} className="gradient-primary text-white">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Resource
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="checkouts" className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Check-outs
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : resources?.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No resources yet</h3>
                <p className="text-muted-foreground mb-4">Add your first resource type to get started</p>
                <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource Type
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {resources?.map((resource, index) => {
                  const Icon = getIcon(resource.name);
                  const allocated = resource.total_quantity - resource.available_quantity;
                  const usagePercentage = resource.total_quantity > 0 ? (allocated / resource.total_quantity) * 100 : 0;

                  return (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>

                      <h3 className="font-semibold text-lg mb-1">{resource.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{resource.description || 'No description'}</p>

                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-muted/50">
                            <p className="text-lg font-bold">{resource.total_quantity}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                          </div>
                          <div className="p-2 rounded-lg bg-primary/5">
                            <p className="text-lg font-bold text-primary">{allocated}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Allocated</p>
                          </div>
                          <div className="p-2 rounded-lg bg-success/5">
                            <p className="text-lg font-bold text-success">{resource.available_quantity}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Available</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Usage</span>
                            <span>{usagePercentage.toFixed(0)}% allocated</span>
                          </div>
                          <Progress value={usagePercentage} className="h-2" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="checkouts">
            {loadingAllocations ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !allAllocations || allAllocations.length === 0 ? (
              <div className="text-center py-16">
                <ArrowUpRight className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active check-outs</h3>
                <p className="text-muted-foreground">Resources can be checked out from individual event pages</p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-4 font-semibold text-sm">Resource</th>
                      <th className="p-4 font-semibold text-sm">Event</th>
                      <th className="p-4 font-semibold text-sm">Quantity</th>
                      <th className="p-4 font-semibold text-sm">Checked Out By</th>
                      <th className="p-4 font-semibold text-sm">Date</th>
                      <th className="p-4 font-semibold text-sm">Status</th>
                      <th className="p-4 font-semibold text-sm text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allAllocations.map((allocation) => (
                      <tr key={allocation.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Package className="w-4 h-4 text-primary" />
                            <span className="font-medium">{allocation.resource_type?.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium">{allocation.event_title}</td>
                        <td className="p-4 text-sm">{allocation.quantity}</td>
                        <td className="p-4 text-sm">{allocation.allocated_by_name}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(allocation.allocated_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          {allocation.returned ? (
                            <Badge variant="outline" className="text-success border-success bg-success/5">
                              Returned
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-warning border-warning bg-warning/5">
                              Out
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {!allocation.returned && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-primary hover:bg-primary/10"
                              onClick={() => {
                                setSelectedAllocation({
                                  id: allocation.id,
                                  eventId: allocation.event_id,
                                  eventTitle: allocation.event_title
                                });
                                setReturnDialogOpen(true);
                              }}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Check-in
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="audit">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Resource Audit Log
              </h3>
              <ResourceAuditLog />
            </div>
          </TabsContent>
        </Tabs>

        {selectedAllocation && (
          <ResourceReturnDialog
            open={returnDialogOpen}
            onOpenChange={setReturnDialogOpen}
            eventId={selectedAllocation.eventId}
            eventTitle={selectedAllocation.eventTitle}
          />
        )}
      </div>
    </MainLayout>
  );
}
