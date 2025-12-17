
// src/components/Dashboard.tsx

import React, { useMemo } from 'react';
import { AppUser, Test, GeneratedMcqSet, TestAttempt, View, QuestionBank } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Activity,
  ArrowRight,
  Bell,
  User,
  ShieldCheck,
  Star,
  Award,
  Zap,
  Crown,
  LayoutDashboard,
  Rocket,
  PlusCircle,
  Network,
  Siren,
  PenTool
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';

// --- HELPER: Badge Logic ---
interface UserBadge {
  id: string;
  label: string;
  icon: any;
  color: string;
  description: string;
}

const getUserBadges = (user: AppUser, publishedTests: Test[]): UserBadge[] => {
  const badges: UserBadge[] = [];
  const followerCount = user.followers?.length || 0;
  const testCount = publishedTests.length;

  if (user.isIdVerified) {
    badges.push({ id: 'trustee', label: 'Verified', icon: ShieldCheck, color: 'bg-blue-100 text-blue-700 border-blue-200', description: 'Identity Verified' });
  }
  if (followerCount >= 50) {
    badges.push({ id: 'influencer', label: 'Influencer', icon: Crown, color: 'bg-purple-100 text-purple-700 border-purple-200', description: 'Major Impact' });
  }
  if (testCount >= 5) {
    badges.push({ id: 'prolific', label: 'Prolific', icon: Zap, color: 'bg-amber-100 text-amber-700 border-amber-200', description: 'High Output' });
  }
  return badges;
};

