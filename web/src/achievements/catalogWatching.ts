// Achievement badges: watching.
import type { Achievement } from './catalogTypes';
import { COUNT_LEVELS } from './levels';

export const WATCHING_ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'watch-one', title: 'Sit back', desc: 'Watched a walkthrough to the end.', icon: '🍿', category: 'watching' },
  {
    id: 'watch-all',
    hard: true,
    title: 'Binge watcher',
    desc: 'Watched every walkthrough to the end.',
    icon: '📺',
    category: 'watching',
    from: 'walkthroughs',
    unit: 'walkthroughs',
  },
  ...COUNT_LEVELS['walks-watched'].goals.map((count, i, all): Achievement => ({
    id: `walks-watched-${count}`,
    title: ['Couch time', 'Matinee regular', 'Marathon viewer'][i],
    desc: `Watched ${count} different walkthroughs to the end.`,
    icon: '🛋️',
    category: 'watching',
    from: 'watchedCount',
    count,
    level: { family: 'walks-watched', n: i + 1, of: all.length },
    hard: i === all.length - 1,
    unit: 'walkthroughs',
  })),
  { id: 'watch-seek', title: 'Skip ahead', desc: 'Jumped around a walkthrough with its seek bar.', icon: '⏭️', category: 'watching' },
  { id: 'watch-bot', title: 'Robot rerun', desc: 'Watched a walkthrough the 🤖 walkthrough bot made, as far as it got.', icon: '📽️', category: 'watching' },
  { id: 'record-video', title: 'Rolling', desc: 'Recorded a video of the screen.', icon: '🎥', category: 'watching' },
  { id: 'download-mp4', title: 'Director’s cut', desc: 'Downloaded a walkthrough as an MP4 video.', icon: '🎞️', category: 'watching' },
];
