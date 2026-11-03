;==============================================================================
; THE PHONE OF THE FUTURE - PIC16F628A firmware (gpasm; ported from the PIC16F84A, same 18-pin pinout)
; Designed by Claude Sonnet 5.5 under Lewis Moten's direction. UNTESTED ON HARDWARE.
;
; Clock: 3.579545 MHz (the MT8870 crystal) -> 894886 instruction cycles per second.
; Pins:  RA0 TALK in (high = held)   RA1 DIN  RA2 CLK  RA3 LOAD  (MAX7219)
;        RA4 StD in (MT8870)         RB0 PULSE in (low = closed)  RB1 OFF-NORMAL in (low = closed)
;        RB2/RB3 tone outputs (square waves, summed by two 10k resistors)
;        RB4..RB7 = MT8870 Q1..Q4 in.  CLEAR is the MCLR reset button.
; The IR LED is only biased on while TALK is held or a digit is sent: RA0 is the TALK line, and
; the PIC drives it high for the length of a tone (R8 feeds the LED bias from it).
; DTMF tone pair = two square waves from 16-bit phase accumulators in a fixed
; 24-cycle loop (sample rate FS = 894886/24 = 37286 Hz): phase += inc, pin = top bit.
; Reference: DTMF row/column frequencies, ITU-T Q.23; MT8870D and MAX7219 datasheets.
;==============================================================================
; Port notes (16F84A -> 16F628A): the pins and the instruction set are the same. Differences handled here:
;  - CMCON = 7 turns the comparators off, or RA0..RA3 would not read as digital inputs;
;  - the general registers start at 0x20 (0x0C..0x1F are peripheral registers on the 628A);
;  - config: LVP off (RB3 is a tone output, not PGM), brown-out off, MCLR on, data-EEPROM code protect off.
        list    p=16f628a
        radix   dec
        errorlevel -302,-305
        #include <p16f628a.inc>
        __CONFIG _XT_OSC & _WDT_OFF & _PWRTE_ON & _MCLRE_ON & _BODEN_OFF & _LVP_OFF & _CP_OFF & _CPD_OFF

FS      equ     d'37286'                ; tone loop rate in Hz (894886 / 24 cycles)
PDEB    equ     d'12'                   ; pulse debounce, in main-loop polls (about 1 ms)
ODEB    equ     d'200'                  ; off-normal debounce, in polls (about 15 ms)
TONEHI  equ     d'15'                   ; tone length: 15*256 loops = 103 ms
INC697  equ     (((697*65536)+(FS/2))/FS)
INC770  equ     (((770*65536)+(FS/2))/FS)
INC852  equ     (((852*65536)+(FS/2))/FS)
INC941  equ     (((941*65536)+(FS/2))/FS)
INC1209 equ     (((1209*65536)+(FS/2))/FS)
INC1336 equ     (((1336*65536)+(FS/2))/FS)
INC1477 equ     (((1477*65536)+(FS/2))/FS)
INC1633 equ     (((1633*65536)+(FS/2))/FS)

#define TALK    PORTA,0
#define DIN     PORTA,1
#define CLK     PORTA,2
#define LOAD    PORTA,3
#define STD     PORTA,4
#define PULSE   PORTB,0
#define OFFN    PORTB,1

        cblock  0x20
        tmp, maddr, mdat, sh, bitn, i, val
        ndig, digit, pcount
        plev, pdeb, olev, odeb, tlast
        cntL, cntH, d1, d2
        phAL, phAH, phBL, phBH, incAL, incAH, incBL, incBH, rowi, coli
        endc
BUF     equ     0x40                    ; 8 digits typed so far (0..9), left to right

        org     0x000
        goto    start
        org     0x004
        goto    start                   ; no interrupts used

;---- start-up ----------------------------------------------------------------
start:
        bsf     STATUS,RP0
        movlw   b'00010001'             ; RA0, RA4 inputs; RA1..RA3 outputs
        movwf   TRISA
        movlw   b'11110011'             ; RB2, RB3 tone outputs; the rest inputs
        movwf   TRISB
        movlw   b'00001111'             ; RBPU = 0 (weak pull-ups on), prescaler to the watchdog
        movwf   OPTION_REG
        bcf     STATUS,RP0
        movlw   0x07
        movwf   CMCON                   ; comparators off: RA0..RA3 are plain digital pins
        movlw   0x03
        movwf   PCLATH                  ; the lookup tables live at 0x300
        clrf    PORTB
        clrf    PORTA
        bsf     LOAD
        clrf    ndig
        clrf    plev
        clrf    pdeb
        clrf    olev
        clrf    odeb
        clrf    pcount
        clrf    tlast
        movlw   d'60'
        call    delay                   ; let the MAX7219 and MT8870 power up
        call    max_init
        call    show
        call    rx_settle

