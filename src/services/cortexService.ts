
import { CortexMetrics, TestAttempt, TopicPerformance, Difficulty, PersonalizedPlan, MCQ, FormState, AiProvider, Taxonomy } from '../types';
import { generateMcqs } from './geminiService';

/**
 * CORTEX 2.0: AI Analysis Engine
 * Calculates user performance and generates personalized content.
 */

const safeDate = (d: any): number => {
    if (!d) return 0;
    if (d.seconds) return d.seconds * 1000; // Firestore Timestamp
    if (d instanceof Date) return d.getTime();
    return new Date(d).getTime();
};

export const analyzePerformance = (attempts: TestAttempt[]): CortexMetrics => {
    const topicMap: Record<string, TopicPerformance> = {};
    const sortedAttempts = [...attempts].sort((a, b) => safeDate(a.date) - safeDate(b.date));

    // 1. Traverse attempts to build topic map
    sortedAttempts.forEach(attempt => {
        // Infer topic from title if not explicitly available (naive approach for now)
        // In a real app, Test object would have 'tags' or 'topic'
        // Let's assume title contains the topic for now or is the topic
        const topic = attempt.testTitle.split('-')[0].trim() || "General";

        if (!topicMap[topic]) {
            topicMap[topic] = { topic, score: 0, attempts: 0, lastAttemptDate: new Date(0).toISOString() };
        }

        const current = topicMap[topic];
        // Moving average for score: (Old * N + New) / (N + 1)
        const normalizedScore = (attempt.score / attempt.totalQuestions) * 100;
        current.score = Math.round((current.score * current.attempts + normalizedScore) / (current.attempts + 1));
        current.attempts += 1;
        current.lastAttemptDate = new Date(safeDate(attempt.date)).toISOString();
    });

    // 2. Derive Strengths and Weaknesses
    const strongTopics: string[] = [];
    const weakTopics: string[] = [];

    Object.values(topicMap).forEach(t => {
        if (t.score >= 80) strongTopics.push(t.topic);
        if (t.score < 60) weakTopics.push(t.topic);
    });

    // 3. Determine Trend (Last 5 attempts average vs Previous 5)
    let learningTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (sortedAttempts.length >= 2) {
        const lastScore = (sortedAttempts[sortedAttempts.length - 1].score / sortedAttempts[sortedAttempts.length - 1].totalQuestions);
        const prevScore = (sortedAttempts[sortedAttempts.length - 2].score / sortedAttempts[sortedAttempts.length - 2].totalQuestions);
        const diff = lastScore - prevScore;
        if (diff > 0.1) learningTrend = 'improving';
        else if (diff < -0.1) learningTrend = 'declining';
    }

    // 4. Recommended Difficulty
    const globalAverage = Object.values(topicMap).reduce((acc, t) => acc + t.score, 0) / (Object.values(topicMap).length || 1);
    let recommendedDifficulty = Difficulty.Medium;
    if (globalAverage > 85) recommendedDifficulty = Difficulty.Hard;
    if (globalAverage < 50) recommendedDifficulty = Difficulty.Easy;

    return {
        strongTopics,
        weakTopics,
        topicMap,
        learningTrend,
        recommendedDifficulty
    };
};

export const generatePersonalizedPlan = (metrics: CortexMetrics): PersonalizedPlan => {
    if (metrics.weakTopics.length > 0) {
        return {
            focusTopics: metrics.weakTopics.slice(0, 3), // Top 3 weak
            suggestedAction: 'review_basics',
            reasoning: `You are struggling with ${metrics.weakTopics.slice(0, 3).join(', ')}. We recommend reviewing the basics before attempting advanced questions.`
        };
    } else if (metrics.strongTopics.length > 0) {
        return {
            focusTopics: metrics.strongTopics.slice(0, 3),
            suggestedAction: 'practice_hard',
            reasoning: `You have mastered ${metrics.strongTopics.slice(0, 3).join(', ')}. It's time to challenge yourself with Expert level questions via the 'Surprise Me' mode.`
        };
    } else {
        return {
            focusTopics: ['General Knowledge'],
            suggestedAction: 'attempt_new_topic',
            reasoning: "We don't have enough data yet. Try taking a few tests on different topics!"
        };
    }
};

export const generateAdaptiveQuiz = async (
    userId: string,
    metrics: CortexMetrics
): Promise<MCQ[]> => {
    // Strategy: 
    // 70% questions from Weak Topics (to improve)
    // 30% questions from Strong Topics (to boost confidence)

    // Fallback if no data
    if (metrics.weakTopics.length === 0 && metrics.strongTopics.length === 0) {
        return generateMcqs({
            topic: "General Technology",
            difficulty: Difficulty.Medium,
            questions: 10,
            taxonomy: Taxonomy.Understanding,
            studyMaterial: ""
        });
    }

    const weakTopic = metrics.weakTopics[0] || "General";
    // Construct a clever prompt via FormState
    const formState: Omit<FormState, "aiProvider"> = {
        topic: weakTopic,
        difficulty: Difficulty.Medium, // Easier for weak topics to help learn
        questions: 10,
        taxonomy: Taxonomy.Understanding, // Focus on concepts
        studyMaterial: `Focus specifically on correcting misconceptions about ${weakTopic}. The student has a history of low scores here.`
    };

    return generateMcqs(formState);
};
