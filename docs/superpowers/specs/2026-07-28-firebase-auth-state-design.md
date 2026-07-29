# Auth state de Baileys en Firebase + reconexión automática

Fecha: 2026-07-28
Rama: `baileys-v7-migration`
Estado: aprobado, pendiente de implementar

## Objetivo

Dos cambios:

1. Guardar las credenciales de la sesión de WhatsApp en Firebase Realtime
   Database en lugar de la carpeta local `auth_info/`, reutilizando la conexión
   que ya define el `.env`.
2. Eliminar la necesidad de reiniciar el proceso a mano después de escanear el
   QR.

## Contexto

`src/main.ts` llama hoy a `useMultiFileAuthState(authInfoDir)` y pasa el
`{ state, saveCreds }` resultante al constructor de `BaileysTransport`.

`BaileysTransport.listen()` crea el socket una sola vez, y en
`connection.update` con `connection === 'close'` hace `process.exit()` cuando el
cierre no fue un logout, delegando el reinicio a pm2 (`yarn start` es
`pm2 start 'node dist/main'`). Con `start:dev` (`nest start --watch`) no hay pm2,
así que el proceso simplemente muere y hay que arrancarlo a mano — que es la
molestia a resolver.

El proyecto ya usa Realtime Database: `FirebaseService` trabaja con
`admin.database()` y `.ref()`, y `.env` define `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, `FIREBASE_CLIENT_DATABASE_URL` y
`FIREBASE_PRIVATE_KEY`. `admin.initializeApp()` ya corre en `main.ts` antes de
crear el auth state, así que el store puede apoyarse en él.

Existe una implementación de referencia en `E:\Dev\Kurisu-Multidevice`
(`src/database/auth.service.ts`), pero usa MongoDB. Aporta el patrón general
—`initAuthCreds`, `BufferJSON`, llaves indexadas por `type:id`— no el backend.

No hay sesión que migrar: `auth_info/` solo contiene los archivos de cookies de
YouTube, y `.gitignore` excluye `auth_info/*`. Habrá que escanear el QR una vez,
lo que coincide con el re-escaneo que la migración a v7 probablemente exige de
todas formas.

## Decisiones

| Tema | Decisión |
|---|---|
| Backend | Realtime Database (ya configurado; no se añade Firestore) |
| Layout | Un nodo por llave, con caché write-through en memoria |
| Formato de valores | String JSON vía `BufferJSON`, no objeto nativo de RTDB |
| Reconexión | `connect()` re-invocable dentro del mismo proceso, con backoff |
| loggedOut | Borrar credenciales de Firebase y emitir QR nuevo, con tope de reintentos |
| Multi-sesión | No. Un `sessionId` configurable, con valor `default` |

## Layout en Realtime Database

```
whatsapp-auth/<sessionId>/
  creds                       → string JSON
  keys/<tipo>/<idCodificado>  → string JSON
```

`<tipo>` es la clave de `SignalDataTypeMap`: `pre-key`, `session`, `sender-key`,
`sender-key-memory`, `app-state-sync-key`, `app-state-sync-version`,
`lid-mapping`, `device-list`, `tctoken`, `identity-key`.

### Por qué string JSON y no objeto

RTDB coacciona tipos de forma silenciosa: descarta `undefined`, elimina objetos
vacíos y convierte arrays dispersos en objetos indexados. Un auth state contiene
Buffers, arrays y campos opcionales; dejar que RTDB los reinterprete produce
corrupción sutil que solo aparece al reconectar. Guardar el resultado de
`JSON.stringify(value, BufferJSON.replacer)` hace el round-trip exacto.

El costo es que los nodos no son legibles en la consola de Firebase. Para blobs
de material criptográfico eso no tiene valor práctico.

### Codificación de IDs

RTDB prohíbe `.`, `#`, `$`, `[`, `]` y `/` en los nombres de clave. Los IDs de
Baileys los contienen: las sesiones usan el formato `<user>.<device>` y los JIDs
incluyen `:` y `@`. `useMultiFileAuthState` solo sanea `/` y `:`
(`fixFileName`), porque a un nombre de archivo el punto no le estorba.

Se escapan siete caracteres, `%` primero para que la codificación sea libre de
colisiones:

```
%  → %25     (siempre primero)
.  → %2E
#  → %23
$  → %24
/  → %2F
[  → %5B
]  → %5D
```

No necesita ser reversible: la interfaz de Baileys siempre entrega los IDs
explícitamente, nunca hay que reconstruirlos enumerando nodos. El borrado total
de una sesión se hace eliminando el subárbol completo.

## Componentes

### `src/infrastructure/auth/firebase-auth.store.ts` (nuevo)

```ts
class FirebaseAuthStore {
  constructor(sessionId: string)
  load(): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }>
  clear(): Promise<void>
}
```

`load()`:

- Lee el nodo `creds`. Si existe, `JSON.parse(str, BufferJSON.reviver)`; si no
  existe, `initAuthCreds()`.
- Construye el `SignalKeyStore`:
  - `get(type, ids)`: por cada id consulta la caché; si falla, lee
    `keys/<type>/<enc(id)>` y parsea. Para `type === 'app-state-sync-key'`
    rehidrata con `proto.Message.AppStateSyncKeyData.fromObject(value)`. Guarda
    en caché y devuelve el mapa `{ [id]: value }`.
  - `set(data)`: por cada `type`/`id`, valor falsy → `remove()` del nodo y de la
    caché; valor presente → `set(JSON.stringify(value, BufferJSON.replacer))` y
    caché. Todo en paralelo con `Promise.all`.
- `saveCreds`: escribe el nodo `creds` completo como string JSON.

La rehidratación de `app-state-sync-key` no es opcional: está en
`use-multi-file-auth-state.js:104` y sin ella se rompe el app-state sync.

La caché es un `Map` por `tipo:id`, write-through, sin límite de tamaño. Para un
solo bot el volumen es pequeño (las pre-keys son cientos). Si algún día importa,
`lru-cache` ya está disponible como dependencia transitiva de baileys.

La caché vive **por invocación de `load()`**, no en la instancia del store. Es
deliberado: tras un `clear()` seguido de `load()` la sesión es otra, y una caché
compartida a nivel de instancia filtraría llaves de la sesión muerta a la nueva.
Atarla al `state` devuelto elimina ese modo de fallo por construcción, en vez de
depender de que `clear()` recuerde vaciarla.

No se replica el mutex por archivo de la versión en disco: existe por carreras
de `fs`, y aquí cada llave vive en su propio path con escritura atómica del SDK.

### `src/infrastructure/transporters/baileys.transport.ts` (modificado)

El constructor pasa a recibir `{ authStore }` en lugar de
`{ state, saveCreds }`. Tras un loggedOut hacen falta credenciales nuevas, así
que el transport necesita algo capaz de cargarlas y borrarlas, no el resultado
ya materializado.

Estado interno nuevo: `reconnectAttempts` y un flag `closing` para distinguir el
cierre intencional de Nest de una caída.

`listen()` delega en `connect()`, que:

1. `const { state, saveCreds } = await this.authStore.load()`
2. crea el socket con `auth: state` y la versión de WA fija que ya usa el código
3. engancha `creds.update`, `connection.update` y `messages.upsert`

Manejo de `connection === 'close'`:

- si `closing` → no hace nada
- `loggedOut` (401) → `authStore.clear()`, contador a cero y reconecta de
  inmediato, lo que emite un QR nuevo
- cualquier otro código → incrementa el contador; si supera 10 intentos loguea
  error y se detiene; si no, espera `min(30s, 2^(n-1) segundos)` y reconecta,
  donde `n` es el número de intento ya incrementado. El primer reintento espera
  1s, el segundo 2s, y así hasta el techo de 30s
- `connection === 'open'` → contador a cero

Antes de reconectar se quitan los listeners del socket muerto
(`removeAllListeners` por evento) para no procesar mensajes por duplicado.

`close()` marca `closing = true` y cierra el socket. `unwrap()` no cambia.

El `515 restartRequired` que WhatsApp envía justo después de escanear el QR no
es un logout, así que entra por la rama de backoff y reconecta en ~1s con las
credenciales recién guardadas. De ahí sale el requisito de "sin reinicio
manual", sin código dedicado a ese caso.

### `src/main.ts` (modificado)

Quita el import de `useMultiFileAuthState` y el uso de `authInfoDir`. Después de
`admin.initializeApp()`:

```ts
const authStore = new FirebaseAuthStore(appConfigs.waSessionId);
app.connectMicroservice({ strategy: new BaileysTransport({ authStore }) });
```

### `src/configs/app.config.ts` (modificado)

Elimina `authInfoDir`, que queda sin uso, y añade
`waSessionId: process.env.WA_SESSION_ID || 'default'`. Se documenta
`WA_SESSION_ID` como opcional en `.env.example`.

La carpeta `auth_info/` se conserva: `youtube.service.ts:23` la usa para las
cookies con la ruta hardcodeada, independiente de `authInfoDir`.

## Flujo de datos

Arranque sin credenciales:

```
main.ts → initializeApp → new FirebaseAuthStore('default')
        → BaileysTransport.listen() → connect()
        → authStore.load() → nodo creds ausente → initAuthCreds()
        → socket emite qr → se imprime en terminal
        → usuario escanea
        → creds.update → saveCreds → escribe whatsapp-auth/default/creds
        → close(515) → backoff 1s → connect() → load() lee creds → open
```

Arranque con credenciales: igual pero `load()` encuentra `creds`, no se emite QR
y la conexión abre directamente.

## Manejo de errores

El punto crítico es **distinguir "el nodo no existe" de "falló la lectura"**. Si
un error transitorio de Firebase se interpretara como ausencia de credenciales,
el bot arrancaría una sesión nueva y forzaría un re-escaneo, perdiendo la sesión
válida. Nodo ausente → `initAuthCreds()`; error de lectura → excepción, el bot
no arranca.

- `keys.get` con error de lectura → devuelve `null` para ese id y loguea
  warning, igual que la implementación en disco, que traga cualquier error.
- `keys.set` y `saveCreds` con error → loguean y propagan. Un fallo silencioso
  aquí significa que la sesión no persiste y el próximo arranque pide QR; debe
  ser visible.
- Tope de 10 reintentos de reconexión para no girar en vacío generando QRs si
  WhatsApp rechaza la cuenta de forma persistente.

## Pruebas

No hay ningún `.spec.ts` en el repo, pero jest ya está configurado
(`testRegex: .*\.spec\.ts$`, `rootDir: src`), así que los specs nuevos corren
con `yarn test` sin tocar configuración.

`FirebaseAuthStore`, contra un ref de RTDB falso en memoria:

- round-trip de Buffers a través de `BufferJSON`
- codificación de IDs que contienen `.`, `/`, `:` y `#`
- rehidratación de `app-state-sync-key`
- borrado del nodo cuando el valor es nulo
- la caché evita la segunda lectura
- round-trip con la salida real de `initAuthCreds()`, verificando que las
  credenciales sobreviven save→load idénticas
- error de lectura en `load()` lanza, en vez de degradar a sesión nueva
- `clear()` seguido de `load()` no devuelve llaves de la sesión anterior desde
  la caché

Reconexión, con timers falsos:

- loggedOut llama a `clear()` y reconecta
- cierre transitorio aplica backoff
- el tope corta los reintentos
- `open` resetea el contador
- `close()` de Nest no dispara reconexión

Verificación manual: `start:dev`, escanear el QR, confirmar que conecta sin
reinicio y que aparece `whatsapp-auth/default` en RTDB; luego reiniciar el
proceso y confirmar que entra sin pedir QR.

## Riesgos

- **Reglas de seguridad de RTDB.** El service account de admin las evita, así
  que debería funcionar, pero es lo primero a revisar si fallan las escrituras.
  No es verificable sin acceso a la base.
- **Re-escaneo obligatorio.** No hay sesión previa que importar, y v7 exige
  claves de auth nuevas (`lid-mapping`, `device-list`, `tctoken`).
- **Sin pm2 como red de seguridad.** Al dejar de hacer `process.exit()`, un modo
  de fallo no contemplado deja el proceso vivo pero desconectado en lugar de
  reiniciarse. El tope de reintentos loguea un error claro al agotarse.

## Fuera de alcance

- Multi-sesión real (varias cuentas simultáneas)
- Exponer el QR por HTTP o WebSocket, como hace el proyecto de referencia
- Migrar `FirebaseService` a un patrón inyectable o dejar de llamar `init()` en
  cada método
