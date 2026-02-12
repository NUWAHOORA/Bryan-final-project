import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, Eye, EyeOff, ArrowRight, Users, Shield, BookOpen } from 'lucide-react';
import ucuLogo from '@/assets/ucu-logo.png';
import campusBg from '@/assets/campus-bg.jpg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const roles = [
  { 
    value: 'student' as UserRole, 
    label: 'Student', 
    icon: BookOpen,
    description: 'Browse and register for events',
    color: 'border-blue-500 bg-blue-500/10 text-blue-600'
  },
  { 
    value: 'organizer' as UserRole, 
    label: 'Organizer', 
    icon: Users,
    description: 'Create and manage events',
    color: 'border-green-500 bg-green-500/10 text-green-600'
  },
];

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || 'Failed to sign in');
        } else {
          toast.success('Welcome back!');
          navigate('/dashboard');
        }
      } else {
        if (!name.trim()) {
          toast.error('Please enter your name');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name, selectedRole);
        if (error) {
          toast.error(error.message || 'Failed to sign up');
        } else {
          toast.success('Account created successfully!');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={campusBg} alt="UCU Campus" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col items-start mb-8">
              <img src={ucuLogo} alt="UCU Logo" className="w-72 h-72 object-contain mb-6" />
              <div>
                <h1 className="text-2xl font-bold">UCU Events</h1>
                <p className="text-white/70 text-sm">Event Management System</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold leading-tight mb-6">
              Manage University Events<br />
              <span className="text-white/80">Smarter & Faster</span>
            </h2>
            
            <p className="text-lg text-white/70 max-w-md mb-8">
              Plan, promote, and analyze academic and social events with our comprehensive management platform.
            </p>

            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Events', value: '500+' },
                { label: 'Students', value: '25K+' },
                { label: 'Departments', value: '12' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                  className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm"
                >
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img src={ucuLogo} alt="UCU Logo" className="w-32 h-32 object-contain mb-2" />
            <div className="text-center">
              <h1 className="text-xl font-bold">UCU Events</h1>
              <p className="text-muted-foreground text-sm">Event Management</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-muted-foreground">
              {isLogin 
                ? 'Sign in to your account to continue'
                : 'Sign up to get started with UniEvents'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Your Role</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((role) => {
                      const Icon = role.icon;
                      const isSelected = selectedRole === role.value;
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setSelectedRole(role.value)}
                          className={cn(
                            "flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200",
                            isSelected 
                              ? role.color + " border-current" 
                              : "border-border hover:border-muted-foreground/50 bg-card"
                          )}
                        >
                          <Icon className={cn(
                            "w-6 h-6 mb-1",
                            isSelected ? "" : "text-muted-foreground"
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            isSelected ? "" : "text-muted-foreground"
                          )}>
                            {role.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {roles.find(r => r.value === selectedRole)?.description}
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 gradient-primary text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign in' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-primary font-medium hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
