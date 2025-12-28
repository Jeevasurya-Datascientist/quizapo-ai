import React from 'react';
import { ArrowRight, Brain, Shield, BarChart3, Users, Play, Code, ChevronRight, Globe, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { View } from '../types';

interface LandingPageProps {
    onNavigate: (view: View) => void;
    onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onGetStarted }) => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30">

            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">Quizapo AI</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                        <button onClick={() => onNavigate('about')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</button>
                        <button onClick={() => onNavigate('privacy')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Safety</button>
                        <button onClick={() => onNavigate('team')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Team</button>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={onGetStarted} className="hidden sm:flex hover:bg-slate-100 dark:hover:bg-slate-900">
                            Sign In
                        </Button>
                        <Button onClick={onGetStarted} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-lg shadow-indigo-500/20">
                            Get Started
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6 relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">

                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-fuchsia-500/10 rounded-full blur-[120px]" />
                    <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-[80px]" />

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-slate-950 dark:via-transparent"></div>
                </div>

                <div className="container mx-auto max-w-6xl text-center space-y-8 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-sm font-medium shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2.5 w-2.5 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                        </span>
                        Quizapo AI v2.0 is Live
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 drop-shadow-sm">
                        The Future of <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-indigo-400 dark:via-violet-400 dark:to-fuchsia-400">
                            Intelligent Assessment
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Generate questions instantly, proctor exams with AI, and unlock deep student insights. <span className="text-slate-900 dark:text-white font-semibold">Zero friction.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Button onClick={onGetStarted} size="lg" className="group relative h-14 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-lg font-bold w-full sm:w-auto shadow-xl shadow-indigo-500/30 overflow-hidden transition-all hover:scale-105">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform skew-y-12"></div>
                            <span className="relative flex items-center">
                                Start for Free <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
                            </span>
                        </Button>
                        <Button onClick={() => onNavigate('team')} variant="outline" size="lg" className="h-14 px-8 rounded-full border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 w-full sm:w-auto text-lg font-medium transition-all hover:scale-105">
                            Meet the Team
                        </Button>
                    </div>
                </div>

                {/* Social Proof / Stats */}
                <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-slate-100 dark:border-slate-900 mt-16 max-w-4xl mx-auto opacity-0 animate-in fade-in duration-1000 delay-500 fill-mode-forwards">
                    {[
                        ['50K+', 'Questions Generated'],
                        ['10K+', 'Students Active'],
                        ['99.9%', 'Uptime Excl. Maint.'],
                        ['4.8/5', 'User Rating']
                    ].map(([stat, label]) => (
                        <div key={label} className="text-center">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat}</div>
                            <div className="text-sm text-slate-500 font-medium">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-bold">Why Quizapo?</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                            Everything you need to conduct world-class assessments.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                icon: <Brain className="w-8 h-8 text-indigo-500" />,
                                title: "AI Generation",
                                desc: "Turn any text or topic into a comprehensive quiz in seconds using Gemini & GPT-4."
                            },
                            {
                                icon: <Shield className="w-8 h-8 text-emerald-500" />,
                                title: "Smart Integrity",
                                desc: "Advanced proctoring features like tab-switch detection and behavioral analysis."
                            },
                            {
                                icon: <BarChart3 className="w-8 h-8 text-purple-500" />,
                                title: "Deep Analytics",
                                desc: "Visualize performance gaps and learning outcomes with detailed reports."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300">
                                <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 inline-block">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-20 pb-10">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-indigo-600 p-1 rounded-md">
                                    <Brain className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-lg">Quizapo AI</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Empowering education through intelligent assessment technology.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold mb-6">Product</h4>
                            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                                <li><button onClick={() => onNavigate('dashboard')} className="hover:text-indigo-600">Features</button></li>
                                <li><button onClick={() => onNavigate('dashboard')} className="hover:text-indigo-600">Pricing</button></li>
                                <li><button onClick={() => onNavigate('dashboard')} className="hover:text-indigo-600">Changelog</button></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold mb-6">Company</h4>
                            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                                <li><button onClick={() => onNavigate('about')} className="hover:text-indigo-600">About Us</button></li>
                                <li><button onClick={() => onNavigate('team')} className="hover:text-indigo-600 font-medium text-indigo-600 dark:text-indigo-400">Team</button></li>
                                <li><button onClick={() => onNavigate('contact')} className="hover:text-indigo-600">Contact</button></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold mb-6">Legal</h4>
                            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                                <li><button onClick={() => onNavigate('privacy')} className="hover:text-indigo-600">Privacy Policy</button></li>
                                <li><button onClick={() => onNavigate('terms')} className="hover:text-indigo-600">Terms of Service</button></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-500">
                            © {new Date().getFullYear()} Quizapo AI. All rights reserved.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest">
                            <Code className="w-3 h-3" />
                            Powered by JS Corporations
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
