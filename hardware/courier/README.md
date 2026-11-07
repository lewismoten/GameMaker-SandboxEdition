# Courier C99 wire library

Dependency-free, MIT-licensed C for the CYD and Pi courier format. Build both
`.c` files into the application; the library uses only `<stddef.h>`, `<stdint.h>`
and `<string.h>`. It does not generate entropy, allocate a heap, open files,
access a clock, use device identifiers, or depend on an OS. Hardware integration
and actual target builds are not part of this library's host evidence.

## Source and compatibility

The interoperability reference is this repository's `feature/courier-visits`
commit **`56e048a715be2028187a64cfe278ee765122a816`**:

- `web/src/courier/courierId.ts`: generation, shape and Luhn algorithm.
- `web/src/courier/capsule.ts`: layout, counts, CRC, encode/decode behavior.
- `web/src/courier/tables.ts`: table version 1 and 16 worlds.

The November 7 design's **as-built visits** section supersedes its earlier
proposal: v1 is **512 bytes**, uses three 16-byte self-checking IDs, carries up
to three **u32 catalog hashes**, and has no look IDs or per-stamp sequence
numbers. Do not implement the older 256-byte / 64-bit-trip / 32-byte-package-hash
proposal alongside it. The full original task was recovered from its parent
request; its truncated copy was not used to infer additional protocol fields.
The private design itself is not distributed with this code.

### Self-checking ID

Lowercase UUID text is exactly 36 characters, `8-4-4-4-12`, plus a terminating
NUL when this library writes text. Number the **32 hex digits**, excluding
hyphens, from zero:

| Digit | Meaning                                     |
| ----- | ------------------------------------------- |
| 12    | `4` (UUID version)                          |
| 13    | `c` (courier mark)                          |
| 16    | `8` through `b` (UUID variant)              |
| 24    | Luhn mod 16, fifth digit of the fifth group |

Remove digit 24 entirely. Starting at the right of the remaining 31 digits,
double the first, alternate double/single moving left, sum each product's
base-16 quotient and remainder, and choose `(16 - sum % 16) % 16` as digit 24.
This is not Luhn with a zero substituted at digit 24. Uppercase, bad separators,
other versions, missing markers, and bad checksums are rejected.

`courier_id_make` calls the caller's RNG callback **once for 16 bytes**, then
sets version, marker, variant and check. 114 random bits remain. The callback
must fill every byte with uniform, independent random bits and return zero;
nonzero means failure. Use a securely seeded platform RNG. Never seed or derive
an ID from time, MAC, serial, efuse, user agent, world name, or other IDs. The
library cannot assess entropy or compensate for a broken RNG. The ID check and
CRC detect damage; neither proves identity or prevents forgery.

For input random bytes `00 01 ... 0f`, TypeScript and C produce:

```text
00010203-0405-4c07-8809-0a0bfc0d0e0f
```

### Capsule v1 bytes

No text, struct padding, native-endian integers or platform pointers go on wire.
All multi-byte integers are **little-endian**. All IDs are 16 bytes in the
UUID text's hex order, not a platform UUID struct's endian-swapped layout.

| Offset   | Bytes    | Field                                                            |
| -------- | -------- | ---------------------------------------------------------------- |
| 0        | 4        | ASCII `SCT1`                                                     |
| 4        | 1        | Version `1`                                                      |
| 5        | 1        | Table version `1`                                                |
| 6        | 1        | Flags `0`                                                        |
| 7        | 1        | Courier's home world                                             |
| 8        | 16       | Trip ID                                                          |
| 24       | 16       | Home screen ID                                                   |
| 40       | 16       | Sending screen ID                                                |
| 56       | 1        | Package count, 0..3                                              |
| 57       | 4 each   | Package game hashes                                              |
| variable | 1        | Postcard count, 0..8                                             |
| variable | per card | Origin screen ID (16), world (1), stamp count (1, 0..64), stamps |
| last 4   | 4        | CRC-32 of all preceding bytes                                    |

Stamp kind `0` is followed by a u32 game hash. Kinds `1` (Sample CD), `2`
(graduation), and `3` (mystery) have no payload. The CRC is reflected
CRC-32/ISO-HDLC (ZIP): polynomial `0xedb88320`, initial/final XOR `0xffffffff`.
The complete file is 62..512 bytes, including CRC. Counts have individual
bounds **and** must fit the total size. Empty packages/cards/stamps are allowed.
Decode rejects worlds outside 0..15, duplicate postcard origin IDs, invalid IDs,
nonzero flags, unknown versions/tables/kinds, incomplete fields, trailing bytes,
and bad CRC. No undocumented length or sequence field is added.

`capsule.ts` hashes a catalog ID with 32-bit FNV-1a over JavaScript **UTF-16
code units** (initial `0x811c9dc5`, multiply `0x01000193` after each XOR, modulo
2^32). This C API takes the resulting `uint32_t` hashes, not strings. For ASCII
catalog IDs byte hashing agrees; UTF-8 hashing in general does not. A trusted
catalog can ship the hashes as constants. Hash zero is a valid wire value.

