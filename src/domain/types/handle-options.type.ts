import { WAPresence } from '@whiskeysockets/baileys';

export type handleOptions = {
  setPresence?: (state: WAPresence) => void;
};
