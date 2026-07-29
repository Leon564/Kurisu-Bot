import { AuthRef, FirebaseAuthStore, encodeKeyId } from './firebase-auth.store';

// `failReads` lives on the shared db rather than on a ref, because child() hands
// back a new ref instance and a stub on the parent would never be reached.
type FakeDb = { data: Map<string, unknown>; reads: number; failReads?: boolean };

class FakeRef implements AuthRef {
  constructor(
    private readonly db: FakeDb,
    private readonly path = '',
  ) {}

  child(p: string): AuthRef {
    return new FakeRef(this.db, this.path ? `${this.path}/${p}` : p);
  }

  async once(): Promise<{ val(): unknown }> {
    if (this.db.failReads) throw new Error('firebase unavailable');
    this.db.reads += 1;
    const val = this.db.data.has(this.path)
      ? this.db.data.get(this.path)
      : null;
    return { val: () => val };
  }

  async set(value: unknown): Promise<void> {
    this.db.data.set(this.path, value);
  }

  async remove(): Promise<void> {
    // RTDB removes the node and everything under it. At the root the path is
    // empty, so a prefix check would match nothing — clear the whole map.
    if (this.path === '') {
      this.db.data.clear();
      return;
    }
    for (const key of [...this.db.data.keys()]) {
      if (key === this.path || key.startsWith(`${this.path}/`)) {
        this.db.data.delete(key);
      }
    }
  }
}

const newDb = (): FakeDb => ({ data: new Map(), reads: 0 });

describe('encodeKeyId', () => {
  it('escapes every character Realtime Database rejects', () => {
    expect(encodeKeyId('a.b#c$d/e[f]g')).toBe('a%2Eb%23c%24d%2Fe%5Bf%5Dg');
  });

  it('escapes % first so the mapping cannot collide', () => {
    // a literal "%2E" must not encode to the same path as "."
    expect(encodeKeyId('%2E')).toBe('%252E');
    expect(encodeKeyId('.')).toBe('%2E');
    expect(encodeKeyId('%2E')).not.toBe(encodeKeyId('.'));
  });

  it('leaves a typical signal address readable apart from the dot', () => {
    expect(encodeKeyId('5215551234567.1')).toBe('5215551234567%2E1');
  });
});

describe('FirebaseAuthStore credentials', () => {
  it('starts a fresh session when the creds node is absent', async () => {
    const db = newDb();
    const store = new FirebaseAuthStore(new FakeRef(db));

    const { state } = await store.load();

    expect(state.creds.registered).toBe(false);
    expect(Buffer.isBuffer(state.creds.noiseKey.private)).toBe(true);
  });

  it('round-trips credentials through save and load with Buffers intact', async () => {
    const db = newDb();
    const store = new FirebaseAuthStore(new FakeRef(db));

    const { state, saveCreds } = await store.load();
    state.creds.me = { id: '5215551234567@s.whatsapp.net', name: 'bot' };
    await saveCreds();

    const reloaded = await new FirebaseAuthStore(new FakeRef(db)).load();

    expect(reloaded.state.creds.me).toEqual(state.creds.me);
    expect(Buffer.isBuffer(reloaded.state.creds.noiseKey.private)).toBe(true);
    expect(reloaded.state.creds.noiseKey.private).toEqual(
      state.creds.noiseKey.private,
    );
  });

  it('stores creds as a JSON string, not a nested object', async () => {
    const db = newDb();
    const store = new FirebaseAuthStore(new FakeRef(db));
    const { saveCreds } = await store.load();

    await saveCreds();

    expect(typeof db.data.get('creds')).toBe('string');
  });

  it('propagates a read failure instead of degrading to a new session', async () => {
    const db = newDb();
    db.failReads = true;
    const store = new FirebaseAuthStore(new FakeRef(db));

    await expect(store.load()).rejects.toThrow('firebase unavailable');
  });

  it('does not confuse a stored session with a fresh one', async () => {
    const db = newDb();
    const first = await new FirebaseAuthStore(new FakeRef(db)).load();
    first.state.creds.registered = true;
    await first.saveCreds();

    const second = await new FirebaseAuthStore(new FakeRef(db)).load();

    expect(second.state.creds.registered).toBe(true);
    expect(second.state.creds.registrationId).toBe(
      first.state.creds.registrationId,
    );
  });
});

