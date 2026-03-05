import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function CheckInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already'>('loading');
  const [message, setMessage] = useState('');
  const [eventTitle, setEventTitle] = useState('');

  const eventId = searchParams.get('event');
  const userId = searchParams.get('user');
  const regId = searchParams.get('reg');

  useEffect(() => {
    if (!eventId || !userId || !regId) {
      setStatus('error');
      setMessage('Invalid check-in link. Missing parameters.');
      return;
    }

    processCheckIn();
  }, [eventId, userId, regId]);

  const processCheckIn = async () => {
    try {
      // Fetch the event title
      const { data: eventData } = await supabase
        .from('events')
        .select('title')
        .eq('id', eventId!)
        .single();

      if (eventData) setEventTitle(eventData.title);

      // Look up registration
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select('id, attended, event_id, user_id')
        .eq('id', regId!)
        .eq('event_id', eventId!)
        .eq('user_id', userId!)
        .maybeSingle();

      if (regError) throw regError;

      if (!registration) {
        setStatus('error');
        setMessage('Registration not found. This attendee may not be registered for this event.');
        return;
      }

      if (registration.attended) {
        setStatus('already');
        setMessage('This attendee has already been checked in.');
        return;
      }

      // Mark attendance
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ attended: true, attended_at: new Date().toISOString() })
        .eq('id', registration.id);

      if (updateError) throw updateError;

      setStatus('success');
      setMessage('Attendance has been recorded successfully!');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Failed to process check-in. Please try again.');
    }
  };

  const icon = {
    loading: <Loader2 className="w-16 h-16 text-primary animate-spin" />,
    success: <CheckCircle className="w-16 h-16 text-success" />,
    already: <CheckCircle className="w-16 h-16 text-warning" />,
    error: <XCircle className="w-16 h-16 text-destructive" />,
  }[status];

  const heading = {
    loading: 'Processing Check-in...',
    success: 'Check-in Successful!',
    already: 'Already Checked In',
    error: 'Check-in Failed',
  }[status];

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-6">
          {icon}
          <h1 className="text-2xl font-bold">{heading}</h1>
          {eventTitle && (
            <p className="text-lg text-primary font-medium">{eventTitle}</p>
          )}
          <p className="text-muted-foreground">{message}</p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate('/attendance')}>
              Go to Scanner
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
