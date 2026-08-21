/**
 * Test double for `expo-router`.
 *
 * The real router needs a mounted `ExpoRoot` with a file-system route context,
 * which unit tests do not have. This mock keeps the surface the registration
 * screens use and records navigation so tests can assert on it:
 *
 *   jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
 *
 * `Link` presses are recorded as `router.navigate(href)` — the mock does not
 * model push/replace semantics, only *where* a link would take the user.
 */
import React from "react";
import { Text } from "react-native";

type SearchParams = Record<string, string | string[] | undefined>;

export const router = {
  navigate: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  setParams: jest.fn(),
  dismissAll: jest.fn(),
  dismissTo: jest.fn(),
};

let pathname = "/csatlakozom";
let globalSearchParams: SearchParams = {};
let localSearchParams: SearchParams = {};

/** Sets the route the screen under test believes it is rendered at. */
export const __setPathname = (next: string) => {
  pathname = next;
};

/** Params visible to every screen — `useGlobalSearchParams`. */
export const __setGlobalSearchParams = (next: SearchParams) => {
  globalSearchParams = next;
};

/** Params of the focused screen — `useLocalSearchParams`. */
export const __setLocalSearchParams = (next: SearchParams) => {
  localSearchParams = next;
};

/** Clears recorded navigation and route state. Call from `beforeEach`. */
export const __resetRouter = () => {
  pathname = "/csatlakozom";
  globalSearchParams = {};
  localSearchParams = {};
  (Object.values(router) as jest.Mock[]).forEach((fn) => fn.mockClear());
};

export const usePathname = () => pathname;
export const useGlobalSearchParams = () => globalSearchParams;
export const useLocalSearchParams = () => localSearchParams;
export const useSegments = () => pathname.split("/").filter(Boolean);
export const useRouter = () => router;
export const useNavigation = () => ({ setOptions: jest.fn(), addListener: jest.fn() });

/**
 * The real hook re-runs the effect every time the screen regains focus. Screens
 * are mounted directly in tests, so "mounted" and "focused" are the same thing.
 */
export const useFocusEffect = (effect: React.EffectCallback) => {
  React.useEffect(effect, [effect]);
};

export const Redirect = ({ href }: { href: unknown }) => (
  <Text testID="redirect">{resolveHref(href)}</Text>
);

export const Link = ({
  href,
  asChild,
  children,
  ...rest
}: {
  href: unknown;
  asChild?: boolean;
  children?: React.ReactNode;
} & Record<string, unknown>) => {
  const onPress = () => router.navigate(resolveHref(href));

  if (asChild && React.isValidElement(children)) {
    // `Link asChild` renders through a Radix `Slot`: the link's own props reach
    // the child, but props the child sets itself win on conflict.
    const childProps = children.props as Record<string, unknown>;
    return React.cloneElement(children, { ...rest, ...childProps, onPress } as never);
  }

  return (
    <Text onPress={onPress} {...rest}>
      {children as React.ReactNode}
    </Text>
  );
};

export const Stack = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
Stack.Screen = function Screen() {
  return null;
};

export const Slot = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

function resolveHref(href: unknown): string {
  if (typeof href === "string") return href;
  if (href && typeof href === "object" && "pathname" in href) {
    return String((href as { pathname: unknown }).pathname);
  }
  return String(href);
}
