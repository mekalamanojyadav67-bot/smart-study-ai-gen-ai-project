import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { extractText } from "unpdf";

export const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-4-hydrogen";

export interface HandlerResult {
  status: number;
  data: Record<string, unknown>;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add GEMINI_API_KEY in your environment variables (e.g. Vercel Project Settings > Environment Variables) or Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("UNAVAILABLE");
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      const delayMs = 600 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function formatApiError(err: unknown): HandlerResult {
  const raw =
    err instanceof Error ? err.message : "An unexpected AI service error occurred.";
  if (raw.includes("GEMINI_API_KEY is not configured")) {
    return { status: 500, data: { error: raw } };
  }
  if (
    raw.includes("API_KEY_INVALID") ||
    raw.includes("PERMISSION_DENIED") ||
    raw.includes("403")
  ) {
    return {
      status: 403,
      data: {
        error:
          "Gemini API key was rejected. Please verify GEMINI_API_KEY in your environment variables or Settings > Secrets.",
      },
    };
  }
  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
    return {
      status: 429,
      data: {
        error: "Gemini API rate limit reached. Please wait a moment and try again.",
      },
    };
  }
  if (raw.includes("NOT_FOUND") || raw.includes("404")) {
    return {
      status: 404,
      data: {
        error: `Requested Gemini model (${MODEL_NAME}) was not found or is unavailable for this API key.`,
      },
    };
  }
  return { status: 500, data: { error: raw } };
}

function trimNotesForPrompt(notes: string, maxChars = 45000): string {
  const cleaned = notes.trim();
  if (cleaned.length <= maxChars) return cleaned;
  return cleaned.slice(0, maxChars) + "\n\n[Notes truncated due to length.]";
}

export async function handleExtractPdf(body: {
  base64Data?: string;
  fileName?: string;
}): Promise<HandlerResult> {
  try {
    const { base64Data, fileName } = body ?? {};
    if (!base64Data || typeof base64Data !== "string") {
      return { status: 400, data: { error: "Missing PDF file data." } };
    }

    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.byteLength === 0) {
      return { status: 400, data: { error: "Uploaded PDF file is empty." } };
    }

    let extractedText = "";
    let totalPages = 0;
    let method: "text-parser" | "gemini-vision" = "text-parser";

    try {
      const result = await extractText(new Uint8Array(buffer), {
        mergePages: true,
      });
      extractedText = (result.text ?? "").trim();
      totalPages = result.totalPages ?? 0;
    } catch {
      extractedText = "";
    }

    if (extractedText.replace(/\s+/g, "").length < 40) {
      const ai = getGeminiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64Data,
                },
              },
              {
                text: "Extract and transcribe all readable study notes, headings, formulas, and bullet points from this PDF document cleanly into plain text. Preserve structure with headings and line breaks. Return only the extracted study content.",
              },
            ],
          },
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        })
      );
      extractedText = (response.text ?? "").trim();
      method = "gemini-vision";
    }

    if (!extractedText) {
      return {
        status: 422,
        data: {
          error: `Could not extract readable text from ${fileName || "this PDF"}. Try pasting the notes manually.`,
        },
      };
    }

    return {
      status: 200,
      data: {
        text: extractedText,
        pages: totalPages,
        method,
      },
    };
  } catch (err) {
    return formatApiError(err);
  }
}

export async function handleSummarize(body: {
  notes?: string;
  title?: string;
}): Promise<HandlerResult> {
  try {
    const { notes, title } = body ?? {};
    if (!notes || typeof notes !== "string" || notes.trim().length < 20) {
      return {
        status: 400,
        data: {
          error:
            "Please provide at least 20 characters of study notes before generating a summary.",
        },
      };
    }

    const ai = getGeminiClient();
    const promptNotes = trimNotesForPrompt(notes);

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyze these study notes${title ? ` (Topic: ${title})` : ""} and create a comprehensive, easy-to-understand study guide:\n\n${promptNotes}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            "You are Smart Study AI, an expert academic tutor. Transform student notes into clear, well-structured summaries. Highlight the most important exam-worthy points, and explain difficult or technical concepts in simple, everyday English with relatable analogies. Stay strictly faithful to the provided study notes.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "A concise, descriptive title for these study notes.",
              },
              overview: {
                type: Type.STRING,
                description:
                  "An easy-to-understand 3 to 5 sentence summary explaining the core message of the notes in plain English.",
              },
              importantPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  "6 to 8 high-value takeaway bullet points capturing essential facts.",
              },
              difficultTopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: {
                      type: Type.STRING,
                      description: "Name of the complex concept or mechanism.",
                    },
                    simpleExplanation: {
                      type: Type.STRING,
                      description:
                        "Plain-English explanation written so a beginner can grasp it effortlessly.",
                    },
                    analogy: {
                      type: Type.STRING,
                      description:
                        "A concrete, everyday real-world analogy illustrating the concept.",
                    },
                  },
                  required: ["topic", "simpleExplanation", "analogy"],
                },
                description:
                  "3 to 5 challenging concepts from the notes explained in simple English.",
              },
              keyTerms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING },
                  },
                  required: ["term", "definition"],
                },
                description: "4 to 6 essential vocabulary terms and crisp definitions.",
              },
            },
            required: [
              "title",
              "overview",
              "importantPoints",
              "difficultTopics",
              "keyTerms",
            ],
          },
        },
      })
    );

    const jsonText = (response.text ?? "").trim();
    if (!jsonText) {
      throw new Error("The AI returned an empty summary. Please try again.");
    }

    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    return { status: 200, data: parsed };
  } catch (err) {
    return formatApiError(err);
  }
}

