# Starters live on the Sample CD only

**Decided:** 2026-11-04 (commits `ce848b05d` and `c2e89f097`).

**What:** The Starters (games whose `about.json` has `"series": "starter"`) are tutorials. On
the 1994 desk they exist only on the Sample CD (`D:\SAMPLES`); the first three are also on the
Sample Disk. They get no retail box on the shelf, no printed manual, no Level Maps and no
goodies, and they are not on `downloads.html` or the Windows, Mac and Linux release lists. On
the site they stay playable, with Edit a copy, the How do I questions and the "How this level
is made" pages. Per-level instructions go in the project's sidecar.

**Why:** They are lessons, not products. A box, manual and keepsakes belong to the games meant
to be collected. (The commits give the scope, not a longer argument.)

**Where it is written down:** the two commits above; `web/src/retro/dos/sampleDisk.ts` (how
many fit the diskette, and that every Starter is on the CD); `web/src/seo/seoPages.test.ts` (downloads
lists the original games and no Starter).
