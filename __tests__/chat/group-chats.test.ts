import {
  fetchGroupMembership,
  fetchPublicGroupChats,
  groupChatKey,
  joinGroupChat,
  leaveGroupChat,
} from "@/lib/chat/groupChats";
import {
  __resetSupabase,
  __setTableRow,
  __setTableRows,
  supabase,
} from "@/test-utils/mocks/supabase";

beforeEach(() => __resetSupabase());

const group = {
  id: "g1",
  title: "FiFe Chat csoport",
  description: null,
  is_public: true,
  created_at: "2026-09-01T00:00:00Z",
};

describe("groupChatKey", () => {
  it("keeps group keys apart from 1:1 chat keys (user ids)", () => {
    expect(groupChatKey("g1")).toBe("group:g1");
  });
});

describe("fetchGroupMembership", () => {
  it("reads a member row as membership", async () => {
    __setTableRows("group_chat_members", { data: [{ user_id: "me" }], error: null });
    expect(await fetchGroupMembership("g1", "me")).toBe(true);
  });

  it("reads no row as not a member", async () => {
    __setTableRows("group_chat_members", { data: [], error: null });
    expect(await fetchGroupMembership("g1", "me")).toBe(false);
  });

  it("reports an unknown result when the check fails", async () => {
    __setTableRows("group_chat_members", { data: null, error: { message: "boom" } });
    expect(await fetchGroupMembership("g1", "me")).toBeNull();
  });
});

describe("joinGroupChat", () => {
  it("upserts the caller's membership without touching an existing joined_at", async () => {
    expect(await joinGroupChat("g1", "me")).toBe(true);

    const builder = supabase.from.mock.results.at(-1)?.value;
    expect(supabase.from).toHaveBeenLastCalledWith("group_chat_members");
    expect(builder.upsert).toHaveBeenCalledWith(
      { group_id: "g1", user_id: "me" },
      { onConflict: "group_id,user_id", ignoreDuplicates: true },
    );
  });

  it("reports a failed join", async () => {
    __setTableRows("group_chat_members", { data: null, error: { message: "rls" } });
    expect(await joinGroupChat("g1", "me")).toBe(false);
  });
});

describe("leaveGroupChat", () => {
  it("deletes only the caller's membership", async () => {
    expect(await leaveGroupChat("g1", "me")).toBe(true);

    const builder = supabase.from.mock.results.at(-1)?.value;
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("group_id", "g1");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "me");
  });
});

describe("fetchPublicGroupChats", () => {
  it("summarises each public group with its latest message and author", async () => {
    __setTableRows("group_chats", { data: [group], error: null });
    __setTableRows("group_chat_messages", {
      data: [{ id: 1, group_id: "g1", author: "u2", text: "Sziasztok!", reply_to: null, created_at: "2026-09-02T00:00:00Z" }],
      error: null,
    });
    __setTableRows("group_chat_members", { data: [{ user_id: "me" }], error: null, count: 3 });
    __setTableRow("profiles", { data: { full_name: "Kovács Anna" }, error: null });

    const [summary] = await fetchPublicGroupChats("me");

    expect(summary.group.title).toBe("FiFe Chat csoport");
    expect(summary.lastMessage?.text).toBe("Sziasztok!");
    expect(summary.lastMessageAuthorName).toBe("Kovács Anna");
    expect(summary.memberCount).toBe(3);
    expect(summary.isMember).toBe(true);
  });

  it("labels my own last message as mine", async () => {
    __setTableRows("group_chats", { data: [group], error: null });
    __setTableRows("group_chat_messages", {
      data: [{ id: 1, group_id: "g1", author: "me", text: "Hali", reply_to: null, created_at: "2026-09-02T00:00:00Z" }],
      error: null,
    });

    const [summary] = await fetchPublicGroupChats("me");
    expect(summary.lastMessageAuthorName).toBe("Te");
  });

  it("returns nothing when groups can't be loaded", async () => {
    __setTableRows("group_chats", { data: null, error: { message: "boom" } });
    expect(await fetchPublicGroupChats("me")).toEqual([]);
  });
});
