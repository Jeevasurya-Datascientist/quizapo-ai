import React, { useEffect } from 'react';
import { BadgeCheck, Brain, ChevronLeft, Github, Linkedin, Mail, Shield, Code, User, GraduationCap, Trophy, Terminal } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

interface TeamMember {
    name: string;
    role: string;
    id: string;
    icon?: React.ReactNode;
    isLead?: boolean;
}

const mentors = [
    {
        name: "Mr.S. Narendhiran M.E.,",
        role: "Guide",
        icon: <Brain className="w-6 h-6 text-indigo-500" />,
        quote: "True innovation lies not just in writing code, but in solving real problems with empathy and precision."
    },
    {
        name: "Mr.K. Ashok Kumar B.E.,",
        role: "Project Incharge",
        icon: <Trophy className="w-6 h-6 text-amber-500" />,
        quote: "Success is the sum of small efforts, repeated day in and day out. Keep building, keep learning."
    },
];

const teamMembers: TeamMember[] = [
    { name: "Jegathratchagan A", role: "Team Lead", id: "24591436", isLead: true },
    { name: "Mohammed Asik", role: "Developer", id: "24591441" },
    { name: "Tamilselvan", role: "Developer", id: "23506315" },
    { name: "Logeshwaran C", role: "Developer", id: "24506385" },
];

export const TeamPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {

    const triggerCelebration = () => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            zIndex: 100,
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500']
        };

        function fire(particleRatio: number, opts: any) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    useEffect(() => {
        // Trigger a controlled burst on mount
        triggerCelebration();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] opacity-50" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-50" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">

                {/* Navigation */}
                <div className="absolute top-6 left-6 md:top-12 md:left-12 z-50">
                    <Button variant="ghost" onClick={onBack} className="hover:bg-white/50 dark:hover:bg-slate-900/50 backdrop-blur-sm -ml-4 md:ml-0 group">
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back
                    </Button>
                </div>

                {/* Header */}
                <div className="text-center space-y-4 mb-20 pt-12 md:pt-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div
                        onClick={triggerCelebration}
                        className="cursor-pointer inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-wider uppercase mb-4 hover:scale-105 transition-transform"
                    >
                        <Code className="w-3 h-3" /> Engineering Team
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight" onClick={() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })}>
                        Meet the <span className="cursor-pointer text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 hover:brightness-110 transition-all">Minds</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        The dedicated team behind Quizapo AI, driving innovation in educational assessment technology.
                    </p>
                </div>

                {/* Mentors Section */}
                <div className="mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="flex items-center gap-4 mb-10 justify-center">
                        <div className="h-px bg-slate-200 dark:bg-slate-800 w-full max-w-[100px]" />
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Mentors & Guides</h2>
                        <div className="h-px bg-slate-200 dark:bg-slate-800 w-full max-w-[100px]" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {mentors.map((mentor, i) => (
                            <div key={i} className="group relative bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm hover:shadow-xl border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:scale-[1.02]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="space-y-6">
                                    <div className="flex items-start gap-5">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                                            {mentor.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {mentor.name}
                                            </h3>
                                            <div className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-1">{mentor.role}</div>
                                        </div>
                                    </div>

                                    <blockquote className="relative p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 border-indigo-500 italic text-slate-600 dark:text-slate-300">
                                        "{mentor.quote}"
                                    </blockquote>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Development Team */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    <div className="flex items-center gap-4 mb-10 justify-center">
                        <div className="h-px bg-slate-200 dark:bg-slate-800 w-full max-w-[100px]" />
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Development Team</h2>
                        <div className="h-px bg-slate-200 dark:bg-slate-800 w-full max-w-[100px]" />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {teamMembers.map((member, i) => (
                            <div key={i} className={cn(
                                "relative bg-white dark:bg-slate-900 rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center group",
                                member.isLead
                                    ? "border-indigo-200 dark:border-indigo-800 shadow-md ring-1 ring-indigo-50 dark:ring-indigo-900/20"
                                    : "border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
                            )}>
                                {member.isLead && (
                                    <div className="absolute top-4 right-4 animate-pulse">
                                        <Shield className="w-4 h-4 text-indigo-500" />
                                    </div>
                                )}

                                <div className={cn(
                                    "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 transition-transform group-hover:scale-110 shadow-inner",
                                    member.isLead ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                )}>
                                    {member.name.charAt(0)}
                                </div>

                                <div className="space-y-1 mb-3">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{member.name}</h3>
                                    <div className="text-xs font-mono text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 inline-block">
                                        ID: {member.id}
                                    </div>
                                </div>

                                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full uppercase tracking-wide">
                                    {member.role}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Branding */}
                <div className="mt-24 text-center border-t border-slate-200 dark:border-slate-800 pt-12">
                    <p className="text-slate-400 text-sm font-medium">Developed & Maintained by</p>
                    <div className="flex items-center justify-center gap-2 mt-2 text-slate-900 dark:text-white font-black text-lg tracking-widest uppercase opacity-80 hover:opacity-100 transition-opacity">
                        <Terminal className="w-5 h-5 text-indigo-600" />
                        JS CORPORATIONS
                    </div>
                    <p className="text-xs text-slate-400 mt-2">© {new Date().getFullYear()} All Rights Reserved</p>
                </div>

            </div>
        </div>
    );
};
