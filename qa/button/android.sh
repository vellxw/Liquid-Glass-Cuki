#!/usr/bin/env bash
set -euo pipefail
mkdir -p qa/button/output
adb shell wm size 720x1600
adb shell wm density 280
adb reverse tcp:8081 tcp:8081
CI=1 EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_BUTTON_DEMO=1 npx expo start --go --no-dev --minify --android --localhost --port 8081 --clear > qa/button/output/metro.log 2>&1 &
metro=$!
cleanup(){ adb logcat -d > qa/button/output/logcat.txt || true; kill "$metro" || true; }
trap cleanup EXIT
python qa/button/android.py
