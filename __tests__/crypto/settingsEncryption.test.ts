import { decryptSettings } from "@/lib/crypto/settingsEncryption";
import { decryptJson } from "@/lib/crypto/userKey";

jest.mock("@/lib/crypto/userKey", () => ({
  decryptJson: jest.fn(),
  encryptJson: jest.fn(),
}));

const mockedDecryptJson = decryptJson as jest.MockedFunction<typeof decryptJson>;

const CIPHER = { data: "x", nonce: "y" };
const blob = (extra: Record<string, unknown>) => ({
  mantra: "légy jó",
  tasks: [],
  previousSearches: ["kerítés"],
  ...extra,
});

const read = async () => decryptSettings("uid", CIPHER);

describe("decryptSettings", () => {
  it("passes a stored profile-search list straight through", async () => {
    mockedDecryptJson.mockResolvedValue(blob({ previousProfileSearches: ["Pista"] }));

    expect((await read())?.previousProfileSearches).toEqual(["Pista"]);
  });

  it("keeps an explicit empty list, which is a real clear from another device", async () => {
    mockedDecryptJson.mockResolvedValue(blob({ previousProfileSearches: [] }));

    expect((await read())?.previousProfileSearches).toEqual([]);
  });

  it("reports a blob written before the field as absent, not empty", async () => {
    // The distinction is the whole point: useUserSettings falls back to this
    // device's list on undefined, but lets [] win. Normalising to [] here would
    // silently wipe the local list on the first sync after upgrading.
    mockedDecryptJson.mockResolvedValue(blob({}));

    const settings = await read();
    expect(settings?.previousProfileSearches).toBeUndefined();
    expect(settings?.previousSearches).toEqual(["kerítés"]);
  });

  it("treats a tampered non-array as absent rather than trusting it", async () => {
    mockedDecryptJson.mockResolvedValue(blob({ previousProfileSearches: "Pista" }));

    expect((await read())?.previousProfileSearches).toBeUndefined();
  });

  it("still normalises the buziness list to an empty array when absent", async () => {
    // Deliberately asymmetric with the field above: this one has always been
    // written by every client, so absent can only mean corrupt.
    mockedDecryptJson.mockResolvedValue({ mantra: "x", tasks: [] });

    expect((await read())?.previousSearches).toEqual([]);
  });

  it("returns null when the blob cannot be decrypted at all", async () => {
    mockedDecryptJson.mockResolvedValue(null);

    expect(await read()).toBeNull();
  });
});
