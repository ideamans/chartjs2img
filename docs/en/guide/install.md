---
title: Install
description: Install chartjs2img via the one-liner script, GitHub Releases, Docker, or from source. Includes Chromium detection notes and Linux ARM64 caveats.
---

# Install

The fastest way to install `chartjs2img` is the one-liner shown in the
[Quick start](./) — a curl-pipes-bash script that downloads the right
binary for your platform and drops it on your `PATH`. This page covers
every other option: the install landing page, GitHub Releases,
Docker, and building from source.

## The install landing page

The install scripts are served from a dedicated page:

**<https://bin.ideamans.com/oss/chartjs2img>**

::: tip
The landing page itself is in Japanese, but the install commands are
universal and work as-is on any locale.
:::

It publishes the latest versioned script for each platform:

| Platform             | Command                                                              |
|----------------------|----------------------------------------------------------------------|
| macOS / Linux        | `curl -fsSL https://bin.ideamans.com/install/chartjs2img.sh \| bash` |
| Windows (PowerShell) | `irm https://bin.ideamans.com/install/chartjs2img.ps1 \| iex`        |

Default install locations:

- **Linux / macOS** — a system-wide directory (usually `/usr/local/bin`).
  Override per-user with `--install-dir $HOME/bin`:
  ```sh
  curl -fsSL https://bin.ideamans.com/install/chartjs2img.sh | bash -s -- --install-dir "$HOME/bin"
  ```
- **Windows (admin)** — `C:\Program Files\chartjs2img\chartjs2img.exe`
- **Windows (standard user)** — `%USERPROFILE%\bin\chartjs2img.exe`

If you installed to a custom directory, make sure it's on your `PATH`.

## GitHub Releases (manual download)

Every tagged release publishes prebuilt archives. Download, extract,
and move the binary yourself.

**<https://github.com/ideamans/chartjs2img/releases/latest>**

| Platform              | Asset                                        |
|-----------------------|----------------------------------------------|
| Linux x64             | `chartjs2img_<version>_linux_amd64.tar.gz`   |
| Linux ARM64           | `chartjs2img_<version>_linux_arm64.tar.gz`   |
| macOS (Intel)         | `chartjs2img_<version>_darwin_amd64.tar.gz`  |
| macOS (Apple Silicon) | `chartjs2img_<version>_darwin_arm64.tar.gz`  |
| Windows x64           | `chartjs2img_<version>_windows_amd64.zip`    |

### Linux / macOS

```sh
VERSION=0.2.2
OS=linux       # or darwin
ARCH=amd64     # or arm64

curl -fsSL -o chartjs2img.tar.gz \
  "https://github.com/ideamans/chartjs2img/releases/download/v${VERSION}/chartjs2img_${VERSION}_${OS}_${ARCH}.tar.gz"

tar -xzf chartjs2img.tar.gz
sudo mv chartjs2img /usr/local/bin/
```

### Windows (PowerShell)

```powershell
$Version = "0.2.2"
$Url = "https://github.com/ideamans/chartjs2img/releases/download/v$Version/chartjs2img_${Version}_windows_amd64.zip"

Invoke-WebRequest $Url -OutFile chartjs2img.zip
Expand-Archive chartjs2img.zip -DestinationPath .
# move chartjs2img.exe somewhere on your PATH, e.g. %USERPROFILE%\bin
```

## Docker (HTTP server only)

If you want to run chartjs2img as a long-running HTTP service, pull or
build the Docker image — it ships with Chromium and Noto Sans CJK
fonts baked in so there's no first-run download and Japanese / Chinese
/ Korean labels render correctly.

See [HTTP server → Docker](./http/docker) for build, run, and
docker-compose recipes.

## Build from source

chartjs2img is built with [Bun](https://bun.sh). Install Bun, then:

```sh
git clone https://github.com/ideamans/chartjs2img
cd chartjs2img
bun install
bun run build        # produces ./chartjs2img in the repo root
```

Or run without compiling — handy for hacking on the CLI itself:

```sh
bun run src/index.ts render -i chart.json -o chart.png
```

## Chromium / Chrome detection

On first render, chartjs2img searches for a browser in this order:

1. **`CHROMIUM_PATH`** environment variable — explicit override wins.
2. **Puppeteer browser cache** — `~/.cache/puppeteer/`, etc.
3. **System-installed Chrome/Chromium** — `/Applications/Google Chrome.app`,
   `/usr/bin/google-chrome`, etc.
4. **Auto-download** — [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/)
   is pulled into the user cache dir (no sudo required).

Auto-download is available for **macOS (x64/arm64)**, **Windows (x64)**,
and **Linux (x64)**.

### Linux ARM64 (manual Chromium required)

Chrome for Testing does **not** publish linux-arm64 builds. Install
Chromium yourself and point `CHROMIUM_PATH` at it:

```sh
# Debian / Ubuntu
sudo apt install chromium-browser   # or `chromium`

export CHROMIUM_PATH=/usr/bin/chromium-browser
chartjs2img render -i chart.json -o chart.png
```

You can also set it in the systemd unit / Docker run environment to
persist it.

## Upgrade

Re-run the one-liner from the [Quick start](./), or pull the latest
asset from Releases. The script is idempotent — it replaces the
existing binary in place.

## Uninstall

Delete the binary from wherever it was installed
(`/usr/local/bin/chartjs2img`, `$HOME/bin/chartjs2img`, or the Windows
install directory). That's the only file the installer writes. At
runtime `chartjs2img` may also cache a downloaded Chromium under
`~/Library/Caches/ms-playwright/` (macOS), `~/.cache/ms-playwright/`
(Linux), or `%LOCALAPPDATA%\ms-playwright\` (Windows); delete that
directory to reclaim the ~250 MB.
