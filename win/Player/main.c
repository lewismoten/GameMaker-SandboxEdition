// Game-Maker: Sandbox Edition's Windows player: a window with Microsoft Edge WebView2 inside
// that plays the game built into this .exe (an RCDATA resource "GAME", the "one web page"
// export). Nothing is fetched from the network; high scores and saved games live in the
// page's localStorage, which WebView2 keeps in %LOCALAPPDATA%\GameMaker\<id> between launches.
//
// The game's title, id and credits come from the RCDATA resource "INFO" (key=value lines),
// so one program serves every game: the web app (web/src/export/winApp.ts) and
// web/scripts/winExe.ts rewrite the resources of this program for each game (its page, its
// info, its icon and its version information) without a compiler.
//
// WebView2 ships with Windows 11 and current Windows 10. It is found without Microsoft's
// WebView2Loader.dll: the runtime's own client DLL is loaded from the folder that Edge's
// updater records in the registry, as the open source webview library does
// (github.com/webview/webview, MIT). No DLL is ever loaded from beside the program, which
// is usually the Downloads folder. If there is no runtime, a message offers Microsoft's
// download.
#define WIN32_LEAN_AND_MEAN
#ifndef UNICODE
#define UNICODE
#endif
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0A00
#endif
#define _UNICODE
#include <windows.h>
#include <objbase.h>
#include <shellapi.h>
#include <shlobj.h>
#include <string.h>
#include "webview2.h"

#define HOST L"game.gamemaker.example"
#define PAGE_URL L"https://" HOST L"/game.html"
#define CLASS_NAME L"GameMakerPlayer"
#define DOWNLOAD_URL L"https://go.microsoft.com/fwlink/p/?LinkId=2124703"
#define IDM_RESTART 0x0010
#define IDM_FULLSCREEN 0x0020
#define IDM_ABOUT 0x0030
#define TIMER_READY 1

typedef struct { void **vt; } Obj;
// Calls slot `i` of a COM object's vtable as a function of type T.
#define VT(o, i, T) ((T)(((Obj *)(o))->vt[i]))
typedef HRESULT(STDMETHODCALLTYPE *Fn0)(void *);
typedef HRESULT(STDMETHODCALLTYPE *FnB)(void *, BOOL);
typedef HRESULT(STDMETHODCALLTYPE *FnP)(void *, void *);
typedef HRESULT(STDMETHODCALLTYPE *FnPP)(void *, void *, void *);
typedef ULONG(STDMETHODCALLTYPE *FnAddRef)(void *);
typedef HRESULT(STDMETHODCALLTYPE *FnQI)(void *, REFIID, void **);

static HINSTANCE inst;
static HWND win;
static void *controller; // ICoreWebView2Controller2 (or 1)
static void *webview;    // ICoreWebView2_3
static WCHAR title[256] = L"Game";
static WCHAR gameId[96] = L"game";
static WCHAR credits[1024] = L"Made with Game-Maker: Sandbox Edition.";
static WCHAR site[256] = L"https://lewismoten.github.io/GameMaker-SandboxEdition/";
static WCHAR dataDir[MAX_PATH];  // %LOCALAPPDATA%\GameMaker\<id>
static WCHAR gameDir[MAX_PATH];  // ...\game, holding game.html
static WCHAR placeFile[MAX_PATH]; // ...\window.dat, the window's size and place
static BOOL fullscreen;
static WINDOWPLACEMENT before = {sizeof(WINDOWPLACEMENT)};

// ---- small helpers -------------------------------------------------------------------

static void copyW(WCHAR *to, const WCHAR *from, int size) {
  int i = 0;
  for (; i < size - 1 && from[i]; i++) to[i] = from[i];
  to[i] = 0;
}

static void catW(WCHAR *to, const WCHAR *more, int size) { copyW(to + lstrlenW(to), more, size - lstrlenW(to)); }

static BOOL startsWith(const WCHAR *s, const WCHAR *prefix) {
  while (*prefix)
    if (*s++ != *prefix++) return FALSE;
  return TRUE;
}

/** A resource of this program (RCDATA by name), or NULL. */
static const BYTE *resource(const WCHAR *name, DWORD *size) {
  HRSRC r = FindResourceW(inst, name, MAKEINTRESOURCEW(10)); // RT_RCDATA
  if (!r) return NULL;
  HGLOBAL g = LoadResource(inst, r);
  *size = SizeofResource(inst, r);
  return g ? (const BYTE *)LockResource(g) : NULL;
}

