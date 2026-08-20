import {
  enableMessaging,
  fetchMessagingEnabled,
} from "@/lib/chat/messagingContact";
import {
  __resetSupabase,
  __setTableRows,
  supabase,
} from "@/test-utils/mocks/supabase";

beforeEach(() => __resetSupabase());

describe("fetchMessagingEnabled", () => {
  it("reads the contact as enabled", async () => {
    __setTableRows("contacts", {
      data: [{ id: 1, data: "true" }],
      error: null,
    });

    expect(await fetchMessagingEnabled("me")).toBe(true);
  });

  it("reads a missing contact as disabled", async () => {
    __setTableRows("contacts", { data: [], error: null });

    expect(await fetchMessagingEnabled("me")).toBe(false);
  });

  it("reads an empty contact value as disabled", async () => {
    __setTableRows("contacts", { data: [{ id: 1, data: "" }], error: null });

    expect(await fetchMessagingEnabled("me")).toBe(false);
  });

  it("survives duplicate MESSAGE contacts instead of erroring", async () => {
    // The old `.maybeSingle()` read failed with PGRST116 here, and the caller
    // dropped the error and showed messaging as off.
    __setTableRows("contacts", {
      data: [
        { id: 1, data: "true" },
        { id: 2, data: "true" },
      ],
      error: null,
    });

    expect(await fetchMessagingEnabled("me")).toBe(true);
  });

  it("reports an unknown result rather than a false negative", async () => {
    __setTableRows("contacts", {
      data: null,
      error: { message: "network down" },
    });

    expect(await fetchMessagingEnabled("me")).toBeNull();
  });
});

describe("enableMessaging", () => {
  it("updates the existing contact instead of adding another", async () => {
    __setTableRows("contacts", { data: [{ id: 7, data: "" }], error: null });

    expect(await enableMessaging("me")).toEqual({});

    // from() is called twice: once to read, once to write.
    const write = supabase.from.mock.results[1].value;
    expect(write.update).toHaveBeenCalledWith({ data: "true", public: true });
    expect(write.insert).not.toHaveBeenCalled();
  });

  it("reuses the first row when duplicates already exist", async () => {
    __setTableRows("contacts", {
      data: [
        { id: 7, data: "" },
        { id: 9, data: "" },
      ],
      error: null,
    });

    await enableMessaging("me");

    const write = supabase.from.mock.results[1].value;
    expect(write.insert).not.toHaveBeenCalled();
    expect(write.eq).toHaveBeenCalledWith("id", 7);
  });

  it("creates the contact when there is none", async () => {
    __setTableRows("contacts", { data: [], error: null });

    await enableMessaging("me");

    const write = supabase.from.mock.results[1].value;
    expect(write.insert).toHaveBeenCalledWith(
      expect.objectContaining({ author: "me", type: "MESSAGE", data: "true" }),
    );
  });

  it("surfaces a failed read instead of inserting blind", async () => {
    __setTableRows("contacts", {
      data: null,
      error: { message: "permission denied" },
    });

    expect(await enableMessaging("me")).toEqual({ error: "permission denied" });

    // A failed read must not lead to a write at all.
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });
});
