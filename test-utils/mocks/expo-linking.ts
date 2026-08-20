/**
 * Test double for `expo-linking`.
 *
 *   jest.mock("expo-linking", () => require("@/test-utils/mocks/expo-linking"));
 *
 * `__setLinkingURL` stands in for the URL that launched the app — the only
 * place a native deep link's `#fragment` survives.
 */
let linkingUrl: string | null = null;

export const __setLinkingURL = (url: string | null) => {
  linkingUrl = url;
};

export const __resetLinking = () => {
  linkingUrl = null;
};

export const useLinkingURL = () => linkingUrl;
export const useURL = () => linkingUrl;
export const getLinkingURL = jest.fn(() => linkingUrl);
export const getInitialURL = jest.fn(() => Promise.resolve(linkingUrl));
export const createURL = jest.fn(
  (path: string) => `com.fife.app://${String(path).replace(/^\//, "")}`,
);
export const parse = jest.fn(() => ({ path: null, queryParams: {} }));
export const addEventListener = jest.fn(() => ({ remove: jest.fn() }));
export const openURL = jest.fn(() => Promise.resolve());
