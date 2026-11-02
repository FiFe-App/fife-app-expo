import type { RequestItem } from "@/lib/requests/types";

/** A requests_feed row; override what a test cares about. */
export const makeRequest = (overrides: Partial<RequestItem> = {}): RequestItem => ({
  id: 1,
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  author: "other-uid",
  author_name: "Kiss Anna",
  author_avatar: null,
  title: "Kertészt keresek Újpesten",
  description: "Fűnyírás és sövényvágás egy hétvégén.",
  tags: ["kertészet", "sövény"],
  images: [],
  lat: 47.56,
  long: 19.09,
  radius: 5000,
  status: "open",
  solved_at: null,
  distance: 3200,
  comment_count: 0,
  is_match: false,
  ...overrides,
});
