const {
  AnyMessageContent,
  delay,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  MessageRetryMap,
  useMultiFileAuthState,
  ...makeWASocket
} = require("@adiwajshing/baileys");
const MAIN_LOGGER = require("@adiwajshing/baileys/lib/Utils/logger").default;
const messageHandler = require("./message");

const logger = MAIN_LOGGER.child({});
logger.level = "silent";

const useStore = !process.argv.includes("--no-store");
const doReplies = !process.argv.includes("--no-reply");

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
//const msgRetryCounterMap: MessageRetryMap = { }
const msgRetryCounterMap = {};

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = useStore ? makeInMemoryStore({ logger }) : undefined;
store?.readFromFile("./config/baileys_store_multi.json");
// save every 10s
setInterval(() => {
  store?.writeToFile("./config/baileys_store_multi.json");
}, 10_000);

// start a connection
const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(
    "./config/auth_info_baileys"
  );
  // fetch latest version of WA Web
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const sock = makeWASocket.default({
    version,
    logger,
    printQRInTerminal: true,
    auth: state,
    msgRetryCounterMap,
    // implement to handle retries
    getMessage: async key => {
      console.log("getting message from store");
			if(store) {
				const msg = await store.loadMessage(key?.remoteJid, key?.id, undefined)
				return msg?.message || undefined
			}

			// only if store is present
			return {
				conversation: 'hello'
			}
		}
  });

  store?.bind(sock.ev);

  sock.ev.on("call", (item) => console.log("recv call event", item));
  sock.ev.on("chats.set", (item) =>
    console.log(`recv ${item.chats.length} chats (is latest: ${item.isLatest})`)
  );
  sock.ev.on("messages.set", (item) =>
    console.log(
      `recv ${item.messages.length} messages (is latest: ${item.isLatest})`
    )
  );
  sock.ev.on("contacts.set", (item) =>
    console.log(`recv ${item.contacts.length} contacts`)
  );

  sock.ev.on("messages.upsert", async (m) => {
    //console.log(JSON.stringify(m, undefined, 2));

    const msg = m.messages[0];
    if (
      (m.type === "notify" || m.type === "append") &&
      doReplies &&
      msg.message
    ) {
      //MessageHandler here
      messageHandler(msg, sock);
    }
  });

  // sock.ev.on("messages.update", (m) => console.log(m));
  // sock.ev.on("message-receipt.update", (m) => console.log(m));
  // sock.ev.on("presence.update", (m) => console.log(m));
  // sock.ev.on("chats.update", (m) => console.log(m));
  // sock.ev.on("chats.delete", (m) => console.log(m));
  // sock.ev.on("contacts.upsert", (m) => console.log(m));

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      // reconnect if not logged out
      if (
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
      ) {
        startSock();
      } else {
        console.log("Connection closed. You are logged out.");
      }
    }

    console.log("connection update", update);
  });
  // listen for when the auth credentials is updated
  sock.ev.on("creds.update", saveCreds);

  return sock;
};

// run in main file
startSock();
