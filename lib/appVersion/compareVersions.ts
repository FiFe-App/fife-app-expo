/**
 * Semver-ish comparison, matching `public.parse_app_version` in
 * `20260819120000_add_app_version_gate.sql` — the two have to agree, or the
 * client and the server would disagree about who is out of date.
 *
 * Rules, in both places: only the first three numeric components count, a
 * missing component is 0 ("1.2" === "1.2.0"), and anything unparseable
 * degrades to 0 instead of throwing.
 */
export const parseVersion = (version: string | null | undefined): number[] => {
  const numeric = (version ?? "")
    // "v1.2.3-beta.4" -> "1.2.3"
    .replace(/^[^0-9]*/, "")
    .replace(/[^0-9.].*$/, "");

  const parts = numeric
    .split(".")
    .map((part) => (/^[0-9]{1,15}$/.test(part) ? Number(part) : null))
    .filter((part): part is number => part !== null);

  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
};

/** Negative when `a` is older than `b`, 0 when equal, positive when newer. */
export const compareVersions = (
  a: string | null | undefined,
  b: string | null | undefined,
): number => {
  const left = parseVersion(a);
  const right = parseVersion(b);

  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
};

export const isOlderThan = (
  version: string | null | undefined,
  other: string | null | undefined,
): boolean => compareVersions(version, other) < 0;
