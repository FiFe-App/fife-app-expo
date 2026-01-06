import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistStore, persistReducer } from "redux-persist";
import { AnyAction, combineReducers, configureStore } from "@reduxjs/toolkit";

import userReducer from "./reducers/userReducer";
import commentsReducer from "./reducers/commentsReducer";
import buzinessReducer from "./reducers/buzinessReducer";
import infoReducer from "./reducers/infoReducer";
import tutorialReducer from "./reducers/tutorialReducer";
import usersReducer from "./reducers/usersReducer";
import languageReducer from "./reducers/languageReducer";

export const rootReducer = combineReducers({
  comments: commentsReducer,
  user: userReducer.reducer,
  users: usersReducer.reducer,
  buziness: buzinessReducer.reducer,
  info: infoReducer,
  tutorial: tutorialReducer.reducer,
  language: languageReducer.reducer,
});

export type RootReducer = ReturnType<typeof rootReducer>;

const persistedReducer = persistReducer<RootReducer, AnyAction>(
  { key: "root", storage: AsyncStorage },
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
