import {
  currentTheme,
  readThemePalette,
  reducedMotion,
  type ParticleController,
  type Theme,
} from "../core";

interface Point {
  x: number;
  y: number;
}

interface Gaussian extends Point {
  sigmaX: number;
  sigmaY: number;
  angle: number;
  amplitude: number;
}

interface PreparedGaussian extends Point {
  cosine: number;
  sine: number;
  inverseX: number;
  inverseY: number;
  amplitude: number;
}

interface ContourNode extends Point {
  neighbors: number[];
}

interface ContourPath {
  points: Point[];
  closed: boolean;
}

interface ContourLevel {
  anchor: boolean;
  paths: ContourPath[];
}

interface CachedContour {
  anchor: boolean;
  path: Path2D;
}

const CYCLE_MS = 52_000;
const FRAME_MS = 1000 / 24;
const PULSE_MS = 850;
const CASE_EDGES: readonly (readonly (readonly [number, number])[])[] = [
  [], [[3, 0]], [[0, 1]], [[3, 1]], [[1, 2]], [], [[0, 2]], [[3, 2]],
  [[2, 3]], [[0, 2]], [], [[1, 2]], [[1, 3]], [[0, 1]], [[3, 0]], [],
];

const clamp = (value: number, minimum = 0, maximum = 1): number =>
  Math.min(maximum, Math.max(minimum, value));

const densityRegions = (
  width: number,
  height: number,
  elapsed: number,
  shift: Point,
): Gaussian[] => {
  const phase = (elapsed / CYCLE_MS) * Math.PI * 2;
  const compact = width <= 620;
  return [
    {
      x: (compact ? 1.22 : 1.07) + Math.sin(phase) * 0.038 + shift.x / width,
      y: 0.24 + Math.cos(phase) * 0.036 + shift.y / height,
      sigmaX: compact ? 0.62 : 0.4,
      sigmaY: 0.5,
      angle: -0.32 + Math.sin(phase) * 0.025,
      amplitude: 1,
    },
    {
      x: (compact ? -0.45 : -0.13) + Math.sin(phase + 0.8) * 0.038,
      y: 0.85 + Math.cos(phase + 0.8) * 0.043,
      sigmaX: compact ? 0.62 : 0.44,
      sigmaY: 0.38,
      angle: 0.24 + Math.sin(phase + 0.8) * 0.02,
      amplitude: 0.9,
    },
    {
      x: 0.72 + Math.sin(phase + 2) * 0.04,
      y: 1.1 + Math.cos(phase + 2) * 0.026,
      sigmaX: compact ? 0.78 : 0.53,
      sigmaY: 0.32,
      angle: -0.14,
      amplitude: 0.72,
    },
  ];
};

const prepareRegions = (regions: Gaussian[]): PreparedGaussian[] =>
  regions.map((region) => ({
    x: region.x,
    y: region.y,
    cosine: Math.cos(region.angle),
    sine: Math.sin(region.angle),
    inverseX: 1 / region.sigmaX ** 2,
    inverseY: 1 / region.sigmaY ** 2,
    amplitude: region.amplitude,
  }));

const sampleDensity = (
  x: number,
  y: number,
  regions: PreparedGaussian[],
): number => {
  let value = 0;
  regions.forEach((region) => {
    const dx = x - region.x;
    const dy = y - region.y;
    const rotatedX = dx * region.cosine + dy * region.sine;
    const rotatedY = -dx * region.sine + dy * region.cosine;
    value += region.amplitude * Math.exp(
      -0.5 * (rotatedX ** 2 * region.inverseX + rotatedY ** 2 * region.inverseY),
    );
  });
  return value;
};

