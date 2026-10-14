import {
  currentTheme,
  root,
  writeStorage,
  type GameBridge,
  type ParticleController,
  type Theme,
} from "./core";
import { hydratePixelIcons } from "./icons";

export const initTheme = (
  particles: ParticleController,
  game: GameBridge,
): void => {
  const toggles = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".theme-toggle"),
  );
  const favicon = document.querySelector<HTMLLinkElement>("#favicon");
  const appleIcon =
    document.querySelector<HTMLLinkElement>("#apple-touch-icon");

  const applyTheme = (theme: Theme, persist = false): void => {
    root.dataset.theme = theme;
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    toggles.forEach((toggle) => {
      toggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
      const icon = toggle.querySelector<HTMLElement>("[data-icon]");
      if (icon) icon.dataset.icon = theme === "dark" ? "cloud-sun" : "moon";
    });
    hydratePixelIcons();
    if (favicon) {
      favicon.href = `/assets/Images/favicons/favicon-${theme}.png?v=wordmark`;
    }
    if (appleIcon) {
      appleIcon.href =
        `/assets/Images/favicons/apple-touch-icon-${theme}.png?v=wordmark`;
    }
    particles.setTheme(theme);
    game.setTheme(theme);
    window.dispatchEvent(
      new CustomEvent<Theme>("portfolio:theme", { detail: theme }),
    );
    if (persist) writeStorage(localStorage, "theme", theme);
  };

  applyTheme(currentTheme());
  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
    });
  });
};
