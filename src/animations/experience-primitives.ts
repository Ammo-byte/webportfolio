import { readThemePalette } from "../core";

export interface ScenePalette {
  blue: string;
  faint: string;
  ink: string;
  muted: string;
  surface: string;
}

export interface ScenePoint {
  x: number;
  y: number;
}

export const SCENE_WIDTH = 210;
export const SCENE_HEIGHT = 85;
// Scene timings use this rate; rendering follows the browser refresh rate.
export const SCENE_FPS = 30;

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
): number => {
  const progress = clamp((frame - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
};

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
  context.globalAlpha *= clamp(alpha);
  draw();
  context.restore();
};

export const line = (
  context: CanvasRenderingContext2D,
  from: ScenePoint,
  to: ScenePoint,
  color: string,
  thickness = 1,
): void => {
  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = Math.max(0.75, thickness * 0.65);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
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
  if (width <= 0 || height <= 0) return;
  const strokeWidth = Math.max(0.75, thickness * 0.65);
  const inset = fill ? 0 : strokeWidth / 2;
  context.beginPath();
  context.roundRect(
    x + inset,
    y + inset,
    Math.max(0, width - inset * 2),
    Math.max(0, height - inset * 2),
    Math.min(fill ? 1.5 : 3.5, width / 4, height / 4),
  );
  if (fill) {
    context.fillStyle = color;
    context.fill();
  } else {
    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
    context.stroke();
  }
};

const strokeProgress = (
  context: CanvasRenderingContext2D,
  points: ScenePoint[],
  progress: number,
  color: string,
  thickness: number,
  dashed = false,
): void => {
  if (points.length < 2 || progress <= 0) return;
  const lengths = points
    .slice(1)
    .map((point, index) =>
      Math.hypot(point.x - points[index].x, point.y - points[index].y),
    );
  let remaining =
    lengths.reduce((sum, length) => sum + length, 0) * clamp(progress);
  context.save();
  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = Math.max(0.75, thickness * 0.65);
  context.lineCap = "round";
  context.lineJoin = "round";
  if (dashed) context.setLineDash([2.5, 2.5]);
  context.moveTo(points[0].x, points[0].y);
  lengths.forEach((length, index) => {
    if (remaining <= 0 || !length) return;
    const segment = Math.min(1, remaining / length);
    const from = points[index];
    const to = points[index + 1];
    context.lineTo(
      from.x + (to.x - from.x) * segment,
      from.y + (to.y - from.y) * segment,
    );
    remaining -= length;
  });
  context.stroke();
  context.restore();
};

export const progressivePath = (
  context: CanvasRenderingContext2D,
  nodes: ScenePoint[],
  pathProgress: number,
  colors: ScenePalette,
  thickness = 1,
): void => {
  strokeProgress(context, nodes, pathProgress, colors.blue, thickness);
};

export const progressivePolyline = (
  context: CanvasRenderingContext2D,
  points: ScenePoint[],
  lineProgress: number,
  colors: ScenePalette,
  thickness = 2,
): void => {
  strokeProgress(context, points, lineProgress, colors.blue, thickness);
};

export const progressiveDashedPath = (
  context: CanvasRenderingContext2D,
  points: ScenePoint[],
  pathProgress: number,
  colors: ScenePalette,
): void => {
  strokeProgress(context, points, pathProgress, colors.blue, 1.5, true);
};

export const drawPanel = (
  context: CanvasRenderingContext2D,
  colors: ScenePalette,
): void => {
  context.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  context.fillStyle = colors.surface;
  context.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
};

export const sceneTextWidth = (text: string, scale = 1): number =>
  Math.max(0, (text.length * 4 - 1) * scale);

export const drawSceneText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  scale = 1,
): void => {
  context.save();
  context.fillStyle = color;
  context.font = `600 ${6.5 * scale}px -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
  context.textBaseline = "top";
  context.fillText(
    text.toUpperCase(),
    x,
    y - 0.5 * scale,
    sceneTextWidth(text, scale),
  );
  context.restore();
};

export const drawTextChip = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  scale = 1,
): void => {
  const width = sceneTextWidth(text, scale) + 6;
  const height = 5 * scale + 6;
  box(context, x, y, width, height, color);
  drawSceneText(context, text, x + 3, y + 3, color, scale);
};

export const drawPerson = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  scale = 1,
): void => {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x + 2.5 * scale, y + 1.5 * scale, 1.5 * scale, 0, Math.PI * 2);
  context.fill();
  box(context, x, y + 4 * scale, 5 * scale, 4 * scale, color, true);
  line(
    context,
    { x: x + scale, y: y + 7 * scale },
    { x: x + scale, y: y + 10 * scale },
    color,
    1.8 * scale,
  );
  line(
    context,
    { x: x + 4 * scale, y: y + 7 * scale },
    { x: x + 4 * scale, y: y + 10 * scale },
    color,
    1.8 * scale,
  );
};

export const drawSourceCard = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color: string,
): void => {
  box(context, x, y, 34, 17, color, false, 1);
  drawSceneText(context, label, x + 4, y + 4, color);
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
    const labelX = x + Math.floor((width - sceneTextWidth(label)) / 2);
    drawSceneText(context, label, labelX, y + 8, color);
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
  drawSceneText(context, String(rank), x + 3, y + 3, color);
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
  drawSceneText(context, "HLL", x + 4, y + 4, color);
  line(
    context,
    { x: x + 5, y: y + 42 },
    { x: x + 47, y: y + 42 },
    color,
  );
  heights.forEach((height, index) => {
    const visibleHeight = height * clamp(progress);
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
  drawSceneText(context, label, x + 5, y + 6, color);
  const valueX = x + Math.floor((width - sceneTextWidth(value, 2)) / 2);
  withAlpha(context, progress, () => {
    drawSceneText(context, value, valueX, y + 21, color, 2);
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
  const fillWidth = (width - 2) * clamp(progress);
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
  drawSceneText(context, label, x + 14, y + 5, color);
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
    drawSceneText(context, label, x + 3, y + height + 3, color);
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
  context.strokeStyle = color;
  context.lineWidth = 0.8;
  [12, 6].forEach((radius) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();
  });
  context.beginPath();
  context.arc(x, y, 1.5, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
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
  drawSceneText(context, label, x + 5, y + 5, color);
  values.forEach((value, index) => {
    const rowReveal = progressBetween(reveal, index * 0.12, 0.62 + index * 0.08);
    if (!rowReveal) return;
    drawSceneText(context, String(index + 1), x + 5, y + 17 + index * 8, color);
    box(
      context,
      x + 14,
      y + 18 + index * 8,
      value * rowReveal,
      3,
      color,
      true,
    );
  });
};
