export type Theme = "dark" | "light";

export interface ParticleController {
  pause(paused: boolean): void;
  pulse(): void;
  setTheme(theme: Theme): void;
}

export interface GameBridge {
  load(): void;
  pause(paused: boolean): void;
  setTheme(theme: Theme): void;
  unload(): void;
}

export interface ThemePalette {
  background: string;
  blue: string;
  faint: string;
  grid: string;
  ink: string;
  muted: string;
  surface: string;
}

declare global {
  interface Window {
    __portfolioUnlockLoader?: () => void;
  }
}

export const root = document.documentElement;
export const body = document.body;
export const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
export const mobileLayout = window.matchMedia("(max-width: 900px)");

export const readStorage = (store: Storage, key: string): string | null => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (
  store: Storage,
  key: string,
  value: string,
): void => {
  try {
    store.setItem(key, value);
  } catch {
    return;
  }
};

export const getFocusable = (container: ParentNode): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hidden && !element.closest("[inert]"));

export const currentTheme = (): Theme =>
  root.dataset.theme === "light" ? "light" : "dark";

export const readThemePalette = (): ThemePalette => {
  const styles = getComputedStyle(root);
  const token = (name: string): string =>
    styles.getPropertyValue(name).trim();
  return {
    background: token("--bg"),
    surface: token("--surface"),
    ink: token("--text"),
    muted: token("--muted"),
    blue: token("--blue"),
    faint: token("--canvas-faint"),
    grid: token("--canvas-grid"),
  };
};
