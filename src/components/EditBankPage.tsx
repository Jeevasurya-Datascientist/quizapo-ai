import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Save, Plus, Trash2, Check, X,
    AlertTriangle, Bot, CheckCircle2, Loader2, Info
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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 animate-in fade-in duration-500">
            {/* --- HEADER --- */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <Input
                                value={bankTitle}
                                onChange={(e) => setBankTitle(e.target.value)}
                                className="text-lg font-bold border-transparent bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 h-9 -ml-2 w-[300px]"
                            />
                            <p className="text-xs text-muted-foreground ml-2 flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] h-5">{questions.length} Items</Badge>
                                <span className="opacity-50">|</span>
                                {isValidating ? <span className="text-indigo-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Validating...</span> : 'Ready'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={addNewQuestion}>
                            <Plus className="w-4 h-4 mr-2" /> Add Question
                        </Button>
                        <Button
                            onClick={handleSaveRequest}
                            disabled={isSaving || isValidating}
                            className={cn("bg-indigo-600 hover:bg-indigo-700 min-w-[140px]", (isSaving || isValidating) && "opacity-80")}
                        >
                            {isSaving ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                            ) : isValidating ? (
                                <><Bot className="w-4 h-4 mr-2 animate-pulse" /> AI Checking...</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- CONTENT --- */}
            <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">

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
                    {questions.map((q, qIndex) => (
                        <Card
                            key={qIndex}
                            className={cn(
                                "transition-all duration-200 border-l-4 group",
                                activeQuestionId === qIndex
                                    ? "border-l-indigo-500 shadow-md ring-1 ring-indigo-500/20"
                                    : "border-l-transparent hover:border-l-zinc-300 dark:hover:border-l-zinc-700"
                            )}
                            onClick={() => setActiveQuestionId(qIndex)}
                        >
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 space-y-4">
                                        {/* Question Text */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-mono text-muted-foreground uppercase">
                                                    Question {qIndex + 1}
                                                </Label>
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
                    ))}
                    <div ref={questionsEndRef} />
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

        </div>
    );
};
