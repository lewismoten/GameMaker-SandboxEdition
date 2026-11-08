/* SPDX-License-Identifier: MIT
 * Bounded, allocation-free SCT1 codec. Wire integers are little-endian.
 */
#include "capsule.h"
#include <string.h>

static const uint8_t magic[4] = {0x53u, 0x43u, 0x54u, 0x31u};

/* Reflected CRC-32/ISO-HDLC (ZIP); no host-endian or lookup-table dependency. */
static uint32_t crc32(const uint8_t *bytes, size_t length)
{
    uint32_t c = UINT32_C(0xffffffff);
    size_t i;
    for (i = 0u; i < length; ++i) {
        unsigned int bit;
        c ^= bytes[i];
        for (bit = 0u; bit < 8u; ++bit)
            c = (c >> 1) ^ ((c & 1u) != 0u ? UINT32_C(0xedb88320) : UINT32_C(0));
    }
    return c ^ UINT32_C(0xffffffff);
}

static void put32(uint8_t *out, uint32_t value)
{
    out[0] = (uint8_t)value;
    out[1] = (uint8_t)(value >> 8);
    out[2] = (uint8_t)(value >> 16);
    out[3] = (uint8_t)(value >> 24);
}

courier_capsule_result courier_capsule_encode(const courier_capsule *c,
    uint8_t *out, size_t capacity, size_t *written)
{
    uint8_t bytes[COURIER_CAPSULE_MAX];
    size_t i, j, length = COURIER_CAPSULE_MIN, at;
    if (c == NULL || out == NULL || written == NULL) return COURIER_CAPSULE_ARGUMENT;
    if (c->package_count > COURIER_MAX_PACKAGES || c->postcard_count > COURIER_MAX_POSTCARDS)
        return COURIER_CAPSULE_SIZE;
    if (!courier_id_bytes_valid(&c->trip) || !courier_id_bytes_valid(&c->home)
        || !courier_id_bytes_valid(&c->from)) return COURIER_CAPSULE_MALFORMED;
    length += 4u * c->package_count;
    for (i = 0u; i < c->postcard_count; ++i) {
        const courier_postcard *p = &c->postcards[i];
        if (p->stamp_count > COURIER_MAX_STAMPS) return COURIER_CAPSULE_SIZE;
        if (!courier_id_bytes_valid(&p->from)) return COURIER_CAPSULE_MALFORMED;
        length += 18u;
        for (j = 0u; j < p->stamp_count; ++j)
            length += p->stamps[j].kind == COURIER_STAMP_GAME ? 5u : 1u;
    }
    if (length > COURIER_CAPSULE_MAX) return COURIER_CAPSULE_SIZE;
    if (capacity < length) return COURIER_CAPSULE_CAPACITY;
    memcpy(bytes, magic, sizeof magic);
    bytes[4] = COURIER_CAPSULE_VERSION;
    bytes[5] = COURIER_TABLE_VERSION;
    bytes[6] = 0u;
    bytes[7] = c->world;
    memcpy(bytes + 8u, c->trip.bytes, COURIER_ID_BYTES);
    memcpy(bytes + 24u, c->home.bytes, COURIER_ID_BYTES);
    memcpy(bytes + 40u, c->from.bytes, COURIER_ID_BYTES);
    at = 56u;
    bytes[at++] = (uint8_t)c->package_count;
    for (i = 0u; i < c->package_count; ++i) {
        put32(bytes + at, c->packages[i]);
        at += 4u;
    }
    bytes[at++] = (uint8_t)c->postcard_count;
    for (i = 0u; i < c->postcard_count; ++i) {
        const courier_postcard *p = &c->postcards[i];
        memcpy(bytes + at, p->from.bytes, COURIER_ID_BYTES);
        at += COURIER_ID_BYTES;
        bytes[at++] = p->world;
        bytes[at++] = (uint8_t)p->stamp_count;
        for (j = 0u; j < p->stamp_count; ++j) {
            uint8_t kind = p->stamps[j].kind;
            bytes[at++] = kind <= COURIER_STAMP_MYSTERY ? kind : COURIER_STAMP_MYSTERY;
            if (kind == COURIER_STAMP_GAME) {
                put32(bytes + at, p->stamps[j].game_hash);
                at += 4u;
            }
        }
    }
    put32(bytes + at, crc32(bytes, at));
    memmove(out, bytes, length);
    *written = length;
    return COURIER_CAPSULE_OK;
}

static uint32_t get32(const uint8_t *bytes)
{
    return (uint32_t)bytes[0] | ((uint32_t)bytes[1] << 8)
        | ((uint32_t)bytes[2] << 16) | ((uint32_t)bytes[3] << 24);
}

typedef struct reader {
    const uint8_t *bytes;
    size_t at, end;
    int bad;
} reader;

