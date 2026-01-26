import React, { useState } from 'react';
import { CustomFormField } from '../types';

interface PublishTestModalProps {
    questionCount: number;
    onSubmit: (title: string, duration: number, endDate: string | null, studentFieldsMode: 'default' | 'custom', customFields: CustomFormField[],
        // New Options
        shuffleQuestions: boolean, shuffleOptions: boolean, attemptLimit: number, allowSkip: boolean
    ) => void;
    onClose: () => void;
    initialTitle?: string;
}

export const PublishTestModal: React.FC<PublishTestModalProps> = ({ questionCount, onSubmit, onClose, initialTitle = '' }) => {
    const [title, setTitle] = useState(initialTitle);
    const [duration, setDuration] = useState(30);
    const [endDate, setEndDate] = useState('');
    const [studentFieldsMode, setStudentFieldsMode] = useState<'default' | 'custom'>('default');
    const [customFields, setCustomFields] = useState<CustomFormField[]>([{ label: '', type: 'text' }]);

    // Advanced State
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [shuffleOptions, setShuffleOptions] = useState(false);
    const [allowSkip, setAllowSkip] = useState(true);
    const [attemptLimit, setAttemptLimit] = useState(0); // 0 = unlimited

    const [error, setError] = useState<string | null>(null);

    const handleAddField = () => setCustomFields(prev => [...prev, { label: '', type: 'text' }]);
    const handleRemoveField = (index: number) => setCustomFields(prev => prev.filter((_, i) => i !== index));
    const handleFieldChange = (index: number, value: string) => {
        setCustomFields(prev => prev.map((f, i) => i === index ? { ...f, label: value } : f));
    };
    const handleTypeChange = (index: number, value: 'text' | 'number' | 'address') => {
        setCustomFields(prev => prev.map((f, i) => i === index ? { ...f, type: value } : f));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!title.trim()) { setError("Test Title is required."); return; }
        if (duration <= 0) { setError("Duration must be a positive number."); return; }
        if (endDate && new Date(endDate) <= new Date()) { setError("End Date must be in the future."); return; }

        const finalCustomFields = studentFieldsMode === 'custom' ? customFields.filter(f => f.label.trim() !== '') : [];

        if (studentFieldsMode === 'custom' && finalCustomFields.length === 0) {
            setError("Please add at least one custom field or switch to Default mode.");
            return;
        }
        onSubmit(title.trim(), duration, endDate || null, studentFieldsMode, finalCustomFields, shuffleQuestions, shuffleOptions, attemptLimit, allowSkip);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xl font-bold mb-4">Publish Test Settings</h3>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">Configure the details for this test ({questionCount} questions).</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="testTitle" className="block text-sm font-medium mb-1">Test Title</label>
                        <input
                            type="text"
                            id="testTitle"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            placeholder="e.g. Midterm Physics Exam"
                            className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium mb-1">Duration (minutes)</label>
                            <input
                                type="number"
                                id="duration"
                                value={duration}
                                onChange={e => setDuration(parseInt(e.target.value, 10))}
                                min="1"
                                required
                                className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium mb-1">Auto Revoke Time (End Date)</label>
                            <input
                                type="datetime-local"
                                id="endDate"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Test link expires after this time.</p>
                        </div>
                    </div>

                    {/* Advanced Controls */}
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            Advanced Controls
                            <span className="text-[10px] font-normal text-muted-foreground bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded-full">New</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm">Shuffle Questions</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm">Shuffle Options</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={allowSkip} onChange={e => setAllowSkip(e.target.checked)} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm">Allow Keep/Skip</span>
                            </label>

                            <div className="flex items-center gap-2">
                                <span className="text-sm whitespace-nowrap">Attempt Limit:</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={attemptLimit}
                                    onChange={e => setAttemptLimit(parseInt(e.target.value))}
                                    className="w-16 p-1 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-center"
                                />
                                <span className="text-[10px] text-muted-foreground">(0 = Unlimited)</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-medium mb-2">Student Details Form</label>
                        <div className="flex flex-col gap-2 p-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-700">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="fieldsMode"
                                    value="default"
                                    checked={studentFieldsMode === 'default'}
                                    onChange={() => setStudentFieldsMode('default')}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm">Default (Name, Reg No, Branch, Section)</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="fieldsMode"
                                    value="custom"
                                    checked={studentFieldsMode === 'custom'}
                                    onChange={() => setStudentFieldsMode('custom')}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm">Custom Fields</span>
                            </label>
                        </div>
                    </div>

                    {studentFieldsMode === 'custom' && (
                        <div className="p-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-md space-y-3 bg-zinc-50 dark:bg-zinc-900/30">
                            <h4 className="font-semibold text-sm">Custom Student Fields</h4>
                            {customFields.map((field, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Field Name (e.g. Phone No)"
                                        value={field.label}
                                        onChange={(e) => handleFieldChange(index, e.target.value)}
                                        className="flex-[2] p-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm"
                                    />
                                    <select
                                        value={field.type}
                                        onChange={(e) => handleTypeChange(index, e.target.value as any)}
                                        className="flex-1 p-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm cursor-pointer"
                                    >
                                        <option value="text">Text (Letters)</option>
                                        <option value="number">Number</option>
                                        <option value="address">Address (Long)</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveField(index)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddField}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                            >
                                + Add Another Field
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2 px-4 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                        >
                            Publish Test
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