const traceLevel = (
  values: Float64Array,
  columns: number,
  rows: number,
  width: number,
  height: number,
  level: number,
  regions: PreparedGaussian[],
): ContourPath[] => {
  const nodes = new Map<number, ContourNode>();
  const stepX = width / columns;
  const stepY = height / rows;
  const horizontalCount = (rows + 1) * columns;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const top = row * (columns + 1) + column;
      const bottom = top + columns + 1;
      const a = values[top];
      const b = values[top + 1];
      const c = values[bottom + 1];
      const d = values[bottom];
      const code =
        (a > level ? 1 : 0) | (b > level ? 2 : 0) |
        (c > level ? 4 : 0) | (d > level ? 8 : 0);
      if (code === 0 || code === 15) continue;
      let pairs = CASE_EDGES[code];
      if (code === 5 || code === 10) {
        const centerHigh = sampleDensity(
          (column + 0.5) / columns,
          (row + 0.5) / rows,
          regions,
        ) > level;
        pairs = (code === 5) === centerHigh
          ? [[0, 1], [2, 3]]
          : [[0, 3], [1, 2]];
      }

      const edgeNode = (edge: number): number => {
        let key: number;
        let x: number;
        let y: number;
        if (edge === 0 || edge === 2) {
          const edgeRow = row + (edge === 2 ? 1 : 0);
          key = edgeRow * columns + column;
          const start = edge === 0 ? a : d;
          const end = edge === 0 ? b : c;
          const progress = clamp((level - start) / (end - start));
          x = (column + progress) * stepX;
          y = edgeRow * stepY;
        } else {
          const edgeColumn = column + (edge === 1 ? 1 : 0);
          key = horizontalCount + row * (columns + 1) + edgeColumn;
          const start = edge === 1 ? b : a;
          const end = edge === 1 ? c : d;
          const progress = clamp((level - start) / (end - start));
          x = edgeColumn * stepX;
          y = (row + progress) * stepY;
        }
        if (!nodes.has(key)) nodes.set(key, { x, y, neighbors: [] });
        return key;
      };
      pairs.forEach(([firstEdge, secondEdge]) => {
        const first = edgeNode(firstEdge);
        const second = edgeNode(secondEdge);
        nodes.get(first)?.neighbors.push(second);
        nodes.get(second)?.neighbors.push(first);
      });
    }
  }

  const visited = new Set<number>();
  const paths: ContourPath[] = [];
  const walk = (start: number): void => {
    const points: Point[] = [];
    let previous = -1;
    let current = start;
    let closed = false;
    while (!visited.has(current)) {
      const node = nodes.get(current);
      if (!node) break;
      visited.add(current);
      points.push({ x: node.x, y: node.y });
      const next = node.neighbors.find((neighbor) => neighbor !== previous);
      if (next === undefined) break;
      previous = current;
      current = next;
      if (current === start) {
        closed = true;
        break;
      }
    }
    if (points.length > 1) paths.push({ points, closed });
  };
  nodes.forEach((node, key) => {
    if (node.neighbors.length === 1 && !visited.has(key)) walk(key);
  });
  nodes.forEach((_node, key) => {
    if (!visited.has(key)) walk(key);
  });
  return paths;
};

export const createBackgroundContours = (
  width: number,
  height: number,
  elapsed = 0,
  shift: Point = { x: 0, y: 0 },
): ContourLevel[] => {
  const compact = width <= 620;
  const cellSize = compact
    ? 58
    : Math.max(48, Math.sqrt((width * height) / 1000));
  const columns = Math.max(2, Math.ceil(width / cellSize));
  const rows = Math.max(2, Math.ceil(height / cellSize));
  const regions = prepareRegions(densityRegions(width, height, elapsed, shift));
  const values = new Float64Array((columns + 1) * (rows + 1));
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      values[row * (columns + 1) + column] = sampleDensity(
        column / columns,
        row / rows,
        regions,
      );
    }
  }
  const levels = compact
    ? [0.2, 0.38, 0.6, 0.82, 1.02, 1.12]
    : [0.18, 0.28, 0.39, 0.52, 0.65, 0.79, 0.93, 1.04];
  return levels.map((level, index) => ({
    anchor: compact ? index === 1 || index === 4 : index === 2 || index === 5,
    paths: traceLevel(values, columns, rows, width, height, level, regions),
  }));
};

const midpoint = (first: Point, second: Point): Point => ({
  x: (first.x + second.x) / 2,
  y: (first.y + second.y) / 2,
});

