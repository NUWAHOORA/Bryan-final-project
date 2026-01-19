import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, Clock, MapPin, Download } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { mockEvents } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';

export default function TicketsPage() {
  const { user } = useAuth();
  // Mock registered events
  const registeredEvents = mockEvents.filter(e => e.status === 'approved').slice(0, 3);

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold"
          >
            My Tickets
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1"
          >
            Your QR codes for event check-in
          </motion.p>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registeredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <div className="h-2 gradient-primary" />
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{event.title}</h3>
                
                <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center p-4 bg-white rounded-xl mb-4">
                  <QRCodeSVG
                    value={`ticket:${event.id}:${user?.id}`}
                    size={150}
                    level="H"
                    includeMargin
                  />
                </div>

                <p className="text-xs text-muted-foreground text-center mb-4">
                  Show this QR code at the venue entrance
                </p>

                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Ticket
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {registeredEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
            <p className="text-muted-foreground">Register for events to get your tickets</p>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
