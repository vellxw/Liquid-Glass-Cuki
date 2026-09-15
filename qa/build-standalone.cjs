// Convenience distribution: same native implementation in a single copyable file.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const output = process.argv[2] || path.join(root, 'standalone', 'BottomNavGlass.tsx');
const modules = ['tokens.ts', 'GlassIcons.tsx', 'GlassMaterial.tsx', 'NativeLabel.tsx', 'BottomNavGlass.tsx', 'ReferenceFrame.tsx'];
const imports = `/** Self-contained React Native + Expo component. Generated from the modular source. */
import { memo, useId, useCallback, useState, type RefObject } from 'react';
import {
  Platform, Pressable, StyleSheet, Text, View,
  type LayoutChangeEvent, type StyleProp, type ViewStyle, type TextProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
`;
const result = modules.map(name => {
  let text = fs.readFileSync(path.join(root, 'src/bottom-nav', name), 'utf8');
  const ast = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const spans = ast.statements.filter(ts.isImportDeclaration).map(node => [node.getStart(ast), node.end]).reverse();
  for (const [start, end] of spans) text = text.slice(0, start) + text.slice(end);
  if (name === 'GlassMaterial.tsx') text = text.replace(/\bProps\b/g, 'GlassMaterialProps');
  if (name === 'NativeLabel.tsx') text = text.replace(/\bProps\b/g, 'NativeLabelProps').replace(/\bstyles\b/g, 'labelStyles');
  if (name === 'BottomNavGlass.tsx') text = text.replace(/\bstyles\b/g, 'navStyles');
  return `\n// ─── ${name} ───\n${text.trim()}\n`;
}).join('');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, imports + result);
console.log(output);
