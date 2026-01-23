/**
 * Types compartidos para el sistema de decoraciones florales
 */

// SVGs disponibles para decoraciones
export const DecorationSVGs = {
  NONE: "none",
  FLOWER: "flower",
  LEAF: "leaf",
  HEART: "heart",
  BRANCH: "branch",
  BRANCH_2: "branch-2",
} as const;

export type DecorationSvg =
  (typeof DecorationSVGs)[keyof typeof DecorationSVGs];

// Patrones de repetición disponibles
export const DecorationPatterns = {
  NONE: "none",
  CORNERS: "corners",
  SCATTERED_GRID_ALT: "scattered-grid-alt",
  SCATTERED_GRID_PROGRESSIVE: "scattered-grid-progressive",
  SCATTERED_GRID_RADIAL: "scattered-grid-radial",
  BORDER_TOP: "border-top",
  BORDER_BOTTOM: "border-bottom",
  BORDER_BOTH: "border-both",
  BORDER_LEFT: "border-left",
  BORDER_RIGHT: "border-right",
  BORDER_SIDES: "border-sides",
  TILED: "tiled",
  CENTER: "center",
} as const;

export type DecorationPattern =
  (typeof DecorationPatterns)[keyof typeof DecorationPatterns];

// Props para el componente DecorationLayer
export interface DecorationLayerProps {
  svg?: DecorationSvg;
  pattern?: DecorationPattern;
  opacity?: number; // 0-100
  size?: number; // px
  hasAlternateBg?: boolean; // Determina el color de las decoraciones
  children: React.ReactNode;
}

// Configuración de posición de un elemento decorativo
export interface DecorationPosition {
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  rotate?: number; // degrees
  scale?: number;
}

// Props para el preview
export interface DecorationPreviewProps {
  svg: DecorationSvg;
  pattern: DecorationPattern;
  opacity: number;
  size: number;
  hasAlternateBg?: boolean;
}
