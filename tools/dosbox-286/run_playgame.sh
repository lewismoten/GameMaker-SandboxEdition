#!/usr/bin/env bash
# Headless PLAYGAME audio capture; Python owns validation and child cleanup.
set -euo pipefail
exec python3 "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/capture.py" "$@"
