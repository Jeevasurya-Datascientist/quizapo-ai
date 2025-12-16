import React, { useState } from 'react';
import { QuestionBank, Test, CustomFormField, View } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  FileText, Share2, Trash2, PlusCircle, Clock, Calendar, AlertCircle, X, CheckCircle2, Link as LinkIcon, Edit2, History,
  Rocket, StopCircle, BarChart3, MoreVertical, Search
} from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- SUB-COMPONENT: PublishModal ---
interface PublishModalProps {
  questionCount: number;
  onSubmit: (title: string, duration: number, endDate: string | null, studentFieldsMode: 'default' | 'custom', customFields: CustomFormField[], shuffleQuestions: boolean, shuffleOptions: boolean, attemptLimit: number, allowSkip: boolean) => void;
  onClose: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ questionCount, onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [endDate, setEndDate] = useState('');
  const [studentFieldsMode, setStudentFieldsMode] = useState<'default' | 'custom'>('default');
  const [customFields, setCustomFields] = useState<CustomFormField[]>([{ label: '' }]);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [allowSkip, setAllowSkip] = useState(false);
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Test Title is required."); return; }
    if (duration <= 0) { setError("Duration must be positive."); return; }

    if (endDate && new Date(endDate) <= new Date()) {
      setError("Deadline must be in the future.");
      return;
    }

