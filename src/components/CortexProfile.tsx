
import React from 'react';
import { CortexMetrics, PersonalizedPlan } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Brain, TrendingUp, TrendingDown, Minus, Target, Award, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface CortexProfileProps {
    metrics?: CortexMetrics;
    plan?: PersonalizedPlan;
    onStartReview: () => void;
    isLoading?: boolean;
}

export const CortexProfile: React.FC<CortexProfileProps> = ({ metrics, plan, onStartReview, isLoading }) => {
    if (!metrics) return null;

    return (
        <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <CardHeader className="pb-2 relative z-10">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-indigo-100">
                        <Brain className="w-5 h-5 text-indigo-400" />
                        Cortex AI Analysis
                    </CardTitle>
                    <div className={cn(
                        "flex items-center gap-1 text-xs px-2 py-1 rounded-full border",
                        metrics.learningTrend === 'improving' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" :
                            metrics.learningTrend === 'declining' ? "bg-rose-500/20 border-rose-500/30 text-rose-300" :
                                "bg-slate-700 border-slate-600 text-slate-400"
                    )}>
                        {metrics.learningTrend === 'improving' && <TrendingUp className="w-3 h-3" />}
                        {metrics.learningTrend === 'declining' && <TrendingDown className="w-3 h-3" />}
                        {metrics.learningTrend === 'stable' && <Minus className="w-3 h-3" />}
                        {metrics.learningTrend.charAt(0).toUpperCase() + metrics.learningTrend.slice(1)} Trend
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">

                {/* Knowledge Map */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Award className="w-3 h-3" /> Strong Topics
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {metrics.strongTopics.length > 0 ? (
                                metrics.strongTopics.map(t => (
                                    <span key={t} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-md">
                                        {t}
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-500 text-xs italic">No data yet</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Target className="w-3 h-3" /> Needs Focus
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {metrics.weakTopics.length > 0 ? (
                                metrics.weakTopics.map(t => (
                                    <span key={t} className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-md">
                                        {t}
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-500 text-xs italic">None! Great job.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Plan */}
                {plan && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 mt-4">
                        <h4 className="text-sm font-semibold text-indigo-200 mb-2">Recommended Strategy</h4>
                        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                            {plan.reasoning}
                        </p>
                        <Button
                            onClick={onStartReview}
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                        >
                            <Zap className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                            {isLoading ? "Generating Personalized Quiz..." : "Start Adaptive Review"}
                        </Button>
                    </div>
                )}

            </CardContent>
        </Card>
    );
};
