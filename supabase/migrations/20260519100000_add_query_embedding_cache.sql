-- Cache table for buziness search query embeddings.
-- Keyed on SHA-256 of the normalised query + model version.
-- Enables the business-search edge function to skip OpenAI calls for repeated queries.
-- Access: RLS enabled with no policies → only service_role (edge functions) can read/write.

CREATE TABLE public.query_embedding_cache (
  query_hash    text                        NOT NULL,
  model_version text                        NOT NULL,
  query_text    text                        NOT NULL,
  embedding_text text                       NOT NULL,
  embedding     extensions.vector(512)      NOT NULL,
  hit_count     integer                     NOT NULL DEFAULT 1,
  created_at    timestamptz                 NOT NULL DEFAULT now(),
  last_used_at  timestamptz                 NOT NULL DEFAULT now(),

  PRIMARY KEY (query_hash, model_version)
);

ALTER TABLE public.query_embedding_cache ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.query_embedding_cache IS
  'Cache of OpenAI query embeddings (SHA-256 keyed). '
  'Only the business-search edge function (service_role) may access this table. '
  'Changing MODEL_VERSION in the edge function automatically bypasses stale entries.';
