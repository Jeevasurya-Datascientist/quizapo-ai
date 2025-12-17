// src/components/Header.tsx

import React, { useState } from 'react';
import { Menu, X, LogOut, User, Bell, LayoutDashboard, Database, Network } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { View, AppUser } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
  user: AppUser | null;
  activeView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeView,
  onNavigate,
  onLogout,
  notificationCount = 0
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const NavItem = ({ view, icon: Icon, label, mobile = false }: { view: View; icon: any; label: string; mobile?: boolean }) => (
    <button
      onClick={() => { onNavigate(view); if (mobile) setIsSidebarOpen(false); }}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all w-full font-medium",
        mobile ? (activeView === view ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")
          : (activeView === view ? "text-primary" : "text-muted-foreground hover:text-foreground")
      )}
    >
      <Icon className={cn("w-5 h-5", !mobile && "w-4 h-4")} />
      {label}
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 grid grid-cols-3 items-center">

          {/* LEFT: Menu Trigger */}
          <div className="flex items-center justify-start gap-4">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* CENTER: Branding */}
          <div className="flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto cursor-pointer" onClick={() => onNavigate('dashboard')}>
              <div className="bg-primary text-primary-foreground h-8 w-8 rounded-lg flex items-center justify-center font-bold text-lg">Q</div>
              <span className="font-bold text-xl tracking-tight hidden sm:inline-block">Quizapo AI</span>
              <span className="font-bold text-xl tracking-tight sm:hidden">Q.AI</span>
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" onClick={() => onNavigate('notifications')}>
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </Button>

            <Button variant="ghost" size="sm" onClick={() => onNavigate('profile')} className="pl-0 gap-2 hover:bg-transparent">
              <Avatar className="w-8 h-8 border border-white/20 cursor-pointer">
                <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} />
                <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              {user && <span className="hidden md:inline text-sm font-medium">@{user.username}</span>}
            </Button>
          </div>
        </div>
      </header>

      {/* SIDEBAR DRAWER (Universal) */}
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r shadow-2xl transform transition-transform duration-300 ease-out flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-bold text-lg">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" mobile />
          <NavItem view="content" icon={Database} label="Content Library" mobile />
          <NavItem view="network" icon={Network} label="Network Center" mobile />

          <div className="my-4 border-t" />

          <NavItem view="profile" icon={User} label="Profile & Settings" mobile />
        </div>

        <div className="p-4 border-t bg-muted/20">
          {user && (
            <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-background border">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                <AvatarFallback>{user.username[0]}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
            </div>
          )}
          <Button variant="destructive" className="w-full justify-start" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </>
  );
};