// Portable audio log shared by the simulator and walkthrough recorder.
export type AudioEvent =
  | { t: number; kind: 'song'; bytes?: Uint8Array }
  | { t: number; kind: 'stopSong' }
  | { t: number; kind: 'pause'; paused: boolean }
  | { t: number; kind: 'speaker'; freqs: ArrayLike<number> }
  | { t: number; kind: 'stopSpeaker' }
  | { t: number; kind: 'voc'; bytes?: Uint8Array }
  | { t: number; kind: 'stopVoc' };
