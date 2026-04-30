import { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Settings, LogOut, Moon, Sun, Calendar, Package, Users, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, useNavigate } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { profile, role, signOut } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: events } = useEvents();

  const displayName = profile?.name || profile?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  // Filter events by search query
  const filteredEvents = query.trim().length > 1
    ? (events || []).filter(e =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.venue?.toLowerCase().includes(query.toLowerCase()) ||
        e.category?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  // Quick links shown when search is focused but empty
  const quickLinks = [
    { label: 'All Events', icon: Calendar, path: '/events' },
    { label: 'Resources', icon: Package, path: '/resources' },
    { label: 'Users', icon: Users, path: '/users' },
    { label: 'Analytics', icon: Users, path: '/analytics' },
  ];

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  // Close results on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (path: string) => {
    setQuery('');
    setShowResults(false);
    navigate(path);
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
        <Input 
          placeholder="Search events, resources, users..." 
          className="pl-10 pr-8 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => { setQuery(''); setShowResults(false); }}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown Results */}
        {showResults && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
            {filteredEvents.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground px-4 pt-3 pb-1 uppercase tracking-wide">Events</p>
                {filteredEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => handleResultClick(`/events/${event.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{event.venue} · {event.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.trim().length > 1 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No results for "<strong>{query}</strong>"
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-muted-foreground px-4 pt-3 pb-1 uppercase tracking-wide">Quick Links</p>
                {quickLinks.map(link => (
                  <button
                    key={link.path}
                    onClick={() => handleResultClick(link.path)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <link.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">{link.label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
          </Button>
        </Link>

        <div className="h-6 w-px bg-border mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 overflow-hidden">
                <AvatarImage src={profile?.avatar_url || ''} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground capitalize">{role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/email-settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
