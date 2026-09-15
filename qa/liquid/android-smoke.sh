#!/usr/bin/env bash
# Native Expo Go smoke + capture. Does NOT claim physical-device or release performance.
set -euo pipefail
mkdir -p qa/liquid/native-output
adb reverse tcp:8081 tcp:8081
EXPO_NO_TELEMETRY=1 CI=1 EXPO_PUBLIC_LIQUID_LAB=1 npx expo start --go --android --localhost --port 8081 --clear > qa/liquid/native-output/metro.log 2>&1 &
metro=$!
cleanup() {
  adb logcat -d > qa/liquid/native-output/logcat.txt || true
  adb shell dumpsys gfxinfo host.exp.exponent framestats > qa/liquid/native-output/gfxinfo.txt || true
  tail -80 qa/liquid/native-output/metro.log || true
  kill "$metro" || true
}
trap cleanup EXIT
python qa/liquid/android-smoke.py
