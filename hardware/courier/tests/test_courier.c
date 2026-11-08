/* SPDX-License-Identifier: MIT
 * Independent host acceptance: pinned TypeScript oracle + API/fuzz boundaries.
 */
#include "capsule.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Committed TS-derived corpus: no JSON parser or generator at test runtime. */
#include "vectors.h"
#define COUNT(a) (sizeof(a) / sizeof((a)[0]))
static unsigned long checks;
static const char *current = "startup";
#define CHECK(x) do { ++checks; if (!(x)) { \
    fprintf(stderr, "%s:%d: %s: %s\n", __FILE__, __LINE__, current, #x); exit(1); \
} } while (0)

typedef struct rng_state { const uint8_t *bytes; size_t calls; int fail; } rng_state;
static int random_bytes(void *context, uint8_t *out, size_t count)
{
    rng_state *r = context;
    ++r->calls;
    CHECK(count == 16u);
    memcpy(out, r->bytes, count);
    return r->fail;
}
static uint32_t state = UINT32_C(0x476d6331);
static uint32_t random_word(void)
{
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return state;
}
static size_t catalog_calls;
static int catalog(void *context, uint32_t hash)
{
    size_t i;
    CHECK(context == &catalog_calls);
    ++catalog_calls;
    for (i = 0u; i < COUNT(catalog_hashes); ++i)
        if (catalog_hashes[i] == hash) return 1;
    return 0;
}
static int all_known(void *context, uint32_t hash)
{
    (void)context; (void)hash;
    return 1;
}
static void decode_failure(const uint8_t *wire, size_t length, courier_capsule_result expected)
{
    courier_capsule out, before;
    memset(&out, 0xa5, sizeof out);
    memcpy(&before, &out, sizeof out);
    catalog_calls = 0u;
    CHECK(courier_capsule_decode(wire, length, catalog, &catalog_calls, &out) == expected);
    CHECK(memcmp(&out, &before, sizeof out) == 0);
    CHECK(catalog_calls == 0u);
}
static void encode_failure(const courier_capsule *input, size_t capacity, courier_capsule_result expected)
{
    uint8_t out[520], before[520];
    size_t length = 777u;
    memset(out, 0xa5, sizeof out); memcpy(before, out, sizeof out);
    CHECK(courier_capsule_encode(input, out, capacity, &length) == expected);
    CHECK(length == 777u);
    CHECK(memcmp(out, before, sizeof out) == 0);
}
static void test_ids(void)
{
    static const char hex[] = "0123456789abcdef";
    size_t i, j, k, swaps = 0u, rejected = 0u;
    for (i = 0u; i < COUNT(id_vectors); ++i) {
        char out[40], before[40], changed[37];
        courier_id parsed, sentinel;
        size_t positions[32], n = 0u;
        rng_state r = {id_vectors[i].entropy, 0u, 0};
        current = id_vectors[i].text;
        memset(out, 0xa5, sizeof out);
        CHECK(courier_id_make(out, sizeof out, random_bytes, &r) == COURIER_ID_OK);
        CHECK(r.calls == 1u);
        CHECK(memcmp(out, id_vectors[i].text, 37u) == 0);
        for (j = 37u; j < sizeof out; ++j) CHECK((unsigned char)out[j] == 0xa5u);
        CHECK(out[14] == '4' && out[15] == 'c');
        CHECK(out[19] >= '8' && out[19] <= 'b');
        CHECK(courier_id_parse(out, 36u, &parsed) == COURIER_ID_OK);
        CHECK(courier_id_bytes_valid(&parsed));
        CHECK(courier_id_format(&parsed, changed, sizeof changed) == COURIER_ID_OK);
        CHECK(strcmp(changed, out) == 0);
        for (j = 0u; j < 36u; ++j) if (out[j] != '-') positions[n++] = j;
        CHECK(n == 32u && positions[24] == 28u);
        /* Every one of 32*15 single-hex-digit substitutions, including check nibble. */
        for (j = 0u; j < 32u; ++j) for (k = 0u; k < 16u; ++k) {
            if (hex[k] == out[positions[j]]) continue;
            memcpy(changed, out, 37u); changed[positions[j]] = hex[k];
            memset(&sentinel, 0xa5, sizeof sentinel);
            CHECK(!courier_id_is_valid(changed, 36u));
            CHECK(courier_id_parse(changed, 36u, &sentinel) == COURIER_ID_INVALID);
            for (n = 0u; n < sizeof sentinel.bytes; ++n) CHECK(sentinel.bytes[n] == 0xa5u);
        }
        /* Adjacent hex digits across dashes too; unchanged pairs are not typos. */
        for (j = 0u; j < 31u; ++j) {
            char a = out[positions[j]], b = out[positions[j + 1u]];
            if (a == b) continue;
            memcpy(changed, out, 37u); changed[positions[j]] = b; changed[positions[j + 1u]] = a;
            ++swaps;
            if (!courier_id_is_valid(changed, 36u)) ++rejected;
        }
        /* Exhaust all 256 possible bytes at each textual position. */
        for (j = 0u; j < 36u; ++j) for (k = 0u; k < 256u; ++k) {
            if ((unsigned char)out[j] == k) continue;
            memcpy(changed, out, 37u); changed[j] = (char)(unsigned char)k;
            CHECK(!courier_id_is_valid(changed, 36u));
        }
        for (j = 0u; j < 40u; ++j) if (j != 36u) CHECK(!courier_id_is_valid(out, j));
        memcpy(before, out, sizeof out);
        for (j = 0u; j < 37u; ++j) {
            r.calls = 0u;
            CHECK(courier_id_make(out, j, random_bytes, &r) == COURIER_ID_CAPACITY_ERROR);
            CHECK(r.calls == 0u && memcmp(out, before, sizeof out) == 0);
            CHECK(courier_id_format(&parsed, out, j) == COURIER_ID_CAPACITY_ERROR);
            CHECK(memcmp(out, before, sizeof out) == 0);
        }
        r.fail = 1; r.calls = 0u;
        CHECK(courier_id_make(out, sizeof out, random_bytes, &r) == COURIER_ID_RANDOM_ERROR);
        CHECK(r.calls == 1u && memcmp(out, before, sizeof out) == 0);
        memset(&sentinel, 0, sizeof sentinel);
        CHECK(courier_id_format(&sentinel, out, sizeof out) == COURIER_ID_INVALID);
        CHECK(memcmp(out, before, sizeof out) == 0);
        /* Explicit 36-byte input need not contain a terminator; exact-sized allocation. */
        {
            char *short_text = malloc(36u);
            CHECK(short_text != NULL); memcpy(short_text, out, 36u);
            CHECK(courier_id_is_valid(short_text, 36u)); free(short_text);
        }
        /* Parse/format overlap, both directions, promised by the public API. */
        {
            union { courier_id id; char text[40]; } storage;
            memcpy(storage.text, out, 37u);
            CHECK(courier_id_parse(storage.text, 36u, &storage.id) == COURIER_ID_OK);
            CHECK(courier_id_format(&storage.id, storage.text, sizeof storage.text) == COURIER_ID_OK);
            CHECK(strcmp(storage.text, out) == 0);
        }
    }
    CHECK(rejected * 100u > swaps * 90u);
    printf("IDs: %zu TS vectors, %zu single-nibble mutations rejected; adjacent swaps %zu/%zu rejected\n",
        COUNT(id_vectors), COUNT(id_vectors) * 32u * 15u, rejected, swaps);
    {
        char out[37]; courier_id id;
        memset(out, 0xa5, sizeof out); memset(&id, 0xa5, sizeof id);
        CHECK(courier_id_make(NULL, 37u, random_bytes, NULL) == COURIER_ID_ARGUMENT);
        CHECK(courier_id_make(out, 37u, NULL, NULL) == COURIER_ID_ARGUMENT);
        CHECK(courier_id_parse(NULL, 36u, &id) == COURIER_ID_ARGUMENT);
        CHECK(courier_id_parse(out, 36u, NULL) == COURIER_ID_ARGUMENT);
        CHECK(courier_id_format(NULL, out, 37u) == COURIER_ID_ARGUMENT);
        CHECK(courier_id_format(&id, NULL, 37u) == COURIER_ID_ARGUMENT);
        CHECK(!courier_id_is_valid(NULL, 36u) && !courier_id_bytes_valid(NULL));
        CHECK((unsigned char)out[0] == 0xa5u && id.bytes[0] == 0xa5u);
    }
}
static void test_capsules(void)
{
    size_t i, j;
    for (i = 0u; i < COUNT(encode_vectors); ++i) {
        const struct encode_vector *v = &encode_vectors[i];
        uint8_t out[520], again[512];
        size_t n = 777u, m = 777u;
        courier_capsule decoded;
        current = v->name;
        if (v->encode_result != COURIER_CAPSULE_OK) {
            encode_failure(v->input, sizeof out, v->encode_result); continue;
        }
        memset(out, 0xa5, sizeof out);
        CHECK(courier_capsule_encode(v->input, out, sizeof out, &n) == COURIER_CAPSULE_OK);
        CHECK(n == v->length && memcmp(out, v->wire, n) == 0);
        for (j = n; j < sizeof out; ++j) CHECK(out[j] == 0xa5u);
        for (j = 0u; j < n; ++j) encode_failure(v->input, j, COURIER_CAPSULE_CAPACITY);
        CHECK(courier_capsule_encode(v->input, out, n, &m) == COURIER_CAPSULE_OK && m == n);
        if (v->decode_result != COURIER_CAPSULE_OK) {
            decode_failure(out, n, v->decode_result); continue;
        }
        catalog_calls = 0u;
        CHECK(courier_capsule_decode(out, n, catalog, &catalog_calls, &decoded) == COURIER_CAPSULE_OK);
        CHECK(courier_capsule_encode(&decoded, again, sizeof again, &m) == COURIER_CAPSULE_OK);
        CHECK(m == v->canonical_length && memcmp(again, v->canonical, m) == 0);
        CHECK(courier_capsule_decode(out, n, NULL, NULL, &decoded) == COURIER_CAPSULE_OK);
        CHECK(decoded.package_count == 0u);
        for (j = 0u; j < decoded.postcard_count; ++j) {
            size_t s;
            for (s = 0u; s < decoded.postcards[j].stamp_count; ++s) {
                CHECK(decoded.postcards[j].stamps[s].kind != COURIER_STAMP_GAME);
                CHECK(decoded.postcards[j].stamps[s].game_hash == 0u);
            }
        }
        CHECK(courier_capsule_encode(&decoded, again, sizeof again, &m) == COURIER_CAPSULE_OK);
        CHECK(m == v->unknown_length && memcmp(again, v->unknown, m) == 0);
        /* All-known raw-hash round trip, deliberately not a production catalog policy. */
        CHECK(courier_capsule_decode(out, n, all_known, NULL, &decoded) == COURIER_CAPSULE_OK);
        CHECK(courier_capsule_encode(&decoded, again, sizeof again, &m) == COURIER_CAPSULE_OK);
        CHECK(m == n && memcmp(again, out, n) == 0);
        /* Exact allocation and offset input catch hidden overreads/alignment assumptions. */
        {
            uint8_t *exact = malloc(n + 1u);
            CHECK(exact != NULL); memcpy(exact + 1u, out, n);
            CHECK(courier_capsule_decode(exact + 1u, n, all_known, NULL, &decoded) == COURIER_CAPSULE_OK);
            free(exact);
        }
        /* Encode output may overlap source struct; decode output may overlap wire. */
        {
            union { courier_capsule c; uint8_t wire[sizeof(courier_capsule)]; } storage;
            storage.c = *v->input;
            CHECK(courier_capsule_encode(&storage.c, storage.wire, sizeof storage.wire, &m) == COURIER_CAPSULE_OK);
            CHECK(m == n && memcmp(storage.wire, out, n) == 0);
            CHECK(courier_capsule_decode(storage.wire, m, all_known, NULL, &storage.c) == COURIER_CAPSULE_OK);
            CHECK(courier_capsule_encode(&storage.c, again, sizeof again, &m) == COURIER_CAPSULE_OK);
            CHECK(m == n && memcmp(again, out, n) == 0);
        }
    }
    for (i = 0u; i < COUNT(bad_vectors); ++i) {
        const struct bad_vector *v = &bad_vectors[i];
        current = v->name;
        decode_failure(v->wire, v->length, v->result);
    }
    current = "C API capsule boundaries";
    {
        courier_capsule c = *encode_vectors[0].input;
        uint8_t out[512]; size_t n = 777u;
        encode_failure(NULL, sizeof out, COURIER_CAPSULE_ARGUMENT);
        CHECK(courier_capsule_encode(&c, NULL, 512u, &n) == COURIER_CAPSULE_ARGUMENT && n == 777u);
        memset(out, 0xa5, sizeof out);
        CHECK(courier_capsule_encode(&c, out, 512u, NULL) == COURIER_CAPSULE_ARGUMENT);
        CHECK(out[0] == 0xa5u);
        decode_failure(NULL, 62u, COURIER_CAPSULE_ARGUMENT);
        CHECK(courier_capsule_decode(out, 62u, NULL, NULL, NULL) == COURIER_CAPSULE_ARGUMENT);
        c.package_count = (size_t)-1; encode_failure(&c, 512u, COURIER_CAPSULE_SIZE); c = *encode_vectors[0].input;
        c.postcard_count = (size_t)-1; encode_failure(&c, 512u, COURIER_CAPSULE_SIZE); c = *encode_vectors[0].input;
        c.postcard_count = 1u; c.postcards[0].from = c.from;
        c.postcards[0].stamp_count = (size_t)-1; encode_failure(&c, 512u, COURIER_CAPSULE_SIZE);
        c.postcards[0].stamp_count = 0u; c.postcards[0].from.bytes[6] = 0u;
        encode_failure(&c, 512u, COURIER_CAPSULE_MALFORMED);
        c = *encode_vectors[0].input; c.trip.bytes[6] = 0u; encode_failure(&c, 512u, COURIER_CAPSULE_MALFORMED);
        c = *encode_vectors[0].input; c.home.bytes[6] = 0u; encode_failure(&c, 512u, COURIER_CAPSULE_MALFORMED);
        c = *encode_vectors[0].input; c.from.bytes[6] = 0u; encode_failure(&c, 512u, COURIER_CAPSULE_MALFORMED);
        /* Hash zero is data, not absence; invalid kind serializes to mystery without payload. */
        c = *encode_vectors[0].input; c.package_count = 1u; c.packages[0] = 0u;
        c.postcard_count = 1u; c.postcards[0].from = c.from; c.postcards[0].stamp_count = 2u;
        c.postcards[0].stamps[0].kind = COURIER_STAMP_GAME; c.postcards[0].stamps[0].game_hash = 0u;
        c.postcards[0].stamps[1].kind = 255u; c.postcards[0].stamps[1].game_hash = UINT32_MAX;
        CHECK(courier_capsule_encode(&c, out, sizeof out, &n) == COURIER_CAPSULE_OK);
        CHECK(n == 90u && out[80] == 0u && out[85] == 3u);
        CHECK(courier_capsule_decode(out, n, all_known, NULL, &c) == COURIER_CAPSULE_OK);
        CHECK(c.package_count == 1u && c.packages[0] == 0u && c.postcards[0].stamps[0].kind == 0u);
        CHECK(c.postcards[0].stamps[1].kind == 3u && c.postcards[0].stamps[1].game_hash == 0u);
    }
    printf("Capsules: %zu TS encode cases, %zu TS malformed cases, capacities/atomicity/overlap passed\n", COUNT(encode_vectors), COUNT(bad_vectors));
}
static void test_fuzz(void)
{
    size_t i, j, successes = 0u;
    current = "deterministic fuzz";
    for (i = 0u; i < 12000u; ++i) {
        uint8_t input[1024], encoded[512];
        courier_capsule out, before;
        courier_capsule_result result;
        size_t n = (size_t)(random_word() % 1025u), m = 0u;
        for (j = 0u; j < n; ++j) input[j] = (uint8_t)random_word();
        if (i % 2u == 0u) {
            const struct encode_vector *v = &encode_vectors[i % COUNT(encode_vectors)];
            if (v->wire != NULL) {
                n = v->length; memcpy(input, v->wire, n);
                if (i % 4u != 0u) input[(size_t)random_word() % n] ^= (uint8_t)(1u << (random_word() % 8u));
            }
        }
        memset(&out, 0xa5, sizeof out); memcpy(&before, &out, sizeof out);
        result = courier_capsule_decode(input, n, all_known, NULL, &out);
        if (result == COURIER_CAPSULE_OK) {
            ++successes;
            CHECK(courier_capsule_encode(&out, encoded, sizeof encoded, &m) == COURIER_CAPSULE_OK);
            CHECK(m == n && memcmp(input, encoded, n) == 0);
        } else CHECK(memcmp(&out, &before, sizeof out) == 0);
        {
            char text[37]; courier_id id, saved;
            size_t length = (size_t)(random_word() % 38u);
            for (j = 0u; j < sizeof text; ++j) text[j] = (char)(unsigned char)random_word();
            memset(&id, 0xa5, sizeof id); memcpy(&saved, &id, sizeof id);
            CHECK(courier_id_parse(text, length, &id) == COURIER_ID_INVALID);
            CHECK(memcmp(&id, &saved, sizeof id) == 0);
        }
    }
    CHECK(successes > 100u);
    printf("Fuzz: 12000 bounded capsule inputs (%zu valid round trips), 12000 random ID inputs\n", successes);
}
int main(void)
{
    test_ids(); test_capsules(); test_fuzz();
    printf("PASS: %lu assertions\n", checks);
    return 0;
}
