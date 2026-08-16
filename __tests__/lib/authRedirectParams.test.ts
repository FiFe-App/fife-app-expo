import {
  describeAuthRedirectError,
  getAuthRedirectTokens,
  parseAuthRedirectFragment,
} from "@/lib/auth/authRedirectParams";

describe("parseAuthRedirectFragment", () => {
  it("reads the session Supabase sends back on success", () => {
    expect(
      parseAuthRedirectFragment(
        "access_token=header.payload.signature&refresh_token=abc123&expires_in=3600&type=signup",
      ),
    ).toEqual({
      access_token: "header.payload.signature",
      refresh_token: "abc123",
      expires_in: "3600",
      type: "signup",
    });
  });

  it("keeps a value that contains an equals sign intact", () => {
    expect(parseAuthRedirectFragment("access_token=abc==&type=signup")).toEqual({
      access_token: "abc==",
      type: "signup",
    });
  });

  it("decodes the percent- and plus-encoding Supabase uses for messages", () => {
    expect(
      parseAuthRedirectFragment("error_description=Email+link+is+invalid+or+has+expired"),
    ).toEqual({ error_description: "Email link is invalid or has expired" });
  });

  it("tolerates a leading hash and empty segments", () => {
    expect(parseAuthRedirectFragment("#&type=signup&")).toEqual({ type: "signup" });
  });

  it("has nothing to report for a missing or empty fragment", () => {
    expect(parseAuthRedirectFragment(undefined)).toBeNull();
    expect(parseAuthRedirectFragment("")).toBeNull();
  });
});

describe("getAuthRedirectTokens", () => {
  it("returns the pair only when both tokens are present", () => {
    expect(getAuthRedirectTokens({ access_token: "a", refresh_token: "r" })).toEqual({
      access_token: "a",
      refresh_token: "r",
    });
    expect(getAuthRedirectTokens({ access_token: "a" })).toBeNull();
    expect(getAuthRedirectTokens({ error: "access_denied" })).toBeNull();
    expect(getAuthRedirectTokens(null)).toBeNull();
  });
});

describe("describeAuthRedirectError", () => {
  it("translates the codes we have wording for", () => {
    expect(
      describeAuthRedirectError({ error: "access_denied", error_code: "otp_expired" }),
    ).toBe("Ez a link lejárt, vagy már felhasználtad. Kérj egy újat!");
  });

  it("falls back to the description Supabase supplied", () => {
    expect(
      describeAuthRedirectError({
        error: "server_error",
        error_description: "Database error saving new user",
      }),
    ).toBe("Database error saving new user");
  });

  it("falls back to the bare code when there is no description", () => {
    expect(describeAuthRedirectError({ error: "server_error" })).toBe("server_error");
  });

  it("stays quiet for a successful redirect", () => {
    expect(describeAuthRedirectError({ access_token: "a", refresh_token: "r" })).toBeNull();
    expect(describeAuthRedirectError(null)).toBeNull();
  });
});
