// Who made each picture the BBSes offer for download (retro/bbs/gallery.ts: the Sandbox BBS's GIF
// Gallery and The Sofa's GIF area), with alt text, for the Credits page's "Pictures on the BBS".
// The photos are Lewis's own, except one shot taken by Nicky Foster (NOTICE.md).

/** Nicky Foster's shot of Lewis holding Teddy in front of THE CHEZ, in two sizes. */
const NICKY =
  'Photo: Nicky Foster, Front Royal-Warren County Chamber of Commerce: a promotional photo of Lewis as a sponsor of its upcoming Revitalize or Die Civic Pride Workshop';
const LEWIS = 'Photo: Lewis Moten';

interface PictureCredit {
  alt: string;
  credit: string;
}

const teddy = 'Teddy the corgi lying on a pale floor, mouth open in a smile, ears up';
const library = 'A little red and white lending-library box on a post, its door open on rows of books, above a box of seed packets';
const chezLights = 'THE CHEZ, a small red wedge-shaped CitiCar, at dusk, strung with colored Christmas lights and a big bow on its hood';
const chezTeddy = 'Lewis holding Teddy the corgi in his arms, standing in front of THE CHEZ, a small red CitiCar, on a town street';
const chezPlug = 'THE CHEZ, a small red wedge-shaped CitiCar, plugged in at a public charging station beside a red sedan';
const leoWalk = 'Doc Leo, the hobo clown, in white mouth makeup and a dark jacket, walking a rubber chicken on a leash down the middle of a road';
const leoNose = 'Lewis looking up at a round red clown nose on his own nose, a ceiling fan behind him';

/** By 8.3 name; every picture in gallery.json has one (bbsPictures.test.ts). */
export const PICTURE_CREDITS: Record<string, PictureCredit> = {
  'TEDDY.GIF': { alt: teddy, credit: LEWIS },
  'TEDDY16G.GIF': { alt: `${teddy}, in 16 grays`, credit: LEWIS },
  'TEDDY.JPG': { alt: teddy, credit: LEWIS },
  'GWINN.JPG': { alt: 'Teddy the corgi and Gwinn, a brown dog, sitting on leashes on green grass, looking up', credit: LEWIS },
  'GAZEBO.GIF': { alt: 'Lewis in sunglasses taking a selfie with Teddy the corgi, a white gazebo and brick buildings behind them', credit: LEWIS },
  'HOBO1.GIF': { alt: 'A gray portrait of Lewis as a hobo clown in a fedora and glasses, his face made up', credit: LEWIS },
  'HOBO2.GIF': { alt: 'A gray selfie of the hobo clown in a fedora and glasses on a small-town street', credit: LEWIS },
  'HOBO3.JPG': {
    alt: 'A gray selfie of the hobo clown in a fedora, a rubber chicken poking up at the right, clown pictures on the wall behind',
    credit: LEWIS,
  },
  'COLONIAL.GIF': { alt: 'Lewis in colonial dress and a tricorn hat beside a man dressed as George Washington, outdoors', credit: LEWIS },
  'DOGHOUSE.JPG': { alt: library, credit: LEWIS },
  'LIBRARY.GIF': { alt: `${library}, in 16 colors`, credit: LEWIS },
  'CHEZ.JPG': { alt: chezPlug, credit: LEWIS },
  'CHEZXMAS.GIF': { alt: chezLights, credit: LEWIS },
  'CHEZTED.GIF': { alt: chezTeddy, credit: NICKY },
  'CHEZPLUG.GIF': { alt: chezPlug, credit: LEWIS },
  'LEOWALK.GIF': { alt: leoWalk, credit: LEWIS },
  'LEONOSE.GIF': { alt: leoNose, credit: LEWIS },
  'THECHEZ1.GIF': { alt: chezLights, credit: LEWIS },
  'THECHEZ2.GIF': { alt: chezTeddy, credit: NICKY },
  'THECHEZ3.GIF': { alt: chezPlug, credit: LEWIS },
  'BARDLOGO.GIF': { alt: 'The Bard of Bizarre logo: a rooster in spectacles above ornate red, blue and gold lettering', credit: 'Logo made with DeepAI' },
  'LEOCHICK.GIF': { alt: leoWalk, credit: LEWIS },
  'NEWNOSE.GIF': { alt: leoNose, credit: LEWIS },
};

/** The picture's thumbnail on the Credits page (public/credits/bbs, 240x180 at most). */
export const thumbOf = (name: string) => `./credits/bbs/${name.toLowerCase().replace('.', '-')}.webp`;
