import { mobileLayout, reducedMotion } from "../core";

const clamp = (value: number, minimum = 0, maximum = 1): number =>
  Math.min(maximum, Math.max(minimum, value));

export const initPageMotion = (): void => {
  const hero = document.querySelector<HTMLElement>("#home");
  const portrait = document.querySelector<HTMLElement>(
    ".portrait-blueprint-frame",
  );
  const shelf = document.querySelector<HTMLElement>(".experience-shelf");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let frame = 0;
  let depthDirty = true;
  let selectionDirty = true;

  const selection = shelf ? document.createElement("div") : null;
  if (selection && shelf) {
    selection.className = "shelf-selection";
    selection.setAttribute("aria-hidden", "true");
    shelf.prepend(selection);
  }

  const updateDepth = (): void => {
    const scrollRange =
      document.documentElement.scrollHeight - window.innerHeight;
    const readingProgress = scrollRange > 0
      ? clamp(window.scrollY / scrollRange)
      : 0;
    document.documentElement.style.setProperty(
      "--page-progress",
      readingProgress.toFixed(4),
    );
    const enabled = finePointer.matches && !reducedMotion.matches;
    if (hero) {
      const rect = hero.getBoundingClientRect();
      const progress = enabled ? clamp(-rect.top / Math.max(rect.height, 1)) : 0;
      hero.style.setProperty(
        "--name-drift-first",
        `${(progress * 8).toFixed(2)}px`,
      );
      hero.style.setProperty(
        "--name-drift-last",
        `${(progress * 12).toFixed(2)}px`,
      );
    }
    if (portrait) {
      const rect = portrait.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = enabled
        ? clamp(
            (viewportHeight / 2 - rect.top - rect.height / 2) /
              Math.max((viewportHeight + rect.height) / 2, 1),
            -1,
            1,
          )
        : 0;
      portrait.style.setProperty(
        "--portrait-drift",
        `${(progress * 8).toFixed(2)}px`,
      );
    }
  };

  const updateSelection = (): void => {
    if (!selection || !shelf) return;
    const active = shelf.querySelector<HTMLElement>(".shelf-item.active");
    selection.hidden = mobileLayout.matches || !active;
    if (selection.hidden || !active) return;
    const shelfRect = shelf.getBoundingClientRect();
    const buttonRect = active.getBoundingClientRect();
    const x =
      buttonRect.left - shelfRect.left - shelf.clientLeft + shelf.scrollLeft;
    const y =
      buttonRect.top - shelfRect.top - shelf.clientTop + shelf.scrollTop;
    selection.style.width = `${buttonRect.width.toFixed(2)}px`;
    selection.style.height = `${buttonRect.height.toFixed(2)}px`;
    selection.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
  };

  const flush = (): void => {
    frame = 0;
    if (depthDirty) updateDepth();
    if (selectionDirty) updateSelection();
    depthDirty = false;
    selectionDirty = false;
  };

  const schedule = (depth = true, highlight = true): void => {
    depthDirty ||= depth;
    selectionDirty ||= highlight;
    if (!frame) frame = window.requestAnimationFrame(flush);
  };

  window.addEventListener("scroll", () => schedule(true, false), {
    passive: true,
  });
  window.addEventListener("resize", () => schedule());
  window.addEventListener("portfolio:experience-change", () =>
    schedule(false, true),
  );
  finePointer.addEventListener("change", () => schedule(true, false));
  reducedMotion.addEventListener("change", () => schedule());
  mobileLayout.addEventListener("change", () => schedule());

  if (shelf) {
    const resizeObserver = new ResizeObserver(() => schedule(false, true));
    resizeObserver.observe(shelf);
    shelf.querySelectorAll<HTMLElement>(".shelf-item").forEach((button) => {
      resizeObserver.observe(button);
    });
  }
  if (hero || portrait) {
    const resizeObserver = new ResizeObserver(() => schedule(true, false));
    if (hero) resizeObserver.observe(hero);
    if (portrait) resizeObserver.observe(portrait);
  }
  document.fonts?.ready.then(() => schedule());
  schedule();
};
