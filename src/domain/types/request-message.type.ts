import { MessageType } from '../enums/message-type.enum';

export type RequestMessage = {
  id: string;
  userId?: string;
  userNumber: string;
  userName: string;
  device: string;
  fromMe: boolean;
  conversationId: string;
  message: MessageBody;
};

export type MessageBody = {
  type: MessageType;
  text?: string;
  media?: Buffer;
  mentions?: string[];
};
