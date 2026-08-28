# Edge function integration tests

These run the real edge functions against a real Supabase stack over HTTP —
gateway, auth, Postgres, storage and all. They are **not** part of `npm test`;
that suite stays hermetic. Run them on purpose:

```bash
npx supabase start                 # once; also applies migrations + seed.sql
npm run test:edge
```

`npm run test:edge` reads the stack's URL and keys from `supabase status`, so
there is normally nothing to export. To point it somewhere else, set
`EDGE_TEST_SUPABASE_URL`, `EDGE_TEST_ANON_KEY` and `EDGE_TEST_SERVICE_ROLE_KEY`.

## The database is left as it was found

Every row a test creates is either owned by a throwaway auth user — deleted in
the suite's `afterAll`, taking its profile, contacts, buziness rows, messages and
recommendations with it via `ON DELETE CASCADE` — or tracked explicitly and
deleted by the same hook (embedding-cache entries, newsletter suppressions,
storage objects).

As a backstop, everything these tests write carries a marker: emails end in
`@fife-edge-test.invalid` and titles start with `edge-test-`. A sweep for that
marker runs both **before** the first suite and **after** the last one, so a run
that crashes half-way still leaves the database clean, and the next run starts
from a clean slate.

Nothing outside the marker is ever touched, and the runner refuses to start
against the production project — or any non-local URL, unless you set
`EDGE_TEST_ALLOW_REMOTE=1` (production is refused either way).

## What needs which credentials

| Needs | Covered without it |
| --- | --- |
| nothing beyond the local stack | auth gates, validation, ownership, world/ingyen filters, paging, unsubscribe tokens, storage cleanup, user deletion |
| `OPENAI_API_KEY` | creating/updating a buziness (the embedding is generated before the insert) and hybrid text search + its embedding cache |

Without `OPENAI_API_KEY` those two blocks skip and the rest still runs. With it,
put the key where the functions can see it too:

```bash
echo 'OPENAI_API_KEY=sk-...' >> supabase/functions/.env
npx supabase functions serve --env-file supabase/functions/.env   # if not already served
OPENAI_API_KEY=sk-... npm run test:edge
```

The same applies to `NEWSLETTER_SECRET`: the unsubscribe tests mint tokens with
the secret this process sees, so it has to match the one the functions run with.
Unset on both sides is fine — both fall back to the service role key.

`fill-embeddings` is only tested up to its gate on purpose: the job re-embeds
every row in the database and bills every call to OpenAI.
