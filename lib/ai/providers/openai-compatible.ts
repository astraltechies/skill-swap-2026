import "server-only";

import type { ChatProvider, GenerateInput, ProviderName } from "@/lib/ai/types";

/**
 * Groq and Mistral both speak the OpenAI chat-completions format, so they
 * share one implementation and differ only in host, model and key.
 */
function openAICompatible(config: {
  name: ProviderName;
  endpoint: string;
  model: string;
  apiKeyEnv: string;
}): ChatProvider {
  return {
    name: config.name,

    isConfigured: () => Boolean(process.env[config.apiKeyEnv]),

    async generate(input: GenerateInput, signal: AbortSignal): Promise<string> {
      const response = await fetch(config.endpoint, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env[config.apiKeyEnv]}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: "system", content: input.system }, ...input.messages],
          max_tokens: input.maxTokens ?? 600,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `${config.name} ${response.status}: ${(await response.text()).slice(0, 200)}`,
        );
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim();

      if (!text) throw new Error(`${config.name} returned an empty response`);
      return text;
    },
  };
}

export const groqProvider = openAICompatible({
  name: "groq",
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  apiKeyEnv: "GROQ_API_KEY",
});

export const mistralProvider = openAICompatible({
  name: "mistral",
  endpoint: "https://api.mistral.ai/v1/chat/completions",
  model: process.env.MISTRAL_MODEL ?? "mistral-small-latest",
  apiKeyEnv: "MISTRAL_API_KEY",
});
