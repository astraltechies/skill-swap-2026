import "server-only";

import type { ChatProvider, GenerateInput } from "@/lib/ai/types";

/*
 * An alias rather than a pinned version, because Google retires specific model
 * ids on its own schedule — `gemini-2.0-flash` and `gemini-2.5-flash` both 404
 * on a current key already, and a chatbot that dies because a version string
 * aged out is exactly what the fallback chain exists to avoid.
 *
 * The *lite* alias specifically: the standard flash model is a thinking model,
 * and measured on this prompt it spent 706 tokens reasoning before writing a
 * word, taking 5.4s. That is both close enough to the chain's 8s timeout to
 * fail on a slow connection, and enough to blow a small output budget so the
 * reply arrives cut off mid-sentence. Lite answers the same question in 1.3s
 * with no thinking overhead. Override with GEMINI_MODEL to pin or upgrade.
 */
const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";

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
