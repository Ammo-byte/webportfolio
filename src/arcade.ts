import {
  body,
  currentTheme,
  mobileLayout,
  reducedMotion,
  writeStorage,
  type GameBridge,
  type ParticleController,
} from "./core";

export const initArcade = (
  particles: ParticleController,
  game: GameBridge,
): void => {
  const dialog = document.querySelector<HTMLDialogElement>("#arcade-modal");
  const logo = document.querySelector<HTMLAnchorElement>(".logo");
  const letterTrigger =
    document.querySelector<HTMLElement>(".arcade-letter-trigger");
  const clue = document.querySelector<HTMLElement>("#arcade-clue");
  const closeButton =
    dialog?.querySelector<HTMLButtonElement>("[data-arcade-close]");
  if (!dialog || !logo || !letterTrigger) return;

  let keyCount = 0;
  let keyTimer = 0;
  let tapCount = 0;
  let tapTimer = 0;

  const signal = (count: number, target: HTMLElement = logo): void => {
    target.classList.remove("signal-step");
    void target.offsetWidth;
    target.classList.add("signal-step");
    particles.pulse();
    clue?.setAttribute("data-signal", `${count}/3`);
  };
  const close = (): void => {
    if (!dialog.open) return;
    game.unload();
    dialog.close();
    body.classList.remove("arcade-open");
    particles.pause(false);
    logo.focus();
  };
  const open = (): void => {
    writeStorage(sessionStorage, "portfolioArcadeUnlocked", "1");
    game.load();
    dialog.showModal();
    body.classList.add("arcade-open");
    particles.pause(true);
    game.setTheme(currentTheme());
    window.setTimeout(() => game.pause(false), 80);
    window.setTimeout(() => closeButton?.focus(), 140);
  };
  const unlock = (): void => {
    keyCount = 0;
    tapCount = 0;
    window.clearTimeout(keyTimer);
    window.clearTimeout(tapTimer);
    window.setTimeout(open, reducedMotion.matches ? 0 : 240);
  };

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing =
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Escape" && dialog.open) {
      event.preventDefault();
      close();
      return;
    }
    if (event.key.toLowerCase() !== "a" || event.repeat) return;
    keyCount += 1;
    signal(keyCount);
    window.clearTimeout(keyTimer);
    keyTimer = window.setTimeout(() => {
      keyCount = 0;
      clue?.removeAttribute("data-signal");
    }, 1600);
    if (keyCount === 3) unlock();
  });
  letterTrigger.addEventListener("click", (event) => {
    if (!mobileLayout.matches) return;
    event.preventDefault();
    tapCount += 1;
    signal(tapCount, letterTrigger);
    window.clearTimeout(tapTimer);
    tapTimer = window.setTimeout(() => {
      tapCount = 0;
      clue?.removeAttribute("data-signal");
    }, 5000);
    if (tapCount === 3) unlock();
  });
  closeButton?.addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  document.addEventListener("visibilitychange", () => {
    game.pause(document.hidden || !dialog.open);
  });
};
