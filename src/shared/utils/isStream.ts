import { Stream } from 'stream'

export default function isStream (objeto: any) {
  return objeto instanceof Stream
}
