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
enum PanelType { PANEL_ILI9341 = 0, PANEL_ILI9341_INV = 1, PANEL_ST7789 = 2, PANEL_TYPES = 3 };
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
  // Picks the driver (before init()): ILI9341, ILI9341 with inverted colors, or ST7789 (inverted, as its modules are).
  void choose(int t) {
    if (t == PANEL_ST7789) setPanel(&ps_);
    else {
      auto c = pi_.config();
      c.invert = t == PANEL_ILI9341_INV;
      pi_.config(c);
      setPanel(&pi_);
    }
  }

 private:
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
