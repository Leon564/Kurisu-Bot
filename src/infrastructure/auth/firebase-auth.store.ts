import { Logger } from '@nestjs/common';
import {
  AuthenticationCreds,
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
  proto,
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

    // Scoped to this load() on purpose: a clear() followed by load() starts a
    // different session, and a cache living on the instance would serve keys
    // belonging to the one that was just wiped.
    const cache = new Map<string, unknown>();

    const state = {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: Record<string, unknown> = {};
          await Promise.all(
            ids.map(async (id) => {
              data[id] = await this.readKey(type, id, cache);
            }),
          );
          return data;
        },
        set: async (data: Record<string, Record<string, unknown>>) => {
          const writes: Promise<void>[] = [];
          for (const type in data) {
            for (const id in data[type]) {
              writes.push(this.writeKey(type, id, data[type][id], cache));
            }
          }
          await Promise.all(writes);
        },
      },
    } as unknown as AuthenticationState;

    return { state, saveCreds: () => this.writeCreds(creds) };
  }

  private keyRef(type: string, id: string): AuthRef {
    return this.root.child(`keys/${type}/${encodeKeyId(id)}`);
  }

  private async readKey(
    type: string,
    id: string,
    cache: Map<string, unknown>,
  ): Promise<unknown> {
    const cacheKey = `${type}:${id}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    let value: unknown = null;
    try {
      const raw = (await this.keyRef(type, id).once('value')).val();
      if (raw !== null && raw !== undefined) {
        value = JSON.parse(raw as string, BufferJSON.reviver);
        if (type === 'app-state-sync-key') {
          // Without this the protobuf helpers app state sync relies on are
          // missing; useMultiFileAuthState does the same on read.
          value = proto.Message.AppStateSyncKeyData.fromObject(
            value as Record<string, unknown>,
          );
        }
      }
    } catch (error) {
      // Mirrors useMultiFileAuthState, which treats any read failure as a miss.
      this.logger.warn(`Failed to read key ${cacheKey}: ${error}`);
      return null;
    }

    cache.set(cacheKey, value);
    return value;
  }

  private async writeKey(
    type: string,
    id: string,
    value: unknown,
    cache: Map<string, unknown>,
  ): Promise<void> {
    const cacheKey = `${type}:${id}`;

    if (value === null || value === undefined) {
      cache.delete(cacheKey);
      await this.keyRef(type, id).remove();
      return;
    }

    cache.set(cacheKey, value);
    await this.keyRef(type, id).set(JSON.stringify(value, BufferJSON.replacer));
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
