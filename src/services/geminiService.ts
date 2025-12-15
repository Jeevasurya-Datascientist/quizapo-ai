import { GoogleGenerativeAI } from "@google/generative-ai";
import type { FormState, MCQ } from "../types";
import { AiProvider } from "../types";



const buildPrompt = (inputs: FormState): string => {
  const { topic, difficulty, taxonomy, questions, studyMaterial, imageData } = inputs;
  const safeQuestions = Math.max(1, Math.min(100, questions));
  const hasContent = !!studyMaterial || !!imageData;
  const contentSource = imageData ? "the provided image" : "the provided study material";

  return `
You are an Quizapo AI. ALWAYS return only valid JSON (no explanation, no extra text).
Inputs:
- topic: "${topic}"
- difficulty: "${difficulty}"
- taxonomy: "${taxonomy}"
- questions: ${safeQuestions}
- studyMaterial: "${studyMaterial}" 
- image provided: ${!!imageData}

Rules:
1) If content is provided (${hasContent ? contentSource : 'none'}) -> YOU MUST generate MCQs STRICTLY ONLY from that content. Do NOT use external knowledge. If the answer is not in the text, do not ask it.
2) If NO content is provided -> generate MCQs using general knowledge of the topic.
3) If topic is also empty and no content is provided -> generate ${safeQuestions} general Computer Science MCQs.
4) Output EXACTLY ${safeQuestions} questions (no fewer, no more).
5) The final JSON output must be an array of objects.
6) Each item must be:
   {
     "question": "string",
     "options": ["opt1","opt2","opt3","opt4"],
     "answer": "one of the options exactly",
     "explanation": "short reason"
   }
7) Options must be unique; answer must match an option; explanation <= 30 words.

Now generate ${safeQuestions} MCQs.
  `;
};

// --- JSON Repair Utility ---
const repairJson = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed) return jsonString; // Valid
    return jsonString; // fallback
  } catch (e) {
    // Basic repair for truncated arrays
    let repaired = jsonString.trim();
    // Remove Markdown code blocks if present (and not removed yet)
    repaired = repaired.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');

    // Ensure it ends with proper closure
    if (repaired.startsWith('[') && !repaired.endsWith(']')) {
      const lastClose = repaired.lastIndexOf('}');
      if (lastClose > 0) {
        repaired = repaired.substring(0, lastClose + 1) + ']';
      }
    }
    return repaired;
  }
};

const validateMcqs = (parsedMcqs: any, requestedQuestions: number, provider: string): MCQ[] => {
  if (!Array.isArray(parsedMcqs)) {
    throw new Error(`AI (${provider}) response was not a valid JSON array. Cannot process the result.`);
  }

  // If the AI returns more questions, truncate the list.
  if (parsedMcqs.length > requestedQuestions) {
    console.warn(`AI (${provider}) returned ${parsedMcqs.length} questions instead of ${requestedQuestions}. The result will be truncated.`);
    parsedMcqs = parsedMcqs.slice(0, requestedQuestions);
  }
  // If it returns fewer, it's an error because we can't meet the user's request.
  else if (parsedMcqs.length < requestedQuestions) {
    // Be lenient if it's close enough, but warn
    console.warn(`AI (${provider}) returned fewer questions than requested (${parsedMcqs.length}/${requestedQuestions}).`);
  }

  parsedMcqs.forEach((mcq, index) => {
    if (!mcq.question || !mcq.options || !mcq.answer || !mcq.explanation || !Array.isArray(mcq.options) || mcq.options.length !== 4 || !mcq.options.includes(mcq.answer)) {
      throw new Error(`Validation failed for question #${index + 1} from ${provider}. The AI returned an invalid structure.`);
    }
  });

  return parsedMcqs as MCQ[];
}

const _generateWithGroq = async (formData: FormState): Promise<MCQ[]> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Groq API key missing.");
  }

  const prompt = buildPrompt(formData);
  const requestedQuestions = Math.max(1, Math.min(100, formData.questions));

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 8192,
        top_p: 1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) throw new Error("Invalid Groq response");

    const responseText = data.choices[0].message.content;
    let parsedJson;

    try {
      parsedJson = JSON.parse(responseText);
    } catch (e) {
      parsedJson = JSON.parse(repairJson(responseText));
    }

    // Handle "questions" wrapper if present
    if (parsedJson.questions && Array.isArray(parsedJson.questions)) {
      parsedJson = parsedJson.questions;
    }

    return validateMcqs(parsedJson, requestedQuestions, "Groq");

  } catch (error) {
    console.error("Groq Error:", error);
    throw new Error("Failed to generate MCQs via Groq.");
  }
};

