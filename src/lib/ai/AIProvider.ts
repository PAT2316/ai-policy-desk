/**
 * Interface d'abstraction multi-fournisseur (Phase 2, ADR-006).
 * Seule AnthropicProvider est branchée au MVP ; OpenAIProvider/GeminiProvider
 * pourront implémenter cette même interface sans changer le code appelant.
 */
export interface AIGenerationRequest {
  promptContent: string; // contenu du PromptVersion, déjà résolu avec les variables du questionnaire
  maxTokens?: number;
}

export interface AIGenerationResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface AIProvider {
  readonly providerCode: string;
  generate(request: AIGenerationRequest): Promise<AIGenerationResult>;
}
