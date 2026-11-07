/* SPDX-License-Identifier: MIT
 * Capsule v1 wire codec, compatible with capsule.ts / tables.ts at
 * 56e048a715be2028187a64cfe278ee765122a816. See README.md for the byte layout.
 */
#ifndef COURIER_CAPSULE_H
#define COURIER_CAPSULE_H

#include "courier_id.h"

#ifdef __cplusplus
extern "C" {
#endif

#define COURIER_CAPSULE_VERSION 1u
#define COURIER_TABLE_VERSION 1u
#define COURIER_WORLD_COUNT 16u
#define COURIER_CAPSULE_MIN 62u
#define COURIER_CAPSULE_MAX 512u
#define COURIER_MAX_PACKAGES 3u
#define COURIER_MAX_POSTCARDS 8u
#define COURIER_MAX_STAMPS 64u

#define COURIER_STAMP_GAME 0u
#define COURIER_STAMP_SAMPLE_CD 1u
#define COURIER_STAMP_GRADUATION 2u
#define COURIER_STAMP_MYSTERY 3u

typedef struct courier_stamp {
    uint8_t kind;
    uint32_t game_hash; /* Used ONLY for GAME. No game text is accepted. */
} courier_stamp;

typedef struct courier_postcard {
    courier_id from;
    uint8_t world;
    size_t stamp_count;
    courier_stamp stamps[COURIER_MAX_STAMPS];
} courier_postcard;

typedef struct courier_capsule {
    courier_id trip, home, from;
    uint8_t world;
    size_t package_count;
    uint32_t packages[COURIER_MAX_PACKAGES];
    size_t postcard_count;
    courier_postcard postcards[COURIER_MAX_POSTCARDS];
} courier_capsule;

/* SIZE, NOT_CAPSULE, VERSION, TAMPERED, MALFORMED correspond to the TS
 * CapsuleProblem values, in that decode precedence. ARGUMENT and CAPACITY
 * are C storage errors. No output object, byte or length changes on failure.
 */
typedef enum courier_capsule_result {
    COURIER_CAPSULE_OK = 0,
    COURIER_CAPSULE_SIZE,
    COURIER_CAPSULE_NOT_CAPSULE,
    COURIER_CAPSULE_VERSION_ERROR,
    COURIER_CAPSULE_TAMPERED,
    COURIER_CAPSULE_MALFORMED,
    COURIER_CAPSULE_ARGUMENT,
    COURIER_CAPSULE_CAPACITY
} courier_capsule_result;

/* Return nonzero ONLY for a hash in the receiving device's trusted PUBLIC
 * catalog. Called once per package / GAME stamp, in wire order, ONLY after
 * the entire file validates. NULL means no known games: packages are dropped
 * and GAME stamps become MYSTERY with hash zero, matching TS's unknown lookup.
 * Must not mutate input/output storage or retain temporary pointers. Hash
 * collisions are a catalog policy concern; these hashes are not signatures.
 */
typedef int (*courier_catalog_fn)(void *context, uint32_t hash);

/* No heap; caller owns struct and buffers; no packed-struct wire casts.
 * encode stages <=512 bytes on stack. decode stages sizeof(courier_capsule)
 * on stack (several KiB; measure on your target). Input/output overlap is OK,
 * but written must be a separate size_t object, not overlap any argument.
 * NULL required pointers => ARGUMENT. Buffers must contain their advertised
 * readable/writable lengths. out capacity may exceed 512; only *written
 * bytes are touched. Unused output struct fields are zeroed on decode.
 *
 * In-memory games/packages are already hashed: TS gameHash is FNV-1a over
 * UTF-16 code units, NOT UTF-8 bytes. Caller resolves trusted catalog ids to
 * these exact u32 hashes before encode. No platform RNG or game database here.
 *
 * encode mirrors TS: emits version/table 1, flags 0; world is one byte;
 * invalid stamp kinds become MYSTERY. It permits duplicate postcard origins
 * and world >=16, just as TS encode does; decode rejects both. A missing/empty
 * TS GAME id must be represented by MYSTERY, not a GAME hash in this C API.
 */
courier_capsule_result courier_capsule_encode(const courier_capsule *capsule,
    uint8_t *out, size_t capacity, size_t *written);
courier_capsule_result courier_capsule_decode(const uint8_t *bytes, size_t length,
    courier_catalog_fn known, void *context, courier_capsule *out);

/* Wire validation only. Not authentication, encryption, catalog policy,
 * same-screen/foreign-trip rejection, dedupe, storage, or sharing consent.
 * Those checks belong to the application, as in TS trips.ts / courierStore.ts.
 */

#ifdef __cplusplus
}
#endif
#endif
