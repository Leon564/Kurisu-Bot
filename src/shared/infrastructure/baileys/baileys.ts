import { Boom } from "@hapi/boom";
import parsePhoneNumber from "libphonenumber-js";
import NodeCache from "node-cache";
import readline from "readline";
import makeWASocket, {
  AnyMessageContent,
  delay,
  DisconnectReason,
  fetchLatestBaileysVersion,
  getAggregateVotesInPollMessage,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  PHONENUMBER_MCC,
  proto,
  useMultiFileAuthState,
  WAMessageContent,
  WAMessageKey,
} from "@whiskeysockets/baileys";
import MAIN_LOGGER from "@whiskeysockets/baileys/lib/Utils/logger";

const logger = MAIN_LOGGER.child({});
logger.level = "silent";

const useStore = !process.argv.includes("--no-store");
//const doReplies = !process.argv.includes("--no-reply");
const useMobile = process.argv.includes("--mobile");

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new NodeCache();

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = useStore ? makeInMemoryStore({ logger }) : undefined;
store?.readFromFile("./baileys_store_multi.json");
// save every 10s
setInterval(() => {
  store?.writeToFile("./baileys_store_multi.json");
}, 10_000);

// start a connection
const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");
  // fetch latest version of WA Web
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: true,
    mobile: useMobile,
    auth: {
      creds: state.creds,
      /** caching makes the store faster to send/recv messages */
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    keepAliveIntervalMs: 60_000,
    msgRetryCounterCache,
    syncFullHistory: true,
    generateHighQualityLinkPreview: true,
    // ignore all broadcast messages -- to receive the same
    // comment the line below out
    // shouldIgnoreJid: jid => isJidBroadcast(jid),
    // implement to handle retries & poll updates
    getMessage,
  });

  store?.bind(sock.ev);

  // If mobile was chosen, ask for the code
  if (useMobile && !sock.authState.creds.registered) {
    const question = (text: string) =>
      new Promise<string>((resolve) => rl.question(text, resolve));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const { registration } = sock.authState.creds || { registration: {} };

    if (!registration.phoneNumber) {
      registration.phoneNumber = await question(
        "Please enter your mobile phone number:\n"
      );
    }

    const phoneNumber = parsePhoneNumber(registration!.phoneNumber);
    if (!phoneNumber?.isValid()) {
      throw new Error("Invalid phone number: " + registration!.phoneNumber);
    }

    registration.phoneNumber = phoneNumber.format("E.164");
    registration.phoneNumberCountryCode = phoneNumber.countryCallingCode as any;
    registration.phoneNumberNationalNumber = phoneNumber.nationalNumber as any;
    const mcc = PHONENUMBER_MCC[phoneNumber.countryCallingCode];
    if (!mcc) {
      throw new Error(
        "Could not find MCC for phone number: " +
          registration!.phoneNumber +
          "\nPlease specify the MCC manually."
      );
    }

    registration.phoneNumberMobileCountryCode = mcc;

    async function enterCode() {
      try {
        const code = await question("Please enter the one time code:\n");
        const response = await sock.register(
          code.replace(/["']/g, "").trim().toLowerCase()
        );
        console.log("Successfully registered your phone number.");
        console.log(response);
        rl.close();
      } catch (error) {
        console.error(
          "Failed to register your phone number. Please try again.\n",
          error
        );
        await askForOTP();
      }
    }

    async function askForOTP(): Promise<any> {
      let code = await question(
        'How would you like to receive the one time code for registration? "sms" or "voice"\n'
      );
      code = code.replace(/["']/g, "").trim().toLowerCase();

      if (code !== "sms" && code !== "voice") {
        return await askForOTP();
      }

      registration.method = code;

      try {
        await sock.requestRegistrationCode(registration);
        await enterCode();
      } catch (error) {
        console.error(
          "Failed to request registration code. Please try again.\n",
          error
        );
        await askForOTP();
      }
    }

    askForOTP();
  }

  // the process function lets you process all events that just occurred
  // efficiently in a batch
  sock.ev.process(
    // events is a map for event name => event data
    async (events) => {
      // something about the connection changed
      // maybe it closed, or we received all offline message or connection opened
      if (events["connection.update"]) {
        const update = events["connection.update"];
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
          // reconnect if not logged out
          if (
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut
          ) {
            startSock();
          } else {
            console.log("Connection closed. You are logged out.");
          }
        }

        console.log("connection update", update);
      }
    
      if(events['creds.update']) {
				await saveCreds()
			}

      // history received
      if (events["messaging-history.set"]) {
        const { chats, contacts, messages, isLatest } =
          events["messaging-history.set"];
        //console.log(`recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest})`)
      }

      
     
      // messages updated like status delivered, message deleted etc.
      if (events["messages.update"]) {
        //console.log(JSON.stringify(events["messages.update"], undefined, 2));

        for (const { key, update } of events["messages.update"]) {
          if (update.pollUpdates) {
            const pollCreation = await getMessage(key);
            if (pollCreation) {
              console.log(
                "got poll update, aggregation: ",
                getAggregateVotesInPollMessage({
                  message: pollCreation,
                  pollUpdates: update.pollUpdates,
                })
              );
            }
          }
        }
      }


     
    }
  );

  return sock;

  async function getMessage(
    key: WAMessageKey
  ): Promise<WAMessageContent | undefined> {
    if (store) {
      const msg = await store.loadMessage(key.remoteJid!, key.id!);
      return msg?.message || undefined;
    }

    // only if store is present
    return proto.Message.fromObject({});
  }
};

export default startSock;
