// Game-Maker: Sandbox Edition's Linux player: a GTK 3 window with WebKitGTK inside that plays
// a game's "one web page" export (game.html, beside it in the game's folder). Nothing is
// fetched from the network; high scores and saved games live in the page's localStorage,
// which WebKit keeps in ~/.local/share/GameMaker/<id> between launches.
//
//   GameMakerPlayer --title "My Game" --id my-game [--icon icon.png] game.html
//
// play.sh (written for each game by web/src/export/linuxApp.ts) runs it that way.
//
// It links only the C library: GTK and WebKitGTK (webkit2gtk-4.1, or 4.0 on older systems)
// are loaded with dlopen when it starts, so one build runs on any distribution that has
// them, and when they are missing it says which package to install and exits with status 3
// (play.sh then opens the game in the web browser instead). The few GTK, GLib and WebKit
// functions it uses are declared here by hand, so building needs no GTK headers.
#define _GNU_SOURCE
#include <dlfcn.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

typedef int gboolean;
typedef void *gpointer;
typedef struct { double red, green, blue, alpha; } GdkRGBA;
typedef void (*GCallback)(void);

#define F(ret, name, args) static ret(*name) args;
#define FUNCTIONS                                                                                   \
  F(void, g_set_prgname, (const char *))                                                            \
  F(char *, g_filename_to_uri, (const char *, const char *, void **))                               \
  F(unsigned, g_timeout_add_seconds, (unsigned, gboolean (*)(gpointer), gpointer))                  \
  F(unsigned long, g_signal_connect_data, (gpointer, const char *, GCallback, gpointer, void *, int)) \
  F(gboolean, g_app_info_launch_default_for_uri, (const char *, void *, void **))                   \
  F(void, gtk_init, (int *, char ***))                                                              \
  F(void *, gtk_window_new, (int))                                                                  \
  F(void, gtk_window_set_title, (void *, const char *))                                             \
  F(void, gtk_window_set_default_size, (void *, int, int))                                          \
  F(gboolean, gtk_window_set_icon_from_file, (void *, const char *, void **))                       \
  F(void, gtk_window_fullscreen, (void *))                                                          \
  F(void, gtk_window_unfullscreen, (void *))                                                        \
  F(void, gtk_container_add, (void *, void *))                                                      \
  F(void, gtk_widget_show_all, (void *))                                                            \
  F(void, gtk_widget_grab_focus, (void *))                                                          \
  F(void *, gtk_widget_get_window, (void *))                                                        \
  F(int, gdk_window_get_state, (void *))                                                            \
  F(gboolean, gdk_event_get_keyval, (void *, unsigned *))                                           \
  F(gboolean, gdk_event_get_state, (void *, unsigned *))                                            \
  F(void, gtk_main, (void))                                                                         \
  F(void, gtk_main_quit, (void))                                                                    \
  F(void *, webkit_website_data_manager_new, (const char *, ...))                                   \
  F(void *, webkit_web_context_new_with_website_data_manager, (void *))                             \
  F(void *, webkit_web_view_new_with_context, (void *))                                             \
  F(void *, webkit_web_view_get_settings, (void *))                                                 \
  F(void, webkit_settings_set_media_playback_requires_user_gesture, (void *, gboolean))             \
  F(void, webkit_settings_set_enable_developer_extras, (void *, gboolean))                          \
  F(void, webkit_web_view_set_background_color, (void *, const GdkRGBA *))                          \
  F(void, webkit_web_view_load_uri, (void *, const char *))                                         \
  F(void, webkit_web_view_reload, (void *))                                                         \
  F(void *, webkit_navigation_policy_decision_get_navigation_action, (void *))                      \
  F(void *, webkit_navigation_action_get_request, (void *))                                         \
  F(const char *, webkit_uri_request_get_uri, (void *))                                             \
  F(void, webkit_policy_decision_ignore, (void *))                                                  \
  F(void, webkit_web_view_run_javascript, (void *, const char *, void *, void (*)(void *, void *, gpointer), gpointer)) \
  F(void *, webkit_web_view_run_javascript_finish, (void *, void *, void **))                       \
  F(void *, webkit_javascript_result_get_js_value, (void *))                                        \
  F(char *, jsc_value_to_json, (void *, unsigned))
FUNCTIONS
#undef F

static void *window, *view;
static char dataDir[4096];

