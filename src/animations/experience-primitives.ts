import { readThemePalette } from "../core";

export interface ScenePalette {
  blue: string;
  faint: string;
  ink: string;
  muted: string;
  surface: string;
}

export interface PixelPoint {
  x: number;
  y: number;
}

export const SCENE_WIDTH = 210;
export const SCENE_HEIGHT = 85;
export const SCENE_FPS = 20;

export const readScenePalette = (): ScenePalette => {
  const colors = readThemePalette();
  return {
    blue: colors.blue,
    faint: colors.faint,
    ink: colors.ink,
    muted: colors.muted,
    surface: colors.surface,
  };
};

export const clamp = (
  value: number,
  minimum = 0,
  maximum = 1,
): number => Math.min(maximum, Math.max(minimum, value));

export const progressBetween = (
  frame: number,
  start: number,
  end: number,
): number => clamp((frame - start) / (end - start));

export const fadeAfter = (
  frame: number,
  start: number,
  end: number,
): number => 1 - progressBetween(frame, start, end);

export const withAlpha = (
  context: CanvasRenderingContext2D,
  alpha: number,
  draw: () => void,
): void => {
  context.save();
  context.globalAlpha = clamp(alpha);
  draw();
  context.restore();
};

export const line = (
  context: CanvasRenderingContext2D,
  from: PixelPoint,
  to: PixelPoint,
  color: string,
  thickness = 1,
): void => {
  context.fillStyle = color;
  let x = Math.round(from.x);
  let y = Math.round(from.y);
  const targetX = Math.round(to.x);
  const targetY = Math.round(to.y);
  const dx = Math.abs(targetX - x);
  const sx = x < targetX ? 1 : -1;
  const dy = -Math.abs(targetY - y);
  const sy = y < targetY ? 1 : -1;
  let error = dx + dy;

  while (true) {
    context.fillRect(x, y, thickness, thickness);
    if (x === targetX && y === targetY) break;
    const doubled = error * 2;
    if (doubled >= dy) {
      error += dy;
      x += sx;
    }
    if (doubled <= dx) {
      error += dx;
      y += sy;
    }
  }
};

export const box = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  fill = false,
  thickness = 1,
): void => {
  context.fillStyle = color;
  if (fill) {
    context.fillRect(x, y, width, height);
    return;
  }
  context.fillRect(x, y, width, thickness);
  context.fillRect(x, y + height - thickness, width, thickness);
  context.fillRect(x, y, thickness, height);
  context.fillRect(x + width - thickness, y, thickness, height);
};

const rasterSegment = (from: PixelPoint, to: PixelPoint): PixelPoint[] => {
  const points: PixelPoint[] = [];
  let x = Math.round(from.x);
  let y = Math.round(from.y);
  const targetX = Math.round(to.x);
  const targetY = Math.round(to.y);
  const dx = Math.abs(targetX - x);
  const sx = x < targetX ? 1 : -1;
  const dy = -Math.abs(targetY - y);
  const sy = y < targetY ? 1 : -1;
  let error = dx + dy;

  while (true) {
    points.push({ x, y });
    if (x === targetX && y === targetY) break;
    const doubled = error * 2;
    if (doubled >= dy) {
      error += dy;
      x += sx;
    }
    if (doubled <= dx) {
      error += dx;
      y += sy;
    }
  }
  return points;
};

const rasterPath = (nodes: PixelPoint[]): PixelPoint[] =>
  nodes.flatMap((node, index) => {
    if (index === nodes.length - 1) return [];
    const points = rasterSegment(node, nodes[index + 1]);
    return index ? points.slice(1) : points;
  });

export const progressivePath = (
  context: CanvasRenderingContext2D,
  nodes: PixelPoint[],
  pathProgress: number,
  colors: ScenePalette,
  thickness = 1,
): void => {
  const points = rasterPath(nodes);
  const visibleCount = Math.round(points.length * clamp(pathProgress));
  context.fillStyle = colors.blue;
  points.slice(0, visibleCount).forEach((point) => {
    context.fillRect(point.x, point.y, thickness, thickness);
  });
};