;---- main loop: dial, receiver, display ------------------------------------------
main:
        call    poll_dial
        call    check_rx
        clrw
        btfsc   TALK
        movlw   1
        xorwf   tlast,w
        btfsc   STATUS,Z
        goto    main
        movlw   1
        xorwf   tlast,f                 ; TALK changed: refresh the display (decimal point)
        call    show
        goto    main

;---- pulse dial -------------------------------------------------------------------
; PULSE closes once per number on the way back; OFFN is closed while the dial is off rest.
poll_dial:
        clrw
        btfss   PULSE
        movlw   1                       ; w = 1 when the pulse switch is closed
        xorwf   plev,w
        btfsc   STATUS,Z
        goto    p_same
        incf    pdeb,f
        movlw   PDEB
        xorwf   pdeb,w
        btfss   STATUS,Z
        goto    p_done
        clrf    pdeb
        movlw   1
        xorwf   plev,f
        btfss   plev,0
        goto    p_done                  ; it just opened
        btfss   olev,0
        goto    p_done                  ; pulse while the dial is at rest: ignore
        incf    pcount,f
        goto    p_done
p_same: clrf    pdeb
p_done:
        clrw
        btfss   OFFN
        movlw   1
        xorwf   olev,w
        btfsc   STATUS,Z
        goto    o_same
        incf    odeb,f
        movlw   ODEB
        xorwf   odeb,w
        btfss   STATUS,Z
        return
        clrf    odeb
        movlw   1
        xorwf   olev,f
        btfsc   olev,0
        goto    o_start
        goto    dial_done               ; back at rest: the digit is complete
o_start:
        clrf    pcount                  ; dial pulled off rest: start counting
        return
o_same: clrf    odeb
        return

dial_done:
        movf    pcount,f
        btfsc   STATUS,Z
        return                          ; no pulses
        movf    pcount,w
        movwf   digit
        sublw   d'10'
        btfss   STATUS,C
        return                          ; more than 10 pulses: not a digit
        movlw   d'10'
        xorwf   digit,w
        btfsc   STATUS,Z
        clrf    digit                   ; 10 pulses = 0
        clrf    pcount
        movf    digit,w
        call    send_tone
        movf    digit,w
        call    add_digit
        goto    rx_settle               ; ignore our own tone coming back

;---- receiver: MT8870 digit -------------------------------------------------------
check_rx:
        btfsc   TALK
        return                          ; transmitting: the receiver is muted
        btfss   STD
        return
        swapf   PORTB,w                 ; Q1..Q4 are RB4..RB7
        andlw   0x0F
        movwf   digit
        clrf    cntL
        clrf    cntH
wl:     btfss   STD
        goto    got
        decfsz  cntL,f
        goto    wl
        decfsz  cntH,f
        goto    wl
got:    movf    digit,f
        btfsc   STATUS,Z
        return                          ; code 0 is "D"
        movf    digit,w
        sublw   d'10'
        btfss   STATUS,C
        return                          ; * # A B C: not shown
        movlw   d'10'
        xorwf   digit,w
        btfsc   STATUS,Z
        clrf    digit                   ; code 10 is the digit 0
        movf    digit,w
        goto    add_digit

rx_settle:
        movlw   d'175'
        call    delay                   ; about 150 ms
        clrf    cntL
        clrf    cntH
rs:     btfss   STD
        return
        decfsz  cntL,f
        goto    rs
        decfsz  cntH,f
        goto    rs
        return

;---- digit buffer and display -----------------------------------------------------
add_digit:                              ; w = 0..9
        movwf   val
        movlw   d'8'
        subwf   ndig,w
        btfsc   STATUS,C
        return                          ; display full
        movlw   BUF
        addwf   ndig,w
        movwf   FSR
        movf    val,w
        movwf   INDF
        incf    ndig,f
        goto    show

show:                                   ; leftmost digit is MAX7219 register 8
        clrf    i
sh_l:   movf    i,w
        subwf   ndig,w                  ; ndig - i
        btfsc   STATUS,Z
        goto    sh_blank
        btfss   STATUS,C
        goto    sh_blank
        movlw   BUF
        addwf   i,w
        movwf   FSR
        movf    INDF,w
        goto    sh_put
sh_blank:
        movlw   0x0F                    ; BCD "blank"
        movf    ndig,f
        btfss   STATUS,Z
        goto    sh_put
        movf    i,f
        btfss   STATUS,Z
        goto    sh_put
        movlw   0x0A                    ; empty: a dash at the left
sh_put: movwf   mdat
        movf    i,f
        btfss   STATUS,Z
        goto    sh_wr
        btfsc   TALK
        bsf     mdat,7                  ; TALK held: decimal point on the left digit
sh_wr:  movf    i,w
        sublw   d'8'
        movwf   maddr
        call    max_write
        incf    i,f
        movlw   d'8'
        xorwf   i,w
        btfss   STATUS,Z
        goto    sh_l
        return

