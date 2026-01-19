import { motion } from 'framer-motion';
import { Bell, Check, Calendar, User, MessageSquare } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const notifications = [
  {
    id: '1',
    type: 'registration',
    title: 'Registration Confirmed',
    message: 'You have successfully registered for "AI & Machine Learning Summit 2024"',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Event Reminder',
    message: '"Spring Cultural Festival" starts in 3 days. Don\'t forget to check in!',
    time: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    type: 'update',
    title: 'Event Updated',
    message: 'The venue for "Research Paper Writing Workshop" has been changed to Library Hall B.',
    time: '1 day ago',
    read: true,
  },
  {
    id: '4',
    type: 'approval',
    title: 'Event Approved',
    message: 'Your event "Hackathon: Build for Good" has been approved by the admin.',
    time: '2 days ago',
    read: true,
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Event Tomorrow',
    message: '"AI & Machine Learning Summit 2024" is happening tomorrow at 09:00 AM.',
    time: '3 days ago',
    read: true,
  },
];

const typeIcons = {
  registration: Calendar,
  reminder: Bell,
  update: MessageSquare,
  approval: Check,
};

const typeColors = {
  registration: 'bg-primary/10 text-primary',
  reminder: 'bg-warning/10 text-warning',
  update: 'bg-info/10 text-info',
  approval: 'bg-success/10 text-success',
};

export default function NotificationsPage() {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <MainLayout>
      <div className="p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold"
            >
              Notifications
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground mt-1"
            >
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </motion.p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline">Mark all as read</Button>
          )}
        </div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {notifications.map((notification, index) => {
            const Icon = typeIcons[notification.type as keyof typeof typeIcons];
            const colorClass = typeColors[notification.type as keyof typeof typeColors];

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={cn(
                  "relative bg-card rounded-xl border border-border p-4 flex items-start gap-4 transition-all hover:shadow-md cursor-pointer",
                  !notification.read && "bg-primary/5 border-primary/20"
                )}
              >
                {!notification.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                )}
                <div className={cn("p-2 rounded-lg flex-shrink-0", colorClass)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {notifications.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground">You're all caught up!</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
