
-- Add return tracking columns to event_resources
ALTER TABLE public.event_resources 
ADD COLUMN IF NOT EXISTS returned boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS returned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS returned_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS condition text DEFAULT 'good',
ADD COLUMN IF NOT EXISTS return_confirmed_by uuid;

-- Create resource audit log table
CREATE TABLE public.resource_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  resource_type_id uuid REFERENCES public.resource_types(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL, -- 'allocated', 'deallocated', 'returned'
  quantity integer NOT NULL,
  condition text, -- 'good', 'damaged', 'needs_repair', 'lost'
  performed_by uuid NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.resource_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit log
CREATE POLICY "Admins can view all audit logs"
ON public.resource_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert audit logs"
ON public.resource_audit_log
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Organizers can view audit logs for their events"
ON public.resource_audit_log
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = resource_audit_log.event_id 
  AND events.organizer_id = auth.uid()
));
