import type { Database } from "@/database.types";

/** One row of the requests_feed RPC: a request with its author and counters. */
export type RequestItem =
  Database["public"]["Functions"]["requests_feed"]["Returns"][number];

/**
 * Which slice of the requests the feed returns. Mirrors p_scope of requests_feed:
 *  - for_me: open, near me and not mine; the ones that fit my bizniszek come first
 *  - all:    every open request
 *  - mine:   my own, open and solved
 *  - solved: archived (solved) requests
 */
export type RequestScope = "for_me" | "all" | "mine" | "solved";

export const REQUEST_SCOPES: { key: RequestScope; label: string; icon: string }[] = [
  { key: "all", label: "Mind", icon: "format-list-bulleted" },
  { key: "for_me", label: "Neked", icon: "account-heart-outline" },
  { key: "mine", label: "Saját", icon: "account-outline" },
  { key: "solved", label: "Megoldott", icon: "check-circle-outline" },
];

/** Mirrors the CHECK constraints on public.requests. */
export const REQUEST_LIMITS = {
  titleMin: 3,
  titleMax: 120,
  descriptionMax: 2000,
  tagsMax: 10,
  imagesMax: 4,
  openMax: 10,
} as const;

/** Radius choices (meters) offered on the form; the column accepts 100..200000. */
export const REQUEST_RADIUS_OPTIONS: { value: number; label: string }[] = [
  { value: 1000, label: "1 km" },
  { value: 3000, label: "3 km" },
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
];
export const DEFAULT_REQUEST_RADIUS = 5000;
