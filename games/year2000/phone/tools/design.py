"""The Phone of the Future: the circuit as data (one source for the schematic, board and BOM).

Each part: ref, symbol (library:name), value, footprint kind, side (F front / B back), pins
{pin number or name: net}. Net names are the schematic labels and the board nets.
Designed by Claude Sonnet 5.5 under Lewis Moten's direction. Untested: nobody has built it yet.
"""

GND, V5 = "GND", "+5V"
parts = []


def add(ref, sym, value, fp, side, pins, **kw):
    parts.append(dict(ref=ref, sym=sym, value=value, fp=fp, side=side, pins=pins, **kw))


def R(n, val, a, b, desc=""):
    add(f"R{n}", "Device:R", val, "axial", "B", {"1": a, "2": b}, desc=desc)


def C(n, val, a, b, pol=False, desc=""):
    add(f"C{n}", "Device:C_Polarized" if pol else "Device:C", val,
        "elec" if pol else "ceramic", "B", {"1": a, "2": b}, desc=desc)


# ---- ICs -------------------------------------------------------------------------------------
add("U1", "MCU_Microchip_PIC16:PIC16F84A-XXP", "PIC16F84A-04/P", "dip18", "B", {
    "1": "CLK", "2": "LOAD", "3": "M_STD", "4": "MCLR", "5": GND, "6": "PULSE", "7": "OFFNORM",
    "8": "TONEA", "9": "TONEB", "10": "M_Q1", "11": "M_Q2", "12": "M_Q3", "13": "M_Q4",
    "14": V5, "15": None, "16": "CLK_PIC", "17": "TALK_H", "18": "DIN"},
    desc="8-bit microcontroller, 1K-word flash, 18-pin DIP")
add("U2", "Local:MT8870", "MT8870DE1", "dip18", "B", {
    "1": "M_VREF", "2": "M_INN", "3": "M_GS", "4": "M_VREF", "5": GND, "6": GND, "7": "M_OSC1",
    "8": "M_OSC2", "9": GND, "10": V5, "11": "M_Q1", "12": "M_Q2", "13": "M_Q3", "14": "M_Q4",
    "15": "M_STD", "16": "M_EST", "17": "M_STGT", "18": V5}, desc="DTMF tone decoder, 18-pin DIP")
add("U3", "Driver_LED:MAX7219", "MAX7219CNG+", "dip24", "B", {
    "1": "DIN", "2": "DIG0", "3": "DIG4", "4": GND, "5": "DIG6", "6": "DIG2", "7": "DIG3",
    "8": "DIG7", "9": GND, "10": "DIG5", "11": "DIG1", "12": "LOAD", "13": "CLK", "14": "SEG_A",
    "15": "SEG_F", "16": "SEG_B", "17": "SEG_G", "18": "ISET", "19": V5, "20": "SEG_C",
    "21": "SEG_E", "22": "SEG_DP", "23": "SEG_D", "24": None},
    desc="8-digit LED display driver, 24-pin 0.3in DIP")
add("U4", "Amplifier_Operational:LM2904", "LM358N", "dip8", "B", {
    "1": "MICAMP", "2": "MIC_INV", "3": "VMID", "5": "VMID", "6": "RXINV", "7": "RXAMP",
    "8": V5, "4": GND}, desc="Dual op-amp (mic preamp and IR receive amp), 8-pin DIP")
add("U5", "Amplifier_Audio:LM386", "LM386N-1", "dip8", "B", {
    "1": None, "2": GND, "3": "AIN", "4": GND, "5": "SPKO", "6": V5, "7": "LMBYP", "8": None},
    desc="Audio power amplifier, 8-pin DIP")
add("U6", "Regulator_Linear:L7805", "LM2940CT-5.0", "to220", "B",
    {"1": "VBAT", "2": GND, "3": V5}, desc="5 V low-dropout regulator, TO-220 (pin 1 in, 2 gnd, 3 out)")
add("Q1", "Transistor_BJT:Q_NPN_EBC", "2N3904", "to92", "B", {"E": "TXE", "B": "TXB", "C": "LEDC"},
    desc="NPN transistor, IR LED driver")
add("Q2", "Transistor_BJT:Q_NPN_EBC", "2N3904", "to92", "B", {"E": GND, "B": "Q2B", "C": "AIN"},
    desc="NPN transistor, mutes the receiver while TALK is held")
add("X1", "Device:Crystal", "3.579545 MHz", "xtal", "B", {"1": "M_OSC1", "2": "M_OSC2"},
    desc="Crystal 3.579545 MHz, HC-49 (the MT8870 clock, shared with the PIC)")
# ---- front-side parts (face the user) -------------------------------------------------------
add("D2", "Device:LED", "TSAL6200", "led", "F", {"1": "LEDC", "2": "LEDA"}, desc="IR LED 940 nm, 5 mm")
add("D1", "Device:D_Photo", "BPW34", "photo", "F", {"1": V5, "2": "PD"},
    desc="Silicon PIN photodiode (IR receiver)")
SEG = {"A": "SEG_A", "B": "SEG_B", "C": "SEG_C", "D": "SEG_D", "E": "SEG_E", "F": "SEG_F",
       "G": "SEG_G", "DP": "SEG_DP"}
MODPIN = ["E", "D", "DP", "C", "G", "D4", "B", "D3", "D2", "F", "A", "D1"]
for ref, digs in (("DS1", ["DIG7", "DIG6", "DIG5", "DIG4"]), ("DS2", ["DIG3", "DIG2", "DIG1", "DIG0"])):
    pins = {}
    for i, nm in enumerate(MODPIN, 1):
        pins[str(i)] = SEG[nm] if nm in SEG else digs[int(nm[1]) - 1]
    add(ref, "Local:DISPLAY_4DIGIT_CC", "4-digit CC 0.36in", "disp4", "F", pins,
        desc="4-digit 7-segment LED module, common cathode, red, 12 pins")