static const uint8_t *take(reader *r, size_t n)
{
    const uint8_t *p;
    if (n > r->end - r->at) {
        r->bad = 1;
        return NULL;
    }
    p = r->bytes + r->at;
    r->at += n;
    return p;
}

static uint8_t byte(reader *r)
{
    const uint8_t *p = take(r, 1u);
    return p != NULL ? p[0] : 0u;
}

static uint32_t word(reader *r)
{
    const uint8_t *p = take(r, 4u);
    return p != NULL ? get32(p) : UINT32_C(0);
}

static int read_id(reader *r, courier_id *id)
{
    const uint8_t *p = take(r, COURIER_ID_BYTES);
    if (p == NULL) return 0;
    memcpy(id->bytes, p, COURIER_ID_BYTES);
    return courier_id_bytes_valid(id);
}

courier_capsule_result courier_capsule_decode(const uint8_t *bytes, size_t length,
    courier_catalog_fn known, void *context, courier_capsule *out)
{
    courier_capsule c;
    reader r;
    size_t i, j, kept;
    if (bytes == NULL || out == NULL) return COURIER_CAPSULE_ARGUMENT;
    if (length < COURIER_CAPSULE_MIN || length > COURIER_CAPSULE_MAX) return COURIER_CAPSULE_SIZE;
    if (memcmp(bytes, magic, sizeof magic) != 0) return COURIER_CAPSULE_NOT_CAPSULE;
    if (bytes[4] != COURIER_CAPSULE_VERSION || bytes[5] < 1u || bytes[5] > COURIER_TABLE_VERSION)
        return COURIER_CAPSULE_VERSION_ERROR;
    if (crc32(bytes, length - 4u) != get32(bytes + length - 4u)) return COURIER_CAPSULE_TAMPERED;
    /* Zero inactive fields and padding too; do not copy uninitialized storage. */
    memset(&c, 0, sizeof c);
    r.bytes = bytes;
    r.at = 6u;
    r.end = length - 4u;
    r.bad = 0;
    if (byte(&r) != 0u) return COURIER_CAPSULE_MALFORMED;
    c.world = byte(&r);
    if (c.world >= COURIER_WORLD_COUNT || !read_id(&r, &c.trip)
        || !read_id(&r, &c.home) || !read_id(&r, &c.from)) return COURIER_CAPSULE_MALFORMED;
    c.package_count = byte(&r);
    if (c.package_count > COURIER_MAX_PACKAGES) return COURIER_CAPSULE_MALFORMED;
    for (i = 0u; i < c.package_count; ++i) c.packages[i] = word(&r);
    c.postcard_count = byte(&r);
    if (c.postcard_count > COURIER_MAX_POSTCARDS) return COURIER_CAPSULE_MALFORMED;
    for (i = 0u; i < c.postcard_count; ++i) {
        courier_postcard *p = &c.postcards[i];
        if (!read_id(&r, &p->from)) return COURIER_CAPSULE_MALFORMED;
        p->world = byte(&r);
        if (p->world >= COURIER_WORLD_COUNT) return COURIER_CAPSULE_MALFORMED;
        p->stamp_count = byte(&r);
        if (p->stamp_count > COURIER_MAX_STAMPS) return COURIER_CAPSULE_MALFORMED;
        for (j = 0u; j < p->stamp_count; ++j) {
            courier_stamp *s = &p->stamps[j];
            s->kind = byte(&r);
            if (s->kind > COURIER_STAMP_MYSTERY) return COURIER_CAPSULE_MALFORMED;
            if (s->kind == COURIER_STAMP_GAME) s->game_hash = word(&r);
        }
        for (j = 0u; j < i; ++j)
            if (memcmp(c.postcards[j].from.bytes, p->from.bytes, COURIER_ID_BYTES) == 0)
                return COURIER_CAPSULE_MALFORMED;
    }
    if (r.bad != 0 || r.at != r.end) return COURIER_CAPSULE_MALFORMED;
    /* Match the trusted catalog lookup of TS decode, after full validation. */
    kept = 0u;
    for (i = 0u; i < c.package_count; ++i)
        if (known != NULL && known(context, c.packages[i]) != 0) c.packages[kept++] = c.packages[i];
    for (i = kept; i < COURIER_MAX_PACKAGES; ++i) c.packages[i] = 0u;
    c.package_count = kept;
    for (i = 0u; i < c.postcard_count; ++i) {
        courier_postcard *p = &c.postcards[i];
        for (j = 0u; j < p->stamp_count; ++j) {
            courier_stamp *s = &p->stamps[j];
            if (s->kind == COURIER_STAMP_GAME && (known == NULL || known(context, s->game_hash) == 0)) {
                s->kind = COURIER_STAMP_MYSTERY;
                s->game_hash = 0u;
            }
        }
    }
    memmove(out, &c, sizeof c);
    return COURIER_CAPSULE_OK;
}
