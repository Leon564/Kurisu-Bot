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

export { FakeRef, newDb };
export type { FakeDb };