describe('FirebaseAuthStore keys', () => {
  it('round-trips a key value with Buffers intact', async () => {
    const db = newDb();
    const { state } = await new FirebaseAuthStore(new FakeRef(db)).load();

    await state.keys.set({
      'pre-key': {
        '1': { private: Buffer.from([1, 2, 3]), public: Buffer.from([4]) },
      },
    } as never);

    const fresh = await new FirebaseAuthStore(new FakeRef(db)).load();
    const read = await fresh.state.keys.get('pre-key', ['1']);

    expect(Buffer.isBuffer(read['1'].private)).toBe(true);
    expect(read['1'].private).toEqual(Buffer.from([1, 2, 3]));
  });

  it('writes each key to its own encoded path', async () => {
    const db = newDb();
    const { state } = await new FirebaseAuthStore(new FakeRef(db)).load();

    await state.keys.set({
      session: { '5215551234567.1': Buffer.from([9]) },
    } as never);

    expect([...db.data.keys()]).toContain('keys/session/5215551234567%2E1');
  });

  it('stores key values as JSON strings', async () => {
    const db = newDb();
    const { state } = await new FirebaseAuthStore(new FakeRef(db)).load();

    await state.keys.set({ 'pre-key': { '7': { id: 7 } } } as never);

    expect(typeof db.data.get('keys/pre-key/7')).toBe('string');
  });

  it('serves a repeated read from cache without hitting the database', async () => {
    const db = newDb();
    const { state } = await new FirebaseAuthStore(new FakeRef(db)).load();
    await state.keys.set({ 'pre-key': { '1': { id: 1 } } } as never);

    const fresh = await new FirebaseAuthStore(new FakeRef(db)).load();
    await fresh.state.keys.get('pre-key', ['1']);
    const readsAfterFirst = db.reads;
    await fresh.state.keys.get('pre-key', ['1']);

    expect(db.reads).toBe(readsAfterFirst);
  });

  it('removes the node when a key is set to null', async () => {
    const db = newDb();
    const { state } = await new FirebaseAuthStore(new FakeRef(db)).load();
    await state.keys.set({ 'pre-key': { '1': { id: 1 } } } as never);
    expect(db.data.has('keys/pre-key/1')).toBe(true);

    await state.keys.set({ 'pre-key': { '1': null } } as never);

    expect(db.data.has('keys/pre-key/1')).toBe(false);
  });

  it('reports a missing key as null', async () => {
    const db = newDb();
    const { state } = await new FirebaseAuthStore(new FakeRef(db)).load();

    const read = await state.keys.get('pre-key', ['does-not-exist']);

    expect(read['does-not-exist']).toBeNull();
  });

  it('hydrates app-state-sync-key so app state sync can use it', async () => {
    const db = newDb();
    const { state } = await new FirebaseAuthStore(new FakeRef(db)).load();
    await state.keys.set({
      'app-state-sync-key': {
        key1: { keyData: Buffer.from([1]), fingerprint: { rawId: 7 } },
      },
    } as never);

    const fresh = await new FirebaseAuthStore(new FakeRef(db)).load();
    const read = await fresh.state.keys.get('app-state-sync-key', ['key1']);

    // fromObject yields a protobuf message instance, not a bare object
    expect(read['key1'].constructor.name).toBe('AppStateSyncKeyData');
    expect(read['key1'].fingerprint.rawId).toBe(7);
  });

  it('treats a key read failure as a miss instead of throwing', async () => {
    const db = newDb();
    const { state } = await new FirebaseAuthStore(new FakeRef(db)).load();
    // fail only once the creds read is done, so load() itself succeeds
    db.failReads = true;

    const read = await state.keys.get('pre-key', ['1']);

    expect(read['1']).toBeNull();
  });
});

describe('FirebaseAuthStore clear', () => {
  it('removes creds and every key of the session', async () => {
    const db = newDb();
    const store = new FirebaseAuthStore(new FakeRef(db));
    const { state, saveCreds } = await store.load();
    await saveCreds();
    await state.keys.set({ 'pre-key': { '1': { id: 1 } } } as never);
    expect(db.data.size).toBeGreaterThan(0);

    await store.clear();

    expect(db.data.size).toBe(0);
  });

  it('does not serve keys from the wiped session after reloading', async () => {
    const db = newDb();
    const store = new FirebaseAuthStore(new FakeRef(db));
    const first = await store.load();
    await first.state.keys.set({ 'pre-key': { '1': { id: 1 } } } as never);
    // prove the value is cached in the first load
    expect((await first.state.keys.get('pre-key', ['1']))['1']).toEqual({
      id: 1,
    });

    await store.clear();
    const second = await store.load();

    expect((await second.state.keys.get('pre-key', ['1']))['1']).toBeNull();
  });

  it('issues fresh credentials after a clear', async () => {
    const db = newDb();
    const store = new FirebaseAuthStore(new FakeRef(db));
    const first = await store.load();
    first.state.creds.registered = true;
    await first.saveCreds();

    await store.clear();
    const second = await store.load();

    expect(second.state.creds.registered).toBe(false);
    expect(second.state.creds.registrationId).not.toBe(
      first.state.creds.registrationId,
    );
  });
});

export { FakeRef, newDb };
export type { FakeDb };
