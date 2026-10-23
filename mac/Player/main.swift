// Game-Maker: Sandbox Edition's Mac player: a window with a web view that plays the game
// bundled in the app (Contents/Resources/game.html, the "one web page" export). Nothing is
// fetched from the network; high scores and saved games live in the page's localStorage,
// which WebKit keeps per app (bundle identifier) between launches.
//
// The app's name, version and credits come from its Info.plist, so one binary serves every
// game: the web app (src/export/macApp.ts) and mac/package.ts put this binary in each app.
import AppKit
import WebKit

let info = Bundle.main.infoDictionary ?? [:]
let appName = (info["CFBundleDisplayName"] as? String) ?? (info["CFBundleName"] as? String) ?? "Game"
let credits = (info["GMCredits"] as? String) ?? "Made with Game-Maker: Sandbox Edition."
let siteURL = URL(string: (info["GMSite"] as? String) ?? "https://lewismoten.github.io/GameMaker-SandboxEdition/")!

/** A window that does not beep at keys the game leaves alone (the page handles every key). */
final class GameWindow: NSWindow {
  override func noResponder(for eventSelector: Selector) {
    if eventSelector == #selector(NSResponder.keyDown(with:)) { return }
    super.noResponder(for: eventSelector)
  }
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
  var window: NSWindow!
  var webView: WKWebView!

  func applicationDidFinishLaunching(_ notification: Notification) {
    buildMenu()
    let config = WKWebViewConfiguration()
    config.websiteDataStore = .default() // persistent: localStorage survives relaunch
    config.mediaTypesRequiringUserActionForPlayback = [] // music may start without a click
    config.preferences.javaScriptCanOpenWindowsAutomatically = false
    webView = WKWebView(frame: NSRect(x: 0, y: 0, width: 960, height: 720), configuration: config)
    webView.navigationDelegate = self
    webView.uiDelegate = self
    webView.autoresizingMask = [.width, .height]
    if #available(macOS 13.3, *) { webView.isInspectable = ProcessInfo.processInfo.environment["GM_INSPECT"] != nil }
    webView.setValue(false, forKey: "drawsBackground") // black (the page's), not white, while loading

    window = GameWindow(contentRect: NSRect(x: 0, y: 0, width: 960, height: 720), styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
    window.title = appName
    window.backgroundColor = .black
    window.collectionBehavior = [.fullScreenPrimary]
    window.contentMinSize = NSSize(width: 320, height: 240)
    window.contentView = webView
    window.setFrameAutosaveName("GameWindow")
    if !window.setFrameUsingName("GameWindow") { window.center() }
    window.makeKeyAndOrderFront(nil)
    window.makeFirstResponder(webView)

    if let page = Bundle.main.url(forResource: "game", withExtension: "html") {
      webView.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
    } else {
      webView.loadHTMLString("<body style='background:#000;color:#ccc;font:16px system-ui'>This app has no game in it (Contents/Resources/game.html is missing).</body>", baseURL: nil)
    }
    NSApp.activate(ignoringOtherApps: true)
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

  // Links in the page (the credit, the author's notice) open in the browser, not in the game's window.
  func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    if let url = action.request.url, ["http", "https", "mailto"].contains(url.scheme ?? "") {
      NSWorkspace.shared.open(url)
      decisionHandler(.cancel)
      return
    }
    decisionHandler(.allow)
  }

  func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
    if let url = action.request.url { NSWorkspace.shared.open(url) }
    return nil
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    window.makeFirstResponder(webView)
    reportReady()
  }

