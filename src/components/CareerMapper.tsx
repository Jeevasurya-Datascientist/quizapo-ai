
import React, { useState, useEffect } from 'react';
import { AppUser, CareerRole, CareerPath } from '../types';
import { getAvailableRoles, analyzeCareerPath } from '../services/careerService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TrendingUp, Briefcase, AlertCircle, CheckCircle2, DollarSign, Target } from 'lucide-react';
import { Progress } from './ui/progress';

interface CareerMapperProps {
    user: AppUser;
    onUpdateGoal?: (roleId: string) => void;
}

export const CareerMapper: React.FC<CareerMapperProps> = ({ user, onUpdateGoal }) => {
    const [roles, setRoles] = useState<CareerRole[]>([]);
    const [selectedRole, setSelectedRole] = useState<CareerRole | null>(null);
    const [analysis, setAnalysis] = useState<CareerPath | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // UI State for Extended Data
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("All");
    const [activeTab, setActiveTab] = useState<'skills' | 'guide'>('skills');

    // Derived
    const filteredRoles = roles.filter(r =>
        (categoryFilter === "All" || r.category === categoryFilter) &&
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const categories = ["All", ...Array.from(new Set(roles.map(r => r.category || "General")))];

    useEffect(() => {
        loadRoles();
    }, []);

    useEffect(() => {
        if (selectedRole && user) {
            setAnalysis(analyzeCareerPath(user, selectedRole));
        }
    }, [selectedRole, user]);

    const loadRoles = async () => {
        setIsLoading(true);
        const data = await getAvailableRoles();
        setRoles(data);

        // Auto-select if user has a saved goal
        if (user.careerGoal) {
            const saved = data.find(r => r.id === user.careerGoal?.targetRoleId);
            if (saved) setSelectedRole(saved);
        } else {
            // Default to first merely for display
            // setSelectedRole(data[0]); 
        }
        setIsLoading(false);
    };

    const handleRoleSelect = (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        if (role) {
            setSelectedRole(role);
            if (onUpdateGoal) onUpdateGoal(roleId);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Career Paths...</div>;

    return (
        <div className="space-y-6">
            <Card className="shadow-lg border-t-4 border-t-indigo-500">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-indigo-600" /> Career Capability Mapper
                            </CardTitle>
                            <CardDescription>
                                Explore {roles.length}+ roles and get a detailed roadmap.
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            {/* Filter Controls */}
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select onValueChange={handleRoleSelect} value={selectedRole?.id || ""}>
                                <SelectTrigger className="w-full md:w-[250px]">
                                    <SelectValue placeholder="Select Target Role" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {filteredRoles.map(role => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {!selectedRole ? (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed">
                            <Target className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500">Select a role above to analyze your fit.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Left: Role Info & Match */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-lg">{selectedRole.title}</h3>
                                            <Badge variant={selectedRole.demandLevel === 'high' ? 'destructive' : 'secondary'}>
                                                {selectedRole.demandLevel.toUpperCase()} DEMAND
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{selectedRole.description}</p>
                                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2 rounded-lg w-fit">
                                            <DollarSign className="w-4 h-4" /> {selectedRole.averageSalary}
                                        </div>
                                    </div>

                                    {/* Radial Match Score */}
                                    <div className="flex items-center gap-6 p-4 bg-white dark:bg-slate-950 rounded-xl border shadow-sm">
                                        <div className="relative w-24 h-24 flex items-center justify-center">
                                            {/* Simple SVG Circular Progress */}
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                    strokeDasharray={251.2}
                                                    strokeDashoffset={251.2 - (251.2 * (analysis?.matchScore || 0) / 100)}
                                                    className="text-indigo-600 transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            <span className="absolute text-xl font-bold">{analysis?.matchScore}%</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">Role Match</h4>
                                            <p className="text-sm text-muted-foreground w-40">
                                                {analysis && analysis.matchScore > 80 ? "You're heavily qualified!" : "Some gaps to bridge."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* --- Tab Navigation (Skills / Guide) --- */}
                            <div className="mt-8 border-t pt-6">
                                <div className="flex gap-4 mb-6">
                                    <Button
                                        variant={activeTab === 'skills' ? "default" : "outline"}
                                        onClick={() => setActiveTab('skills')}
                                        className="gap-2"
                                    >
                                        <TrendingUp className="w-4 h-4" /> Skills Gap
                                    </Button>
                                    <Button
                                        variant={activeTab === 'guide' ? "default" : "outline"}
                                        onClick={() => setActiveTab('guide')}
                                        className="gap-2"
                                    >
                                        <Briefcase className="w-4 h-4" /> Detailed Guide & Path
                                    </Button>
                                </div>

                                {activeTab === 'skills' ? (
                                    <div className="grid md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                        {/* Re-using existing Skill Analysis layout here if needed, or keeping side-by-side above */}
                                        <div className="space-y-4">
                                            <h4 className="font-semibold flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-indigo-500" /> Skill Analysis
                                            </h4>
                                            <div className="space-y-4">
                                                {selectedRole.requiredSkills.map(skill => {
                                                    const missing = analysis?.missingSkills.find(m => m.name === skill.name);
                                                    const userVal = missing ? skill.level - missing.gap : skill.level;
                                                    const percent = (userVal / skill.level) * 100;

                                                    return (
                                                        <div key={skill.name} className="space-y-1">
                                                            <div className="flex justify-between text-sm">
                                                                <span>{skill.name}</span>
                                                                <span className={missing ? "text-amber-500 font-medium" : "text-emerald-500 font-medium"}>
                                                                    {Math.round(percent)}%
                                                                </span>
                                                            </div>
                                                            <Progress value={Math.min(100, percent)} className={missing ? "h-2 bg-slate-100 dark:bg-slate-800" : "h-2 bg-emerald-100 dark:bg-emerald-900/20 [&>div]:bg-emerald-500"} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-semibold flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5 text-amber-500" /> AI Recommendations
                                            </h4>
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-3">
                                                {analysis?.learningResources.map((res, i) => (
                                                    <div key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                                                        <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                                        {res}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="bg-indigo-50 dark:bg-indigo-950/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                                <h4 className="font-bold text-lg mb-2 text-indigo-700 dark:text-indigo-400">Career Roadmap</h4>
                                                <p className="text-sm text-muted-foreground mb-4">Step-by-step guide to becoming a {selectedRole.title}.</p>
                                                <ol className="space-y-3 relative border-l-2 border-indigo-200 dark:border-indigo-800 ml-2 pl-4">
                                                    {selectedRole.learningPath?.map((step, i) => (
                                                        <li key={i} className="text-sm">
                                                            <span className="font-semibold text-slate-900 dark:text-slate-100">Step {i + 1}:</span> <span className="text-slate-600 dark:text-slate-400">{step}</span>
                                                        </li>
                                                    )) || <p className="text-sm italic">No specific roadmap available.</p>}
                                                </ol>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="p-4 border rounded-xl">
                                                    <h5 className="font-semibold mb-2">Salary Insights</h5>
                                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selectedRole.averageSalary}</div>
                                                    <p className="text-xs text-muted-foreground">Global Average</p>
                                                </div>
                                                <div className="p-4 border rounded-xl">
                                                    <h5 className="font-semibold mb-2">Market Demand</h5>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${selectedRole.demandLevel === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                                        <span className="capitalize font-medium">{selectedRole.demandLevel} Demand</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {selectedRole.demandLevel === 'high' ? "Aggressively hiring across most regions." : "Steady hiring in specific hubs."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
