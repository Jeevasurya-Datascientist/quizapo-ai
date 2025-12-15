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

// Fallback for missing Dropzone
const DropzoneFallback = ({ onDrop, children }: any) => {
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) onDrop(e.dataTransfer.files); };
  return <div onDragOver={handleDragOver} onDrop={handleDrop}>{children}</div>;
};

interface McqGeneratorFormProps {
  onGenerate: (formData: Omit<FormState, 'aiProvider'>) => void;
  isLoading: boolean;
  error?: string | null;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const McqGeneratorForm: React.FC<McqGeneratorFormProps> = ({ onGenerate, isLoading, error: parentError }) => {
  const [formState, setFormState] = useState<{
    topic: string;
    difficulty: Difficulty;
    taxonomy: Taxonomy;
    questions: number | string;
    studyMaterial: string;
    imageData: { mimeType: string; data: string } | null;
  }>({
    topic: '',
    difficulty: Difficulty.Medium,
    taxonomy: Taxonomy.Understanding,
    questions: 10,
    studyMaterial: '',
    imageData: null,
  });

  const [fileName, setFileName] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');

  // Combine errors
  const displayError = localError || parentError;

  // --- Handlers ---
  const handleFileProcess = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) { setLocalError(`File too large (${MAX_FILE_SIZE_MB}MB max)`); return; }
    setLocalError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type.startsWith('image/')) {
        const [head, data] = result.split(',');
        const mime = head.match(/:(.*?);/)?.[1] || file.type;
        setFormState(p => ({ ...p, imageData: { mimeType: mime, data }, studyMaterial: '' }));
      } else {
        // Text/PDF logic (Simplified for frontend demo)
        // Ideally this happens on backend, but for text files we can read directly
        if (file.type.includes('text') || file.name.endsWith('.md')) {
          setFormState(p => ({ ...p, studyMaterial: result, imageData: null }));
        } else {
          setFormState(p => ({ ...p, studyMaterial: `[Attached File: ${file.name}]`, imageData: null }));
        }
      }
    };
    if (file.type.startsWith('image/')) reader.readAsDataURL(file);
    else reader.readAsText(file); // Default to text for simplicity in this demo
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.topic && !fileName) { setLocalError("Please provide a topic or upload a file."); return; }

    // Validate Count
    const count = Number(formState.questions);
    if (!count || count < 1 || count > 100) { setLocalError("Please enter a valid question count (1-100)."); return; }

    onGenerate({ ...formState, questions: count });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 animate-in fade-in duration-500">

      {/* --- HEADER --- */}
      <div className="max-w-5xl mx-auto mb-8 text-center md:text-left space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
          Creation Studio
        </h1>
        <p className="text-muted-foreground text-lg">
          Transform your content into professional assessments in seconds.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* --- LEFT COLUMN: CONTROLS --- */}
        <div className="lg:col-span-7 space-y-8">

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
                className="h-14 pl-4 text-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 transition-all shadow-sm group-hover:shadow-md"
              />
            </div>
          </section>

          {/* 2. Configuration Settings */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">

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
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300"
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
                  className="w-full h-12 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
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
                    className="w-24 h-12 text-center text-lg font-bold"
                  />
                  <span className="text-sm text-muted-foreground">questions</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* --- RIGHT COLUMN: SOURCE --- */}
        <div className="lg:col-span-5 space-y-8">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-orange-500" /> Source Material (Optional)
          </Label>

          <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-white transition-colors">
            <CardContent className="p-0">
              <DropzoneFallback onDrop={(files: File[]) => handleFileProcess(files[0])}>
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center cursor-pointer min-h-[300px]">
                  {fileName ? (
                    <div className="space-y-4 animate-in zoom-in duration-300">
                      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                        <FileText className="w-10 h-10 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{fileName}</p>
                        <p className="text-sm text-green-600 font-medium">Ready for analysis</p>
                      </div>
                      <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setFileName(''); setFormState(p => ({ ...p, studyMaterial: '', imageData: null })); }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-indigo-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload className="w-10 h-10 text-indigo-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Upload Source File</h3>
                        <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                          Drag & drop PDF, Docs, Text, or Images here
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
                      />
                    </div>
                  )}
                </div>
              </DropzoneFallback>
            </CardContent>
          </Card>

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
  );
};