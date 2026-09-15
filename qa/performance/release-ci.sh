#!/usr/bin/env bash
# Native release APK benchmark. Development/test signing only; NOT a store release.
set -euo pipefail
mkdir -p qa/liquid/native-output qa/liquid/.injector
SDK="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
D8=$(find "$SDK/build-tools" -name d8 | sort -V | tail -1)
javac -source 8 -target 8 -cp "$SDK/platforms/android-35/android.jar" -d qa/liquid/.injector qa/liquid/InjectPath.java
"$D8" --lib "$SDK/platforms/android-35/android.jar" --output qa/liquid/.injector/local-input.jar qa/liquid/.injector/InjectPath.class
adb push qa/liquid/.injector/local-input.jar /data/local/tmp/local-input.jar
adb shell wm size 720x1600
adb shell wm density 280
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell am start -W -n com.vellxw.liquidglasscuki/.MainActivity
cleanup(){
 adb logcat -d > qa/liquid/native-output/logcat.txt || true
 adb shell dumpsys gfxinfo com.vellxw.liquidglasscuki framestats > qa/liquid/native-output/gfxinfo.txt || true
 adb shell pkill -2 screenrecord || true
 adb pull /sdcard/local-glass.mp4 qa/liquid/native-output/native-all-actions.mp4 || true
}
trap cleanup EXIT
python qa/performance/release-adapter.py
