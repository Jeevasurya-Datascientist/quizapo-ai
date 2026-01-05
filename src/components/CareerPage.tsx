import React from 'react';
import { AppUser, View } from '../types';
import { CareerMapper } from './CareerMapper';
import { Header } from './Header'; // Reusing Header if available, or just keeping simple layout
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface CareerPageProps {
    user: AppUser;
    onNavigate: (view: View) => void;
    onUpdateGoal: (roleId: string) => void;
    onLogout?: () => void;
}

export const CareerPage: React.FC<CareerPageProps> = ({ user, onNavigate, onUpdateGoal, onLogout }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Simple Top Bar or reuse Header component if structure allows */}
            <header className="bg-white dark:bg-slate-900 border-b shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </Button>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                            Career Center
                        </h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Hero Section of Career Page */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                        <h2 className="text-3xl font-bold mb-2">Design Your Future</h2>
                        <p className="text-indigo-100 max-w-2xl text-lg">
                            Analyze your capability gaps, explore detailed learning paths, and prepare for your dream role with AI-powered insights.
                        </p>
                    </div>

                    <CareerMapper user={user} onUpdateGoal={onUpdateGoal} />
                </div>
            </main>
        </div>
    );
};
