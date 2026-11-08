/* SPDX-License-Identifier: MIT
 * Courier IDs, compatible with courierId.ts at 56e048a715be2028187a64cfe278ee765122a816.
 * UUID v4: hex digit 12=4, 13=c, 16=8..b, 24=Luhn mod 16 (zero-based,
 * excluding dashes). These are corruption checks, NOT authentication.
 */
#ifndef COURIER_ID_H
#define COURIER_ID_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define COURIER_ID_BYTES 16u
#define COURIER_ID_LENGTH 36u
#define COURIER_ID_CAPACITY 37u

typedef struct courier_id { uint8_t bytes[COURIER_ID_BYTES]; } courier_id;

typedef enum courier_id_result {
    COURIER_ID_OK = 0,
    COURIER_ID_ARGUMENT,
    COURIER_ID_CAPACITY_ERROR,
    COURIER_ID_RANDOM_ERROR,
    COURIER_ID_INVALID
} courier_id_result;

/* Fill ALL requested bytes with independent, uniformly random bits; return 0
 * on success, nonzero on failure. Called exactly once for 16 bytes by make.
 * Supply a platform's securely seeded RNG; NEVER time, MAC, serial or names.
 * No RNG implementation, seeding, or entropy guarantee is provided here.
 * Callback must not retain the temporary destination or modify API outputs.
 */
typedef int (*courier_random_fn)(void *context, uint8_t *bytes, size_t count);

/* Produces lowercase dashed text plus NUL, consuming 128 random bits and
 * retaining 114 after format/marker/check bits. out needs capacity >= 37.
 * Every error leaves out unchanged (RNG context may still have advanced).
 */
courier_id_result courier_id_make(char *out, size_t capacity,
                                  courier_random_fn random, void *context);
/* Length-delimited text: exactly 36 readable bytes, no NUL required. Strictly
 * lowercase; invalid pointers with nonzero lengths are caller errors. NULL
 * text is invalid. Validation returns 1 if valid, otherwise 0.
 */
int courier_id_is_valid(const char *text, size_t length);
int courier_id_bytes_valid(const courier_id *id);
/* Caller owns all storage. Outputs unchanged on error; input/output overlap
 * is supported. format requires 37 bytes and includes the terminating NUL.
 */
courier_id_result courier_id_parse(const char *text, size_t length, courier_id *out);
courier_id_result courier_id_format(const courier_id *id, char *out, size_t capacity);

#ifdef __cplusplus
}
#endif
#endif
