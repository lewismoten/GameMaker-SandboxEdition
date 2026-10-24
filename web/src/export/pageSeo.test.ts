// An exported page carries the player's MIT notice, and a Bard game's page names its voice clips.
import { describe, expect, it } from 'vitest';
import { exportAbout, exportHead } from './pageSeo';
import { recordedAudioNotice } from './recordedAudio';

describe('an exported page’s notices', () => {
  it('keeps the MIT License in the head, as a comment', () => {
    const head = exportHead({ title: 'T' });
    expect(head).toMatch(/<!--[^]*MIT License[^]*Copyright \(c\) 2014 gandrewstone[^]*Permission is hereby granted[^]*-->/);
    expect(head.slice(4, head.indexOf('-->'))).not.toContain('--');
  });

  it('says in its text that the voice clips are non-commercial', () => {
    const audio = recordedAudioNotice(['HEY', 'YAY'])!;
    const about = exportAbout({ title: 'T', audio });
    expect(about).toContain('non-commercial');
    expect(about).toContain('HEY, YAY');
    expect(exportAbout({ title: 'T' })).not.toContain('non-commercial');
    expect(about).toContain('MIT licensed');
  });
});
