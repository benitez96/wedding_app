import {
  DecorationPattern,
  DecorationPosition,
  DecorationPatterns,
} from "@/types/decoration";

export interface PatternOptions {
  containerHeight: number;
  containerWidth: number;
  elementSize: number;
}

/**
 * Retorna las posiciones de los elementos decorativos según el patrón seleccionado
 * Ahora con soporte para cálculo dinámico basado en tamaño del contenedor
 */
export function getPatternPositions(
  pattern: DecorationPattern,
  options?: PatternOptions,
): DecorationPosition[] {
  switch (pattern) {
    case DecorationPatterns.CORNERS:
      return getCornersPositions();

    case DecorationPatterns.SCATTERED_GRID_ALT:
      return getScatteredGridAltPositions();

    case DecorationPatterns.SCATTERED_GRID_PROGRESSIVE:
      return getScatteredGridProgressivePositions();

    case DecorationPatterns.SCATTERED_GRID_RADIAL:
      return getScatteredGridRadialPositions();

    case DecorationPatterns.BORDER_TOP:
      return getBorderTopPositions(options);

    case DecorationPatterns.BORDER_BOTTOM:
      return getBorderBottomPositions(options);

    case DecorationPatterns.BORDER_BOTH:
      return [
        ...getBorderTopPositions(options),
        ...getBorderBottomPositions(options),
      ];

    case DecorationPatterns.BORDER_LEFT:
      return getBorderLeftPositions(options);

    case DecorationPatterns.BORDER_RIGHT:
      return getBorderRightPositions(options);

    case DecorationPatterns.BORDER_SIDES:
      return getBorderSidesPositions(options);

    case DecorationPatterns.CENTER:
      return getCenterPosition();

    case DecorationPatterns.TILED:
    case DecorationPatterns.NONE:
    default:
      return [];
  }
}

// Patrón: 4 flores en las esquinas con rotación
function getCornersPositions(): DecorationPosition[] {
  return [
    { top: 16, left: 16, rotate: 0 },
    { top: 16, right: 16, rotate: 90 },
    { bottom: 16, right: 16, rotate: 180 },
    { bottom: 16, left: 16, rotate: 270 },
  ];
}

// Patrón: Grilla alternada (ajedrez visual)
// Alterna entre 0° y 45° en patrón de tablero
function getScatteredGridAltPositions(): DecorationPosition[] {
  const positions: DecorationPosition[] = [];
  const rows = 5;
  const cols = 4;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const topPercent = 10 + row * 18;
      const leftPercent = 12 + col * 22;
      // Alterna como tablero de ajedrez
      const rotation = (row + col) % 2 === 0 ? 0 : 45;

      positions.push({
        top: `${topPercent}%`,
        left: `${leftPercent}%`,
        rotate: rotation,
      });
    }
  }

  return positions;
}

// Patrón: Grilla progresiva (gradiente de rotación)
// Rotación aumenta gradualmente de izquierda a derecha y arriba hacia abajo
function getScatteredGridProgressivePositions(): DecorationPosition[] {
  const positions: DecorationPosition[] = [];
  const rows = 5;
  const cols = 4;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const topPercent = 10 + row * 18;
      const leftPercent = 12 + col * 22;
      // Rotación progresiva: de -45° a 45°
      const totalCells = rows * cols;
      const cellIndex = row * cols + col;
      const rotation = -45 + (cellIndex / (totalCells - 1)) * 90;

      positions.push({
        top: `${topPercent}%`,
        left: `${leftPercent}%`,
        rotate: Math.round(rotation),
      });
    }
  }

  return positions;
}

// Patrón: Grilla radial (desde centro)
// Rotación basada en distancia al centro de la grilla
function getScatteredGridRadialPositions(): DecorationPosition[] {
  const positions: DecorationPosition[] = [];
  const rows = 5;
  const cols = 4;
  const centerRow = rows / 2;
  const centerCol = cols / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const topPercent = 10 + row * 18;
      const leftPercent = 12 + col * 22;

      // Calcular ángulo desde el centro
      const dx = col - centerCol;
      const dy = row - centerRow;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      positions.push({
        top: `${topPercent}%`,
        left: `${leftPercent}%`,
        rotate: Math.round(angle),
      });
    }
  }

  return positions;
}

