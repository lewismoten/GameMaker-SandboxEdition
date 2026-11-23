### Fixed

- Reading a large ZIP entry checks its CRC-32 in slices that let the page breathe, and the CRC-32 itself runs faster.
