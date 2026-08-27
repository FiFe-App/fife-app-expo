/**
 * Conditional `describe`s for the edge-function suites.
 *
 * Kept out of `fixtures.ts` because that module is also loaded by Jest's
 * globalSetup, where the `describe` global does not exist yet.
 */

/**
 * Skips when there is no OpenAI key to spend: the paths behind it call the real
 * API, so they need network and cost money on every run.
 */
export const describeWithOpenAI = process.env.OPENAI_API_KEY ? describe : describe.skip;
