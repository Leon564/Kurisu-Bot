import admin from "firebase-admin";
import config from "../infrastructure/configs/firebase.config";

admin.initializeApp({
  credential: admin.credential.cert(config),
  databaseURL: config.dataBaseUrl,
});
