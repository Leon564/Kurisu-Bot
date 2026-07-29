import { Logger } from '@nestjs/common';
import {
  AuthenticationCreds,
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
} from 'baileys';
import * as admin from 'firebase-admin';

/**
 * The slice of firebase-admin's `Reference` this store depends on. Narrowing it
 * keeps the store unit-testable against a plain in-memory fake.
 */
export interface AuthRef {
  child(path: string): AuthRef;
  once(event: 'value'): Promise<{ val(): unknown }>;
  set(value: unknown): Promise<void>;
  remove(): Promise<void>;
}

/**
 * Realtime Database rejects these characters in key names. `%` is escaped first
 * so the mapping stays collision-free: without it, an id containing a literal
 * `%2E` would encode to the same path as one containing `.`.
 */
const ILLEGAL_IN_RTDB_KEY = ['%', '.', '#', '$', '/', '[', ']'];

export const encodeKeyId = (id: string): string =>
  ILLEGAL_IN_RTDB_KEY.reduce(
    (acc, char) =>
      acc.split(char).join(`%${char.charCodeAt(0).toString(16).toUpperCase()}`),
    id,
  );

export class FirebaseAuthStore {
  private readonly logger = new Logger(FirebaseAuthStore.name);

  constructor(private readonly root: AuthRef) {}

  static forSession(sessionId: string): FirebaseAuthStore {
    const ref = admin
      .database()
      .ref(`whatsapp-auth/${sessionId}`) as unknown as AuthRef;
    return new FirebaseAuthStore(ref);
  }

  async load(): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
  }> {
    const creds = await this.readCreds();

    const state = {
      creds,
      keys: { get: async () => ({}), set: async () => undefined },
    } as unknown as AuthenticationState;

    return { state, saveCreds: () => this.writeCreds(creds) };
  }

  private async readCreds(): Promise<AuthenticationCreds> {
    const raw = (await this.root.child('creds').once('value')).val();
    // An absent node means "no session yet". A read failure must never be
    // mistaken for one: that would silently start over and force a re-scan,
    // so we let it reject.
    if (raw === null || raw === undefined) return initAuthCreds();
    return JSON.parse(raw as string, BufferJSON.reviver);
  }

  private async writeCreds(creds: AuthenticationCreds): Promise<void> {
    await this.root
      .child('creds')
      .set(JSON.stringify(creds, BufferJSON.replacer));
  }
}