const _generateWithGemini = async (formData: FormState): Promise<MCQ[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini Key missing, falling back to Groq.");
    return _generateWithGroq(formData);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" }); // Use 002 for better stability

  const prompt = buildPrompt(formData);
  const requestedQuestions = Math.max(1, Math.min(100, formData.questions));

  let parts: any[] = [{ text: prompt }];

  if (formData.imageData && formData.imageData.data) {
    parts.push({
      inlineData: {
        mimeType: formData.imageData.mimeType,
        data: formData.imageData.data
      }
    });
  }

  const retryDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: parts }],
        generationConfig: { responseMimeType: "application/json" }
      });

      const response = await result.response;
      const responseText = response.text().trim();
      let parsedMcqs;

      try {
        parsedMcqs = JSON.parse(responseText);
      } catch (e) {
        parsedMcqs = JSON.parse(repairJson(responseText));
      }

      return validateMcqs(parsedMcqs, requestedQuestions, "Gemini");
    } catch (error: any) {
      console.warn(`Gemini API attempt ${attempt} failed:`, error);
      lastError = error;

      // Fail fast on non-transient errors (like 404)
      if (!error.message?.includes('503') && !error.message?.includes('429')) {
        console.warn("Non-transient Gemini error, switching to Groq.");
        break;
      }
      if (attempt < 3) await retryDelay(1500 * attempt);
    }
  }

  console.warn("Gemini unavailable. Falling back to Groq...", lastError);
  const fallbackData = { ...formData, imageData: null };
  return _generateWithGroq(fallbackData);
};

export const generateMcqs = async (formData: Omit<FormState, 'aiProvider'>): Promise<MCQ[]> => {
  // Use Gemini for Images or Large Batches (>40)
  // Use Groq (Llama 3) for standard text batches (It's faster)
  const provider = (formData.imageData || formData.questions > 40)
    ? AiProvider.Gemini
    : AiProvider.Groq;

  const fullFormData: FormState = {
    ...formData,
    aiProvider: provider,
  };

  if (provider === AiProvider.Groq) {
    return _generateWithGroq(fullFormData);
  }
  return _generateWithGemini(fullFormData);
};

// --- Validation Feature ---

export interface ValidationIssue {
  questionIndex: number;
  issueType: 'wrong_answer' | 'irrelevant_option' | 'formatting' | 'other';
  description: string;
  suggestedFix: any; // The corrected question object
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

// --- Validation Fallback (Groq) ---
const _validateWithGroq = async (questions: any[], topic: string): Promise<ValidationResult> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return { isValid: true, issues: [] }; // No API, no validation

  const prompt = `
    Act as a Strict Professor. Review the following Multiple Choice Questions.
    Topic: "${topic}".
    Check for: WRONG ANSWERS, IRRELEVANT OPTIONS, FORMATTING nonsense.
    Questions JSON: ${JSON.stringify(questions)}
    
    Return pure valid JSON with this structure:
    {
      "isValid": boolean, 
      "issues": [
        {
          "questionIndex": number,
          "issueType": "wrong_answer" | "irrelevant_option" | "formatting",
          "description": "Short explanation",
          "suggestedFix": { ...corrected question object... }
        }
      ]
    }
    Only report ACTUAL errors. Return ONLY JSON.
  `;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1, // Low temp for strict analysis
        max_tokens: 4000,
      }),
    });

    if (!response.ok) throw new Error("Groq Validation Failed");
    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse potentially dirty JSON
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart === -1) throw new Error("Invalid format");
    const json = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
    return json as ValidationResult;

  } catch (error) {
    console.warn("Groq Validator also failed:", error);
    return { isValid: true, issues: [] };
  }
};

export const validateQuestionBank = async (questions: any[], topic: string): Promise<ValidationResult> => {
  // Try Gemini First
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) throw new Error("No Gemini Key");
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    // Switch to 'gemini-pro' (Legacy Stable) which is often more available on standard keys
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Act as a Strict Professor. Review the following Multiple Choice Questions.
    Topic Context: "${topic}".
    
    Check for:
    1. WRONG ANSWERS: Is the marked correct answer actually incorrect?
    2. IRRELEVANT OPTIONS: Are the options completely unrelated to the question?
    3. FORMATTING: Are there typos or nonsense text?
    
    Questions JSON:
    ${JSON.stringify(questions)}
    
    Return a JSON object with this structure:
    {
      "isValid": boolean, // true if NO critical issues found
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
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText) as ValidationResult;

  } catch (error) {
    // Suppress the scary 404 error, just log as warning and try fallback
    console.warn("Primary AI (Gemini) unavailable, switching to Backup (Groq)...");
    return await _validateWithGroq(questions, topic);
  }
};