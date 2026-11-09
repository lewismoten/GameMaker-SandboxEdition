### Fixed

- Reading a zip with no limits given now uses safe defaults (8,192 entries, 256 MB unpacked), and zips inside zips in an import share one byte budget, so a small zip can no longer unpack to gigabytes.
