import { go2rtc } from '@/api/http'
import type { StreamInfo } from '@/types/stream'

interface RawProducer {
  remote_addr?: string
  sdp?: string
}
interface RawStream {
  producers?: RawProducer[] | null
  consumers?: unknown[] | null
}

/** 스트림별 상태. GET /go2rtc/api/streams */
export const fetchStreamInfo = async (signal?: AbortSignal): Promise<Record<string, StreamInfo>> => {
  const raw = (await go2rtc.get<Record<string, RawStream>>('/api/streams', { signal })).data
  const out: Record<string, StreamInfo> = {}
  for (const [key, stream] of Object.entries(raw)) {
    const live = (stream.producers ?? []).find((p) => p.remote_addr || p.sdp)
    const sdp = live?.sdp ?? ''
    const size = sdp.match(/a=framesize:\d+ (\d+)-(\d+)/)
    const codec = sdp.match(/a=rtpmap:\d+ ([A-Za-z0-9]+)\//)
    out[key] = {
      receiving: Boolean(live),
      viewers: stream.consumers?.length ?? 0,
      resolution: size ? `${size[1]}×${size[2]}` : null,
      codec: codec ? codec[1].toUpperCase() : null,
    }
  }
  return out
}
