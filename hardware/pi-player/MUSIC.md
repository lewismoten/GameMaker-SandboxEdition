# CMF / OPL2 next cut

The selected prospective backend is [ymfm](https://github.com/aaronsgiles/ymfm), by
Aaron Giles and contributors, under BSD-3-Clause. Upstream supports YM3812 (OPL2).
No ymfm source or binary is bundled or linked in this phase; this is an integration
plan, not implemented music playback. Its C++14 requirement fits this C++17 host.

1. Pin and vendor a reviewed upstream commit with its complete BSD-3-Clause license,
   copyright notices and source provenance. Add the shipped license to the binary's
   notice set and update root NOTICE when actually linking it. Keep it host-only so
   ESP32 firmware size, build dependencies and licenses do not change.
2. Port this project's `web/packages/engine/src/audio/cmfLoad.ts` and `cmfPlayer.ts`
   behavior, checking `code/GM/SBMUSIC.C` read-only for DOS fidelity. Preserve the
   146 Hz CMF clock, 16-bit instrument-count quirks, channels, rhythm mode, running
   status and controller behavior. Retain original CMF bytes in a lossless host
   sidecar/profile; current Pocket packing is not the source of truth for music.
3. Feed sequencer register writes to `ymfm::ym3812`, with chip timers and the chip's
   native sample clock independent of video/game ticks. Resample into the existing
   48 kHz mono SDL callback, mix with VOC/speaker using fixed gains, and avoid all
   allocation, locks held by the render thread, or I/O inside the callback. Use a
   bounded command queue for song changes, stop and volume.
4. Test CMF event/register traces against the existing TypeScript sequencer, then
   record PCM for listening and audio-envelope/timing checks against the existing
   DOS captures. Different OPL emulators need not give byte-identical samples. Test
   rhythm-heavy, FM-heavy and voice-over-music scenes and ending-clip waits.
5. Measure callback duration and underruns on the actual ARMv6 Zero W at 720p;
   choose a lower synthesis rate only after measuring quality and CPU cost. Do not
   promise full-library music or a CPU budget from the Mac host result.

Primary sources: [ymfm README](https://github.com/aaronsgiles/ymfm/blob/main/README.md)
and [BSD-3-Clause license](https://github.com/aaronsgiles/ymfm/blob/main/LICENSE).
