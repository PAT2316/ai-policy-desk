import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIGenerationRequest, AIGenerationResult } from "./AIProvider";

const MODEL = "claude-sonnet-4-6";

export class AnthropicProvider implements AIProvider {
  readonly providerCode = "anthropic";
  private client: Anthropic;

  constructor(apiKey: string = process.env.ANTHROPIC_API_KEY ?? "") {
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquant");
    this.client = new Anthropic({ apiKey });
  }

  async generate(request: AIGenerationRequest): Promise<AIGenerationResult> {
    const start = Date.now();

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: request.maxTokens ?? 4000,
      messages: [{ role: "user", content: request.promptContent }],
    });

    const textBlock = response.content.find((block) => block.type === "text");

    return {
      text: textBlock?.type === "text" ? textBlock.text : "",
      model: MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs: Date.now() - start,
    };
  }
}

/** Sélection du fournisseur actif via variable d'environnement (ADR-006). */
export function getActiveAIProvider(): AIProvider {
  const providerName = process.env.AI_PROVIDER ?? "anthropic";
  switch (providerName) {
    case "anthropic":
      return new AnthropicProvider();
    // case "openai": return new OpenAIProvider();   // emplacement prévu, non implémenté au MVP
    // case "gemini": return new GeminiProvider();   // emplacement prévu, non implémenté au MVP
    default:
      throw new Error(`Fournisseur IA non supporté: ${providerName}`);
  }
}
