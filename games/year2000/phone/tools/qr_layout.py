"""Standard phone board QR payloads and their full silkscreen bounds in millimeters."""
from silkart import qr_matrix

PARTS_URL = "https://github.com/lewismoten/GameMaker-SandboxEdition/tree/develop/games/year2000/phone"
SITE_URL = "https://lewismoten.github.io/GameMaker-SandboxEdition/"

QR_PARTS = (27.5, 44.0, 0.44)
QR_SITE = (65.0, 47.0, 0.5)


def bounds(qr, url):
    x, y, module = qr
    size = len(qr_matrix(url)) * module
    return x, y, x + size, y + size


QR_KEEP = {PARTS_URL: bounds(QR_PARTS, PARTS_URL), SITE_URL: bounds(QR_SITE, SITE_URL)}
