/**
 * Coming back to the page you were actually after.
 *
 * A link to a members-only page hands a signed-out visitor to the login screen
 * and the address they came for is gone from the URL. These cover both ways it
 * is kept — the parameter a "sign in first" button carries, and the launch
 * address captured before the router rewrote it — and the one rule that must
 * not slip: the target is always a path inside this app.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

import Login from "@/app/login";
import {
  __clearAttemptedPath,
  getLoginHref,
  isProtectedPath,
  rememberAttemptedPath,
  sanitizeRedirectTarget,
  takeAttemptedPath,
} from "@/lib/auth/loginRedirect";
import {
  __resetRouter,
  __setLocalSearchParams,
  router,
} from "@/test-utils/mocks/expo-router";
import { auth, __resetSupabase, __setTableRow } from "@/test-utils/mocks/supabase";
import { inputByLabel } from "@/test-utils/paper";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("sanitizeRedirectTarget", () => {
  it("keeps a path inside the app", () => {
    expect(sanitizeRedirectTarget("/chats")).toBe("/chats");
    expect(sanitizeRedirectTarget("/user/abc?tab=1")).toBe("/user/abc?tab=1");
    // expo-router hands repeated params back as an array.
    expect(sanitizeRedirectTarget(["/chats", "/home"])).toBe("/chats");
  });

  it("refuses anything that could send the user off the app", () => {
    expect(sanitizeRedirectTarget("https://evil.example")).toBeNull();
    expect(sanitizeRedirectTarget("//evil.example")).toBeNull();
    expect(sanitizeRedirectTarget("javascript:alert(1)")).toBeNull();
    expect(sanitizeRedirectTarget("com.fife.app://home")).toBeNull();
    expect(sanitizeRedirectTarget("chats")).toBeNull();
    expect(sanitizeRedirectTarget(undefined)).toBeNull();
  });
});

describe("isProtectedPath", () => {
  it("knows the pages that need an account", () => {
    expect(isProtectedPath("/chats")).toBe(true);
    expect(isProtectedPath("/user/abc")).toBe(true);
    expect(isProtectedPath("/biznisz/new")).toBe(true);
  });

  it("knows the pages a visitor is already allowed on", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login?redirected_from=/chats")).toBe(false);
    expect(isProtectedPath("/csatlakozom/iranyelvek")).toBe(false);
    expect(isProtectedPath("/meghivo/abc")).toBe(false);
    expect(isProtectedPath("/user/password-reset")).toBe(false);
    // A shared biznisz opens without an account.
    expect(isProtectedPath("/biznisz/12")).toBe(false);
  });
});

describe("the remembered address", () => {
  beforeEach(__clearAttemptedPath);

  it("is handed out once, then forgotten", () => {
    rememberAttemptedPath("/chats");

    expect(takeAttemptedPath()).toBe("/chats");
    expect(takeAttemptedPath()).toBeNull();
  });

  it("ignores a page the visitor was never locked out of", () => {
    rememberAttemptedPath("/csatlakozom");
    rememberAttemptedPath("https://evil.example/chats");

    expect(takeAttemptedPath()).toBeNull();
  });
});

describe("getLoginHref", () => {
  it("carries the page a locked link was pointing at", () => {
    expect(getLoginHref("/user/abc")).toEqual({
      pathname: "/login",
      params: { redirected_from: "/user/abc" },
    });
  });

  it("is the plain login screen when there is nothing to come back to", () => {
    expect(getLoginHref(null)).toBe("/login");
    expect(getLoginHref("https://evil.example")).toBe("/login");
  });
});

describe("the login screen", () => {
  const signInSucceeds = () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    __setTableRow("profiles", {
      data: { id: "user-1", full_name: "Tag", viewed_functions: null },
      error: null,
    });
  };

  const signIn = async () => {
    await fireEvent.changeText(inputByLabel("E-mail"), "tag@example.com");
    await fireEvent.changeText(inputByLabel("Jelszó"), "titok");
    await fireEvent.press(screen.getByRole("button", { name: "Bejelentkezés" }));
  };

  beforeEach(() => {
    __resetRouter();
    __resetSupabase();
    __clearAttemptedPath();
    __setLocalSearchParams({});
    signInSucceeds();
  });

  it("goes on to the page the link was for", async () => {
    __setLocalSearchParams({ redirected_from: "/chats" });

    await renderWithProviders(<Login />);
    await signIn();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/chats"));
  });

  it("goes on to the address the router took away when it bounced them here", async () => {
    rememberAttemptedPath("/user/abc");

    await renderWithProviders(<Login />);
    await signIn();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/user/abc"));
  });

  it("lands on the home page when there was no locked link", async () => {
    await renderWithProviders(<Login />);
    await signIn();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });

  it("will not be talked into sending the user to another site", async () => {
    __setLocalSearchParams({ redirected_from: "https://evil.example" });

    await renderWithProviders(<Login />);
    await signIn();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });
});
