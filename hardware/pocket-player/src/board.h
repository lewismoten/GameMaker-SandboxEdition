// Pin map and panel setup for the ESP32-3248S035 (Sunton-style 3.5" 480x320 board), LovyanGFX.
// Pins from the community tables: https://homeding.github.io/boards/esp32/panel-3248S035.htm and
// https://community.home-assistant.io/t/help-making-esp32-3248s035-work/748332
//   display ST7796 (SPI): SCLK 14, MOSI 13, MISO 12, CS 15, DC 2, RST tied to EN, backlight 27
//   capacitive touch GT911 (I2C): SDA 33, SCL 32, INT 21, RST 25, address 0x5D or 0x14
//   resistive touch XPT2046 (shares the display SPI bus): CS 33, IRQ 36
//   microSD (separate SPI bus): CS 5, SCLK 18, MISO 19, MOSI 23
// LovyanGFX (c) lovyan03, FreeBSD/BSD-style license (see NOTICE.md).
#pragma once
#define LGFX_USE_V1
#include <LovyanGFX.hpp>

#ifdef POCKET_CYD28
// ESP32-2432S028 ("Cheap Yellow Display", 2.8" 320x240). Pins from the community tables for this board
// (https://github.com/witnessmenow/ESP32-Cheap-Yellow-Display, PINS.md), confirmed on two units on 2026-11-05
// (an XPT2046 answers on the pins below, no I2C touch chip, the microSD slot mounts):
//   display (SPI2/HSPI): SCLK 14, MOSI 13, MISO 12, CS 15, DC 2, RST tied to EN, backlight 21
//     the panel is an ILI9341, or an ST7789 on the "2 USB" revision: Settings picks it, see PanelType below
//   resistive touch XPT2046 on its own pins (bit-banged, xpt2046.h): CLK 25, MOSI 32, MISO 39, CS 33, IRQ 36
//   microSD (VSPI): CS 5, SCLK 18, MISO 19, MOSI 23
//   RGB LED (active low): R 4, G 16, B 17; speaker amplifier input GPIO 26 (same as the other board)
constexpr int PIN_SCLK = 14, PIN_MOSI = 13, PIN_MISO = 12, PIN_CS = 15, PIN_DC = 2, PIN_BL = 21;
constexpr int PIN_XCLK = 25, PIN_XMOSI = 32, PIN_XMISO = 39, PIN_XCS = 33, PIN_XIRQ = 36;
constexpr int PIN_LED_R = 4, PIN_LED_G = 16, PIN_LED_B = 17;
// A display mode is three bits: 1 = ST7789 driver (else ILI9341), 2 = colors inverted, 4 = red and blue swapped (BGR).
// Lewis's two units showed a rotated, mirrored picture and wrong colors with mode 0, and the panel's ID registers do not
// read back, so the modes are tried on the board: see the test pattern at boot (main.cpp). Turns 0..3 are landscape rotations
// 1, 3, 5, 7 (5 and 7 are mirrored).
enum PanelType { PANEL_ILI9341 = 0, PANEL_TYPES = 8 };
constexpr int TURNS = 4;
constexpr int turnRotation(int t) { return 1 + 2 * (t & 3); }
// microSD (TF) slot on its own SPI bus: rzeldent's esp32-3248S035C.json (https://github.com/rzeldent/platformio-espressif32-sunton)
// sets TF_CS=5, TF_SPI_SCLK=18, TF_SPI_MISO=19, TF_SPI_MOSI=23.
constexpr int PIN_SD_CS = 5, PIN_SD_SCLK = 18, PIN_SD_MISO = 19, PIN_SD_MOSI = 23;


class LGFX : public lgfx::LGFX_Device {
  lgfx::Panel_ILI9341 pi_;
  lgfx::Panel_ST7789 ps_;
  lgfx::Bus_SPI bus_;
  lgfx::Light_PWM light_;

 public:
  LGFX() {
    {
      auto c = bus_.config();
      c.spi_host = SPI2_HOST;
      c.spi_mode = 0;
      c.freq_write = 40000000;
      c.freq_read = 16000000;
      c.spi_3wire = false;
      c.use_lock = true;
      c.dma_channel = SPI_DMA_CH_AUTO;
      c.pin_sclk = PIN_SCLK;
      c.pin_mosi = PIN_MOSI;
      c.pin_miso = PIN_MISO;
      c.pin_dc = PIN_DC;
      bus_.config(c);
    }
    auto lc = light_.config();
    lc.pin_bl = PIN_BL;
    lc.invert = false;
    lc.freq = 44100;
    lc.pwm_channel = 7;
    light_.config(lc);
    cfg(pi_, false);
    cfg(ps_, true);
    setPanel(&pi_);
  }
  // Picks the display mode (before init()): see PanelType.
  void choose(int t) {
    auto c = (t & 1) ? ps_.config() : pi_.config();
    c.invert = (t & 2) != 0;
    c.rgb_order = (t & 4) != 0;
    if (t & 1) { ps_.config(c); setPanel(&ps_); }
    else { pi_.config(c); setPanel(&pi_); }
  }

