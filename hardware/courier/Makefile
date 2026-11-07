# SPDX-License-Identifier: MIT
CC ?= cc
CFLAGS ?= -O2 -g
WARNINGS = -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Wstrict-prototypes -Wmissing-prototypes -Werror
BUILD ?= .build
SOURCES = courier_id.c capsule.c tests/test_courier.c
HEADERS = courier_id.h capsule.h tests/vectors.h

.PHONY: test sanitize clean vectors

test: $(BUILD)/test_courier
	./$(BUILD)/test_courier

$(BUILD)/test_courier: $(SOURCES) $(HEADERS) Makefile
	mkdir -p $(BUILD)
	$(CC) -std=c99 $(WARNINGS) $(CFLAGS) -I. -Itests $(SOURCES) $(LDFLAGS) -o $@

sanitize:
	$(MAKE) BUILD=.build-sanitize CFLAGS='-O1 -g -fno-omit-frame-pointer -fsanitize=address,undefined' LDFLAGS='-fsanitize=address,undefined' test

# Optional regeneration only: needs Node and the repository's TypeScript dev dependency.
TS_MODULE ?= typescript
TS_REF ?= 93880e054f164ac47ba934c30ab58c1691c4d139
vectors:
	node tests/generate-vectors.mjs $(TS_REF) $(TS_MODULE)

clean:
	rm -rf .build .build-sanitize