/** Loads WebKitGTK and finds every function above in it and the libraries it uses (GTK, GLib, JavaScriptCore). */
static int loadLibraries(void) {
  static const char *names[] = {"libwebkit2gtk-4.1.so.0", "libwebkit2gtk-4.0.so.37"};
  void *lib = NULL;
  for (unsigned i = 0; i < sizeof names / sizeof *names && !lib; i++) lib = dlopen(names[i], RTLD_NOW | RTLD_GLOBAL);
  if (!lib) return 0;
#define F(ret, name, args) \
  if (!(*(void **)&name = dlsym(lib, #name))) return fprintf(stderr, "GameMakerPlayer: %s is missing from WebKitGTK\n", #name), 0;
  FUNCTIONS
#undef F
  return 1;
}

static void makeDirs(const char *path) {
  char p[4096];
  snprintf(p, sizeof p, "%s", path);
  for (char *c = p + 1; *c; c++)
    if (*c == '/') {
      *c = 0;
      mkdir(p, 0700);
      *c = '/';
    }
  mkdir(p, 0700);
}

static int isWebLink(const char *uri) { return !strncmp(uri, "http:", 5) || !strncmp(uri, "https:", 6) || !strncmp(uri, "mailto:", 7); }

// Links (the credit, a shareware notice) open in the browser; only the game's own page loads here.
static gboolean onDecidePolicy(void *v, void *decision, int type, gpointer data) {
  if (type != 0 && type != 1) return 0; // navigation and new-window actions only
  const char *uri = webkit_uri_request_get_uri(webkit_navigation_action_get_request(webkit_navigation_policy_decision_get_navigation_action(decision)));
  if (type == 0 && (!uri || !isWebLink(uri))) return 0;
  if (uri && isWebLink(uri)) g_app_info_launch_default_for_uri(uri, NULL, NULL);
  webkit_policy_decision_ignore(decision);
  return 1;
}

// F11: full screen. Ctrl+R: restart. Every other key is the game's.
static gboolean onKey(void *w, void *event, gpointer data) {
  unsigned key = 0, state = 0;
  gdk_event_get_keyval(event, &key);
  gdk_event_get_state(event, &state);
  if (key == 0xffc8) { // GDK_KEY_F11
    if (gdk_window_get_state(gtk_widget_get_window(window)) & 16) gtk_window_unfullscreen(window); // GDK_WINDOW_STATE_FULLSCREEN
    else gtk_window_fullscreen(window);
    return 1;
  }
  if ((key == 'r' || key == 'R') && (state & 4) && !(state & 8)) { // Control, not Alt
    webkit_web_view_reload(view);
    return 1;
  }
  return 0;
}

static void onDestroy(void *w, gpointer data) { gtk_main_quit(); }

// Tests: with GM_READY_FILE set, a few seconds after the page loads (GM_READY_DELAY), the
// player writes what the page shows there as JSON; GM_TEST_SAVE stores a value the next
// launch should find; GM_TEST_EXIT closes the player afterwards.
static void onScriptDone(void *source, void *result, gpointer data) {
  void *r = webkit_web_view_run_javascript_finish(view, result, NULL);
  char *json = r ? jsc_value_to_json(webkit_javascript_result_get_js_value(r), 0) : NULL;
  FILE *f = fopen(getenv("GM_READY_FILE"), "w");
  if (f) {
    fputs(json ? json : "{\"error\":\"script failed\"}", f);
    fclose(f);
  }
  if (getenv("GM_TEST_EXIT")) gtk_main_quit();
}

static gboolean runReadyScript(gpointer data) {
  char script[1200];
  snprintf(script, sizeof script,
           "(() => { const keys = []; for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));"
           " const before = localStorage.getItem('gamemaker-linux:test');"
           " if (%s) localStorage.setItem('gamemaker-linux:test', String(Date.now()));"
           " return { title: document.title, canvas: !!document.querySelector('canvas'),"
           " text: (document.querySelector('#player')?.innerText || '').slice(0, 200), origin: location.origin, storage: keys,"
           " test: before, worklet: typeof AudioWorkletNode, agent: navigator.userAgent }; })()",
           getenv("GM_TEST_SAVE") ? "true" : "false");
  webkit_web_view_run_javascript(view, script, NULL, onScriptDone, NULL);
  return 0;
}

static void onLoadChanged(void *v, int event, gpointer data) {
  if (event != 3 || !getenv("GM_READY_FILE")) return; // WEBKIT_LOAD_FINISHED
  const char *delay = getenv("GM_READY_DELAY");
  g_timeout_add_seconds(delay ? (unsigned)atoi(delay) : 4, runReadyScript, NULL);
}

static void usage(void) { fputs("Usage: GameMakerPlayer --title TITLE --id ID [--icon PNG] game.html\n", stderr); }

int main(int argc, char **argv) {
  const char *title = "Game", *id = "game", *icon = NULL, *page = NULL;
  for (int i = 1; i < argc; i++) {
    if (!strcmp(argv[i], "--title") && i + 1 < argc) title = argv[++i];
    else if (!strcmp(argv[i], "--id") && i + 1 < argc) id = argv[++i];
    else if (!strcmp(argv[i], "--icon") && i + 1 < argc) icon = argv[++i];
    else if (argv[i][0] != '-') page = argv[i];
  }
  if (!page) return usage(), 2;
  for (const char *c = id; *c; c++)
    if (!((*c >= 'a' && *c <= 'z') || (*c >= '0' && *c <= '9') || *c == '-')) return fprintf(stderr, "GameMakerPlayer: the id may only have a-z, 0-9 and -\n"), 2;
  char full[4096];
  if (!realpath(page, full)) return fprintf(stderr, "GameMakerPlayer: %s: %s\n", page, strerror(errno)), 2;

  if (!loadLibraries()) {
    fputs("GameMakerPlayer: WebKitGTK was not found. Install it to play in a window of its own:\n"
          "  Debian, Ubuntu, Mint: sudo apt install libwebkit2gtk-4.1-0\n"
          "  Fedora: sudo dnf install webkit2gtk4.1\n"
          "  Arch: sudo pacman -S webkit2gtk-4.1\n",
          stderr);
    return 3;
  }

  // the window class (and Wayland app id) matches the menu entry's StartupWMClass
  char prgname[128];
  snprintf(prgname, sizeof prgname, "gamemaker-%s", id);
  g_set_prgname(prgname);
  gtk_init(&argc, &argv);

  const char *xdgData = getenv("XDG_DATA_HOME"), *xdgCache = getenv("XDG_CACHE_HOME"), *home = getenv("HOME");
  char data[4096], cache[4096];
  if (xdgData && *xdgData) snprintf(dataDir, sizeof dataDir, "%s/GameMaker/%s", xdgData, id);
  else snprintf(dataDir, sizeof dataDir, "%s/.local/share/GameMaker/%s", home ? home : "/tmp", id);
  if (xdgCache && *xdgCache) snprintf(cache, sizeof cache, "%s/GameMaker/%s", xdgCache, id);
  else snprintf(cache, sizeof cache, "%s/.cache/GameMaker/%s", home ? home : "/tmp", id);
  snprintf(data, sizeof data, "%s/webkit", dataDir);
  makeDirs(data);
  makeDirs(cache);

  void *manager = webkit_website_data_manager_new("base-data-directory", data, "base-cache-directory", cache, NULL);
  void *context = webkit_web_context_new_with_website_data_manager(manager);
  view = webkit_web_view_new_with_context(context);
  void *settings = webkit_web_view_get_settings(view);
  webkit_settings_set_media_playback_requires_user_gesture(settings, 0); // music may start without a click
  webkit_settings_set_enable_developer_extras(settings, getenv("GM_INSPECT") != NULL);
  GdkRGBA black = {0, 0, 0, 1};
  webkit_web_view_set_background_color(view, &black);

  window = gtk_window_new(0); // GTK_WINDOW_TOPLEVEL
  gtk_window_set_title(window, title);
  gtk_window_set_default_size(window, 960, 720); // 4:3
  if (icon) gtk_window_set_icon_from_file(window, icon, NULL);
  gtk_container_add(window, view);
  g_signal_connect_data(window, "destroy", (GCallback)onDestroy, NULL, NULL, 0);
  g_signal_connect_data(window, "key-press-event", (GCallback)onKey, NULL, NULL, 0);
  g_signal_connect_data(view, "decide-policy", (GCallback)onDecidePolicy, NULL, NULL, 0);
  g_signal_connect_data(view, "load-changed", (GCallback)onLoadChanged, NULL, NULL, 0);

  char *uri = g_filename_to_uri(full, NULL, NULL);
  webkit_web_view_load_uri(view, uri);
  gtk_widget_show_all(window);
  gtk_widget_grab_focus(view);
  gtk_main();
  return 0;
}
