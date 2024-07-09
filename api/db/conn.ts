import dotenv from "dotenv";
import { initializeApp } from "firebase-admin/app";
import admin from "firebase-admin";
import { MongoClient } from "mongodb";

dotenv.config();

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS)
  throw "ERROR NO GOOGLE FIREBASE KEY PROVIDED.";

const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

const mongoClient = new MongoClient(process.env.ATLAS_URI || "");

const clientPromise = mongoClient.connect();

const adb = {
  connect: async () => {
    initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://fife-app-default-rtdb.firebaseio.com",
    });
  },
  db: async () => {
    return (await clientPromise).db("fifeapp");
  },
};

export default adb;