;---- MAX7219 (bit-banged, 16 bits, MSB first) ---------------------------------------
max_init:
        movlw   0x0C
        movwf   maddr
        movlw   0x01                    ; normal operation
        movwf   mdat
        call    max_write
        movlw   0x09
        movwf   maddr
        movlw   0xFF                    ; BCD decode on every digit
        movwf   mdat
        call    max_write
        movlw   0x0B
        movwf   maddr
        movlw   0x07                    ; scan all 8 digits
        movwf   mdat
        call    max_write
        movlw   0x0A
        movwf   maddr
        movlw   0x05                    ; medium brightness
        movwf   mdat
        call    max_write
        movlw   0x0F
        movwf   maddr
        clrf    mdat                    ; display test off
        goto    max_write

max_write:
        bcf     LOAD
        movf    maddr,w
        movwf   sh
        call    shift8
        movf    mdat,w
        movwf   sh
        call    shift8
        bsf     LOAD
        return

shift8: movlw   d'8'
        movwf   bitn
sloop:  bcf     DIN
        btfsc   sh,7
        bsf     DIN
        bsf     CLK
        bcf     CLK
        rlf     sh,f
        decfsz  bitn,f
        goto    sloop
        return

;---- delay: w * about 0.86 ms ---------------------------------------------------------
delay:  movwf   d1
dl1:    clrf    d2
dl2:    decfsz  d2,f
        goto    dl2                     ; 256 * 3 cycles
        decfsz  d1,f
        goto    dl1
        return

;---- DTMF: send digit w (0..9) for 103 ms, then 60 ms of silence --------------------------
send_tone:
        call    rc_tab                  ; row*4 + column
        movwf   tmp
        andlw   0x03
        movwf   coli                    ; column = low two bits
        bcf     STATUS,C
        rrf     tmp,f
        bcf     STATUS,C
        rrf     tmp,w
        andlw   0x03
        movwf   rowi                    ; row = bits 3..2
        movf    rowi,w
        call    row_lo
        movwf   incAL
        movf    rowi,w
        call    row_hi
        movwf   incAH
        movf    coli,w
        call    col_lo
        movwf   incBL
        movf    coli,w
        call    col_hi
        movwf   incBH
        clrf    phAL
        clrf    phAH
        clrf    phBL
        clrf    phBH
        clrf    cntL
        movlw   TONEHI
        movwf   cntH
        bsf     STATUS,RP0              ; drive RA0 (the TALK line) high: it powers the IR LED's
        bcf     TRISA,0                 ; bias and mutes the receiver, only while a digit is sent
        bcf     STATUS,RP0
        bsf     PORTA,0
        movlw   d'12'
        call    delay                   ; about 10 ms for the bias to settle
tone:   movf    incAL,w                 ; 6 cycles
        addwf   phAL,f
        btfsc   STATUS,C
        incf    phAH,f
        movf    incAH,w
        addwf   phAH,f
        movf    incBL,w                 ; 6 cycles
        addwf   phBL,f
        btfsc   STATUS,C
        incf    phBH,f
        movf    incBH,w
        addwf   phBH,f
        clrf    tmp                     ; 9 cycles: top bits of both phases to RB2, RB3
        rlf     phAH,w
        rlf     tmp,f
        rlf     phBH,w
        rlf     tmp,f
        bcf     STATUS,C
        rlf     tmp,f
        rlf     tmp,w
        movwf   PORTB
        decfsz  cntL,f                  ; 3 cycles
        goto    tone
        decfsz  cntH,f
        goto    tone
        clrf    PORTB
        bcf     PORTA,0
        bsf     STATUS,RP0              ; release RA0 back to an input (TALK button)
        bsf     TRISA,0
        bcf     STATUS,RP0
        movlw   d'70'
        goto    delay

;---- tables (org 0x300 so PCLATH = 3 reaches them) -------------------------------------------
        org     0x300
rc_tab: addwf   PCL,f                   ; digit -> row*4 + column
        retlw   d'13'                   ; 0: row 3, column 1
        retlw   d'0'                    ; 1
        retlw   d'1'                    ; 2
        retlw   d'2'                    ; 3
        retlw   d'4'                    ; 4
        retlw   d'5'                    ; 5
        retlw   d'6'                    ; 6
        retlw   d'8'                    ; 7
        retlw   d'9'                    ; 8
        retlw   d'10'                   ; 9
row_lo: addwf   PCL,f
        retlw   INC697 & 0xFF
        retlw   INC770 & 0xFF
        retlw   INC852 & 0xFF
        retlw   INC941 & 0xFF
row_hi: addwf   PCL,f
        retlw   INC697 >> 8
        retlw   INC770 >> 8
        retlw   INC852 >> 8
        retlw   INC941 >> 8
col_lo: addwf   PCL,f
        retlw   INC1209 & 0xFF
        retlw   INC1336 & 0xFF
        retlw   INC1477 & 0xFF
        retlw   INC1633 & 0xFF
col_hi: addwf   PCL,f
        retlw   INC1209 >> 8
        retlw   INC1336 >> 8
        retlw   INC1477 >> 8
        retlw   INC1633 >> 8
        end