## API and ownership

See both headers for every declaration and error value. No function takes
ownership. A text input uses an explicit length; it need not be NUL-terminated.
Advertised input and output capacities must really be readable/writable. NULL
required pointers return an argument error (validators return false).

- `courier_id_make(out, capacity, rng, context)` writes 37 bytes on success.
- `courier_id_is_valid(text, length)` and `courier_id_bytes_valid(id)` validate.
- `courier_id_parse(text, length, &id)` converts strict text to binary.
- `courier_id_format(&id, out, capacity)` validates and writes lowercase text.
- `courier_capsule_encode(&cap, bytes, capacity, &length)` writes only the
  returned length. The encoded version/table/flags are fixed by this v1 API.
- `courier_capsule_decode(bytes, length, catalog, context, &cap)` validates the
  entire file before publishing an output or calling the catalog callback.

**Every failure leaves output bytes, output structs and the output length
unchanged.** RNG state may have advanced on RNG failure. Callbacks must not
modify input/output storage. Input/output overlap is supported by staging;
`written` must be a separate `size_t` object, not overlap other arguments.
Functions are reentrant; callbacks and caller storage must be safe for the
caller's concurrency model.

Decode checks in TypeScript order: size, magic, version/table, checksum, then
contents. The corresponding C errors are `SIZE`, `NOT_CAPSULE`, `VERSION_ERROR`,
`TAMPERED`, `MALFORMED`. `ARGUMENT` and encode `CAPACITY` are C storage errors.
No exceptions or globals are used.

The catalog callback returns nonzero only for a hash in the receiver's trusted
**public** catalog. Unknown packages are removed, unknown game stamps become
mystery stamps **with hash zero**, and special stamps never retain a hash.
NULL means every game is unknown. Unlike TS, callbacks are deferred until the
whole capsule validates, so malformed input cannot trigger partial lookup side
effects. This does not change successful decoded data. A callback accepting
all hashes is useful for byte-round-trip tests, **not for displaying untrusted
game names or approving packages**. Hash collisions and catalog availability
are application concerns. The C representation keeps hashes, not the catalog
strings returned by the TypeScript lookup.

For compatibility with TS **encode**, an out-of-range world byte or duplicate
postcard origin can be encoded, but will be refused by both decoders. Unknown
C stamp kinds encode as mystery, matching TS's fallback. A TS `game` stamp with
a missing/empty game ID must be represented as a mystery stamp in C; a C GAME
stamp always has an explicit u32 hash. Inactive array elements are ignored.
Initialize application structs before populating them.

### Usage

The application supplies `rng` and `catalog` with the signatures in the headers:

```c
#include "courier_id.h"
#include "capsule.h"

int courier_example(courier_random_fn rng, void *rng_context,
                    courier_catalog_fn catalog, void *catalog_context)
{
    char text[COURIER_ID_CAPACITY];
    uint8_t wire[COURIER_CAPSULE_MAX];
    size_t length;
    courier_capsule outgoing = {0}, incoming;
    if (courier_id_make(text, sizeof text, rng, rng_context) != COURIER_ID_OK)
        return 1;
    if (courier_id_parse(text, COURIER_ID_LENGTH, &outgoing.trip) != COURIER_ID_OK)
        return 1;
    /* Real home/from are independently generated ONCE and persisted per screen. */
    if (courier_id_make(text, sizeof text, rng, rng_context) != COURIER_ID_OK ||
        courier_id_parse(text, COURIER_ID_LENGTH, &outgoing.home) != COURIER_ID_OK)
        return 1;
    if (courier_id_make(text, sizeof text, rng, rng_context) != COURIER_ID_OK ||
        courier_id_parse(text, COURIER_ID_LENGTH, &outgoing.from) != COURIER_ID_OK)
        return 1;
    outgoing.world = 3;
    if (courier_capsule_encode(&outgoing, wire, sizeof wire, &length) != COURIER_CAPSULE_OK)
        return 1;
    return courier_capsule_decode(wire, length, catalog, catalog_context, &incoming)
        == COURIER_CAPSULE_OK ? 0 : 1;
}
```

The codec does **not** enforce same-screen rejection, active-trip ownership,
home-postcard exclusion, visited-screen checks, one-time return, consent,
transactional persistence, or known-public-game policy on outbound packages.
The application must enforce those before transferring or storing anything,
as `trips.ts` and `courierStore.ts` do in the web implementation. In particular,
valid courier IDs do not prove a trip belongs to the current device.

## Build and host evidence

From the repository root:

```sh
cc -std=c99 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Werror \
  -fsyntax-only hardware/courier/courier_id.c hardware/courier/capsule.c
# Link both .c files with the application's own main and RNG/catalog adapters.
```

