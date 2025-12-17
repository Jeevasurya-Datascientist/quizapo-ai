// src/components/ProfilePage.tsx
import React, { useState } from 'react';
import type { AppUser } from '../types';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  User, Settings, Palette, Save, LogOut, Loader2, RefreshCw, Dice5
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ProfilePageProps {
  user: AppUser;
  onLogout: () => void;
  onBack: () => void;
}

const AVATAR_STYLES = [
  { id: 'adventurer', name: 'Adventurer' },
  { id: 'adventurer-neutral', name: 'Adventurer Neutral' },
  { id: 'avataaars', name: 'Avataaars' },
  { id: 'big-ears', name: 'Big Ears' },
  { id: 'big-ears-neutral', name: 'Big Ears Neutral' },
  { id: 'big-smile', name: 'Big Smile' },
  { id: 'bottts', name: 'Bottts' },
  { id: 'croodles', name: 'Croodles' },
  { id: 'croodles-neutral', name: 'Croodles Neutral' },
  { id: 'fun-emoji', name: 'Fun Emoji' },
  { id: 'icons', name: 'Icons' },
  { id: 'identicon', name: 'Identicon' },
  { id: 'initials', name: 'Initials' },
  { id: 'lorelei', name: 'Lorelei' },
  { id: 'lorelei-neutral', name: 'Lorelei Neutral' },
  { id: 'micah', name: 'Micah' },
  { id: 'miniavs', name: 'Miniavs' },
  { id: 'open-peeps', name: 'Open Peeps' },
  { id: 'personas', name: 'Personas' },
  { id: 'pixel-art', name: 'Pixel Art' },
  { id: 'pixel-art-neutral', name: 'Pixel Art Neutral' },
  { id: 'shapes', name: 'Shapes' },
  { id: 'thumbs', name: 'Thumbs' }
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onBack }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Avatar State
  const [avatarStyle, setAvatarStyle] = useState('adventurer');
  const [avatarSeed, setAvatarSeed] = useState(user.username || 'seed');
  const [previewUrl, setPreviewUrl] = useState(user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`);

  // Generate preview URL based on current local state
  const generatePreview = () => {
    const url = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`;
    setPreviewUrl(url);
  };

  // Trigger preview update when style/seed changes
  React.useEffect(() => {
    generatePreview();
  }, [avatarStyle, avatarSeed]);

  const handleSaveAvatar = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        avatarUrl: previewUrl
      });
      // UPDATE: Replaced native alert with custom toast
      toast("Avatar updated successfully!", "success");
    } catch (error) {
      console.error("Error saving avatar:", error);
      toast("Failed to update avatar.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRandomize = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your profile, appearance, and account settings.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={onBack}>Back to Dashboard</Button>
          <Button variant="destructive" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
            <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-1 w-full">
              <TabsTrigger value="profile" className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <User className="w-4 h-4 mr-3" /> Profile
              </TabsTrigger>
              <TabsTrigger value="appearance" className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Palette className="w-4 h-4 mr-3" /> Appearance
              </TabsTrigger>
              <TabsTrigger value="account" className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Settings className="w-4 h-4 mr-3" /> Account
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">

          {/* PROFILE TAB */}
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="profile" className="mt-0 space-y-6">
              {/* User Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your public profile details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={user.name} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input value={`@${user.username}`} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user.email} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input value={user.role} disabled className="bg-muted/50 capitalize" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-primary/5 rounded-xl text-center">
                    <p className="text-2xl font-bold text-primary">{user.followersCount || 0}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Followers</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl text-center">
                    <p className="text-2xl font-bold text-primary">{user.followingCount || 0}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Following</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* APPEARANCE TAB */}
            <TabsContent value="appearance" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Avatar Customization</CardTitle>
                  <CardDescription>Design your unique avatar using standard library components.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">

                  <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-6 bg-muted/30 rounded-xl border border-dashed">
                    <div className="relative group">
                      <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                        <img
                          src={previewUrl}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full max-w-sm">
                      <div className="space-y-2">
                        <Label>Avatar Style</Label>
                        <Select value={avatarStyle} onValueChange={setAvatarStyle}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {AVATAR_STYLES.map(style => (
                              <SelectItem key={style.id} value={style.id}>{style.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Random Seed</Label>
                        <div className="flex gap-2">
                          <Input value={avatarSeed} onChange={(e) => setAvatarSeed(e.target.value)} />
                          <Button variant="outline" size="icon" onClick={handleRandomize} title="Randomize">
                            <Dice5 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t bg-muted/10 p-4">
                  <Button variant="outline" onClick={() => {
                    setAvatarStyle('adventurer');
                    setAvatarSeed(user.username);
                  }}>Reset</Button>
                  <Button onClick={handleSaveAvatar} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Avatar
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* ACCOUNT TAB */}
            <TabsContent value="account" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Manage your password and data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">It's a good idea to use a strong password.</p>
                    </div>
                    <Button variant="outline" disabled>Change</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Export Data</p>
                      <p className="text-sm text-muted-foreground">Download a copy of your personal data.</p>
                    </div>
                    <Button variant="outline" disabled>Export</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50 dark:bg-red-900/10">
                    <div>
                      <p className="font-medium text-red-600">Delete Account</p>
                      <p className="text-sm text-red-600/80">Permanently delete your account and all data.</p>
                    </div>
                    <Button variant="destructive" disabled>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};