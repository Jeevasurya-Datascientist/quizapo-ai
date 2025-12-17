import React, { useState, useEffect } from 'react';
import { AppUser, FollowRequest } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, ShieldCheck, Clock, UserPlus, UserCheck, Inbox, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { socialService } from '../services/socialService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { cn } from '@/lib/utils'; // Assuming you have this utility

interface NetworkPageProps {
    currentUser: AppUser;
    allUsers: AppUser[];
}

export const NetworkPage: React.FC<NetworkPageProps> = ({ currentUser, allUsers }) => {
    const [activeTab, setActiveTab] = useState<'requests' | 'connections'>('requests');
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Social State
    const [incomingRequests, setIncomingRequests] = useState<FollowRequest[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<FollowRequest[]>([]);
    const [connections, setConnections] = useState<string[]>([]);

    // 1. Listen for Real-time Social Data
    useEffect(() => {
        if (!currentUser) return;

        // Incoming
        const qIn = query(
            collection(db, 'follow_requests'),
            where('toUserId', '==', currentUser.id),
            where('status', 'in', ['pending', 'pending_auto_followback'])
        );
        const unsubIn = onSnapshot(qIn, (snap) => {
            setIncomingRequests(snap.docs.map(d => d.data() as FollowRequest));
        });

        // Outgoing
        const qOut = query(
            collection(db, 'follow_requests'),
            where('fromUserId', '==', currentUser.id),
            where('status', '==', 'pending')
        );
        const unsubOut = onSnapshot(qOut, (snap) => {
            setOutgoingRequests(snap.docs.map(d => d.data() as FollowRequest));
        });

        setConnections(currentUser.following || []);

        return () => { unsubIn(); unsubOut(); };
    }, [currentUser]);

    // 2. Fix: Clear Search when Tab Changes
    useEffect(() => {
        setSearchQuery('');
    }, [activeTab]);

    // Derived Logic
    const filterList = (list: AppUser[]) => {
        if (searchQuery.length < 3) return list;
        return list.filter(u =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const handleAction = async (action: string, targetUser: AppUser, reqId?: string) => {
        setLoadingId(targetUser.id);
        try {
            if (action === 'follow') await socialService.sendFollowRequest(currentUser.id, targetUser.id, currentUser.name, currentUser.email);
            else if (action === 'accept') await socialService.acceptRequest(reqId!, targetUser.id, currentUser.id);
            else if (action === 'accept_followback') await socialService.finalizeConnection(reqId!, currentUser.id, targetUser.id);
            else if (action === 'reject') await socialService.rejectRequest(reqId!);
        } catch (error) {
            console.error(error);
            alert("Action failed: " + error);
        } finally {
            setLoadingId(null);
        }
    };

    // Sub-Component: User Card
    const UserCard = ({ user }: { user: AppUser }) => {
        const isConnected = connections.includes(user.id);
        const hasOutgoingPending = outgoingRequests.find(r => r.toUserId === user.id);
        const hasIncomingPending = incomingRequests.find(r => r.fromUserId === user.id);
        const hasIncomingAuto = incomingRequests.find(r => r.fromUserId === user.id && r.status === 'pending_auto_followback');

        let ActionButton;

        if (isConnected) {
            ActionButton = (
                <Button variant="secondary" className="w-full bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                    <UserCheck className="w-4 h-4 mr-2" /> Following
                </Button>
            );
        } else if (hasIncomingAuto) {
            ActionButton = (
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all hover:scale-[1.02]"
                    onClick={() => handleAction('accept_followback', user, hasIncomingAuto.id)} disabled={!!loadingId}>
                    {loadingId === user.id ? "..." : "Accept Follow Back"}
                </Button>
            );
        } else if (hasIncomingPending) {
            ActionButton = (
                <div className="flex gap-2 w-full">
                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => handleAction('accept', user, hasIncomingPending.id)} disabled={!!loadingId}>
                        Accept
                    </Button>
                    <Button variant="outline" className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleAction('reject', user, hasIncomingPending.id)}>
                        Reject
                    </Button>
                </div>
            );
        } else if (hasOutgoingPending) {
            ActionButton = (
                <Button variant="ghost" className="w-full text-muted-foreground bg-muted/50 cursor-default" disabled>
                    <Clock className="w-4 h-4 mr-2" /> Requested
                </Button>
            );
        } else {
            ActionButton = (
                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all hover:scale-[1.02]"
                    onClick={() => handleAction('follow', user)} disabled={!!loadingId}>
                    {loadingId === user.id ? "..." : <><UserPlus className="w-4 h-4 mr-2" /> Follow</>}
                </Button>
            );
        }

        return (
            <Card className="group relative overflow-hidden border border-slate-200 hover:border-violet-300 transition-all duration-300 hover:shadow-xl bg-white/70 backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-5 flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg mb-3 group-hover:scale-105 transition-transform duration-300">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-100 to-indigo-100 text-indigo-700 text-xl font-bold">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1 w-full mb-4">
                        <h4 className="font-bold text-lg text-slate-800 flex items-center justify-center gap-1">
                            {user.name}
                            {user.isIdVerified && <ShieldCheck className="w-4 h-4 text-blue-500 fill-blue-50" />}
                        </h4>
                        <p className="text-sm font-medium text-slate-500">@{user.username}</p>

                        <div className="flex justify-center gap-4 text-xs text-slate-400 pt-2">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> <b>{user.followersCount || 0}</b> Followers</span>
                            <span>•</span>
                            <span><b>{user.followingCount || 0}</b> Following</span>
                        </div>
                    </div>

                    <div className="w-full mt-auto pt-2">
                        {ActionButton}
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Prepare Lists
    const requestUsers = incomingRequests.map(r => allUsers.find(u => u.id === r.fromUserId)).filter(Boolean) as AppUser[];
    const connectedUsers = allUsers.filter(u => connections.includes(u.id));

    // Search Mode Logic
    const isSearching = searchQuery.length >= 3;
    const baseList = activeTab === 'requests' ? requestUsers : connectedUsers;
    const searchBase = filterList(allUsers).filter(u => u.id !== currentUser.id && !connections.includes(u.id)); // Use global search if typing

    // If searching, we act like "Discover" mode if tab logic permits, or just filter current tab?
    // User requested: "If I searching , I navigate connections tab ,same search results are shown ,fix" -> implied global search persists.
    // BUT we added useEffect to CLEAR search on tab change.
    // So if I am in Request tab -> search -> shows results.
    // Switch to Connections -> search clears -> shows connections.
    // The "Display List" should be:
    // 1. If searching: Show Global Search Results (excluding self/connected if desired, or maybe purely name match?)
    // Let's stick to: Search filters GLOBAL users to help discovery.

    // BUT wait, if I want to search my connections?
    // Let's make search Context-Aware or Global?
    // Usually "Discover" is global. "Connections" search is local.
    // Let's implement Hybrid:
    // If Tab == Requests => Search filters incoming requests? Or Global to find new people? 
    // The "Search bar" is usually for discovery.
    // Let's use Global Search for now as it's the only way to find people.

    const displayList = isSearching
        ? filterList(allUsers).filter(u => u.id !== currentUser.id) // Global Search Result
        : baseList;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* 1. Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 text-white p-8 md:p-12 shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Users className="w-64 h-64 -mr-16 -mt-16" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-violet-200">
                            Your Network
                        </h1>
                        <p className="text-lg text-indigo-200 max-w-lg">
                            Connect with peers, grow your academic circle, and collaborate instantly.
                        </p>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 w-28 border border-white/10 hover:bg-white/15 transition-colors">
                            <span className="text-3xl font-bold">{currentUser.followersCount || 0}</span>
                            <span className="text-xs uppercase tracking-wider font-semibold opacity-70">Followers</span>
                        </div>
                        <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 w-28 border border-white/10 hover:bg-white/15 transition-colors">
                            <span className="text-3xl font-bold">{currentUser.followingCount || 0}</span>
                            <span className="text-xs uppercase tracking-wider font-semibold opacity-70">Following</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 sticky top-4 z-20 backdrop-blur-xl bg-white/80">
                    <TabsList className="bg-slate-100/50 p-1 rounded-xl">
                        <TabsTrigger value="requests" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
                            Requests
                            {incomingRequests.length > 0 && (
                                <Badge className="ml-2 bg-red-500 hover:bg-red-600 text-white border-0 px-1.5 h-5 min-w-[1.25rem] flex items-center justify-center">
                                    {incomingRequests.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="connections" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
                            Connections
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full md:w-80 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                        </div>
                        <Input
                            placeholder="Find people..."
                            className="pl-10 bg-slate-50 border-slate-200 focus:border-violet-300 focus:ring-violet-100 rounded-xl transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <TabsContent value="requests" className="m-0 outline-none animate-in slide-in-from-left-4 duration-300">
                    {displayList.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {displayList.map(u => <UserCard key={u.id} user={u} />)}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-0 animate-in fade-in duration-500 fill-mode-forwards" style={{ animationDelay: '0.1s' }}>
                            <div className="bg-indigo-50 p-6 rounded-full mb-4">
                                <Inbox className="w-10 h-10 text-indigo-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700">No New Requests</h3>
                            <p className="text-slate-500 max-w-xs mt-2">You're all caught up! Use the search bar to find new people to connect with.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="connections" className="m-0 outline-none animate-in slide-in-from-right-4 duration-300">
                    {displayList.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {displayList.map(u => <UserCard key={u.id} user={u} />)}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-emerald-50 p-6 rounded-full mb-4">
                                <UserPlus className="w-10 h-10 text-emerald-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700">Start Your Network</h3>
                            <p className="text-slate-500 max-w-xs mt-2">Connecting with others helps you share knowledge. Search for a peer to get started!</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
