# `media/`: demos and saving the screen

Part of the [source map](../README.md).

Demo playback (`.REC`, `demo.ts`), previews (`demoPreview.ts`, which demo
`demoKind.ts`, the recording one plays `demoSource.ts`), demos added for CD games (`extraDemos.ts`, `addedDemo.ts`), the attract mode
(`attractDemo.ts`), the demos' sound choice (`demoAudio.ts`) and which player may play
(`mediaFocus.ts`); saving the screen as video (MP4 or WebM: `video.ts`, `frames.ts`, `mp4Mux.ts`),
animated GIF (`gifEncode.ts`) or WAV (`wav.ts`). How they fit together is below.

## How the media fit together

`media/demo.ts` plays a `.REC` demo in the player; `media/demoPreview.ts` plays one
inside a picture on the home page, with the demos' sound choice (`demoAudio.ts`). The neighboring
[`walkthrough/`](../walkthrough/README.md) area plays a Sandbox game's `walkthrough.json` and
renders it to MP4 with its own `exportVideo.ts` and `mp4av.ts`.
`media/video.ts` turns canvases into video: frame by frame with WebCodecs and `mp4Mux.ts`, or live
with MediaRecorder (with the game's sound from `audioTap.ts`). Frame-by-frame MP4 needs an
available H.264 WebCodecs encoder; `frames.ts` falls back to real-time recording when there is
none. The live recorder tries MP4 first, then WebM, and cannot record if neither is supported.
`gifEncode.ts` writes animated GIFs and `wav.ts` sounds.
The desk's capture card (`desk/pc/capture.ts`) takes screenshots and
recordings of the PC's screen with `screenCapture.ts` and the live recorder; every download is
saved with `editor/core/ui.ts` `download`.
