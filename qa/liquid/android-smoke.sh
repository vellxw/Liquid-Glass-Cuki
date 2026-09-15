#!/usr/bin/env bash
# Real native input, Skia rendering and Android screenrecord; no host-rendered video.
set -euo pipefail
mkdir -p qa/liquid/native-output qa/liquid/.injector
SDK="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
PLATFORM="$SDK/platforms/android-35/android.jar"
BUILD=$(find "$SDK/build-tools" -name d8 | sort -V | tail -1)
javac -source 8 -target 8 -cp "$PLATFORM" -d qa/liquid/.injector qa/liquid/InjectPath.java
"$BUILD" --lib "$PLATFORM" --output qa/liquid/.injector/local-input.jar qa/liquid/.injector/InjectPath.class
adb push qa/liquid/.injector/local-input.jar /data/local/tmp/local-input.jar
adb reverse tcp:8081 tcp:8081
EXPO_NO_TELEMETRY=1 CI=1 EXPO_PUBLIC_LIQUID_LAB=1 npx expo start --go --android --localhost --port 8081 --clear > qa/liquid/native-output/metro.log 2>&1 &
metro=$!
cleanup(){
  adb logcat -d > qa/liquid/native-output/logcat.txt || true
  adb shell dumpsys gfxinfo host.exp.exponent framestats > qa/liquid/native-output/gfxinfo.txt || true
  tail -80 qa/liquid/native-output/metro.log || true
  adb shell pkill -2 screenrecord || true
  adb pull /sdcard/local-glass.mp4 qa/liquid/native-output/native-all-actions.mp4 || true
  kill "$metro" || true
}
trap cleanup EXIT
python qa/liquid/android-smoke.py
