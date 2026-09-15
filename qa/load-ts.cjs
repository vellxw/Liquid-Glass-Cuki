/** Offline source inspection only. This is NOT a React Native runtime or a native test. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function createLoader() {
  const cache = new Map();
  const hookState = [];
  let hookIndex = 0;
  let nextId = 0;
  const h = (type, props, ...children) => ({ type, props: { ...(props || {}), children: children.flat(Infinity) } });
  const react = {
    __esModule: true,
    memo: fn => fn,
    useId: () => `offline${++nextId}`,
    useCallback: fn => fn,
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
    View: 'View', Text: 'Text', Pressable: 'Pressable', StatusBar: 'StatusBar',
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
  for (const key of ['Circle', 'ClipPath', 'Defs', 'G', 'LinearGradient', 'Path', 'RadialGradient', 'Stop', 'Rect']) {
    svg[key] = key[0].toLowerCase() + key.slice(1);
  }
  const externals = {
    react,
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
      require: localRequire, exports: module.exports, module, __qaH: h, Fragment: 'fragment', console,
    }, { filename });
    return module.exports;
  }

  function render(fn, props = {}) {
    hookIndex = 0;
    return fn(props);
  }
  return { load, render, native };
}
module.exports = { createLoader };
