# PlatformIO pre-build script: bakes the firmware's id into the build (-DFW_GIT, -DFW_DATE, -DFW_ENV), so every screen and
# the serial "FW" command can say which build a board runs. The git hash gets a "+" when the tree has uncommitted changes.
# POCKET_FW_ID (or POCKET_BUILD_ID) supplies a label without invoking git (for restricted or source-only builds).
import subprocess, datetime, os
Import("env")
def sh(*a):
    try:
        return subprocess.check_output(a, cwd=env.subst("$PROJECT_DIR"), stderr=subprocess.DEVNULL).decode().strip()
    except Exception:
        return ""
h = os.environ.get("POCKET_FW_ID") or os.environ.get("POCKET_BUILD_ID")
if not h:
    h = sh("git", "rev-parse", "--short=7", "HEAD") or "nogit"
    if sh("git", "status", "--porcelain", "--", ".") and h != "nogit":
        h += "+"
d = datetime.date.today().isoformat()
env.Append(CPPDEFINES=[("FW_GIT", env.StringifyMacro(h)), ("FW_DATE", env.StringifyMacro(d)), ("FW_ENV", env.StringifyMacro(env.subst("$PIOENV")))])
