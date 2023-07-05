import { Stream } from 'stream';
import { MessageResponseType } from '../enums/message-response-type.enum';

export type ResponseMessageContent = {
  type: MessageResponseType;
  conversationId: string;
  userId?: string;
  text?: string;
  media?: Buffer | Stream;
  mimetype?: string;
  ptt?: boolean;
  mentions?: string[];
};

export type ResponseMessageOptions = {
  quoted?: boolean;
  fakeQuoted?: string;
  reaction?:
    | '❤️'
    | '👍'
    | '👎'
    | '😂'
    | '😮'
    | '😢'
    | '😡'
    | '🎵'
    | '✅'
    | '❌'
    | '🎲'
    | string;
};

export type ResponseMessage = {
  content: ResponseMessageContent;
  options?: ResponseMessageOptions;
};
