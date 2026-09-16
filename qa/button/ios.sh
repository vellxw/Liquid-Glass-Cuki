#!/usr/bin/env bash
set -euo pipefail
ROOT="$PWD"
OUT="$ROOT/qa/button/output"
mkdir -p "$OUT"
# Use an installed non-preview Xcode 26 and an available iOS 26 iPhone simulator.
XCODE=$(find /Applications -maxdepth 1 -name 'Xcode_26*.app' | sort -V | tail -1)
if [ -n "$XCODE" ]; then sudo xcode-select -s "$XCODE/Contents/Developer"; fi
xcodebuild -version | tee "$OUT/xcode.txt"
xcrun simctl list devices available -j > "$OUT/devices.json"
UDID=$(python3 - <<'PY'
import json
x=json.load(open('qa/button/output/devices.json'))
for runtime,devices in sorted(x['devices'].items(), reverse=True):
 if 'iOS-26' not in runtime:continue
 for d in devices:
  if d['name'].startswith('iPhone'):
   print(d['udid']);raise SystemExit
raise SystemExit('No installed iOS26 iPhone simulator')
PY
)
echo "$UDID" > "$OUT/simulator.txt"
xcrun simctl boot "$UDID" || true
xcrun simctl bootstatus "$UDID" -b
open -a Simulator
CI=1 EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_BUTTON_DEMO=1 npx expo start --go --no-dev --minify --ios --localhost --port 8081 --clear > "$OUT/metro.log" 2>&1 &
metro=$!
cleanup(){
  xcrun simctl io "$UDID" screenshot "$OUT/ios-final.png" || true
  if [ -n "${rec:-}" ]; then kill -INT "$rec" || true; wait "$rec" || true; fi
  kill "$metro" || true
}
trap cleanup EXIT
command -v xcodegen || brew install xcodegen
cd qa/button/ios
xcodegen generate
xcodebuild build-for-testing -project NativeButtonQA.xcodeproj -scheme NativeButtonQA -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath build CODE_SIGNING_ALLOWED=NO > "$OUT/xcode-build.log" 2>&1
cd "$ROOT"
sleep 10
xcrun simctl io "$UDID" recordVideo --codec=h264 "$OUT/ios-button.mp4" > "$OUT/record.log" 2>&1 &
rec=$!
xcodebuild test-without-building -project qa/button/ios/NativeButtonQA.xcodeproj -scheme NativeButtonQA -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath qa/button/ios/build -resultBundlePath "$OUT/NativeButton.xcresult" -parallel-testing-enabled NO CODE_SIGNING_ALLOWED=NO > "$OUT/xcode-test.log" 2>&1
xcrun xcresulttool export attachments --path "$OUT/NativeButton.xcresult" --output-path "$OUT/screenshots" || true
