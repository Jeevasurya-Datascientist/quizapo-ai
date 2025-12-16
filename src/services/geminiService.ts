import { GoogleGenerativeAI } from "@google/generative-ai";
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
// --- Validation Fallback (Groq) ---
const _validateWithGroq = async (questions: any[], topic: string): Promise<ValidationResult> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return { issues: [] }; // No API, no validation

  const prompt = `
    Act as a "Strict Professor". Review these MCQs on "${topic}".
    Questions: ${JSON.stringify(questions)}
    
    Rules:
    1. Detect WRONG answers (factually incorrect).
    2. Detect IRRELEVANT options (nonsense).
    3. Detect FORMATTING issues (typos, duplicates).
    
    Return pure JSON:
    {
      "issues": [
        {
          "questionIndex": number,
          "issueType": "wrong_answer" | "irrelevant_option" | "formatting",
          "description": "Short explanation",
          "suggestedFix": { ...corrected question object... }
        }
      ]
    }
    Only report ACTUAL errors. Return empty issues list if perfect.
  `;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) throw new Error("Groq Validation Failed");
    const data = await response.json();
    const content = data.choices[0].message.content;

    let json;
    try {
      json = JSON.parse(content);
    } catch {
      json = JSON.parse(repairJson(content));
    }
    return json as ValidationResult;

  } catch (error) {
    console.warn("Groq Validator also failed:", error);
    // basic fallback
    return _basicLocalValidation(questions);
  }
};

const _basicLocalValidation = (questions: MCQ[]): ValidationResult => {
  const issues: ValidationIssue[] = [];
  questions.forEach((q, idx) => {
    if (!q.answer || !q.options.includes(q.answer)) {
      issues.push({
        issueType: 'formatting',
        description: 'Answer matches nobody.',
        questionIndex: idx,
        suggestedFix: { ...q, answer: q.options[0] }
      });
    }
  });
  return { issues };
};

export const validateQuestionBank = async (questions: any[], topic: string): Promise<ValidationResult> => {
  // Try Gemini First
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) throw new Error("No Gemini Key");
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002", generationConfig: { responseMimeType: "application/json" } });

    const prompt = `
    Act as a Strict Professor. Review the following Multiple Choice Questions.
    Topic Context: "${topic}".
    
    Check for:
    1. WRONG ANSWERS: Is the marked correct answer actually incorrect?
    2. IRRELEVANT OPTIONS: Are the options completely unrelated to the question?
    3. FORMATTING: Are there typos, duplicates, or nonsense text?
    
    Questions JSON:
    ${JSON.stringify(questions)}
    
    Return a JSON object with this structure:
    {
      "issues": [
        {
          "questionIndex": number, // 0-based index of the question in the list
          "issueType": "wrong_answer" | "irrelevant_option" | "formatting",
          "description": "Short explanation of the error",
          "suggestedFix": { ...question object with the fix applied ... }
        }
      ]
    }
    
    Only report ACTUAL errors. Do not nitpick. If a question is technically correct, ignore it.
    Return ONLY JSON.
  `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = JSON.parse(repairJson(text));
    }
    return json as ValidationResult;

  } catch (error) {
    console.warn("Primary AI (Gemini) unavailable for validation, switching to Backup (Groq)...");
    return await _validateWithGroq(questions, topic);
  }
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
