// Posts timed key events to one process (DOSBox), so a key can be held for as long as a game
// polls it (AppleScript's key code taps are too short for a game reading the keyboard at 18 Hz).
//   swiftc -O keyseq.swift -o keyseq && ./keyseq <pid> < script.txt
// script lines: "<ms since start> down|up <mac key code>" (sorted by time); needs Accessibility.
import Cocoa
import CoreGraphics
let pid = pid_t(CommandLine.arguments[1])!
let start = Date()
while let line = readLine() {
  let p = line.split(separator: " ")
  if p.count < 3 { continue }
  let at = Double(p[0])! / 1000.0
  let wait = at - Date().timeIntervalSince(start)
  if wait > 0 { Thread.sleep(forTimeInterval: wait) }
  let e = CGEvent(keyboardEventSource: nil, virtualKey: CGKeyCode(UInt16(p[2])!), keyDown: p[1] == "down")!
  e.postToPid(pid)
}
