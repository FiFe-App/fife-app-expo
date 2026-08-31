import { act } from "@testing-library/react-native";

import { useUserSettings } from "@/hooks/useUserSettings";
import { decryptSettings, encryptSettings } from "@/lib/crypto/settingsEncryption";
import { addPreviousSearch, login } from "@/redux/reducers/userReducer";
import { __resetSupabase, __setTableRow, supabase } from "@/test-utils/mocks/supabase";
import {
  createTestStore,
  renderHookWithProviders,
  TestStore,
} from "@/test-utils/renderWithProviders";

// Keeps this a test of the merge, not of tweetnacl: the real module drags in
// SecureStore and the user's key.
jest.mock("@/lib/crypto/settingsEncryption", () => ({
  decryptSettings: jest.fn(),
  encryptSettings: jest.fn(),
}));

const mockedDecrypt = decryptSettings as jest.MockedFunction<typeof decryptSettings>;
const mockedEncrypt = encryptSettings as jest.MockedFunction<typeof encryptSettings>;

/** A settings row as PostgREST returns it. */
const serverRow = () => ({
  author: "me",
  encrypted_data: "cipher",
  nonce: "nonce",
  theme_preference: "auto",
  saved_buzinesses: [],
  is_it_safe_dismissed: false,
  invite_card_dismissed: false,
  home_add_buziness_card_dismissed: false,
  home_messaging_card_dismissed: false,
  chat_last_read: {},
  updated_at: "2026-01-01T00:00:00Z",
});

const loggedInWithFifeSearch = (query: string) => {
  const store = createTestStore();
  store.dispatch(login("me"));
  store.dispatch(addPreviousSearch({ query, mode: "fife" }));
  return store;
};

const load = async (store: TestStore) => {
  const { result } = await renderHookWithProviders(() => useUserSettings(), { store });
  await act(async () => {
    await result.current.loadFromServer();
  });
};

/** Did anything get written back to user_settings during this test? */
const upsertCalls = () =>
  supabase.from.mock.results.flatMap(
    (r) => ((r.value as Record<string, jest.Mock>).upsert as jest.Mock).mock.calls,
  );

beforeEach(() => {
  __resetSupabase();
  mockedEncrypt.mockResolvedValue({ data: "cipher", nonce: "nonce" });
});

describe("useUserSettings / loading a blob that predates previousProfileSearches", () => {
  it("keeps this device's fifék history instead of wiping it", async () => {
    __setTableRow("user_settings", { data: serverRow(), error: null });
    // An older client wrote this blob: the key simply is not there.
    mockedDecrypt.mockResolvedValue({
      mantra: undefined,
      tasks: [],
      previousSearches: ["kerítés"],
      previousProfileSearches: undefined,
    });
    const store = loggedInWithFifeSearch("Nagy Pista");

    await load(store);

    expect(store.getState().user.previousProfileSearches).toEqual(["Nagy Pista"]);
    // The server does own the buziness list, so that one is replaced.
    expect(store.getState().user.previousSearches).toEqual(["kerítés"]);
  });

  it("does not bounce a corrective write back at the server", async () => {
    // hydrateSettings must write back exactly what loadFromServer merged. If it
    // skips previousProfileSearches, redux and the synced snapshot disagree and
    // the debounced push clobbers another device's list on every launch.
    __setTableRow("user_settings", { data: serverRow(), error: null });
    mockedDecrypt.mockResolvedValue({
      mantra: undefined,
      tasks: [],
      previousSearches: [],
      previousProfileSearches: undefined,
    });

    await load(loggedInWithFifeSearch("Nagy Pista"));

    expect(upsertCalls()).toHaveLength(0);
  });
});

describe("useUserSettings / loading a blob that has the field", () => {
  it("lets the server's list win, including a deliberate clear", async () => {
    __setTableRow("user_settings", { data: serverRow(), error: null });
    mockedDecrypt.mockResolvedValue({
      mantra: undefined,
      tasks: [],
      previousSearches: [],
      previousProfileSearches: [],
    });

    const store = loggedInWithFifeSearch("Nagy Pista");
    await load(store);

    expect(store.getState().user.previousProfileSearches).toEqual([]);
  });

  it("hydrates a list the server knows about", async () => {
    __setTableRow("user_settings", { data: serverRow(), error: null });
    mockedDecrypt.mockResolvedValue({
      mantra: undefined,
      tasks: [],
      previousSearches: [],
      previousProfileSearches: ["Kovács Anna"],
    });

    const store = loggedInWithFifeSearch("Nagy Pista");
    await load(store);

    expect(store.getState().user.previousProfileSearches).toEqual(["Kovács Anna"]);
  });

  it("keeps the local list when the whole blob fails to decrypt", async () => {
    __setTableRow("user_settings", { data: serverRow(), error: null });
    mockedDecrypt.mockResolvedValue(null);

    const store = loggedInWithFifeSearch("Nagy Pista");
    await load(store);

    expect(store.getState().user.previousProfileSearches).toEqual(["Nagy Pista"]);
  });
});

describe("useUserSettings / pushing", () => {
  it("puts the fifék history inside the encrypted blob, not a plain column", async () => {
    // No row yet: loadFromServer seeds the server from local state.
    __setTableRow("user_settings", { data: null, error: null });
    const store = loggedInWithFifeSearch("Nagy Pista");

    await load(store);

    expect(mockedEncrypt).toHaveBeenCalledWith(
      "me",
      expect.objectContaining({ previousProfileSearches: ["Nagy Pista"] }),
    );
    const written = upsertCalls().at(-1)?.[0] as Record<string, unknown>;
    expect(written).not.toHaveProperty("previous_profile_searches");
    expect(written.encrypted_data).toBe("cipher");
  });
});