/** Reads INFO: UTF-8 "key=value" lines, a value's newlines written as \n and backslashes as \\. */
static void readInfo(void) {
  DWORD size = 0;
  const BYTE *p = resource(L"INFO", &size);
  if (!p) return;
  DWORD i = 0;
  while (i < size) {
    DWORD start = i;
    while (i < size && p[i] != '\n') i++;
    DWORD end = i++;
    DWORD eq = start;
    while (eq < end && p[eq] != '=') eq++;
    if (eq >= end) continue;
    char value[2048];
    int n = 0;
    for (DWORD k = eq + 1; k < end && n < (int)sizeof value - 1; k++) {
      if (p[k] == '\\' && k + 1 < end) {
        k++;
        value[n++] = p[k] == 'n' ? '\n' : (char)p[k];
      } else if (p[k] != '\r') {
        value[n++] = (char)p[k];
      }
    }
    value[n] = 0;
    WCHAR *to = NULL;
    int cap = 0;
    int keyLen = (int)(eq - start);
    const char *key = (const char *)p + start;
#define KEY(k, buf) if (keyLen == (int)sizeof(k) - 1 && !memcmp(key, k, keyLen)) to = buf, cap = (int)(sizeof(buf) / sizeof(WCHAR));
    KEY("title", title)
    KEY("id", gameId)
    KEY("credits", credits)
    KEY("site", site)
#undef KEY
    if (to && n) {
      int w = MultiByteToWideChar(CP_UTF8, 0, value, n, to, cap - 1);
      to[w] = 0;
    }
  }
  // the id names a folder: keep it to letters, digits, dashes and dots
  for (WCHAR *c = gameId; *c; c++)
    if (!((*c >= 'a' && *c <= 'z') || (*c >= 'A' && *c <= 'Z') || (*c >= '0' && *c <= '9') || *c == '-' || *c == '.')) *c = '-';
  if (!gameId[0] || gameId[0] == '.') copyW(gameId, L"game", 96);
}