export const progressivePolyline = (
  context: CanvasRenderingContext2D,
  points: PixelPoint[],
  lineProgress: number,
  colors: ScenePalette,
  thickness = 2,
): void => {
  const path = rasterPath(points);
  const visibleCount = Math.round(path.length * clamp(lineProgress));
  context.fillStyle = colors.blue;
  path.slice(0, visibleCount).forEach((point) => {
    context.fillRect(point.x, point.y, thickness, thickness);
  });
};

export const progressiveDashedPath = (
  context: CanvasRenderingContext2D,
  points: PixelPoint[],
  pathProgress: number,
  colors: ScenePalette,
): void => {
  const path = rasterPath(points);
  const visibleCount = Math.round(path.length * clamp(pathProgress));
  path.slice(0, visibleCount).forEach((point, index) => {
    if (index % 6 >= 3) return;
    context.fillStyle = colors.blue;
    context.fillRect(point.x, point.y, 2, 1);
  });
};

export const drawPanel = (
  context: CanvasRenderingContext2D,
  colors: ScenePalette,
): void => {
  context.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  context.fillStyle = colors.surface;
  context.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  box(context, 1, 1, SCENE_WIDTH - 2, SCENE_HEIGHT - 2, colors.faint);
};

const PIXEL_GLYPHS: Readonly<Record<string, readonly string[]>> = {
  " ": ["000", "000", "000", "000", "000"],
  "+": ["000", "010", "111", "010", "000"],
  "-": ["000", "000", "111", "000", "000"],
  ".": ["000", "000", "000", "000", "010"],
  "/": ["001", "001", "010", "100", "100"],
  "%": ["101", "001", "010", "100", "101"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"],
  "3": ["110", "001", "010", "001", "110"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "110"],
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["101", "111", "111", "111", "101"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "111", "011"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
};

export const pixelTextWidth = (text: string, scale = 1): number =>
  Math.max(0, (text.length * 4 - 1) * scale);

export const drawPixelText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  scale = 1,
): void => {
  context.fillStyle = color;
  [...text.toUpperCase()].forEach((character, characterIndex) => {
    const glyph = PIXEL_GLYPHS[character] ?? PIXEL_GLYPHS[" "];
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((pixel, columnIndex) => {
        if (pixel !== "1") return;
        context.fillRect(
          x + (characterIndex * 4 + columnIndex) * scale,
          y + rowIndex * scale,
          scale,
          scale,
        );
      });
    });
  });
};

export const drawTextChip = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  scale = 1,
): void => {
  const width = pixelTextWidth(text, scale) + 6;
  const height = 5 * scale + 6;
  box(context, x, y, width, height, color);
  drawPixelText(context, text, x + 3, y + 3, color, scale);
};

export const drawPerson = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  scale = 1,
): void => {
  context.fillStyle = color;
  context.fillRect(x + scale, y, 3 * scale, 3 * scale);
  context.fillRect(x, y + 4 * scale, 5 * scale, 4 * scale);
  context.fillRect(x, y + 8 * scale, 2 * scale, 3 * scale);
  context.fillRect(x + 3 * scale, y + 8 * scale, 2 * scale, 3 * scale);
};

export const drawSourceCard = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color: string,
): void => {
  box(context, x, y, 34, 17, color, false, 1);
  drawPixelText(context, label, x + 4, y + 4, color);
  box(context, x + 25, y + 4, 5, 2, color, true);
  box(context, x + 25, y + 9, 3, 2, color, true);
};

export const drawMessageCard = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): void => {
  box(context, x, y, width, height, color, false, 2);
};

