### Fixed

- A tiny crafted GIF, VOC or game file can no longer make the readers allocate gigabytes: oversized pictures and sounds, and game files too short for their scenes, are refused with a clear message, and writing a game whose file-name pool passes DOS's 10,000-byte limit now stops instead of writing a shifted file.
