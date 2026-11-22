import { fetchHelpers, fetchOffersHelp } from "@/lib/chat/helpers";
import {
  __resetSupabase,
  __setTableRows,
  supabase,
} from "@/test-utils/mocks/supabase";

const realFrom = supabase.from.getMockImplementation()!;

beforeEach(() => {
  __resetSupabase();
  supabase.from.mockImplementation(realFrom);
});

const byId = (helpers: { id: string }[]) => helpers.map((h) => h.id).sort();

describe("fetchHelpers", () => {
  it("lists people with I-HELP-YOU on, with their note, leaving out me and people I blocked", async () => {
    // The mock ignores filters, so the same rows answer both the I-HELP-YOU
    // and the MESSAGE read: everyone here can be messaged.
    __setTableRows("contacts", {
      data: [
        { author: "anna", title: " Esténként ráérek " },
        { author: "bela", title: null },
        { author: "me", title: "self" },
        { author: "blocked", title: null },
      ],
      error: null,
    });
    __setTableRows("profiles", {
      data: [
        { id: "anna", full_name: "Anna", username: "anna", avatar_url: null },
        { id: "bela", full_name: "Béla", username: null, avatar_url: null },
        { id: "blocked", full_name: "X", username: null, avatar_url: null },
      ],
      error: null,
    });
    __setTableRows("blocked_users", {
      data: [{ blocked_id: "blocked" }],
      error: null,
    });

    const { helpers, error } = await fetchHelpers("me");

    expect(error).toBeNull();
    expect(byId(helpers)).toEqual(["anna", "bela"]);
    expect(helpers.find((h) => h.id === "anna")?.note).toBe("Esténként ráérek");
    expect(helpers.find((h) => h.id === "bela")?.note).toBeNull();
  });

  it("leaves out helpers who switched direct messages off", async () => {
    let contactsReads = 0;
    __setTableRows("profiles", {
      data: [
        { id: "anna", full_name: "Anna", username: null, avatar_url: null },
        { id: "bela", full_name: "Béla", username: null, avatar_url: null },
      ],
      error: null,
    });
    supabase.from.mockImplementation((table: string) => {
      if (table === "contacts") {
        contactsReads += 1;
        __setTableRows("contacts", {
          data:
            contactsReads === 1
              ? [{ author: "anna", title: null }, { author: "bela", title: null }]
              : [{ author: "anna" }],
          error: null,
        });
      }
      return realFrom(table);
    });

    const { helpers } = await fetchHelpers("me");

    expect(byId(helpers)).toEqual(["anna"]);
  });

  it("returns nothing without further reads when nobody offers help", async () => {
    __setTableRows("contacts", { data: [], error: null });

    const { helpers, error } = await fetchHelpers("me");

    expect(helpers).toEqual([]);
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it("reports a failed read", async () => {
    __setTableRows("contacts", { data: null, error: { message: "down" } });

    expect(await fetchHelpers("me")).toEqual({ helpers: [], error: "down" });
  });
});

describe("fetchOffersHelp", () => {
  it("reads a switched-on I-HELP-YOU contact", async () => {
    __setTableRows("contacts", { data: [{ id: 1 }], error: null });
    expect(await fetchOffersHelp("me")).toBe(true);
  });

  it("reads no contact as off", async () => {
    __setTableRows("contacts", { data: [], error: null });
    expect(await fetchOffersHelp("me")).toBe(false);
  });

  it("reports an unknown result when the read fails", async () => {
    __setTableRows("contacts", { data: null, error: { message: "down" } });
    expect(await fetchOffersHelp("me")).toBeNull();
  });
});
