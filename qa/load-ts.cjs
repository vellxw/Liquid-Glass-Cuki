/** Offline source inspection only. This is NOT a React Native runtime or a native test. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function createLoader(options = {}) {
  const effects = [], cleanups = [], animations = [], gestures = [], haptics = [], rnJobs = [];
  const listeners = {};
  const sharedValues = [];
  const cache = new Map();
  const hookState = [];
  let hookIndex = 0;
  let nextId = 0;
  const h = (type, props, ...children) => ({ type, props: { ...(props || {}), children: children.flat(Infinity) } });
  const react = {
    __esModule: true,
    memo: fn => fn,
    createContext: initial => ({ _default:initial, Provider:'ContextProvider' }),
    useContext: context => context._default,
    useId: () => `offline${++nextId}`,
    useCallback: fn => fn,
    useLayoutEffect: fn => effects.push(fn),
    useEffect: fn => effects.push(fn),
    useMemo: fn => fn(),
    useRef: current => ({ current }),
    useState(initial) {
      const index = hookIndex++;
      if (!(index in hookState)) hookState[index] = typeof initial === 'function' ? initial() : initial;
      return [hookState[index], update => {
        hookState[index] = typeof update === 'function' ? update(hookState[index]) : update;
      }];
    },
  };
  const native = {
    View: 'View', Text: 'Text', TextInput:'TextInput', Pressable: 'Pressable', StatusBar: 'StatusBar', Button: 'Button', Switch: 'Switch',
    AppState: { currentState: 'active', addEventListener: (name, fn) => { listeners['app:'+name]=fn; return { remove() { delete listeners['app:'+name]; } }; } },
    AccessibilityInfo: { isReduceMotionEnabled: () => Promise.resolve(!!options.reduced),
      addEventListener: (name,fn) => { listeners[name]=fn; return { remove() { delete listeners[name]; } }; } },
    Image: 'Image', ScrollView: 'ScrollView', Modal: 'Modal',
    Animated: { View: 'AnimatedView', ScrollView: 'AnimatedScrollView',
      Value: class { constructor(value) { this.value = value; } },
      multiply: (value, factor) => ({ value, factor }), event: () => () => {} },
    Platform: { OS: 'ios', select: options => options.ios ?? options.default },
    StyleSheet: {
      create: value => value,
      absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    },
    useWindowDimensions: () => ({ width: 410, height: 890, scale: 3, fontScale: 1 }),
  };
  const svg = { __esModule: true, default: 'svg' };
  for (const key of ['Ellipse', 'Circle', 'ClipPath', 'Defs', 'G', 'LinearGradient', 'Path', 'RadialGradient', 'Stop', 'Rect']) {
    svg[key] = key[0].toLowerCase() + key.slice(1);
  }
  const snapshot = updater => {
    const value = updater();
    Object.defineProperty(value, '__updater', { value: updater, enumerable: false });
    return value;
  };
  const reanimated = { __esModule: true, default: { View: 'AnimatedView', createAnimatedComponent: c => c },
    createAnimatedComponent: c => c, ReduceMotion: { Never: 'never', System: 'system' },
    useSharedValue: value => { const sv = { value, modify: fn => { sv.value = fn(sv.value); } }; sharedValues.push(sv); return sv; },
    useReducedMotion: () => !!options.reduced,
    Easing:{out:x=>x,cubic:x=>x*x*x},
    useDerivedValue: fn => ({get value(){return fn();}}),
    useAnimatedProps: snapshot, useAnimatedStyle: snapshot,
    useAnimatedReaction: () => {}, useFrameCallback: () => ({ setActive() {} }),
    cancelAnimation: () => {},
    withSpring: (target, config, complete) => { animations.push({ kind: 'spring', target, config, complete }); return target; },
    withTiming: (target, config, complete) => { animations.push({ kind: 'timing', target, config, complete }); return target; },
  };
  const rngh = { GestureDetector: 'GestureDetector', GestureHandlerRootView: 'GestureHandlerRootView',
    Gesture: { Pan() {
      const g = { config: {}, handlers: {} };
      for (const k of ['enabled','minDistance','maxPointers','shouldCancelWhenOutside']) g[k] = v => { g.config[k]=v; return g; };
      for (const k of ['onBegin','onTouchesDown','onTouchesMove','onUpdate','onEnd','onFinalize']) g[k] = v => { g.handlers[k]=v; return g; };
      gestures.push(g); return g;
    } },
  };
  const externals = {
    react,
    '@shopify/react-native-skia': { Skia:{RuntimeEffect:{Make:code=>({code})}},
      Canvas:'SkiaCanvas', Fill:'SkiaFill', Group:'SkiaGroup', ImageShader:'ImageShader',Shader:'SkiaShader',
      makeImageFromView:()=>Promise.resolve({width:()=>460,height:()=>122}) },
    'react-native-reanimated': reanimated,
    'react-native-gesture-handler': rngh,
    'react-native-worklets': { scheduleOnRN: (fn,...args) => options.queueRN ? rnJobs.push(()=>fn(...args)) : fn(...args) },
    'expo-haptics': { AndroidHaptics: { Segment_Frequent_Tick:'tick', Virtual_Key:'key' }, ImpactFeedbackStyle: { Soft:'soft', Light:'light' },
      impactAsync: v => { haptics.push(v); return Promise.resolve(); }, performAndroidHapticsAsync: v => { haptics.push(v); return Promise.resolve(); } },
    'react-native': native,
    'react-native-svg': svg,
    'expo-blur': { BlurView: 'BlurView', BlurTargetView: 'BlurTargetView' },
    '@react-native-masked-view/masked-view': { __esModule: true, default: 'MaskedView' },
    'react-native-safe-area-context': {
      SafeAreaProvider: 'SafeAreaProvider', initialWindowMetrics: null,
      useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    },
    expo: { registerRootComponent: () => {} },
  };

  function load(filename) {
    filename = path.resolve(filename);
    if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory()) {
      const candidates = ['.ts', '.tsx', '/index.ts', '/index.tsx'].map(ext => filename + ext);
      filename = candidates.find(fs.existsSync);
      if (!filename) throw new Error('Cannot resolve local module.');
    }
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = fs.readFileSync(filename, 'utf8');
    const result = ts.transpileModule(source, {
      fileName: filename,
      reportDiagnostics: true,
      compilerOptions: {
        jsx: ts.JsxEmit.React, jsxFactory: '__qaH', jsxFragmentFactory: 'Fragment',
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
      },
    });
    if (result.diagnostics?.length) {
      throw new Error(ts.formatDiagnosticsWithColorAndContext(result.diagnostics, {
        getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n', getCanonicalFileName: x => x,
      }));
    }
    const module = { exports: {} };
    cache.set(filename, module);
    const localRequire = name => name.startsWith('.')
      ? load(path.resolve(path.dirname(filename), name))
      : externals[name] ?? (() => { throw new Error(`Unmocked package: ${name}`); })();
    vm.runInNewContext(result.outputText, {
      require: localRequire, exports: module.exports, module, __qaH: h, Fragment: 'fragment', console, Date, Promise, process,
    }, { filename });
    return module.exports;
  }

  function render(fn, props = {}) {
    hookIndex = 0;
    return fn(props);
  }
  return { load, render, native, animations, gestures, haptics, sharedValues, listeners,
    flushEffects() { while (effects.length) { const cleanup = effects.shift()(); if (cleanup) cleanups.push(cleanup); } },
    cleanup() { while (cleanups.length) cleanups.pop()(); },
    flushRN() { while (rnJobs.length) rnJobs.shift()(); },
  };
}
module.exports = { createLoader };
