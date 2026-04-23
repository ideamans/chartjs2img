---
name: chartjs2img-install
description: Install or update the chartjs2img CLI from the latest GitHub release. Use when the user asks to install chartjs2img, set up the binary, update / upgrade to the newest version, or when another chartjs2img skill reports that the `chartjs2img` command is missing from PATH. Detects OS + arch, picks the right release archive, tries a writable directory on PATH (~/.local/bin, /usr/local/bin, etc.), and falls back to dropping the binary in /tmp with a sudo hint if nothing is writable.
license: MIT
compatibility: Requires curl (or wget), tar (linux/macos) or unzip (windows), and network access to github.com / api.github.com. Standalone — does NOT need `chartjs2img` to already be installed. Chromium is auto-downloaded by chartjs2img itself on first render (except on linux-arm64; see notes).
allowed-tools: Bash(curl:*) Bash(wget:*) Bash(tar:*) Bash(unzip:*) Bash(which:*) Bash(command:*) Bash(uname:*) Bash(mkdir:*) Bash(mv:*) Bash(cp:*) Bash(rm:*) Bash(chmod:*) Bash(ls:*) Bash(echo:*) Bash(test:*) Bash(sh:*) Bash(bash:*) Read Write
---

# chartjs2img-install

Install or update the `chartjs2img` CLI from the GitHub Releases of
`ideamans/chartjs2img`, cross-platform.

This skill is **one of several ways** to install chartjs2img. If the
user already prefers their own install method (Homebrew, a system
package manager, `bun install -g chartjs2img` once published, or
building from source via `bun run build`), confirm they want to use
this skill before proceeding. Any install that puts `chartjs2img` on
`$PATH` works equally well; the other chartjs2img skills don't care
how the binary got there.

## Workflow

### 1. Detect platform

```bash
uname -s       # Linux / Darwin / MINGW* / MSYS* → windows
uname -m       # x86_64 / arm64 / aarch64
```

Normalize to the release-asset naming (note: release uses underscore form `linux_amd64`, not `linux-amd64`):

| `uname -s`                     | `os`      |
| ------------------------------ | --------- |
| `Linux`                        | `linux`   |
| `Darwin`                       | `darwin`  |
| `MINGW*` / `MSYS*` / `CYGWIN*` | `windows` |

| `uname -m`                     | `arch`    |
| ------------------------------ | --------- |
| `x86_64` / `amd64`             | `amd64`   |
| `aarch64` / `arm64`            | `arm64`   |

Release assets follow `chartjs2img_<version>_<os>_<arch>.<ext>` where
`<ext>` is `zip` for windows and `tar.gz` for everything else.

Supported combinations: `linux_amd64`, `linux_arm64`, `darwin_amd64`,
`darwin_arm64`, `windows_amd64`. Windows ARM64 is not currently built —
tell the user and stop (they can build from source with `bun run
build` on a native Windows ARM64 machine if they need it).

### 2. Look up the latest release

Use the GitHub API; no auth needed for public repos:

```bash
curl -fsSL https://api.github.com/repos/ideamans/chartjs2img/releases/latest \
  | grep -o '"tag_name": *"[^"]*"' | head -1 | sed 's/.*"\(v[0-9.]*\)"/\1/'
```

Call the result `TAG` (e.g. `v0.2.2`). Version without the `v` is `VER`.

Asset URL:

```
https://github.com/ideamans/chartjs2img/releases/download/<TAG>/chartjs2img_<VER>_<os>_<arch>.<ext>
```

### 3. Check if chartjs2img is already installed

```bash
if command -v chartjs2img >/dev/null 2>&1; then
  INSTALLED_PATH="$(command -v chartjs2img)"
  INSTALLED_VERSION="$(chartjs2img --version 2>&1 | grep -oE 'v[0-9.]+' || echo 'unknown')"
else
  INSTALLED_PATH=""
fi
```

- **If `INSTALLED_PATH` is non-empty**: this is an **update**. Target directory is the parent of `INSTALLED_PATH`.
- **Already at the latest version**: tell the user and stop.

### 4. Pick a writable install directory (fresh install only)

Candidate list in order of preference:

| Path                               | Rationale                                  |
| ---------------------------------- | ------------------------------------------ |
| `$HOME/.local/bin`                 | User-local, no sudo. XDG base dir default. |
| `$HOME/bin`                        | Older convention, still common.            |
| `/usr/local/bin`                   | Classic system-wide. Writable on most macOS + Homebrew setups. |
| `/opt/homebrew/bin`                | Apple Silicon Homebrew.                    |

