import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Building, 
  Save, 
  Shield, 
  Key, 
  Camera,
  Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ProfilePage() {
  const { profile, role, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    department: profile?.department || '',
    phone: profile?.phone || '',
  });

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          department: formData.department,
          phone: formData.phone,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      await refreshProfile();
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // 1. Upload image to 'avatars' bucket
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update profile with new avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      await refreshProfile();

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Ensure an "avatars" bucket exists in your Supabase Storage.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const displayName = profile?.name || profile?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your personal information and account security</p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="gradient-primary text-white">
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isLoading} className="gradient-primary text-white">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Role */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <Avatar className="w-32 h-32 border-4 border-background shadow-xl overflow-hidden">
                  <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                    {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : initials}
                  </AvatarFallback>
                </Avatar>
                <Label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </Label>
              </div>
              <h3 className="text-xl font-bold">{displayName}</h3>
              <p className="text-muted-foreground text-sm flex items-center justify-center gap-1 mt-1">
                <Mail className="w-3 h-3" />
                {profile?.email}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                <Shield className="w-4 h-4" />
                {role}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Account Security
              </h4>
              <p className="text-sm text-muted-foreground mb-4">Keep your account secure by updating your password regularly.</p>
              <Button variant="outline" className="w-full">Change Password</Button>
            </div>
          </motion.div>

          {/* Right Column: Details Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="h-2 gradient-primary" />
              <div className="p-8">
                <h4 className="text-lg font-semibold mb-6">Personal Information</h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="name" 
                          value={formData.name} 
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dept">Department</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="dept" 
                          value={formData.department} 
                          onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        value={profile?.email} 
                        disabled 
                        className="pl-10 bg-muted/50"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Email cannot be changed directly for security reasons.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone} 
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="+256 ..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-8">
              <h4 className="text-lg font-semibold mb-2">Data Privacy</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your data is stored securely and only used for event management purposes. 
                We do not share your information with third-party providers.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
