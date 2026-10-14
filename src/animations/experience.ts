import { reducedMotion } from "../core";
import {
  experienceScenes,
  type ExperienceSceneName,
} from "../data/experience";
import {
  drawPanel,
  readScenePalette,
  SCENE_FPS,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from "./experience-primitives";
import { experienceSceneSpecs } from "./experience-scenes";

interface CanvasState {
  context: CanvasRenderingContext2D;
  phaseElements: HTMLElement[];
  scene: ExperienceSceneName;
  frame: number;
  startedAt: number | null;
  activePhase: number;
}

const FRAME_MS = 1000 / SCENE_FPS;

const createCaption = (
  canvas: HTMLCanvasElement,
  phases: readonly string[],
): HTMLElement[] => {
  const caption = document.createElement("div");
  caption.className = "experience-scene-caption";
  caption.setAttribute("aria-hidden", "true");
  const elements = phases.map((phase) => {
    const element = document.createElement("span");
    element.textContent = phase;
    caption.append(element);
    return element;
  });
  canvas.insertAdjacentElement("afterend", caption);
  return elements;
};

export const initExperienceScenes = (): void => {
  const canvases = Array.from(
    document.querySelectorAll<HTMLCanvasElement>(".experience-canvas"),
  );
  if (!canvases.length) return;

  const definitions = new Map(
    experienceScenes.map((definition) => [definition.name, definition]),
  );
  const states = new Map<HTMLCanvasElement, CanvasState>();
  const visible = new Set<HTMLCanvasElement>();
  let animation = 0;
  let colors = readScenePalette();

  const drawCanvas = (canvas: HTMLCanvasElement): void => {
    const state = states.get(canvas);
    if (!state) return;
    const spec = experienceSceneSpecs[state.scene];
    const frame = reducedMotion.matches ? spec.staticFrame : state.frame;
    state.context.setTransform(
      canvas.width / SCENE_WIDTH,
      0,
      0,
      canvas.height / SCENE_HEIGHT,
      0,
      0,
    );
    state.context.imageSmoothingEnabled = true;
    drawPanel(state.context, colors);
    spec.render(state.context, frame, colors);
    const activePhase = spec.phaseAt(frame);
    if (activePhase !== state.activePhase) {
      state.phaseElements.forEach((element, index) => {
        element.classList.toggle("active", index === activePhase);
      });
      state.activePhase = activePhase;
    }
  };

  const fitCanvas = (canvas: HTMLCanvasElement): void => {
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const displayWidth = canvas.getBoundingClientRect().width || SCENE_WIDTH * 2;
    const width = Math.max(SCENE_WIDTH, Math.round(displayWidth * ratio));
    const height = Math.round((width * SCENE_HEIGHT) / SCENE_WIDTH);
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
  };

  canvases.forEach((canvas) => {
    const scene = canvas.dataset.scene as ExperienceSceneName;
    const definition = definitions.get(scene);
    const context = canvas.getContext("2d");
    const spec = experienceSceneSpecs[scene];
    if (!definition || !context || !spec) return;
    canvas.setAttribute("aria-label", definition.label);
    states.set(canvas, {
      context,
      phaseElements: createCaption(canvas, definition.phases),
      scene,
      frame: canvas.closest(".dossier-card.active") ? 0 : spec.staticFrame,
      startedAt: null,
      activePhase: -2,
    });
    fitCanvas(canvas);
    drawCanvas(canvas);
  });

  const redrawAll = (): void => {
    states.forEach((_state, canvas) => drawCanvas(canvas));
  };

  const shouldAnimate = (canvas: HTMLCanvasElement): boolean => {
    const state = states.get(canvas);
    return Boolean(
      state &&
        canvas.closest(".dossier-card.active") &&
        state.frame < experienceSceneSpecs[state.scene].staticFrame,
    );
  };

  const render = (time: number): void => {
    animation = 0;
    visible.forEach((canvas) => {
      const state = states.get(canvas);
      if (!state || !shouldAnimate(canvas)) return;
      if (state.startedAt === null) {
        state.startedAt = time - state.frame * FRAME_MS;
      }
      state.frame = Math.min(
        experienceSceneSpecs[state.scene].staticFrame,
        (time - state.startedAt) / FRAME_MS,
      );
      drawCanvas(canvas);
    });
    if ([...visible].some(shouldAnimate)) {
      animation = window.requestAnimationFrame(render);
    }
  };

  const startAnimation = (): void => {
    if (animation || reducedMotion.matches || document.hidden) return;
    if ([...visible].some(shouldAnimate)) {
      animation = window.requestAnimationFrame(render);
    }
  };

  const stopAnimation = (): void => {
    if (animation) window.cancelAnimationFrame(animation);
    animation = 0;
    states.forEach((state) => {
      state.startedAt = null;
    });
  };

  const restart = (): void => {
    states.forEach((state, canvas) => {
      if (!canvas.closest(".dossier-card.active")) return;
      state.frame = 0;
      state.startedAt = null;
      drawCanvas(canvas);
    });
    startAnimation();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const canvas = entry.target as HTMLCanvasElement;
        const state = states.get(canvas);
        if (!state) return;
        if (entry.isIntersecting) {
          visible.add(canvas);
        } else {
          visible.delete(canvas);
          state.startedAt = null;
        }
      });
      if (!visible.size) stopAnimation();
      else startAnimation();
    },
    { threshold: 0.05 },
  );
  states.forEach((_state, canvas) => observer.observe(canvas));

  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const canvas = entry.target as HTMLCanvasElement;
      fitCanvas(canvas);
      drawCanvas(canvas);
    });
  });
  states.forEach((_state, canvas) => resizeObserver.observe(canvas));

  window.addEventListener("portfolio:theme", () => {
    colors = readScenePalette();
    redrawAll();
  });
  window.addEventListener("portfolio:experience-change", restart);
  reducedMotion.addEventListener("change", () => {
    stopAnimation();
    if (reducedMotion.matches) {
      states.forEach((state) => {
        state.frame = experienceSceneSpecs[state.scene].staticFrame;
      });
    }
    redrawAll();
    startAnimation();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimation();
    else startAnimation();
  });
};
