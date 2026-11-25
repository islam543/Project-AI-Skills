# Sourced by install.sh and uninstall.sh. Sets PY to a Python 3.8+ that actually runs.
# Tries python3, python, then the Windows "py" launcher. On Windows, python3 is often a
# Microsoft Store placeholder that does nothing, so each candidate is run, not just found.
PY=""
for c in python3 python py; do
  if command -v "$c" >/dev/null 2>&1 &&
     "$c" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)' >/dev/null 2>&1; then
    PY="$(command -v "$c")"
    break
  fi
done
if [ -z "$PY" ]; then
  echo "Python 3.8 or newer not found (tried python3, python, py). Install Python, then run this again." >&2
  exit 1
fi
