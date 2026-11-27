// A loaded clip can still fail to play when the browser disallows autoplay.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';
import { headlessShell, launch } from './perfLib';
import { observePlayback } from './offlinePlayback';

it('counts only successful playback of the loaded voice clip', async () => {
  const browser = await chromium.launch({ executablePath: headlessShell(), args: ['--autoplay-policy=user-gesture-required'] });
  try {
    const ctx = await browser.newContext();
    const clips = await observePlayback(ctx);
    const path = '/tour/voice/home/home-hello.ogg';
    const url = 'http://localhost' + path;
    await ctx.route(url, (route) => route.fulfill({ contentType: 'audio/ogg', body: readFileSync('public' + path) }));
    await ctx.route('http://localhost/', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: `<button>Play</button><output></output><script>
      const audio = new Audio('${path}');
      audio.oncanplaythrough = async () => {
        audio.oncanplaythrough = null;
        try { await audio.play(); } catch (e) { document.querySelector('output').textContent = e.name; }
      };
      document.querySelector('button').onclick = () => audio.play();
    </script>`,
      }),
    );
    const page = await ctx.newPage();
    await page.goto('http://localhost/');
    await page.getByText('NotAllowedError').waitFor();
    expect(clips).toEqual([]);
    await page.getByRole('button').click();
    await expect.poll(() => clips).toEqual([url]);
  } finally {
    await browser.close();
  }
});

it('counts a decoded phone recording once its source finishes playing', async () => {
  const browser = await launch();
  try {
    const ctx = await browser.newContext();
    const clips = await observePlayback(ctx);
    const path = '/phone/voice/grandma/grandma-1-1.ogg';
    const url = 'http://localhost' + path;
    await ctx.route(url, (route) => route.fulfill({ contentType: 'audio/ogg', body: readFileSync('public' + path) }));
    await ctx.route('http://localhost/', (route) => route.fulfill({ contentType: 'text/html', body: '<button>Answer</button>' }));
    const page = await ctx.newPage();
    await page.goto('http://localhost/');
    await page.evaluate(async (url) => {
      const audio = new AudioContext();
      const source = audio.createBufferSource();
      source.buffer = await audio.decodeAudioData(await (await fetch(url)).arrayBuffer());
      source.connect(audio.destination);
      document.querySelector('button')!.onclick = () => source.start(audio.currentTime + 0.03, 0, 0.05);
    }, url);
    expect(clips).toEqual([]);
    await page.getByRole('button').click();
    await expect.poll(() => clips).toEqual([url]);
  } finally {
    await browser.close();
  }
});