add("MK1", "Device:Microphone", "Electret 9.7mm", "mic", "F", {"1": "MICB", "2": GND},
    desc="Electret microphone capsule, solder pads")
add("LS1", "Device:Speaker", "8 ohm 28mm", "spk", "F", {"1": "SPKC", "2": GND},
    desc="Small 8 ohm speaker, 28 mm, solder tabs")
add("SW2", "Switch:SW_SPST", "PULSE", "usw", "F", {"1": "PULSE", "2": GND},
    desc="Subminiature lever microswitch (dial pulse cam)")
add("SW3", "Switch:SW_SPST", "OFF NORMAL", "usw", "F", {"1": "OFFNORM", "2": GND},
    desc="Subminiature lever microswitch (dial off-normal)")
add("SW4", "Switch:SW_Push", "TALK", "tact", "F", {"1": V5, "2": "TALK_H"}, desc="6 mm tactile switch")
add("SW5", "Switch:SW_Push", "CLEAR", "tact", "F", {"1": "MCLR", "2": GND}, desc="6 mm tactile switch")
# ---- battery ----------------------------------------------------------------------------------
add("BT1", "Device:Battery", "4xAAA", "batt", "B", {"1": "VBAT_RAW", "2": GND},
    desc="4 x AAA battery holder, PC pins")
add("SW1", "Switch:SW_SPDT", "POWER", "slide", "B", {"B": "VBAT_RAW", "A": "VBAT", "C": None},
    desc="Slide switch SPDT (one throw unused)")
# ---- passives ---------------------------------------------------------------------------------
R(1, "10k", V5, "MCLR", "MCLR pull-up")
R(2, "100k", "TALK_H", GND, "TALK line pull-down")
R(3, "2.2k", "TALK_H", "MICB", "mic bias (powered only while TALK is held)")
R(4, "1k", "MIC_AC1", "MIC_INV", "mic amp input")
R(5, "47k", "MICAMP", "MIC_INV", "mic amp feedback (gain 47)")
R(6, "10k", V5, "VMID", "half-supply divider")
R(7, "10k", "VMID", GND, "half-supply divider")
R(8, "6.8k", V5, "TXB", "IR LED bias")
R(9, "2.7k", "TXB", GND, "IR LED bias")
R(10, "56", "TXE", GND, "IR LED emitter resistor")
R(11, "100", V5, "LEDA", "IR LED series resistor")
R(12, "10k", "MIC_AC2", "TXB", "mic signal into the IR driver")
R(13, "10k", "TONEA", "TONE", "tone mixer A")
R(14, "10k", "TONEB", "TONE", "tone mixer B")
R(15, "47k", "TONE_AC", "TXB", "tones into the IR driver")
R(16, "470k", "TONE_AC", "AIN", "tones to the speaker")
R(17, "22k", "PD", GND, "photodiode load")
R(18, "4.7k", "PD_AC", "RXINV", "receive amp input")
R(19, "220k", "RXAMP", "RXINV", "receive amp feedback (gain 47)")
R(20, "47k", "RX_AC", "AIN", "receiver to speaker amp")
R(21, "47k", "AIN", GND, "speaker amp input load")
R(22, "10k", "TALK_H", "Q2B", "receiver mute base resistor")
R(23, "100k", "M_IN_AC", "M_INN", "MT8870 input resistor")
R(24, "100k", "M_GS", "M_INN", "MT8870 feedback (unity gain)")
R(25, "390k", "M_EST", "M_STGT", "MT8870 steering resistor")
R(26, "30k", "ISET", V5, "MAX7219 segment current (about 7 mA)")
R(27, "10", "SPKO", "ZOB", "speaker output Zobel network")
C(1, "0.47uF", "VBAT", GND, desc="regulator input")
C(2, "47uF 10V tant", V5, GND, pol=True, desc="regulator output (22 uF min, low ESR)")
C(3, "1uF", "MICB", "MIC_AC1", desc="mic coupling")
C(4, "10uF", "VMID", GND, pol=True, desc="half-supply filter")
C(5, "1uF", "MICAMP", "MIC_AC2", desc="mic amp to IR driver coupling")
C(6, "10nF", "TONE", GND, desc="tone low-pass")
C(7, "1uF", "TONE", "TONE_AC", desc="tone coupling")
C(8, "100nF", "PD", "PD_AC", desc="photodiode coupling")
C(9, "100pF", "RXAMP", "RXINV", desc="receive amp roll-off")
C(10, "1uF", "RXAMP", "RX_AC", desc="receive coupling")
C(11, "100nF", "RXAMP", "M_IN_AC", desc="MT8870 input coupling")
C(12, "100nF", "M_STGT", GND, desc="MT8870 steering capacitor")
C(13, "30pF", "M_OSC2", "CLK_PIC", desc="clock tap from MT8870 to PIC (datasheet Fig. 7 style)")
C(14, "10uF", V5, GND, pol=True, desc="MAX7219 supply")
C(15, "100nF", V5, GND, desc="decoupling MAX7219")
C(16, "100nF", V5, GND, desc="decoupling PIC")
C(17, "100nF", V5, GND, desc="decoupling MT8870")
C(18, "100nF", V5, GND, desc="decoupling LM358")
C(19, "100nF", V5, GND, desc="decoupling LM386")
C(20, "10uF", "LMBYP", GND, pol=True, desc="LM386 bypass")
C(21, "220uF 10V", "SPKO", "SPKC", pol=True, desc="speaker coupling")
C(22, "47nF", "ZOB", GND, desc="speaker output Zobel network")
