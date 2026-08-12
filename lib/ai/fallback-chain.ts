import "server-only";

import { geminiProvider } from "@/lib/ai/providers/gemini";
import { groqProvider, mistralProvider } from "@/lib/ai/providers/openai-compatible";
import {
  AllProvidersFailedError,
  type ChatProvider,
  type GenerateInput,
  type ProviderName,
} from "@/lib/ai/types";

const REGISTRY: Record<ProviderName, ChatProvider> = {
  gemini: geminiProvider,
  groq: groqProvider,
  mistral: mistralProvider,
};

const DEFAULT_ORDER: ProviderName[] = ["gemini", "groq", "mistral"];

const TIMEOUT_MS = 8000;

/** Order comes from env so it can be changed without a code deploy. */
function resolveOrder(): ChatProvider[] {
  const configured = process.env.AI_PROVIDER_ORDER?.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ProviderName => s in REGISTRY);

  const order = configured?.length ? configured : DEFAULT_ORDER;
  return order.map((name) => REGISTRY[name]);
}

export interface GenerateResult {
  text: string;
  providerUsed: ProviderName;
  /** Providers that were tried and failed before this one answered. */
  attempted: ProviderName[];
}

/**
 * Tries each configured provider in order and returns the first usable answer.
 *
 * Falls through on timeout, rate limit, server error or an empty response —
 * all the ways a free tier fails in practice. A provider with no API key set
 * is skipped without an attempt, so the app runs on one, two or three keys.
 */
export async function generateWithFallback(input: GenerateInput): Promise<GenerateResult> {
  const providers = resolveOrder().filter((p) => p.isConfigured());

  if (providers.length === 0) {
    throw new AllProvidersFailedError({
      config: "No AI provider keys are set. Add GEMINI_API_KEY, GROQ_API_KEY or MISTRAL_API_KEY.",
    });
  }

  const reasons: Record<string, string> = {};
  const attempted: ProviderName[] = [];

  for (const provider of providers) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const text = await provider.generate(input, controller.signal);
      return { text, providerUsed: provider.name, attempted };
    } catch (error) {
      attempted.push(provider.name);
      reasons[provider.name] =
        error instanceof Error
          ? error.name === "AbortError"
            ? `timed out after ${TIMEOUT_MS}ms`
            : error.message
          : String(error);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new AllProvidersFailedError(reasons);
}

/** Which providers are usable right now — surfaced in the SkillBot UI. */
export function configuredProviders(): ProviderName[] {
  return resolveOrder()
    .filter((p) => p.isConfigured())
    .map((p) => p.name);
}
