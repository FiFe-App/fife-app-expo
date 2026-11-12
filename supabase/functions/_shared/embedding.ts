/** Shared prompt for GPT keyword expansion before embedding. */
export const embedding_instructions =
  "Írj 10-12 kulcsszót vesszővel elválasztva, amik megkülönböztetik ezt a témát másoktól. Csak specifikus, egyedi szavakat adj meg — ne általánosakat. Ne írj semmit, ha nincs értelme.";

/** The embedding model every listing/request/query vector comes from (512 dims). */
export const EMBEDDING_MODEL = "text-embedding-3-large";
export const EMBEDDING_DIMENSIONS = 512;
/**
 * Versions the pipeline below, so cached query vectors from another pipeline are never
 * reused. business-search keeps its own copy of the same string.
 */
export const EMBEDDING_MODEL_VERSION = "gpt-4.1-mini/text-embedding-3-large";

/** Structural type of the bits of the OpenAI client used here (the SDK is imported by callers). */
interface OpenAILike {
  responses: {
    create(args: Record<string, unknown>): Promise<{ output_text: string }>;
  };
  embeddings: {
    create(args: Record<string, unknown>): Promise<{ data: { embedding: number[] }[] }>;
  };
}

/**
 * The pipeline a biznisz goes through on save, as one call: GPT keyword expansion
 * (`embedding_text`, searchable as text) and then the vector of that expansion (`embedding`).
 */
export async function embedText(
  openai: OpenAILike,
  input: string,
  { temperature = 0.3, maxOutputTokens = 1000 }: { temperature?: number; maxOutputTokens?: number } = {},
): Promise<{ embedding_text: string; embedding: number[] }> {
  const completion = await openai.responses.create({
    model: "gpt-4.1-mini",
    temperature,
    instructions: embedding_instructions,
    input,
    max_output_tokens: maxOutputTokens,
  });
  const embedding_text = completion.output_text;
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: embedding_text,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return { embedding_text, embedding: response.data[0].embedding };
}

/** What a request says about itself, for embedding: title, keywords, description. */
export function requestEmbeddingInput(request: {
  title: string;
  tags?: string[] | null;
  description?: string | null;
}): string {
  return [request.title, (request.tags ?? []).join(", "), request.description ?? ""]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(". ");
}
