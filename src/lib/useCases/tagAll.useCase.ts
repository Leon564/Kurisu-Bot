import { MessageBody, MessageData, SendData } from "../../shared/interfaces/types";

const tagAll = async (data: MessageData): Promise<SendData> => {
    if (!data.message.isGroup) return { type: 'text', text: 'Este comando solo funciona en grupos' }
    const groupMetadata = await data.message.getGroupMetadata
    return { type: "mention", text: "`@${})" }
};