import React, { useState } from 'react';
import type { MCQ } from '../types';
import {
  Plus, Trash2, Copy, Save, FileText, Download, Wand2,
  Sparkles, Check, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { assistWithQuestion } from '../services/geminiService'; // Ensure this matches export
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';

interface ManualMcqCreatorProps {
  onSaveSet: (mcqs: MCQ[]) => void;
  onExportPDF: (mcqs: MCQ[]) => void;
  onExportWord: (mcqs: MCQ[]) => void;
}

const emptyMCQ: MCQ = {
  question: '',
  options: ['', '', '', ''],
  answer: '',
  explanation: '',
};

export const ManualMcqCreator: React.FC<ManualMcqCreatorProps> = ({ onSaveSet, onExportPDF, onExportWord }) => {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null); // Index based
  const [currentMcq, setCurrentMcq] = useState<MCQ>(emptyMCQ); // Editing state
  const [topicContext, setTopicContext] = useState(''); // For AI context
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { toast } = useToast();

  // --- CRUD Operations ---

  const handleCreateNew = () => {
    // If unsaved changes in current, maybe warn? For now, we just switch.
    const newIdx = mcqs.length;
    const newItem = { ...emptyMCQ };
    setMcqs(prev => [...prev, newItem]);
    setSelectedId(newIdx);
    setCurrentMcq(newItem);
  };

  const handleSelect = (index: number) => {
    // Save previous if valid? Or just auto-save current state to list?
    // Let's Auto-Save current modifications to the list before switching
    if (selectedId !== null) {
      updateList(selectedId, currentMcq);
    }

    setSelectedId(index);
    setCurrentMcq({ ...mcqs[index] });
  };

  const updateList = (index: number, item: MCQ) => {
    setMcqs(prev => {
      const next = [...prev];
      next[index] = item;
      return next;
    });
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newMcqs = mcqs.filter((_, i) => i !== index);
    setMcqs(newMcqs);
    if (selectedId === index) {
      setSelectedId(null);
      setCurrentMcq(emptyMCQ);
    } else if (selectedId !== null && selectedId > index) {
      setSelectedId(selectedId - 1);
    }
    toast('Question deleted', 'info');
  };

  const handleDuplicate = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = mcqs[index];
    setMcqs(prev => [...prev, { ...item }]);
    toast('Question duplicated', 'success');
  };

  // --- Editor Handlers ---

  const handleChange = (field: keyof MCQ, value: any) => {
    setCurrentMcq(prev => ({ ...prev, [field]: value }));
    // Real-time sync to list (optional, but good for preview)
    if (selectedId !== null) {
      // Debounce this if performance issues arise
      updateList(selectedId, { ...currentMcq, [field]: value });
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOptions = [...currentMcq.options];
    newOptions[idx] = val;

    // Check if we modified the correct answer text
    let newAnswer = currentMcq.answer;
    if (currentMcq.answer === currentMcq.options[idx]) {
      newAnswer = val; // Update answer text tracking
    }

    handleChange('options', newOptions);
    if (newAnswer !== currentMcq.answer) handleChange('answer', newAnswer);
  };

  const setCorrectAnswer = (idx: number) => {
    handleChange('answer', currentMcq.options[idx]);
  };

  // --- AI Helpers ---

  const handleAiAssist = async (action: 'improve' | 'generate_options' | 'fix_grammar') => {
    if (!topicContext && action !== 'fix_grammar') {
      toast("Please enter a Topic Context above for AI.", "error");
      return;
    }
    if (!currentMcq.question) {
      toast("Enter a question first.", "error");
      return;
    }

    setIsAiLoading(true);
    try {
      const improved = await assistWithQuestion(currentMcq, action, topicContext);
      setCurrentMcq(improved);
      if (selectedId !== null) updateList(selectedId, improved);
      toast("AI updated the question!", "success");
    } catch (e: any) {
      console.error(e);
      toast("AI Failed: " + e.message, "error");
    } finally {
      setIsAiLoading(false);
    }
  };


  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">

      {/* LEFT: Sidebar List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Questions ({mcqs.length})</h3>
          <button onClick={handleCreateNew} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {mcqs.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No questions yet.</p>
              <button onClick={handleCreateNew} className="text-blue-500 mt-2 text-sm hover:underline">Create one</button>
            </div>
          )}

          {mcqs.map((q, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(idx)}
              className={cn(
                "group p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm relative",
                selectedId === idx
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                  : "bg-white border-transparent hover:border-gray-200 dark:bg-gray-800 dark:hover:border-gray-700"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={cn(
                  "bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded font-mono mr-2",
                  selectedId === idx && "bg-blue-200 text-blue-800"
                )}>
                  {idx + 1}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => handleDuplicate(idx, e)} className="p-1 text-gray-400 hover:text-blue-500"><Copy className="w-3 h-3" /></button>
                  <button onClick={(e) => handleDelete(idx, e)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 pr-6">
                {q.question || <span className="italic text-gray-400">Empty Question</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-2">
          <button onClick={() => onSaveSet(mcqs)} disabled={!mcqs.length} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            <Save className="w-4 h-4" /> Save Set
          </button>
          <div className="flex gap-1">
            <button onClick={() => onExportPDF(mcqs)} disabled={!mcqs.length} className="p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"><Download className="w-4 h-4" /></button>
            {/* Word export omitted for brevity if icon fits better */}
          </div>
        </div>
      </div>

      {/* RIGHT: Editor */}
      {selectedId !== null ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">

          {/* Header / Context */}
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-4 border-gray-100 dark:border-gray-700">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1 block">Topic Context (Important for AI)</label>
              <input
                type="text"
                value={topicContext}
                onChange={e => setTopicContext(e.target.value)}
                placeholder="e.g. Java Streams, Thermodynamics..."
                className="w-full md:w-64 p-2 text-sm border rounded-md bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => handleAiAssist('fix_grammar')} disabled={isAiLoading} className="px-3 py-1.5 text-xs font-medium border border-orange-200 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> Fix Grammar
              </button>
              <button onClick={() => handleAiAssist('improve')} disabled={isAiLoading} className="px-3 py-1.5 text-xs font-medium border border-purple-200 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Improve Question
              </button>
            </div>
          </div>

          {/* Question Input */}
          <div className="mb-6 relative">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Question Text</label>
            <div className="relative">
              <textarea
                value={currentMcq.question}
                onChange={(e) => handleChange('question', e.target.value)}
                placeholder="Type your question here..."
                className="w-full p-4 text-lg font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
              />
              <button onClick={() => handleAiAssist('generate_options')} disabled={isAiLoading} className="absolute bottom-3 right-3 text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 flex items-center gap-1">
                <RefreshCw className={cn("w-3 h-3", isAiLoading && "animate-spin")} /> Generate Options
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Options <span className="text-gray-400 font-normal">(Click radio to mark correct)</span></label>
            {currentMcq.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <div onClick={() => setCorrectAnswer(i)} className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors",
                  currentMcq.answer && currentMcq.answer === opt
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 hover:border-blue-400"
                )}>
                  {currentMcq.answer && currentMcq.answer === opt && <Check className="w-4 h-4" />}
                </div>

                <div className={cn("flex-1 relative rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all",
                  currentMcq.answer && currentMcq.answer === opt ? "border-green-200 bg-green-50/50" : "border-gray-200"
                )}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">{String.fromCharCode(65 + i)}</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="w-full py-3 pl-8 pr-4 bg-transparent outline-none text-gray-800 dark:text-gray-200"
                    placeholder={`Option ${i + 1}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Explanation</label>
            <textarea
              value={currentMcq.explanation || ''}
              onChange={(e) => handleChange('explanation', e.target.value)}
              placeholder="Why is the answer correct?"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              rows={3}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-4">
            <ChevronRight className="w-8 h-8 opacity-50" />
          </div>
          <p className="font-medium">Select a question to edit, or create a new one.</p>
        </div>
      )}

    </div>
  );
};