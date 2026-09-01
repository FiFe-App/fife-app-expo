/**
 * The two ends of an invite link: building it, and writing the record it
 * eventually produces.
 */
import { getInviteUrl } from "@/lib/invitations/inviteLink";
import { recordInvitation } from "@/lib/invitations/recordInvitation";
import { __resetSupabase, __setTableRows, supabase } from "@/test-utils/mocks/supabase";

const upsertOf = (table: string): jest.Mock | null => {
  const index = supabase.from.mock.calls.findIndex(([called]) => called === table);
  if (index < 0) return null;
  return supabase.from.mock.results[index].value.upsert as jest.Mock;
};

beforeEach(() => {
  __resetSupabase();
});

describe("invitation / the link", () => {
  it("points at the public site, not at the app scheme", () => {
    // Whoever receives it does not have the app yet — that is the whole point.
    expect(getInviteUrl("inviter-1")).toBe("https://fifeapp.hu/meghivo/inviter-1");
  });
});

describe("invitation / recording", () => {
  it("writes the pair and tolerates the row the sign-up trigger already made", async () => {
    expect(await recordInvitation("guest-1", "author-1")).toBe(true);

    expect(upsertOf("invitations")).toHaveBeenCalledWith(
      { author: "author-1", guest: "guest-1" },
      { onConflict: "guest", ignoreDuplicates: true },
    );
  });

  it("does not send a self-invite the database would reject anyway", async () => {
    expect(await recordInvitation("same-user", "same-user")).toBe(false);

    expect(upsertOf("invitations")).toBeNull();
  });

  it("does nothing without both sides", async () => {
    expect(await recordInvitation("", "author-1")).toBe(false);
    expect(await recordInvitation("guest-1", "")).toBe(false);

    expect(upsertOf("invitations")).toBeNull();
  });

  it("reports a rejected write instead of failing the registration", async () => {
    __setTableRows("invitations", { data: null, error: { message: "denied" } });

    expect(await recordInvitation("guest-1", "author-1")).toBe(false);
  });

  it("survives a request that never completes a round trip", async () => {
    supabase.from.mockImplementationOnce(() => {
      throw new Error("Network request failed");
    });

    // The last screen of the registration must not blow up over an invite.
    expect(await recordInvitation("guest-1", "author-1")).toBe(false);
  });
});
