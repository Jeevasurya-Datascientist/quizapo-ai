// src/components/TestAnalytics.tsx

import React, { useMemo } from 'react';
import type { Test, TestAttempt } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  ArrowLeft, Download, Users, Trophy, Percent,
  AlertTriangle, MessageSquare, CheckCircle, BarChart3, TrendingUp
} from 'lucide-react';

interface TestAnalyticsProps {
  test: Test;
  attempts: TestAttempt[];
  onBack: () => void;
  onMessageStudent: (studentUsername: string) => void;
}

// --- HELPER: ROBUST DATE PARSER ---
const formatDate = (dateInput: any): string => {
  if (!dateInput) return 'N/A';
  try {
    if (typeof dateInput === 'object' && 'seconds' in dateInput) {
      return new Date(dateInput.seconds * 1000).toLocaleString();
    }
    return new Date(dateInput).toLocaleString();
  } catch (e) {
    return 'Invalid Date';
  }
};

export const TestAnalytics: React.FC<TestAnalyticsProps> = ({ test, attempts, onBack, onMessageStudent }) => {

  const stats = useMemo(() => {
    if (!attempts || attempts.length === 0) return { avg: 0, high: 0, pass: 0 };
    const totalScore = attempts.reduce((acc, curr) => acc + curr.score, 0);
    const maxScore = Math.max(...attempts.map(a => a.score));
    const passCount = attempts.filter(a => (a.score / a.totalQuestions) >= 0.4).length;
    return { avg: (totalScore / attempts.length).toFixed(1), high: maxScore, pass: passCount };
  }, [attempts]);

  const isCustomMode = test.studentFieldsMode === 'custom';
  const extraHeaders = isCustomMode ? test.customStudentFields.map(f => f.label) : ['Branch', 'Section'];

  const handleExportCSV = () => {
    if (!attempts.length) { alert("No data."); return; }
    const headers = ["Reg ID", "Name", ...extraHeaders, "Score", "Total", "Date"];
    const rows = attempts.map(attempt => {
      const student = attempt.student;
      const extraValues = isCustomMode ? test.customStudentFields.map(f => student.customData?.[f.label] || '-') : [student.branch || '-', student.section || '-'];
      return [student.registrationNumber, student.name, ...extraValues, attempt.score, attempt.totalQuestions, formatDate(attempt.date)].map(f => `"${f}"`).join(',');
    });
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${test.title}_Analytics.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 section-p p-8 rounded-[2rem] border shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-indigo-600" /> Test Analytics
          </h2>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Analysis for <Badge variant="outline" className="text-base px-2 py-0 border-indigo-200 text-indigo-700">{test.title}</Badge>
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={onBack} size="lg"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
          <Button onClick={handleExportCSV} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 opacity-80 mb-1 font-medium">
              <TrendingUp className="w-5 h-5" /> Average Score
            </div>
            <div className="text-5xl font-bold tracking-tight">{stats.avg}</div>
            <div className="text-indigo-100 text-sm mt-1">out of {test.questions.length}</div>
          </div>
          <BarChart3 className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-10" />
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 font-medium mb-1">
            <Trophy className="w-5 h-5 text-amber-500" /> Highest Score
          </div>
          <div className="text-5xl font-bold text-slate-800 dark:text-white">{stats.high}</div>
          <div className="text-slate-400 text-sm mt-1">Top Performer</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 font-medium mb-1">
            <Users className="w-5 h-5 text-blue-500" /> Participants
          </div>
          <div className="text-5xl font-bold text-slate-800 dark:text-white">{attempts.length}</div>
          <div className="text-slate-400 text-sm mt-1">Total Attempts</div>
        </div>
      </div>

      {/* Table Section */}
      <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/80 backdrop-blur">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                {extraHeaders.map((h, i) => <th key={i} className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">{h}</th>)}
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Integrity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {attempts.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{a.student.name}</span>
                      <span className="text-xs text-slate-500 font-mono">{a.student.registrationNumber}</span>
                    </div>
                  </td>
                  {isCustomMode ? test.customStudentFields.map((f, i) => <td key={i} className="px-6 py-4 hidden md:table-cell text-sm text-slate-600">{a.student.customData?.[f.label] || '-'}</td>) : <><td className="px-6 py-4 hidden md:table-cell text-sm text-slate-600">{a.student.branch}</td><td className="px-6 py-4 hidden md:table-cell text-sm text-slate-600">{a.student.section}</td></>}
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={a.score / a.totalQuestions >= 0.4 ? "border-green-200 text-green-700 bg-green-50" : "border-red-200 text-red-700 bg-red-50"}>
                      {a.score} / {a.totalQuestions}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {a.violations > 0 ? (
                      <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded-full w-fit">
                        <AlertTriangle className="w-3.5 h-3.5" /> {a.violations} Violations
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Clean
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-sm hidden lg:table-cell">{formatDate(a.date)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 hover:bg-slate-200 rounded-full"
                      onClick={() => onMessageStudent(a.student.registrationNumber)}
                      title="Send Message"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};