export const contourSvgPath = (path: ContourPath): string => {
  const { points, closed } = path;
  const point = (value: Point): string =>
    `${value.x.toFixed(2)} ${value.y.toFixed(2)}`;
  if (closed) {
    let result = `M${point(midpoint(points[0], points[1]))}`;
    for (let index = 1; index <= points.length; index += 1) {
      const current = points[index % points.length];
      const next = points[(index + 1) % points.length];
      result += `Q${point(current)} ${point(midpoint(current, next))}`;
    }
    return `${result}Z`;
  }
  let result = `M${point(points[0])}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    result += `Q${point(points[index])} ${point(midpoint(points[index], points[index + 1]))}`;
  }
  return `${result}L${point(points[points.length - 1])}`;
};

const drawContourPath = (
  context: Pick<
    CanvasRenderingContext2D,
    "moveTo" | "lineTo" | "quadraticCurveTo" | "closePath"
  >,
  path: ContourPath,
): void => {
  const { points, closed } = path;
  if (closed) {
    const start = midpoint(points[0], points[1]);
    context.moveTo(start.x, start.y);
    for (let index = 1; index <= points.length; index += 1) {
      const current = points[index % points.length];
      const next = points[(index + 1) % points.length];
      const end = midpoint(current, next);
      context.quadraticCurveTo(current.x, current.y, end.x, end.y);
    }
    context.closePath();
    return;
  }
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length - 1; index += 1) {
    const end = midpoint(points[index], points[index + 1]);
    context.quadraticCurveTo(points[index].x, points[index].y, end.x, end.y);
  }
  const last = points[points.length - 1];
  context.lineTo(last.x, last.y);
};

class ContourBackground implements ParticleController {
  private readonly context: CanvasRenderingContext2D | null;
  private readonly finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  );
  private palette = readThemePalette();
  private theme = currentTheme();
  private contours: CachedContour[] = [];
  private width = 640;
  private height = 480;
  private elapsed = 0;
  private pulseRemaining = 0;
  private shift: Point = { x: 0, y: 0 };
  private pointer: Point = { x: 0, y: 0 };
  private pointerActive = false;
  private inView = false;
  private paused = false;
  private overlayOpen = false;
  private frame = 0;
  private running = false;
  private lastFrameTime: number | null = null;
  private accumulatedTime = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.context = canvas.getContext("2d");
    canvas.setAttribute("aria-hidden", "true");
    if (!this.context) return;
    this.resize();
    const rect = canvas.getBoundingClientRect();
    this.inView =
      rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
    const intersectionObserver = new IntersectionObserver((entries) => {
      this.inView = entries.some((entry) => entry.isIntersecting);
      this.refresh();
    });
    intersectionObserver.observe(canvas);
    const resizeObserver = new ResizeObserver(() => this.resize());
    resizeObserver.observe(canvas);
    window.addEventListener("resize", () => this.resize());

    const updateOverlays = (): void => {
      this.overlayOpen = document.body.matches(
        ".menu-open, .modal-open, .arcade-open",
      );
      if (this.overlayOpen) this.pointerActive = false;
      this.refresh();
    };
    const overlayObserver = new MutationObserver(updateOverlays);
    overlayObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    updateOverlays();
    window.addEventListener("pointermove", (event) => {
      if (
        !this.inView ||
        this.paused ||
        this.overlayOpen ||
        document.hidden ||
        reducedMotion.matches ||
        !this.finePointer.matches ||
        event.pointerType === "touch"
      ) {
        return;
      }
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      this.pointerActive =
        x >= 0 && x <= bounds.width && y >= 0 && y <= bounds.height;
      if (this.pointerActive) this.pointer = { x, y };
    });
    window.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) this.pointerActive = false;
    });
    this.finePointer.addEventListener("change", () => {
      this.pointerActive = false;
      this.shift = { x: 0, y: 0 };
      this.draw();
    });
    document.addEventListener("visibilitychange", () => {
      this.pointerActive = false;
      this.refresh();
    });
    reducedMotion.addEventListener("change", () => {
      this.stop();
      this.pointerActive = false;
      this.shift = { x: 0, y: 0 };
      this.pulseRemaining = 0;
      this.draw();
      this.refresh();
    });
    window.addEventListener("portfolio:theme", () => this.setTheme(currentTheme()));
    this.refresh();
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    this.palette = readThemePalette();
    this.draw();
  }

  pause(paused: boolean): void {
    this.paused = paused;
    if (paused) this.pointerActive = false;
    this.refresh();
  }

  pulse(): void {
    if (reducedMotion.matches) return;
    this.pulseRemaining = PULSE_MS;
    this.refresh();
  }

  private resize(): void {
    if (!this.context) return;
    const rect = this.canvas.getBoundingClientRect();
    const nextWidth = rect.width > 0 ? rect.width : this.width;
    const nextHeight = rect.height > 0 ? rect.height : this.height;
    const geometryChanged =
      nextWidth !== this.width || nextHeight !== this.height || !this.contours.length;
    this.width = nextWidth;
    this.height = nextHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(this.width * ratio);
    const height = Math.round(this.height * ratio);
    const backingChanged =
      this.canvas.width !== width || this.canvas.height !== height;
    if (!geometryChanged && !backingChanged) return;
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    if (geometryChanged) {
      this.contours = createBackgroundContours(this.width, this.height).map(
        (contour) => {
          const path = new Path2D();
          contour.paths.forEach((points) => drawContourPath(path, points));
          return { anchor: contour.anchor, path };
        },
      );
      this.pointerActive = false;
      this.shift = { x: 0, y: 0 };
    }
    this.draw();
  }

  private refresh(): void {
    if (
      this.paused ||
      !this.inView ||
      this.overlayOpen ||
      document.hidden ||
      reducedMotion.matches
    ) {
      this.stop();
      return;
    }
    if (this.running || !this.context) return;
    this.running = true;
    this.frame = window.requestAnimationFrame(this.tick);
  }

  private stop(): void {
    this.running = false;
    window.cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.lastFrameTime = null;
    this.accumulatedTime = 0;
  }

  private tick = (time: number): void => {
    if (!this.running) return;
    if (this.lastFrameTime !== null) {
      this.accumulatedTime += Math.min(time - this.lastFrameTime, 80);
    }
    this.lastFrameTime = time;
    if (this.accumulatedTime >= FRAME_MS) {
      const delta = this.accumulatedTime - (this.accumulatedTime % FRAME_MS);
      this.accumulatedTime %= FRAME_MS;
      this.elapsed = (this.elapsed + delta) % CYCLE_MS;
      this.pulseRemaining = Math.max(0, this.pulseRemaining - delta);
      let desiredShift: Point = { x: 0, y: 0 };
      if (this.pointerActive) {
        desiredShift = {
          x: clamp((this.pointer.x / this.width) * 2 - 1, -1, 1) * 8,
          y: clamp((this.pointer.y / this.height) * 2 - 1, -1, 1) * 6,
        };
        const distance = Math.hypot(desiredShift.x, desiredShift.y);
        if (distance > 8) {
          desiredShift.x *= 8 / distance;
          desiredShift.y *= 8 / distance;
        }
      }
      const smoothing = 1 - Math.exp(-delta / 600);
      this.shift.x += (desiredShift.x - this.shift.x) * smoothing;
      this.shift.y += (desiredShift.y - this.shift.y) * smoothing;
      this.draw();
    }
    this.frame = window.requestAnimationFrame(this.tick);
  };

  private draw(): void {
    const context = this.context;
    if (!context) return;
    context.setTransform(
      this.canvas.width / this.width, 0, 0,
      this.canvas.height / this.height, 0, 0,
    );
    context.clearRect(0, 0, this.width, this.height);
    const phase = (this.elapsed / CYCLE_MS) * Math.PI * 2;
    const compact = this.width <= 620;
    // Move the cached field as one continuous orbit, keeping every curve stable.
    const driftX = reducedMotion.matches ? 0 : Math.sin(phase) * (compact ? 16 : 24);
    const driftY = reducedMotion.matches ? 0 : (Math.cos(phase) - 1) * (compact ? 10 : 12);
    const shiftX = reducedMotion.matches ? 0 : this.shift.x;
    const shiftY = reducedMotion.matches ? 0 : this.shift.y;
    const overscan = compact ? 28 : 36;
    context.save();
    context.translate(-overscan + driftX + shiftX, -overscan + driftY + shiftY);
    context.scale(
      (this.width + overscan * 2) / this.width,
      (this.height + overscan * 2) / this.height,
    );
    const pulse = this.pulseRemaining > 0
      ? Math.sin((1 - this.pulseRemaining / PULSE_MS) * Math.PI)
      : 0;
    context.strokeStyle = this.palette.blue;
    context.lineCap = "round";
    context.lineJoin = "round";
    this.contours.forEach((contour) => {
      const alpha = contour.anchor
        ? (this.theme === "dark" ? 0.46 : 0.35)
        : (this.theme === "dark" ? 0.24 : 0.2);
      context.globalAlpha = alpha * (1 + pulse * 0.08);
      context.lineWidth = contour.anchor ? 1.2 : 0.9;
      context.stroke(contour.path);
    });
    context.restore();
    context.globalAlpha = 1;
    if (this.canvas.dataset.ready !== "true") {
      this.canvas.dataset.ready = "true";
    }
  }
}

export const initBackgroundField = (
  canvas: HTMLCanvasElement | null,
): ParticleController =>
  canvas
    ? new ContourBackground(canvas)
    : {
        setTheme: () => {},
        pause: () => {},
        pulse: () => {},
      };
