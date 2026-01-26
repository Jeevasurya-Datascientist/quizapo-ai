// src/components/Dashboard.tsx

import React, { useMemo } from 'react';
import { AppUser, Test, GeneratedMcqSet, TestAttempt, View, QuestionBank, CortexMetrics, PersonalizedPlan, Difficulty } from '../types';
import { Card, CardContent } from './ui/card';
import { analyzePerformance, generatePersonalizedPlan, generateAdaptiveQuiz } from '../services/cortexService';
import { CortexProfile } from './CortexProfile';
import {
  BarChart3,
  Users,
  FileText,
  Activity,
  ArrowRight,
  Bell,
  User,
  ShieldCheck,
  Zap,
  Crown,
  PlusCircle,
  Network,
  Siren,
  PenTool,
  Rocket,
  Compass,
  Award,
  Settings,
  Sparkles
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
}

const getUserBadges = (user: AppUser, publishedTests: Test[]): UserBadge[] => {
  const badges: UserBadge[] = [];
  const followerCount = user.followers?.length || 0;
  const testCount = publishedTests.length;

  if (user.isIdVerified) badges.push({ id: 'trustee', label: 'Verified', icon: ShieldCheck, color: 'text-blue-600 bg-blue-100' });
  if (followerCount >= 50) badges.push({ id: 'influencer', label: 'Influencer', icon: Crown, color: 'text-purple-600 bg-purple-100' });
  if (testCount >= 5) badges.push({ id: 'prolific', label: 'Prolific', icon: Zap, color: 'text-amber-600 bg-amber-100' });

  return badges;
};

// --- COMPONENT: StatPill ---
const StatPill = ({ label, value, icon: Icon, onClick }: any) => (
  <div
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 cursor-pointer hover:bg-white/20 transition-all font-medium min-w-[140px]"
  >
    <div className="p-2 rounded-lg bg-white/20">
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="flex flex-col">
      <span className="text-xl font-bold text-white leading-none">{value}</span>
      <span className="text-xs text-indigo-100 mt-1 opacity-80">{label}</span>
    </div>
  </div>
);

