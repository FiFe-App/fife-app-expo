/**
 * The biznisz page as a stranger sees it.
 *
 * A public biznisz is reachable with nothing but the link — no account, no
 * login — because that is what a link shared on Facebook has to open. The page
 * still has to know the difference: a visitor cannot recommend, save or chat,
 * and a biznisz the policy hides from them must say so instead of spinning.
 */
import { screen } from "@testing-library/react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/components/mapView/FiFeMap", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});
jest.mock("@/components/mapView/mapView", () => {
  const { View } = require("react-native");
  return { __esModule: true, Marker: View };
});
jest.mock("@/components/media/MediaView", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});
jest.mock("react-native-open-maps", () => jest.fn());
jest.mock("@/hooks/useMyLocation", () => ({
  useMyLocation: () => ({ myLocation: null }),
}));

import BuzinessDetail from "@/app/biznisz/[id]";
import { login } from "@/redux/reducers/userReducer";
import { __resetRouter, __setGlobalSearchParams } from "@/test-utils/mocks/expo-router";
import { __resetSupabase, __setTableRow, __setTableRows } from "@/test-utils/mocks/supabase";
import { createTestStore, renderWithProviders } from "@/test-utils/renderWithProviders";

const AUTHOR = "author-1";

const PUBLIC_BUZINESS = {
  id: 12,
  title: "Kerékpárszerviz $ bicikli",
  description: "Bármit megjavítok.",
  author: AUTHOR,
  created_at: new Date().toISOString(),
  images: null,
  location: null,
  ingyen: false,
  public: true,
  defaultContact: 5,
  profiles: { full_name: "Kovács Anna", avatar_url: null },
  buzinessRecommendations: [],
};

const CONTACTS = [
  { id: 5, author: AUTHOR, type: "TEL", data: "+3612345678", title: "Telefon" },
  { id: 6, author: AUTHOR, type: "MESSAGE", data: AUTHOR, title: "Üzenet" },
];

const signedIn = () => {
  const store = createTestStore();
  store.dispatch(login({ uid: "member-1", name: "Tag" }));
  return store;
};

beforeEach(() => {
  __resetRouter();
  __resetSupabase();
  __setGlobalSearchParams({ id: "12" });
  __setTableRow("buziness", { data: PUBLIC_BUZINESS, error: null });
  __setTableRows("contacts", { data: CONTACTS, error: null });
  __setTableRow("comments", { data: { count: 0 }, error: null });
});

describe("biznisz detail / signed out", () => {
  it("shows a public biznisz to somebody who only has the link", async () => {
    await renderWithProviders(<BuzinessDetail />);

    expect(await screen.findByText("Kerékpárszerviz")).toBeOnTheScreen();
    expect(screen.getByText("Bármit megjavítok.")).toBeOnTheScreen();
  });

  it("offers signing up instead of the member-only actions", async () => {
    await renderWithProviders(<BuzinessDetail />);

    expect(await screen.findByText("Csatlakozz, hogy ajánlhasd")).toBeOnTheScreen();
    expect(screen.queryByText("Ajánlom")).toBeNull();
  });

  it("leaves out the in-app message contact a visitor could not open", async () => {
    await renderWithProviders(<BuzinessDetail />);

    // The phone contact is the default one, so it is both the page's main
    // button and a row of the contacts card.
    expect(await screen.findAllByText("Telefon")).not.toHaveLength(0);
    expect(screen.queryByText("Üzenet")).toBeNull();
  });

  it("asks a visitor to sign in when the biznisz is not theirs to see", async () => {
    __setTableRow("buziness", { data: null, error: null });

    await renderWithProviders(<BuzinessDetail />);

    expect(await screen.findByText("Nem látható")).toBeOnTheScreen();
    expect(screen.getByText("Csatlakozom")).toBeOnTheScreen();
  });
});

describe("biznisz detail / signed in", () => {
  it("keeps the member actions where they were", async () => {
    await renderWithProviders(<BuzinessDetail />, { store: signedIn() });

    expect(await screen.findByText("Kerékpárszerviz")).toBeOnTheScreen();
    expect(screen.queryByText("Csatlakozz, hogy ajánlhasd")).toBeNull();
  });
});
