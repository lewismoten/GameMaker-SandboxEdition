# Function-match summary for every pair

Written by `scripts/player-diff/gmpdiff.py diff`. Counts are functions; see each pair's `summary.md` and `functions.tsv`.

| pair                                                           | required | old fns | new fns | identical | relocated | calls-differ | data-moved | constants | changed | removed | added | low-confidence matches |
| -------------------------------------------------------------- | -------- | ------- | ------- | --------- | --------- | ------------ | ---------- | --------- | ------- | ------- | ----- | ---------------------- |
| [3.00-xfer → 3.00-play](pairs/3.00-xfer__3.00-play/summary.md) |          | 604     | 612     | 196       | 276       | 2            | 115        | 6         | 6       | 3       | 11    | 3                      |
| [3.00-xfer → 3.00-aj](pairs/3.00-xfer__3.00-aj/summary.md)     |          | 604     | 598     | 229       | 218       | 1            | 54         | 43        | 49      | 10      | 4     | 9                      |
| [2.04 → 3.00-xfer](pairs/2.04__3.00-xfer/summary.md)           | yes      | 413     | 604     | 111       | 179       | 1            | 15         | 32        | 67      | 8       | 199   | 17                     |
| [2.02 → 2.04](pairs/2.02__2.04/summary.md)                     |          | 411     | 413     | 55        | 37        | 1            | 0          | 6         | 271     | 41      | 43    | 107                    |
| [2.00 → 2.02](pairs/2.00__2.02/summary.md)                     | yes      | 411     | 411     | 298       | 94        | 0            | 5          | 4         | 10      | 0       | 0     | 0                      |
| [2.02 → 3.00-xfer](pairs/2.02__3.00-xfer/summary.md)           |          | 411     | 604     | 54        | 37        | 1            | 0          | 6         | 263     | 50      | 243   | 111                    |
| [1.04 → 2.00](pairs/1.04__2.00/summary.md)                     |          | 359     | 411     | 61        | 28        | 0            | 0          | 11        | 167     | 92      | 144   | 72                     |
| [1.00-xfer → 1.04](pairs/1.00-xfer__1.04/summary.md)           | yes      | 355     | 359     | 120       | 132       | 0            | 43         | 9         | 47      | 4       | 8     | 8                      |
| [1.00-xfer → 1.00-play](pairs/1.00-xfer__1.00-play/summary.md) |          | 355     | 356     | 156       | 125       | 0            | 64         | 6         | 3       | 1       | 2     | 1                      |

## Names from `PLAYGAME.MAP` on 3.00-play

The MAP is from the 2014 source release and its segment sizes differ from the CD's 3.00-play, so names were applied only for code frames where at least 60% (and 3+) of the public offsets land on discovered function starts in one segment: 3 of 27 frames, 45 of 440 code publics. Names then spread to other builds through high- and medium-confidence matches.
