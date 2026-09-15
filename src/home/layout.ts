import type { ViewStyle } from 'react-native';
import { getBarHeight } from '../bottom-nav/tokens';
import { HOME_REFERENCE as R, PX, type SceneBox } from './tokens';
export type Insets = { top: number; bottom: number; left: number; right: number };
export function getHomeLayout(width: number, height: number, insets: Insets) {
  if (![width, height].every(n => Number.isFinite(n) && n > 0)) {
    throw new RangeError('Home viewport must have positive, finite dimensions.');
  }
  const safe = (n: number) => Number.isFinite(n) ? Math.max(0, n) : 0;
  const left = safe(insets.left), right = safe(insets.right);
  const availableWidth = Math.max(1, width - left - right);
  const canvasWidth = Math.min(availableWidth, R.maxCanvasWidth);
  const scale = canvasWidth / R.logicalWidth;
  const canvasLeft = left + (availableWidth - canvasWidth) / 2;
  const top = Math.max(safe(insets.top), 12 * scale);
  const bottom = safe(insets.bottom) + R.navBottomGap * PX * scale;
  const navWidth = R.navWidth * PX * scale;
  const navHeight = getBarHeight(navWidth);
  const bodyHeight = R.bodyHeight * PX * scale;
  const scrollHeight = Math.max(1, height - top - bottom - navHeight - 12 * scale);
  return {
    canvasWidth, canvasLeft, scale, top, bottom, navWidth, navHeight, bodyHeight,
    scrollHeight, needsScroll: bodyHeight > scrollHeight + 0.5,
  };
}
export function sceneStyle(box: SceneBox, scale: number): ViewStyle {
  const s = PX * scale;
  return { position: 'absolute', left: box.x * s, top: (box.y - R.bodyTop) * s,
    width: box.width * s, height: box.height * s };
}
