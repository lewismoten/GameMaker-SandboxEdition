// Sound Blaster samples (.VOC).
import { registerEditor } from './index';
import { h, clear } from '../ui';
import { decodeVoc } from '../../formats/voc';
import { audio } from './mediaShared';

registerEditor(['voc'], (host, project, file) => {
  const bytes = project.files.get(file)!;
  const voc = decodeVoc(bytes);
  clear(
    host,
    h(
      'p',
      { class: 'hint' },
      `Sound Blaster sample: ${(voc.samples.length / voc.sampleRate).toFixed(2)} s at ${voc.sampleRate} Hz. Sound sets refer to it as “${file.replace(/\.voc$/, '')}”.`,
    ),
    h('button', { class: 'primary', onclick: async () => (await audio.resume(), audio.playVoc(bytes)) }, '▶ Play'),
  );
  return () => audio.stopVoc();
});
