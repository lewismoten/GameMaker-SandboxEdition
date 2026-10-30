# Notices

This package contains portable archive and game-import code from Game-Maker: Sandbox Edition by Lewis Moten, under the MIT License. See LICENSE for the original copyright and license terms.

The ZIP implementation was written for this project from PKWARE's ZIP file format (APPNOTE). Compression and decompression use the platform's CompressionStream and DecompressionStream; no third-party ZIP library is bundled. The ZIP reader handles stored and deflated files and ZIP-based self-extracting archives. It never executes DOS programs.

Game discovery and player-file recovery follow RSD Game-Maker 3.0 by Recreational Software Designs: G. Andrew Stone, G. Oliver Stone, Oliver Stone Jr. and Joan Stone. Andy Stone released its source under the MIT License in 2014. No original DOS executable or game content is included.

Player identification uses this project's MD5 implementation, written from RFC 1321 (R. Rivest, MIT Laboratory for Computer Science and RSA Data Security, Inc., 1992). It does not include the RFC's reference implementation. The implementation is covered by the project's MIT License.

The underlying ZIP and import code was written with Anthropic Claude Opus 5.5 under Lewis Moten's direction. OpenAI Codex (GPT-6/6.1) consolidated the portable package, API, tests, documentation, and consumer integration under his direction.
