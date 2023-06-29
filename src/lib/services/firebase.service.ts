import admin from "firebase-admin";

const db = admin.database();

export const getOpenaiWhiteList = async() => {
  const whitelistRef = db.ref("openai-whitelist");

  return whitelistRef.once("value").then((snapshot) => {
    const whitelistData = snapshot.val();
    if (whitelistData) {
      const whitelistArray = Object.values(whitelistData);
      return whitelistArray;
    } else {
      return [];
    }
  });
};

export const addOpenaiWhiteList = async (data: any) => {
  const ref = db.ref("openai-whitelist");
  await ref.push(data);
};

export default db;