// Patrón: Fila horizontal en borde superior
function getBorderTopPositions(options?: PatternOptions): DecorationPosition[] {
  const positions: DecorationPosition[] = [];
  const count = options
    ? Math.floor(options.containerWidth / (options.elementSize * 1.5))
    : 6;
  const spacing = 100 / (count + 1);

  for (let i = 0; i < count; i++) {
    // Rotación determinística basada en índice (sin Math.random para evitar hydration issues)
    const rotation = -10 + ((i * 7) % 20);
    positions.push({
      top: options ? options.elementSize / 2 : 8,
      left: `${spacing * (i + 1)}%`,
      rotate: rotation,
    });
  }
  return positions;
}

// Patrón: Fila horizontal en borde inferior
function getBorderBottomPositions(
  options?: PatternOptions,
): DecorationPosition[] {
  const positions: DecorationPosition[] = [];
  const count = options
    ? Math.floor(options.containerWidth / (options.elementSize * 1.5))
    : 6;
  const spacing = 100 / (count + 1);

  for (let i = 0; i < count; i++) {
    // Rotación determinística basada en índice
    const rotation = -10 + ((i * 11) % 20);
    positions.push({
      bottom: options ? options.elementSize / 2 : 8,
      left: `${spacing * (i + 1)}%`,
      rotate: rotation,
    });
  }
  return positions;
}

// Patrón: Columna vertical en borde izquierdo
function getBorderLeftPositions(
  options?: PatternOptions,
): DecorationPosition[] {
  const positions: DecorationPosition[] = [];
  const count = options
    ? Math.floor(options.containerHeight / (options.elementSize * 1.5))
    : 5;
  const spacing = 100 / (count + 1);
  const offset = options ? options.elementSize / 2 : 8;

  for (let i = 0; i < count; i++) {
    // Rotación determinística basada en índice
    const rotation = -15 + ((i * 13) % 30);
    positions.push({
      top: `${spacing * (i + 1)}%`,
      left: offset,
      rotate: rotation,
    });
  }
  return positions;
}

// Patrón: Columna vertical en borde derecho
function getBorderRightPositions(
  options?: PatternOptions,
): DecorationPosition[] {
  const positions: DecorationPosition[] = [];
  const count = options
    ? Math.floor(options.containerHeight / (options.elementSize * 1.5))
    : 5;
  const spacing = 100 / (count + 1);
  const offset = options ? options.elementSize / 2 : 8;

  for (let i = 0; i < count; i++) {
    // Rotación determinística basada en índice
    const rotation = -15 + ((i * 17) % 30);
    positions.push({
      top: `${spacing * (i + 1)}%`,
      right: offset,
      rotate: rotation,
    });
  }
  return positions;
}

// Patrón: Ambos bordes laterales (izquierdo + derecho)
function getBorderSidesPositions(
  options?: PatternOptions,
): DecorationPosition[] {
  return [
    ...getBorderLeftPositions(options),
    ...getBorderRightPositions(options),
  ];
}

// Patrón: Un solo elemento centrado grande
function getCenterPosition(): DecorationPosition[] {
  return [
    {
      top: "50%",
      left: "50%",
      scale: 2.5,
      rotate: 0,
    },
  ];
}

/**
 * Retorna el label descriptivo de cada patrón
 */
export function getPatternLabel(pattern: DecorationPattern): string {
  const labels: Record<DecorationPattern, string> = {
    [DecorationPatterns.CORNERS]: "Esquinas (4 elementos)",
    [DecorationPatterns.SCATTERED_GRID_ALT]: "Grilla alternada (ajedrez)",
    [DecorationPatterns.SCATTERED_GRID_PROGRESSIVE]:
      "Grilla progresiva (gradiente)",
    [DecorationPatterns.SCATTERED_GRID_RADIAL]: "Grilla radial (desde centro)",
    [DecorationPatterns.BORDER_TOP]: "Borde superior",
    [DecorationPatterns.BORDER_BOTTOM]: "Borde inferior",
    [DecorationPatterns.BORDER_BOTH]: "Ambos bordes horizontales",
    [DecorationPatterns.BORDER_LEFT]: "Borde izquierdo",
    [DecorationPatterns.BORDER_RIGHT]: "Borde derecho",
    [DecorationPatterns.BORDER_SIDES]: "Ambos bordes laterales",
    [DecorationPatterns.TILED]: "Mosaico repetitivo",
    [DecorationPatterns.CENTER]: "Centro (grande)",
  };

  return labels[pattern] || pattern;
}
