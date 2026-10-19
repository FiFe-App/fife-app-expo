import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistStore, persistReducer } from "redux-persist";
import { AnyAction, combineReducers, configureStore } from "@reduxjs/toolkit";

import userReducer from "./reducers/userReducer";
import commentsReducer from "./reducers/commentsReducer";
import buzinessReducer from "./reducers/buzinessReducer";
import infoReducer from "./reducers/infoReducer";
import tutorialReducer from "./reducers/tutorialReducer";
import usersReducer from "./reducers/usersReducer";
import appReducer from "./reducers/appReducer";
import emotionLogsSlice from "./reducers/emotionLogsReducer";
import chatReducer from "./reducers/chatReducer";

/**
 * `info` holds what is on screen right now: open dialogs, the loading overlay,
 * snackbars, the appbar's menu — every one of them carrying callbacks that do
 * not survive being written to disk and read back.
 *
 * Persisting all that meant a kill in the background came back as a dialog
 * whose buttons did nothing, a snackbar for an action that no longer exists,
 * or — worst — the non-dismissable "Kérlek várj" overlay from an upload that
 * ended when the app did, with no way past it. So only the two fields that are
 * genuinely about the user rather than the moment are kept.
 */
const persistedInfoReducer = persistReducer(
  {
    key: "info",
    storage: AsyncStorage,
    whitelist: ["policiesAccepted", "notificationToken"],
  },
  infoReducer,
);

export const rootReducer = combineReducers({
  comments: commentsReducer,
  user: userReducer.reducer,
  users: usersReducer.reducer,
  buziness: buzinessReducer.reducer,
  info: persistedInfoReducer,
  tutorial: tutorialReducer.reducer,
  app: appReducer.reducer,
  chat: chatReducer,
  emotionLogs: emotionLogsSlice.reducer,
});

export type RootReducer = ReturnType<typeof rootReducer>;

const persistedReducer = persistReducer<RootReducer, AnyAction>(
  // `info` is persisted separately, by the nested config above.
  { key: "root", storage: AsyncStorage, blacklist: ["info"] },
  rootReducer,
);
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        isSerializable: () => true,
      },
    }),
});
export type RootState = ReturnType<typeof store.getState>;
export const persistor = persistStore(store);
