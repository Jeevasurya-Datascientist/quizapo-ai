// src/components/TestPage.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Clock,
  AlertTriangle,
  Flag,
  Menu,
  X,
  Maximize2,
  ShieldAlert,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import type { Test, Student, MCQ } from '../types';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface TestPageProps {
  test: Test;
  student: Student;
  // UPDATED: Now accepts the shuffled questions list for storage
  onFinish: (answers: (string | null)[], violations: number, usedQuestions: MCQ[]) => void;
}

const VIOLATION_LIMIT = 5;

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const TestPage: React.FC<TestPageProps> = ({ test, student, onFinish }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(() => Array(test.questions.length).fill(null));
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(test.durationMinutes * 60);
  const [violations, setViolations] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store the shuffled version of questions for this session
  const [processedQuestions, setProcessedQuestions] = useState<MCQ[]>([]);

  // Init Shuffle (Run once on mount/test change)
  useEffect(() => {
    let qs = [...test.questions];
    if (test.shuffleQuestions) qs = shuffleArray(qs);
    if (test.shuffleOptions) {
      qs = qs.map(q => ({ ...q, options: shuffleArray(q.options) }));
    }
    setProcessedQuestions(qs);
  }, [test]);

  const onFinishRef = useRef(onFinish);
  const stateRef = useRef({ violations, answers, processedQuestions });

  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);
  useEffect(() => {
    stateRef.current = { violations, answers, processedQuestions };
  }, [violations, answers, processedQuestions]);

  const goToNext = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.min(processedQuestions.length - 1, prev + 1));
  }, [processedQuestions.length]);

  const goToPrev = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const endTest = useCallback(() => {
    if (isSubmitting) return;

    if (test.allowSkip === false) {
      const hasUnanswered = stateRef.current.answers.some(a => a === null);
      if (hasUnanswered) {
        alert("Skipping is disabled. You must answer all questions to submit.");
        return;
      }
    }

    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });

    setIsSubmitting(true);

    onFinishRef.current(
      stateRef.current.answers,
      stateRef.current.violations,
      stateRef.current.processedQuestions
    );
  }, [test.allowSkip, isSubmitting]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullScreen || showViolationModal || !hasStarted) return;

      switch (e.key) {
        case 'ArrowRight': goToNext(); break;
        case 'ArrowLeft': goToPrev(); break;
        case 'Enter':
          if (currentQuestionIndex < processedQuestions.length - 1) goToNext();
          else if (confirm("Submit test?")) endTest();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, showViolationModal, hasStarted, goToNext, goToPrev, currentQuestionIndex, processedQuestions.length, endTest]);

  const triggerViolation = useCallback(() => {
    setViolations(prev => {
      const newCount = prev + 1;
      setAnswers(Array(test.questions.length).fill(null)); // Clear answers penalty

      if (newCount >= VIOLATION_LIMIT) {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
        if (!isSubmitting) {
          setIsSubmitting(true);
          onFinishRef.current(
            Array(test.questions.length).fill(null),
            newCount,
            stateRef.current.processedQuestions
          );
        }
      } else {
        setShowViolationModal(true);
      }
      return newCount;
    });
  }, [test.questions.length, isSubmitting]);

  useEffect(() => {
    if (!hasStarted) return;

    const handleFullScreenChange = () => {
      const isFull = document.fullscreenElement != null;
      setIsFullScreen(isFull);
      if (!isFull && stateRef.current.violations < VIOLATION_LIMIT) {
        triggerViolation();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && stateRef.current.violations < VIOLATION_LIMIT) {
        triggerViolation();
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerViolation, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    if (timeLeft <= 0) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
      if (!isSubmitting) {
        setIsSubmitting(true);
        onFinishRef.current(stateRef.current.answers, stateRef.current.violations, stateRef.current.processedQuestions);
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, hasStarted]);

  const handleAnswerSelect = (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = option;
    setAnswers(newAnswers);
  };

  const toggleMarkReview = () => {
    setMarkedForReview(prev => prev.includes(currentQuestionIndex) ? prev.filter(i => i !== currentQuestionIndex) : [...prev, currentQuestionIndex]);
  };

  const navigateTo = (index: number) => {
    setCurrentQuestionIndex(index);
    if (window.innerWidth < 1024) setIsPaletteOpen(false); // Mobile Only
  };

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const progressPercentage = Math.round((answers.filter(a => a !== null).length / processedQuestions.length) * 100);
  const isCriticalTime = timeLeft < 300; // 5 mins

  if (processedQuestions.length === 0) return <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-medium text-zinc-500">Initializing Exam Protocol...</div>;

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 z-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">{test.title}</h1>
            <p className="opacity-90">Please review the instructions carefully before beginning.</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Timed Assessment</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Time Limit: <strong>{test.durationMinutes} Minutes</strong></p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{processedQuestions.length} Questions</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {test.allowSkip === false ? "Cannot skip questions" : "You can navigate freely"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 md:col-span-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Anti-Cheating Protocol Enabled</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Do not switch tabs, exit fullscreen, or minimize the window.
                    <span className="block mt-1 font-medium text-red-600 dark:text-red-400">A strict violation penalty ({VIOLATION_LIMIT} attempts) is active.</span>
                  </p>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full text-lg h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.01] transition-transform shadow-lg"
              onClick={() => {
                document.documentElement.requestFullscreen().then(() => {
                  setHasStarted(true);
                }).catch(() => alert("Fullscreen permission is required to start this secure test."));
              }}
            >
              Enter Fullscreen & Begin Test <ChevronRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-xs text-center text-zinc-400">
              By clicking above, you agree to the academic integrity policy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Violation Screen (Fullscreen Lost)
  if (!isFullScreen && violations < VIOLATION_LIMIT && !showViolationModal) {
    return (
      <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-300">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
          <Maximize2 className="w-20 h-20 text-white relative z-10" />
        </div>

        <div className="max-w-md space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">Focus Mode Required</h2>
          <p className="text-zinc-400 text-lg">
            This is a secure testing environment. You must remain in fullscreen mode to proceed.
          </p>
        </div>

        <Button
          size="lg"
          className="bg-white text-black hover:bg-zinc-200 h-12 px-8 text-base font-semibold transition-transform hover:scale-105"
          onClick={() => document.documentElement.requestFullscreen().catch(() => { })}
        >
          Return to Test
        </Button>
      </div>
    );
  }

  const currentQ = processedQuestions[currentQuestionIndex];
  const isMarked = markedForReview.includes(currentQuestionIndex);

  return (
    <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col z-40 select-none font-sans text-zinc-900 dark:text-zinc-100">

      {/* 1. Header */}
      <header className="h-16 px-4 md:px-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <Button variant="ghost" size="icon" onClick={() => setIsPaletteOpen(true)} className="lg:hidden text-zinc-500">
            <Menu className="w-6 h-6" />
          </Button>

          <div className="hidden sm:block">
            <h1 className="font-bold text-base md:text-lg leading-tight truncate max-w-[250px]">{test.title}</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Recording for {student.name}
            </div>
          </div>
        </div>

        {/* Center: Timer */}
        <div className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold text-sm shadow-sm border transition-colors duration-500",
          isCriticalTime ? "bg-red-50 text-red-600 border-red-200" : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
        )}>
          <Clock className={cn("w-4 h-4", isCriticalTime && "animate-pulse")} />
          {formattedTime}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-1">Completion</span>
            <div className="w-24 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={cn("hidden sm:flex items-center gap-2 border transition-colors", isMarked ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100" : "text-zinc-500 border-zinc-200 dark:border-zinc-800")}
            onClick={toggleMarkReview}
          >
            <Flag className={cn("w-4 h-4", isMarked && "fill-current")} />
            {isMarked ? "Marked" : "Review"}
          </Button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-md border border-red-100 dark:border-red-900/50" title="Violations Detected">
            <AlertCircle className="w-4 h-4" />
            <span>{violations}/{VIOLATION_LIMIT}</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Question Area */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-4xl mx-auto w-full min-h-full p-4 md:p-8 flex flex-col justify-center">

            {/* Question Card */}
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-zinc-500 border-zinc-200 dark:border-zinc-700 font-normal">
                    Question {currentQuestionIndex + 1} of {processedQuestions.length}
                  </Badge>
                  {/* Mobile Mark Button */}
                  <Button variant="ghost" size="icon" onClick={toggleMarkReview} className={cn("sm:hidden", isMarked ? "text-orange-500" : "text-zinc-400")}>
                    <Flag className={cn("w-5 h-5", isMarked && "fill-current")} />
                  </Button>
                </div>

                <h2 className="text-xl md:text-2xl lg:text-3xl font-medium leading-normal tracking-tight text-zinc-900 dark:text-zinc-50">
                  {currentQ.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const isSelected = answers[currentQuestionIndex] === option;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleAnswerSelect(option)}
                      className={cn(
                        "group relative flex items-center p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm"
                      )}
                    >
                      {/* Keyboard Hint */}
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mr-4 transition-all duration-200",
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md scale-110"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </div>

                      <span className={cn("text-base md:text-lg flex-1", isSelected ? "font-medium text-indigo-900 dark:text-indigo-100" : "text-zinc-700 dark:text-zinc-300")}>
                        {option}
                      </span>

                      {/* Checkmark */}
                      {isSelected && (
                        <div className="absolute right-4 text-indigo-600 animate-in zoom-in spin-in-12 duration-300">
                          <CheckCircle2 className="w-6 h-6 fill-current text-white stroke-indigo-600" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Navigation Footer (within Main for flow) */}
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="outline"
                onClick={goToPrev}
                disabled={currentQuestionIndex === 0}
                className="gap-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>

              <Button
                onClick={currentQuestionIndex === processedQuestions.length - 1 ? endTest : goToNext}
                className={cn(
                  "gap-2 px-8 shadow-lg transition-all hover:scale-105 active:scale-95",
                  currentQuestionIndex === processedQuestions.length - 1
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/20"
                    : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-zinc-500/20"
                )}
              >
                {currentQuestionIndex === processedQuestions.length - 1 ? "Submit Exam" : "Next Question"}
                {currentQuestionIndex !== processedQuestions.length - 1 && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </main>

        {/* 3. Sidebar Palette */}
        <aside className={cn(
          "fixed inset-y-0 right-0 w-80 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 z-50 flex flex-col shadow-2xl lg:shadow-none",
          "lg:relative lg:translate-x-0 lg:w-72 xl:w-80",
          isPaletteOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Menu className="w-4 h-4 text-zinc-500" /> Question Map
            </span>
            <Button variant="ghost" size="icon" onClick={() => setIsPaletteOpen(false)} className="lg:hidden">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Legend */}
          <div className="p-4 grid grid-cols-2 gap-2 text-xs border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2 text-zinc-500"><span className="w-3 h-3 rounded-md bg-white border border-zinc-300"></span> Unvisited</div>
            <div className="flex items-center gap-2 text-zinc-500"><span className="w-3 h-3 rounded-md bg-indigo-600"></span> Answered</div>
            <div className="flex items-center gap-2 text-zinc-500"><span className="w-3 h-3 rounded-md bg-orange-100 border border-orange-300"></span> Review</div>
            <div className="flex items-center gap-2 text-zinc-500"><span className="w-3 h-3 rounded-md border-2 border-indigo-600"></span> Current</div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="grid grid-cols-4 gap-3">
              {processedQuestions.map((_, idx) => {
                const isAnswered = answers[idx] !== null;
                const isMarked = markedForReview.includes(idx);
                const isCurrent = currentQuestionIndex === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => navigateTo(idx)}
                    className={cn(
                      "relative w-full aspect-square rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center",
                      isCurrent ? "ring-2 ring-indigo-600 ring-offset-2 z-10" : "", // Focus Ring
                      isAnswered
                        ? "bg-indigo-600 text-white shadow-indigo-500/30 shadow-sm"  // Filled
                        : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-indigo-300",
                      isMarked && !isAnswered && "bg-orange-50 border-orange-300 text-orange-600"
                    )}
                  >
                    {idx + 1}
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border border-white"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
            <Button className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 h-12 text-base shadow-lg" onClick={endTest} disabled={isSubmitting}>
              {isSubmitting ? "Submitting Result..." : "Submit Final Exam"}
            </Button>
            <p className="text-[10px] text-center text-zinc-400 mt-2">
              Please ensure all questions are answered.
            </p>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isPaletteOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsPaletteOpen(false)} />}
      </div>

      {/* 4. Violation Modal */}
      {showViolationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-red-900/90 backdrop-blur-md animate-in fade-in duration-200">
          <Card className="w-full max-w-md border-0 shadow-2xl animate-in zoom-in-95 bg-white dark:bg-zinc-900">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50 dark:ring-red-900/10">
                <ShieldAlert className="w-10 h-10 text-red-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-2">Integrity Violation Detected</h3>
                <p className="text-zinc-500 dark:text-zinc-400">
                  System detected focus loss or fullscreen exit.
                </p>

                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50">
                  <p className="text-xs uppercase tracking-widest font-bold text-red-700 dark:text-red-400 mb-1">Penalty Applied</p>
                  <p className="text-base font-semibold text-red-900 dark:text-red-200">All current answers have been reset.</p>
                </div>

                <p className="text-sm font-medium mt-4 text-zinc-400">Violation {violations} of {VIOLATION_LIMIT}</p>
              </div>

              <Button
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base shadow-red-500/20 shadow-lg"
                onClick={() => { setShowViolationModal(false); document.documentElement.requestFullscreen().catch(() => { }); }}
              >
                I Understand & Return to Test
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};