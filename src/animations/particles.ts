import {
  readThemePalette,
  reducedMotion,
  type ParticleController,
  type Theme,
} from "../core";

interface NetworkParticle {
  hollow: boolean;
  opacity: number;
  size: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

interface PointerState {
  active: boolean;
  x: number;
  y: number;
}

export interface PixelFieldOptions {
  restrained?: boolean;
  container?: HTMLElement;
}

export class PixelField implements ParticleController {
  private readonly canvas: HTMLCanvasElement | null;
  private readonly context: CanvasRenderingContext2D | null;
  private readonly restrained: boolean;
  private readonly container: HTMLElement | null;
  private readonly finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  );
  private accumulatedFrameTime = 0;
  private frame = 0;
  private lastFrameTime = 0;
  private palette = readThemePalette();
  private particles: NetworkParticle[] = [];
  private pointer: PointerState = { active: false, x: 0, y: 0 };
  private pulseUntil = 0;
  private resizeTimer = 0;
  private running = false;
  private paused = false;
  private inView = true;
  private overlayOpen = false;
  private width = 0;
  private height = 0;

  constructor(canvas: HTMLCanvasElement | null, options: PixelFieldOptions = {}) {
    this.canvas = canvas;
    this.context = canvas?.getContext("2d") ?? null;
    this.restrained = options.restrained ?? false;
    this.container = options.container ?? null;
    this.resize = this.resize.bind(this);
    this.drawFrame = this.drawFrame.bind(this);

    if (!this.context || !this.canvas) return;

    this.resize();
    window.addEventListener("resize", () => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(this.resize, 120);
    });
    window.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      if (this.restrained) {
        if (!this.finePointer.matches) return;
        const rect = this.canvas?.getBoundingClientRect();
        if (!rect) return;
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.pointer = {
          active: x >= 0 && x <= this.width && y >= 0 && y <= this.height,
          x,
          y,
        };
      } else {
        this.pointer = { active: true, x: event.clientX, y: event.clientY };
      }
    });
    window.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) this.pointer.active = false;
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stop();
      else this.start();
    });
    reducedMotion.addEventListener("change", () => {
      this.stop();
      this.resize();
      if (!reducedMotion.matches) this.start();
    });
    if (this.restrained) this.observeAvailability();
    this.start();
  }

  private observeAvailability(): void {
    const container = this.container ?? this.canvas;
    if (container) {
      const rect = container.getBoundingClientRect();
      this.inView = rect.bottom > 0 && rect.top < window.innerHeight;
      const observer = new IntersectionObserver((entries) => {
        this.inView = entries.some((entry) => entry.isIntersecting);
        this.refreshAvailability();
      });
      observer.observe(container);
      const resizeObserver = new ResizeObserver(this.resize);
      resizeObserver.observe(container);
    }
    const updateOverlays = (): void => {
      this.overlayOpen = document.body.matches(
        ".menu-open, .modal-open, .arcade-open",
      );
      this.refreshAvailability();
    };
    const observer = new MutationObserver(updateOverlays);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    updateOverlays();
    window.addEventListener(
      "scroll",
      () => { this.pointer.active = false; },
      { passive: true },
    );
    this.finePointer.addEventListener("change", () => {
      this.pointer.active = false;
    });
  }

  private refreshAvailability(): void {
    if (this.paused || !this.inView || this.overlayOpen || document.hidden) {
      this.stop();
    }
    else this.start();
  }

  setTheme(_theme: Theme): void {
    this.palette = readThemePalette();
    this.render(performance.now());
  }

  pulse(): void {
    this.pulseUntil = performance.now() + 520;
    this.start();
  }

  pause(paused: boolean): void {
    if (this.restrained) this.paused = paused;
    if (paused) {
      this.stop();
      this.render(performance.now());
    } else {
      this.start();
    }
  }

  private createParticle(
    width: number,
    height: number,
    mobile: boolean,
  ): NetworkParticle {
    const angle = Math.random() * Math.PI * 2;
    const speed = this.restrained
      ? 0.025 + Math.random() * 0.018
      : Math.random() * (mobile ? 0.15 : 0.225);
    const sizes = mobile ? [2, 2, 3] : [2, 3, 3, 4];

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: this.restrained
        ? 1.5 + Math.random() * 1.4
        : sizes[Math.floor(Math.random() * sizes.length)],
      opacity: this.restrained
        ? 0.16 + Math.random() * 0.2
        : 0.17 + Math.random() * (mobile ? 0.14 : 0.26),
      hollow: !this.restrained && Math.random() < 0.16,
    };
  }

  private drawPixelLink(
    particle: NetworkParticle,
    other: NetworkParticle,
    distance: number,
    opacity: number,
    pulsing: boolean,
  ): void {
    const context = this.context;
    if (!context) return;

    const dx = other.x - particle.x;
    const dy = other.y - particle.y;
    const spacing = pulsing ? 4 : 5;
    const steps = Math.max(1, Math.floor(distance / spacing));
    const pixelSize = 2;

    context.fillStyle = this.palette.blue;
    context.globalAlpha = opacity;
    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      context.fillRect(
        Math.round(particle.x + dx * progress),
        Math.round(particle.y + dy * progress),
        pixelSize,
        pixelSize,
      );
    }
  }

  private resize(): void {
    if (!this.context || !this.canvas) return;

    const width =
      this.restrained && this.container
        ? Math.max(1, this.container.clientWidth)
        : window.innerWidth;
    const height =
      this.restrained && this.container
        ? Math.max(1, this.container.clientHeight)
        : window.innerHeight;
    this.width = width;
    this.height = height;
    const mobile = width < 620;
    const ratio =
      mobile && !this.restrained
        ? 1
        : Math.min(window.devicePixelRatio || 1, 2);
    const configuredCount = mobile ? 35 : 71;
    const densityCount = Math.round(
      ((width * height) / 1000) * (configuredCount / 800),
    );
    const count = this.restrained
      ? Math.max(18, Math.min(30, Math.round(width / 50)))
      : Math.min(
          mobile ? 48 : 147,
          Math.max(mobile ? 23 : 55, densityCount),
        );

    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.particles = Array.from({ length: count }, () =>
      this.createParticle(width, height, mobile),
    );

    if (reducedMotion.matches) this.render(performance.now());
  }

  private start(): void {
    if (this.running || !this.context || reducedMotion.matches) return;
    if (
      this.restrained &&
      (this.paused || !this.inView || this.overlayOpen || document.hidden)
    ) return;
    this.running = true;
    this.frame = window.requestAnimationFrame(this.drawFrame);
  }

  private stop(): void {
    this.running = false;
    this.accumulatedFrameTime = 0;
    this.lastFrameTime = 0;
    window.cancelAnimationFrame(this.frame);
  }

  private drawFrame(time: number): void {
    if (!this.running) return;
    const mobile = window.innerWidth < 620;
    const frameInterval = 1000 / (mobile || this.restrained ? 30 : 45);
    const elapsed = this.lastFrameTime
      ? time - this.lastFrameTime
      : frameInterval;
    this.lastFrameTime = time;
    this.accumulatedFrameTime += Math.min(elapsed, 100);
    if (this.accumulatedFrameTime >= frameInterval) {
      const renderElapsed = this.accumulatedFrameTime;
      this.accumulatedFrameTime %= frameInterval;
      this.render(time, renderElapsed);
    }
    this.frame = window.requestAnimationFrame(this.drawFrame);
  }

  private render(time: number, elapsed = 0): void {
    const context = this.context;
    if (!context) return;

    const width = this.restrained ? this.width : window.innerWidth;
    const height = this.restrained ? this.height : window.innerHeight;
    const movement = Math.min(Math.max(elapsed, 0), 32) / 16.667;
    const mobile = width < 620;
    const pulsing = time < this.pulseUntil;
    const linkDistance = pulsing ? 156 : mobile ? 110 : 140;
    const linkOpacity = pulsing ? 0.38 : mobile ? 0.17 : 0.27;

    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = this.restrained;
    if (this.restrained && reducedMotion.matches) return;

    this.particles.forEach((particle) => {
      if (!reducedMotion.matches) {
        if (this.pointer.active && !mobile) {
          const dx = particle.x - this.pointer.x;
          const dy = particle.y - this.pointer.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared > 0 && distanceSquared < 82 * 82) {
            const distance = Math.sqrt(distanceSquared);
            const force =
              (1 - distance / 82) *
              (this.restrained ? 0.018 : 0.16) *
              movement;
            particle.x += (dx / distance) * force;
            particle.y += (dy / distance) * force;
            if (!this.restrained) {
              particle.vx += (dx / distance) * force * 0.035;
              particle.vy += (dy / distance) * force * 0.035;
            }
          }
        }

        particle.x += particle.vx * movement;
        particle.y += particle.vy * movement;
        if (particle.x < -4) particle.x = width + 4;
        else if (particle.x > width + 4) particle.x = -4;
        if (particle.y < -4) particle.y = height + 4;
        else if (particle.y > height + 4) particle.y = -4;
      }
    });

    if (!this.restrained) {
      const linkDistanceSquared = linkDistance * linkDistance;
      for (let index = 0; index < this.particles.length; index += 1) {
        const particle = this.particles[index];
        for (
          let otherIndex = index + 1;
          otherIndex < this.particles.length;
          otherIndex += 1
        ) {
          const other = this.particles[otherIndex];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared >= linkDistanceSquared) continue;
          const distance = Math.sqrt(distanceSquared);
          this.drawPixelLink(
            particle,
            other,
            distance,
            (1 - distance / linkDistance) * linkOpacity,
            pulsing,
          );
        }
      }
    }

    this.particles.forEach((particle) => {
      if (this.restrained) {
        context.beginPath();
        context.arc(
          particle.x,
          particle.y,
          particle.size * (pulsing ? 0.58 : 0.5),
          0,
          Math.PI * 2,
        );
        context.fillStyle = this.palette.blue;
        context.globalAlpha = particle.opacity * (pulsing ? 1.2 : 1);
        context.fill();
        return;
      }
      const size = Math.round(particle.size * (pulsing ? 1.35 : 1));
      const x = Math.round(particle.x - size / 2);
      const y = Math.round(particle.y - size / 2);
      context.fillStyle = this.palette.blue;
      context.globalAlpha = pulsing
        ? Math.min(0.72, particle.opacity * 1.35)
        : particle.opacity;
      if (particle.hollow && size >= 3) {
        context.fillRect(x, y, size, 1);
        context.fillRect(x, y + size - 1, size, 1);
        context.fillRect(x, y + 1, 1, Math.max(1, size - 2));
        context.fillRect(x + size - 1, y + 1, 1, Math.max(1, size - 2));
      } else {
        context.fillRect(x, y, Math.max(2, size), Math.max(2, size));
      }
    });

    context.globalAlpha = 1;
  }
}