static BOOL writeFile(const WCHAR *path, const void *data, DWORD size) {
  HANDLE f = CreateFileW(path, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
  if (f == INVALID_HANDLE_VALUE) return FALSE;
  DWORD done = 0;
  BOOL ok = WriteFile(f, data, size, &done, NULL) && done == size;
  CloseHandle(f);
  return ok;
}

/** Makes the game's folders and writes game.html into them. */
static BOOL prepareFolders(void) {
  WCHAR *local = NULL;
  if (FAILED(SHGetKnownFolderPath(&FOLDERID_LocalAppData, 0, NULL, &local))) return FALSE;
  copyW(dataDir, local, MAX_PATH);
  CoTaskMemFree(local);
  catW(dataDir, L"\\GameMaker\\", MAX_PATH);
  catW(dataDir, gameId, MAX_PATH);
  copyW(gameDir, dataDir, MAX_PATH);
  catW(gameDir, L"\\game", MAX_PATH);
  copyW(placeFile, dataDir, MAX_PATH);
  catW(placeFile, L"\\window.dat", MAX_PATH);
  int made = SHCreateDirectoryExW(NULL, gameDir, NULL);
  if (made != ERROR_SUCCESS && made != ERROR_ALREADY_EXISTS && made != ERROR_FILE_EXISTS) return FALSE;
  DWORD size = 0;
  const BYTE *html = resource(L"GAME", &size);
  static const char none[] = "<!doctype html><title>Game</title><body style='background:#000;color:#ccc;font:16px system-ui'>This program has no game in it.";
  if (!html) html = (const BYTE *)none, size = sizeof none - 1;
  WCHAR page[MAX_PATH];
  copyW(page, gameDir, MAX_PATH);
  catW(page, L"\\game.html", MAX_PATH);
  return writeFile(page, html, size);
}

static void openInBrowser(const WCHAR *url) {
  if (startsWith(url, L"https://") || startsWith(url, L"http://") || startsWith(url, L"mailto:")) ShellExecuteW(NULL, L"open", url, NULL, NULL, SW_SHOWNORMAL);
}

static void saveWindowPlace(void) {
  WINDOWPLACEMENT wp = {sizeof wp};
  if (fullscreen) wp = before;
  else if (!GetWindowPlacement(win, &wp)) return;
  writeFile(placeFile, &wp, sizeof wp);
}

static BOOL loadWindowPlace(WINDOWPLACEMENT *wp) {
  HANDLE f = CreateFileW(placeFile, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0, NULL);
  if (f == INVALID_HANDLE_VALUE) return FALSE;
  DWORD done = 0;
  BOOL ok = ReadFile(f, wp, sizeof *wp, &done, NULL) && done == sizeof *wp && wp->length == sizeof *wp;
  CloseHandle(f);
  if (!ok) return FALSE;
  // only where a monitor still is
  return MonitorFromRect(&wp->rcNormalPosition, MONITOR_DEFAULTTONULL) != NULL;
}

static void setFullscreen(BOOL on) {
  if (on == fullscreen) return;
  if (on) {
    MONITORINFO mi = {sizeof mi};
    if (!GetWindowPlacement(win, &before) || !GetMonitorInfoW(MonitorFromWindow(win, MONITOR_DEFAULTTONEAREST), &mi)) return;
    SetWindowLongPtrW(win, GWL_STYLE, WS_POPUP | WS_VISIBLE);
    RECT r = mi.rcMonitor;
    SetWindowPos(win, HWND_TOP, r.left, r.top, r.right - r.left, r.bottom - r.top, SWP_FRAMECHANGED | SWP_NOOWNERZORDER);
  } else {
    SetWindowLongPtrW(win, GWL_STYLE, WS_OVERLAPPEDWINDOW | WS_VISIBLE);
    SetWindowPlacement(win, &before);
    SetWindowPos(win, NULL, 0, 0, 0, 0, SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOOWNERZORDER);
  }
  fullscreen = on;
}

static void resizeWebView(void) {
  if (!controller) return;
  RECT r;
  GetClientRect(win, &r);
  VT(controller, CTL_put_Bounds, HRESULT(STDMETHODCALLTYPE *)(void *, RECT))(controller, r);
}

static void restartGame(void) {
  if (webview) VT(webview, WV_Reload, Fn0)(webview);
}

static void showAbout(void) {
  WCHAR text[1600];
  copyW(text, credits, 1600);
  catW(text, L"\n\nVisit the Game-Maker: Sandbox Edition website?", 1600);
  WCHAR caption[300] = L"About ";
  catW(caption, title, 300);
  if (MessageBoxW(win, text, caption, MB_YESNO | MB_ICONINFORMATION) == IDYES) openInBrowser(site);
}

/** No WebView2 (or one too old to play the game): say so, and offer Microsoft's download. */
static void noWebView(HRESULT hr) {
  WCHAR text[1200];
  copyW(text, title, 1200);
  catW(text,
       L" needs Microsoft Edge WebView2 to play. It comes with Windows 11 and with Windows 10 kept up to date, "
       L"but this PC does not seem to have it (or has an old one).\n\n"
       L"Download it from Microsoft now? Run the small installer it saves, then open the game again.",
       1200);
  if (hr) {
    WCHAR code[40];
    wsprintfW(code, L"\n\n(Error 0x%08X)", (unsigned)hr);
    catW(text, code, 1200);
  }
  if (MessageBoxW(win, text, title, MB_YESNO | MB_ICONWARNING) == IDYES) openInBrowser(DOWNLOAD_URL);
  if (win) DestroyWindow(win);
  else PostQuitMessage(1);
}

// ---- COM handlers: static objects, one vtable each -------------------------------------

typedef struct {
  void **vt;
  const IID *iid;
} Handler;

static HRESULT STDMETHODCALLTYPE handlerQI(Handler *h, REFIID riid, void **out) {
  if (IsEqualIID(riid, &IID_IUnknown) || IsEqualIID(riid, h->iid)) {
    *out = h;
    return S_OK;
  }
  *out = NULL;
  return E_NOINTERFACE;
}
static ULONG STDMETHODCALLTYPE handlerAddRef(Handler *h) { return 1; }
static ULONG STDMETHODCALLTYPE handlerRelease(Handler *h) { return 1; }
#define HANDLER(name, iid, invoke)                                                    \
  static void *name##Vt[] = {(void *)handlerQI, (void *)handlerAddRef, (void *)handlerRelease, (void *)invoke}; \
  static Handler name = {name##Vt, &iid};

// Links (the credit, a shareware notice) open in the browser; only the game's own page loads here.
static HRESULT STDMETHODCALLTYPE onNavigationStarting(Handler *h, void *sender, void *args) {
  WCHAR *uri = NULL;
  if (FAILED(VT(args, NAVARGS_get_Uri, FnP)(args, &uri)) || !uri) return S_OK;
  if (!startsWith(uri, L"https://" HOST L"/") && !startsWith(uri, L"about:") && !startsWith(uri, L"data:")) {
    VT(args, NAVARGS_put_Cancel, FnB)(args, TRUE);
    openInBrowser(uri);
  }
  CoTaskMemFree(uri);
  return S_OK;
}
HANDLER(navigationStarting, IID_ICoreWebView2NavigationStartingEventHandler, onNavigationStarting)

static HRESULT STDMETHODCALLTYPE onNewWindow(Handler *h, void *sender, void *args) {
  WCHAR *uri = NULL;
  VT(args, WINARGS_put_Handled, FnB)(args, TRUE);
  if (SUCCEEDED(VT(args, WINARGS_get_Uri, FnP)(args, &uri)) && uri) {
    openInBrowser(uri);
    CoTaskMemFree(uri);
  }
  return S_OK;
}
HANDLER(newWindow, IID_ICoreWebView2NewWindowRequestedEventHandler, onNewWindow)

// F11 and Alt+Enter: full screen. Ctrl+R: restart. Alt+F4: quit. Every other key is the game's.
static HRESULT STDMETHODCALLTYPE onKey(Handler *h, void *sender, void *args) {
  int kind = 0;
  UINT key = 0;
  VT(args, KEYARGS_get_KeyEventKind, FnP)(args, &kind);
  VT(args, KEYARGS_get_VirtualKey, FnP)(args, &key);
  INT lparam = 0;
  VT(args, KEYARGS_get_KeyEventLParam, FnP)(args, &lparam);
  BOOL repeat = (lparam & 0x40000000) != 0; // held down: toggle once
  BOOL handled = TRUE;
  if ((kind == KEY_EVENT_KIND_KEY_DOWN && key == VK_F11) || (kind == KEY_EVENT_KIND_SYSTEM_KEY_DOWN && key == VK_RETURN)) {
    if (!repeat) setFullscreen(!fullscreen);
  } else if (kind == KEY_EVENT_KIND_SYSTEM_KEY_DOWN && key == VK_F4) PostMessageW(win, WM_CLOSE, 0, 0);
  else if (kind == KEY_EVENT_KIND_KEY_DOWN && key == 'R' && (GetAsyncKeyState(VK_CONTROL) & 0x8000) && !(GetAsyncKeyState(VK_MENU) & 0x8000)) restartGame();
  else handled = FALSE;
  if (handled) VT(args, KEYARGS_put_Handled, FnB)(args, TRUE);
  return S_OK;
}
HANDLER(keyPressed, IID_ICoreWebView2AcceleratorKeyPressedEventHandler, onKey)

// The page asked for full screen (or left it): the window follows.
static HRESULT STDMETHODCALLTYPE onFullScreenElement(Handler *h, void *sender, void *args) {
  BOOL on = FALSE;
  VT(sender, WV_get_ContainsFullScreenElement, FnP)(sender, &on);
  setFullscreen(on);
  return S_OK;
}
HANDLER(fullScreenElement, IID_ICoreWebView2ContainsFullScreenElementChangedEventHandler, onFullScreenElement)

// Tests: with GM_READY_FILE set, a few seconds after the page loads (GM_READY_DELAY), the
// program writes what the page shows there as JSON; GM_TEST_SAVE stores a value the next
// launch should find; GM_TEST_EXIT closes the program afterwards.
static const WCHAR readyScript[] =
    L"(() => { const keys = []; for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));"
    L" const before = localStorage.getItem('gamemaker-win:test');"
    L" if (TESTSAVE) localStorage.setItem('gamemaker-win:test', String(Date.now()));"
    L" return { title: document.title, canvas: !!document.querySelector('canvas'),"
    L" text: (document.querySelector('#player')?.innerText || '').slice(0, 200), origin: location.origin, storage: keys,"
    L" test: before, worklet: typeof AudioWorkletNode, agent: navigator.userAgent }; })()";

static HRESULT STDMETHODCALLTYPE onScriptDone(Handler *h, HRESULT hr, const WCHAR *json) {
  WCHAR path[MAX_PATH];
  if (GetEnvironmentVariableW(L"GM_READY_FILE", path, MAX_PATH)) {
    const WCHAR *text = SUCCEEDED(hr) && json ? json : L"{\"error\":\"script failed\"}";
    int n = WideCharToMultiByte(CP_UTF8, 0, text, -1, NULL, 0, NULL, NULL);
    char *utf8 = HeapAlloc(GetProcessHeap(), 0, n);
    if (utf8) {
      WideCharToMultiByte(CP_UTF8, 0, text, -1, utf8, n, NULL, NULL);
      writeFile(path, utf8, n - 1);
      HeapFree(GetProcessHeap(), 0, utf8);
    }
  }
  if (GetEnvironmentVariableW(L"GM_TEST_EXIT", NULL, 0)) PostMessageW(win, WM_CLOSE, 0, 0);
  return S_OK;
}
HANDLER(scriptDone, IID_ICoreWebView2ExecuteScriptCompletedHandler, onScriptDone)

static HRESULT STDMETHODCALLTYPE onNavigationCompleted(Handler *h, void *sender, void *args) {
  WCHAR delay[16];
  if (!GetEnvironmentVariableW(L"GM_READY_FILE", NULL, 0)) return S_OK;
  int seconds = GetEnvironmentVariableW(L"GM_READY_DELAY", delay, 16) ? delay[0] - '0' : 4;
  SetTimer(win, TIMER_READY, (seconds < 0 || seconds > 9 ? 4 : seconds) * 1000, NULL);
  return S_OK;
}
HANDLER(navigationCompleted, IID_ICoreWebView2NavigationCompletedEventHandler, onNavigationCompleted)

static void runReadyScript(void) {
  WCHAR script[sizeof readyScript / sizeof(WCHAR) + 8];
  // TESTSAVE -> true / false
  const WCHAR *mark = readyScript;
  int i = 0;
  BOOL save = GetEnvironmentVariableW(L"GM_TEST_SAVE", NULL, 0) != 0;
  while (*mark) {
    if (startsWith(mark, L"TESTSAVE")) {
      const WCHAR *v = save ? L"true" : L"false";
      while (*v) script[i++] = *v++;
      mark += 8;
    } else {
      script[i++] = *mark++;
    }
  }
  script[i] = 0;
  VT(webview, WV_ExecuteScript, FnPP)(webview, script, &scriptDone);
}

// The web view is ready: set it up and open the game.
static HRESULT STDMETHODCALLTYPE onController(Handler *h, HRESULT hr, void *made) {
  if (FAILED(hr) || !made) {
    noWebView(hr);
    return S_OK;
  }
  void *base = NULL;
  if (FAILED(VT(made, 0, FnQI)(made, &IID_ICoreWebView2Controller2, &controller))) {
    controller = made;
    VT(made, 1, FnAddRef)(made); // keep it
  } else {
    COREWEBVIEW2_COLOR black = {255, 0, 0, 0};
    VT(controller, CTL_put_DefaultBackgroundColor, HRESULT(STDMETHODCALLTYPE *)(void *, COREWEBVIEW2_COLOR))(controller, black);
  }
  VT(controller, CTL_get_CoreWebView2, FnP)(controller, &base);
  if (!base || FAILED(VT(base, 0, FnQI)(base, &IID_ICoreWebView2_3, &webview))) {
    noWebView(E_NOINTERFACE);
    return S_OK;
  }

  void *settings = NULL;
  if (SUCCEEDED(VT(webview, WV_get_Settings, FnP)(webview, &settings)) && settings) {
    BOOL inspect = GetEnvironmentVariableW(L"GM_INSPECT", NULL, 0) != 0;
    VT(settings, SET_put_IsStatusBarEnabled, FnB)(settings, FALSE);
    VT(settings, SET_put_AreDevToolsEnabled, FnB)(settings, inspect);
    VT(settings, SET_put_AreDefaultContextMenusEnabled, FnB)(settings, inspect);
    VT(settings, SET_put_IsZoomControlEnabled, FnB)(settings, FALSE);
    void *s3 = NULL, *s8 = NULL;
    // no browser keys (print, find, back, zoom): the game has the keyboard
    if (SUCCEEDED(VT(settings, 0, FnQI)(settings, &IID_ICoreWebView2Settings3, &s3)) && s3) VT(s3, SET_put_AreBrowserAcceleratorKeysEnabled, FnB)(s3, inspect);
    if (SUCCEEDED(VT(settings, 0, FnQI)(settings, &IID_ICoreWebView2Settings8, &s8)) && s8) {
      VT(s8, SET_put_IsPasswordAutosaveEnabled, FnB)(s8, FALSE);
      VT(s8, SET_put_IsGeneralAutofillEnabled, FnB)(s8, FALSE);
      VT(s8, SET_put_IsPinchZoomEnabled, FnB)(s8, FALSE);
      VT(s8, SET_put_IsSwipeNavigationEnabled, FnB)(s8, FALSE);
      // the page is the game's own, from this program: nothing to look up online
      VT(s8, SET_put_IsReputationCheckingRequired, FnB)(s8, FALSE);
    }
  }

  WV2_TOKEN token;
  VT(webview, WV_add_NavigationStarting, FnPP)(webview, &navigationStarting, &token);
  VT(webview, WV_add_NavigationCompleted, FnPP)(webview, &navigationCompleted, &token);
  VT(webview, WV_add_NewWindowRequested, FnPP)(webview, &newWindow, &token);
  VT(webview, WV_add_ContainsFullScreenElementChanged, FnPP)(webview, &fullScreenElement, &token);
  VT(controller, CTL_add_AcceleratorKeyPressed, FnPP)(controller, &keyPressed, &token);

  resizeWebView();
  VT(controller, CTL_put_IsVisible, FnB)(controller, TRUE);
  VT(webview, WV_SetVirtualHostNameToFolderMapping, HRESULT(STDMETHODCALLTYPE *)(void *, const WCHAR *, const WCHAR *, int))(webview, HOST, gameDir, HOST_RESOURCE_ACCESS_KIND_ALLOW);
  VT(webview, WV_Navigate, FnP)(webview, (void *)PAGE_URL);
  VT(controller, CTL_MoveFocus, HRESULT(STDMETHODCALLTYPE *)(void *, int))(controller, MOVE_FOCUS_REASON_PROGRAMMATIC);
  return S_OK;
}
HANDLER(controllerMade, IID_ICoreWebView2CreateCoreWebView2ControllerCompletedHandler, onController)

static HRESULT STDMETHODCALLTYPE onEnvironment(Handler *h, HRESULT hr, void *env) {
  if (FAILED(hr) || !env) {
    noWebView(hr);
    return S_OK;
  }
  VT(env, ENV_CreateCoreWebView2Controller, FnPP)(env, win, &controllerMade);
  return S_OK;
}
HANDLER(environmentMade, IID_ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler, onEnvironment)

// ICoreWebView2EnvironmentOptions: music may start without a click.
static const WCHAR browserArguments[] = L"--autoplay-policy=no-user-gesture-required";
static HRESULT dupString(const WCHAR *s, WCHAR **out) {
  int n = (lstrlenW(s) + 1) * (int)sizeof(WCHAR);
  *out = CoTaskMemAlloc(n);
  if (!*out) return E_OUTOFMEMORY;
  memcpy(*out, s, n);
  return S_OK;
}
static HRESULT STDMETHODCALLTYPE optArgs(void *o, WCHAR **v) { return dupString(browserArguments, v); }
static HRESULT STDMETHODCALLTYPE optLanguage(void *o, WCHAR **v) { return dupString(L"", v); }
static HRESULT STDMETHODCALLTYPE optVersion(void *o, WCHAR **v) { return dupString(L"99.0.1150.38", v); }
static HRESULT STDMETHODCALLTYPE optSso(void *o, BOOL *v) { return *v = FALSE, S_OK; }
static HRESULT STDMETHODCALLTYPE optPut(void *o, void *v) { return S_OK; }
static void *optionsVt[] = {(void *)handlerQI, (void *)handlerAddRef, (void *)handlerRelease, (void *)optArgs, (void *)optPut, (void *)optLanguage,
                            (void *)optPut, (void *)optVersion, (void *)optPut, (void *)optSso, (void *)optPut};
static Handler options = {optionsVt, &IID_ICoreWebView2EnvironmentOptions};

typedef HRESULT(STDAPICALLTYPE *CreateInternal)(int, int, const WCHAR *, void *, void *);

/** The installed runtime's EmbeddedBrowserWebView.dll, from Edge's updater's record of where it is. */
static HMODULE loadRuntimeClient(void) {
  static const WCHAR key[] = L"SOFTWARE\\Microsoft\\EdgeUpdate\\ClientState\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
  HKEY roots[] = {HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER};
  for (int i = 0; i < 2; i++) {
    WCHAR dir[MAX_PATH];
    DWORD size = sizeof dir - sizeof(WCHAR) * 64;
    if (RegGetValueW(roots[i], key, L"EBWebView", RRF_RT_REG_SZ | RRF_SUBKEY_WOW6432KEY, NULL, dir, &size) != ERROR_SUCCESS) continue;
    int n = lstrlenW(dir);
    if (n && dir[n - 1] != '\\') catW(dir, L"\\", MAX_PATH);
#if defined(__aarch64__) || defined(_M_ARM64)
    catW(dir, L"EBWebView\\arm64\\EmbeddedBrowserWebView.dll", MAX_PATH);
#elif defined(__x86_64__) || defined(_M_X64)
    catW(dir, L"EBWebView\\x64\\EmbeddedBrowserWebView.dll", MAX_PATH);
#else
    catW(dir, L"EBWebView\\x86\\EmbeddedBrowserWebView.dll", MAX_PATH);
#endif
    HMODULE dll = LoadLibraryExW(dir, NULL, LOAD_WITH_ALTERED_SEARCH_PATH);
    if (dll) return dll;
  }
  return NULL;
}

static HRESULT createEnvironment(void) {
  WCHAR userData[MAX_PATH];
  copyW(userData, dataDir, MAX_PATH);
  SetEnvironmentVariableW(L"WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", browserArguments);
  HMODULE client = loadRuntimeClient();
  if (!client) return HRESULT_FROM_WIN32(ERROR_FILE_NOT_FOUND);
  CreateInternal create = (CreateInternal)(void *)GetProcAddress(client, "CreateWebViewEnvironmentWithOptionsInternal");
  if (!create) return HRESULT_FROM_WIN32(ERROR_PROC_NOT_FOUND);
  return create(1, 0, userData, &options, &environmentMade); // 0: an installed runtime
}

// ---- the window ----------------------------------------------------------------------

static LRESULT CALLBACK windowProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
  switch (msg) {
  case WM_SIZE:
    resizeWebView();
    return 0;
  case WM_MOVE:
  case WM_MOVING:
    if (controller) VT(controller, CTL_NotifyParentWindowPositionChanged, Fn0)(controller);
    break;
  case WM_SETFOCUS:
    if (controller) VT(controller, CTL_MoveFocus, HRESULT(STDMETHODCALLTYPE *)(void *, int))(controller, MOVE_FOCUS_REASON_PROGRAMMATIC);
    return 0;
  case WM_GETMINMAXINFO: {
    RECT r = {0, 0, MulDiv(320, GetDpiForWindow(hwnd), 96), MulDiv(240, GetDpiForWindow(hwnd), 96)};
    AdjustWindowRectExForDpi(&r, WS_OVERLAPPEDWINDOW, FALSE, 0, GetDpiForWindow(hwnd));
    ((MINMAXINFO *)lp)->ptMinTrackSize.x = r.right - r.left;
    ((MINMAXINFO *)lp)->ptMinTrackSize.y = r.bottom - r.top;
    return 0;
  }
  case WM_DPICHANGED: {
    RECT *r = (RECT *)lp;
    SetWindowPos(hwnd, NULL, r->left, r->top, r->right - r->left, r->bottom - r->top, SWP_NOZORDER | SWP_NOACTIVATE);
    return 0;
  }
  case WM_SYSKEYDOWN: // keys pressed while the web view is not focused yet
    if (wp == VK_RETURN) return setFullscreen(!fullscreen), 0;
    break;
  case WM_SYSCHAR:
    if (wp == '\r') return 0; // no beep for Alt+Enter
    break;
  case WM_KEYDOWN:
    if (wp == VK_F11) return setFullscreen(!fullscreen), 0;
    break;
  case WM_SYSCOMMAND:
    switch (wp & 0xFFF0) {
    case IDM_RESTART: return restartGame(), 0;
    case IDM_FULLSCREEN: return setFullscreen(!fullscreen), 0;
    case IDM_ABOUT: return showAbout(), 0;
    }
    break;
  case WM_TIMER:
    if (wp == TIMER_READY) {
      KillTimer(hwnd, TIMER_READY);
      runReadyScript();
    }
    return 0;
  case WM_CLOSE:
    saveWindowPlace();
    DestroyWindow(hwnd);
    return 0;
  case WM_DESTROY:
    if (controller) VT(controller, CTL_Close, Fn0)(controller);
    PostQuitMessage(0);
    return 0;
  }
  return DefWindowProcW(hwnd, msg, wp, lp);
}

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE prev, PWSTR cmd, int show) {
  inst = hInstance;
  SetDefaultDllDirectories(LOAD_LIBRARY_SEARCH_SYSTEM32); // never a DLL from the Downloads folder
  readInfo();

  // one window a game: opening it again brings the open one forward
  WCHAR mutexName[160] = L"Local\\GameMaker.";
  catW(mutexName, gameId, 160);
  CreateMutexW(NULL, TRUE, mutexName);
  if (GetLastError() == ERROR_ALREADY_EXISTS) {
    HWND other = FindWindowW(CLASS_NAME, title);
    if (other) {
      if (IsIconic(other)) ShowWindow(other, SW_RESTORE);
      SetForegroundWindow(other);
    }
    return 0;
  }

  WCHAR appId[160] = L"GameMaker.";
  catW(appId, gameId, 160);
  SetCurrentProcessExplicitAppUserModelID(appId); // each game its own taskbar button

  if (!prepareFolders()) {
    MessageBoxW(NULL, L"The game could not make its folder in your AppData\\Local folder, so it cannot start.", title, MB_OK | MB_ICONERROR);
    return 1;
  }
  CoInitializeEx(NULL, COINIT_APARTMENTTHREADED);

  WNDCLASSEXW wc = {sizeof wc};
  wc.style = CS_HREDRAW | CS_VREDRAW;
  wc.lpfnWndProc = windowProc;
  wc.hInstance = hInstance;
  wc.hIcon = LoadImageW(hInstance, MAKEINTRESOURCEW(1), IMAGE_ICON, GetSystemMetrics(SM_CXICON), GetSystemMetrics(SM_CYICON), LR_DEFAULTCOLOR);
  wc.hIconSm = LoadImageW(hInstance, MAKEINTRESOURCEW(1), IMAGE_ICON, GetSystemMetrics(SM_CXSMICON), GetSystemMetrics(SM_CYSMICON), LR_DEFAULTCOLOR);
  wc.hCursor = LoadCursorW(NULL, (LPCWSTR)IDC_ARROW);
  wc.hbrBackground = GetStockObject(BLACK_BRUSH);
  wc.lpszClassName = CLASS_NAME;
  RegisterClassExW(&wc);

  // 960 x 720 (4:3) inside the frame, at the screen's scale
  UINT dpi = GetDpiForSystem();
  RECT r = {0, 0, MulDiv(960, dpi, 96), MulDiv(720, dpi, 96)};
  AdjustWindowRectExForDpi(&r, WS_OVERLAPPEDWINDOW, FALSE, 0, dpi);
  RECT work;
  SystemParametersInfoW(SPI_GETWORKAREA, 0, &work, 0);
  int w = r.right - r.left, h = r.bottom - r.top;
  if (h > work.bottom - work.top) h = work.bottom - work.top, w = h * 4 / 3;
  win = CreateWindowExW(0, CLASS_NAME, title, WS_OVERLAPPEDWINDOW, work.left + (work.right - work.left - w) / 2, work.top + (work.bottom - work.top - h) / 2, w, h, NULL, NULL,
                        hInstance, NULL);
  if (!win) return 1;
  WINDOWPLACEMENT wp;
  if (loadWindowPlace(&wp)) {
    if (wp.showCmd != SW_SHOWMAXIMIZED) wp.showCmd = show == SW_SHOWMINNOACTIVE || show == SW_MINIMIZE ? show : SW_SHOWNORMAL;
    SetWindowPlacement(win, &wp);
  } else {
    ShowWindow(win, show);
  }
  UpdateWindow(win);

  HMENU menu = GetSystemMenu(win, FALSE);
  AppendMenuW(menu, MF_SEPARATOR, 0, NULL);
  AppendMenuW(menu, MF_STRING, IDM_RESTART, L"Restart\tCtrl+R");
  AppendMenuW(menu, MF_STRING, IDM_FULLSCREEN, L"Full screen\tF11");
  WCHAR about[300] = L"About ";
  catW(about, title, 290);
  catW(about, L"…", 300);
  AppendMenuW(menu, MF_STRING, IDM_ABOUT, about);

  HRESULT hr = createEnvironment();
  if (FAILED(hr)) noWebView(hr);

  MSG m;
  while (GetMessageW(&m, NULL, 0, 0) > 0) {
    TranslateMessage(&m);
    DispatchMessageW(&m);
  }
  CoUninitialize();
  return 0;
}
