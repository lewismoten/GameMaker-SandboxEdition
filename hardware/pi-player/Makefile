# SDL host adapters; the Pocket core (the gamemaker-pocket repository) is compiled directly, never copied.
# POCKET_DIR is the clone of lewismoten/gamemaker-pocket (default ../../../gamemaker-pocket beside this repository).
POCKET_DIR ?= ../../../gamemaker-pocket
CXX ?= c++
PYTHON ?= python3
SDL_CONFIG ?= $(shell command -v sdl2-config 2>/dev/null || echo /opt/homebrew/bin/sdl2-config)
CPPFLAGS += -I$(POCKET_DIR)/src -Ibuild $(shell $(SDL_CONFIG) --cflags)
CXXFLAGS ?= -O2 -g
CXXFLAGS += -std=c++17 -Wall -Wextra -Wno-unused-parameter
LDLIBS += $(shell $(SDL_CONFIG) --libs) -lz
SOURCES = src/main.cpp src/files.cpp src/audio.cpp src/replay.cpp
HEADERS = $(wildcard src/*.h $(POCKET_DIR)/src/*.h)
.PHONY: all check clean
all: build/pi-player
build/public-games.h: tools/catalog.py $(wildcard ../../games/*/about.json)
	mkdir -p build
	$(PYTHON) tools/catalog.py > $@
build/pi-player: $(SOURCES) $(HEADERS) build/public-games.h
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) $(SOURCES) $(LDFLAGS) $(LDLIBS) -o $@
build/tests: tests.cpp src/files.cpp src/audio.cpp $(HEADERS) build/public-games.h
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) tests.cpp src/files.cpp src/audio.cpp $(LDFLAGS) $(LDLIBS) -o $@
check: build/pi-player build/tests
	SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy ./build/tests
clean:
	rm -rf build