    const finalFields = studentFieldsMode === 'custom' ? customFields.filter(f => f.label.trim() !== '') : [];
    onSubmit(title, duration, endDate || null, studentFieldsMode, finalFields, shuffleQuestions, shuffleOptions, attemptLimit, allowSkip);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-2xl border-primary/20 my-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Launch Test</CardTitle>
            <CardDescription>Configure settings for {questionCount} questions</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Title</label>
              <Input placeholder="e.g. Final Exam - Module 1" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (Minutes)</label>
                <Input type="number" min="1" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Attempt Limit (0 = Unlimited)</label>
                <Input type="number" min="0" value={attemptLimit} onChange={e => setAttemptLimit(parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Auto-Revoke Deadline</label>
              <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">Test closes automatically after this time.</p>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                  Shuffle Questions
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                  Shuffle Options
                </label>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={allowSkip} onChange={e => setAllowSkip(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                  Allow Skipping Questions
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                <Rocket className="w-4 h-4 mr-2" /> Launch Now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// --- SUB-COMPONENT: BankItem (Draft) ---
const BankDisplayCard: React.FC<{
  bank: QuestionBank;
  onEdit: (id: string) => void;
  onPublish: (id: string, ...args: any[]) => void;
}> = ({ bank, onEdit, onPublish }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-zinc-300 hover:border-l-indigo-500 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 whitespace-nowrap">Draft</Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                <Clock className="w-3 h-3" /> Updated {new Date(bank.updatedAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
            <h3 className="font-bold text-lg text-foreground group-hover:text-indigo-600 transition-colors break-words">
              {bank.title || "Untitled Assessment"}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {bank.description || `${bank.questions.length} questions included.`}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={() => onEdit(bank.id)} className="flex-1 md:flex-none">
              <Edit2 className="w-4 h-4 mr-2 text-zinc-500" /> Edit
            </Button>
            <Button size="sm" onClick={() => setShowModal(true)} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20">
              <Rocket className="w-4 h-4 mr-2" /> Launch Test
            </Button>
          </div>
        </div>
      </CardContent>

      {showModal && (
        <PublishModal
          questionCount={bank.questions.length}
          onClose={() => setShowModal(false)}
          onSubmit={(...args) => {
            onPublish(bank.id, ...args);
            setShowModal(false);
          }}
        />
      )}
    </Card>
  );
};

// --- SUB-COMPONENT: PublishedItem (Live) ---
const PublishedDisplayCard: React.FC<{
  test: Test;
  onRevoke: (id: string) => void;
  onAnalytics: (test: Test) => void;
}> = ({ test, onRevoke, onAnalytics }) => {
  const [copied, setCopied] = useState(false);

  // Autonomous Expiration Check
  const isExpired = test.endDate && new Date(test.endDate) < new Date();

  // Handle Share
  const handleShare = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?testId=${test.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => console.error("Copy failed", err));
  };

  return (
    <Card className={cn(
      "transition-all duration-300 border-l-4 overflow-hidden",
      isExpired ? "opacity-75 border-l-zinc-300 bg-zinc-50/50" : "border-l-green-500 border-t border-r border-b shadow-sm hover:shadow-md"
    )}>
      <CardContent className="p-5 flex flex-col gap-4">

        {/* Top Row: Status & Title */}
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isExpired ? (
                <Badge variant="secondary" className="bg-zinc-100 text-zinc-500">Closed</Badge>
              ) : (
                <Badge className="bg-green-100 text-green-700 border-green-200 animate-pulse hover:bg-green-200">
                  ● Live
                </Badge>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                <FileText className="w-3 h-3" /> {test.questions.length} Qs
              </span>
            </div>
            <h3 className="font-bold text-lg break-words leading-tight">{test.title}</h3>
          </div>

          {/* Action Menu (More Options) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="w-4 h-4 text-muted-foreground" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <LinkIcon className="w-4 h-4 mr-2" /> Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onRevoke(test.id)}>
                <StopCircle className="w-4 h-4 mr-2" /> Stop Test
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Middle Row: Info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{test.durationMinutes} min</span>
          </div>
          {test.endDate && (
            <div className="flex items-center gap-2">
              <Calendar className={cn("w-4 h-4 shrink-0", isExpired ? "text-red-500" : "text-amber-500")} />
              <span className="text-xs sm:text-sm">{isExpired ? "Ended" : "Ends"}: {new Date(test.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Bottom Row: Primary Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            className="flex-1 bg-white border border-zinc-200 text-foreground hover:bg-zinc-50 hover:text-primary w-full"
            onClick={() => onAnalytics(test)}
          >
            <BarChart3 className="w-4 h-4 mr-2 text-indigo-500" /> <span className="truncate">Analytics</span>
          </Button>

          {!isExpired && (
            <Button
              variant="outline"
              className={cn("flex-1 w-full", copied ? "border-green-500 text-green-600 bg-green-50" : "")}
              onClick={handleShare}
            >
              {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Share"}
            </Button>
          )}
        </div>

      </CardContent>
    </Card>
  );
};

// --- MAIN COMPONENT ---

interface ContentLibraryProps {
  questionBanks: QuestionBank[];
  publishedTests: Test[];
  onPublishTest: (id: string, ...args: any[]) => void;
  onRevokeTest: (id: string) => void;
  onViewTestAnalytics: (test: Test) => void;
  onNavigate: (view: View) => void;
  onEditBank: (id: string) => void;
}

export const ContentLibrary: React.FC<ContentLibraryProps> = ({
  questionBanks = [],
  publishedTests,
  onPublishTest,
  onRevokeTest,
  onViewTestAnalytics,
  onNavigate,
  onEditBank
}) => {
  const [activeTab, setActiveTab] = useState<'drafts' | 'published'>('drafts');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering
  const filteredBanks = questionBanks.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTests = publishedTests.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-6xl mx-auto px-1 sm:px-0">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your assessments and monitor live tests.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={() => onNavigate('testHistory')} className="border-zinc-200 flex-1 md:flex-none">
            <History className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Recent Activity</span><span className="inline sm:hidden">History</span>
          </Button>
          <Button onClick={() => onNavigate('createBank')} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/20 text-white border-0 flex-1 md:flex-none">
            <PlusCircle className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Create New Assessment</span><span className="inline sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Controls & Tabs */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800">

        {/* Tab Switcher */}
        <div className="flex p-1 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm w-full md:w-auto">
          <button
            onClick={() => setActiveTab('drafts')}
            className={cn(
              "flex-1 md:flex-none px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
              activeTab === 'drafts'
                ? "bg-zinc-100 dark:bg-zinc-800 text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900"
            )}
          >
            <FileText className="w-4 h-4" /> Drafts <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5 bg-zinc-200 dark:bg-zinc-700">{questionBanks.length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={cn(
              "flex-1 md:flex-none px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
              activeTab === 'published'
                ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700"
                : "text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900"
            )}
          >
            <Rocket className="w-4 h-4" /> Live Tests <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5 bg-zinc-200 dark:bg-zinc-700">{publishedTests.length}</Badge>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 bg-white dark:bg-zinc-950"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'drafts' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {filteredBanks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredBanks
                  .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
                  .map(bank => (
                    <BankDisplayCard
                      key={bank.id}
                      bank={bank}
                      onEdit={onEditBank}
                      onPublish={onPublishTest}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No Drafts Found"
                desc={searchQuery ? "Try adjusting your search terms." : "You haven't created any assessments yet."}
                action={!searchQuery ? () => onNavigate('createBank') : undefined}
                actionLabel="Create First Assessment"
              />
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {filteredTests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTests
                  .sort((a, b) => new Date(b.endDate || 0).getTime() - new Date(a.endDate || 0).getTime()) // Sort by deadline roughly
                  .map(test => (
                    <PublishedDisplayCard
                      key={test.id}
                      test={test}
                      onRevoke={onRevokeTest}
                      onAnalytics={onViewTestAnalytics}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState
                icon={Rocket}
                title="No Live Tests"
                desc={searchQuery ? "No matching tests found." : "Launch a test from your Drafts to see it here."}
              />
            )}
          </div>
        )}
      </div>

    </div>
  );
};

// Helper for empty states
const EmptyState = ({ icon: Icon, title, desc, action, actionLabel }: any) => (
  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 text-center animate-in zoom-in-95">
    <div className="p-4 bg-white dark:bg-zinc-800 rounded-full mb-4 shadow-sm">
      <Icon className="w-8 h-8 text-zinc-400" />
    </div>
    <h4 className="font-bold text-lg text-foreground mb-2">{title}</h4>
    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">{desc}</p>
    {action && (
      <Button onClick={action} variant="outline" className="border-primary/20 text-primary hover:bg-primary/5">
        {actionLabel}
      </Button>
    )}
  </div>
);