export const drawDatabase = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  label?: string,
): void => {
  box(context, x, y, width, height, color, false, 2);
  if (label) {
    const labelX = x + Math.floor((width - pixelTextWidth(label)) / 2);
    drawPixelText(context, label, labelX, y + 8, color);
  }
};

export const drawRankedDocument = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  rank: number,
  color: string,
): void => {
  box(context, x, y, 22, 22, color);
  drawPixelText(context, String(rank), x + 3, y + 3, color);
  box(context, x + 10, y + 5, 8, 2, color, true);
  box(context, x + 4, y + 12, 14, 2, color, true);
  box(context, x + 4, y + 17, 9, 2, color, true);
};

export const drawRegisterBank = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  heights: number[],
  progress: number,
  color: string,
): void => {
  box(context, x, y, 52, 49, color, false, 2);
  drawPixelText(context, "HLL", x + 4, y + 4, color);
  line(
    context,
    { x: x + 5, y: y + 42 },
    { x: x + 47, y: y + 42 },
    color,
  );
  heights.forEach((height, index) => {
    const visibleHeight = Math.round(height * clamp(progress));
    if (!visibleHeight) return;
    box(
      context,
      x + 6 + index * 6,
      y + 41 - visibleHeight,
      3,
      visibleHeight,
      color,
      true,
    );
  });
};

export const drawMetricCard = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  color: string,
  progress = 1,
): void => {
  box(context, x, y, width, 47, color, false, 2);
  drawPixelText(context, label, x + 5, y + 6, color);
  const valueX = x + Math.floor((width - pixelTextWidth(value, 2)) / 2);
  withAlpha(context, progress, () => {
    drawPixelText(context, value, valueX, y + 21, color, 2);
  });
};

export const drawRiskBar = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  progress: number,
  color: string,
): void => {
  box(context, x, y, width, 4, color);
  const fillWidth = Math.round((width - 2) * clamp(progress));
  if (fillWidth) box(context, x + 1, y + 1, fillWidth, 2, color, true);
};

export const drawCustomerCard = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  risk: number,
  color: string,
  selected = false,
): void => {
  box(context, x, y, 34, 25, color, false, selected ? 2 : 1);
  drawPerson(context, x + 4, y + 6, color);
  drawPixelText(context, label, x + 14, y + 5, color);
  drawRiskBar(context, x + 14, y + 15, 15, risk, color);
  if (selected) {
    box(context, x + 29, y + 3, 3, 3, color, true);
  }
};

export const drawContainer = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  label?: string,
): void => {
  box(context, x, y, width, height, color, false, 2);
  [6, 12, 18].forEach((offset) => {
    if (offset < width - 2) {
      line(
        context,
        { x: x + offset, y: y + 3 },
        { x: x + offset, y: y + height - 4 },
        color,
      );
    }
  });
  if (label) {
    drawPixelText(context, label, x + 3, y + height + 3, color);
  }
};

export const drawCheck = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void => {
  line(context, { x, y }, { x: x + 5, y: y + 5 }, color, 2);
  line(
    context,
    { x: x + 5, y: y + 5 },
    { x: x + 13, y: y - 5 },
    color,
    2,
  );
};

export const drawTarget = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void => {
  box(context, x - 12, y - 12, 25, 25, color);
  box(context, x - 6, y - 6, 13, 13, color);
  box(context, x - 1, y - 1, 3, 3, color, true);
};

export const drawComparisonMatrix = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  values: number[],
  color: string,
  reveal = 1,
): void => {
  box(context, x, y, 72, 58, color, false, 2);
  drawPixelText(context, label, x + 5, y + 5, color);
  values.forEach((value, index) => {
    const rowReveal = progressBetween(reveal, index * 0.12, 0.62 + index * 0.08);
    if (!rowReveal) return;
    drawPixelText(context, String(index + 1), x + 5, y + 17 + index * 8, color);
    box(
      context,
      x + 14,
      y + 18 + index * 8,
      Math.round(value * rowReveal),
      3,
      color,
      true,
    );
  });
};
