// The rooms, in order, the hidey-hole and the egg cupboards.
import type { RoomSpec } from './room';
import { L01 } from './rooms/l01';
import { L02 } from './rooms/l02';
import { L03 } from './rooms/l03';
import { L04 } from './rooms/l04';
import { L05 } from './rooms/l05';
import { L06 } from './rooms/l06';
import { L07 } from './rooms/l07';
import { L08 } from './rooms/l08';
import { L09 } from './rooms/l09';
import { L10 } from './rooms/l10';
import { L11 } from './rooms/l11';
import { L12 } from './rooms/l12';
import { L13 } from './rooms/l13';
import { HIDEY } from './rooms/hidey';
import { FABERGE, ROTTEN } from './rooms/eggs';

export const ROOM_SPECS: RoomSpec[] = [L01, L02, L03, L04, L05, L06, L07, L08, L09, L10, L11, L12, L13, HIDEY, ROTTEN, FABERGE];
