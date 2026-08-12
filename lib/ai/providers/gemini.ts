import "server-only";

import type { ChatProvider, GenerateInput } from "@/lib/ai/types";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

/**
 * Gemini uses its own request shape: `contents` with `parts`, "model" instead
 * of "assistant", and the system prompt in a separate `systemInstruction`.
 */
export const geminiProvider: ChatProvider = {
  name: "gemini",

  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),

  async generate(input: GenerateInput, signal: AbortSignal): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY as string,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: input.system }] },
          contents: input.messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            maxOutputTokens: input.maxTokens ?? 600,
            temperature: 0.7,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`gemini ${response.status}: ${(await response.text()).slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();

    if (!text) throw new Error("gemini returned an empty response");
    return text;
  },
};