  /// Tests: with GM_READY_FILE set, a few seconds after the page loads the app writes what
  /// the page shows (title, whether the game's screen is up, the saved data it holds) there;
  /// GM_TEST_SAVE stores a value for the next launch to find, GM_TEST_START clicks the start
  /// screen first, GM_SNAPSHOT_FILE saves a picture.
  func reportReady() {
    guard let path = ProcessInfo.processInfo.environment["GM_READY_FILE"] else { return }
    let delay = Double(ProcessInfo.processInfo.environment["GM_READY_DELAY"] ?? "4") ?? 4
    var wait = delay
    if ProcessInfo.processInfo.environment["GM_TEST_START"] != nil {
      DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
        self.webView.evaluateJavaScript("document.querySelector('.gm-start')?.click()")
      }
      wait += delay
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + wait) {
      let js = """
        (() => { const keys = []; for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
          const before = localStorage.getItem('gamemaker-mac:test');
          if (\(ProcessInfo.processInfo.environment["GM_TEST_SAVE"] != nil)) localStorage.setItem('gamemaker-mac:test', String(Date.now()));
          return JSON.stringify({ title: document.title, canvas: !!document.querySelector('canvas'),
            text: (document.querySelector('#player')?.innerText || '').slice(0, 200), origin: location.origin, storage: keys,
            test: before, worklet: typeof AudioWorkletNode,
            audio: (() => { try { const c = new AudioContext(); const st = c.state; c.close(); return st; } catch (e) { return String(e); } })() }); })()
        """
      self.webView.evaluateJavaScript(js) { result, error in
        let text = (result as? String) ?? "{\"error\":\"\(error?.localizedDescription ?? "none")\"}"
        try? text.write(toFile: path, atomically: true, encoding: .utf8)
      }
      if let shot = ProcessInfo.processInfo.environment["GM_SNAPSHOT_FILE"] {
        self.webView.takeSnapshot(with: nil) { image, _ in
          guard let tiff = image?.tiffRepresentation, let png = NSBitmapImageRep(data: tiff)?.representation(using: .png, properties: [:]) else { return }
          try? png.write(to: URL(fileURLWithPath: shot))
        }
      }
    }
  }

  @objc func showAbout(_ sender: Any?) {
    let body = NSMutableAttributedString(string: credits, attributes: [.font: NSFont.systemFont(ofSize: 11), .foregroundColor: NSColor.labelColor])
    let link = NSAttributedString(string: "\n\nGame-Maker: Sandbox Edition", attributes: [.font: NSFont.systemFont(ofSize: 11), .link: siteURL])
    body.append(link)
    let style = NSMutableParagraphStyle()
    style.alignment = .center
    body.addAttribute(.paragraphStyle, value: style, range: NSRange(location: 0, length: body.length))
    NSApp.orderFrontStandardAboutPanel(options: [.applicationName: appName, .credits: body])
  }

  @objc func openSite(_ sender: Any?) { NSWorkspace.shared.open(siteURL) }

  @objc func restartGame(_ sender: Any?) { webView.reload() }

  func buildMenu() {
    let main = NSMenu()
    func submenu(_ title: String, _ items: [NSMenuItem]) -> NSMenu {
      let holder = NSMenuItem(title: title, action: nil, keyEquivalent: "")
      let menu = NSMenu(title: title)
      items.forEach(menu.addItem)
      holder.submenu = menu
      main.addItem(holder)
      return menu
    }
    func item(_ title: String, _ action: Selector?, _ key: String = "", _ mods: NSEvent.ModifierFlags = .command, target: AnyObject? = nil) -> NSMenuItem {
      let i = NSMenuItem(title: title, action: action, keyEquivalent: key)
      i.keyEquivalentModifierMask = mods
      i.target = target
      return i
    }
    _ = submenu(appName, [
      item("About \(appName)", #selector(showAbout(_:)), target: self),
      .separator(),
      item("Hide \(appName)", #selector(NSApplication.hide(_:)), "h"),
      item("Hide Others", #selector(NSApplication.hideOtherApplications(_:)), "h", [.command, .option]),
      item("Show All", #selector(NSApplication.unhideAllApplications(_:))),
      .separator(),
      item("Quit \(appName)", #selector(NSApplication.terminate(_:)), "q"),
    ])
    _ = submenu("Game", [
      item("Restart", #selector(restartGame(_:)), "r", target: self),
      .separator(),
      item("Close Window", #selector(NSWindow.performClose(_:)), "w"),
    ])
    _ = submenu("View", [item("Enter Full Screen", #selector(NSWindow.toggleFullScreen(_:)), "f", [.command, .control])])
    let windowMenu = submenu("Window", [
      item("Minimize", #selector(NSWindow.performMiniaturize(_:)), "m"),
      item("Zoom", #selector(NSWindow.performZoom(_:))),
    ])
    NSApp.windowsMenu = windowMenu
    _ = submenu("Help", [item("Game-Maker: Sandbox Edition Website", #selector(openSite(_:)), target: self)])
    NSApp.mainMenu = main
  }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