  // The controller's id registers, read over MISO (GPIO 12) with the running driver's read timing (after init()):
  // 04h RDDID (3 bytes; the ILI9341 sends a dummy byte first, so 4 are read), DAh/DBh/DCh RDID1..3, D3h RDID4 (ILI9341:
  // a dummy, then 00 93 41). A glass whose MISO is not wired reads all zeros or all ones.
  void readIds(uint32_t& rddid, uint8_t id[3], uint32_t& rdid4) {
    auto& p = *getPanel();
    rddid = p.readCommand(0x04, 0, 4);
    for (int i = 0; i < 3; i++) id[i] = (uint8_t)p.readCommand(0xDA + i, 0, 1);
    rdid4 = p.readCommand(0xD3, 0, 4);
  }
  // Sends a list of panel commands (cmd, length, bytes..., ending 0xFF): the picture tuning (picturetune.h).
  void sendList(const uint8_t* l) {
    startWrite();
    while (*l != 0xFF) {
      writeCommand(l[0]);
      for (int i = 0; i < l[1]; i++) writeData(l[2 + i]);
      l += 2 + l[1];
    }
    endWrite();
  }

  // 320 x 240 (a glass wired the other way round, setup's third landscape way) or 240 x 320 as usual; call setRotation after.
  void setWide(bool w) {
    dims(pi_, w);
    dims(ps_, w);
  }

  // Changes the colors on the running panel (bits 2 inverted, 4 red/blue swapped; the driver bit stays as started) and sets the
  // rotation again, which writes MADCTL with the new color order: the setup's colors step cycles the modes with no restart.
  void applyColors(int t, int rotation) {
    if (t & 1) recolor(ps_, t); else recolor(pi_, t);
    setRotation(rotation);
  }

 private:
  template <class P> void dims(P& p, bool w) {
    auto c = p.config();
    c.panel_width = c.memory_width = w ? 320 : 240;
    c.panel_height = c.memory_height = w ? 240 : 320;
    p.config(c);
  }
  template <class P> void recolor(P& p, int t) {
    auto c = p.config();
    c.invert = (t & 2) != 0;
    c.rgb_order = (t & 4) != 0;
    p.config(c);
    p.setInvert(c.invert);
  }
  template <class P> void cfg(P& p, bool inv) {
    p.setBus(&bus_);
    auto c = p.config();
    c.pin_cs = PIN_CS;
    c.pin_rst = -1;
    c.pin_busy = -1;
    c.panel_width = 240;
    c.panel_height = 320;
    c.offset_x = 0;
    c.offset_y = 0;
    c.offset_rotation = 0;
    c.readable = false;
    c.invert = inv;
    c.rgb_order = false;
    c.dlen_16bit = false;
    c.bus_shared = false;  // the touch chip and the card have their own pins
    p.config(c);
    p.setLight(&light_);
  }
};
#else
constexpr int PIN_SCLK = 14, PIN_MOSI = 13, PIN_MISO = 12, PIN_CS = 15, PIN_DC = 2, PIN_BL = 27;
constexpr int PIN_SDA = 33, PIN_SCL = 32, PIN_TINT = 21, PIN_TRST = 25;
constexpr int PIN_XCS = 33, PIN_XIRQ = 36;
// microSD (TF) slot on its own SPI bus: rzeldent's esp32-3248S035C.json (https://github.com/rzeldent/platformio-espressif32-sunton)
// sets TF_CS=5, TF_SPI_SCLK=18, TF_SPI_MISO=19, TF_SPI_MOSI=23.
constexpr int PIN_SD_CS = 5, PIN_SD_SCLK = 18, PIN_SD_MISO = 19, PIN_SD_MOSI = 23;

class LGFX : public lgfx::LGFX_Device {
  lgfx::Panel_ST7796 panel_;
  lgfx::Bus_SPI bus_;
  lgfx::Light_PWM light_;
  lgfx::Touch_XPT2046 touch_;

 public:
  LGFX() {
    {
      auto c = bus_.config();
      c.spi_host = SPI2_HOST;
      c.spi_mode = 0;
      c.freq_write = 40000000;
      c.freq_read = 16000000;
      c.spi_3wire = false;
      c.use_lock = true;
      c.dma_channel = SPI_DMA_CH_AUTO;
      c.pin_sclk = PIN_SCLK;
      c.pin_mosi = PIN_MOSI;
      c.pin_miso = PIN_MISO;
      c.pin_dc = PIN_DC;
      bus_.config(c);
      panel_.setBus(&bus_);
    }
    {
      auto c = panel_.config();
      c.pin_cs = PIN_CS;
      c.pin_rst = -1;
      c.pin_busy = -1;
      c.panel_width = 320;
      c.panel_height = 480;
      c.offset_x = 0;
      c.offset_y = 0;
      c.offset_rotation = 0;
      c.readable = false;
      c.invert = false;  // if colors look inverted on the board, flip this
      c.rgb_order = false;
      c.dlen_16bit = false;
      c.bus_shared = true;
      panel_.config(c);
    }
    {
      auto c = light_.config();
      c.pin_bl = PIN_BL;
      c.invert = false;
      c.freq = 44100;
      c.pwm_channel = 7;
      light_.config(c);
      panel_.setLight(&light_);
    }
    {  // only attached when no GT911 answers (see main.cpp)
      auto c = touch_.config();
      c.x_min = 300;
      c.x_max = 3900;
      c.y_min = 200;
      c.y_max = 3700;
      c.pin_int = PIN_XIRQ;
      c.bus_shared = true;
      c.offset_rotation = 0;
      c.spi_host = SPI2_HOST;
      c.freq = 1000000;
      c.pin_sclk = PIN_SCLK;
      c.pin_mosi = PIN_MOSI;
      c.pin_miso = PIN_MISO;
      c.pin_cs = PIN_XCS;
      touch_.config(c);
    }
    setPanel(&panel_);
  }
  void attachResistive() { panel_.setTouch(&touch_); }
};
#endif
