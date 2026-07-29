import { WAPresence } from 'baileys';

export type handleOptions = {
  setPresence?: (state: WAPresence) => void;
  tagAll?: () => void;
};
