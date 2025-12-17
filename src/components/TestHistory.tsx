// src/components/TestHistory.tsx

import React, { useMemo } from 'react';
import type { TestAttempt } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Calendar, Eye, Award, Trophy, TrendingUp, History } from 'lucide-react';
import { Badge } from './ui/badge';

interface TestHistoryProps {
  history: TestAttempt[];
  onNavigateBack: () => void;
  onViewResult: (attempt: TestAttempt) => void;
  onViewCertificate: (attempt: TestAttempt) => void;
}

// --- HELPER: Handle Firestore Timestamps & Strings ---
const formatDate = (dateInput: any) => {
  if (!dateInput) return 'N/A';
  try {
    if (typeof dateInput === 'object' && 'seconds' in dateInput) {
      return new Date(dateInput.seconds * 1000).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
    return new Date(dateInput).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

export const TestHistory: React.FC<TestHistoryProps> = ({
  history, onNavigateBack, onViewResult, onViewCertificate
}) => {

  // Calculate Stats
  const stats = useMemo(() => {
    if (!history.length) return { avg: 0, best: 0, total: 0 };
    const totalScore = history.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0);
    const maxScore = Math.max(...history.map(h => (h.score / h.totalQuestions) * 100));
    return {
      avg: Math.round(totalScore / history.length),
      best: Math.round(maxScore),
      total: history.length
    };
  }, [history]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Header & Stats */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <History className="w-8 h-8 text-indigo-600" /> Test History
            </h2>
            <p className="text-muted-foreground mt-1">Track your progress and performance over time.</p>
          </div>
          <Button variant="outline" onClick={onNavigateBack} className="hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 opacity-90 mb-2">
              <History className="w-5 h-5" />
              <span className="font-medium">Total Tests</span>
            </div>
            <div className="text-4xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="font-medium">Average Score</span>
            </div>
            <div className="text-4xl font-bold text-slate-800 dark:text-white">{stats.avg}%</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="font-medium">Best Performance</span>
            </div>
            <div className="text-4xl font-bold text-slate-800 dark:text-white">{stats.best}%</div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-medium text-slate-600">No attempts yet</h3>
            <p className="text-slate-500">Take a test to start building your history.</p>
          </div>
        ) : (
          history.map((attempt) => {
            const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
            const isPassed = percentage >= 50;

            return (
              <Card key={attempt.id} className="group hover:shadow-md transition-all duration-200 border-slate-200 hover:border-indigo-200">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {/* Score Circle */}
                  <div className="shrink-0 relative">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 ${isPassed ? 'border-green-100 text-green-700 bg-green-50' : 'border-red-100 text-red-700 bg-red-50'}`}>
                      {percentage}%
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-slate-800 truncate">{attempt.testTitle}</h3>
                      {isPassed && <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Passed</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(attempt.date)}</span>
                      <span>Points: {attempt.score}/{attempt.totalQuestions}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <Button variant="outline" size="sm" onClick={() => onViewResult(attempt)} className="flex-1">
                      <Eye className="w-4 h-4 mr-2" /> Review
                    </Button>
                    {isPassed && (
                      <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => onViewCertificate(attempt)}>
                        <Award className="w-4 h-4 mr-2" /> Certificate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};