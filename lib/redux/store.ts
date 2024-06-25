import userReducer from './userReducer'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist'
import { AnyAction, combineReducers, configureStore } from '@reduxjs/toolkit'

export const rootReducer = combineReducers({
  user: userReducer,
});

export type RootReducer = ReturnType<typeof rootReducer>;

const persistedReducer = persistReducer<RootReducer, AnyAction>(
  {  key: 'root',  storage: AsyncStorage, },
  rootReducer,
);
export const store = configureStore({
  reducer: persistedReducer
});
export type RootState = ReturnType<typeof store.getState>
export const persistor = persistStore(store)

