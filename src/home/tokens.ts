/** Positions in pixels of the measured 750 x 1538 app viewport, not the phone frame.
 * The body starts below the 108 px reference safe area. PX converts pixels to points.
 */
export const PX = 0.5;
export const HOME_REFERENCE = {
  imageWidth: 941, imageHeight: 1672,
  viewportX: 96, viewportY: 44, viewportWidth: 750, viewportHeight: 1538,
  logicalWidth: 375, logicalHeight: 769, bodyTop: 108,
  bodyHeight: 1184, navWidth: 712, navBottomGap: 9, maxCanvasWidth: 600,
} as const;
export type SceneBox = { x: number; y: number; width: number; height: number };
export const BOX = {
  avatar: { x: 627, y: 109, width: 84, height: 84 },
  plantAsset: { x: 332, y: 222, width: 388, height: 570 },
  workoutAsset: { x: 360, y: 990, width: 380, height: 296 },
  calories: { x: 34, y: 411, width: 272, height: 268 },
  register: { x: 145, y: 817, width: 460, height: 122 },
  routine: { x: 40, y: 1206, width: 297, height: 79 },
} as const satisfies Record<string, SceneBox>;
export const INK = {
  background: '#091113', text: '#F4F6F8', name: '#E1E8F3', muted: '#ADB8C2',
  quiet: '#969EA3', track: '#2A3337', divider: '#394247',
  mint: '#A3FFD8', green: '#69C878', purple: '#B2A3FF', peach: '#F1BF92',
} as const;
export const GLASS = {
  blur: 30, blurOpacity: 0.22, pressedOpacity: 0.76,
  primaryBorder: 1.6, secondaryBorder: 0.9,
} as const;
/** Visual arc/bar lengths follow the reference; displayed numbers are independent. */
export const HOME_DATA = { calorieFraction: 0.72, plantFraction: 0.42 } as const;
export const COPY = {
  greeting: 'Buenos días,', name: 'Franco',
  motto: ['Disciplina hoy,', 'un mejor mañana.'],
  nutrition: 'Nutrición de hoy', calories: '1.620', calorieGoal: 'de 2.000 kcal',
  plant: 'Tu planta', week: 'Semana 18 de 52',
  plantNote: ['1 entrenamiento esta semana', 'mantiene tu crecimiento.'],
  register: 'Registrar +', next: 'Siguiente entrenamiento', workout: 'Hoy · Upper A',
  time: '19:30', exercises: '6 ejercicios', routine: 'Ver rutina',
  discipline: ['Disciplina', 'construye', 'hábitos reales.'],
} as const;
