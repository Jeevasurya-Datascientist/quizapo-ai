import React, { useState, useEffect } from 'react';
import { AppUser } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, UserCheck, Search, Users, ShieldCheck, Award } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface NetworkPageProps {
    currentUser: AppUser;
    allUsers: AppUser[];
    onFollow: (targetUserId: string) => Promise<void>;
    onUnfollow: (targetUserId: string) => Promise<void>;
}

export const NetworkPage: React.FC<NetworkPageProps> = ({
    currentUser,
    allUsers,
    onFollow,
    onUnfollow
}) => {
    const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'discover'>('discover');
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Derived lists
    const followingList = allUsers.filter(u => currentUser.following.includes(u.id));
    const followersList = allUsers.filter(u => currentUser.followers?.includes(u.id));

    // Discover list: Users I am NOT following and is NOT me
    const discoverList = allUsers.filter(u =>
        !currentUser.following.includes(u.id) &&
        u.id !== currentUser.id
    );

    const filterList = (list: AppUser[]) => {
        if (!searchQuery) return list;
        return list.filter(u =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.collegeName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const handleAction = async (action: 'follow' | 'unfollow', userId: string) => {
        setLoadingId(userId);
        try {
            if (action === 'follow') {
                await onFollow(userId);
            } else {
                await onUnfollow(userId);
            }
        } catch (error) {
            console.error("Action failed", error);
        } finally {
            setLoadingId(null);
        }
    };

    const UserCard = ({ user, type }: { user: AppUser, type: 'following' | 'follower' | 'discover' }) => {
        const isFollowing = currentUser.following.includes(user.id);
        const isFollower = currentUser.followers?.includes(user.id);

        return (
            <Card className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h4 className="font-bold flex items-center gap-1 truncate">
                                {user.name}
                                {user.isIdVerified && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                            {user.collegeName && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                    <Award className="w-3 h-3" /> {user.collegeName}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                        {type === 'discover' || type === 'follower' ? (
                            <Button
                                size="sm"
                                variant={isFollowing ? "outline" : "default"}
                                className={isFollowing ? "text-muted-foreground" : "bg-blue-600 hover:bg-blue-700"}
                                onClick={() => handleAction(isFollowing ? 'unfollow' : 'follow', user.id)}
                                disabled={loadingId === user.id}
                            >
                                {loadingId === user.id ? "..." : isFollowing ? "Following" : isFollower ? "Follow Back" : "Follow"}
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleAction('unfollow', user.id)}
                                disabled={loadingId === user.id}
                            >
                                {loadingId === user.id ? "..." : "Unfollow"}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-violet-500 to-purple-600 p-8 rounded-3xl text-white shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Users className="w-8 h-8 opacity-80" /> My Network
                    </h1>
                    <p className="text-violet-100 mt-1">Connect with peers and faculty to grow your learning circle.</p>
                </div>
                <div className="flex gap-4 text-center">
                    <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 min-w-[80px]">
                        <div className="text-2xl font-bold">{currentUser.followers?.length || 0}</div>
                        <div className="text-xs font-medium opacity-80 uppercase tracking-wider">Followers</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 min-w-[80px]">
                        <div className="text-2xl font-bold">{currentUser.following.length}</div>
                        <div className="text-xs font-medium opacity-80 uppercase tracking-wider">Following</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <Card>
                <CardContent className="p-6">
                    <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <TabsList className="bg-muted/50 p-1">
                                <TabsTrigger value="discover" className="gap-2"><Search className="w-4 h-4" /> Discover</TabsTrigger>
                                <TabsTrigger value="following" className="gap-2 ml-4">Following <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{currentUser.following.length}</Badge></TabsTrigger>
                                <TabsTrigger value="followers" className="gap-2">Followers <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{currentUser.followers?.length || 0}</Badge></TabsTrigger>
                            </TabsList>

                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search people..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <TabsContent value="discover" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filterList(discoverList).map(u => <UserCard key={u.id} user={u} type="discover" />)}
                                {discoverList.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-muted-foreground">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No new users to discover right now.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="following" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filterList(followingList).map(u => <UserCard key={u.id} user={u} type="following" />)}
                                {followingList.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-muted-foreground">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>You aren't following anyone yet.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="followers" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filterList(followersList).map(u => <UserCard key={u.id} user={u} type="follower" />)}
                                {followersList.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-muted-foreground">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>You don't have any followers yet.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

        </div>
    );
};
