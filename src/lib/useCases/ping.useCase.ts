import { MessageBody, SendData } from "../../shared/interfaces/types"

const getElapsedSeconds = (m: MessageBody): SendData => {
    const { timestamp } = m
    const now = new Date();
    const then = new Date(timestamp as number * 1000);
    const elapsedMilliseconds = now.getTime() - then.getTime();
    const elapsedSeconds = elapsedMilliseconds / 1000;
    const time = elapsedSeconds.toFixed(2) + "s";

    return {type: "text", text: '🏓 PONG! • ' + time,  quoted: true, reacttion: '🏓'} 
}

export default getElapsedSeconds