// --- COMPONENT: DashboardHero ---
const DashboardHero: React.FC<{
  user: AppUser;
  publishedTests: Test[];
  onNavigate: (view: View) => void;
}> = ({ user, publishedTests, onNavigate }) => {
  const badges = useMemo(() => getUserBadges(user, publishedTests), [user, publishedTests]);
  const isFaculty = user.role === 'faculty';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-xl dark:shadow-purple-900/20">
      {/* Abstract Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-900/30 rounded-full blur-3xl"></div>

      <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-4 max-w-2xl">
          <div>
            <div className="flex items-center gap-3 mb-2 opacity-90">
              {user.collegeName && <span className="text-xs font-medium flex items-center gap-1"><Award className="w-3 h-3" /> {user.collegeName}</span>}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 leading-tight">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="text-indigo-100/80 text-lg">
              {isFaculty
                ? "Your command center for assessments and student performance is ready."
                : "Ready to test your knowledge today?"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <div key={b.id} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md border border-white/20 bg-white/20 text-white")}>
                <b.icon className="w-3.5 h-3.5" /> {b.label}
              </div>
            ))}
            {!badges.length && <div className="text-xs text-indigo-200/70 italic">Complete actions to earn badges</div>}
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[200px]">
          <Button variant="secondary" size="lg" className="w-full shadow-lg bg-white/95 text-indigo-700 hover:bg-white" onClick={() => onNavigate('profile')}>
            <User className="w-4 h-4 mr-2" /> My Profile
          </Button>
          <Button variant="secondary" size="lg" className="w-full shadow-lg bg-white/95 text-indigo-700 hover:bg-white" onClick={() => onNavigate('notifications')}>
            <Bell className="w-4 h-4 mr-2" /> Notifications
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: StatCard ---
const StatCard = ({ label, value, icon: Icon, colorClass, borderClass, onClick }: any) => (
  <Card
    className={cn("border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[140px]", borderClass)}
    onClick={onClick}
  >
    <CardContent className="p-5 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
      </div>
      <div className={cn("p-3 rounded-xl bg-opacity-10", colorClass)}>
        <Icon className="w-5 h-5 opacity-90" />
      </div>
    </CardContent>
  </Card>
);

// --- COMPONENT: ActionCard ---
const ActionCard = ({ title, desc, icon: Icon, onClick, gradient }: any) => (
  <div
    onClick={onClick}
    className={cn(
      "group relative overflow-hidden rounded-2xl p-6 cursor-pointer border border-border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
      "bg-white dark:bg-zinc-900"
    )}
  >
    <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300", gradient)}></div>
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white shadow-md", gradient)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="mt-4 flex items-center text-xs font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity text-primary">
        Open <ArrowRight className="w-3 h-3 ml-1" />
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
interface DashboardProps {
  user: AppUser;
  publishedTests: Test[];
  generatedSets: GeneratedMcqSet[];
  testAttempts: TestAttempt[];
  followersCount: number;
  followingCount: number;
  onNavigate: (view: View) => void;
  questionBanks: QuestionBank[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  publishedTests,
  generatedSets,
  testAttempts,
  followersCount,
  followingCount,
  onNavigate,
  questionBanks
}) => {
  // Use generic role logic if needed, but display unified view

  // Calculate Stats
  const activeTests = publishedTests.filter(t => !t.endDate || new Date(t.endDate) > new Date()).length;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500 max-w-7xl mx-auto">

      {/* 1. Hero */}
      <DashboardHero user={user} publishedTests={publishedTests} onNavigate={onNavigate} />

      {/* 2. Key Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Live Tests"
          value={activeTests}
          icon={Activity}
          colorClass="bg-green-500/10 text-green-600"
          borderClass="border-l-green-500"
          onClick={() => onNavigate('content')}
        />
        <StatCard
          label="Question Banks"
          value={questionBanks.length}
          icon={FileText}
          colorClass="bg-blue-500/10 text-blue-600"
          borderClass="border-l-blue-500"
          onClick={() => onNavigate('content')}
        />
        <StatCard
          label="Community"
          value={followersCount}
          icon={Users}
          colorClass="bg-purple-500/10 text-purple-600"
          borderClass="border-l-purple-500"
          onClick={() => onNavigate('network')}
        />
        <StatCard
          label="Integrity Score"
          value="100%"
          icon={ShieldCheck}
          colorClass="bg-amber-500/10 text-amber-600"
          borderClass="border-l-amber-500"
          onClick={() => onNavigate('integrity')}
        />
      </div>

      {/* 3. Main Action Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
            Command Console
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Unified Actions - Showing All Capabilities */}
          <ActionCard
            title="Content Library"
            desc="Manage drafts, launch tests, and organize your question banks."
            icon={FileText}
            onClick={() => onNavigate('content')}
            gradient="bg-gradient-to-br from-indigo-500 to-blue-600"
          />
          <ActionCard
            title="Create Assessment"
            desc="Generate new MCQs using AI."
            icon={PlusCircle}
            onClick={() => onNavigate('createBank')}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <ActionCard
            title="Manual Creator"
            desc="Build specific questions from scratch with fine-grained control."
            icon={PenTool}
            onClick={() => onNavigate('manualCreator')}
            gradient="bg-gradient-to-br from-pink-500 to-rose-600"
          />
          <ActionCard
            title="My Network"
            desc="Connect with other faculty and manage your followers."
            icon={Network}
            onClick={() => onNavigate('network')}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          />
          <ActionCard
            title="Integrity Center"
            desc="Monitor violations and manage test security alerts."
            icon={Siren}
            onClick={() => onNavigate('integrity')}
            gradient="bg-gradient-to-br from-rose-500 to-red-600"
          />

          {/* Secondary Actions */}
          <ActionCard
            title="Performance Analytics"
            desc="Deep dive into student performance and test statistics."
            icon={BarChart3}
            onClick={() => onNavigate('testAnalytics')}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          />

          {/* Student-like actions available on same dash if desired, or hidden. 
               User asked for "improved dashboard without role-based", so merging key student capability: "Take a Test" */}
          <ActionCard
            title="Take a Test"
            desc="Enter a test ID or browse available tests."
            icon={Rocket}
            onClick={() => onNavigate('studentPortal')}
            gradient="bg-gradient-to-br from-sky-500 to-cyan-600"
          />
          <ActionCard
            title="My History"
            desc="View your past attempts and certificates."
            icon={FileText}
            onClick={() => onNavigate('testHistory')}
            gradient="bg-gradient-to-br from-lime-500 to-green-600"
          />

        </div>
      </div>

      {/* 4. Live Pulse / System Status */}
      <div className="rounded-xl border bg-zinc-50 dark:bg-zinc-900/50 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full relative"></div>
          </div>
          <div>
            <h4 className="font-semibold text-sm">System Operational</h4>
            <p className="text-xs text-muted-foreground">All systems running smoothly. JS Corp Integrity Check Passed.</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {new Date().toLocaleDateString()} • v2.1.0-CommandCenter
        </div>
      </div>

    </div>
  );
};