// --- COMPONENT: ActionCard (Bento Style) ---
const ActionCard = ({ title, desc, icon: Icon, onClick, className, delay, color }: any) => (
  <div
    onClick={onClick}
    className={cn(
      "group relative overflow-hidden rounded-3xl p-6 cursor-pointer border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-zinc-900",
      "animate-in fade-in slide-in-from-bottom-4",
      className
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={cn("absolute top-0 right-0 p-3 rounded-bl-2xl bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity", color)}>
      <ArrowRight className="w-5 h-5" />
    </div>

    <div className="flex flex-col h-full justify-between gap-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
        <Icon className="w-6 h-6" />
      </div>

      <div>
        <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{desc}</p>
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
  onStartTest: (test: Test) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  publishedTests,
  generatedSets,
  testAttempts,
  followersCount,
  onNavigate,
  questionBanks,
  onStartTest
}) => {
  const activeTests = publishedTests.filter(t => !t.endDate || new Date(t.endDate) > new Date()).length;
  const badges = useMemo(() => getUserBadges(user, publishedTests), [user, publishedTests]);

  // --- Cortex AI Logic ---
  const [cortexMetrics, setCortexMetrics] = React.useState<CortexMetrics | undefined>();
  const [personalPlan, setPersonalPlan] = React.useState<PersonalizedPlan | undefined>();
  const [isGeneratingReview, setIsGeneratingReview] = React.useState(false);

  React.useEffect(() => {
    if (testAttempts.length > 0) {
      const m = analyzePerformance(testAttempts);
      setCortexMetrics(m);
      setPersonalPlan(generatePersonalizedPlan(m));
    } else {
      const empty: CortexMetrics = { strongTopics: [], weakTopics: [], topicMap: {}, learningTrend: 'stable', recommendedDifficulty: Difficulty.Medium };
      setCortexMetrics(empty);
      setPersonalPlan(generatePersonalizedPlan(empty));
    }
  }, [testAttempts]);

  const handleStartAdaptiveReview = async () => {
    if (!cortexMetrics || !user) return;
    setIsGeneratingReview(true);
    try {
      const mcqs = await generateAdaptiveQuiz(user.id, cortexMetrics);
      const pseudoTest: Test = {
        id: 'adaptive-' + Date.now(),
        facultyId: 'ai-cortex',
        title: `Adaptive Review: ${cortexMetrics.weakTopics[0] || 'General'}`,
        durationMinutes: 15,
        questions: mcqs,
        studentFieldsMode: 'default', customStudentFields: [], endDate: null,
        shuffleQuestions: true, attemptLimit: 1
      };
      onStartTest(pseudoTest);
    } catch (e: any) {
      alert("Failed to generate personalized review: " + e.message);
    } finally {
      setIsGeneratingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/20 space-y-8 pb-20">

      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden rounded-b-[3rem] bg-zinc-900 text-white shadow-2xl pb-16 pt-8 px-6 md:px-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 opacity-90"></div>
        {/* Animated Orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/10 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              System Live
            </div>
            <div className="flex gap-3">
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full" onClick={() => onNavigate('notifications')}>
                <Bell className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full" onClick={() => onNavigate('profile')}>
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-sky-300">{user.name.split(' ')[0]}</span>
              </h1>
              <p className="text-indigo-100 text-lg md:text-xl max-w-2xl font-light">
                Your command center is ready. You have <strong className="text-white">{activeTests} active tests</strong> scheduled for today.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {badges.map(b => (
                  <Badge key={b.id} variant="secondary" className="gap-1 bg-white/10 hover:bg-white/20 text-white border-none">
                    <b.icon className="w-3 h-3" /> {b.label}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-indigo-200 border-indigo-400/30">Faculty Access</Badge>
              </div>
            </div>

            {/* Hero Stats */}
            <div className="flex gap-4">
              <StatPill label="Active Tests" value={activeTests} icon={Activity} onClick={() => onNavigate('content')} />
              <StatPill label="Followers" value={followersCount} icon={Users} onClick={() => onNavigate('network')} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN GRID */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-20">

        {/* Adaptive Learning / Cortex AI Highlight */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CortexProfile metrics={cortexMetrics} plan={personalPlan} onStartReview={handleStartAdaptiveReview} isLoading={isGeneratingReview} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* COLUMN 1: Creation & Management */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">create</h3>
            <div className="grid gap-4">
              <ActionCard
                title="Generate Assessment"
                desc="Use AI to create comprehensive tests in seconds."
                icon={Sparkles}
                onClick={() => onNavigate('createBank')}
                color="bg-indigo-600"
                delay={100}
              />
              <ActionCard
                title="Manual Builder"
                desc="Design specific questions from scratch."
                icon={PenTool}
                onClick={() => onNavigate('manualCreator')}
                color="bg-violet-600"
                delay={200}
              />
              <ActionCard
                title="Content Library"
                desc="Manage your question banks and drafts."
                icon={FileText}
                onClick={() => onNavigate('content')}
                color="bg-slate-800"
                delay={300}
              />
            </div>
          </div>

          {/* COLUMN 2: Performance & Network */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Analyze</h3>
            <div className="grid gap-4">
              <ActionCard
                title="Performance Analytics"
                desc="Deep dive into student results and insights."
                icon={BarChart3}
                onClick={() => onNavigate('testAnalytics')}
                color="bg-emerald-600"
                delay={400}
                className="md:h-48" // Taller card
              />
              <div className="grid grid-cols-2 gap-4">
                <ActionCard
                  title="Integrity"
                  desc="Monitor Violations"
                  icon={Siren}
                  onClick={() => onNavigate('integrity')}
                  color="bg-rose-600"
                  delay={500}
                />
                <ActionCard
                  title="Network"
                  desc="Connections"
                  icon={Network}
                  onClick={() => onNavigate('network')}
                  color="bg-sky-600"
                  delay={600}
                />
              </div>
            </div>
          </div>

          {/* COLUMN 3: Growth & Career */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Grow</h3>
            <div className="grid gap-4">
              <div
                onClick={() => onNavigate('career')}
                className="group relative h-48 rounded-3xl p-6 cursor-pointer overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02]"
              >
                <div className="absolute right-0 top-0 p-3 opacity-20"><Compass className="w-24 h-24 rotate-12" /></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Rocket className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Career Center</h3>
                    <p className="text-indigo-100 text-sm mt-1">Map your skills to industry roles</p>
                  </div>
                </div>
              </div>

              <ActionCard
                title="My History"
                desc="View past attempts and certificates."
                icon={Award}
                onClick={() => onNavigate('testHistory')}
                color="bg-amber-500"
                delay={700}
              />
              <ActionCard
                title="Take a Test"
                desc="Browser public tests."
                icon={Rocket}
                onClick={() => onNavigate('studentPortal')}
                color="bg-cyan-600"
                delay={800}
              />
            </div>
          </div>

        </div>
      </div>
    </div >
  );
};