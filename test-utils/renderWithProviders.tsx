import { render, type RenderOptions } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactElement, ReactNode } from "react";
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
  const AppProviders = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <PaperProvider theme={lightTheme}>{children}</PaperProvider>
    </Provider>
  );

  const result = await render(ui, { wrapper: AppProviders, ...options });

  return { store, ...result };
};
