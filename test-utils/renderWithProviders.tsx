import {
  render,
  renderHook,
  type RenderOptions,
} from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactElement, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { Provider } from "react-redux";

import { lightTheme } from "@/assets/theme";
import { rootReducer } from "@/redux/store";

export type TestStore = ReturnType<typeof createTestStore>;

/**
 * A store with the app's real reducers but without `redux-persist`, so each
 * test starts from a clean slate. Build the starting state by dispatching the
 * same actions the app dispatches — that keeps the setup honest about how a
 * user actually reaches that state.
 */
export const createTestStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });

export type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  store?: TestStore;
};

export const renderWithProviders = async (
  ui: ReactElement,
  { store = createTestStore(), ...options }: RenderWithProvidersOptions = {},
) => {
  // Gesture Handler 3 refuses to mount a GestureDetector outside its root
  // view, which app/_layout.tsx puts around the whole app.
  const AppProviders = ({ children }: { children: ReactNode }) => (
    <GestureHandlerRootView>
      <Provider store={store}>
        <PaperProvider theme={lightTheme}>{children}</PaperProvider>
      </Provider>
    </GestureHandlerRootView>
  );

  const result = await render(ui, { wrapper: AppProviders, ...options });

  return { store, ...result };
};

/** Same providers as `renderWithProviders`, for testing a hook on its own. */
export const renderHookWithProviders = async <T,>(
  hook: () => T,
  { store = createTestStore() }: { store?: TestStore } = {},
) => {
  const AppProviders = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <PaperProvider theme={lightTheme}>{children}</PaperProvider>
    </Provider>
  );

  const result = await renderHook(hook, { wrapper: AppProviders });

  return { store, ...result };
};
