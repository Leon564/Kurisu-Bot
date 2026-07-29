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
 * the first retry waits 1s, the second 2s, and so on up to a 30s ceiling. Only a
 * successful connection resets it.
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