export async function handleGenerateQuiz(body: {
  notes?: string;
  count?: number;
  title?: string;
}): Promise<HandlerResult> {
  try {
    const { notes, count, title } = body ?? {};
    if (!notes || typeof notes !== "string" || notes.trim().length < 20) {
      return {
        status: 400,
        data: {
          error:
            "Please provide at least 20 characters of study notes before generating a quiz.",
        },
      };
    }

    const questionCount = count === 5 || count === 10 || count === 20 ? count : 5;
    const ai = getGeminiClient();
    const promptNotes = trimNotesForPrompt(notes);

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate exactly ${questionCount} multiple-choice quiz questions based strictly on the following study notes${title ? ` (Topic: ${title})` : ""}. Ensure questions test genuine comprehension across all parts of the material, with 4 plausible answer options each and clear explanations.\n\n${promptNotes}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            "You are an expert educational assessment designer. Create accurate, unambiguous multiple-choice questions strictly grounded in the provided notes. Every question MUST have exactly 4 distinct options, a valid 0-based correctIndex (0, 1, 2, or 3), and a helpful explanation referencing why the correct answer is right.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: {
                type: Type.STRING,
                description: "Short topic title for this quiz.",
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Exactly 4 answer choices.",
                    },
                    correctIndex: {
                      type: Type.INTEGER,
                      description:
                        "Zero-based index (0, 1, 2, or 3) of the correct option.",
                    },
                    explanation: {
                      type: Type.STRING,
                      description:
                        "Clear explanation of why the correct answer is right.",
                    },
                  },
                  required: [
                    "id",
                    "question",
                    "options",
                    "correctIndex",
                    "explanation",
                  ],
                },
              },
            },
            required: ["topic", "questions"],
          },
        },
      })
    );

    const jsonText = (response.text ?? "").trim();
    if (!jsonText) {
      throw new Error("The AI returned an empty quiz. Please try again.");
    }

    const parsed = JSON.parse(jsonText) as {
      topic: string;
      questions: Array<{
        id: number;
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
      }>;
    };

    const sanitizedQuestions = (parsed.questions || [])
      .filter((q) => q.question && Array.isArray(q.options) && q.options.length >= 2)
      .slice(0, questionCount)
      .map((q, idx) => {
        const fourOptions = q.options.slice(0, 4);
        while (fourOptions.length < 4) {
          fourOptions.push(`None of the above (${fourOptions.length + 1})`);
        }
        const validIndex =
          Number.isInteger(q.correctIndex) &&
          q.correctIndex >= 0 &&
          q.correctIndex < 4
            ? q.correctIndex
            : 0;
        return {
          id: idx + 1,
          question: q.question,
          options: fourOptions,
          correctIndex: validIndex,
          explanation:
            q.explanation || "Review the study notes for details on this concept.",
        };
      });

    if (sanitizedQuestions.length === 0) {
      throw new Error(
        "Could not generate valid quiz questions from the provided notes."
      );
    }

    return {
      status: 200,
      data: {
        topic: parsed.topic || title || "Study Quiz",
        questions: sanitizedQuestions,
      },
    };
  } catch (err) {
    return formatApiError(err);
  }
}

export async function handleGenerateFlashcards(body: {
  notes?: string;
  title?: string;
}): Promise<HandlerResult> {
  try {
    const { notes, title } = body ?? {};
    if (!notes || typeof notes !== "string" || notes.trim().length < 20) {
      return {
        status: 400,
        data: {
          error:
            "Please provide at least 20 characters of study notes before generating flashcards.",
        },
      };
    }

    const ai = getGeminiClient();
    const promptNotes = trimNotesForPrompt(notes);

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Create 10 high-impact question-and-answer study flashcards from these notes${title ? ` (Topic: ${title})` : ""}. Focus on key definitions, mechanisms, comparisons, and cause-effect relationships.\n\n${promptNotes}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            "You are Smart Study AI. Create concise, memorable active-recall flashcards grounded strictly in the provided study notes. Each front should be a clear question or prompt, each back should be a crisp 1-3 sentence answer, and each hint should offer a subtle memory cue without giving away the answer.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: {
                type: Type.STRING,
                description: "Topic title for the flashcard deck.",
              },
              cards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    front: {
                      type: Type.STRING,
                      description: "Question or prompt on the front of the card.",
                    },
                    back: {
                      type: Type.STRING,
                      description: "Clear, accurate answer on the back of the card.",
                    },
                    hint: {
                      type: Type.STRING,
                      description: "Optional short memory cue.",
                    },
                  },
                  required: ["id", "front", "back", "hint"],
                },
              },
            },
            required: ["topic", "cards"],
          },
        },
      })
    );

    const jsonText = (response.text ?? "").trim();
    if (!jsonText) {
      throw new Error("The AI returned empty flashcards. Please try again.");
    }

    const parsed = JSON.parse(jsonText) as {
      topic: string;
      cards: Array<{ id: number; front: string; back: string; hint: string }>;
    };

    const cards = (parsed.cards || [])
      .filter((c) => c.front && c.back)
      .map((c, idx) => ({
        id: idx + 1,
        front: c.front,
        back: c.back,
        hint: c.hint || "Recall the core concept from your notes.",
      }));

    if (cards.length === 0) {
      throw new Error("Could not generate flashcards from these notes.");
    }

    return {
      status: 200,
      data: {
        topic: parsed.topic || title || "Flashcard Deck",
        cards,
      },
    };
  } catch (err) {
    return formatApiError(err);
  }
}
