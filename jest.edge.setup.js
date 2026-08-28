/**
 * Clears test leftovers *before* the run, so a suite that crashed last time
 * can't skew this one's results, and confirms the stack is reachable while the
 * error can still name what to start.
 */
const { edgeStack } = require("./test-utils/edge/clients");
const { sweepTestArtifacts } = require("./test-utils/edge/fixtures");

module.exports = async () => {
  const stack = edgeStack();

  const res = await fetch(`${stack.url}/functions/v1/newsletter-unsubscribe`, {
    method: "PUT",
    headers: { apikey: stack.anonKey },
  }).catch((error) => {
    throw new Error(
      `No Supabase stack answering at ${stack.url} (${error.message}).\n` +
        "Start one with `npx supabase start`, then re-run `npm run test:edge`.",
    );
  });
  // 405 is the function saying "wrong method" — i.e. functions are being served.
  // 404 is the gateway saying there is no such function to serve.
  if (res.status === 404 || res.status >= 500) {
    throw new Error(
      `Edge functions are not being served at ${stack.url} (got ${res.status}).\n` +
        "Run `npx supabase functions serve --env-file supabase/functions/.env`.",
    );
  }

  if (!stack.openAiKey) {
    console.log("[edge] OPENAI_API_KEY unset — embedding-backed tests will be skipped.");
  }
  await sweepTestArtifacts();
};
