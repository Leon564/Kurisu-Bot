import { MessageBody, SendData } from "../../shared/interfaces/types";

const tagAll = async (m: MessageBody): Promise<SendData> => {
   if(!m.isGroup) return { type: 'text', text: 'Este comando solo funciona en grupos' }
    const groupMetadata = await m.getGroupMetadata
    return {type:"mention", text: "`@${})"}
};