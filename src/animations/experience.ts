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
  type ScenePalette,
} from "./experience-primitives";
import { experienceSceneSpecs } from "./experience-scenes";

interface CanvasState {
  context: CanvasRenderingContext2D;
  phaseElements: HTMLElement[];
  scene: ExperienceSceneName;
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

const updateCaption = (
  elements: HTMLElement[],
  activePhase: number,
): void => {
  elements.forEach((element, index) => {
    element.classList.toggle("active", index === activePhase);
  });
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
  let previousFrame = -1;
  let currentFrame = 0;
  let cycleStartedAt = performance.now();

  const drawCanvas = (
    canvas: HTMLCanvasElement,
    frame: number,
    colors: ScenePalette,
  ): void => {
    const state = states.get(canvas);
    if (!state) return;
    const spec = experienceSceneSpecs[state.scene];
    const localFrame =
      ((frame % spec.durationFrames) + spec.durationFrames) %
      spec.durationFrames;
    state.context.imageSmoothingEnabled = false;
    drawPanel(state.context, colors);
    spec.render(state.context, localFrame, colors);
    updateCaption(state.phaseElements, spec.phaseAt(localFrame));
  };

  canvases.forEach((canvas) => {
    const scene = canvas.dataset.scene as ExperienceSceneName;
    const definition = definitions.get(scene);
    const context = canvas.getContext("2d");
    if (!definition || !context || !experienceSceneSpecs[scene]) return;
    canvas.width = SCENE_WIDTH;
    canvas.height = SCENE_HEIGHT;
    canvas.setAttribute("aria-label", definition.label);
    states.set(canvas, {
      context,
      phaseElements: createCaption(canvas, definition.phases),
      scene,
    });
  });

  const redrawAll = (): void => {
    const colors = readScenePalette();
    states.forEach((state, canvas) => {
      const spec = experienceSceneSpecs[state.scene];
      drawCanvas(
        canvas,
        reducedMotion.matches ? spec.staticFrame : currentFrame,
        colors,
      );
    });
  };

  if (reducedMotion.matches) {
    redrawAll();
    window.addEventListener("portfolio:theme", redrawAll);
    return;
  }

  redrawAll();

  const render = (time: number): void => {
    const frame = Math.floor((time - cycleStartedAt) / FRAME_MS);
    currentFrame = frame;
    if (frame !== previousFrame) {
      const colors = readScenePalette();
      visible.forEach((canvas) => drawCanvas(canvas, frame, colors));
      previousFrame = frame;
    }
    animation = window.requestAnimationFrame(render);
  };

  const restart = (): void => {
    cycleStartedAt = performance.now();
    currentFrame = 0;
    previousFrame = -1;
    const colors = readScenePalette();
    document
      .querySelectorAll<HTMLCanvasElement>(
        ".dossier-card.active .experience-canvas",
      )
      .forEach((canvas) => drawCanvas(canvas, 0, colors));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      let entered = false;
      entries.forEach((entry) => {
        const canvas = entry.target as HTMLCanvasElement;
        if (entry.isIntersecting) {
          if (!visible.has(canvas)) entered = true;
          visible.add(canvas);
        } else {
          visible.delete(canvas);
        }
      });
      if (entered) restart();
      if (visible.size && !document.hidden && !animation) {
        animation = window.requestAnimationFrame(render);
      }
      if (!visible.size && animation) {
        window.cancelAnimationFrame(animation);
        animation = 0;
      }
    },
    { rootMargin: "0px", threshold: 0.05 },
  );

  canvases.forEach((canvas) => observer.observe(canvas));
  window.addEventListener("portfolio:theme", redrawAll);
  window.addEventListener("portfolio:experience-change", restart);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && animation) {
      window.cancelAnimationFrame(animation);
      animation = 0;
      return;
    }
    if (visible.size && !animation) {
      restart();
      animation = window.requestAnimationFrame(render);
    }
  });
};
