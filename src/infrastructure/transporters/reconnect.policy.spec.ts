import { DisconnectReason } from 'baileys';
import { MAX_RECONNECT_ATTEMPTS, decideReconnect } from './reconnect.policy';

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
