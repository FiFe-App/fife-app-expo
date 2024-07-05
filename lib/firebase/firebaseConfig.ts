import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import { Platform } from "react-native";

export const firebaseConfig = {
  apiKey: "AIzaSyDtxKGHmZsnpg2R7CKdkLl8oNSag9lHykI",
  authDomain: "fife-app.firebaseapp.com",
  databaseURL: "https://fife-app-default-rtdb.firebaseio.com",
  projectId: "fife-app",
  storageBucket: "fife-app.appspot.com",
  messagingSenderId: "235592798960",
  appId: "1:235592798960:web:39d151f49b45c29ef82835",
  measurementId: "G-10X8R8XT3L",
};
export const app = initializeApp(firebaseConfig);

let persistence;
if (Platform.OS !== "web") {
  const reactNativePersistence = (firebaseAuth as any)
    .getReactNativePersistence;
  persistance = reactNativePersistence(AsyncStorage);
} else {
  persistence = firebaseAuth.browserSessionPersistence;
}

export const auth = firebaseAuth.initializeAuth(app, {
  persistence,
});
