// GT911 report transactions, independent of Arduino so host tests can inject short I2C reads.
#pragma once
#include <stdint.h>
namespace gtr {
struct Report {
  int n = 0;
  int rawX[5], rawY[5], id[5], size[5];
  bool fresh = false;
  // Reads a new report if the chip has one; otherwise keeps the last. Returns the point count.
  template <class Bus> int pollReport(Bus& bus, uint8_t addr) {
    fresh = false;
    bus.beginTransmission(addr);
    bus.write(0x81);
    bus.write(0x4E);
    if (bus.endTransmission() != 0) return n;
    bus.requestFrom((int)addr, 1);
    if (!bus.available()) return n;
    uint8_t st = bus.read();
    if (!(st & 0x80)) return n;
    int cnt = st & 0x0F;
    if (cnt > 5) cnt = 5;
    if (cnt > 0) {
      bus.beginTransmission(addr);
      bus.write(0x81);
      bus.write(0x4F);  // point i: id, x lo, x hi, y lo, y hi, size lo, size hi, reserved
      if (bus.endTransmission() != 0) return n;
      // A short I2C read is not a lift. Keep the held report and retry without acknowledging it.
      if (bus.requestFrom((int)addr, cnt * 8) != cnt * 8) {
        while (bus.available()) bus.read();
        return n;
      }
      n = 0;
      for (int i = 0; i < cnt && bus.available() >= 8; i++) {
        uint8_t b[8];
        for (auto& v : b) v = bus.read();
        rawX[n] = b[1] | (b[2] << 8);
        rawY[n] = b[3] | (b[4] << 8);
        id[n] = b[0] & 0x0F;
        size[n] = b[5] | (b[6] << 8);
        n++;
      }
    }
    else n = 0;  // only a complete zero-contact report releases the fingers
    fresh = true;
    bus.beginTransmission(addr);
    bus.write(0x81);
    bus.write(0x4E);
    bus.write(0);
    bus.endTransmission();
    return n;
  }
};
}  // namespace gtr
