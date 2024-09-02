import userReducer from "./reducers/userReducer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistStore, persistReducer } from "redux-persist";
import { AnyAction, combineReducers, configureStore } from "@reduxjs/toolkit";
import commentsReducer from "./reducers/commentsReducer";

export const rootReducer = combineReducers({
  comments: commentsReducer,
  user: userReducer,
});

export type RootReducer = ReturnType<typeof rootReducer>;

const persistedReducer = persistReducer<RootReducer, AnyAction>(
  { key: "root", storage: AsyncStorage },
  rootReducer,
);
export const store = configureStore({
  reducer: persistedReducer,
});
export type RootState = ReturnType<typeof store.getState>;
export const persistor = persistStore(store);
