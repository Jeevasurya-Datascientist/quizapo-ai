// src/components/Notifications.tsx

import React, { useState, useMemo } from 'react';
import type { AppNotification, Test } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import {
  ArrowLeft, Bell, FileText, MessageSquare, Clock, Check, X, CheckCheck, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';


interface NotificationsProps {
  notifications: AppNotification[];
  onStartTest: (test: Test, notificationId: string) => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onMarkAllRead: () => void;
  onBack: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({
  notifications, onStartTest, onMarkRead, onDismiss, onMarkAllRead, onBack
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');

  // Filter & Sort
  const sorted = useMemo(() => {
    return [...notifications]
      .filter(n => n.status !== 'ignored') // Filter out dismissed
      .sort((a, b) => {
        const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tB - tA;
      });
  }, [notifications]);

  const unreadCount = notifications.filter(n => n.status === 'new').length;
  const filtered = activeTab === 'unread'
    ? sorted.filter(n => n.status === 'new')
    : sorted;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than 24h
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-3xl mx-auto min-h-[80vh] flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 pt-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 hover:bg-transparent">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1 text-center pr-8">Notifications</h1>
        </div>

        <div className="flex items-center justify-between px-1">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <div className="flex items-center justify-between w-full mb-4">
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && <Badge className="ml-2 h-5 px-1.5 bg-red-500 hover:bg-red-600 border-0">{unreadCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  <CheckCheck className="w-3 h-3 mr-1" /> Mark all read
                </Button>
              )}
            </div>

            <div className="space-y-3 min-h-[300px]">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                  <div className="bg-slate-100 p-6 rounded-full mb-4">
                    <Bell className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-medium text-slate-500">
                    {activeTab === 'unread' ? "No unread notifications" : "No notifications yet"}
                  </p>
                </div>
              ) : (
                filtered.map(notif => {
                  const isTest = notif.type === 'test_invite' || (!!notif.test);
                  const isMessage = notif.type === 'message';
                  const isNew = notif.status === 'new';

                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        "relative overflow-hidden rounded-xl border transition-all duration-300",
                        isNew
                          ? "bg-white border-blue-200 shadow-md shadow-blue-500/5 dark:bg-slate-800 dark:border-blue-900"
                          : "bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 opacity-90 hover:opacity-100"
                      )}
                    >
                      {isNew && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />}

                      <div className="p-4 flex gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                          isTest ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                        )}>
                          {isTest ? <FileText className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-medium text-muted-foreground">
                              {notif.facultyName}
                              {notif.facultyUsername && <span className="font-normal text-muted-foreground ml-1">@{notif.facultyUsername}</span>}
                            </p>
                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              {formatDate(notif.timestamp)}
                            </span>
                          </div>

                          {isTest && notif.test ? (
                            <div className="mb-2">
                              <h4 className="font-bold text-foreground leading-tight">{notif.test.title}</h4>
                              <p className="text-xs text-muted-foreground flex gap-3 mt-1">
                                <span>{notif.test.questions.length} Questions</span>
                                <span>{notif.test.durationMinutes} mins</span>
                              </p>
                            </div>
                          ) : (
                            <div className="mb-2">
                              <h4 className="font-bold text-foreground">{notif.title || "New Message"}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{notif.message}</p>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            {isTest && notif.test && (
                              <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4"
                                onClick={() => onStartTest(notif.test!, notif.id)}>
                                Start Test
                              </Button>
                            )}

                            {isNew ? (
                              <Button size="sm" variant="ghost" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => onMarkRead(notif.id)}>
                                <Check className="w-4 h-4 mr-1" /> Mark Read
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                onClick={() => onDismiss(notif.id)}>
                                <Trash2 className="w-4 h-4 mr-1" /> Dismiss
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};