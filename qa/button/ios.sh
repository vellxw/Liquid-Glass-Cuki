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
# Keep Node's localhost binding consistent with Expo's advertised 127.0.0.1 URL.
NODE_OPTIONS="${NODE_OPTIONS:-} --dns-result-order=ipv4first" CI=1 EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_BUTTON_DEMO=1 npx expo start --go --no-dev --minify --ios --localhost --port 8081 --clear > "$OUT/metro.log" 2>&1 &
metro=$!
cleanup(){
  xcrun simctl io "$UDID" screenshot "$OUT/ios-final.png" || true
  if [ -d "$OUT/NativeButton.xcresult" ]; then xcrun xcresulttool export attachments --path "$OUT/NativeButton.xcresult" --output-path "$OUT/screenshots" || true; fi
  if [ -n "${rec:-}" ]; then kill -INT "$rec" || true; wait "$rec" || true; fi
  kill "$metro" || true
}
trap cleanup EXIT
command -v xcodegen || HOMEBREW_NO_AUTO_UPDATE=1 brew install xcodegen
cd qa/button/ios
xcodegen generate
xcodebuild build-for-testing -project NativeButtonQA.xcodeproj -scheme NativeButtonQA -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath build CODE_SIGNING_ALLOWED=NO > "$OUT/xcode-build.log" 2>&1
cd "$ROOT"
# Metro may be listening after Expo Go initially attempted the URL. Check the
# actual server, retain its manifest, and explicitly reopen the project after build.
lsof -nP -iTCP:8081 -sTCP:LISTEN > "$OUT/metro-listener.txt" || true
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8081/status > "$OUT/metro-status.txt"; then break; fi
  kill -0 "$metro"
  sleep 2
done
grep -q 'packager-status:running' "$OUT/metro-status.txt"
curl -fsS -H 'expo-platform: ios' -H 'accept: application/expo+json' http://127.0.0.1:8081 > "$OUT/ios-manifest.json"
xcrun simctl openurl "$UDID" 'exp://127.0.0.1:8081'
sleep 4
xcrun simctl io "$UDID" recordVideo --codec=h264 "$OUT/ios-button.mp4" > "$OUT/record.log" 2>&1 &
rec=$!
xcodebuild test-without-building -project qa/button/ios/NativeButtonQA.xcodeproj -scheme NativeButtonQA -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath qa/button/ios/build -resultBundlePath "$OUT/NativeButton.xcresult" -parallel-testing-enabled NO CODE_SIGNING_ALLOWED=NO > "$OUT/xcode-test.log" 2>&1
xcrun xcresulttool export attachments --path "$OUT/NativeButton.xcresult" --output-path "$OUT/screenshots" || true
