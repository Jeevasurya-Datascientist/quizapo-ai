import { AppUser, CareerPath, CareerRole, CortexMetrics, Skill } from '../types';
import { CAREER_ROLES } from '../data/careerRoles';

/**
 * CAREER MAPPING ENGINE
 * Matches user's Cortex metrics and self-reported skills against industry roles.
 */

// --- MOCK DATABASE OF ROLES (Ideally from Firestore) ---

export const getAvailableRoles = async (): Promise<CareerRole[]> => {
    // Simulate API call
    return new Promise(resolve => setTimeout(() => resolve(CAREER_ROLES), 500));
};

export const analyzeCareerPath = (user: AppUser, targetRole: CareerRole): CareerPath => {
    // 1. Map Cortex Metrics to Skills (Heuristic mapping)
    // If user has "React" as a strong topic in Cortex, we assume high proficiency
    const userSkills: Record<string, number> = {};

    if (user.cortexMetrics) {
        user.cortexMetrics.strongTopics.forEach(t => userSkills[t] = 85); // Arbitrary "High"
        user.cortexMetrics.weakTopics.forEach(t => userSkills[t] = 40);   // Arbitrary "Low"
        // Topics with average score
        Object.values(user.cortexMetrics.topicMap).forEach(t => {
            if (t.score >= 60 && t.score < 80) userSkills[t.topic] = t.score;
        });
    }

    // 2. Calculate Gap
    let totalGap = 0;
    let matchPoints = 0;
    const missingSkills: { name: string; gap: number }[] = [];

    targetRole.requiredSkills.forEach(req => {
        // Matches logic: checks exact name or substring match (e.g. "React.js" match "React")
        const userLevel = userSkills[req.name] ||
            (Object.keys(userSkills).find(k => k.includes(req.name) || req.name.includes(k)) ? userSkills[Object.keys(userSkills).find(k => k.includes(req.name) || req.name.includes(k))!] : 0);

        if (userLevel >= req.level) {
            matchPoints += 100; // Perfect match for this skill
        } else {
            const gap = req.level - userLevel;
            totalGap += gap;
            matchPoints += (userLevel / req.level) * 100;
            missingSkills.push({ name: req.name, gap });
        }
    });

    const matchScore = Math.min(100, Math.round(matchPoints / targetRole.requiredSkills.length));

    return {
        roleId: targetRole.id,
        roleTitle: targetRole.title,
        matchScore,
        missingSkills: missingSkills.sort((a, b) => b.gap - a.gap),
        learningResources: [
            `Complete advanced ${targetRole.title} projects`,
            `Take specific quizzes on ${missingSkills.map(s => s.name).slice(0, 2).join(', ')}`
        ]
    };
};
