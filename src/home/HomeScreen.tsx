import { useCallback, useRef, useState } from 'react';
import { Animated, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavGlass, type BottomNavId } from '../bottom-nav';
import { BOX, HOME_REFERENCE, INK, PX } from './tokens';
import { getHomeLayout, sceneStyle } from './layout';
import { HomeContent } from './HomeContent';
import { PhotoSlot } from './PhotoSlot';
import type { HomeAssets } from './types';

export type HomeScreenProps = {
  assets?: HomeAssets;
  activeTab?: BottomNavId;
  onTabChange?: (tab: BottomNavId) => void;
  onRegister?: () => void;
  onOpenRoutine?: () => void;
  onOpenNutrition?: () => void;
  onAvatarPress?: () => void;
  /** Draw temporary outlines around reserved photo slots; off in the reference view. */
  showAssetGuides?: boolean;
  fontFamily?: string;
};

/** Requires SafeAreaProvider above it. No device frame, fake clock or home indicator. */
export function HomeScreen({
  assets, activeTab, onTabChange, onRegister, onOpenRoutine, onOpenNutrition,
  onAvatarPress, showAssetGuides = false, fontFamily,
}: HomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = getHomeLayout(width, height, insets);
  const blurTarget = useRef<View | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [internalTab, setInternalTab] = useState<BottomNavId>('hoy');
  const selected = activeTab ?? internalTab;
  const select = useCallback((tab: BottomNavId) => {
    if (activeTab === undefined) setInternalTab(tab);
    onTabChange?.(tab);
  }, [activeTab, onTabChange]);

  return (
    <View testID="cuki-home" style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {/* All blur sources are siblings BEFORE the UI. No BlurView captures itself.
          Asset translation follows the native scroll animation, so photographs
          can be inserted later without moving a single foreground element. */}
      <BlurTargetView ref={blurTarget} pointerEvents="none" style={StyleSheet.absoluteFill}>
        <PhotoSlot name="backgroundImage" source={assets?.backgroundImage} width={width} height={height} />
        <Animated.View
          style={{
            position: 'absolute', left: layout.canvasLeft, top: layout.top,
            width: layout.canvasWidth, height: layout.bodyHeight,
            transform: [{ translateY: Animated.multiply(scrollY, -1) }],
          }}
        >
          <PhotoSlot name="heroPlantImage" source={assets?.heroPlantImage}
            width={BOX.plantAsset.width * PX * layout.scale} height={BOX.plantAsset.height * PX * layout.scale}
            showGuide={showAssetGuides} style={sceneStyle(BOX.plantAsset, layout.scale)} />
          <PhotoSlot name="workoutImage" source={assets?.workoutImage}
            width={BOX.workoutAsset.width * PX * layout.scale} height={BOX.workoutAsset.height * PX * layout.scale}
            showGuide={showAssetGuides} style={sceneStyle(BOX.workoutAsset, layout.scale)} />
        </Animated.View>
      </BlurTargetView>

      <Animated.ScrollView
        testID="home-scroll"
        style={{ position: 'absolute', left: layout.canvasLeft, top: layout.top, width: layout.canvasWidth, height: layout.scrollHeight }}
        contentContainerStyle={{ width: layout.canvasWidth, minHeight: layout.bodyHeight }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustsScrollIndicatorInsets={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        scrollEnabled={layout.needsScroll}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <HomeContent
          width={layout.canvasWidth} height={layout.bodyHeight} scale={layout.scale}
          fontFamily={fontFamily} assets={assets} blurTarget={blurTarget}
          onRegister={onRegister} onOpenRoutine={onOpenRoutine}
          onOpenNutrition={onOpenNutrition} onAvatarPress={onAvatarPress}
        />
      </Animated.ScrollView>

      <View pointerEvents="box-none" testID="home-nav-dock"
        style={{ position: 'absolute', left: layout.canvasLeft, bottom: layout.bottom, width: layout.canvasWidth, height: layout.navHeight }}>
        {/* This is the original, byte-for-byte preserved implementation. */}
        <BottomNavGlass
          width={layout.navWidth} activeTab={selected} onChange={select}
          onRegisterPress={onRegister} blurTarget={blurTarget}
        />
      </View>
    </View>
  );
}

export const HOME_TARGET_VIEWPORT = { width: HOME_REFERENCE.logicalWidth, height: HOME_REFERENCE.logicalHeight };
const styles = StyleSheet.create({ screen: { flex: 1, overflow: 'hidden', backgroundColor: INK.background } });
