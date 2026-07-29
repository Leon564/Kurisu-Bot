# Firebase Auth State + Reconexión Automática — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guardar el auth state de Baileys en Firebase Realtime Database en lugar de `auth_info/`, y reconectar dentro del mismo proceso para que no haga falta reiniciar a mano tras escanear el QR.

**Architecture:** Un `FirebaseAuthStore` implementa la interfaz `AuthenticationState` de Baileys sobre RTDB, con un nodo por llave y caché write-through acotada a cada `load()`. El `BaileysTransport` pasa a recibir el store en lugar de un state ya materializado, y expone un `connect()` re-invocable; una función pura `decideReconnect` decide si reconectar, con cuánto retardo y si hay que borrar credenciales.

**Tech Stack:** NestJS 11 (CommonJS), baileys 7.0.0-rc13, firebase-admin 12 (Realtime Database), jest + ts-jest.

## Global Constraints

- Rama de trabajo: `baileys-v7-migration`.
- El paquete de Baileys es `baileys` (no `@whiskeysockets/baileys`).
- Node >= 20.19.0; el proyecto es CommonJS y carga baileys vía `require(esm)`.
- Los valores en RTDB se guardan como **string JSON** producido con `BufferJSON`, nunca como objeto nativo.
- Los IDs de llave se codifican escapando `%` `.` `#` `$` `/` `[` `]`, con `%` primero.
- Ruta raíz en RTDB: `whatsapp-auth/<sessionId>`.
- `auth_info/` **no se borra**: `youtube.service.ts:23` la usa para cookies.
- Tests: correr con `yarn test`.
  - **Corregido durante la ejecución:** el plan asumía que jest funcionaba sin
    tocar configuración. No era cierto. El runtime CJS de jest intercepta
    `require` y no honra el soporte `require(esm)` de Node, así que cualquier
    spec que importara baileys v7 (ESM-only) fallaba al parsearlo. Se pasó jest
    a ESM nativo: `extensionsToTreatAsEsm` + ts-jest `useESM`, ejecutado con
    `node --experimental-vm-modules`. La alternativa —transformar baileys con
    ts-jest— habría procesado un bundle WASM de 2MB en cada corrida.
  - Bajo ESM el global `jest` no existe; los dobles de prueba se hacen con
    stubs planos en vez de `jest.spyOn`.
- Prettier: comillas simples, trailing commas, ancho 80.

## Desviación del spec (deliberada)

El spec dice que en `loggedOut` el contador de reintentos se pone **a cero**. Eso contradice su propio objetivo declarado —un tope que evite bucles de QR— porque un logout repetido reiniciaría el contador infinitamente y el tope nunca dispararía.

Corrección aplicada en este plan: **el tope se evalúa antes de la rama de `loggedOut`**, y solo un `connection === 'open'` exitoso resetea el contador. Así el único escenario acotado es "logout repetido sin llegar nunca a conectar", que es exactamente el bucle patológico que se quería evitar; un logout normal tras una sesión sana arranca con el contador ya en cero.

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/infrastructure/auth/firebase-auth.store.ts` | **Crear.** `AuthRef`, `encodeKeyId`, `FirebaseAuthStore` |
| `src/infrastructure/auth/firebase-auth.store.spec.ts` | **Crear.** Tests del store contra un RTDB falso |
| `src/infrastructure/transporters/reconnect.policy.ts` | **Crear.** `decideReconnect` (pura) |
| `src/infrastructure/transporters/reconnect.policy.spec.ts` | **Crear.** Tests de la política |
| `src/infrastructure/transporters/baileys.transport.ts` | **Modificar.** Recibe store, `connect()` re-invocable |
| `src/main.ts` | **Modificar.** Construye el store |
| `src/configs/app.config.ts` | **Modificar.** Quita `authInfoDir`, añade `waSessionId` |
| `.env.example` | **Modificar.** Documenta `WA_SESSION_ID` |

---

### Task 1: Store — interfaz, codificación de IDs y credenciales

**Files:**
- Create: `src/infrastructure/auth/firebase-auth.store.ts`
- Test: `src/infrastructure/auth/firebase-auth.store.spec.ts`

**Interfaces:**
- Consumes: nada (primera tarea)
- Produces:
  - `interface AuthRef { child(path: string): AuthRef; once(event: 'value'): Promise<{ val(): unknown }>; set(value: unknown): Promise<void>; remove(): Promise<void> }`
  - `encodeKeyId(id: string): string`
  - `class FirebaseAuthStore` con `constructor(root: AuthRef)`, `static forSession(sessionId: string): FirebaseAuthStore`, `load(): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }>`

- [ ] **Step 1: Write the failing test**

Crear `src/infrastructure/auth/firebase-auth.store.spec.ts`:

```ts
import { initAuthCreds } from 'baileys';
import { AuthRef, FirebaseAuthStore, encodeKeyId } from './firebase-auth.store';

