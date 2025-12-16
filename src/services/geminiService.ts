import type { FormState, MCQ } from "../types";
import { AiProvider } from "../types";

/* =========================
   Prompt Builder
========================= */

const buildPrompt = (inputs: FormState): string => {
  const { topic, difficulty, taxonomy, questions, studyMaterial, imageData } = inputs;
  const safeQuestions = Math.max(1, Math.min(100, questions));
  const hasContent = !!studyMaterial || !!imageData;
  const contentSource = imageData ? "the provided image" : "the provided study material";

  return `
You are Quizapo AI. ALWAYS return ONLY valid JSON. No markdown. No explanation text outside JSON.

Inputs:
- topic: "${topic}"
- difficulty: "${difficulty}"
- taxonomy: "${taxonomy}"
- questions: ${safeQuestions}
- studyMaterial: "${studyMaterial}"
- image provided: ${!!imageData}

Rules:
1) If content is provided (${hasContent ? contentSource : "none"}) → generate questions STRICTLY from it.
2) If no content → use general knowledge.
3) If topic & content both empty → generate Computer Science MCQs.
4) Output EXACTLY ${safeQuestions} questions.
5) Final output MUST be a JSON array.
6) Each item format:
{
  "question": "string",
  "options": ["A","B","C","D"],
  "answer": "exact option text",
  "explanation": "≤ 30 words"
}
7) Options must be unique and answer must match exactly.

Generate now.
`;
};

/* =========================
   JSON Repair Utility
========================= */

const repairJson = (text: string): string => {
  let cleaned = text
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  if (cleaned.startsWith("[") && !cleaned.endsWith("]")) {
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace !== -1) {
      cleaned = cleaned.slice(0, lastBrace + 1) + "]";
    }
  }

  return cleaned;
};

/* =========================
   Validation
========================= */

const validateMcqs = (
  parsed: any,
  requested: number,
  provider: string
): MCQ[] => {
  if (!Array.isArray(parsed)) {
    throw new Error(`AI (${provider}) did not return a JSON array.`);
  }

  if (parsed.length > requested) {
    parsed = parsed.slice(0, requested);
  }

  parsed.forEach((q, i) => {
    if (
      !q.question ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      !q.answer ||
      !q.options.includes(q.answer) ||
      !q.explanation
    ) {
      throw new Error(
        `Invalid MCQ structure from ${provider} at index ${i}`
      );
    }
  });

  return parsed as MCQ[];
};

/* =========================
   GROQ (≤ 40 Questions)
========================= */

const _generateWithGroq = async (formData: FormState): Promise<MCQ[]> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key missing.");

  const prompt = buildPrompt(formData);
  const requested = Math.min(100, formData.questions);

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 8192
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty Groq response");

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = JSON.parse(repairJson(content));
  }

  if (parsed.questions) parsed = parsed.questions;

  return validateMcqs(parsed, requested, "Groq");
};

/* =========================
   OPENROUTER (> 40 Questions)
========================= */

const _generateWithOpenRouter = async (
  formData: FormState
): Promise<MCQ[]> => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API key missing.");

  const prompt = buildPrompt(formData);
  const requested = Math.min(100, formData.questions);

  const call = async (model: string): Promise<MCQ[]> => {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost",
          "X-Title": "Quizapo MCQ Generator"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          max_tokens: 8192
        })
      }
    );

    if (!response.ok) {
      throw new Error(`OpenRouter error (${model}): ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty OpenRouter response");

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = JSON.parse(repairJson(content));
    }

    if (parsed.questions) parsed = parsed.questions;

    return validateMcqs(parsed, requested, model);
  };

  try {
    return await call("meta-llama/llama-3.3-70b-instruct");
  } catch (err) {
    console.warn("Llama 70B failed, fallback to Mistral 7B", err);
    return await call("mistralai/mistral-7b-instruct");
  }
};
/* =========================
   Validation Utility
========================= */

export interface ValidationIssue {
  issueType: 'formatting' | 'duplicate_options' | 'missing_answer' | 'irrelevant' | 'quality_check';
  description: string;
  suggestedFix?: MCQ;
  questionIndex: number;
}

export interface ValidationResult {
  issues: ValidationIssue[];
}

/**
 * Validates a list of questions for structural integrity and basic quality.
 * Currently uses local logic, but can be enhanced to use AI.
 */
export const validateQuestionBank = async (questions: MCQ[], topic: string = "General"): Promise<ValidationResult> => {
  const issues: ValidationIssue[] = [];

  questions.forEach((q, idx) => {
    // 1. Check for missing answer
    if (!q.answer) {
      issues.push({
        issueType: 'missing_answer',
        description: 'This question does not have a selected answer.',
        questionIndex: idx
      });
    } else if (!q.options.includes(q.answer)) {
      issues.push({
        issueType: 'formatting',
        description: 'The selected answer is not one of the provided options.',
        questionIndex: idx
      });
    }

    // 2. Check for duplicate options
    const uniqueOptions = new Set(q.options.map(o => o.trim()));
    if (uniqueOptions.size !== q.options.length) {
      issues.push({
        issueType: 'duplicate_options',
        description: 'There are duplicate options in this question.',
        questionIndex: idx
      });
    }

    // 3. Basic Field Checks
    if (!q.question.trim()) {
      issues.push({
        issueType: 'formatting',
        description: 'Question text is empty.',
        questionIndex: idx
      });
    }
  });

  // Simulating an async check
  return new Promise((resolve) => {
    setTimeout(() => resolve({ issues }), 500);
  });
};


/* =========================
   PUBLIC ENTRY
========================= */

// Re-export specific validation types if needed by consumers who import * as GeminiService
export type { ValidationIssue as GeminiValidationIssue, ValidationResult as GeminiValidationResult };

export const generateMcqs = async (
  formData: Omit<FormState, "aiProvider">
): Promise<MCQ[]> => {
  const provider =
    formData.questions > 40
      ? AiProvider.OpenRouter
      : AiProvider.Groq;

  const fullData: FormState = {
    ...formData,
    aiProvider: provider
  };

  if (provider === AiProvider.Groq) {
    return _generateWithGroq(fullData);
  }

  return _generateWithOpenRouter(fullData);
};
