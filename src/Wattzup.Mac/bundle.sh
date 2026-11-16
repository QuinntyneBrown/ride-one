#!/bin/sh
# Builds artifacts/Wattzup.app: Wattzup.Api published self-contained, with the dashboard in wwwroot,
# the Info.plist that declares Bluetooth use, and an ad-hoc signature (ADR 0008).
# Usage: src/Wattzup.Mac/bundle.sh [osx-arm64|osx-x64]
set -eu
here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
rid=${1:-osx-arm64}
app="$root/artifacts/Wattzup.app"

if [ ! -f "$root/src/Wattzup.Api/wwwroot/index.html" ]; then
  echo "Building the dashboard into src/Wattzup.Api/wwwroot" >&2
  (cd "$root/wattzup-web" && npm ci && npm run build:api)
fi

rm -rf "$app"
dotnet publish "$root/src/Wattzup.Api/Wattzup.Api.csproj" -c Release -r "$rid" --self-contained true -o "$app/Contents/MacOS"
cp "$here/Info.plist" "$app/Contents/Info.plist"
codesign --force --deep --sign - "$app"
echo "Built $app" >&2