For each candidate, verify it's on `$PATH` and writable:

```bash
for d in "$HOME/.local/bin" "$HOME/bin" "/usr/local/bin" "/opt/homebrew/bin"; do
  case ":$PATH:" in *":$d:"*) :;; *) continue;; esac
  if [ -d "$d" ] && [ -w "$d" ]; then
    echo "ok: $d"
  elif [ ! -d "$d" ] && mkdir -p "$d" 2>/dev/null; then
    echo "ok: $d (created)"
  fi
done
```

- Match found → ask the user which to install into (default `~/.local/bin`).
- No match → sudo fallback (step 6).

### 5. Download and install

```bash
ASSET="chartjs2img_${VER}_${OS}_${ARCH}.${EXT}"
URL="https://github.com/ideamans/chartjs2img/releases/download/${TAG}/${ASSET}"
TMP=$(mktemp -d)
curl -fsSL -o "$TMP/$ASSET" "$URL"

# Also fetch + verify the checksum
curl -fsSL -o "$TMP/$ASSET.sha256" "$URL.sha256"
( cd "$TMP" && sha256sum -c "$ASSET.sha256" )

if [ "$EXT" = "zip" ]; then
  unzip -q "$TMP/$ASSET" -d "$TMP"
  BIN="$TMP/chartjs2img.exe"
else
  tar -xzf "$TMP/$ASSET" -C "$TMP"
  BIN="$TMP/chartjs2img"
fi

chmod +x "$BIN"
mv "$BIN" "$TARGET_DIR/"
rm -rf "$TMP"
```

Verify:

```bash
"$TARGET_DIR/chartjs2img" --version
```

Should print `chartjs2img v<VER>`. If it fails, fall back to step 6.

### 6. Sudo fallback

When no writable PATH directory exists (or step 5's move returned EACCES):

```bash
FALLBACK="/tmp/chartjs2img"
cp "$BIN" "$FALLBACK"
chmod +x "$FALLBACK"
echo "chartjs2img is ready at $FALLBACK."
echo "Install it system-wide with:"
echo "  sudo mv $FALLBACK /usr/local/bin/chartjs2img"
```

Do **not** run `sudo` from the skill — that needs a terminal.

## Chromium note

chartjs2img auto-downloads Chrome for Testing on first render for
macOS/Windows/Linux-x64 (~250 MB into the user cache). **linux-arm64
is not covered by Chrome for Testing** — on that platform tell the
user to `apt install chromium-browser` (or equivalent) and set
`CHROMIUM_PATH`:

```bash
export CHROMIUM_PATH=/usr/bin/chromium-browser
```

The install skill itself doesn't fetch Chromium. chartjs2img handles that
on its own the first time a render is requested; the install skill just
warns the linux-arm64 user upfront.

## Reporting back to the user

Always finish with a summary line:

- `chartjs2img installed at ~/.local/bin/chartjs2img (v0.2.2 → new)`
- `chartjs2img updated at /usr/local/bin/chartjs2img (v0.2.0 → v0.2.2)`
- `chartjs2img already at the latest version (v0.2.2) at …`
- `chartjs2img staged at /tmp/chartjs2img — run 'sudo mv /tmp/chartjs2img /usr/local/bin/' to finish`

## Edge cases

- **No `curl`**: try `wget` next. Neither available → stop and report clearly.
- **Network / rate limit**: propagate the HTTP status. For GitHub API rate limits, suggest retrying or setting `GITHUB_TOKEN`.
- **Arch mismatch** (x86_64 userland under Rosetta on Apple Silicon): trust `uname -m`; if the resulting binary fails `--version` with "cannot execute binary file", retry with the other `arch`.
- **Existing `chartjs2img` installed by npm global / bun link**: still update in place at `command -v chartjs2img`. Don't try to uninstall the previous method.
- **Behind a corporate proxy**: the user will need to set `HTTPS_PROXY` / `HTTP_PROXY` before `curl`. Flag this if the initial download fails with a connection error.

## After a successful install

- If `~/.local/bin` was just created, suggest `exec $SHELL` or a new terminal so PATH picks it up.
- Suggest smoke tests:
  ```bash
  chartjs2img --version
  chartjs2img llm | head -10
  echo '{"type":"bar","data":{"labels":["A"],"datasets":[{"data":[1]}]}}' \
    | chartjs2img render -o /tmp/smoke.png
  ```
  The render step also triggers Chromium auto-download on first run.