Requires C99 implementations with `uint8_t` and `uint32_t`, available on the
intended targets. No unaligned access or host-endian assumption is made. The
fixed-array decoded struct is deliberately larger than a wire capsule; allocate
persistent output in suitable caller storage. Decode uses another full struct
on the stack to guarantee atomic output. Encode stages 512 bytes. These are
**not** claims of a sub-2-KiB stack/static-RAM budget: measure stack, object
size, entropy and transport/storage integration on each target.

Initial implementation smoke checks and independent host acceptance used GCC 15.2.0
on Linux. Host acceptance compares against the actual pinned TypeScript modules,
not expected bytes produced by the C library. The checked-in JSON records the
oracle inputs, exact wire bytes, expected errors and post-catalog canonical bytes;
`tests/vectors.h` is the same corpus in C initializers, so the normal test run
needs **only make and a C99 compiler**, not Node, Python, npm or a JSON parser.

```sh
make -C hardware/courier test
make -C hardware/courier sanitize   # compiler/runtime support for ASan + UBSan required
# Optional test-sensitivity check; Python 3 stdlib, make and the same C99 compiler:
python3 hardware/courier/tests/check_mutations.py
```

The test runner covers:

- 32 deterministic TypeScript ID vectors, including zero/all-one entropy and
  all four UUID variants; the actual TS `randomUUID` and `getRandomValues` paths
  agree on each supplied entropy fixture.
- Every single-nibble replacement (15,360 rejected), all 256 byte possibilities
  at each text position, length/separator/case failures, check digit at textual
  index 28 (hex index 24), binary/text round trips, RNG failure, NULL arguments,
  exact allocations, capacity canaries, and input/output overlap.
- Adjacent hex-digit swaps, including across dashes: **839 of 873** changed pairs
  rejected. The 34 accepted swaps illustrate why this check is not authentication;
  the protocol promises “most,” not all. Equal neighbors are not counted as typos.
- 29 TS capsule encode cases: empty/minimal, all 16 world IDs, mixed stamp kinds,
  Unicode UTF-16 catalog hashes, missing/empty GAME fallback, unknown-kind fallback,
  3/4 packages, 8/9 postcards, 64/65 stamps, exact 512-byte fit and size overflow.
  Encoder-permitted worlds/duplicates are rejected by both decoders as specified.
- 336 TS rejection vectors: every prefix truncation and per-byte corruption of
  the mixed capsule, CRC-repaired structural truncations, magic/version/table/flags,
  invalid IDs/worlds/kinds/counts, trailing bytes and oversize. Exact error categories
  agree, with output bytes/struct/length unchanged on failure. The C callback is not
  invoked on rejected input (deliberately stronger than TS callback timing).
- Known-catalog and NULL-catalog canonical serialization, unknown GAME hash clearing,
  zero-valued hashes, unaligned/exact-size input, overlapping encode/decode, every
  insufficient output capacity and maximal `size_t` in-memory counts.
- 12,000 deterministic bounded capsule inputs (2,277 valid raw-hash round trips)
  plus 12,000 arbitrary ID inputs; no crash or sanitizer finding. This is bounded
  fuzz coverage, not exhaustive proof.

Both ordinary and ASan/UBSan runs pass. Eight disposable, independently compiled
source mutations are caught by assertions: marker, check position, check validation,
CRC, world range, capacity, premature output mutation and unknown-hash clearing.
No production implementation defect was demonstrated, so the four library files
remain byte-identical to the implementation handoff.

### Regenerating the TypeScript corpus

From a checkout containing the referenced commit and the repository's installed
TypeScript development dependency (normally installed with root `npm ci`):

```sh
make -C hardware/courier vectors
# Or use another fetched revision / an explicit existing TypeScript module:
make -C hardware/courier vectors TS_REF=<full-commit-sha> TS_MODULE=/absolute/path/to/typescript.js
make -C hardware/courier test
```

The generator runs `git show <revision>:web/src/courier/{tables,courierId,capsule}.ts`,
transpiles those actual modules without changing their algorithms (only local import
suffixes become `.mjs`), injects deterministic entropy and executes their real
encode/decode functions. It writes `tests/vectors.json` and `tests/vectors.h`.
It uses temporary files, removed on completion; `TMPDIR` can select their parent.
The C test consumes the header directly; JSON remains a readable interoperability
artifact. Regenerating against another revision is an explicit compatibility audit,
not permission to silently change the protocol. Refresh/regenerate twice and compare
both output files before committing an updated oracle corpus.

No CYD, ESP32 or Pi build/run is claimed. Host freestanding object inspection finds
only standard memory-routine dependencies, not RNG/OS/clock/heap symbols. A target
must supply its C runtime memory routines and secure entropy adapter. Host-only
stack measurements do not establish a hardware memory budget, and the codec still
needs the application checks listed above. The whole web suite was not run for this
C-only test integration.

Written with Hermes Agent running OpenAI Codex GPT-6.1 Sol, directed by Lewis
Moten. Original C implementation of this project's format and standard
algorithms; no third-party code or runtime dependencies were added.
