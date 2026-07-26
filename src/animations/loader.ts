import {
  body,
  readStorage,
  readThemePalette,
  reducedMotion,
  writeStorage,
} from "../core";

interface Point {
  x: number;
  y: number;
}

const signalPixels = [
  [0.1, 0.15, 1],
  [0.2, 0.49, 2],
  [0.34, 0.74, 1],
  [0.48, 0.12, 1],
  [0.65, 0.2, 2],
  [0.76, 0.81, 2],
  [0.86, 0.58, 1],
  [0.91, 0.14, 1],
] as const;

const sampleCurve = (
  width: number,
  height: number,
  start: Point,
  control: Point,
  end: Point,
  count: number,
): Point[] =>
  Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    const inverse = 1 - progress;
    return {
      x: Math.round(
        (inverse * inverse * start.x +
          2 * inverse * progress * control.x +
          progress * progress * end.x) *
          width,
      ),
      y: Math.round(
        (inverse * inverse * start.y +
          2 * inverse * progress * control.y +
          progress * progress * end.y) *
          height,
      ),
    };
  });

const plotLine = (
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  thickness = 1,
): void => {
  let x = from.x;
  let y = from.y;
  const dx = Math.abs(to.x - x);
  const sx = x < to.x ? 1 : -1;
  const dy = -Math.abs(to.y - y);
  const sy = y < to.y ? 1 : -1;
  let error = dx + dy;

  while (true) {
    context.fillRect(x, y, thickness, thickness);
    if (x === to.x && y === to.y) break;
    const doubled = 2 * error;
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

class TelemetryCanvas {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private height = 0;
  private width = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Loader canvas is unavailable.");
    this.context = context;
    this.resize = this.resize.bind(this);
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  draw(progress: number): void {
    const palette = readThemePalette();
    const blue = palette.blue;
    const ink = palette.ink;
    const line = palette.grid;
    const faintBlue = palette.faint;

    this.context.clearRect(0, 0, this.width, this.height);
    this.context.imageSmoothingEnabled = false;
    this.context.fillStyle = line;

    const grid = Math.max(20, Math.round(this.width / 12));
    for (let x = 0; x < this.width; x += grid) {
      this.context.fillRect(x, 0, 1, this.height);
    }
    for (let y = 0; y < this.height; y += grid) {
      this.context.fillRect(0, y, this.width, 1);
    }

    signalPixels.forEach(([x, y, size], index) => {
      const visible = progress >= index * 0.08;
      if (!visible) return;
      this.context.fillStyle = index % 3 === 0 ? ink : blue;
      this.context.globalAlpha = index % 3 === 0 ? 0.82 : 1;
      this.context.fillRect(
        Math.round(x * this.width),
        Math.round(y * this.height),
        size + 1,
        size + 1,
      );
    });
    this.context.globalAlpha = 1;

    const leftPath = sampleCurve(
      this.width,
      this.height,
      { x: -0.02, y: 0.76 },
      { x: 0.12, y: 0.58 },
      { x: 0.39, y: 0.49 },
      22,
    );
    const rightPath = sampleCurve(
      this.width,
      this.height,
      { x: 0.58, y: 0.44 },
      { x: 0.79, y: 0.36 },
      { x: 1.02, y: 0.16 },
      22,
    );
    const leftProgress = Math.min(progress * 2, 1);
    const rightProgress = Math.max(0, (progress - 0.5) * 2);
    this.drawPath(leftPath, leftProgress, faintBlue, blue);
    this.drawPath(rightPath, rightProgress, faintBlue, blue);
  }

  private drawPath(
    points: Point[],
    progress: number,
    faint: string,
    active: string,
  ): void {
    const visible = Math.max(1, Math.ceil(points.length * progress));
    this.context.fillStyle = faint;
    points.slice(0, -1).forEach((point, index) => {
      plotLine(this.context, point, points[index + 1]);
    });
    this.context.fillStyle = active;
    points.slice(0, Math.max(0, visible - 1)).forEach((point, index) => {
      plotLine(this.context, point, points[index + 1]);
    });

    [3, 11, 19].forEach((index) => {
      const point = points[index];
      this.context.strokeStyle = index < visible ? active : faint;
      this.context.lineWidth = 1;
      this.context.strokeRect(point.x - 2, point.y - 2, 5, 5);
    });
  }

  private resize(): void {
    const scale = window.innerWidth < 620 ? 3 : 4;
    this.width = Math.max(180, Math.ceil(window.innerWidth / scale));
    this.height = Math.max(240, Math.ceil(window.innerHeight / scale));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.draw(0);
  }
}

export const initLoader = (): void => {
  const loader = document.querySelector<HTMLElement>("#site-loader");
  const canvas = document.querySelector<HTMLCanvasElement>("#loader-canvas");
  const progressLabel =
    document.querySelector<HTMLElement>("#loader-progress");
  const status = document.querySelector<HTMLElement>("#loader-status");
  const skip = document.querySelector<HTMLButtonElement>("#loader-skip");
  const lights = Array.from(
    loader?.querySelectorAll<HTMLElement>(".loader-lights span") ?? [],
  );

  if (!loader || !canvas || !progressLabel) {
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
    return;
  }

  const telemetry = new TelemetryCanvas(canvas);
  let finished = false;
  let frame = 0;
  let lastAnnouncement = -1;

  const finish = (): void => {
    if (finished) return;
    finished = true;
    window.cancelAnimationFrame(frame);
    progressLabel.textContent = "100";
    telemetry.draw(1);
    lights.forEach((light) => light.classList.add("complete"));
    status && (status.textContent = "Portfolio ready");
    loader.classList.add("finished");
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
    window.setTimeout(() => loader.classList.add("complete"), 360);
    writeStorage(sessionStorage, "portfolioLoaderSeen", "1");
    window.dispatchEvent(new CustomEvent("portfolio:ready"));
  };

  window.__portfolioUnlockLoader = finish;
  skip?.addEventListener("click", finish);
  loader.classList.add("started");

  const preview =
    new URLSearchParams(window.location.search).get("loader") === "preview";
  const seen =
    !preview && Boolean(readStorage(sessionStorage, "portfolioLoaderSeen"));
  const duration = reducedMotion.matches
    ? 80
    : preview
      ? 3600
      : seen
        ? 1800
        : 3000;
  const start = performance.now();

  const tick = (time: number): void => {
    const linear = Math.min((time - start) / duration, 1);
    const frameProgress = reducedMotion.matches
      ? 1
      : Math.floor(linear * 20) / 20;
    const percent = Math.min(100, Math.floor(linear * 100));
    const announced = Math.floor(percent / 25) * 25;

    progressLabel.textContent = String(percent).padStart(2, "0");
    telemetry.draw(frameProgress);
    loader.style.setProperty("--loader-progress", String(frameProgress));
    lights.forEach((light, index) => {
      light.classList.toggle(
        "active",
        percent >= index * 20 && percent < (index + 1) * 20,
      );
      light.classList.toggle("complete", percent >= (index + 1) * 20);
    });
    if (status && announced !== lastAnnouncement) {
      status.textContent = `Loading portfolio: ${announced}%`;
      lastAnnouncement = announced;
    }

    if (linear < 1) {
      frame = window.requestAnimationFrame(tick);
    } else {
      window.setTimeout(finish, reducedMotion.matches ? 0 : 420);
    }
  };

  frame = window.requestAnimationFrame(tick);
};
