// THIRD-PARTY-NOTICES.txt: the copyright and license notices that must travel with the
// Windows, Mac and Linux downloads' player programs (NOTICE.md, "The Mac, Windows and
// Linux players", lists the parts). winApp.ts puts the Windows text into the .exe (RCDATA
// "NOTICES", shown from the window menu's "Third-party notices…") and beside it in the
// .zip; macApp.ts puts the Mac text on the .dmg and in the .zip; linuxApp.ts puts the Linux
// text in the folder.

export type NoticePlatform = 'windows' | 'mac' | 'linux';

const MIT = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

const PROJECT = `Game-Maker: Sandbox Edition (the player program and the game's player page)
https://github.com/lewismoten/GameMaker-SandboxEdition
MIT License

Copyright (c) 2014 gandrewstone
Copyright (c) 2026 Lewis Moten

${MIT}`;

const WEBVIEW2 = `Microsoft Edge WebView2 SDK: the interface definitions the player uses
(win/Player/webview2.h is generated from the SDK's WebView2.h; no SDK file and no
WebView2Loader.dll is included; the WebView2 Runtime itself is part of Windows)

Copyright (C) Microsoft Corporation. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:
   * Redistributions of source code must retain the above copyright notice, this list of
     conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above copyright notice, this list
     of conditions and the following disclaimer in the documentation and/or other
     materials provided with the distribution.
   * The name of Microsoft Corporation, or the names of its contributors may not be used
     to endorse or promote products derived from this software without specific prior
     written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;

const WEBVIEW = `webview (https://github.com/webview/webview): how the player finds the WebView2
Runtime without WebView2Loader.dll follows this library's approach

Copyright (c) 2017 Serge Zaitsev
Copyright (c) 2022 Steffen André Langnes

${MIT}`;

const MINGW = `MinGW-w64 runtime: a little of its program startup code is linked into the player

This program was built using MinGW-w64 and statically linked against the MinGW-w64
runtime. Some parts of the runtime are under licenses which require that the
copyright and license notices are included when distributing the code in binary
form. The notice for the runtime's startup code follows. (The runtime's other
notices, for getopt, gdtoa, parts of the math library, some string functions and
headers from Wine, cover code this program does not use; all of them are in
https://github.com/mingw-w64/mingw-w64/blob/master/COPYING.MinGW-w64-runtime/COPYING.MinGW-w64-runtime.txt)

Copyright (c) 2009, 2010, 2011, 2012, 2013 by the mingw-w64 project

This license has been certified as open source. It has also been designated
as GPL compatible by the Free Software Foundation (FSF).

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

   1. Redistributions in source code must retain the accompanying copyright
      notice, this list of conditions, and the following disclaimer.
   2. Redistributions in binary form must reproduce the accompanying
      copyright notice, this list of conditions, and the following disclaimer
      in the documentation and/or other materials provided with the
      distribution.
   3. Names of the copyright holders must not be used to endorse or promote
      products derived from this software without prior written permission
      from the copyright holders.
   4. The right to distribute this software or to use it for any purpose does
      not give you the right to use Servicemarks (sm) or Trademarks (tm) of
      the copyright holders.  Use of them is covered by separate agreement
      with the copyright holders.
   5. If any files are modified, you must cause the modified files to carry
      prominent notices stating that you changed the files and the date of
      any change.

Disclaimer

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS \`\`AS IS'' AND ANY EXPRESSED
OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
EVENT SHALL THE COPYRIGHT HOLDERS BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;

const ZIG = `Zig (https://ziglang.org): the compiler's runtime support routines (compiler_rt)

Copyright (c) Zig contributors

${MIT}`;

const GLIBC = `The GNU C Library: its small program startup files are linked into the player.
They are under the GNU Lesser General Public License 2.1 or later, with the
exception that allows them to be linked into any program without restriction.
GTK 3, GLib and WebKitGTK (GNU LGPL 2.1 or later) are not included: the player
loads the copies installed on your computer.`;

const APPLE = `The player uses AppKit and WebKit, Apple's frameworks that are part of macOS;
none of their code is included.`;

const RULE = '\n\n' + '-'.repeat(78) + '\n\n';

/** The notices for one platform's download. */
export function thirdPartyNotices(platform: NoticePlatform): string {
  const parts = platform === 'windows' ? [PROJECT, WEBVIEW2, WEBVIEW, MINGW, ZIG] : platform === 'linux' ? [PROJECT, ZIG, GLIBC] : [PROJECT, APPLE];
  const text = `THIRD-PARTY NOTICES\n\nThe game's player program and the notices of the code from others it contains.${RULE}${parts.join(RULE)}\n`;
  // Windows: CRLF, and a byte order mark so every Notepad reads it as UTF-8
  return platform === 'windows' ? `\uFEFF${text.replace(/\n/g, '\r\n')}` : text;
}
