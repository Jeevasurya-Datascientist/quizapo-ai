import React, { useState, useCallback } from 'react';
import {
  Upload, X, FileText, Image as ImageIcon, Sparkles,
  Zap, BookOpen, Layers, Type, Trash2, Cpu
} from 'lucide-react';
import { useDropzone } from 'react-dropzone'; // Assuming installed or I'll implement manual dnd if not
import type { FormState } from '../types';
import { Difficulty, Taxonomy } from '../types';
import { DIFFICULTY_LEVELS, TAXONOMY_LEVELS } from '../constants';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '../lib/utils';
import { Card, CardContent } from './ui/card';

// Fallback for missing Dropzone (Removed unused code)

interface McqGeneratorFormProps {
  onGenerate: (formData: Omit<FormState, 'aiProvider'>) => void;
  isLoading: boolean;
  error?: string | null;
}

export const McqGeneratorForm: React.FC<McqGeneratorFormProps> = ({ onGenerate, isLoading, error: parentError }) => {
  const [formState, setFormState] = useState<{
    topic: string;
    difficulty: Difficulty;
    taxonomy: Taxonomy;
    questions: number | string;
  }>({
    topic: '',
    difficulty: Difficulty.Medium,
    taxonomy: Taxonomy.Understanding,
    questions: 10,
  });

  const [localError, setLocalError] = useState<string>('');

  // Combine errors
  const displayError = localError || parentError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.topic) { setLocalError("Please provide a topic."); return; }

    // Validate Count
    const count = Number(formState.questions);
    if (!count || count < 1 || count > 100) { setLocalError("Please enter a valid question count (1-100)."); return; }

    // Send data (shim unused fields for type compatibility if needed, though Omit<FormState> implies we need to match FormState shape minus aiProvider)
    // Actually FormState requires studyMaterial/imageData? Let's check types.
    // If FormState has optional fields or we pass empty strings it is fine.
    onGenerate({
      ...formState,
      questions: count,
      studyMaterial: '',
      imageData: null
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 animate-in fade-in duration-500 flex items-center justify-center">

      <div className="w-full max-w-3xl space-y-8">

        {/* --- HEADER --- */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
            Creation Studio
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform your content into professional assessments in seconds.
          </p>
        </div>

        {/* --- MAIN FORM --- */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 md:p-8 space-y-8">

          {/* 1. Topic Section */}
          <section className="space-y-4">
            <Label className="text-base font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" /> Topic & Context
            </Label>
            <div className="relative group">
              <Input
                value={formState.topic}
                onChange={e => setFormState(p => ({ ...p, topic: e.target.value }))}
                placeholder="e.g. Thermodynamics, The Great Gatsby, Circular Motion..."
                className="h-14 pl-4 text-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 transition-all shadow-sm group-hover:shadow-md"
              />
            </div>
          </section>

          {/* 2. Configuration Settings */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Difficulty Selector */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" /> Complexity
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(Difficulty).map((level) => (
                  <div
                    key={level}
                    onClick={() => setFormState(p => ({ ...p, difficulty: level }))}
                    className={cn(
                      "cursor-pointer px-4 py-3 rounded-lg border transition-all flex items-center justify-between",
                      formState.difficulty === level
                        ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500/20 dark:bg-indigo-900/20"
                        : "bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300"
                    )}
                  >
                    <span className="font-medium text-sm">{level}</span>
                    {formState.difficulty === level && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Taxonomy Selector */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-pink-500" /> Taxonomy
              </Label>
              <div className="space-y-2">
                <select
                  className="w-full h-12 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-800/50 focus:ring-indigo-500"
                  value={formState.taxonomy}
                  onChange={(e) => setFormState(p => ({ ...p, taxonomy: e.target.value as Taxonomy }))}
                >
                  {TAXONOMY_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <p className="text-xs text-muted-foreground p-1">
                  Current Goal: <span className="font-medium text-pink-600">{formState.taxonomy}</span>
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-500" /> Question Count
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1} max={100}
                    value={formState.questions}
                    onChange={e => {
                      const val = e.target.value;
                      setFormState(p => ({ ...p, questions: val === '' ? '' : parseInt(val) }));
                    }}
                    className="w-full h-12 text-center text-lg font-bold bg-zinc-50 dark:bg-zinc-800/50"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Questions (1-100)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Error & Action */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {displayError && <p className="text-sm text-red-500 text-center font-medium animate-pulse">{displayError}</p>}

            <Button
              onClick={handleSubmit}
              className="w-full h-16 text-xl font-bold rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-xl shadow-indigo-500/25 transform hover:-translate-y-1 transition-all"
            >
              <Sparkles className="w-6 h-6 mr-3 animate-pulse" /> Generate Assessment
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};