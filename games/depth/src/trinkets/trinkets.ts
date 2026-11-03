// The plastic trinkets in Depth Perception's box: the figures of the game as printable toys.
// Each is the game's own model (models/), sized in make.ts.
import { rgb } from '../render/tracer';
import { count, docLeo, gwinn, teapotModel, teddy } from '../models/cast';
import { citicar } from '../models/citicar';
import { rayModel } from '../models/ray';
import type { TrinketDef } from './make';

export const TRINKETS: TrinketDef[] = [
  {
    id: 'ray',
    title: 'Roll Ray',
    blurb: 'The chrome sphere with every polygon intact.',
    shapes: () => rayModel('y', 0.5, rgb(255, 176, 32)),
    height: 56,
    maxWidth: 70,
  },
  {
    id: 'count',
    title: 'Count Polygon',
    blurb: 'Twenty faces of vampire, on a post so he stays put.',
    shapes: () => count(0, 0),
    height: 58,
    maxWidth: 75,
    grow: 1.3, // the cape's sails are thin sheets
    stem: { at: [0.5, 0.58], r: 0.045, top: 0.3 },
  },
  {
    id: 'chez',
    title: 'THE CHEZ',
    blurb: 'A 1976½ CitiCar, tomato red with a black roof.',
    shapes: () => citicar(0, 0, 1, [0, 0, 0]),
    height: 50,
    maxWidth: 90,
  },
  {
    id: 'teapot',
    title: 'The Teapot',
    blurb: 'The most rendered object there is.',
    shapes: () => [teapotModel([0, 0, 0], 1)],
    height: 50,
    maxWidth: 90,
  },
  {
    id: 'docleo',
    title: 'Doc Leo and the chicken',
    blurb: 'Doc Leo, his hat, and the rubber chicken on its red leash.',
    shapes: () => docLeo(0),
    height: 58,
    maxWidth: 70,
  },
  {
    id: 'teddy',
    title: 'Teddy',
    blurb: 'The corgi, ears up and tongue out.',
    shapes: () => teddy(2),
    grow: 0.8, // his feet are a hair apart from his chest in the model
    height: 52,
    maxWidth: 70,
  },
  {
    id: 'gwinn',
    title: 'Gwinn',
    blurb: 'The troublemaker, sitting pretty in her pink collar.',
    shapes: () => gwinn(0),
    height: 56,
    maxWidth: 70,
  },
];
