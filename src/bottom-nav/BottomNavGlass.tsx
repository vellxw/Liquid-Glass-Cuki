import { useCallback, useState, type RefObject } from 'react';
import {
  Platform, Pressable, StyleSheet, View,
  type LayoutChangeEvent, type StyleProp, type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';
import { GlassMaterial } from './GlassMaterial';
import { GlassIcon } from './GlassIcons';
import { NativeLabel } from './NativeLabel';
import {
  COLORS, DESIGN, ICON_BOXES, MATERIAL, OUTER_PATH, TABS,
  getBarHeight, getTabBounds, type BottomNavId,
} from './tokens';

export type BottomNavGlassProps = {
  /** Native layout points, not image pixels. Omit to fill the parent width. */
  width?: number;
  /** Controlled selection. Omit for internal state. */
  activeTab?: BottomNavId;
  defaultActiveTab?: BottomNavId;
  onChange?: (tab: BottomNavId) => void;
  /** Called on every Registrar press, including repeated presses. */
  onRegisterPress?: () => void;
  /** On Android, points to the BlurTargetView containing the screen content. */
  blurTarget?: RefObject<View | null>;
  blurIntensity?: number;
  androidBlurMethod?: 'none' | 'dimezisBlurView' | 'dimezisBlurViewSdk31Plus';
  /** Native font override; no font files are bundled. */
  fontFamily?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function BottomNavGlass({
  width,
  activeTab,
  defaultActiveTab = 'hoy',
  onChange,
  onRegisterPress,
  blurTarget,
  blurIntensity = MATERIAL.blurIntensity,
  androidBlurMethod = 'dimezisBlurViewSdk31Plus',
  fontFamily,
  disabled = false,
  style,
  testID = 'bottom-nav-glass',
}: BottomNavGlassProps) {
  const [internalTab, setInternalTab] = useState<BottomNavId>(defaultActiveTab);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const currentTab = activeTab ?? internalTab;
  const actualWidth = width ?? measuredWidth;
  const scale = actualWidth / DESIGN.width;
  const height = actualWidth > 0 ? getBarHeight(actualWidth) : 0;
  const canBlur = blurIntensity > 0 && (Platform.OS !== 'android' || !!blurTarget);
  const intensity = Number.isFinite(blurIntensity)
    ? Math.min(100, Math.max(1, blurIntensity)) : MATERIAL.blurIntensity;

  // An explicit invalid width is a programmer error; unmeasured layout is not.
  if (width !== undefined) getBarHeight(width);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setMeasuredWidth(previous => Math.abs(previous - nextWidth) > 0.05 ? nextWidth : previous);
  }, []);

  const select = useCallback((tab: BottomNavId) => {
    if (disabled) return;
    if (activeTab === undefined) setInternalTab(tab);
    onChange?.(tab);
    if (tab === 'registrar') onRegisterPress?.();
  }, [activeTab, disabled, onChange, onRegisterPress]);

  return (
    <View
      testID={testID}
      pointerEvents="box-none"
      onLayout={onLayout}
      style={[
        styles.root,
        style,
        { width: width ?? '100%', height: height || undefined, aspectRatio: DESIGN.width / DESIGN.height },
      ]}
    >
      {actualWidth > 0 && (
        <>
          <View
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={StyleSheet.absoluteFill}
          >
            {canBlur && (
              <MaskedView
                style={StyleSheet.absoluteFill}
                androidRenderingMode="hardware"
                maskElement={
                  <Svg width={actualWidth} height={height} viewBox={`0 0 ${DESIGN.width} ${DESIGN.height}`}>
                    <Path d={OUTER_PATH} fill="#000000" />
                  </Svg>
                }
              >
                <BlurView
                  tint="dark"
                  intensity={intensity}
                  blurTarget={blurTarget}
                  blurMethod={Platform.OS === 'android' ? androidBlurMethod : 'none'}
                  style={[StyleSheet.absoluteFill, { opacity: MATERIAL.blurOpacity }]}
                />
              </MaskedView>
            )}
            <GlassMaterial width={actualWidth} height={height} activeTab={currentTab} />
          </View>

          {TABS.map((tab, index) => {
            const bounds = getTabBounds(index);
            const icon = ICON_BOXES[tab.id];
            const selected = currentTab === tab.id;
            const iconColor = selected || tab.id === 'registrar'
              ? COLORS.whiteIcon : COLORS.inactiveIcon;
            return (
              <Pressable
                key={tab.id}
                testID={`${testID}-${tab.id}`}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={() => select(tab.id)}
                style={({ pressed }) => [
                  styles.tab,
                  {
                    left: bounds.left * scale,
                    top: DESIGN.hitTop * scale,
                    width: bounds.width * scale,
                    height: DESIGN.hitHeight * scale,
                    opacity: pressed ? MATERIAL.pressedOpacity : 1,
                  },
                ]}
              >
                <View
                  pointerEvents="none"
                  style={[
                    styles.icon,
                    {
                      left: (icon.x - bounds.left) * scale,
                      top: (icon.y - DESIGN.hitTop) * scale,
                      width: icon.width * scale,
                      height: icon.height * scale,
                    },
                  ]}
                >
                  <GlassIcon name={tab.id} color={iconColor} width={icon.width * scale} height={icon.height * scale} />
                </View>
                <NativeLabel
                  text={tab.label}
                  center={(tab.center - bounds.left) * scale}
                  scale={scale}
                  selected={selected}
                  fontFamily={fontFamily}
                />
              </Pressable>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative', alignSelf: 'center', direction: 'ltr' },
  tab: { position: 'absolute', backgroundColor: 'transparent' },
  icon: { position: 'absolute' },
});
