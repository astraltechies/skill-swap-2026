export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateInput {
  messages: ChatMessage[];
  system: string;
  maxTokens?: number;
}

export type ProviderName = "gemini" | "groq" | "mistral";

export interface ChatProvider {
  name: ProviderName;
  /** False when the key is missing, so the chain skips it without an attempt. */
  isConfigured(): boolean;
  generate(input: GenerateInput, signal: AbortSignal): Promise<string>;
}

/** Thrown when every configured provider failed. Carries the per-provider reasons. */
export class AllProvidersFailedError extends Error {
  constructor(readonly reasons: Record<string, string>) {
    super("All providers failed");
    this.name = "AllProvidersFailedError";
  }
}
