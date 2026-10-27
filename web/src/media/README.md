# `media/`: demos and saving the screen

Part of the [source map](../README.md).

Demo playback (`.REC`, `demo.ts`), previews (`demoPreview.ts`, which demo
`demoKind.ts`, the recording one plays `demoSource.ts`), demos added for CD games (`extraDemos.ts`, `addedDemo.ts`), the attract mode
(`attractDemo.ts`), the demos' sound choice (`demoAudio.ts`) and which player may play
(`mediaFocus.ts`); saving the screen as video (MP4: `video.ts`, `frames.ts`, `mp4Mux.ts`),
animated GIF (`gifEncode.ts`) or WAV (`wav.ts`). How they fit together is below.

## How the media fit together

`media/demo.ts` plays a `.REC` demo in the player; `media/demoPreview.ts` plays one
inside a picture on the home page, with the demos' sound choice (`demoAudio.ts`). `walkthrough/`
plays a Sandbox game's `walkthrough.json` and renders it to MP4 (`exportVideo.ts`, `mp4av.ts`).
`media/video.ts` turns canvases into video: frame by frame with WebCodecs and `mp4Mux.ts`, or live
with MediaRecorder (with the game's sound from `audioTap.ts`). `gifEncode.ts` writes animated GIFs
and `wav.ts` sounds. The desk's capture card (`desk/pc/capture.ts`) takes screenshots and
recordings of the PC's screen with `screenCapture.ts` and the live recorder; every download is
saved with `editor/core/ui.ts` `download`.
