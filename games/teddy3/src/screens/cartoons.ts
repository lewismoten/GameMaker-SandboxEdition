// The cartoons (FLIs) and the endings' pictures, built apart from screens.ts (they draw with
// it): the birthday morning before the title poster and the story pages, THE CHEZ driving on
// between Teddy's stops, the SURPRISE! at the end, the cast before the credits, and the won
// and lost pictures. screens.ts lists them in its slide shows by name.
import { birthdayFli } from './birthday';
import { castFli } from './cast';
import { driveFli } from './drive';
import { lostScreen, wonScreen } from './endings';
import { gif } from './screens';
import { surpriseFli } from './surprise';

export function buildCartoons(): Record<string, Uint8Array> {
  return {
    'birthday.fli': birthdayFli(),
    'drive.fli': driveFli(),
    'surprise.fli': surpriseFli(),
    'cast.fli': castFli(),
    'won.gif': gif(...wonScreen()),
    'lost.gif': gif(lostScreen()),
  };
}
