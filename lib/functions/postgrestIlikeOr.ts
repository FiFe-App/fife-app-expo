/**
 * Builds `ilike` filters for PostgREST `or=(...)` expressions out of user input.
 *
 * postgrest-js interpolates filter strings into the query verbatim, so a raw
 * search term reaches two parsers that both treat parts of it as syntax:
 *
 *  - PostgREST's logic tree: inside `or=(...)`, `,` separates conditions, `.`
 *    separates `column.operator.value` and `(` `)` `:` build nested trees.
 *    Double-quoting the value neutralises all of them; inside the quotes only
 *    `"` stays special.
 *  - SQL LIKE: `%` and `_` are wildcards, and PostgREST additionally accepts
 *    `*` as an alias for `%`. Quoting does not disable that alias, so the
 *    wildcards have to be handled here.
 *
 * Backslashes are stripped rather than escaped: `\` is LIKE's default escape
 * character, and a pattern ending in a bare one raises SQLSTATE 22025. `_` is
 * deliberately left alone — stripping it would break a `kis_pista` username
 * search, while keeping it only widens the match by a single character.
 */

/** Longest query turned into a LIKE pattern; anything past this is dropped. */
export const MAX_SEARCH_LENGTH = 64;

/**
 * Strips everything that could break out of an `or=(...)` expression or widen
 * the LIKE pattern. Returns "" when nothing usable is left — callers must treat
 * that as "no search", never as "match everything".
 */
export function sanitizeIlikeQuery(raw: string): string {
  return raw
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/[\\%*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH)
    .trim();
}

/**
 * One PostgREST `or` expression matching `query` as a case-insensitive
 * substring of any of `columns`. Null when the query has no usable characters.
 *
 *   buildIlikeOrFilter(["full_name", "username"], "Kovács, János (Dr.)")
 *     => 'full_name.ilike."%Kovács, János (Dr.)%",username.ilike."%Kovács, János (Dr.)%"'
 */
export function buildIlikeOrFilter(
  columns: string[],
  query: string,
): string | null {
  const cleaned = sanitizeIlikeQuery(query);
  if (!cleaned) return null;
  // The backslash is consumed by PostgREST's quoted-value parser, so LIKE never
  // sees it — which is why this is the one character we escape instead of drop.
  const value = cleaned.replace(/"/g, "\\\"");
  return columns.map((column) => `${column}.ilike."%${value}%"`).join(",");
}
