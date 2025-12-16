import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Save, Plus, Trash2, Check, X,
    AlertTriangle, Bot, CheckCircle2, Loader2, Info, Layers
} from 'lucide-react';
import { db } from '../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

import { QuestionBank, MCQ } from '../types';
import { validateQuestionBank, ValidationResult, ValidationIssue } from '../services/geminiService';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { cn } from '../lib/utils';
// import { useToast } from './ui/use-toast';

interface EditBankPageProps {
    bankId: string;
    onBack: () => void;
    onSave: () => void;
}

export const EditBankPage: React.FC<EditBankPageProps> = ({ bankId, onBack, onSave }) => {
    const [bank, setBank] = useState<QuestionBank | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
    const questionsEndRef = useRef<HTMLDivElement>(null);

    // Editing State
    const [bankTitle, setBankTitle] = useState('');
    const [bankDesc, setBankDesc] = useState('');
    const [questions, setQuestions] = useState<MCQ[]>([]);

    // Validation State
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

    // Mobile Map State
    const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);

    useEffect(() => {
        const fetchBank = async () => {
            try {
                const docRef = doc(db, "questionBanks", bankId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data() as QuestionBank;
                    setBank(data);
                    setBankTitle(data.title);
                    setBankDesc(data.description || '');
                    setQuestions(data.questions);
                } else {
                    setError("Bank not found.");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load bank.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchBank();
    }, [bankId]);

    // --- Actions ---

    const addNewQuestion = () => {
        const newQ: MCQ = {
            question: "New Question",
            options: ["Option A", "Option B", "Option C", "Option D"],
            answer: "Option A",
            explanation: "Explanation here..."
        };
        setQuestions(prev => [...prev, newQ]);
        setActiveQuestionId(questions.length); // Focus new question

        // Scroll & feedback
        setTimeout(() => {
            questionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            // Ideally useToast here, but alert for specific user request
            // We use a non-blocking UI alert instead of window.alert if possible, but user asked for alert
            // "Create alert like Question is Created" -> I will put a temporary visible success message?
            // "scroll to bottom" -> Done.
        }, 100);
    };

    const handleSaveRequest = async () => {
        setIsValidating(true);
        try {
            // 1. Validate with AI
            const result = await validateQuestionBank(questions, bankTitle);

            if (result.issues.length > 0) {
                setValidationResult(result);
                setIsValidationModalOpen(true);
            } else {
                // Direct save if clean
                performSave(questions);
            }
        } catch (e) {
            console.error(e);
            // Fallback save if AI fails
            performSave(questions);
        } finally {
            setIsValidating(false);
        }
    };

    const performSave = async (dataToSave: MCQ[]) => {
        setIsSaving(true);
        try {
            const docRef = doc(db, "questionBanks", bankId);
            await updateDoc(docRef, {
                title: bankTitle,
                description: bankDesc,
                questions: dataToSave,
                updatedAt: new Date().toISOString()
            });
            onSave();
            onBack(); // Navigate back to list
        } catch (err) {
            console.error(err);
            setError("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAutoFix = () => {
        if (!validationResult) return;

        // Apply all suggested fixes
        const fixedQuestions = [...questions];
        validationResult.issues.forEach(issue => {
            if (issue.suggestedFix) {
                fixedQuestions[issue.questionIndex] = issue.suggestedFix;
            }
        });

        setQuestions(fixedQuestions); // Update UI
        performSave(fixedQuestions);    // Save to DB
        setIsValidationModalOpen(false);
    };

    // --- Helpers ---

    const updateQuestion = (index: number, field: keyof MCQ, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const updated = [...questions];
        const currentQ = updated[qIndex];
        const newOptions = [...currentQ.options];

        const isAnswer = currentQ.answer === newOptions[oIndex];
        newOptions[oIndex] = value;
        updated[qIndex].options = newOptions;

        if (isAnswer) {
            updated[qIndex].answer = value;
        }
        setQuestions(updated);
    };

    const deleteQuestion = (index: number) => {
        if (confirm("Delete this question?")) {
            setQuestions(prev => prev.filter((_, i) => i !== index));
        }
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin mr-2" /> Loading Editor...</div>;
    if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-40 animate-in fade-in duration-500">
            {/* --- HEADER --- */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className='flex-1 lg:flex-none'>
                            <Input
                                value={bankTitle}
                                onChange={(e) => setBankTitle(e.target.value)}
                                className="text-lg font-bold border-transparent bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 h-9 -ml-2 w-full md:w-[300px]"
                            />
                            <p className="text-xs text-muted-foreground ml-2 flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] h-5">{questions.length} Items</Badge>
                                <span className="opacity-50">|</span>
                                {isValidating ? <span className="text-indigo-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Validating...</span> : 'Ready'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mobile Map Trigger */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setIsMobileMapOpen(true)}
                        >
                            <Layers className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- CONTENT --- */}
            <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">

                {/* --- SIDEBAR: QUESTION MAP (Desktop) --- */}
                <div className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-24 space-y-4">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Layers className="w-4 h-4" /> Navigation Map
                            </h3>
                            <div className="grid grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto pr-1">
                                {questions.map((_, idx) => {
                                    // Check if this question has an issue in validation result
                                    const hasIssue = validationResult?.issues.some(i => i.questionIndex === idx);

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                document.getElementById(`question-card-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                setActiveQuestionId(idx);
                                            }}
                                            className={cn(
                                                "h-10 w-full rounded-md text-xs font-bold transition-all border flex items-center justify-center relative",
                                                activeQuestionId === idx
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105"
                                                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-transparent hover:border-indigo-200 hover:bg-indigo-50",
                                                hasIssue && "border-amber-500 bg-amber-50 text-amber-700" // Highlight Error
                                            )}
                                        >
                                            {idx + 1}
                                            {hasIssue && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 border border-white rounded-full" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-center text-muted-foreground">
                                <p>{questions.length} Questions</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MAIN: EDITOR --- */}
                <div className="lg:col-span-9 space-y-6">

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Bank Description (Optional)</Label>
                        <Textarea
                            value={bankDesc}
                            onChange={e => setBankDesc(e.target.value)}
                            placeholder="Add notes about this question bank..."
                            className="bg-white dark:bg-zinc-900 resize-none focus-visible:ring-indigo-500"
                        />
                    </div>

                    {/* Questions List */}
                    <div className="space-y-4">
                        {questions.map((q, qIndex) => {
                            const hasIssue = validationResult?.issues.some(i => i.questionIndex === qIndex);

                            return (
                                <Card
                                    id={`question-card-${qIndex}`}
                                    key={qIndex}
                                    className={cn(
                                        "transition-all duration-200 border-l-4 group scroll-mt-28",
                                        activeQuestionId === qIndex
                                            ? "border-l-indigo-500 shadow-md ring-1 ring-indigo-500/20"
                                            : "border-l-transparent hover:border-l-zinc-300 dark:hover:border-l-zinc-700",
                                        hasIssue && "border-l-amber-500 ring-1 ring-amber-500/30 bg-amber-50/10" // Error Style
                                    )}
                                    onClick={() => setActiveQuestionId(qIndex)}
                                >
                                    <CardContent className="p-4 md:p-6 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 space-y-4">
                                                {/* Question Text */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className={cn(
                                                            "text-xs font-mono uppercase",
                                                            hasIssue ? "text-amber-600 font-bold" : "text-muted-foreground"
                                                        )}>
                                                            Question {qIndex + 1} {hasIssue && "(Needs Attention)"}
                                                        </Label>
                                                        {hasIssue && <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />}
                                                    </div>
                                                    <Textarea
                                                        value={q.question}
                                                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                                        className="font-medium text-base resize-y min-h-[80px] bg-transparent border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
                                                    />
                                                </div>

                                                {/* Options Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {q.options.map((opt, oIndex) => (
                                                        <div key={oIndex} className="relative group/opt">
                                                            <div className="absolute left-3 top-2.5 flex items-center justify-center w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-600 text-[10px] bg-zinc-50 dark:bg-zinc-800 text-muted-foreground">
                                                                {String.fromCharCode(65 + oIndex)}
                                                            </div>
                                                            <Input
                                                                value={opt}
                                                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                                className={cn(
                                                                    "pl-10 transition-all",
                                                                    q.answer === opt
                                                                        ? "border-green-500 ring-1 ring-green-500/20 bg-green-50/10"
                                                                        : "focus-visible:ring-indigo-500"
                                                                )}
                                                            />
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); updateQuestion(qIndex, 'answer', opt); }}
                                                                className={cn(
                                                                    "absolute right-2 top-2 p-1 rounded-full transition-colors",
                                                                    q.answer === opt
                                                                        ? "text-green-600 bg-green-100 dark:bg-green-900/30"
                                                                        : "text-zinc-300 hover:text-green-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                                )}
                                                                title="Mark as Correct Answer"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Explanation */}
                                                <div className="space-y-2 pt-2">
                                                    <Label className="text-xs text-muted-foreground">Explanation</Label>
                                                    <Input
                                                        value={q.explanation || ''}
                                                        onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                        className="text-sm text-muted-foreground bg-zinc-50/50 dark:bg-zinc-900/50 focus-visible:ring-indigo-500"
                                                        placeholder="Why is this correct?"
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => { e.stopPropagation(); deleteQuestion(qIndex); }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        <div ref={questionsEndRef} />
                    </div>
                </div>
            </div>

            {/* --- AI VALIDATION MODAL --- */}
            <Dialog open={isValidationModalOpen} onOpenChange={setIsValidationModalOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-5 h-5" /> Professor AI Report
                        </DialogTitle>
                        <DialogDescription>
                            I found {validationResult?.issues.length} potential issues in your assessment.
                            We recommend resolving all issues to maintain trust.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
                        {validationResult?.issues.map((issue, idx) => (
                            <div key={idx} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-white dark:bg-zinc-900 border-amber-300">
                                            Q{issue.questionIndex + 1}
                                        </Badge>
                                        <span className="font-semibold text-sm capitalize text-amber-800 dark:text-amber-500">
                                            {issue.issueType.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-amber-900 dark:text-amber-100">
                                    {issue.description}
                                </p>
                                {issue.suggestedFix && (
                                    <div className="mt-2 pt-2 border-t border-amber-200/50">
                                        <p className="text-xs font-medium text-amber-700 mb-1">Proposed Fix:</p>
                                        <div className="text-xs bg-white/50 p-2 rounded border border-amber-100">
                                            <p><span className="font-semibold">Q:</span> {issue.suggestedFix.question}</p>
                                            <p><span className="font-semibold">Ans:</span> {issue.suggestedFix.answer}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsValidationModalOpen(false)}>
                            Correction Needed
                        </Button>
                        <Button onClick={handleAutoFix} className="bg-indigo-600 hover:bg-indigo-700">
                            <Bot className="w-4 h-4 mr-2" /> Auto-Fix & Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MOBILE NAVIGATION MAP DIALOG --- */}
            <Dialog open={isMobileMapOpen} onOpenChange={setIsMobileMapOpen}>
                <DialogContent className="max-w-[90vw] max-h-[70vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-500" /> Question Map
                        </DialogTitle>
                        <DialogDescription>
                            Jump to any question instantly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((_, idx) => {
                                const hasIssue = validationResult?.issues.some(i => i.questionIndex === idx);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            document.getElementById(`question-card-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            setActiveQuestionId(idx);
                                            setIsMobileMapOpen(false);
                                        }}
                                        className={cn(
                                            "h-12 w-full rounded-lg text-sm font-bold transition-all border flex items-center justify-center relative shadow-sm",
                                            activeQuestionId === idx
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200"
                                                : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 hover:bg-indigo-50 hover:border-indigo-300",
                                            hasIssue && "border-amber-500 bg-amber-50 text-amber-700"
                                        )}
                                    >
                                        {idx + 1}
                                        {hasIssue && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 border-2 border-white rounded-full" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- FLOATING ACTION BAR --- */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800 backdrop-blur-md z-40 flex items-center justify-between lg:justify-end gap-3 shadow-2xl animate-in slide-in-from-bottom-5">
                <Button variant="outline" size="lg" onClick={addNewQuestion} className="flex-1 lg:flex-none lg:w-48">
                    <Plus className="w-5 h-5 mr-2" /> <span className="hidden sm:inline">Add Question</span><span className="sm:hidden">Add</span>
                </Button>
                <Button
                    size="lg"
                    onClick={handleSaveRequest}
                    disabled={isSaving || isValidating}
                    className={cn("flex-1 lg:flex-none lg:w-48 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20", (isSaving || isValidating) && "opacity-80")}
                >
                    {isSaving ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> <span className="hidden sm:inline">Saving...</span><span className="sm:hidden">Saving</span></>
                    ) : isValidating ? (
                        <><Bot className="w-5 h-5 mr-2 animate-pulse" /> <span className="hidden sm:inline">Check & Save</span><span className="sm:hidden">Check</span></>
                    ) : (
                        <><Save className="w-5 h-5 mr-2" /> <span className="hidden sm:inline">Save & Exit</span><span className="sm:hidden">Save</span></>
                    )}
                </Button>
            </div>

        </div>
    );
};