type FakeDb = { data: Map<string, unknown>; reads: number };

class FakeRef implements AuthRef {
  constructor(
    private readonly db: FakeDb,
    private readonly path = '',
  ) {}

  child(p: string): AuthRef {
    return new FakeRef(this.db, this.path ? `${this.path}/${p}` : p);
  }

  async once(): Promise<{ val(): unknown }> {
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
    expect(encodeKeyId('a.b#c$d/e[f]g')).toBe(
      'a%2Eb%23c%24d%2Fe%5Bf%5Dg',
    );
  });

  it('escapes % first so the mapping cannot collide', () => {
    // a literal "%2E" must not decode back to the same thing as "."
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
    const failing = new FakeRef(db);
    jest
      .spyOn(failing, 'once')
      .mockRejectedValue(new Error('firebase unavailable'));
    const store = new FirebaseAuthStore(failing);

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

// exported so Tasks 2 and 3 reuse the same fake
export { FakeRef, newDb };
export type { FakeDb };
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/infrastructure/auth/firebase-auth.store.spec.ts`
Expected: FAIL — `Cannot find module './firebase-auth.store'`

- [ ] **Step 3: Write minimal implementation**

Crear `src/infrastructure/auth/firebase-auth.store.ts`:

```ts
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
      acc
        .split(char)
        .join(`%${char.charCodeAt(0).toString(16).toUpperCase()}`),
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/infrastructure/auth/firebase-auth.store.spec.ts`
Expected: PASS — 8 tests (3 de `encodeKeyId`, 5 de credenciales)

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/auth/firebase-auth.store.ts src/infrastructure/auth/firebase-auth.store.spec.ts
git commit -m "feat(auth): Firebase auth store with RTDB-safe key encoding and creds round-trip"
```

---

### Task 2: Store — llaves con caché y rehidratación

**Files:**
- Modify: `src/infrastructure/auth/firebase-auth.store.ts`
- Test: `src/infrastructure/auth/firebase-auth.store.spec.ts`

**Interfaces:**
- Consumes: `AuthRef`, `FirebaseAuthStore`, `encodeKeyId`, `FakeRef`, `newDb` de Task 1
- Produces: `state.keys` funcional — `get(type, ids)` y `set(data)` conformes a `SignalKeyStore` de Baileys

- [ ] **Step 1: Write the failing test**

Añadir al final de `src/infrastructure/auth/firebase-auth.store.spec.ts` (antes de los `export`):

```ts
describe('FirebaseAuthStore keys', () => {
  it('round-trips a key value with Buffers intact', async () => {
    const db = newDb();
    const { state } = await new FirebaseAuthStore(new FakeRef(db)).load();

    await state.keys.set({
      'pre-key': { '1': { private: Buffer.from([1, 2, 3]), public: Buffer.from([4]) } },
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

    expect([...db.data.keys()]).toContain(
      'keys/session/5215551234567%2E1',
    );
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
    const ref = new FakeRef(db);
    const { state } = await new FirebaseAuthStore(ref).load();
    jest.spyOn(ref, 'child').mockImplementation(() => {
      throw new Error('firebase unavailable');
    });

    const read = await state.keys.get('pre-key', ['1']);

    expect(read['1']).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/infrastructure/auth/firebase-auth.store.spec.ts`
Expected: FAIL — el primer test falla porque `state.keys.get` devuelve `{}` (stub de Task 1)

- [ ] **Step 3: Write minimal implementation**

En `src/infrastructure/auth/firebase-auth.store.ts`, añadir `proto` al import de `baileys`:

```ts
import {
  AuthenticationCreds,
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
  proto,
} from 'baileys';
```

Reemplazar el método `load()` completo por:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/infrastructure/auth/firebase-auth.store.spec.ts`
Expected: PASS — 16 tests

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/auth/firebase-auth.store.ts src/infrastructure/auth/firebase-auth.store.spec.ts
git commit -m "feat(auth): per-key RTDB storage with write-through cache and app-state-sync-key hydration"
```

---

### Task 3: Store — `clear()` y aislamiento de caché entre sesiones

**Files:**
- Modify: `src/infrastructure/auth/firebase-auth.store.ts`
- Test: `src/infrastructure/auth/firebase-auth.store.spec.ts`

**Interfaces:**
- Consumes: todo lo de Tasks 1 y 2
- Produces: `FirebaseAuthStore.clear(): Promise<void>`

- [ ] **Step 1: Write the failing test**

Añadir a `src/infrastructure/auth/firebase-auth.store.spec.ts` (antes de los `export`):

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/infrastructure/auth/firebase-auth.store.spec.ts`
Expected: FAIL — `store.clear is not a function`

- [ ] **Step 3: Write minimal implementation**

En `src/infrastructure/auth/firebase-auth.store.ts`, añadir al final de la clase:

```ts
  /**
   * Drops the whole session subtree. Used when WhatsApp logs us out: the stored
   * credentials are dead and keeping them would only make the next connection
   * fail the same way.
   */
  async clear(): Promise<void> {
    await this.root.remove();
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/infrastructure/auth/firebase-auth.store.spec.ts`
Expected: PASS — 19 tests

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/auth/firebase-auth.store.ts src/infrastructure/auth/firebase-auth.store.spec.ts
git commit -m "feat(auth): clear() wipes the session subtree, with cache scoped per load"
```

---

### Task 4: Política de reconexión

**Files:**
- Create: `src/infrastructure/transporters/reconnect.policy.ts`
- Test: `src/infrastructure/transporters/reconnect.policy.spec.ts`

**Interfaces:**
- Consumes: `DisconnectReason` de `baileys`
- Produces:
  - `MAX_RECONNECT_ATTEMPTS: number` (valor `10`)
  - `type ReconnectDecision = { action: 'stop'; reason: string } | { action: 'reconnect'; delayMs: number; wipeCreds: boolean }`
  - `decideReconnect(statusCode: number | undefined, attempts: number): ReconnectDecision`

- [ ] **Step 1: Write the failing test**

Crear `src/infrastructure/transporters/reconnect.policy.spec.ts`:

```ts
import { DisconnectReason } from 'baileys';
import {
  MAX_RECONNECT_ATTEMPTS,
  decideReconnect,
} from './reconnect.policy';

describe('decideReconnect', () => {
  it('reconnects after the 515 WhatsApp sends once the QR is scanned', () => {
    const decision = decideReconnect(DisconnectReason.restartRequired, 1);

    expect(decision).toEqual({
      action: 'reconnect',
      delayMs: 1000,
      wipeCreds: false,
    });
  });

  it('backs off exponentially with each consecutive failure', () => {
    expect(decideReconnect(undefined, 1)).toMatchObject({ delayMs: 1000 });
    expect(decideReconnect(undefined, 2)).toMatchObject({ delayMs: 2000 });
    expect(decideReconnect(undefined, 3)).toMatchObject({ delayMs: 4000 });
  });

  it('caps the delay at 30 seconds', () => {
    expect(decideReconnect(undefined, 9)).toMatchObject({ delayMs: 30000 });
  });

  it('wipes credentials and retries immediately when logged out', () => {
    const decision = decideReconnect(DisconnectReason.loggedOut, 1);

    expect(decision).toEqual({
      action: 'reconnect',
      delayMs: 0,
      wipeCreds: true,
    });
  });

  it('stops once the attempt cap is exceeded', () => {
    const decision = decideReconnect(undefined, MAX_RECONNECT_ATTEMPTS + 1);

    expect(decision.action).toBe('stop');
  });

  it('applies the cap to repeated logouts too, so QR loops cannot spin', () => {
    const decision = decideReconnect(
      DisconnectReason.loggedOut,
      MAX_RECONNECT_ATTEMPTS + 1,
    );

    expect(decision.action).toBe('stop');
  });

  it('still allows the final attempt within the cap', () => {
    const decision = decideReconnect(undefined, MAX_RECONNECT_ATTEMPTS);

    expect(decision.action).toBe('reconnect');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/infrastructure/transporters/reconnect.policy.spec.ts`
Expected: FAIL — `Cannot find module './reconnect.policy'`

- [ ] **Step 3: Write minimal implementation**

Crear `src/infrastructure/transporters/reconnect.policy.ts`:

```ts
import { DisconnectReason } from 'baileys';

export const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_DELAY_MS = 30_000;

export type ReconnectDecision =
  | { action: 'stop'; reason: string }
  | { action: 'reconnect'; delayMs: number; wipeCreds: boolean };

/**
 * Decides what to do after the socket closes.
 *
 * `attempts` counts consecutive failures including the close being handled, so
 * the first retry waits 1s, the second 2s, and so on up to a 30s ceiling. Only
 * a successful connection resets it.
 *
 * The cap is checked before the logout branch on purpose: a logout that keeps
 * repeating without ever connecting would otherwise reissue QR codes forever.
 */
export function decideReconnect(
  statusCode: number | undefined,
  attempts: number,
): ReconnectDecision {
  if (attempts > MAX_RECONNECT_ATTEMPTS) {
    return {
      action: 'stop',
      reason: `gave up after ${MAX_RECONNECT_ATTEMPTS} consecutive failed reconnects`,
    };
  }

  if (statusCode === DisconnectReason.loggedOut) {
    // The stored credentials are dead; wipe them and start a fresh pairing.
    return { action: 'reconnect', delayMs: 0, wipeCreds: true };
  }

  return {
    action: 'reconnect',
    delayMs: Math.min(MAX_DELAY_MS, 2 ** (attempts - 1) * 1000),
    wipeCreds: false,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/infrastructure/transporters/reconnect.policy.spec.ts`
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/transporters/reconnect.policy.ts src/infrastructure/transporters/reconnect.policy.spec.ts
git commit -m "feat(transport): reconnect policy with exponential backoff and logout handling"
```

---

### Task 5: Cablear el transport, `main.ts` y la configuración

**Files:**
- Modify: `src/infrastructure/transporters/baileys.transport.ts:31-34` (tipo `Options`), `:74-90` (`listen`), `:97-114` (`connection.update`), `:178-180` (`close`)
- Modify: `src/main.ts:2`, `:31-36`
- Modify: `src/configs/app.config.ts:5`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `FirebaseAuthStore` (Tasks 1-3), `decideReconnect` y `ReconnectDecision` (Task 4)
- Produces: `BaileysTransport` cuyo constructor recibe `{ authStore: FirebaseAuthStore }`

- [ ] **Step 1: Reemplazar el tipo `Options` y el estado de la clase**

En `src/infrastructure/transporters/baileys.transport.ts`, sustituir:

```ts
type Options = {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
};

export class BaileysTransport
  extends Server
  implements CustomTransportStrategy
{
  private socket: WASocket | null = null;

  constructor(private options: Options) {
    super();
  }
```

por:

```ts
type Options = {
  authStore: FirebaseAuthStore;
};

export class BaileysTransport
  extends Server
  implements CustomTransportStrategy
{
  private socket: WASocket | null = null;
  private reconnectAttempts = 0;
  private closing = false;

  constructor(private options: Options) {
    super();
  }
```

Ajustar los imports del archivo: quitar `AuthenticationState` de la lista que viene de `baileys` (deja de usarse) y añadir:

```ts
import { FirebaseAuthStore } from '../auth/firebase-auth.store';
import { decideReconnect } from './reconnect.policy';
```

- [ ] **Step 2: Convertir `listen()` en `connect()` re-invocable**

Sustituir la firma `async listen() {` y la creación del socket. El cuerpo pasa a:

```ts
  async listen() {
    await this.connect();
  }

  private async connect(): Promise<void> {
    const parent = this;

    const { state, saveCreds } = await this.options.authStore.load();

    console.log('baileys started');
    const socket = WhatsAppSocket({
      auth: state,
      version: [2, 3000, 1043430842],
    });

    // Asignar el socket a la propiedad de clase
    this.socket = socket;

    socket.ev.on('creds.update', saveCreds);
```

El resto del cuerpo (los handlers de `connection.update` y `messages.upsert`) se conserva tal cual, salvo el cambio del Step 3. La declaración `const parent = this;` y los bloques comentados existentes se mantienen.

- [ ] **Step 3: Delegar el cierre en la política**

Sustituir el handler de `connection.update`:

```ts
    socket.ev.on('connection.update', (data) => {
      const { connection, lastDisconnect, qr } = data;

      // Manejar QR manualmente
      if (qr) {
        this.printQRInTerminal(qr);
      }

      if (connection === 'open') console.log('opened connection');

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.error(lastDisconnect?.error);
        console.info('reconnecting:', shouldReconnect);
        if (shouldReconnect) process.exit();
      }
    });
```

por:

```ts
    socket.ev.on('connection.update', (data) => {
      const { connection, lastDisconnect, qr } = data;

      // Manejar QR manualmente
      if (qr) {
        this.printQRInTerminal(qr);
      }

      if (connection === 'open') {
        console.log('opened connection');
        this.reconnectAttempts = 0;
      }

      if (connection === 'close') {
        void this.handleClose(socket, lastDisconnect?.error);
      }
    });
```

`DisconnectReason` deja de usarse en este archivo: quitarlo del import de `baileys`.

- [ ] **Step 4: Añadir `handleClose` y `scheduleReconnect`**

Insertar estos métodos justo después de `connect()`:

```ts
  /**
   * Recreates the socket instead of exiting the process. The 515 WhatsApp sends
   * right after a QR scan arrives here, which is why pairing no longer needs a
   * manual restart.
   */
  private async handleClose(
    socket: WASocket | undefined,
    error: Error | undefined,
  ): Promise<void> {
    // Nest is shutting us down; this close is expected.
    if (this.closing) return;

    console.error(error);

    // Stop the dead socket from delivering anything else to our handlers.
    socket?.ev.removeAllListeners('creds.update');
    socket?.ev.removeAllListeners('connection.update');
    socket?.ev.removeAllListeners('messages.upsert');

    this.reconnectAttempts += 1;
    const statusCode = (error as any)?.output?.statusCode;
    const decision = decideReconnect(statusCode, this.reconnectAttempts);

    if (decision.action === 'stop') {
      Logger.error(`baileys ${decision.reason}; not reconnecting`);
      return;
    }

    if (decision.wipeCreds) {
      Logger.warn('logged out by WhatsApp, clearing stored credentials');
      await this.options.authStore.clear();
    }

    Logger.log(
      `baileys reconnecting in ${decision.delayMs}ms (attempt ${this.reconnectAttempts})`,
    );
    this.scheduleReconnect(decision.delayMs);
  }

  private scheduleReconnect(delayMs: number): void {
    setTimeout(() => {
      this.connect().catch((error) => {
        // A failed reconnect re-enters the same backoff rather than dying.
        void this.handleClose(undefined, error);
      });
    }, delayMs);
  }
```

- [ ] **Step 5: Marcar el cierre intencional**

Sustituir:

```ts
  close() {
    console.log('baileys closed');
  }
```

por:

```ts
  close() {
    this.closing = true;
    void this.socket?.end(undefined);
    console.log('baileys closed');
  }
```

- [ ] **Step 6: Actualizar la configuración**

En `src/configs/app.config.ts`, sustituir la línea de `authInfoDir`:

```ts
  authInfoDir: process.env.AUTH_INFO_DIR || './auth_info',
```

por:

```ts
  waSessionId: process.env.WA_SESSION_ID || 'default',
```

En `.env.example`, añadir tras el bloque de Firebase:

```
# Optional: name of the session subtree under whatsapp-auth/ in Realtime Database
WA_SESSION_ID=default
```

- [ ] **Step 7: Actualizar `main.ts`**

Sustituir el import:

```ts
import { useMultiFileAuthState } from 'baileys';
```

por:

```ts
import { FirebaseAuthStore } from './infrastructure/auth/firebase-auth.store';
```

Y sustituir:

```ts
  const { port, authInfoDir } = appConfigs;
  const { state, saveCreds } = await useMultiFileAuthState(authInfoDir);

  app.connectMicroservice({
    strategy: new BaileysTransport({ state, saveCreds }),
  });
```

por:

```ts
  const { port, waSessionId } = appConfigs;
  // admin.initializeApp() above is what makes admin.database() usable here
  const authStore = FirebaseAuthStore.forSession(waSessionId);

  app.connectMicroservice({
    strategy: new BaileysTransport({ authStore }),
  });
```

- [ ] **Step 8: Verificar typecheck, lint, build y tests**

```bash
npx tsc --noEmit -p tsconfig.json
npx eslint "src/**/*.ts"
yarn build
yarn test
```

Expected: `tsc` sin salida y exit 0; eslint exit 0; build `Done`; `yarn test` con 26 tests en verde (19 del store + 7 de la política).

- [ ] **Step 9: Confirmar que no quedan referencias al auth state en disco**

```bash
grep -rn "useMultiFileAuthState\|authInfoDir" src/
```

Expected: sin resultados.

- [ ] **Step 10: Commit**

```bash
git add src/infrastructure/transporters/baileys.transport.ts src/main.ts src/configs/app.config.ts .env.example
git commit -m "feat(transport): load auth from Firebase and reconnect in-process"
```

---

## Verificación manual (requiere credenciales reales)

No es automatizable: necesita el `.env` con las claves de Firebase y escanear un QR con un teléfono.

1. `yarn start:dev`
2. Escanear el QR que aparece en la terminal.
3. **Confirmar que llega a `opened connection` sin reiniciar el proceso a mano.** Este es el criterio de aceptación del segundo requisito.
4. En la consola de Firebase, comprobar que existe `whatsapp-auth/default/creds` y varios nodos bajo `whatsapp-auth/default/keys/`.
5. Matar el proceso con Ctrl-C y volver a `yarn start:dev`: debe conectar **sin** pedir QR.
6. Opcional, para probar el camino de logout: cerrar la sesión desde WhatsApp (Dispositivos vinculados → cerrar sesión). El bot debe borrar `whatsapp-auth/default` y emitir un QR nuevo sin reiniciarse.

Si las escrituras fallan, lo primero a revisar son las reglas de seguridad de Realtime Database.

## Self-review

**Cobertura del spec:**

| Requisito del spec | Tarea |
|---|---|
| Layout `whatsapp-auth/<sessionId>` | 1, 2 |
| Valores como string JSON vía BufferJSON | 1, 2 |
| Codificación de IDs (7 caracteres, `%` primero) | 1 |
| `load()` / `saveCreds` | 1 |
| Keys store con caché write-through | 2 |
| Rehidratación de `app-state-sync-key` | 2 |
| Sin mutex (escritura atómica por path) | 2 (implícito: no se añade) |
| Caché por `load()`, no por instancia | 2, 3 |
| `clear()` | 3 |
| Nodo ausente vs error de lectura | 1 |
| `keys.get` devuelve null ante error | 2 |
| `keys.set`/`saveCreds` propagan error | 1, 2 (sin `catch`) |
| Tope de 10 reintentos | 4 |
| Backoff `min(30s, 2^(n-1))` | 4 |
| loggedOut borra y reintenta | 4, 5 |
| `open` resetea el contador | 5 |
| `close()` no reconecta | 5 |
| Quitar listeners del socket muerto | 5 |
| Transport recibe el store | 5 |
| `waSessionId` en config, quitar `authInfoDir` | 5 |
| `auth_info/` se conserva | Global Constraints |
| Verificación manual | sección aparte |

Sin huecos.

**Placeholders:** ninguno. Todos los pasos con código lo muestran completo.

**Consistencia de tipos:** `AuthRef` con los cuatro métodos se usa igual en Tasks 1-3. `encodeKeyId` se define en Task 1 y se consume en Task 2. `decideReconnect(statusCode, attempts)` y `ReconnectDecision` se definen en Task 4 y se consumen en Task 5 con esa firma exacta. `FirebaseAuthStore.forSession(sessionId)` se define en Task 1 y se usa en Task 5. `clear()` se define en Task 3 y se usa en Task 5.

**Nota sobre un test de Task 3:** `issues fresh credentials after a clear` compara `registrationId` entre dos `initAuthCreds()`. Es aleatorio en un rango amplio, así que la probabilidad de colisión es despreciable, pero es la única aserción del plan que no es estrictamente determinista.
