/* SPDX-License-Identifier: MIT
 * Self-checking IDs; original C implementation of the project's courierId.ts.
 */
#include "courier_id.h"
#include <string.h>

static unsigned int digit(const courier_id *id, size_t at)
{
    unsigned int b = id->bytes[at / 2u];
    return (at % 2u == 0u) ? b >> 4 : b & 15u;
}

static void set_digit(courier_id *id, size_t at, unsigned int value)
{
    unsigned int b = id->bytes[at / 2u];
    id->bytes[at / 2u] = (uint8_t)((at % 2u == 0u)
        ? ((b & 15u) | (value << 4)) : ((b & 240u) | value));
}

/* Check is removed, not zeroed: double from the right of the 31 others. */
static unsigned int check_digit(const courier_id *id)
{
    size_t i = 32u;
    unsigned int sum = 0u, twice = 1u;
    while (i != 0u) {
        unsigned int v;
        --i;
        if (i == 24u) continue;
        v = digit(id, i) * (twice != 0u ? 2u : 1u);
        sum += v / 16u + v % 16u;
        twice ^= 1u;
    }
    return (16u - sum % 16u) % 16u;
}

static void render(const courier_id *id, char *text)
{
    static const char hex[] = "0123456789abcdef";
    size_t i, at = 0u;
    for (i = 0u; i < 32u; ++i) {
        if (i == 8u || i == 12u || i == 16u || i == 20u) text[at++] = '-';
        text[at++] = hex[digit(id, i)];
    }
    text[at] = '\0';
}

courier_id_result courier_id_make(char *out, size_t capacity,
                                  courier_random_fn random, void *context)
{
    courier_id id;
    char text[COURIER_ID_CAPACITY];
    if (out == NULL || random == NULL) return COURIER_ID_ARGUMENT;
    if (capacity < COURIER_ID_CAPACITY) return COURIER_ID_CAPACITY_ERROR;
    if (random(context, id.bytes, COURIER_ID_BYTES) != 0) return COURIER_ID_RANDOM_ERROR;
    set_digit(&id, 12u, 4u);
    set_digit(&id, 13u, 12u);
    set_digit(&id, 16u, 8u | (digit(&id, 16u) & 3u));
    set_digit(&id, 24u, check_digit(&id));
    render(&id, text);
    memmove(out, text, sizeof text);
    return COURIER_ID_OK;
}

int courier_id_bytes_valid(const courier_id *id)
{
    return id != NULL && digit(id, 12u) == 4u && digit(id, 13u) == 12u
        && (digit(id, 16u) & 12u) == 8u && digit(id, 24u) == check_digit(id);
}

courier_id_result courier_id_parse(const char *text, size_t length, courier_id *out)
{
    courier_id id = {{0}};
    size_t at, n = 0u;
    if (text == NULL || out == NULL) return COURIER_ID_ARGUMENT;
    if (length != COURIER_ID_LENGTH) return COURIER_ID_INVALID;
    for (at = 0u; at < length; ++at) {
        unsigned int v;
        unsigned char c = (unsigned char)text[at];
        if (at == 8u || at == 13u || at == 18u || at == 23u) {
            if (c != (unsigned char)'-') return COURIER_ID_INVALID;
            continue;
        }
        if (c >= (unsigned char)'0' && c <= (unsigned char)'9') v = (unsigned int)(c - (unsigned char)'0');
        else if (c >= (unsigned char)'a' && c <= (unsigned char)'f') v = (unsigned int)(c - (unsigned char)'a') + 10u;
        else return COURIER_ID_INVALID;
        set_digit(&id, n++, v);
    }
    if (!courier_id_bytes_valid(&id)) return COURIER_ID_INVALID;
    memmove(out, &id, sizeof id);
    return COURIER_ID_OK;
}

int courier_id_is_valid(const char *text, size_t length)
{
    courier_id id;
    return courier_id_parse(text, length, &id) == COURIER_ID_OK;
}

courier_id_result courier_id_format(const courier_id *id, char *out, size_t capacity)
{
    char text[COURIER_ID_CAPACITY];
    if (id == NULL || out == NULL) return COURIER_ID_ARGUMENT;
    if (capacity < COURIER_ID_CAPACITY) return COURIER_ID_CAPACITY_ERROR;
    if (!courier_id_bytes_valid(id)) return COURIER_ID_INVALID;
    render(id, text);
    memmove(out, text, sizeof text);
    return COURIER_ID_OK;
}
